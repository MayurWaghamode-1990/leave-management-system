import { Router, Request, Response } from 'express';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

// Import enhanced services
import { enhancedUsaPtoService } from '../services/enhancedUsaPtoService';
import { enhancedIndiaAccrualService } from '../services/enhancedIndiaAccrualService';
import { holidayReminderService } from '../services/holidayReminderService';
import { enhancedCompOffExpiryService } from '../services/enhancedCompOffExpiryService';

const router = Router();

/**
 * @swagger
 * /api/v1/enhanced-features/usa-pto/allocate:
 *   post:
 *     summary: Allocate PTO for USA employee based on designation
 *     tags: [Enhanced Features]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - year
 *             properties:
 *               employeeId:
 *                 type: string
 *               year:
 *                 type: number
 *     responses:
 *       200:
 *         description: PTO allocated successfully
 */
router.post('/usa-pto/allocate',
  authenticate,
  authorize('HR_ADMIN', 'ADMIN'),
  validate({
    body: {
      employeeId: { type: 'string', required: true },
      year: { type: 'number', required: true, min: 2020, max: 2030 }
    }
  }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { employeeId, year } = req.body;

    const result = await enhancedUsaPtoService.allocatePTOByDesignation(employeeId, year);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }

    logger.info('USA PTO allocated via API', {
      adminUserId: req.user?.id,
      employeeId,
      year,
      allocation: result.allocation
    });

    res.json({
      success: true,
      message: result.message,
      data: result.allocation
    });
  })
);

/**
 * @swagger
 * /api/v1/enhanced-features/usa-pto/summary/{employeeId}:
 *   get:
 *     summary: Get PTO allocation summary for USA employee
 *     tags: [Enhanced Features]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: year
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: PTO summary retrieved successfully
 */
router.get('/usa-pto/summary/:employeeId',
  authenticate,
  validate({
    params: {
      employeeId: { type: 'string', required: true }
    },
    query: {
      year: { type: 'number', min: 2020, max: 2030 }
    }
  }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { employeeId } = req.params;
    const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();

    const summary = await enhancedUsaPtoService.getPTOAllocationSummary(employeeId, year);

    res.json({
      success: true,
      message: 'PTO summary retrieved successfully',
      data: summary
    });
  })
);

/**
 * @swagger
 * /api/v1/enhanced-features/india-accrual/process:
 *   post:
 *     summary: Process monthly accrual for India employee
 *     tags: [Enhanced Features]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - year
 *               - month
 *             properties:
 *               employeeId:
 *                 type: string
 *               year:
 *                 type: number
 *               month:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 12
 *     responses:
 *       200:
 *         description: Monthly accrual processed successfully
 */
router.post('/india-accrual/process',
  authenticate,
  authorize('HR_ADMIN', 'ADMIN'),
  validate({
    body: {
      employeeId: { type: 'string', required: true },
      year: { type: 'number', required: true, min: 2020, max: 2030 },
      month: { type: 'number', required: true, min: 1, max: 12 }
    }
  }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { employeeId, year, month } = req.body;

    const result = await enhancedIndiaAccrualService.processMonthlyAccrual(employeeId, year, month);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    logger.info('India monthly accrual processed via API', {
      adminUserId: req.user?.id,
      employeeId,
      year,
      month,
      result
    });

    res.json({
      success: true,
      message: result.message,
      data: {
        employeeId: result.employeeId,
        casualLeave: result.casualLeave,
        privilegeLeave: result.privilegeLeave,
        proRated: result.proRated,
        joiningDateRule: result.joiningDateRule
      }
    });
  })
);

/**
 * @swagger
 * /api/v1/enhanced-features/india-accrual/bulk-process:
 *   post:
 *     summary: Process monthly accrual for all India employees
 *     tags: [Enhanced Features]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - year
 *               - month
 *             properties:
 *               year:
 *                 type: number
 *               month:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 12
 *     responses:
 *       200:
 *         description: Bulk monthly accrual processed successfully
 */
router.post('/india-accrual/bulk-process',
  authenticate,
  authorize('HR_ADMIN', 'ADMIN'),
  validate({
    body: {
      year: { type: 'number', required: true, min: 2020, max: 2030 },
      month: { type: 'number', required: true, min: 1, max: 12 }
    }
  }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { year, month } = req.body;

    await enhancedIndiaAccrualService.processBulkMonthlyAccrual(year, month);

    logger.info('Bulk India monthly accrual processed via API', {
      adminUserId: req.user?.id,
      year,
      month
    });

    res.json({
      success: true,
      message: 'Bulk monthly accrual processed successfully'
    });
  })
);

