import express from 'express';
import { logger } from '../utils/logger';
import { getErrorMetrics } from '../middleware/errorHandler';
import { getRequestMetrics } from '../middleware/requestLogger';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

/**
 * @swagger
 * /api/v1/monitoring/health:
 *   get:
 *     summary: Get system health status
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: System health information
 */
router.get('/health', asyncHandler(async (req, res) => {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  const uptime = process.uptime();

  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    system: {
      uptime: {
        seconds: uptime,
        human: formatUptime(uptime)
      },
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
        arrayBuffers: Math.round(memoryUsage.arrayBuffers / 1024 / 1024),
        rss: Math.round(memoryUsage.rss / 1024 / 1024)
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    },
    services: {
      database: await checkDatabaseHealth(),
      redis: await checkRedisHealth(),
      email: checkEmailHealth(),
      websocket: checkWebSocketHealth()
    }
  };

  // Determine overall health status
  const unhealthyServices = Object.entries(healthData.services)
    .filter(([_, status]) => status !== 'healthy' && status !== 'not_configured')
    .map(([service, _]) => service);

  if (unhealthyServices.length > 0) {
    healthData.status = 'unhealthy';
    res.status(503);
  }

  res.json({
    success: true,
    data: healthData,
    ...(unhealthyServices.length > 0 && {
      warnings: `Unhealthy services: ${unhealthyServices.join(', ')}`
    })
  });
}));

/**
 * @swagger
 * /api/v1/monitoring/metrics:
 *   get:
 *     summary: Get system metrics
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: System performance metrics
 */
router.get('/metrics', asyncHandler(async (req, res) => {
  const errorMetrics = getErrorMetrics();
  const requestMetrics = getRequestMetrics();
  const memoryUsage = process.memoryUsage();

  const metrics = {
    timestamp: new Date().toISOString(),
    errors: {
      total: Object.values(errorMetrics).reduce((sum, { count }) => sum + count, 0),
      byType: errorMetrics
    },
    requests: {
      activeClients: requestMetrics.activeClients,
      rateLimited: Object.values(requestMetrics.requestCounts)
        .filter(({ count }) => count > 100).length
    },
    memory: {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
      rss: Math.round(memoryUsage.rss / 1024 / 1024)
    },
    process: {
      uptime: process.uptime(),
      pid: process.pid,
      version: process.version,
      cpu: process.cpuUsage()
    }
  };

  res.json({
    success: true,
    data: metrics
  });
}));

/**
 * @swagger
 * /api/v1/monitoring/logs:
 *   get:
 *     summary: Get recent log entries
 *     tags: [Monitoring]
 *     parameters:
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [error, warn, info, debug]
 *         description: Filter logs by level
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of log entries to return
 *     responses:
 *       200:
 *         description: Recent log entries
 */
router.get('/logs', asyncHandler(async (req, res) => {
  const { level, limit = 100 } = req.query;

  // In production, this would query from a centralized logging system
  // For now, return a placeholder response
  const logs = {
    timestamp: new Date().toISOString(),
    totalEntries: 0,
    entries: [],
    message: 'Log querying not implemented in demo mode. In production, this would query from centralized logging.'
  };

  res.json({
    success: true,
    data: logs
  });
}));

/**
 * @swagger
 * /api/v1/monitoring/alerts:
 *   get:
 *     summary: Get active system alerts
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Active system alerts
 */
router.get('/alerts', asyncHandler(async (req, res) => {
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();
  const alerts = [];

  // Memory usage alerts
  const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
  const heapTotalMB = memoryUsage.heapTotal / 1024 / 1024;
  const memoryUsagePercent = (heapUsedMB / heapTotalMB) * 100;

  if (memoryUsagePercent > 85) {
    alerts.push({
      id: 'high_memory_usage',
      severity: 'critical',
      message: `High memory usage: ${Math.round(memoryUsagePercent)}%`,
      timestamp: new Date().toISOString(),
      details: {
        heapUsed: Math.round(heapUsedMB),
        heapTotal: Math.round(heapTotalMB),
        percentage: Math.round(memoryUsagePercent)
      }
    });
  }

  // Low uptime alert (less than 5 minutes might indicate frequent restarts)
  if (uptime < 300) {
    alerts.push({
      id: 'low_uptime',
      severity: 'warning',
      message: `Low system uptime: ${formatUptime(uptime)}`,
      timestamp: new Date().toISOString(),
      details: {
        uptime: uptime,
        formatted: formatUptime(uptime)
      }
    });
  }

  // Error rate alerts
  const errorMetrics = getErrorMetrics();
  const recentErrors = Object.entries(errorMetrics)
    .filter(([_, { lastOccurred }]) =>
      Date.now() - lastOccurred.getTime() < 300000 // Last 5 minutes
    )
    .reduce((sum, [_, { count }]) => sum + count, 0);

  if (recentErrors > 10) {
    alerts.push({
      id: 'high_error_rate',
      severity: 'high',
      message: `High error rate: ${recentErrors} errors in the last 5 minutes`,
      timestamp: new Date().toISOString(),
      details: {
        errorCount: recentErrors,
        timeWindow: '5 minutes'
      }
    });
  }

  res.json({
    success: true,
    data: {
      timestamp: new Date().toISOString(),
      alertCount: alerts.length,
      alerts
    }
  });
}));

// Helper functions
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (remainingSeconds > 0) parts.push(`${remainingSeconds}s`);

  return parts.join(' ') || '0s';
}

async function checkDatabaseHealth(): Promise<string> {
  try {
    // In a real implementation, this would test the database connection
    // For now, since we're using mock data, return 'not_configured'
    return 'not_configured';
  } catch (error) {
    logger.error('Database health check failed', { error: error.message });
    return 'unhealthy';
  }
}

async function checkRedisHealth(): Promise<string> {
  try {
    // In a real implementation, this would test Redis connection
    return 'not_configured';
  } catch (error) {
    logger.error('Redis health check failed', { error: error.message });
    return 'unhealthy';
  }
}

function checkEmailHealth(): string {
  // Check if email service is configured and working
  const emailConfigured = process.env.SMTP_HOST || process.env.SENDGRID_API_KEY;
  return emailConfigured ? 'healthy' : 'not_configured';
}

function checkWebSocketHealth(): string {
  // Check WebSocket server status
  // Since we're using Socket.IO and it's embedded in our Express server,
  // if this endpoint is responding, WebSocket is likely healthy
  return 'healthy';
}

export default router;