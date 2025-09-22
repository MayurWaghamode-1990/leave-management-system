import express, { Request, Response } from 'express';
import { prisma } from '../index';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { notificationSchemas } from '../schemas/validationSchemas';
import { advancedNotificationService, NotificationChannel, NotificationPriority } from '../services/advancedNotificationService';

const router = express.Router();

// Get notifications for current user
router.get('/', 
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { userId: req.user!.id };
    
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.notification.count({ where })
    ]);

    res.json({
      success: true,
      data: notifications,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  })
);

// Mark notification as read
router.put('/:id/read', 
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await prisma.notification.updateMany({
      where: {
        id: req.params.id,
        userId: req.user!.id
      },
      data: { isRead: true }
    });

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  })
);

// Mark all notifications as read
router.put('/read-all', 
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await prisma.notification.updateMany({
      where: {
        userId: req.user!.id,
        isRead: false
      },
      data: { isRead: true }
    });

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  })
);

// Enhanced notification endpoints

/**
 * @swagger
 * /api/v1/notifications/preferences:
 *   get:
 *     summary: Get user notification preferences
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: User notification preferences
 */
router.get('/preferences',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // In a real implementation, this would come from the database
    const mockPreferences = {
      channels: {
        WEBSOCKET: { enabled: true, minimumPriority: 'LOW' },
        EMAIL: { enabled: true, minimumPriority: 'NORMAL' },
        SMS: { enabled: false, minimumPriority: 'URGENT' },
        PUSH: { enabled: true, minimumPriority: 'HIGH' },
        IN_APP: { enabled: true, minimumPriority: 'LOW' }
      },
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '08:00',
        timezone: 'UTC'
      },
      frequency: {
        maxPerHour: 10,
        maxPerDay: 50
      }
    };

    res.json({
      success: true,
      data: mockPreferences
    });
  })
);

/**
 * @swagger
 * /api/v1/notifications/preferences:
 *   put:
 *     summary: Update user notification preferences
 *     tags: [Notifications]
 */
router.put('/preferences',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { channels, quietHours, frequency } = req.body;
    const userId = req.user!.id;

    // Update preferences in advanced notification service
    advancedNotificationService.setUserPreferences(userId, {
      channels,
      quietHours,
      frequency
    });

    res.json({
      success: true,
      message: 'Notification preferences updated successfully'
    });
  })
);

/**
 * @swagger
 * /api/v1/notifications/test:
 *   post:
 *     summary: Send a test notification
 *     tags: [Notifications]
 */
router.post('/test',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;

    const notification = await advancedNotificationService.sendNotification({
      id: `test_${Date.now()}`,
      userId,
      type: 'SYSTEM_MAINTENANCE' as any,
      title: 'Test Notification',
      message: 'This is a test notification to verify your notification settings.',
      priority: NotificationPriority.NORMAL,
      channels: [NotificationChannel.WEBSOCKET, NotificationChannel.IN_APP],
      metadata: { test: true }
    });

    res.json({
      success: true,
      message: 'Test notification sent successfully',
      data: { notificationId: notification.id }
    });
  })
);

/**
 * @swagger
 * /api/v1/notifications/stats:
 *   get:
 *     summary: Get notification statistics (admin only)
 *     tags: [Notifications]
 */
router.get('/stats',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Check if user is admin (simplified check)
    if (req.user!.role !== 'ADMIN' && req.user!.role !== 'HR') {
      throw new AppError('Insufficient permissions', 403);
    }

    const stats = advancedNotificationService.getStats();

    res.json({
      success: true,
      data: stats
    });
  })
);

/**
 * @swagger
 * /api/v1/notifications/broadcast:
 *   post:
 *     summary: Send broadcast notification (admin only)
 *     tags: [Notifications]
 */
router.post('/broadcast',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Check if user is admin
    if (req.user!.role !== 'ADMIN' && req.user!.role !== 'HR') {
      throw new AppError('Insufficient permissions', 403);
    }

    const { title, message, priority = 'NORMAL', channels, targetRole } = req.body;

    if (!title || !message) {
      throw new AppError('Title and message are required', 400);
    }

    // For demo purposes, we'll send to the current user
    // In a real implementation, this would send to all users or filtered users
    const notification = await advancedNotificationService.sendNotification({
      id: `broadcast_${Date.now()}`,
      userId: req.user!.id,
      type: 'SYSTEM_MAINTENANCE' as any,
      title,
      message,
      priority: priority as NotificationPriority,
      channels: channels || [NotificationChannel.WEBSOCKET, NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      metadata: {
        broadcast: true,
        role: targetRole,
        sender: req.user!.id
      }
    });

    res.json({
      success: true,
      message: 'Broadcast notification sent successfully',
      data: { notificationId: notification.id }
    });
  })
);

export default router;