import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Error categories for better classification
export enum ErrorCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK',
  SYSTEM = 'SYSTEM',
  RATE_LIMIT = 'RATE_LIMIT'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  category?: ErrorCategory;
  severity?: ErrorSeverity;
  code?: string;
  details?: Record<string, any>;
  correlationId?: string;
}

export class AppError extends Error implements ApiError {
  statusCode: number;
  isOperational: boolean;
  category: ErrorCategory;
  severity: ErrorSeverity;
  code: string;
  details: Record<string, any>;
  correlationId: string;

  constructor(
    message: string,
    statusCode: number,
    category: ErrorCategory = ErrorCategory.SYSTEM,
    options: {
      code?: string;
      severity?: ErrorSeverity;
      details?: Record<string, any>;
      correlationId?: string;
    } = {}
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.category = category;
    this.code = options.code || `ERR_${category}_${statusCode}`;
    this.severity = options.severity || this.getSeverityFromStatusCode(statusCode);
    this.details = options.details || {};
    this.correlationId = options.correlationId || this.generateCorrelationId();

    Error.captureStackTrace(this, this.constructor);
  }

  private getSeverityFromStatusCode(statusCode: number): ErrorSeverity {
    if (statusCode >= 500) return ErrorSeverity.CRITICAL;
    if (statusCode >= 400) return ErrorSeverity.HIGH;
    if (statusCode >= 300) return ErrorSeverity.MEDIUM;
    return ErrorSeverity.LOW;
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Enhanced error creation helpers
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>, correlationId?: string) {
    super(message, 400, ErrorCategory.VALIDATION, {
      code: 'VALIDATION_ERROR',
      severity: ErrorSeverity.MEDIUM,
      details,
      correlationId
    });
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', correlationId?: string) {
    super(message, 401, ErrorCategory.AUTHENTICATION, {
      code: 'AUTH_ERROR',
      severity: ErrorSeverity.HIGH,
      correlationId
    });
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', correlationId?: string) {
    super(message, 403, ErrorCategory.AUTHORIZATION, {
      code: 'AUTHZ_ERROR',
      severity: ErrorSeverity.HIGH,
      correlationId
    });
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string, correlationId?: string) {
    super(`${resource}${id ? ` with ID ${id}` : ''} not found`, 404, ErrorCategory.BUSINESS_LOGIC, {
      code: 'NOT_FOUND',
      severity: ErrorSeverity.MEDIUM,
      details: { resource, id },
      correlationId
    });
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, operation: string, correlationId?: string) {
    super(message, 500, ErrorCategory.DATABASE, {
      code: 'DATABASE_ERROR',
      severity: ErrorSeverity.CRITICAL,
      details: { operation },
      correlationId
    });
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, statusCode: number = 503, correlationId?: string) {
    super(`External service error (${service}): ${message}`, statusCode, ErrorCategory.EXTERNAL_SERVICE, {
      code: 'EXTERNAL_SERVICE_ERROR',
      severity: ErrorSeverity.HIGH,
      details: { service },
      correlationId
    });
  }
}

export class RateLimitError extends AppError {
  constructor(limit: number, windowMs: number, correlationId?: string) {
    super(`Rate limit exceeded: ${limit} requests per ${windowMs}ms`, 429, ErrorCategory.RATE_LIMIT, {
      code: 'RATE_LIMIT_EXCEEDED',
      severity: ErrorSeverity.MEDIUM,
      details: { limit, windowMs },
      correlationId
    });
  }
}

export const createError = (message: string, statusCode: number = 500): AppError => {
  return new AppError(message, statusCode);
};

// Error metrics storage (in production, use Redis or external monitoring)
const errorMetrics = new Map<string, { count: number; lastOccurred: Date }>();

// Rate limit for error notifications (prevent spam)
const errorNotificationLimits = new Map<string, Date>();

