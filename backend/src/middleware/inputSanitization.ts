import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { sanitize } from './validation';

/**
 * Comprehensive input sanitization middleware
 * Sanitizes user input to prevent XSS, SQL injection, and other attacks
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const requestId = (req as any).requestId;
  const startTime = Date.now();

  try {
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body, requestId);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query, requestId);
    }

    // Sanitize URL parameters
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params, requestId);
    }

    const sanitizationTime = Date.now() - startTime;

    // Log sanitization metrics for monitoring
    logger.debug('Input sanitization completed', {
      requestId,
      sanitizationTime,
      method: req.method,
      url: req.url,
      hasBody: !!req.body,
      hasQuery: !!Object.keys(req.query || {}).length,
      hasParams: !!Object.keys(req.params || {}).length
    });

    next();
  } catch (error) {
    logger.error('Input sanitization failed', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      method: req.method,
      url: req.url
    });

    // Continue with original input if sanitization fails
    // This ensures the application doesn't break due to sanitization issues
    next();
  }
};

/**
 * Recursively sanitize an object
 */
function sanitizeObject(obj: any, requestId?: string): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, requestId));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};

    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = sanitizeString(key);
      sanitized[sanitizedKey] = sanitizeObject(value, requestId);
    }

    return sanitized;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  return obj;
}

/**
 * Sanitize a string value
 */
function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return input;
  }

  let sanitized = input;

  // Remove potentially malicious HTML/script content
  sanitized = sanitize.html(sanitized);

  // Remove SQL injection patterns
  sanitized = sanitize.sql(sanitized);

  // Normalize whitespace
  sanitized = sanitize.string(sanitized);

  // Limit string length to prevent DoS attacks
  if (sanitized.length > 10000) {
    sanitized = sanitized.substring(0, 10000);
  }

  return sanitized;
}

/**
 * Advanced sanitization for specific field types
 */
export const sanitizeFields = {
  /**
   * Sanitize email field
   */
  email: (email: string): string => {
    if (typeof email !== 'string') return email;
    return sanitize.email(email);
  },

  /**
   * Sanitize phone number
   */
  phone: (phone: string): string => {
    if (typeof phone !== 'string') return phone;
    return phone.replace(/[^\d\s\-\+\(\)]/g, '').trim();
  },

  /**
   * Sanitize numeric input
   */
  number: (value: any): number | null => {
    const num = Number(value);
    return isNaN(num) ? null : num;
  },

  /**
   * Sanitize boolean input
   */
  boolean: (value: any): boolean => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value === '1';
    }
    return Boolean(value);
  },

  /**
   * Sanitize date input
   */
  date: (value: any): Date | null => {
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    }
    return null;
  },

  /**
   * Sanitize file name
   */
  filename: (filename: string): string => {
    if (typeof filename !== 'string') return filename;

    // Remove dangerous characters
    return filename
      .replace(/[<>:"|?*]/g, '')
      .replace(/\.\./g, '')
      .replace(/\//g, '_')
      .replace(/\\/g, '_')
      .trim();
  },

  /**
   * Sanitize URL
   */
  url: (url: string): string => {
    if (typeof url !== 'string') return url;

    try {
      const parsed = new URL(url);
      // Only allow HTTP and HTTPS protocols
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return '';
      }
      return parsed.href;
    } catch {
      return '';
    }
  }
};

/**
 * Content Security Policy helper
 */
export const generateCSPNonce = (): string => {
  return Buffer.from(Math.random().toString()).toString('base64').substring(0, 16);
};

/**
 * Rate limiting for input validation
 */
const validationAttempts = new Map<string, { count: number; resetTime: number }>();
const MAX_VALIDATION_ATTEMPTS = 100;
const VALIDATION_WINDOW = 60000; // 1 minute

export const validateInputRate = (req: Request, res: Response, next: NextFunction) => {
  const clientId = req.ip || 'unknown';
  const now = Date.now();

  let attempts = validationAttempts.get(clientId);

  if (!attempts || now > attempts.resetTime) {
    attempts = { count: 1, resetTime: now + VALIDATION_WINDOW };
  } else {
    attempts.count++;
  }

  validationAttempts.set(clientId, attempts);

  if (attempts.count > MAX_VALIDATION_ATTEMPTS) {
    logger.warn('Input validation rate limit exceeded', {
      clientId,
      attempts: attempts.count,
      requestId: (req as any).requestId
    });

    return res.status(429).json({
      success: false,
      message: 'Too many validation requests. Please slow down.',
      retryAfter: Math.ceil((attempts.resetTime - now) / 1000)
    });
  }

  next();
};

// Clean up old validation attempts periodically
setInterval(() => {
  const now = Date.now();
  for (const [clientId, attempts] of validationAttempts.entries()) {
    if (now > attempts.resetTime) {
      validationAttempts.delete(clientId);
    }
  }
}, VALIDATION_WINDOW);