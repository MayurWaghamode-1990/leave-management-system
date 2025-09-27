import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import helmet from 'helmet';
import { RateLimitError, AppError } from './errorHandler';
import { logger } from '../utils/logger';

// Advanced rate limiting configurations
export const createRateLimiters = () => {
  // General API rate limiting
  const generalRateLimit = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'),
    message: {
      success: false,
      message: 'Too many requests from this IP. Please try again later.',
      retryAfter: 900 // seconds
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
      const rateLimitError = new RateLimitError(
        parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'),
        parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
        (req as any).correlationId
      );

      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url,
        method: req.method,
        requestId: (req as any).requestId
      });

      next(rateLimitError);
    },
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise IP
      const user = (req as any).user;
      return user?.id || req.ip || 'unknown';
    },
    validate: {
      onLimitReached: false // Disable deprecated onLimitReached validation warning
    }
  });

  // Authentication rate limiting (stricter)
  const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'development' ? 1000 : 10, // Much more lenient in development for testing
    message: {
      success: false,
      message: 'Too many authentication attempts. Please try again later.',
      retryAfter: 900
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
      logger.warn('Authentication rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        requestId: (req as any).requestId
      });

      const rateLimitError = new RateLimitError(10, 15 * 60 * 1000, (req as any).correlationId);
      next(rateLimitError);
    },
    validate: {
      onLimitReached: false
    }
  });

  // Password reset rate limiting (very strict)
  const passwordResetRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 password reset requests per hour
    message: {
      success: false,
      message: 'Too many password reset attempts. Please try again in an hour.',
      retryAfter: 3600
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
      logger.warn('Password reset rate limit exceeded', {
        ip: req.ip,
        email: req.body?.email,
        requestId: (req as any).requestId
      });

      const rateLimitError = new RateLimitError(3, 60 * 60 * 1000, (req as any).correlationId);
      next(rateLimitError);
    },
    validate: {
      onLimitReached: false
    }
  });

  // API endpoint specific rate limiting
  const createLeaveRateLimit = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // Limit to 5 leave requests per 5 minutes per user
    message: {
      success: false,
      message: 'Too many leave requests. Please wait before submitting another request.',
      retryAfter: 300
    },
    keyGenerator: (req) => {
      const user = (req as any).user;
      return user?.id || req.ip || 'unknown';
    }
  });

  return {
    general: generalRateLimit,
    auth: authRateLimit,
    passwordReset: passwordResetRateLimit,
    createLeave: createLeaveRateLimit
  };
};

// Request speed limiter (progressively slow down requests)
export const createSpeedLimiters = () => {
  const generalSpeedLimit = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 100, // Start slowing down after 100 requests
    // Use the new delayMs function signature with request context
    delayMs: (used, req) => {
      const delayAfter = (req as any).slowDown?.limit || 100;
      return Math.min((used - delayAfter) * 500, 5000); // Progressive delay up to 5 seconds
    },
    maxDelayMs: 5000, // Maximum delay of 5 seconds
    validate: {
      delayMs: false, // Disable delayMs validation warning
      onLimitReached: false // Disable onLimitReached validation warning
    },
    skipFailedRequests: false,
    skipSuccessfulRequests: false
  });

  return {
    general: generalSpeedLimit
  };
};

// Enhanced security headers
export const createSecurityHeaders = () => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow cross-origin requests for APIs
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    frameguard: { action: 'deny' },
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
  });
};

// IP whitelist/blacklist middleware
const blockedIPs = new Set<string>();
const whitelistedIPs = new Set<string>([
  '127.0.0.1',
  '::1',
  'localhost'
]);

export const ipFilterMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip || req.socket.remoteAddress || 'unknown';

  // Check if IP is blocked
  if (blockedIPs.has(clientIP)) {
    logger.warn('Blocked IP attempted access', {
      ip: clientIP,
      url: req.url,
      userAgent: req.get('User-Agent'),
      requestId: (req as any).requestId
    });

    return res.status(403).json({
      success: false,
      message: 'Access denied',
      code: 'IP_BLOCKED'
    });
  }

  // Log non-whitelisted IPs for monitoring
  if (!whitelistedIPs.has(clientIP)) {
    logger.info('External IP access', {
      ip: clientIP,
      url: req.url,
      userAgent: req.get('User-Agent'),
      requestId: (req as any).requestId
    });
  }

  next();
};