export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestId = req.headers['x-request-id'] as string || generateRequestId();
  let { statusCode = 500, message, category, severity, code, details, correlationId } = error;

  // Update error metrics
  updateErrorMetrics(code || 'UNKNOWN_ERROR');

  // Enhanced error logging with structured data
  const errorInfo = {
    timestamp: new Date().toISOString(),
    requestId,
    correlationId,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      statusCode,
      category,
      severity,
      code,
      details,
      isOperational: error.isOperational
    },
    request: {
      method: req.method,
      url: req.url,
      originalUrl: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      headers: sanitizeHeaders(req.headers),
      query: req.query,
      params: req.params,
      body: sanitizeRequestBody(req.body),
      userId: (req as any).user?.id,
      sessionId: (req as any).sessionID || 'unknown'
    },
    performance: {
      responseTime: Date.now() - (req as any).startTime,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    }
  };

  // Log with appropriate level based on severity
  const logLevel = getLogLevel(severity || ErrorSeverity.MEDIUM);
  logger[logLevel](errorInfo);

  // Send critical errors to monitoring systems (implement in production)
  if (severity === ErrorSeverity.CRITICAL) {
    // sendToMonitoringSystem(errorInfo);
    notifyOperationsTeam(errorInfo);
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && !error.isOperational) {
    message = 'Something went wrong';
    statusCode = 500;
    details = {};
  }

  // Add helpful error recovery suggestions
  const suggestions = getErrorSuggestions(category, statusCode);

  res.status(statusCode).json({
    success: false,
    message,
    code,
    correlationId,
    requestId,
    ...(details && Object.keys(details).length > 0 && { details }),
    ...(suggestions && { suggestions }),
    ...(process.env.NODE_ENV === 'development' && {
      category,
      severity,
      stack: error.stack,
      debug: {
        timestamp: errorInfo.timestamp,
        performance: errorInfo.performance
      }
    })
  });
};

// Helper functions
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function updateErrorMetrics(errorCode: string): void {
  const current = errorMetrics.get(errorCode) || { count: 0, lastOccurred: new Date() };
  errorMetrics.set(errorCode, {
    count: current.count + 1,
    lastOccurred: new Date()
  });
}

function getLogLevel(severity: ErrorSeverity): 'error' | 'warn' | 'info' {
  switch (severity) {
    case ErrorSeverity.CRITICAL:
    case ErrorSeverity.HIGH:
      return 'error';
    case ErrorSeverity.MEDIUM:
      return 'warn';
    default:
      return 'info';
  }
}

function sanitizeHeaders(headers: any): any {
  const sanitized = { ...headers };
  // Remove sensitive headers
  delete sanitized.authorization;
  delete sanitized.cookie;
  delete sanitized['x-api-key'];
  return sanitized;
}

function sanitizeRequestBody(body: any): any {
  if (!body || typeof body !== 'object') return body;

  const sanitized = { ...body };
  // Remove sensitive fields
  delete sanitized.password;
  delete sanitized.token;
  delete sanitized.secret;
  delete sanitized.apiKey;

  return sanitized;
}

function getErrorSuggestions(category?: ErrorCategory, statusCode?: number): string[] | undefined {
  const suggestions: string[] = [];

  switch (category) {
    case ErrorCategory.AUTHENTICATION:
      suggestions.push('Please verify your credentials and try again');
      suggestions.push('If you forgot your password, use the reset password feature');
      break;
    case ErrorCategory.AUTHORIZATION:
      suggestions.push('Contact your administrator to request access');
      suggestions.push('Verify you are logged in with the correct account');
      break;
    case ErrorCategory.VALIDATION:
      suggestions.push('Check the required fields and their formats');
      suggestions.push('Ensure all data meets the validation requirements');
      break;
    case ErrorCategory.RATE_LIMIT:
      suggestions.push('Wait a moment before making another request');
      suggestions.push('Consider implementing request queuing in your application');
      break;
    case ErrorCategory.EXTERNAL_SERVICE:
      suggestions.push('Please try again in a few minutes');
      suggestions.push('If the problem persists, contact support');
      break;
  }

  if (statusCode === 404) {
    suggestions.push('Check the URL and ensure the resource exists');
  }

  return suggestions.length > 0 ? suggestions : undefined;
}

function notifyOperationsTeam(errorInfo: any): void {
  // Rate limit notifications to prevent spam
  const key = `${errorInfo.error.code}_${errorInfo.error.category}`;
  const lastNotification = errorNotificationLimits.get(key);
  const now = new Date();

  // Only notify once per hour for the same error type
  if (!lastNotification || (now.getTime() - lastNotification.getTime()) > 3600000) {
    errorNotificationLimits.set(key, now);

    // In production, integrate with services like:
    // - Slack/Teams notifications
    // - PagerDuty alerts
    // - Email notifications
    // - SMS alerts for critical errors

    logger.warn('CRITICAL ERROR - Operations team should be notified', {
      errorCode: errorInfo.error.code,
      category: errorInfo.error.category,
      message: errorInfo.error.message,
      correlationId: errorInfo.correlationId
    });
  }
}

// Export error metrics for monitoring endpoints
export const getErrorMetrics = () => {
  return Object.fromEntries(errorMetrics.entries());
};

// Async error handler wrapper
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};