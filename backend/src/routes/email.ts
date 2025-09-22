import express, { Response } from 'express';
import { AuthenticatedRequest, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { emailService } from '../services/emailService';
import { testEmailConnection, sendTestEmail } from '../config/email';
import { body, validationResult } from 'express-validator';

const router = express.Router();

/**
 * @swagger
 * /api/v1/email/test-connection:
 *   get:
 *     summary: Test email connection
 *     description: Test SMTP connection configuration
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Connection test result
 */
router.get('/test-connection',
  authorize(['HR_ADMIN', 'IT_ADMIN']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await testEmailConnection();
      res.json({
        success: result.success,
        message: result.message,
        data: result.details
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Connection test failed',
        error: error.message
      });
    }
  })
);

/**
 * @swagger
 * /api/v1/email/test:
 *   post:
 *     summary: Send test email
 *     description: Send a test email to verify email functionality
 *     tags: [Email]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *             properties:
 *               to:
 *                 type: string
 *                 format: email
 *                 description: Recipient email address
 *     responses:
 *       200:
 *         description: Test email sent successfully
 */
router.post('/test',
  authorize(['HR_ADMIN', 'IT_ADMIN']),
  body('to').isEmail().withMessage('Valid email address is required'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { to } = req.body;

    try {
      const result = await sendTestEmail(to);
      res.json({
        success: result.success,
        message: result.message,
        messageId: result.messageId
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  })
);

// Test specific email templates
router.post('/test/:template',
  authorize('HR_ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { template } = req.params;
    const { to } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    try {
      let success = false;
      const mockData = {
        employeeName: 'John Doe',
        employeeEmail: to,
        managerName: 'Jane Manager',
        managerEmail: 'manager@company.com',
        leaveType: 'Annual Leave',
        startDate: '2025-01-15',
        endDate: '2025-01-20',
        totalDays: 5,
        reason: 'Family vacation',
        approvedBy: 'Jane Manager',
        rejectedBy: 'Jane Manager',
        comments: 'Approved for family vacation. Have a great time!',
        submittedDate: '2025-01-01',
        leaveRequestId: 'TEST-123'
      };

      switch (template) {
        case 'leave-approved':
          success = await emailService.sendLeaveApprovedEmail(mockData);
          break;
        case 'leave-rejected':
          success = await emailService.sendLeaveRejectedEmail({
            ...mockData,
            reason: 'Insufficient leave balance for the requested period'
          });
          break;
        case 'leave-request-submitted':
          success = await emailService.sendLeaveRequestSubmittedEmail(mockData);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: `Unknown template: ${template}. Available templates: leave-approved, leave-rejected, leave-request-submitted`
          });
      }

      res.json({
        success,
        message: success
          ? `${template} email sent successfully`
          : `Failed to send ${template} email (check logs for details)`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Failed to send ${template} email`,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  })
);

export default router;