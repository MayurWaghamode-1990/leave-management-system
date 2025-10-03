import express, { Request, Response } from 'express';
import { prisma } from '../index';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { MultiLevelApprovalService } from '../services/multiLevelApprovalService';
import jwt from 'jsonwebtoken';

const router = express.Router();

interface ApprovalToken {
  requestId: string;
  approverId: string;
  level: number;
  requestType: 'LEAVE' | 'COMP_OFF';
  action: 'APPROVE' | 'REJECT';
  timestamp: number;
}

/**
 * @swagger
 * /email-approval/approve/{token}:
 *   get:
 *     tags:
 *       - Email Approval
 *     summary: Approve request via email link
 *     description: Process approval action from email notification
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Approval token from email
 *     responses:
 *       200:
 *         description: Approval processed successfully
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       400:
 *         description: Invalid or expired token
 *       404:
 *         description: Request not found
 */
router.get('/approve/:token',
  asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.params;

    try {
      const decodedToken = validateApprovalToken(token);
      const result = await processEmailApproval(decodedToken, 'APPROVE');

      // Return HTML response for email click
      res.send(generateApprovalResponseHTML(result, 'APPROVE'));
    } catch (error: any) {
      res.status(400).send(generateErrorResponseHTML(error.message));
    }
  })
);

/**
 * @swagger
 * /email-approval/reject/{token}:
 *   get:
 *     tags:
 *       - Email Approval
 *     summary: Reject request via email link
 *     description: Process rejection action from email notification
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Approval token from email
 *     responses:
 *       200:
 *         description: Rejection processed successfully
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       400:
 *         description: Invalid or expired token
 *       404:
 *         description: Request not found
 */
router.get('/reject/:token',
  asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.params;

    try {
      const decodedToken = validateApprovalToken(token);
      const result = await processEmailApproval(decodedToken, 'REJECT');

      // Return HTML response for email click
      res.send(generateApprovalResponseHTML(result, 'REJECT'));
    } catch (error: any) {
      res.status(400).send(generateErrorResponseHTML(error.message));
    }
  })
);

/**
 * @swagger
 * /email-approval/form/{token}:
 *   get:
 *     tags:
 *       - Email Approval
 *     summary: Show approval form with comments
 *     description: Display form for approval with optional comments
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Approval token from email
 *     responses:
 *       200:
 *         description: Approval form displayed
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
router.get('/form/:token',
  asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.params;

    try {
      const decodedToken = validateApprovalToken(token);
      const requestDetails = await getRequestDetails(decodedToken);

      res.send(generateApprovalFormHTML(decodedToken, requestDetails));
    } catch (error: any) {
      res.status(400).send(generateErrorResponseHTML(error.message));
    }
  })
);

/**
 * @swagger
 * /email-approval/submit:
 *   post:
 *     tags:
 *       - Email Approval
 *     summary: Submit approval form with comments
 *     description: Process approval/rejection with comments from form
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - action
 *             properties:
 *               token:
 *                 type: string
 *               action:
 *                 type: string
 *                 enum: [APPROVE, REJECT]
 *               comments:
 *                 type: string
 *     responses:
 *       200:
 *         description: Form submission processed
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
router.post('/submit',
  express.urlencoded({ extended: true }),
  asyncHandler(async (req: Request, res: Response) => {
    const { token, action, comments } = req.body;

    try {
      const decodedToken = validateApprovalToken(token);
      const result = await processEmailApproval(decodedToken, action, comments);

      res.send(generateApprovalResponseHTML(result, action, comments));
    } catch (error: any) {
      res.status(400).send(generateErrorResponseHTML(error.message));
    }
  })
);

/**
 * Generate approval token for email links
 */
export function generateApprovalToken(
  requestId: string,
  approverId: string,
  level: number,
  requestType: 'LEAVE' | 'COMP_OFF'
): string {
  const payload: ApprovalToken = {
    requestId,
    approverId,
    level,
    requestType,
    action: 'APPROVE', // Default, will be overridden by URL
    timestamp: Date.now()
  };

  return jwt.sign(payload, process.env.JWT_SECRET || 'default-secret', {
    expiresIn: '7d' // Token valid for 7 days
  });
}

/**
 * Validate and decode approval token
 */
