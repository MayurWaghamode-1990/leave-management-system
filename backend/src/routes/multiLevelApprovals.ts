import { Router } from 'express'
import { Request, Response } from 'express'
import { multiLevelApprovalService } from '../services/multiLevelApprovalService'
import { authenticate } from '../middleware/auth'
import { body, query, param, validationResult } from 'express-validator'

const router = Router()

/**
 * @swagger
 * /api/v1/multi-level-approvals/create-chain:
 *   post:
 *     summary: Create multi-level approval chain for a leave request
 *     tags: [Multi-Level Approvals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               leaveRequestId:
 *                 type: string
 *                 description: Leave request ID
 *               employeeId:
 *                 type: string
 *                 description: Employee ID
 *               leaveType:
 *                 type: string
 *                 description: Type of leave
 *             required:
 *               - leaveRequestId
 *               - employeeId
 *               - leaveType
 *     responses:
 *       200:
 *         description: Approval chain created successfully
 *       400:
 *         description: Invalid input parameters
 */
router.post('/create-chain',
  authenticate,
  [
    body('leaveRequestId').notEmpty().withMessage('Leave request ID is required'),
    body('employeeId').notEmpty().withMessage('Employee ID is required'),
    body('leaveType').notEmpty().withMessage('Leave type is required')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        })
      }

      const { leaveRequestId, employeeId, leaveType } = req.body

      // Build approval chain
      const approvalChain = await multiLevelApprovalService.buildApprovalChain(
        leaveRequestId,
        employeeId,
        leaveType
      )

      // Create approval records in database
      await multiLevelApprovalService.createApprovalRecords(approvalChain)

      res.json({
        success: true,
        message: 'Multi-level approval chain created successfully',
        data: {
          approvalChain,
          totalLevels: approvalChain.levels.length,
          currentLevel: approvalChain.currentLevel,
          isCompOffRequest: leaveType === 'COMPENSATORY_OFF'
        }
      })
    } catch (error) {
      console.error('Error creating approval chain:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

/**
 * @swagger
 * /api/v1/multi-level-approvals/process:
 *   post:
 *     summary: Process approval for a specific level
 *     tags: [Multi-Level Approvals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               leaveRequestId:
 *                 type: string
 *                 description: Leave request ID
 *               action:
 *                 type: string
 *                 enum: [APPROVE, REJECT]
 *                 description: Approval action
 *               comments:
 *                 type: string
 *                 description: Optional comments
 *             required:
 *               - leaveRequestId
 *               - action
 *     responses:
 *       200:
 *         description: Approval processed successfully
 *       403:
 *         description: User not authorized to approve this request
 */
router.post('/process',
  authenticate,
  [
    body('leaveRequestId').notEmpty().withMessage('Leave request ID is required'),
    body('action').isIn(['APPROVE', 'REJECT']).withMessage('Action must be APPROVE or REJECT'),
    body('comments').optional().isString()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        })
      }

      const { leaveRequestId, action, comments } = req.body
      const approverId = req.user?.id

      if (!approverId) {
        return res.status(403).json({
          success: false,
          message: 'User ID not found in request'
        })
      }

      const result = await multiLevelApprovalService.processApproval(
        leaveRequestId,
        approverId,
        action,
        comments
      )

      res.json({
        success: result.success,
        message: result.message,
        data: {
          completed: result.completed,
          nextLevel: result.nextLevel,
          action: action
        }
      })
    } catch (error) {
      console.error('Error processing approval:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

/**
 * @swagger
 * /api/v1/multi-level-approvals/status/{leaveRequestId}:
 *   get:
 *     summary: Get approval status for a leave request
 *     tags: [Multi-Level Approvals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leaveRequestId
 *         required: true
 *         schema:
 *           type: string
 *         description: Leave request ID
 *     responses:
 *       200:
 *         description: Approval status retrieved successfully
 *       404:
 *         description: Leave request not found
 */
router.get('/status/:leaveRequestId',
  authenticate,
  [
    param('leaveRequestId').notEmpty().withMessage('Leave request ID is required')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        })
      }

      const { leaveRequestId } = req.params

      const status = await multiLevelApprovalService.getApprovalStatus(leaveRequestId)

      res.json({
        success: true,
        message: 'Approval status retrieved successfully',
        data: status
      })
    } catch (error) {
      console.error('Error getting approval status:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

/**
 * @swagger
 * /api/v1/multi-level-approvals/pending:
 *   get:
 *     summary: Get pending approvals for the current user
 *     tags: [Multi-Level Approvals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending approvals retrieved successfully
 */
router.get('/pending',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const approverId = req.user?.id

      if (!approverId) {
        return res.status(403).json({
          success: false,
          message: 'User ID not found in request'
        })
      }

      const pendingApprovals = await multiLevelApprovalService.getPendingApprovalsForUser(approverId)

      res.json({
        success: true,
        message: 'Pending approvals retrieved successfully',
        data: {
          totalPending: pendingApprovals.length,
          compOffPending: pendingApprovals.filter(a => a.isCompOffRequest).length,
          otherPending: pendingApprovals.filter(a => !a.isCompOffRequest).length,
          approvals: pendingApprovals
        }
      })
    } catch (error) {
      console.error('Error getting pending approvals:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

/**
 * @swagger
 * /api/v1/multi-level-approvals/workflow-summary:
 *   get:
 *     summary: Get approval workflow summary for different leave types
 *     tags: [Multi-Level Approvals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Workflow summary retrieved successfully
 */
router.get('/workflow-summary',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const summary = multiLevelApprovalService.getApprovalWorkflowSummary()

      res.json({
        success: true,
        message: 'Approval workflow summary retrieved successfully',
        data: summary
      })
    } catch (error) {
      console.error('Error getting workflow summary:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

/**
 * @swagger
 * /api/v1/multi-level-approvals/comp-off-approvals:
 *   get:
 *     summary: Get all comp off requests requiring approval
 *     tags: [Multi-Level Approvals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *         description: Filter by approval status
 *     responses:
 *       200:
 *         description: Comp off approvals retrieved successfully
 */
router.get('/comp-off-approvals',
  authenticate,
  [
    query('status').optional().isIn(['PENDING', 'APPROVED', 'REJECTED'])
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        })
      }

      // Check if user has permission to view all comp off approvals
      if (!['ADMIN', 'HR_ADMIN', 'MANAGER'].includes(req.user?.role)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin, HR, or Manager role required.'
        })
      }

      const { status } = req.query

      // This would be implemented with proper database queries
      // For now, returning mock data structure
      const compOffApprovals = {
        totalRequests: 0,
        pendingL1: 0,
        pendingL2: 0,
        pendingHR: 0,
        approved: 0,
        rejected: 0,
        requests: []
      }

      res.json({
        success: true,
        message: 'Comp off approvals retrieved successfully',
        data: compOffApprovals
      })
    } catch (error) {
      console.error('Error getting comp off approvals:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

export default router