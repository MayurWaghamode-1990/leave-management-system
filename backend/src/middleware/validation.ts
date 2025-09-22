import { Request, Response, NextFunction } from 'express';
import { ValidationError } from './errorHandler';
import { logger } from '../utils/logger';

// Validation rules for different data types
export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'email' | 'date' | 'array' | 'object' | 'uuid';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: string[] | number[];
  custom?: (value: any) => boolean | string;
  arrayOf?: ValidationRule;
  properties?: { [key: string]: ValidationRule };
}

export interface ValidationSchema {
  body?: { [key: string]: ValidationRule };
  query?: { [key: string]: ValidationRule };
  params?: { [key: string]: ValidationRule };
}

// Enhanced validation result interface
interface ValidationResult {
  isValid: boolean;
  errors: ValidationErrorDetail[];
}

interface ValidationErrorDetail {
  field: string;
  value: any;
  message: string;
  code: string;
  location: 'body' | 'query' | 'params';
}

// Validation error codes for better error handling
export enum ValidationErrorCode {
  REQUIRED = 'REQUIRED',
  INVALID_TYPE = 'INVALID_TYPE',
  INVALID_LENGTH = 'INVALID_LENGTH',
  INVALID_RANGE = 'INVALID_RANGE',
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_ENUM = 'INVALID_ENUM',
  CUSTOM_VALIDATION = 'CUSTOM_VALIDATION',
  INVALID_EMAIL = 'INVALID_EMAIL',
  INVALID_DATE = 'INVALID_DATE',
  INVALID_UUID = 'INVALID_UUID'
}

/**
 * Main validation middleware factory
 */
export const validate = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const result = validateRequest(req, schema);
    const validationTime = Date.now() - startTime;

    // Log validation metrics
    logger.debug('Input validation completed', {
      requestId: (req as any).requestId,
      validationTime,
      isValid: result.isValid,
      errorCount: result.errors.length,
      method: req.method,
      url: req.url
    });

    if (!result.isValid) {
      const validationError = new ValidationError(
        'Input validation failed',
        {
          errors: result.errors,
          validationTime,
          timestamp: new Date().toISOString()
        },
        (req as any).correlationId
      );

      logger.warn('Input validation failed', {
        requestId: (req as any).requestId,
        correlationId: (req as any).correlationId,
        method: req.method,
        url: req.url,
        errors: result.errors
      });

      return next(validationError);
    }

    next();
  };
};

/**
 * Validate request against schema
 */
function validateRequest(req: Request, schema: ValidationSchema): ValidationResult {
  const errors: ValidationErrorDetail[] = [];

  // Validate body
  if (schema.body) {
    errors.push(...validateObject(req.body || {}, schema.body, 'body'));
  }

  // Validate query parameters
  if (schema.query) {
    errors.push(...validateObject(req.query || {}, schema.query, 'query'));
  }

  // Validate URL parameters
  if (schema.params) {
    errors.push(...validateObject(req.params || {}, schema.params, 'params'));
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate an object against a set of rules
 */
function validateObject(
  data: any,
  rules: { [key: string]: ValidationRule },
  location: 'body' | 'query' | 'params'
): ValidationErrorDetail[] {
  const errors: ValidationErrorDetail[] = [];

  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];
    const fieldErrors = validateField(field, value, rule, location);
    errors.push(...fieldErrors);
  }

  return errors;
}

/**
 * Validate a single field against its rule
 */
