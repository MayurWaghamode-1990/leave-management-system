import express from 'express';
import { authenticate as auth } from '../middleware/auth';
import { UserRole } from '../types/enums';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';

const router = express.Router();

/**
 * @route POST /api/lwp/apply
 * @desc Apply for Leave Without Pay
 * @access Private (Employee)
 */
router.post('/apply', auth, async (req, res) => {
  try {
    const employeeId = req.user?.id;

    if (!employeeId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const {
      startDate,
      endDate,
      reason,
      urgencyLevel = 'LOW',
      additionalDetails,
      expectedReturnDate,
      contactInformation,
      emergencyContactName,
      emergencyContactPhone
    } = req.body;

    // Basic validation
    if (!startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Start date, end date, and reason are required'
      });
    }

    // Calculate total days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    // Create the leave request
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        employeeId,
        leaveType: 'LEAVE_WITHOUT_PAY',
        startDate: start,
        endDate: end,
        totalDays,
        isHalfDay: false,
        reason,
        status: 'PENDING',
      }
    });

    // Create approval workflow
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: { reportingManagerId: true }
    });

    const approvals = [];

    // Level 1: Direct Manager
    if (employee?.reportingManagerId) {
      approvals.push({
        leaveRequestId: leaveRequest.id,
        approverId: employee.reportingManagerId,
        level: 1,
        status: 'PENDING'
      });
    }

    // Level 2: HR Admin
    const hrAdmin = await prisma.user.findFirst({
      where: { role: 'HR_ADMIN' }
    });

    if (hrAdmin) {
      approvals.push({
        leaveRequestId: leaveRequest.id,
        approverId: hrAdmin.id,
        level: 2,
        status: 'PENDING'
      });
    }

    // Create all approval records
    await prisma.approval.createMany({
      data: approvals
    });

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
    res.status(500).json({
      success: false,
      message: 'Failed to process LWP application'
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
    const hasApprovalRights = ['MANAGER', 'HR_ADMIN', 'IT_ADMIN'].includes(userRole || '');

    if (!hasApprovalRights) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only managers and admins can view pending approvals.'
      });
    }

    // Get pending LWP applications that need this user's approval
    const pendingLWPs = await prisma.leaveRequest.findMany({
      where: {
        leaveType: 'LEAVE_WITHOUT_PAY',
        status: 'PENDING',
        approvals: {
          some: {
            approverId: userId,
            status: 'PENDING'
          }
        }
      },
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
 * @route PUT /api/lwp/:id/approve
 * @desc Approve or reject LWP application
 * @access Private (Manager, HR, Admin)
 */
router.put('/:id/approve', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, comments } = req.body;
    const approverId = req.user?.id;

    if (!approverId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Check if user has approval rights
    const hasApprovalRights = ['MANAGER', 'HR_ADMIN', 'IT_ADMIN'].includes(req.user?.role || '');

    if (!hasApprovalRights) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only managers and admins can approve LWP applications.'
      });
    }

    if (!['APPROVED', 'REJECTED'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'Decision must be APPROVED or REJECTED'
      });
    }

    await prisma.$transaction(async (tx) => {
      // Update the specific approval record
      const approval = await tx.approval.findFirst({
        where: {
          leaveRequestId: id,
          approverId,
          status: 'PENDING'
        }
      });

      if (!approval) {
        throw new Error('Approval record not found or already processed');
      }

      await tx.approval.update({
        where: { id: approval.id },
        data: {
          status: decision,
          comments,
          approvedAt: new Date()
        }
      });

      // Check if all required approvals are complete
      const pendingApprovals = await tx.approval.findMany({
        where: {
          leaveRequestId: id,
          status: 'PENDING'
        }
      });

      // If this was a rejection or all approvals are complete
      if (decision === 'REJECTED' || pendingApprovals.length === 0) {
        const finalStatus = decision === 'REJECTED' ? 'REJECTED' : 'APPROVED';

        await tx.leaveRequest.update({
          where: { id },
          data: { status: finalStatus }
        });
      }
    });

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
  } catch (error: any) {
    logger.error('Error processing LWP approval:', error);
    const message = error.message || 'Failed to process LWP approval';
    res.status(500).json({
      success: false,
      message
    });
  }
});

export default router;