// Suspicious activity detection
const suspiciousActivityStore = new Map<string, SuspiciousActivity>();

interface SuspiciousActivity {
  failedLogins: number;
  rapidRequests: number;
  sqlInjectionAttempts: number;
  xssAttempts: number;
  lastActivity: Date;
  score: number;
}

export const suspiciousActivityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const clientKey = (req as any).user?.id || req.ip || 'unknown';
  const now = new Date();

  let activity = suspiciousActivityStore.get(clientKey);
  if (!activity) {
    activity = {
      failedLogins: 0,
      rapidRequests: 0,
      sqlInjectionAttempts: 0,
      xssAttempts: 0,
      lastActivity: now,
      score: 0
    };
  }

  // Reset activity if it's been more than an hour
  if (now.getTime() - activity.lastActivity.getTime() > 60 * 60 * 1000) {
    activity = {
      failedLogins: 0,
      rapidRequests: 0,
      sqlInjectionAttempts: 0,
      xssAttempts: 0,
      lastActivity: now,
      score: 0
    };
  }

  // Check for rapid requests
  if (now.getTime() - activity.lastActivity.getTime() < 1000) {
    activity.rapidRequests++;
  }

  // Check for potential SQL injection in query parameters and body
  const sqlInjectionPatterns = [
    /(\bUNION\b.*\bSELECT\b)|(\bSELECT\b.*\bFROM\b)|(\bDROP\b.*\bTABLE\b)|(\bINSERT\b.*\bINTO\b)|(\bUPDATE\b.*\bSET\b)|(\bDELETE\b.*\bFROM\b)/i,
    /'.*OR.*'.*=.*'/i,
    /;\s*(DROP|DELETE|UPDATE|INSERT)/i
  ];

  const checkForSqlInjection = (obj: any): boolean => {
    if (typeof obj === 'string') {
      return sqlInjectionPatterns.some(pattern => pattern.test(obj));
    }
    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj).some(value => checkForSqlInjection(value));
    }
    return false;
  };

  if (checkForSqlInjection(req.query) || checkForSqlInjection(req.body)) {
    activity.sqlInjectionAttempts++;
    logger.warn('Potential SQL injection attempt detected', {
      ip: req.ip,
      url: req.url,
      method: req.method,
      query: req.query,
      requestId: (req as any).requestId
    });
  }

  // Check for XSS attempts
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=\s*["'][^"']*["']/gi
  ];

  const checkForXss = (obj: any): boolean => {
    if (typeof obj === 'string') {
      return xssPatterns.some(pattern => pattern.test(obj));
    }
    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj).some(value => checkForXss(value));
    }
    return false;
  };

  if (checkForXss(req.query) || checkForXss(req.body)) {
    activity.xssAttempts++;
    logger.warn('Potential XSS attempt detected', {
      ip: req.ip,
      url: req.url,
      method: req.method,
      requestId: (req as any).requestId
    });
  }

  // Calculate suspiciousness score
  activity.score =
    activity.failedLogins * 10 +
    activity.rapidRequests * 2 +
    activity.sqlInjectionAttempts * 50 +
    activity.xssAttempts * 30;

  activity.lastActivity = now;
  suspiciousActivityStore.set(clientKey, activity);

  // Block if score is too high
  if (activity.score > 100) {
    logger.error('High suspiciousness score detected - blocking request', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      score: activity.score,
      activity,
      requestId: (req as any).requestId
    });

    // Add IP to blocklist temporarily
    if (req.ip) {
      blockedIPs.add(req.ip);
      // Remove from blocklist after 1 hour
      setTimeout(() => {
        blockedIPs.delete(req.ip!);
      }, 60 * 60 * 1000);
    }

    return res.status(429).json({
      success: false,
      message: 'Suspicious activity detected. Access temporarily restricted.',
      code: 'SUSPICIOUS_ACTIVITY'
    });
  }

  // Add activity to request for later use
  (req as any).suspiciousActivity = activity;

  next();
};

