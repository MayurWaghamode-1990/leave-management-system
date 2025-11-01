import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import { userService } from '../services/userService';
import { UserRole } from '../types/enums';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    userId: string;
    email: string;
    role: UserRole;
    employeeId: string;
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!process.env.JWT_SECRET) {
      throw new AppError('JWT secret not configured', 500);
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
      userId: string;
      email: string;
      role: UserRole;
    };

    // Fetch user from database
    // SECURITY FIX: Removed mock user bypass (MEDIUM vulnerability fix)
    // All users must exist in database - no fallback to hardcoded users
    const user = await userService.getUserById(decoded.userId);

    if (!user) {
      logger.warn(`Authentication failed: User not found in database - ${decoded.userId}`);
      throw new AppError('User not found or has been deleted', 401);
    }

    // Additional security check: verify user status is ACTIVE
    if (user.status !== 'ACTIVE') {
      logger.warn(`Authentication failed: User status is ${user.status} - ${decoded.userId}`);
      throw new AppError('User account is not active', 401);
    }

    req.user = {
      id: user.id,
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
      employeeId: user.employeeId,
    };
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        error: 'Authentication failed',
        code: 'INVALID_TOKEN'
      });
    }
    if (error instanceof AppError) {
      return res.status(error.statusCode || 401).json({
        success: false,
        message: error.message,
        error: 'Authentication failed',
        code: 'AUTH_ERROR'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error instanceof Error ? error.message : 'Internal server error',
      code: 'AUTH_ERROR'
    });
  }
};

export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'Unauthorized access',
        code: 'AUTH_REQUIRED'
      });
    }

    console.log('Authorization check (updated):', {
      userRole: req.user.role,
      allowedRoles,
      userRoleType: typeof req.user.role,
      includes: allowedRoles.includes(req.user.role)
    });

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        error: 'Access denied',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

export const authorizeEmployeeAccess = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'Unauthorized access',
      code: 'AUTH_REQUIRED'
    });
  }

  const targetUserId = req.params.id;

  // Allow if accessing own data or if HR_ADMIN/IT_ADMIN
  if (
    req.user.userId === targetUserId ||
    req.user.role === 'HR_ADMIN' ||
    req.user.role === 'IT_ADMIN'
  ) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
      error: 'Insufficient permissions',
      code: 'ACCESS_DENIED'
    });
  }
};