function validateApprovalToken(token: string): ApprovalToken {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as ApprovalToken;

    // Check if token is not older than 7 days
    const tokenAge = Date.now() - decoded.timestamp;
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

    if (tokenAge > maxAge) {
      throw new Error('Approval token has expired');
    }

    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired approval token');
  }
}

/**
 * Process email approval action
 */
async function processEmailApproval(
  tokenData: ApprovalToken,
  action: 'APPROVE' | 'REJECT',
  comments?: string
) {
  const { requestId, approverId, level, requestType } = tokenData;

  // Verify approver exists and is active
  const approver = await prisma.user.findUnique({
    where: { id: approverId },
    select: { id: true, firstName: true, lastName: true, status: true }
  });

  if (!approver || approver.status !== 'ACTIVE') {
    throw new Error('Approver not found or inactive');
  }

  let result;

  if (requestType === 'LEAVE') {
    // Check if approval is still pending
    const approval = await prisma.approval.findFirst({
      where: {
        leaveRequestId: requestId,
        approverId,
        level,
        status: 'PENDING'
      }
    });

    if (!approval) {
      throw new Error('This approval has already been processed or no longer exists');
    }

    // Process leave approval
    result = await MultiLevelApprovalService.processLeaveApproval(
      requestId,
      approverId,
      level,
      action,
      comments
    );

  } else {
    // Check if comp off approval is still pending
    const approval = await prisma.compOffApproval.findFirst({
      where: {
        compOffRequestId: requestId,
        approverId,
        level,
        status: 'PENDING'
      }
    });

    if (!approval) {
      throw new Error('This approval has already been processed or no longer exists');
    }

    // Process comp off approval
    result = await MultiLevelApprovalService.processCompOffApproval(
      requestId,
      approverId,
      level,
      action,
      comments
    );
  }

  return {
    ...result,
    approverName: `${approver.firstName} ${approver.lastName}`,
    requestType,
    requestId,
    level
  };
}

/**
 * Get request details for display
 */
async function getRequestDetails(tokenData: ApprovalToken) {
  const { requestId, requestType } = tokenData;

  if (requestType === 'LEAVE') {
    return await prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeId: true }
        }
      }
    });
  } else {
    return await prisma.compOffRequest.findUnique({
      where: { id: requestId },
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeId: true }
        }
      }
    });
  }
}

/**
 * Generate HTML response for successful approval
 */
