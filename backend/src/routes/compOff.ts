import express from 'express';
import { compOffService, WorkLogData, CompOffRequestData } from '../services/compOffService';
import { authenticate } from '../middleware/auth';
import { body, param, validationResult } from 'express-validator';
import { logger } from '../utils/logger';
import { prisma } from '../index';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     WorkLogData:
 *       type: object
 *       required:
 *         - workDate
 *         - hoursWorked
 *         - workType
 *         - workDescription
 *       properties:
 *         workDate:
 *           type: string
 *           format: date
 *         hoursWorked:
 *           type: number
 *           minimum: 1
 *           maximum: 12
 *         workType:
 *           type: string
 *           enum: [WEEKEND, HOLIDAY, EXTENDED_HOURS]
 *         workDescription:
 *           type: string
 *           minLength: 20
 *           maxLength: 500
 *         projectDetails:
 *           type: string
 *           maxLength: 200
 *     CompOffRequestData:
 *       type: object
 *       required:
 *         - workLogId
 *         - hoursToRedeem
 *         - startDate
 *         - endDate
 *         - reason
 *       properties:
 *         workLogId:
 *           type: string
 *         hoursToRedeem:
 *           type: number
 *           minimum: 5
 *           maximum: 12
 *         startDate:
 *           type: string
 *           format: date
 *         endDate:
 *           type: string
 *           format: date
 *         reason:
 *           type: string
 *           minLength: 10
 *           maxLength: 200
 *         isHalfDay:
 *           type: boolean
 */

// Validation schemas
const workLogValidation = [
  body('workDate')
    .isISO8601()
    .withMessage('Work date must be a valid ISO date')
    .custom((value) => {
      const workDate = new Date(value);
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      if (workDate > today) {
        throw new Error('Work date cannot be in the future');
      }
      if (workDate < thirtyDaysAgo) {
        throw new Error('Work date cannot be more than 30 days old');
      }
      return true;
    }),
  body('hoursWorked')
    .isFloat({ min: 1, max: 12 })
    .withMessage('Hours worked must be between 1 and 12'),
  body('workType')
    .isIn(['WEEKEND', 'HOLIDAY', 'EXTENDED_HOURS'])
    .withMessage('Invalid work type'),
  body('workDescription')
    .trim()
    .isLength({ min: 20, max: 500 })
    .withMessage('Work description must be between 20 and 500 characters'),
  body('projectDetails')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Project details cannot exceed 200 characters')
];

const compOffRequestValidation = [
  body('workLogId')
    .isUUID()
    .withMessage('Invalid work log ID'),
  body('hoursToRedeem')
    .isFloat({ min: 5, max: 12 })
    .withMessage('Hours to redeem must be between 5 and 12'),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid ISO date')
    .custom((value) => {
      const startDate = new Date(value);
      const today = new Date();
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
      if (endDate < startDate) {
        throw new Error('End date cannot be before start date');
      }
      return true;
    }),
  body('reason')
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('Reason must be between 10 and 200 characters'),
  body('isHalfDay')
    .optional()
    .isBoolean()
    .withMessage('isHalfDay must be a boolean')
];

