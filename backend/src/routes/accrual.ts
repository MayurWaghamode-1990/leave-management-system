import { Router } from 'express'
import { Request, Response } from 'express'
import { indiaAccrualService } from '../services/indiaAccrualService'
import { accrualScheduler } from '../services/accrualScheduler'
import { authenticate } from '../middleware/auth'
import { body, query, validationResult } from 'express-validator'

const router = Router()

// Authentication will be applied individually to each route

/**
 * @swagger
 * /api/v1/accrual/process-monthly:
 *   post:
 *     summary: Process monthly accrual for India employees
 *     tags: [Accrual Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               year:
 *                 type: integer
 *                 description: Target year (defaults to current year)
 *               month:
 *                 type: integer
 *                 description: Target month 1-12 (defaults to current month)
 *     responses:
 *       200:
 *         description: Monthly accrual processed successfully
 *       400:
 *         description: Invalid input parameters
 *       403:
 *         description: Access denied (Admin/HR only)
 */
router.post('/process-monthly',
  authenticate,
  [
    body('year').optional().isInt({ min: 2020, max: 2030 }),
    body('month').optional().isInt({ min: 1, max: 12 })
  ],
  async (req: Request, res: Response) => {
  try {
    // Check authorization (Admin or HR only)
    if (!['ADMIN', 'HR_ADMIN'].includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or HR role required.'
      })
    }

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      })
    }

    const { year, month } = req.body
    const result = await accrualScheduler.triggerMonthlyAccrual(year, month)

    res.json({
      success: result.success,
      message: result.message,
      data: result.results || null
    })
  } catch (error) {
    console.error('Error processing monthly accrual:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * @swagger
 * /api/v1/accrual/process-year-end:
 *   post:
 *     summary: Process year-end carry-forward for India employees
 *     tags: [Accrual Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               year:
 *                 type: integer
 *                 description: Target year (defaults to current year)
 *     responses:
 *       200:
 *         description: Year-end carry-forward processed successfully
 *       403:
 *         description: Access denied (Admin/HR only)
 */
router.post('/process-year-end',
  authenticate,
  [
    body('year').optional().isInt({ min: 2020, max: 2030 })
  ],
  async (req: Request, res: Response) => {
  try {
    // Check authorization (Admin or HR only)
    if (!['ADMIN', 'HR_ADMIN'].includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or HR role required.'
      })
    }

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      })
    }

    const { year } = req.body
    const result = await accrualScheduler.triggerYearEndCarryForward(year)

    res.json({
      success: result.success,
      message: result.message
    })
  } catch (error) {
    console.error('Error processing year-end carry-forward:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * @swagger
 * /api/v1/accrual/employee/{employeeId}/history:
 *   get:
 *     summary: Get accrual history for an employee
 *     tags: [Accrual Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee ID
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Filter by year (optional)
 *     responses:
 *       200:
 *         description: Accrual history retrieved successfully
 *       404:
 *         description: Employee not found
 */
router.get('/employee/:employeeId/history',
  authenticate,
  [
    query('year').optional().isInt({ min: 2020, max: 2030 })
  ],
  async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params
    const { year } = req.query

    // Check authorization (users can only view their own history unless Admin/HR)
    if (req.user?.id !== employeeId && !['ADMIN', 'HR_ADMIN', 'MANAGER'].includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own accrual history.'
      })
    }

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      })
    }

    const history = await indiaAccrualService.getEmployeeAccrualHistory(
      employeeId,
      year ? parseInt(year as string) : undefined
    )

    res.json({
      success: true,
      message: 'Accrual history retrieved successfully',
      data: history
    })
  } catch (error) {
    console.error('Error getting accrual history:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * @swagger
 * /api/v1/accrual/employee/{employeeId}/process:
 *   post:
 *     summary: Process accrual for a specific employee
 *     tags: [Accrual Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               year:
 *                 type: integer
 *                 description: Target year
 *               month:
 *                 type: integer
 *                 description: Target month 1-12
 *             required:
 *               - year
 *               - month
 *     responses:
 *       200:
 *         description: Employee accrual processed successfully
 *       403:
 *         description: Access denied (Admin/HR only)
 */
router.post('/employee/:employeeId/process',
  authenticate,
  [
    body('year').isInt({ min: 2020, max: 2030 }),
    body('month').isInt({ min: 1, max: 12 })
  ],
  async (req: Request, res: Response) => {
  try {
    // Check authorization (Admin or HR only)
    if (!['ADMIN', 'HR_ADMIN'].includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or HR role required.'
      })
    }

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      })
    }

    const { employeeId } = req.params
    const { year, month } = req.body

    const result = await indiaAccrualService.processEmployeeMonthlyAccrual(
      employeeId,
      year,
      month
    )

    res.json({
      success: true,
      message: 'Employee accrual processed successfully',
      data: result
    })
  } catch (error) {
    console.error('Error processing employee accrual:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * @swagger
 * /api/v1/accrual/scheduler/status:
 *   get:
 *     summary: Get scheduler status
 *     tags: [Accrual Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Scheduler status retrieved successfully
 *       403:
 *         description: Access denied (Admin only)
 */
router.get('/scheduler/status', authenticate, async (req: Request, res: Response) => {
  try {
    // Check authorization (Admin or HR_ADMIN only)
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'HR_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      })
    }

    const status = accrualScheduler.getSchedulerStatus()

    res.json({
      success: true,
      message: 'Scheduler status retrieved successfully',
      data: status
    })
  } catch (error) {
    console.error('Error getting scheduler status:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * @swagger
 * /api/v1/accrual/scheduler/control:
 *   post:
 *     summary: Control scheduler jobs (start/stop/restart)
 *     tags: [Accrual Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [start, stop, restart, enableTest, disableTest]
 *                 description: Action to perform
 *               jobName:
 *                 type: string
 *                 description: Specific job name (optional, affects all jobs if not provided)
 *             required:
 *               - action
 *     responses:
 *       200:
 *         description: Scheduler control action completed
 *       403:
 *         description: Access denied (Admin only)
 */
router.post('/scheduler/control',
  authenticate,
  [
    body('action').isIn(['start', 'stop', 'restart', 'enableTest', 'disableTest']),
    body('jobName').optional().isString()
  ],
  async (req: Request, res: Response) => {
  try {
    // Check authorization (Admin or HR_ADMIN only)
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'HR_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      })
    }

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      })
    }

    const { action, jobName } = req.body
    let result = false
    let message = ''

    switch (action) {
      case 'start':
        if (jobName) {
          result = accrualScheduler.startJob(jobName)
          message = result ? `Job ${jobName} started` : `Job ${jobName} not found`
        } else {
          accrualScheduler.restartAll()
          result = true
          message = 'All jobs started'
        }
        break

      case 'stop':
        if (jobName) {
          result = accrualScheduler.stopJob(jobName)
          message = result ? `Job ${jobName} stopped` : `Job ${jobName} not found`
        } else {
          accrualScheduler.stopAll()
          result = true
          message = 'All jobs stopped'
        }
        break

      case 'restart':
        accrualScheduler.restartAll()
        result = true
        message = 'All jobs restarted'
        break

      case 'enableTest':
        accrualScheduler.enableTestMode()
        result = true
        message = 'Test mode enabled - jobs will run every minute'
        break

      case 'disableTest':
        accrualScheduler.disableTestMode()
        result = true
        message = 'Test mode disabled - normal schedule restored'
        break
    }

    res.json({
      success: result,
      message
    })
  } catch (error) {
    console.error('Error controlling scheduler:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router