function generateApprovalResponseHTML(result: any, action: string, comments?: string): string {
  const actionText = action === 'APPROVE' ? 'approved' : 'rejected';
  const statusColor = action === 'APPROVE' ? '#4caf50' : '#f44336';

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Request ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
            .header { background-color: ${statusColor}; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; }
            .success-icon { font-size: 48px; margin-bottom: 10px; }
            .details { background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .detail-label { font-weight: bold; color: #666; }
            .detail-value { color: #333; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef; }
            .btn { display: inline-block; padding: 12px 24px; margin: 10px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="success-icon">${action === 'APPROVE' ? '✅' : '❌'}</div>
                <h1>Request ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}</h1>
            </div>
            <div class="content">
                <p>The ${result.requestType.toLowerCase()} request has been successfully <strong>${actionText}</strong>.</p>

                <div class="details">
                    <div class="detail-row">
                        <span class="detail-label">Request ID:</span>
                        <span class="detail-value">${result.requestId}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Approved by:</span>
                        <span class="detail-value">${result.approverName}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Level:</span>
                        <span class="detail-value">${result.level}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Action:</span>
                        <span class="detail-value">${action}</span>
                    </div>
                    ${comments ? `
                    <div class="detail-row">
                        <span class="detail-label">Comments:</span>
                        <span class="detail-value">${comments}</span>
                    </div>
                    ` : ''}
                    <div class="detail-row">
                        <span class="detail-label">Status:</span>
                        <span class="detail-value">${result.message}</span>
                    </div>
                </div>

                ${result.completed ?
                  `<p><strong>This request has been fully processed.</strong></p>` :
                  `<p>This request will now proceed to the next approval level.</p>`
                }
            </div>
            <div class="footer">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="btn">Go to Portal</a>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">
                    GLF Leave Management System
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
}

/**
 * Generate HTML form for approval with comments
 */
function generateApprovalFormHTML(tokenData: ApprovalToken, requestDetails: any): string {
  const isLeave = tokenData.requestType === 'LEAVE';

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Approval Required</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
            .header { background-color: #2196f3; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; }
            .form-group { margin-bottom: 20px; }
            .form-label { display: block; margin-bottom: 5px; font-weight: bold; color: #333; }
            .form-control { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }
            .btn { display: inline-block; padding: 12px 24px; margin: 10px 5px; border: none; border-radius: 4px; font-size: 14px; font-weight: bold; cursor: pointer; text-decoration: none; }
            .btn-approve { background-color: #4caf50; color: white; }
            .btn-reject { background-color: #f44336; color: white; }
            .btn-approve:hover { background-color: #45a049; }
            .btn-reject:hover { background-color: #da190b; }
            .details { background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .detail-label { font-weight: bold; color: #666; }
            .detail-value { color: #333; }
            .actions { text-align: center; margin-top: 30px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📋 Approval Required</h1>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">Level ${tokenData.level} Approval</p>
            </div>
            <div class="content">
                <h3>${isLeave ? 'Leave' : 'Comp Off'} Request Details</h3>

                <div class="details">
                    <div class="detail-row">
                        <span class="detail-label">Employee:</span>
                        <span class="detail-value">${requestDetails.employee.firstName} ${requestDetails.employee.lastName} (${requestDetails.employee.employeeId})</span>
                    </div>
                    ${isLeave ? `
                    <div class="detail-row">
                        <span class="detail-label">Leave Type:</span>
                        <span class="detail-value">${requestDetails.leaveType}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Duration:</span>
                        <span class="detail-value">${requestDetails.startDate.toDateString()} - ${requestDetails.endDate.toDateString()} (${requestDetails.totalDays} days)</span>
                    </div>
                    ` : `
                    <div class="detail-row">
                        <span class="detail-label">Hours Requested:</span>
                        <span class="detail-value">${requestDetails.hoursToRedeem} hours (${requestDetails.daysRequested} days)</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Dates:</span>
                        <span class="detail-value">${requestDetails.startDate.toDateString()} - ${requestDetails.endDate.toDateString()}</span>
                    </div>
                    `}
                    <div class="detail-row">
                        <span class="detail-label">Reason:</span>
                        <span class="detail-value">${requestDetails.reason}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Applied Date:</span>
                        <span class="detail-value">${new Date(requestDetails.appliedDate).toDateString()}</span>
                    </div>
                </div>

                <form method="post" action="/api/email-approval/submit">
                    <input type="hidden" name="token" value="${JSON.stringify(tokenData).replace(/"/g, '&quot;')}">

                    <div class="form-group">
                        <label class="form-label">Comments (Optional):</label>
                        <textarea name="comments" class="form-control" rows="4" placeholder="Add any comments for your decision..."></textarea>
                    </div>

                    <div class="actions">
                        <button type="submit" name="action" value="APPROVE" class="btn btn-approve">
                            ✅ Approve Request
                        </button>
                        <button type="submit" name="action" value="REJECT" class="btn btn-reject">
                            ❌ Reject Request
                        </button>
                    </div>
                </form>

                <div style="margin-top: 30px; text-align: center;">
                    <p style="font-size: 12px; color: #666;">
                        For detailed review, you can also access the full portal:
                    </p>
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="color: #2196f3;">Go to Leave Management Portal</a>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
}

/**
 * Generate error response HTML
 */
function generateErrorResponseHTML(errorMessage: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Approval Error</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
            .header { background-color: #f44336; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; text-align: center; }
            .error-icon { font-size: 48px; margin-bottom: 10px; }
            .btn { display: inline-block; padding: 12px 24px; margin: 10px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="error-icon">❌</div>
                <h1>Approval Error</h1>
            </div>
            <div class="content">
                <p><strong>Error:</strong> ${errorMessage}</p>
                <p>This approval link may have expired or been already processed.</p>
                <p>Please contact your system administrator or try accessing the portal directly.</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="btn">Go to Portal</a>
            </div>
        </div>
    </body>
    </html>
  `;
}

export default router;
export { generateApprovalToken };