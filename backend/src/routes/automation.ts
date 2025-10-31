import express, { Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { accrualScheduler } from '../services/accrualScheduler';

const router = express.Router();

/**
 * @swagger
 * /api/v1/automation/scheduler/status:
 *   get:
 *     summary: Get scheduler status
 *     description: Get the status of all scheduled automation jobs
 *     tags: [Automation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Scheduler status retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/scheduler/status',
  authenticate,
  authorize('HR_ADMIN', 'IT_ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const status = accrualScheduler.getSchedulerStatus();
      res.json({
        success: true,
        message: 'Scheduler status retrieved successfully',
        data: status
      });
    } catch (error) {
      console.error('Error getting scheduler status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get scheduler status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/automation/monthly-accrual/trigger:
 *   post:
 *     summary: Manually trigger monthly accrual
 *     description: Manually trigger monthly accrual processing for a specific month/year (Admin only)
 *     tags: [Automation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               year:
 *                 type: number
 *                 description: Year (defaults to current year)
 *               month:
 *                 type: number
 *                 description: Month 1-12 (defaults to current month)
 *     responses:
 *       200:
 *         description: Monthly accrual triggered successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/monthly-accrual/trigger',
  authenticate,
  authorize('HR_ADMIN', 'IT_ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const { year, month } = req.body;

      const result = await accrualScheduler.triggerMonthlyAccrual(year, month);

      if (result.success) {
        res.json({
          success: true,
          message: 'Monthly accrual triggered successfully',
          data: result
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Monthly accrual failed',
          error: result.message
        });
      }
    } catch (error) {
      console.error('Error triggering monthly accrual:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to trigger monthly accrual',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/automation/year-end-carryforward/trigger:
 *   post:
 *     summary: Manually trigger year-end carry-forward
 *     description: Manually trigger year-end carry-forward processing (Admin only)
 *     tags: [Automation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               year:
 *                 type: number
 *                 description: Year to process (defaults to current year)
 *     responses:
 *       200:
 *         description: Year-end carry-forward triggered successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/year-end-carryforward/trigger',
  authenticate,
  authorize('HR_ADMIN', 'IT_ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const { year } = req.body;

      const result = await accrualScheduler.triggerYearEndCarryForward(year);

      if (result.success) {
        res.json({
          success: true,
          message: 'Year-end carry-forward triggered successfully',
          data: result
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Year-end carry-forward failed',
          error: result.message
        });
      }
    } catch (error) {
      console.error('Error triggering year-end carry-forward:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to trigger year-end carry-forward',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/automation/comp-off-expiry/trigger:
 *   post:
 *     summary: Manually trigger comp off expiry processing
 *     description: Manually trigger comp off expiry processing (Admin only)
 *     tags: [Automation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Comp off expiry processing triggered successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/comp-off-expiry/trigger',
  authenticate,
  authorize('HR_ADMIN', 'IT_ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const result = await accrualScheduler.triggerCompOffExpiration();

      if (result.success) {
        res.json({
          success: true,
          message: 'Comp off expiry processing triggered successfully',
          data: result
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Comp off expiry processing failed',
          error: result.message
        });
      }
    } catch (error) {
      console.error('Error triggering comp off expiry:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to trigger comp off expiry processing',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/automation/scheduler/stop:
 *   post:
 *     summary: Stop a specific scheduled job
 *     description: Stop a specific scheduled automation job (Admin only)
 *     tags: [Automation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobName
 *             properties:
 *               jobName:
 *                 type: string
 *                 enum: [monthly-accrual, year-end-carryforward, comp-off-expiration]
 *                 description: Name of the job to stop
 *     responses:
 *       200:
 *         description: Job stopped successfully
 *       400:
 *         description: Invalid job name
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/scheduler/stop',
  authenticate,
  authorize('IT_ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const { jobName } = req.body;

      if (!jobName) {
        return res.status(400).json({
          success: false,
          message: 'Job name is required'
        });
      }

      const stopped = accrualScheduler.stopJob(jobName);

      if (stopped) {
        res.json({
          success: true,
          message: `Scheduled job '${jobName}' stopped successfully`
        });
      } else {
        res.status(404).json({
          success: false,
          message: `Scheduled job '${jobName}' not found`
        });
      }
    } catch (error) {
      console.error('Error stopping scheduled job:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to stop scheduled job',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/automation/scheduler/start:
 *   post:
 *     summary: Start a specific scheduled job
 *     description: Start a specific scheduled automation job (Admin only)
 *     tags: [Automation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobName
 *             properties:
 *               jobName:
 *                 type: string
 *                 enum: [monthly-accrual, year-end-carryforward, comp-off-expiration]
 *                 description: Name of the job to start
 *     responses:
 *       200:
 *         description: Job started successfully
 *       400:
 *         description: Invalid job name
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/scheduler/start',
  authenticate,
  authorize('IT_ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const { jobName } = req.body;

      if (!jobName) {
        return res.status(400).json({
          success: false,
          message: 'Job name is required'
        });
      }

      const started = accrualScheduler.startJob(jobName);

      if (started) {
        res.json({
          success: true,
          message: `Scheduled job '${jobName}' started successfully`
        });
      } else {
        res.status(404).json({
          success: false,
          message: `Scheduled job '${jobName}' not found`
        });
      }
    } catch (error) {
      console.error('Error starting scheduled job:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start scheduled job',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/automation/scheduler/restart-all:
 *   post:
 *     summary: Restart all scheduled jobs
 *     description: Restart all scheduled automation jobs (IT Admin only)
 *     tags: [Automation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All jobs restarted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - IT Admin access required
 */
router.post('/scheduler/restart-all',
  authenticate,
  authorize('IT_ADMIN'),
  async (req: Request, res: Response) => {
    try {
      accrualScheduler.restartAll();

      res.json({
        success: true,
        message: 'All scheduled jobs restarted successfully'
      });
    } catch (error) {
      console.error('Error restarting scheduled jobs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to restart scheduled jobs',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;
