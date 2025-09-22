import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { monitoringService } from '../services/monitoringService';

// Extend Request interface to include custom properties
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      startTime?: number;
      correlationId?: string;
    }
  }
}

/**
 * Middleware to add request ID, timing, and enhanced logging
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  // Generate or use existing request ID
  req.requestId = req.headers['x-request-id'] as string || generateRequestId();
  req.startTime = Date.now();
  req.correlationId = req.headers['x-correlation-id'] as string || req.requestId;

  // Add request ID to response headers
  res.setHeader('x-request-id', req.requestId);
  res.setHeader('x-correlation-id', req.correlationId);

  // Log incoming request
  const requestInfo = {
    requestId: req.requestId,
    correlationId: req.correlationId,
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    referer: req.get('Referer'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    query: req.query,
    params: req.params,
    timestamp: new Date().toISOString(),
    headers: sanitizeHeaders(req.headers)
  };

  logger.info('Incoming request', requestInfo);

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body) {
    const responseTime = Date.now() - req.startTime!;
    const isError = res.statusCode >= 400;

    // Record metrics
    monitoringService.recordRequest(responseTime, isError);

    const responseInfo = {
      requestId: req.requestId,
      correlationId: req.correlationId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime,
      contentLength: JSON.stringify(body).length,
      timestamp: new Date().toISOString(),
      success: body?.success !== false
    };

    // Log response with appropriate level
    const logLevel = isError ? 'warn' : 'info';
    logger[logLevel]('Outgoing response', responseInfo);

    // Add performance headers
    res.setHeader('x-response-time', `${responseTime}ms`);

    // Call original json method
    return originalJson.call(this, body);
  };

  next();
};

/**
 * Performance monitoring middleware
 */
export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const startMemory = process.memoryUsage();

  res.on('finish', () => {
    const endMemory = process.memoryUsage();
    const responseTime = Date.now() - req.startTime!;

    const performanceMetrics = {
      requestId: req.requestId,
      correlationId: req.correlationId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime,
      memoryUsage: {
        heapUsedDelta: endMemory.heapUsed - startMemory.heapUsed,
        heapTotalDelta: endMemory.heapTotal - startMemory.heapTotal,
        externalDelta: endMemory.external - startMemory.external,
        arrayBuffersDelta: endMemory.arrayBuffers - startMemory.arrayBuffers
      },
      cpuUsage: process.cpuUsage(),
      uptime: process.uptime()
    };

    // Log performance metrics for slow requests (>1000ms)
    if (responseTime > 1000) {
      logger.warn('Slow request detected', performanceMetrics);
    } else if (process.env.NODE_ENV === 'development') {
      logger.debug('Performance metrics', performanceMetrics);
    }

    // In production, send metrics to monitoring system
    if (process.env.NODE_ENV === 'production') {
      // sendToMetricsCollector(performanceMetrics);
    }
  });

  next();
};

/**
 * Request rate monitoring middleware
 */
const requestCounts = new Map<string, { count: number; windowStart: number }>();
const RATE_WINDOW_MS = 60000; // 1 minute window

export const requestRateMonitor = (req: Request, res: Response, next: NextFunction) => {
  const clientId = req.ip || 'unknown';
  const now = Date.now();
  const windowStart = Math.floor(now / RATE_WINDOW_MS) * RATE_WINDOW_MS;

  let requestData = requestCounts.get(clientId);

  if (!requestData || requestData.windowStart !== windowStart) {
    requestData = { count: 0, windowStart };
    requestCounts.set(clientId, requestData);
  }

  requestData.count++;

  // Log high request rates (>100 requests per minute)
  if (requestData.count > 100) {
    logger.warn('High request rate detected', {
      clientId,
      requestCount: requestData.count,
      windowStart: new Date(windowStart).toISOString(),
      requestId: req.requestId,
      userAgent: req.get('User-Agent'),
      method: req.method,
      url: req.url
    });
  }

  next();
};

// Helper functions
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function sanitizeHeaders(headers: any): any {
  const sanitized = { ...headers };
  // Remove sensitive headers for logging
  delete sanitized.authorization;
  delete sanitized.cookie;
  delete sanitized['x-api-key'];
  delete sanitized['set-cookie'];
  return sanitized;
}

// Clean up old request counts periodically
setInterval(() => {
  const now = Date.now();
  const cutoff = now - (RATE_WINDOW_MS * 2); // Keep 2 windows worth of data

  for (const [clientId, data] of requestCounts.entries()) {
    if (data.windowStart < cutoff) {
      requestCounts.delete(clientId);
    }
  }
}, RATE_WINDOW_MS);

// Export request metrics for monitoring endpoints
export const getRequestMetrics = () => {
  return {
    activeClients: requestCounts.size,
    requestCounts: Object.fromEntries(requestCounts.entries())
  };
};