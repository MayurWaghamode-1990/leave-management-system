import { Router } from 'express'
import { Request, Response } from 'express'
import { usaPtoService } from '../services/usaPtoService'
import { authenticate } from '../middleware/auth'
import { body, query, validationResult } from 'express-validator'

const router = Router()

/**
 * @swagger
 * /api/v1/usa-pto/process-annual:
 *   post:
 *     summary: Process annual PTO allocation for USA employees
 *     tags: [USA PTO Management]
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
 *         description: Annual PTO allocation processed successfully
 *       403:
 *         description: Access denied (Admin/HR only)
 */
router.post('/process-annual',
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
      const targetYear = year || new Date().getFullYear()

      const results = await usaPtoService.processAnnualPtoAllocationBatch(targetYear)

      res.json({
        success: true,
        message: `Annual PTO allocation processed for ${results.length} employees`,
        data: {
          year: targetYear,
          totalEmployees: results.length,
          successfulAllocations: results.filter(r => !r.reason.includes('Error')).length,
          results
        }
      })
    } catch (error) {
      console.error('Error processing annual PTO allocation:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

/**
 * @swagger
 * /api/v1/usa-pto/process-year-end:
 *   post:
 *     summary: Process year-end carry-forward for USA employees
 *     tags: [USA PTO Management]
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
      const targetYear = year || new Date().getFullYear()

      await usaPtoService.applyYearEndCarryForwardRules(targetYear)

      res.json({
        success: true,
        message: `Year-end carry-forward rules applied for ${targetYear}`
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
 * /api/v1/usa-pto/employee/{employeeId}/allocate:
 *   post:
 *     summary: Allocate PTO for a specific USA employee
 *     tags: [USA PTO Management]
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
 *             required:
 *               - year
 *     responses:
 *       200:
 *         description: Employee PTO allocated successfully
 *       403:
 *         description: Access denied (Admin/HR only)
 */
router.post('/employee/:employeeId/allocate',
  authenticate,
  [
    body('year').isInt({ min: 2020, max: 2030 })
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
      const { year } = req.body

      const result = await usaPtoService.processEmployeePtoAllocation(employeeId, year)

      res.json({
        success: true,
        message: 'Employee PTO allocation processed successfully',
        data: result
      })
    } catch (error) {
      console.error('Error allocating employee PTO:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

/**
 * @swagger
 * /api/v1/usa-pto/employee/{employeeId}/history:
 *   get:
 *     summary: Get PTO history for a USA employee
 *     tags: [USA PTO Management]
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
 *         description: PTO history retrieved successfully
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
          message: 'Access denied. You can only view your own PTO history.'
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

      const history = await usaPtoService.getEmployeePtoHistory(
        employeeId,
        year ? parseInt(year as string) : undefined
      )

      res.json({
        success: true,
        message: 'PTO history retrieved successfully',
        data: history
      })
    } catch (error) {
      console.error('Error getting PTO history:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

/**
 * @swagger
 * /api/v1/usa-pto/rules:
 *   get:
 *     summary: Get USA PTO allocation rules
 *     tags: [USA PTO Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: PTO rules retrieved successfully
 */
router.get('/rules',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const rules = usaPtoService.getPtoRulesSummary()

      res.json({
        success: true,
        message: 'USA PTO allocation rules retrieved successfully',
        data: {
          rules,
          description: 'GLF-compliant USA PTO allocation rules',
          keyFeatures: [
            'AVP: 15 days annual PTO, max 5 days carry-forward',
            'VP and above: 20 days annual PTO, no carry-forward',
            'Pro-rated allocation for mid-year joiners',
            'Role-based allocation and carry-forward restrictions'
          ]
        }
      })
    } catch (error) {
      console.error('Error getting PTO rules:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

export default router