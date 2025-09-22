import express, { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { advancedLeaveService } from '../services/advancedLeaveService';

const router = express.Router();

/**
 * @swagger
 * /api/v1/advanced-leaves/cancellation-requests:
 *   post:
 *     summary: Create leave cancellation request
 *     tags: [Advanced Leaves]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - leaveRequestId
 *               - cancellationReason
 *             properties:
 *               leaveRequestId:
 *                 type: string
 *               cancellationReason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Cancellation request created successfully
 *       400:
 *         description: Invalid input data
 *       403:
 *         description: Not authorized
 */
router.post('/cancellation-requests',
  authenticate,
  body('leaveRequestId').isString().notEmpty(),
  body('cancellationReason').isString().isLength({ min: 10, max: 500 }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { leaveRequestId, cancellationReason } = req.body;
      const employeeId = req.user!.id;

      const cancellationRequest = await advancedLeaveService.createCancellationRequest({
        leaveRequestId,
        employeeId,
        cancellationReason,
      });

      res.status(201).json({
        success: true,
        message: 'Cancellation request created successfully',
        data: cancellationRequest
      });

    } catch (error: any) {
      logger.error('Error creating cancellation request:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create cancellation request'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/advanced-leaves/cancellation-requests:
 *   get:
 *     summary: Get leave cancellation requests
 *     tags: [Advanced Leaves]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Cancellation requests retrieved successfully
 */
router.get('/cancellation-requests',
  authenticate,
  authorize(['MANAGER', 'HR_ADMIN']),
  query('status').optional().isIn(['PENDING', 'APPROVED', 'REJECTED']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { status, page = 1, limit = 10 } = req.query;
      const filters: any = {};

      if (status) filters.status = status;

      const result = await advancedLeaveService.getCancellationRequests(
        filters,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        message: 'Cancellation requests retrieved successfully',
        data: result.requests,
        pagination: result.pagination
      });

    } catch (error: any) {
      logger.error('Error fetching cancellation requests:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch cancellation requests'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/advanced-leaves/cancellation-requests/{id}/approve:
 *   post:
 *     summary: Approve leave cancellation request
 *     tags: [Advanced Leaves]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cancellation request approved successfully
 *       404:
 *         description: Request not found
 */
router.post('/cancellation-requests/:id/approve',
  authenticate,
  authorize(['MANAGER', 'HR_ADMIN']),
  param('id').isString().notEmpty(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const approverId = req.user!.id;

      const cancellationRequest = await advancedLeaveService.approveCancellationRequest(id, approverId);

      res.json({
        success: true,
        message: 'Cancellation request approved successfully',
        data: cancellationRequest
      });

    } catch (error: any) {
      logger.error('Error approving cancellation request:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to approve cancellation request'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/advanced-leaves/cancellation-requests/{id}/reject:
 *   post:
 *     summary: Reject leave cancellation request
 *     tags: [Advanced Leaves]
 *     security:
 *       - bearerAuth: []
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
 *               - rejectionReason
 *             properties:
 *               rejectionReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cancellation request rejected successfully
 */
router.post('/cancellation-requests/:id/reject',
  authenticate,
  authorize(['MANAGER', 'HR_ADMIN']),
  param('id').isString().notEmpty(),
  body('rejectionReason').isString().isLength({ min: 10, max: 500 }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { rejectionReason } = req.body;
      const approverId = req.user!.id;

      const cancellationRequest = await advancedLeaveService.rejectCancellationRequest(
        id,
        approverId,
        rejectionReason
      );

      res.json({
        success: true,
        message: 'Cancellation request rejected successfully',
        data: cancellationRequest
      });

    } catch (error: any) {
      logger.error('Error rejecting cancellation request:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to reject cancellation request'
      });
    }
  }
);

// === MODIFICATION REQUESTS ===

/**
 * @swagger
 * /api/v1/advanced-leaves/modification-requests:
 *   post:
 *     summary: Create leave modification request
 *     tags: [Advanced Leaves]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - originalLeaveId
 *               - modificationReason
 *             properties:
 *               originalLeaveId:
 *                 type: string
 *               newStartDate:
 *                 type: string
 *                 format: date
 *               newEndDate:
 *                 type: string
 *                 format: date
 *               newLeaveType:
 *                 type: string
 *               newReason:
 *                 type: string
 *               modificationReason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Modification request created successfully
 */
router.post('/modification-requests',
  authenticate,
  body('originalLeaveId').isString().notEmpty(),
  body('newStartDate').optional().isISO8601(),
  body('newEndDate').optional().isISO8601(),
  body('newLeaveType').optional().isString(),
  body('newReason').optional().isString(),
  body('modificationReason').isString().isLength({ min: 10, max: 500 }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        originalLeaveId,
        newStartDate,
        newEndDate,
        newLeaveType,
        newReason,
        modificationReason,
      } = req.body;
      const employeeId = req.user!.id;

      const modificationRequest = await advancedLeaveService.createModificationRequest({
        originalLeaveId,
        employeeId,
        newStartDate: newStartDate ? new Date(newStartDate) : undefined,
        newEndDate: newEndDate ? new Date(newEndDate) : undefined,
        newLeaveType,
        newReason,
        modificationReason,
      });

      res.status(201).json({
        success: true,
        message: 'Modification request created successfully',
        data: modificationRequest
      });

    } catch (error: any) {
      logger.error('Error creating modification request:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create modification request'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/advanced-leaves/modification-requests:
 *   get:
 *     summary: Get leave modification requests
 *     tags: [Advanced Leaves]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Modification requests retrieved successfully
 */
router.get('/modification-requests',
  authenticate,
  authorize(['MANAGER', 'HR_ADMIN']),
  query('status').optional().isIn(['PENDING', 'APPROVED', 'REJECTED']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { status, page = 1, limit = 10 } = req.query;
      const filters: any = {};

      if (status) filters.status = status;

      const result = await advancedLeaveService.getModificationRequests(
        filters,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        message: 'Modification requests retrieved successfully',
        data: result.requests,
        pagination: result.pagination
      });

    } catch (error: any) {
      logger.error('Error fetching modification requests:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch modification requests'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/advanced-leaves/modification-requests/{id}/approve:
 *   post:
 *     summary: Approve leave modification request
 *     tags: [Advanced Leaves]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Modification request approved successfully
 */
router.post('/modification-requests/:id/approve',
  authenticate,
  authorize(['MANAGER', 'HR_ADMIN']),
  param('id').isString().notEmpty(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const approverId = req.user!.id;

      const modificationRequest = await advancedLeaveService.approveModificationRequest(id, approverId);

      res.json({
        success: true,
        message: 'Modification request approved successfully',
        data: modificationRequest
      });

    } catch (error: any) {
      logger.error('Error approving modification request:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to approve modification request'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/advanced-leaves/modification-requests/{id}/reject:
 *   post:
 *     summary: Reject leave modification request
 *     tags: [Advanced Leaves]
 *     security:
 *       - bearerAuth: []
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
 *               - rejectionReason
 *             properties:
 *               rejectionReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Modification request rejected successfully
 */
router.post('/modification-requests/:id/reject',
  authenticate,
  authorize(['MANAGER', 'HR_ADMIN']),
  param('id').isString().notEmpty(),
  body('rejectionReason').isString().isLength({ min: 10, max: 500 }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { rejectionReason } = req.body;
      const approverId = req.user!.id;

      const modificationRequest = await advancedLeaveService.rejectModificationRequest(
        id,
        approverId,
        rejectionReason
      );

      res.json({
        success: true,
        message: 'Modification request rejected successfully',
        data: modificationRequest
      });

    } catch (error: any) {
      logger.error('Error rejecting modification request:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to reject modification request'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/advanced-leaves/stats:
 *   get:
 *     summary: Get advanced leave request statistics
 *     tags: [Advanced Leaves]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get('/stats',
  authenticate,
  authorize(['MANAGER', 'HR_ADMIN']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const stats = await advancedLeaveService.getAdvancedRequestStats();

      res.json({
        success: true,
        message: 'Advanced leave request statistics retrieved successfully',
        data: stats
      });

    } catch (error: any) {
      logger.error('Error fetching advanced leave statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics'
      });
    }
  }
);

export default router;