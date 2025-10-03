import { Router, Request, Response } from 'express';
import { emailActionTokenService, TokenValidationResult } from '../services/emailActionTokenService';
import { multiLevelApprovalService } from '../services/multiLevelApprovalService';
import { emailService } from '../services/emailService';
import { logger } from '../utils/logger';
import { prisma } from '../index';

const router = Router();

/**
 * @swagger
 * /api/v1/email-actions/approve:
 *   get:
 *     summary: Process approval action from email
 *     tags: [Email Actions]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Secure approval token from email
 *       - in: query
 *         name: comments
 *         schema:
 *           type: string
 *         description: Optional approval comments
 *     responses:
 *       302:
 *         description: Redirect to confirmation page
 *       400:
 *         description: Invalid or expired token
 */
router.get('/approve', async (req: Request, res: Response) => {
  const { token, comments } = req.query;

  if (!token || typeof token !== 'string') {
    return res.redirect(
      emailActionTokenService.generateConfirmationUrl('APPROVE', false, 'Invalid approval link')
    );
  }

  try {
    // Validate the token
    const validation: TokenValidationResult = await emailActionTokenService.validateActionToken(token);

    if (!validation.valid) {
      let message = validation.error || 'Invalid token';
      if (validation.expired) {
        message = 'This approval link has expired. Please use the dashboard to approve.';
      } else if (validation.alreadyProcessed) {
        message = 'This request has already been processed.';
      }

      return res.redirect(
        emailActionTokenService.generateConfirmationUrl('APPROVE', false, message)
      );
    }

    const { payload } = validation;
    if (!payload || payload.action !== 'APPROVE') {
      return res.redirect(
        emailActionTokenService.generateConfirmationUrl('APPROVE', false, 'Invalid approval token')
      );
    }

    // Log the email action
    await emailActionTokenService.logEmailAction(
      payload.leaveRequestId,
      payload.approverId,
      'TOKEN_USED',
      `Email approval action - Level ${payload.level}`
    );

    // Process the approval
    const result = await multiLevelApprovalService.processApproval(
      payload.leaveRequestId,
      payload.approverId,
      'APPROVE',
      (comments as string) || 'Approved via email'
    );

    if (result.success) {
      // Get employee and approver details for notification
      const leaveRequest = await prisma.leaveRequest.findUnique({
        where: { id: payload.leaveRequestId },
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      const approver = await prisma.user.findUnique({
        where: { id: payload.approverId },
        select: {
          firstName: true,
          lastName: true,
          role: true
        }
      });

      // Send confirmation email to employee if final approval
      if (result.completed && leaveRequest) {
        await emailService.sendLeaveApprovedEmail({
          employeeName: `${leaveRequest.employee.firstName} ${leaveRequest.employee.lastName}`,
          employeeEmail: leaveRequest.employee.email,
          leaveType: leaveRequest.leaveType,
          startDate: leaveRequest.startDate.toISOString().split('T')[0],
          endDate: leaveRequest.endDate.toISOString().split('T')[0],
          totalDays: leaveRequest.totalDays,
          reason: leaveRequest.reason || undefined,
          approvedBy: approver ? `${approver.firstName} ${approver.lastName}` : 'System',
          leaveRequestId: payload.leaveRequestId
        });
      }

      const message = result.completed
        ? 'Leave request approved successfully! The employee has been notified.'
        : `Level ${payload.level} approval successful. Request forwarded to next approval level.`;

      return res.redirect(
        emailActionTokenService.generateConfirmationUrl('APPROVE', true, message)
      );
    } else {
      return res.redirect(
        emailActionTokenService.generateConfirmationUrl('APPROVE', false, result.message)
      );
    }

  } catch (error: any) {
    logger.error('Email approval processing error:', error);
    return res.redirect(
      emailActionTokenService.generateConfirmationUrl('APPROVE', false, 'Processing error occurred')
    );
  }
});

/**
 * @swagger
 * /api/v1/email-actions/reject:
 *   get:
 *     summary: Process rejection action from email
 *     tags: [Email Actions]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Secure rejection token from email
 *       - in: query
 *         name: comments
 *         schema:
 *           type: string
 *         description: Optional rejection comments
 *     responses:
 *       302:
 *         description: Redirect to confirmation page
 *       400:
 *         description: Invalid or expired token
 */
router.get('/reject', async (req: Request, res: Response) => {
  const { token, comments } = req.query;

  if (!token || typeof token !== 'string') {
    return res.redirect(
      emailActionTokenService.generateConfirmationUrl('REJECT', false, 'Invalid rejection link')
    );
  }

  try {
    // Validate the token
    const validation: TokenValidationResult = await emailActionTokenService.validateActionToken(token);

    if (!validation.valid) {
      let message = validation.error || 'Invalid token';
      if (validation.expired) {
        message = 'This rejection link has expired. Please use the dashboard to reject.';
      } else if (validation.alreadyProcessed) {
        message = 'This request has already been processed.';
      }

      return res.redirect(
        emailActionTokenService.generateConfirmationUrl('REJECT', false, message)
      );
    }

    const { payload } = validation;
    if (!payload || payload.action !== 'REJECT') {
      return res.redirect(
        emailActionTokenService.generateConfirmationUrl('REJECT', false, 'Invalid rejection token')
      );
    }

    // Log the email action
    await emailActionTokenService.logEmailAction(
      payload.leaveRequestId,
      payload.approverId,
      'TOKEN_USED',
      `Email rejection action - Level ${payload.level}`
    );

    // Process the rejection
    const result = await multiLevelApprovalService.processApproval(
      payload.leaveRequestId,
      payload.approverId,
      'REJECT',
      (comments as string) || 'Rejected via email'
    );

    if (result.success) {
      // Get employee and approver details for notification
      const leaveRequest = await prisma.leaveRequest.findUnique({
        where: { id: payload.leaveRequestId },
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      const approver = await prisma.user.findUnique({
        where: { id: payload.approverId },
        select: {
          firstName: true,
          lastName: true,
          role: true
        }
      });

      // Send rejection email to employee
      if (leaveRequest) {
        await emailService.sendLeaveRejectedEmail({
          employeeName: `${leaveRequest.employee.firstName} ${leaveRequest.employee.lastName}`,
          employeeEmail: leaveRequest.employee.email,
          leaveType: leaveRequest.leaveType,
          startDate: leaveRequest.startDate.toISOString().split('T')[0],
          endDate: leaveRequest.endDate.toISOString().split('T')[0],
          totalDays: leaveRequest.totalDays,
          reason: leaveRequest.reason || undefined,
          rejectedBy: approver ? `${approver.firstName} ${approver.lastName}` : 'System',
          comments: (comments as string) || 'Rejected via email',
          leaveRequestId: payload.leaveRequestId
        });
      }

      return res.redirect(
        emailActionTokenService.generateConfirmationUrl('REJECT', true, 'Leave request rejected successfully. The employee has been notified.')
      );
    } else {
      return res.redirect(
        emailActionTokenService.generateConfirmationUrl('REJECT', false, result.message)
      );
    }

  } catch (error: any) {
    logger.error('Email rejection processing error:', error);
    return res.redirect(
      emailActionTokenService.generateConfirmationUrl('REJECT', false, 'Processing error occurred')
    );
  }
});

/**
 * @swagger
 * /api/v1/email-actions/validate-token:
 *   post:
 *     summary: Validate an email action token
 *     tags: [Email Actions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: The token to validate
 *             required:
 *               - token
 *     responses:
 *       200:
 *         description: Token validation result
 *       400:
 *         description: Invalid request
 */
router.post('/validate-token', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    const validation = await emailActionTokenService.validateActionToken(token);

    if (!validation.valid) {
      // Return 400 status for invalid tokens
      return res.status(400).json({
        success: false,
        expired: validation.expired,
        alreadyProcessed: validation.alreadyProcessed,
        message: validation.error
      });
    }

    // Token is valid - return success response
    const response: any = {
      success: true,
      tokenInfo: {
        action: validation.payload?.action,
        level: validation.payload?.level,
        leaveRequestId: validation.payload?.leaveRequestId
      }
    };

    res.json(response);
  } catch (error) {
    logger.error('Token validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/v1/email-actions/status:
 *   get:
 *     summary: Get email actions service status
 *     tags: [Email Actions]
 *     responses:
 *       200:
 *         description: Service status information
 */
router.get('/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Email actions service is running',
    features: [
      'Secure token-based approvals',
      'Multi-level approval support',
      'Token expiration (72 hours)',
      'Audit trail logging',
      'Duplicate action prevention'
    ],
    endpoints: {
      approve: '/api/v1/email-actions/approve?token=<token>&comments=<optional>',
      reject: '/api/v1/email-actions/reject?token=<token>&comments=<optional>',
      validate: '/api/v1/email-actions/validate-token',
      status: '/api/v1/email-actions/status'
    }
  });
});

export default router;