// Track failed login attempts
export const trackFailedLogin = (clientKey: string) => {
  const activity = suspiciousActivityStore.get(clientKey) || {
    failedLogins: 0,
    rapidRequests: 0,
    sqlInjectionAttempts: 0,
    xssAttempts: 0,
    lastActivity: new Date(),
    score: 0
  };

  activity.failedLogins++;
  activity.lastActivity = new Date();
  suspiciousActivityStore.set(clientKey, activity);
};

// Content validation middleware
export const contentValidationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Check for excessively large payloads
  const contentLength = parseInt(req.get('content-length') || '0');
  const maxSize = 10 * 1024 * 1024; // 10MB limit

  if (contentLength > maxSize) {
    logger.warn('Payload too large', {
      ip: req.ip,
      contentLength,
      maxSize,
      requestId: (req as any).requestId
    });

    return res.status(413).json({
      success: false,
      message: 'Payload too large',
      maxSize: '10MB'
    });
  }

  // Validate content type for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('content-type');
    const allowedTypes = [
      'application/json',
      'application/x-www-form-urlencoded',
      'multipart/form-data'
    ];

    if (contentType && !allowedTypes.some(type => contentType.startsWith(type))) {
      logger.warn('Invalid content type', {
        ip: req.ip,
        contentType,
        method: req.method,
        requestId: (req as any).requestId
      });

      return res.status(415).json({
        success: false,
        message: 'Unsupported media type',
        allowedTypes
      });
    }
  }

  next();
};

// API key validation middleware (for external integrations)
export const apiKeyValidationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.get('X-API-Key');

  if (req.path.startsWith('/api/external/')) {
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key required for external API access',
        code: 'API_KEY_MISSING'
      });
    }

    // In production, validate against database of API keys
    const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];

    if (!validApiKeys.includes(apiKey)) {
      logger.warn('Invalid API key used', {
        ip: req.ip,
        apiKeyPrefix: apiKey.substring(0, 8) + '...',
        requestId: (req as any).requestId
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid API key',
        code: 'API_KEY_INVALID'
      });
    }

    // Add API key info to request
    (req as any).apiKey = apiKey;
  }

  next();
};

// Security audit logging
export const securityAuditMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Log security-sensitive operations
  const securitySensitivePaths = [
    '/auth/login',
    '/auth/logout',
    '/auth/reset-password',
    '/auth/change-password',
    '/users',
    '/admin',
    '/monitoring'
  ];

  const isSecuritySensitive = securitySensitivePaths.some(path =>
    req.path.startsWith(path)
  );

  if (isSecuritySensitive) {
    logger.info('Security-sensitive operation', {
      ip: req.ip,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.id,
      requestId: (req as any).requestId,
      timestamp: new Date().toISOString()
    });
  }

  next();
};

// Clean up old suspicious activity records
setInterval(() => {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

  for (const [key, activity] of suspiciousActivityStore.entries()) {
    if (activity.lastActivity < cutoff) {
      suspiciousActivityStore.delete(key);
    }
  }

  logger.debug('Suspicious activity cleanup completed', {
    remainingRecords: suspiciousActivityStore.size
  });
}, 60 * 60 * 1000); // Run every hour

// Export utility functions
export const securityUtils = {
  blockIP: (ip: string, duration: number = 60 * 60 * 1000) => {
    blockedIPs.add(ip);
    setTimeout(() => {
      blockedIPs.delete(ip);
    }, duration);

    logger.warn('IP blocked', { ip, duration });
  },

  unblockIP: (ip: string) => {
    const wasBlocked = blockedIPs.delete(ip);
    if (wasBlocked) {
      logger.info('IP unblocked', { ip });
    }
    return wasBlocked;
  },

  getBlockedIPs: () => Array.from(blockedIPs),

  getSuspiciousActivity: () => {
    const activities: any[] = [];
    suspiciousActivityStore.forEach((activity, key) => {
      activities.push({ key, ...activity });
    });
    return activities.sort((a, b) => b.score - a.score);
  },

  clearSuspiciousActivity: (key: string) => {
    return suspiciousActivityStore.delete(key);
  }
};