/**
 * @swagger
 * /api/v1/comp-off/policy:
 *   get:
 *     summary: Get comp off policy configuration
 *     tags: [Comp Off]
 *     responses:
 *       200:
 *         description: Comp off policy retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/policy', authenticate, async (req, res) => {
  try {
    const policy = compOffService.getCompOffPolicy();

    res.status(200).json({
      success: true,
      data: {
        policy,
        description: 'GLF Comp Off Policy Configuration'
      },
      message: 'Comp off policy retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting comp off policy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve comp off policy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/v1/comp-off/work-log:
 *   post:
 *     summary: Log weekend/holiday work for comp off eligibility
 *     tags: [Comp Off]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkLogData'
 *     responses:
 *       201:
 *         description: Work logged successfully
 *       400:
 *         description: Validation errors
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/work-log', authenticate, ...workLogValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const employeeId = req.user?.id;
    if (!employeeId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const workLogData: WorkLogData = {
      employeeId,
      workDate: new Date(req.body.workDate),
      hoursWorked: req.body.hoursWorked,
      workType: req.body.workType,
      workDescription: req.body.workDescription,
      projectDetails: req.body.projectDetails
    };

    const result = await compOffService.logWork(workLogData);

    if (result.success) {
      res.status(201).json({
        success: true,
        data: {
          workLogId: result.workLogId,
          compOffEarned: result.compOffEarned
        },
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    logger.error('Error logging work:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log work',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/v1/comp-off/work-log/{id}/verify:
 *   put:
 *     summary: Manager verification of work log
 *     tags: [Comp Off]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isApproved
 *             properties:
 *               isApproved:
 *                 type: boolean
 *               comments:
 *                 type: string
 *                 maxLength: 200
 *     responses:
 *       200:
 *         description: Work log verified successfully
 *       400:
 *         description: Validation errors
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.put('/work-log/:id/verify', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved, comments } = req.body;
    const managerId = req.user?.id;

    if (!managerId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (typeof isApproved !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isApproved must be a boolean'
      });
    }

    const result = await compOffService.verifyWorkLog(id, managerId, isApproved, comments);

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    logger.error('Error verifying work log:', error);

    if (error instanceof Error && error.message.includes('authority')) {
      res.status(403).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to verify work log',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

/**
 * @swagger
 * /api/v1/comp-off/apply:
 *   post:
 *     summary: Apply for comp off leave
 *     tags: [Comp Off]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CompOffRequestData'
 *     responses:
 *       201:
 *         description: Comp off application submitted successfully
 *       400:
 *         description: Validation errors
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/apply', authenticate, ...compOffRequestValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const employeeId = req.user?.id;
    if (!employeeId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const requestData: CompOffRequestData = {
      employeeId,
      workLogId: req.body.workLogId,
      hoursToRedeem: req.body.hoursToRedeem,
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
      reason: req.body.reason,
      isHalfDay: req.body.isHalfDay
    };

    const result = await compOffService.applyForCompOff(requestData);

    if (result.success) {
      res.status(201).json({
        success: true,
        data: {
          requestId: result.requestId,
          validationResult: result.validationResult
        },
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        data: {
          validationResult: result.validationResult
        },
        message: result.message
      });
    }
  } catch (error) {
    logger.error('Error applying for comp off:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to apply for comp off',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/v1/comp-off/eligibility:
 *   get:
 *     summary: Get comp off eligibility for current user
 *     tags: [Comp Off]
 *     responses:
 *       200:
 *         description: Eligibility information retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/eligibility', authenticate, async (req, res) => {
  try {
    const employeeId = req.user?.id;
    if (!employeeId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const eligibility = await compOffService.getCompOffEligibility(employeeId);

    res.status(200).json({
      success: true,
      data: eligibility,
      message: 'Comp off eligibility retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting comp off eligibility:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve comp off eligibility',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/v1/comp-off/work-logs:
 *   get:
 *     summary: Get work logs for current user
 *     tags: [Comp Off]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, VERIFIED, REJECTED, CONSUMED]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *     responses:
 *       200:
 *         description: Work logs retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/work-logs', authenticate, async (req, res) => {
  try {
    const employeeId = req.user?.id;
    if (!employeeId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { status, limit = 20, offset = 0 } = req.query;

    const where: any = { employeeId };
    if (status) {
      where.status = status;
    }

    const workLogs = await prisma.compOffWorkLog.findMany({
      where,
      include: {
        verifier: {
          select: {
            firstName: true,
            lastName: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset)
    });

    const total = await prisma.compOffWorkLog.count({ where });

    res.status(200).json({
      success: true,
      data: {
        workLogs,
        pagination: {
          total,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: Number(offset) + Number(limit) < total
        }
      },
      message: 'Work logs retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting work logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve work logs',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/v1/comp-off/requests:
 *   get:
 *     summary: Get comp off requests for current user
 *     tags: [Comp Off]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, EXPIRED]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *     responses:
 *       200:
 *         description: Comp off requests retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/requests', authenticate, async (req, res) => {
  try {
    const employeeId = req.user?.id;
    if (!employeeId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { status, limit = 20, offset = 0 } = req.query;

    const where: any = { employeeId };
    if (status) {
      where.status = status;
    }

    const requests = await prisma.compOffRequest.findMany({
      where,
      include: {
        workLog: {
          select: {
            workDate: true,
            hoursWorked: true,
            workType: true,
            workDescription: true
          }
        },
        approvals: {
          include: {
            approver: {
              select: {
                firstName: true,
                lastName: true,
                role: true
              }
            }
          },
          orderBy: { level: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset)
    });

    const total = await prisma.compOffRequest.count({ where });

    res.status(200).json({
      success: true,
      data: {
        requests,
        pagination: {
          total,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: Number(offset) + Number(limit) < total
        }
      },
      message: 'Comp off requests retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting comp off requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve comp off requests',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/v1/comp-off/balance:
 *   get:
 *     summary: Get comp off balance for current user
 *     tags: [Comp Off]
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *           minimum: 2020
 *           maximum: 2030
 *     responses:
 *       200:
 *         description: Comp off balance retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/balance', authenticate, async (req, res) => {
  try {
    const employeeId = req.user?.id;
    if (!employeeId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();

    const balance = await prisma.compOffBalance.findUnique({
      where: {
        employeeId_year: {
          employeeId,
          year
        }
      }
    });

    if (!balance) {
      // Check if this is a mock user (not in database)
      const mockUserIds = ['1', '2'];
      if (mockUserIds.includes(employeeId)) {
        // Return mock balance for demo users
        const mockBalance = {
          id: `mock-${employeeId}`,
          employeeId,
          year,
          totalEarned: 8,
          totalUsed: 0,
          available: 8,
          expired: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        return res.status(200).json({
          success: true,
          data: mockBalance,
          message: 'Comp off balance retrieved (demo data)'
        });
      }

      // Create initial balance record for real database users
      const newBalance = await prisma.compOffBalance.create({
        data: {
          employeeId,
          year,
          totalEarned: 0,
          totalUsed: 0,
          available: 0,
          expired: 0
        }
      });

      return res.status(200).json({
        success: true,
        data: newBalance,
        message: 'Comp off balance initialized'
      });
    }

    res.status(200).json({
      success: true,
      data: balance,
      message: 'Comp off balance retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting comp off balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve comp off balance',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/v1/comp-off/process-expiration:
 *   post:
 *     summary: Process comp off expiration (Admin only)
 *     tags: [Comp Off]
 *     responses:
 *       200:
 *         description: Expiration processed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.post('/process-expiration', authenticate, async (req, res) => {
  try {
    const userRole = req.user?.role;
    if (!['HR_ADMIN', 'IT_ADMIN'].includes(userRole || '')) {
      return res.status(403).json({
        success: false,
        message: 'Only HR and IT admins can process comp off expiration'
      });
    }

    const result = await compOffService.processCompOffExpiration();

    res.status(200).json({
      success: true,
      data: result,
      message: 'Comp off expiration processed successfully'
    });
  } catch (error) {
    logger.error('Error processing comp off expiration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process comp off expiration',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;