/**
 * @swagger
 * /api/v1/enhanced-features/holiday-reminders/send:
 *   post:
 *     summary: Send holiday reminders
 *     tags: [Enhanced Features]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reminderDaysBefore:
 *                 type: array
 *                 items:
 *                   type: number
 *               enableReminders:
 *                 type: boolean
 *               includeOptionalHolidays:
 *                 type: boolean
 *               regions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Holiday reminders sent successfully
 */
router.post('/holiday-reminders/send',
  authenticate,
  authorize('HR_ADMIN', 'ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const config = req.body;

    const result = await holidayReminderService.processHolidayReminders(config);

    logger.info('Holiday reminders sent via API', {
      adminUserId: req.user?.id,
      config,
      result: {
        success: result.success,
        remindersSent: result.remindersSent,
        errorCount: result.errors.length
      }
    });

    res.json({
      success: result.success,
      message: 'Holiday reminders processed',
      data: {
        remindersSent: result.remindersSent,
        holidaysProcessed: result.holidaysProcessed,
        errors: result.errors
      }
    });
  })
);

/**
 * @swagger
 * /api/v1/enhanced-features/holiday-reminders/upcoming:
 *   get:
 *     summary: Get upcoming holidays
 *     tags: [Enhanced Features]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: region
 *         schema:
 *           type: string
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *       - in: query
 *         name: daysAhead
 *         schema:
 *           type: number
 *           default: 30
 *     responses:
 *       200:
 *         description: Upcoming holidays retrieved successfully
 */
router.get('/holiday-reminders/upcoming',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { region, location, daysAhead } = req.query;

    const holidays = await holidayReminderService.getUpcomingHolidays(
      region as string,
      location as string,
      daysAhead ? parseInt(daysAhead as string) : undefined
    );

    res.json({
      success: true,
      message: 'Upcoming holidays retrieved successfully',
      data: holidays
    });
  })
);

/**
 * @swagger
 * /api/v1/enhanced-features/comp-off-expiry/process:
 *   post:
 *     summary: Process comp off expiry reminders
 *     tags: [Enhanced Features]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reminderDaysBefore:
 *                 type: array
 *                 items:
 *                   type: number
 *               enableReminders:
 *                 type: boolean
 *               includeWorkLogDetails:
 *                 type: boolean
 *               portalUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comp off expiry reminders processed successfully
 */
router.post('/comp-off-expiry/process',
  authenticate,
  authorize('HR_ADMIN', 'ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const config = req.body;

    const result = await enhancedCompOffExpiryService.processCompOffExpiryReminders(config);

    logger.info('Comp off expiry reminders processed via API', {
      adminUserId: req.user?.id,
      config,
      result: {
        success: result.success,
        remindersSent: result.remindersSent,
        errorCount: result.errors.length
      }
    });

    res.json({
      success: result.success,
      message: 'Comp off expiry reminders processed',
      data: {
        remindersSent: result.remindersSent,
        employeesProcessed: result.employeesProcessed.length,
        errors: result.errors
      }
    });
  })
);

/**
 * @swagger
 * /api/v1/enhanced-features/comp-off-expiry/summary/{employeeId}:
 *   get:
 *     summary: Get comp off expiry summary for employee
 *     tags: [Enhanced Features]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comp off expiry summary retrieved successfully
 */
router.get('/comp-off-expiry/summary/:employeeId',
  authenticate,
  validate({
    params: {
      employeeId: { type: 'string', required: true }
    }
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { employeeId } = req.params;

    const summary = await enhancedCompOffExpiryService.getEmployeeCompOffExpirySummary(employeeId);

    res.json({
      success: true,
      message: 'Comp off expiry summary retrieved successfully',
      data: summary
    });
  })
);

/**
 * @swagger
 * /api/v1/enhanced-features/comp-off-expiry/mark-expired:
 *   post:
 *     summary: Mark expired comp offs as expired
 *     tags: [Enhanced Features]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expired comp offs marked successfully
 */
router.post('/comp-off-expiry/mark-expired',
  authenticate,
  authorize('HR_ADMIN', 'ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const expiredCount = await enhancedCompOffExpiryService.markExpiredCompOffs();

    logger.info('Expired comp offs marked via API', {
      adminUserId: req.user?.id,
      expiredCount
    });

    res.json({
      success: true,
      message: `Marked ${expiredCount} comp offs as expired`,
      data: { expiredCount }
    });
  })
);

export default router;