function validateField(
  field: string,
  value: any,
  rule: ValidationRule,
  location: 'body' | 'query' | 'params'
): ValidationErrorDetail[] {
  const errors: ValidationErrorDetail[] = [];

  // Check required
  if (rule.required && (value === undefined || value === null || value === '')) {
    errors.push({
      field,
      value,
      message: `${field} is required`,
      code: ValidationErrorCode.REQUIRED,
      location
    });
    return errors; // Don't continue validation if required field is missing
  }

  // Skip further validation if field is not provided and not required
  if (value === undefined || value === null) {
    return errors;
  }

  // Type validation
  if (rule.type) {
    const typeError = validateType(field, value, rule.type, location);
    if (typeError) {
      errors.push(typeError);
      return errors; // Don't continue if type is wrong
    }
  }

  // Length validation for strings and arrays
  if (rule.minLength !== undefined || rule.maxLength !== undefined) {
    const lengthError = validateLength(field, value, rule, location);
    if (lengthError) errors.push(lengthError);
  }

  // Range validation for numbers
  if (rule.min !== undefined || rule.max !== undefined) {
    const rangeError = validateRange(field, value, rule, location);
    if (rangeError) errors.push(rangeError);
  }

  // Pattern validation
  if (rule.pattern) {
    const patternError = validatePattern(field, value, rule.pattern, location);
    if (patternError) errors.push(patternError);
  }

  // Enum validation
  if (rule.enum) {
    const enumError = validateEnum(field, value, rule.enum, location);
    if (enumError) errors.push(enumError);
  }

  // Array validation
  if (rule.arrayOf && Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const itemErrors = validateField(`${field}[${i}]`, value[i], rule.arrayOf, location);
      errors.push(...itemErrors);
    }
  }

  // Object validation
  if (rule.properties && typeof value === 'object' && !Array.isArray(value)) {
    const objectErrors = validateObject(value, rule.properties, location);
    errors.push(...objectErrors.map(error => ({
      ...error,
      field: `${field}.${error.field}`
    })));
  }

  // Custom validation
  if (rule.custom) {
    const customResult = rule.custom(value);
    if (typeof customResult === 'string') {
      errors.push({
        field,
        value,
        message: customResult,
        code: ValidationErrorCode.CUSTOM_VALIDATION,
        location
      });
    } else if (customResult === false) {
      errors.push({
        field,
        value,
        message: `${field} failed custom validation`,
        code: ValidationErrorCode.CUSTOM_VALIDATION,
        location
      });
    }
  }

  return errors;
}

/**
 * Validate field type
 */
function validateType(
  field: string,
  value: any,
  type: ValidationRule['type'],
  location: 'body' | 'query' | 'params'
): ValidationErrorDetail | null {
  switch (type) {
    case 'string':
      if (typeof value !== 'string') {
        return {
          field,
          value,
          message: `${field} must be a string`,
          code: ValidationErrorCode.INVALID_TYPE,
          location
        };
      }
      break;

    case 'number':
      const num = Number(value);
      if (isNaN(num)) {
        return {
          field,
          value,
          message: `${field} must be a valid number`,
          code: ValidationErrorCode.INVALID_TYPE,
          location
        };
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
        return {
          field,
          value,
          message: `${field} must be a boolean`,
          code: ValidationErrorCode.INVALID_TYPE,
          location
        };
      }
      break;

    case 'email':
      if (typeof value !== 'string' || !isValidEmail(value)) {
        return {
          field,
          value,
          message: `${field} must be a valid email address`,
          code: ValidationErrorCode.INVALID_EMAIL,
          location
        };
      }
      break;

    case 'date':
      if (!isValidDate(value)) {
        return {
          field,
          value,
          message: `${field} must be a valid date`,
          code: ValidationErrorCode.INVALID_DATE,
          location
        };
      }
      break;

    case 'uuid':
      if (!isValidUUID(value)) {
        return {
          field,
          value,
          message: `${field} must be a valid UUID`,
          code: ValidationErrorCode.INVALID_UUID,
          location
        };
      }
      break;

    case 'array':
      if (!Array.isArray(value)) {
        return {
          field,
          value,
          message: `${field} must be an array`,
          code: ValidationErrorCode.INVALID_TYPE,
          location
        };
      }
      break;

    case 'object':
      if (typeof value !== 'object' || Array.isArray(value)) {
        return {
          field,
          value,
          message: `${field} must be an object`,
          code: ValidationErrorCode.INVALID_TYPE,
          location
        };
      }
      break;
  }

  return null;
}

/**
 * Validate field length
 */
