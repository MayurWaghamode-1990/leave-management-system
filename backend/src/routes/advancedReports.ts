import express, { Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { advancedReportingService, AdvancedReportFilters } from '../services/advancedReportingService';
import { logger } from '../utils/logger';
import { validationResult, query, body } from 'express-validator';

const router = express.Router();

// Middleware for validation error handling
const handleValidationErrors = (req: Request, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

/**
 * @swagger
 * /api/v1/advanced-reports/filtered-reports:
 *   post:
 *     summary: Get filtered leave reports with advanced analytics
 *     tags: [Advanced Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               departments:
 *                 type: array
 *                 items:
 *                   type: string
 *               locations:
 *                 type: array
 *                 items:
 *                   type: string
 *               employeeIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               leaveTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *               statuses:
 *                 type: array
 *                 items:
 *                   type: string
 *               minDuration:
 *                 type: number
 *               maxDuration:
 *                 type: number
 *               includeHalfDays:
 *                 type: boolean
 *               sortBy:
 *                 type: string
 *                 enum: [date, duration, employee, department]
 *               sortOrder:
 *                 type: string
 *                 enum: [asc, desc]
 *               limit:
 *                 type: number
 *               offset:
 *                 type: number
 *     responses:
 *       200:
 *         description: Filtered reports retrieved successfully
 */
router.post('/filtered-reports',
  authenticate,
  authorize('HR_ADMIN', 'MANAGER'),
  [
    body('startDate').optional().isISO8601().withMessage('Start date must be valid ISO date'),
    body('endDate').optional().isISO8601().withMessage('End date must be valid ISO date'),
    body('departments').optional().isArray().withMessage('Departments must be an array'),
    body('locations').optional().isArray().withMessage('Locations must be an array'),
    body('employeeIds').optional().isArray().withMessage('Employee IDs must be an array'),
    body('leaveTypes').optional().isArray().withMessage('Leave types must be an array'),
    body('statuses').optional().isArray().withMessage('Statuses must be an array'),
    body('minDuration').optional().isNumeric().withMessage('Min duration must be a number'),
    body('maxDuration').optional().isNumeric().withMessage('Max duration must be a number'),
    body('includeHalfDays').optional().isBoolean().withMessage('Include half days must be boolean'),
    body('sortBy').optional().isIn(['date', 'duration', 'employee', 'department']).withMessage('Invalid sort field'),
    body('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
    body('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
    body('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const filters: AdvancedReportFilters = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      };

      const result = await advancedReportingService.getFilteredLeaveReports(filters);

      res.json({
        success: true,
        data: result.data,
        totalCount: result.totalCount,
        summary: result.summary,
        filters: filters,
      });
    } catch (error) {
      logger.error('Error getting filtered reports:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate filtered reports',
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/advanced-reports/utilization:
 *   get:
 *     summary: Get department utilization report
 *     tags: [Advanced Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Utilization report retrieved successfully
 */
router.get('/utilization',
  authenticate,
  authorize('HR_ADMIN', 'MANAGER'),
  async (req: Request, res: Response) => {
    try {
      const utilizationReport = await advancedReportingService.getUtilizationReport({});

      res.json({
        success: true,
        data: utilizationReport,
      });
    } catch (error) {
      logger.error('Error getting utilization report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate utilization report',
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/advanced-reports/compliance:
 *   get:
 *     summary: Get compliance report
 *     tags: [Advanced Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: region
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by specific region
 *     responses:
 *       200:
 *         description: Compliance report retrieved successfully
 */
router.get('/compliance',
  authenticate,
  authorize('HR_ADMIN'),
  [
    query('region').optional().isString().withMessage('Region must be a string'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { region } = req.query;
      const complianceReport = await advancedReportingService.getComplianceReport(region as string);

      res.json({
        success: true,
        data: complianceReport,
      });
    } catch (error) {
      logger.error('Error getting compliance report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate compliance report',
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/advanced-reports/export:
 *   post:
 *     summary: Export filtered report data
 *     tags: [Advanced Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - format
 *             properties:
 *               format:
 *                 type: string
 *                 enum: [csv, excel, pdf]
 *               filters:
 *                 type: object
 *                 description: Same filter object as filtered-reports endpoint
 *     responses:
 *       200:
 *         description: Report exported successfully
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 */
router.post('/export',
  authenticate,
  authorize('HR_ADMIN', 'MANAGER'),
  [
    body('format').isIn(['csv', 'excel', 'pdf']).withMessage('Format must be csv, excel, or pdf'),
    body('filters').optional().isObject().withMessage('Filters must be an object'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { format, filters = {} } = req.body;

      const exportFilters: AdvancedReportFilters = {
        ...filters,
        startDate: filters.startDate ? new Date(filters.startDate) : undefined,
        endDate: filters.endDate ? new Date(filters.endDate) : undefined,
      };

      const result = await advancedReportingService.exportReportData(exportFilters, format);

      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.data);
    } catch (error) {
      logger.error('Error exporting report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export report',
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/advanced-reports/filter-options:
 *   get:
 *     summary: Get available filter options for reports
 *     tags: [Advanced Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Filter options retrieved successfully
 */
router.get('/filter-options',
  authenticate,
  authorize('HR_ADMIN', 'MANAGER'),
  async (req: Request, res: Response) => {
    try {
      const filterOptions = await advancedReportingService.getAvailableFilterOptions();

      res.json({
        success: true,
        data: filterOptions,
      });
    } catch (error) {
      logger.error('Error getting filter options:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get filter options',
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/advanced-reports/dashboard-summary:
 *   get:
 *     summary: Get summary data for advanced reports dashboard
 *     tags: [Advanced Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary retrieved successfully
 */
router.get('/dashboard-summary',
  authenticate,
  authorize('HR_ADMIN', 'MANAGER'),
  async (req: Request, res: Response) => {
    try {
      // Get current month data
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const filters: AdvancedReportFilters = {
        startDate: startOfMonth,
        endDate: endOfMonth,
        limit: 1000
      };

      const { summary } = await advancedReportingService.getFilteredLeaveReports(filters);
      const utilizationReport = await advancedReportingService.getUtilizationReport({});

      // Calculate key metrics
      const totalUtilization = utilizationReport.reduce((sum, dept) => sum + dept.utilizationRate, 0) / utilizationReport.length;
      const highRiskDepartments = utilizationReport.filter(dept => dept.riskLevel === 'HIGH').length;

      res.json({
        success: true,
        data: {
          currentMonth: {
            totalRequests: summary.totalRequests,
            totalDays: summary.totalDays,
            approvalRate: summary.approvalRate,
            avgUtilization: totalUtilization
          },
          alerts: {
            highRiskDepartments,
            lowApprovalRate: summary.approvalRate < 80,
            highUtilization: totalUtilization > 25
          },
          quickStats: {
            leaveTypeBreakdown: summary.leaveTypeBreakdown.slice(0, 5),
            departmentBreakdown: summary.departmentBreakdown.slice(0, 5),
            monthlyTrends: summary.monthlyTrends.slice(-6)
          }
        },
      });
    } catch (error) {
      logger.error('Error getting dashboard summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get dashboard summary',
      });
    }
  }
);

export default router;