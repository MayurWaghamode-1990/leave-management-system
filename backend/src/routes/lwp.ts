import express from 'express';
import { LWPService } from '../services/lwpService';
import { auth } from '../middleware/auth';
// import { validate } from '../middleware/validation';
import { body, param, query, validationResult } from 'express-validator';
import { UserRole } from '../types/enums';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';

const router = express.Router();

// Validation schemas
const lwpApplicationSchema = [
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid ISO date')
    .custom((value) => {
      const startDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (startDate < today) {
        throw new Error('Start date cannot be in the past');
      }
      return true;
    }),
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid ISO date')
    .custom((value, { req }) => {
      const endDate = new Date(value);
      const startDate = new Date(req.body.startDate);

      if (endDate <= startDate) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('reason')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be between 10 and 500 characters'),
  body('urgencyLevel')
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    .withMessage('Urgency level must be LOW, MEDIUM, HIGH, or CRITICAL'),
  body('additionalDetails')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Additional details cannot exceed 1000 characters'),
  body('expectedReturnDate')
    .optional()
    .isISO8601()
    .withMessage('Expected return date must be a valid ISO date'),
  body('contactInformation')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Contact information cannot exceed 200 characters'),
  body('emergencyContactName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Emergency contact name cannot exceed 100 characters'),
  body('emergencyContactPhone')
    .optional()
    .trim()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Emergency contact phone must be a valid phone number'),
  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array')
];

const lwpApprovalSchema = [
  param('id').isUUID().withMessage('Invalid leave request ID'),
  body('decision')
    .isIn(['APPROVED', 'REJECTED'])
    .withMessage('Decision must be APPROVED or REJECTED'),
  body('comments')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comments cannot exceed 500 characters'),
  body('context')
    .optional()
    .isObject()
    .withMessage('Context must be an object')
];

/**
 * @route POST /api/lwp/apply
 * @desc Apply for Leave Without Pay
 * @access Private (Employee)
 */
router.post('/apply', auth, ...lwpApplicationSchema, async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  try {
    const employeeId = req.user?.id;

    if (!employeeId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const lwpData = {
      employeeId,
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
      reason: req.body.reason,
      urgencyLevel: req.body.urgencyLevel,
      additionalDetails: req.body.additionalDetails,
      expectedReturnDate: req.body.expectedReturnDate ? new Date(req.body.expectedReturnDate) : undefined,
      contactInformation: req.body.contactInformation,
      emergencyContactName: req.body.emergencyContactName,
      emergencyContactPhone: req.body.emergencyContactPhone,
      attachments: req.body.attachments
    };

    const leaveRequest = await LWPService.applyForLWP(lwpData);

    res.status(201).json({
      success: true,
      message: 'LWP application submitted successfully',
      data: {
        leaveRequestId: leaveRequest.id,
        status: leaveRequest.status,
        totalDays: leaveRequest.totalDays
      }
    });
  } catch (error) {
    logger.error('Error in LWP application:', error);

    const message = error instanceof Error ? error.message : 'Failed to process LWP application';
    const statusCode = error instanceof Error && error.message.includes('Employee') ? 404 :
                      error instanceof Error && error.message.includes('overlap') ? 409 :
                      error instanceof Error && error.message.includes('duration') ? 400 : 500;

    res.status(statusCode).json({
      success: false,
      message
    });
  }
});

/**
 * @route GET /api/lwp/:id
 * @desc Get LWP application details
 * @access Private (Employee, Manager, HR)
 */
router.get('/:id', auth, param('id').isUUID(), async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const lwpDetails = await LWPService.getLWPDetails(id);

    // Check if user has permission to view this LWP
    const canView = lwpDetails.employeeId === userId ||
                   req.user?.role === UserRole.HR_ADMIN ||
                   req.user?.role === UserRole.IT_ADMIN ||
                   lwpDetails.employee.reportingManagerId === userId;

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own LWP applications or those you can approve.'
      });
    }

    res.json({
      success: true,
      data: lwpDetails
    });
  } catch (error) {
    logger.error('Error fetching LWP details:', error);

    const message = error instanceof Error ? error.message : 'Failed to fetch LWP details';
    const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      message
    });
  }
});

/**
 * @route PUT /api/lwp/:id/approve
 * @desc Approve or reject LWP application
 * @access Private (Manager, HR, Admin)
 */
router.put('/:id/approve', auth, ...lwpApprovalSchema, async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  try {
    const { id } = req.params;
    const { decision, comments, context } = req.body;
    const approverId = req.user?.id;

    if (!approverId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Check if user has approval rights
    const hasApprovalRights = [UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.IT_ADMIN].includes(req.user?.role);

    if (!hasApprovalRights) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only managers and admins can approve LWP applications.'
      });
    }

    await LWPService.processLWPApproval(id, approverId, decision, comments, context);

    res.json({
      success: true,
      message: `LWP application ${decision.toLowerCase()} successfully`,
      data: {
        leaveRequestId: id,
        decision,
        processedBy: approverId,
        processedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error processing LWP approval:', error);

    const message = error instanceof Error ? error.message : 'Failed to process LWP approval';
    const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      message
    });
  }
});

/**
 * @route GET /api/lwp/pending
 * @desc Get pending LWP applications for approval
 * @access Private (Manager, HR, Admin)
 */
router.get('/pending', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Check if user has approval rights
    const hasApprovalRights = [UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.IT_ADMIN].includes(userRole);

    if (!hasApprovalRights) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only managers and admins can view pending approvals.'
      });
    }

    // Build query based on user role
    let whereClause: any = {
      leaveType: 'LEAVE_WITHOUT_PAY',
      status: 'PENDING'
    };

    // If manager, only show their team's LWP requests
    if (userRole === UserRole.MANAGER) {
      whereClause.employee = {
        reportingManagerId: userId
      };
    }

    const pendingLWPs = await prisma.leaveRequest.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true,
            department: true
          }
        },
        approvals: {
          where: { approverId: userId },
          select: {
            level: true,
            status: true
          }
        }
      },
      orderBy: {
        appliedDate: 'desc'
      }
    });

    res.json({
      success: true,
      data: pendingLWPs
    });
  } catch (error) {
    logger.error('Error fetching pending LWP applications:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending LWP applications'
    });
  }
});

/**
 * @route GET /api/lwp/my-applications
 * @desc Get user's LWP applications
 * @access Private (Employee)
 */
router.get('/my-applications', auth, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const myLWPs = await prisma.leaveRequest.findMany({
      where: {
        employeeId: userId,
        leaveType: 'LEAVE_WITHOUT_PAY'
      },
      include: {
        approvals: {
          include: {
            approver: {
              select: {
                firstName: true,
                lastName: true,
                role: true
              }
            }
          }
        }
      },
      orderBy: {
        appliedDate: 'desc'
      }
    });

    res.json({
      success: true,
      data: myLWPs
    });
  } catch (error) {
    logger.error('Error fetching user LWP applications:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch LWP applications'
    });
  }
});

export default router;