function validateLength(
  field: string,
  value: any,
  rule: ValidationRule,
  location: 'body' | 'query' | 'params'
): ValidationErrorDetail | null {
  const length = typeof value === 'string' ? value.length : Array.isArray(value) ? value.length : 0;

  if (rule.minLength !== undefined && length < rule.minLength) {
    return {
      field,
      value,
      message: `${field} must be at least ${rule.minLength} characters long`,
      code: ValidationErrorCode.INVALID_LENGTH,
      location
    };
  }

  if (rule.maxLength !== undefined && length > rule.maxLength) {
    return {
      field,
      value,
      message: `${field} must be no more than ${rule.maxLength} characters long`,
      code: ValidationErrorCode.INVALID_LENGTH,
      location
    };
  }

  return null;
}

/**
 * Validate number range
 */
function validateRange(
  field: string,
  value: any,
  rule: ValidationRule,
  location: 'body' | 'query' | 'params'
): ValidationErrorDetail | null {
  const num = Number(value);
  if (isNaN(num)) return null; // Type validation should catch this

  if (rule.min !== undefined && num < rule.min) {
    return {
      field,
      value,
      message: `${field} must be at least ${rule.min}`,
      code: ValidationErrorCode.INVALID_RANGE,
      location
    };
  }

  if (rule.max !== undefined && num > rule.max) {
    return {
      field,
      value,
      message: `${field} must be no more than ${rule.max}`,
      code: ValidationErrorCode.INVALID_RANGE,
      location
    };
  }

  return null;
}

/**
 * Validate pattern
 */
function validatePattern(
  field: string,
  value: any,
  pattern: RegExp,
  location: 'body' | 'query' | 'params'
): ValidationErrorDetail | null {
  if (typeof value !== 'string' || !pattern.test(value)) {
    return {
      field,
      value,
      message: `${field} format is invalid`,
      code: ValidationErrorCode.INVALID_FORMAT,
      location
    };
  }

  return null;
}

/**
 * Validate enum values
 */
function validateEnum(
  field: string,
  value: any,
  enumValues: string[] | number[],
  location: 'body' | 'query' | 'params'
): ValidationErrorDetail | null {
  if (!enumValues.includes(value)) {
    return {
      field,
      value,
      message: `${field} must be one of: ${enumValues.join(', ')}`,
      code: ValidationErrorCode.INVALID_ENUM,
      location
    };
  }

  return null;
}

// Helper functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidDate(date: any): boolean {
  if (typeof date === 'string') {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }
  return date instanceof Date && !isNaN(date.getTime());
}

function isValidUUID(uuid: any): boolean {
  if (typeof uuid !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Common validation schemas
export const commonValidations = {
  id: {
    type: 'string' as const,
    required: true,
    minLength: 1
  },

  pagination: {
    page: {
      type: 'number' as const,
      min: 1
    },
    limit: {
      type: 'number' as const,
      min: 1,
      max: 100
    }
  },

  email: {
    type: 'email' as const,
    required: true,
    maxLength: 255
  },

  password: {
    type: 'string' as const,
    required: true,
    minLength: 8,
    maxLength: 128,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
  },

  dateRange: {
    startDate: {
      type: 'date' as const,
      required: true
    },
    endDate: {
      type: 'date' as const,
      required: true,
      custom: (value: any, context: any) => {
        if (context && context.startDate && new Date(value) <= new Date(context.startDate)) {
          return 'endDate must be after startDate';
        }
        return true;
      }
    }
  }
};

// Sanitization functions
export const sanitize = {
  /**
   * Remove potentially dangerous HTML tags and scripts
   */
  html: (input: string): string => {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
      .replace(/on\w+\s*=\s*'[^']*'/gi, '');
  },

  /**
   * Remove SQL injection patterns
   */
  sql: (input: string): string => {
    return input.replace(/['";\\]/g, '');
  },

  /**
   * Trim whitespace and normalize
   */
  string: (input: string): string => {
    return input.trim().replace(/\s+/g, ' ');
  },

  /**
   * Sanitize email
   */
  email: (input: string): string => {
    return input.toLowerCase().trim();
  }
};