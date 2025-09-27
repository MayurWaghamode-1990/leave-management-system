import express, { Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { calendarIntegrationService } from '../services/calendarIntegrationService';
import { logger } from '../utils/logger';
import { validationResult, body, param } from 'express-validator';

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
 * /api/v1/calendar/integrations:
 *   get:
 *     summary: Get user's calendar integrations
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Calendar integrations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       provider:
 *                         type: string
 *                         enum: [google, outlook]
 *                       enabled:
 *                         type: boolean
 *                       calendarId:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 */
router.get('/integrations', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const integrations = await calendarIntegrationService.getUserCalendarIntegrations(userId);

    res.json({
      success: true,
      data: integrations,
    });
  } catch (error) {
    logger.error('Error getting calendar integrations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get calendar integrations',
    });
  }
});

/**
 * @swagger
 * /api/v1/calendar/google/auth-url:
 *   get:
 *     summary: Get Google Calendar authorization URL
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authorization URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     authUrl:
 *                       type: string
 *                       format: uri
 */
router.get('/google/auth-url', authenticate, async (req: Request, res: Response) => {
  try {
    const authUrl = calendarIntegrationService.getGoogleAuthUrl();

    res.json({
      success: true,
      data: { authUrl },
    });
  } catch (error) {
    logger.error('Error getting Google auth URL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate Google authorization URL',
    });
  }
});

/**
 * @swagger
 * /api/v1/calendar/google/callback:
 *   post:
 *     summary: Handle Google Calendar OAuth callback
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: Authorization code from Google OAuth
 *     responses:
 *       200:
 *         description: Google Calendar connected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.post('/google/callback',
  authenticate,
  [
    body('code').notEmpty().withMessage('Authorization code is required'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { code } = req.body;
      const userId = req.user?.id;

      const success = await calendarIntegrationService.connectGoogleCalendar(userId, code);

      if (success) {
        res.json({
          success: true,
          message: 'Google Calendar connected successfully',
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Failed to connect Google Calendar',
        });
      }
    } catch (error) {
      logger.error('Error connecting Google Calendar:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to connect Google Calendar',
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/calendar/outlook/auth-url:
 *   get:
 *     summary: Get Outlook Calendar authorization URL
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authorization URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     authUrl:
 *                       type: string
 *                       format: uri
 */
router.get('/outlook/auth-url', authenticate, async (req: Request, res: Response) => {
  try {
    const authUrl = await calendarIntegrationService.getOutlookAuthUrl();

    res.json({
      success: true,
      data: { authUrl },
    });
  } catch (error) {
    logger.error('Error getting Outlook auth URL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate Outlook authorization URL',
    });
  }
});

/**
 * @swagger
 * /api/v1/calendar/outlook/callback:
 *   post:
 *     summary: Handle Outlook Calendar OAuth callback
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: Authorization code from Microsoft OAuth
 *     responses:
 *       200:
 *         description: Outlook Calendar connected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.post('/outlook/callback',
  authenticate,
  [
    body('code').notEmpty().withMessage('Authorization code is required'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { code } = req.body;
      const userId = req.user?.id;

      const success = await calendarIntegrationService.connectOutlookCalendar(userId, code);

      if (success) {
        res.json({
          success: true,
          message: 'Outlook Calendar connected successfully',
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Failed to connect Outlook Calendar',
        });
      }
    } catch (error) {
      logger.error('Error connecting Outlook Calendar:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to connect Outlook Calendar',
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/calendar/disconnect/{provider}:
 *   delete:
 *     summary: Disconnect calendar integration
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: provider
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           enum: [google, outlook]
 *         description: Calendar provider to disconnect
 *     responses:
 *       200:
 *         description: Calendar disconnected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.delete('/disconnect/:provider',
  authenticate,
  [
    param('provider').isIn(['google', 'outlook']).withMessage('Provider must be google or outlook'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { provider } = req.params;
      const userId = req.user?.id;

      const success = await calendarIntegrationService.disconnectCalendar(
        userId,
        provider as 'google' | 'outlook'
      );

      if (success) {
        res.json({
          success: true,
          message: `${provider} Calendar disconnected successfully`,
        });
      } else {
        res.status(400).json({
          success: false,
          message: `Failed to disconnect ${provider} Calendar`,
        });
      }
    } catch (error) {
      logger.error(`Error disconnecting ${req.params.provider} Calendar:`, error);
      res.status(500).json({
        success: false,
        message: `Failed to disconnect ${req.params.provider} Calendar`,
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/calendar/ical/{userId}:
 *   get:
 *     summary: Get iCal feed for user's leave calendar
 *     tags: [Calendar]
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID for the calendar feed
 *     responses:
 *       200:
 *         description: iCal feed generated successfully
 *         content:
 *           text/calendar:
 *             schema:
 *               type: string
 *               example: |
 *                 BEGIN:VCALENDAR
 *                 VERSION:2.0
 *                 PRODID:-//Leave Management System//EN
 *                 BEGIN:VEVENT
 *                 ...
 *                 END:VEVENT
 *                 END:VCALENDAR
 */
router.get('/ical/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const icalFeed = await calendarIntegrationService.generateICalFeed(userId);

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="leave-calendar-${userId}.ics"`);
    res.send(icalFeed);
  } catch (error) {
    logger.error('Error generating iCal feed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate calendar feed',
    });
  }
});

/**
 * @swagger
 * /api/v1/calendar/sync-leave/{leaveId}:
 *   post:
 *     summary: Manually sync leave request with connected calendars
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: leaveId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Leave request ID to sync
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [create, update, delete]
 *                 description: Sync action to perform
 *     responses:
 *       200:
 *         description: Leave synced successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.post('/sync-leave/:leaveId',
  authenticate,
  [
    param('leaveId').notEmpty().withMessage('Leave ID is required'),
    body('action').isIn(['create', 'update', 'delete']).withMessage('Action must be create, update, or delete'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { leaveId } = req.params;
      const { action } = req.body;

      await calendarIntegrationService.syncLeaveWithCalendar(leaveId, action);

      res.json({
        success: true,
        message: 'Leave synced with calendar successfully',
      });
    } catch (error) {
      logger.error('Error syncing leave with calendar:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to sync leave with calendar',
      });
    }
  }
);

export default router;