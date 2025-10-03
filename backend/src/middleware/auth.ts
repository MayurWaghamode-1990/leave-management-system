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
    let user = await userService.getUserById(decoded.userId);

    // If user not found in database, check for mock users
    if (!user) {
      const mockUsers = [
        {
          id: 'admin-001',
          employeeId: 'EMP001',
          email: 'admin@company.com',
          password: 'hashedPassword',
          firstName: 'System',
          lastName: 'Administrator',
          role: 'ADMIN',
          department: 'Human Resources',
          location: 'Bengaluru',
          reportingManagerId: null,
          joiningDate: new Date('2020-01-01'),
          status: 'ACTIVE',
          lastLogin: null,
          gender: 'FEMALE',
          maritalStatus: 'MARRIED',
          country: 'INDIA',
          createdAt: new Date('2020-01-01'),
          updatedAt: new Date('2020-01-01')
        },
        {
          id: 'emp-eng-001',
          employeeId: 'EMP002',
          email: 'user@company.com',
          password: 'hashedPassword',
          firstName: 'Arjun',
          lastName: 'Singh',
          role: 'EMPLOYEE',
          department: 'Engineering',
          location: 'Bengaluru',
          reportingManagerId: null,
          joiningDate: new Date('2021-06-15'),
          status: 'ACTIVE',
          lastLogin: null,
          gender: 'MALE',
          maritalStatus: 'MARRIED',
          country: 'INDIA',
          createdAt: new Date('2021-06-15'),
          updatedAt: new Date('2021-06-15')
        }
      ];

      const mockUser = mockUsers.find(u => u.id === decoded.userId && u.email === decoded.email);
      if (mockUser) {
        user = mockUser;
      }
    }

    if (!user) {
      throw new AppError('User not found', 401);
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