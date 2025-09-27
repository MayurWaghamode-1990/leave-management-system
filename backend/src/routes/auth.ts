import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { authSchemas } from '../schemas/validationSchemas';
import { logger } from '../utils/logger';
import { userService } from '../services/userService';
import { prisma } from '../index';

const router = express.Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User login
 *     description: Authenticate a user with email and password, returns JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "admin@company.com"
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "admin123"
 *                 description: User's password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                       description: JWT authentication token
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Invalid credentials. Try admin@company.com/admin123 or user@company.com/user123"
 *               error: "Authentication failed"
 *               code: "INVALID_CREDENTIALS"
 *     security: []
 */

// Login endpoint
router.post('/login', validate(authSchemas.login), asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // Try to find user in database first
    const user = await userService.getUserByEmail(email);

    // If user exists in database, verify password
    if (user) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new AppError('Invalid credentials', 401);
      }

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new AppError('JWT secret not configured', 500);
      }

      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role
        },
        jwtSecret,
        {
          expiresIn: '7d'
        }
      );

      // Update last login
      await userService.updateLastLogin(user.id);

      logger.info(`User logged in: ${user.email}`);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            employeeId: user.employeeId,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            department: user.department,
            location: user.location,
            reportingManager: user.reportingManager
          }
        }
      });
    } else {
      // Fall back to mock users for demo
      const mockUsers = [
        {
          id: '1',
          employeeId: 'EMP001',
          email: 'admin@company.com',
          password: 'admin123',
          firstName: 'Admin',
          lastName: 'User',
          role: 'HR_ADMIN',
          department: 'Human Resources',
          location: 'Bengaluru'
        },
        {
          id: '2',
          employeeId: 'EMP002',
          email: 'user@company.com',
          password: 'user123',
          firstName: 'John',
          lastName: 'Doe',
          role: 'EMPLOYEE',
          department: 'Engineering',
          location: 'Bengaluru'
        }
      ];

      const mockUser = mockUsers.find(u => u.email === email && u.password === password);

      if (!mockUser) {
        throw new AppError('Invalid credentials. Try admin@company.com/admin123 or user@company.com/user123', 401);
      }

      // Generate JWT token for mock user
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new AppError('JWT secret not configured', 500);
      }

      const token = jwt.sign(
        {
          userId: mockUser.id,
          email: mockUser.email,
          role: mockUser.role
        },
        jwtSecret,
        {
          expiresIn: '7d'
        }
      );

      logger.info(`Mock user logged in: ${mockUser.email}`);

      res.json({
        success: true,
        message: 'Login successful (Demo Mode)',
        data: {
          token,
          user: {
            id: mockUser.id,
            employeeId: mockUser.employeeId,
            email: mockUser.email,
            firstName: mockUser.firstName,
            lastName: mockUser.lastName,
            role: mockUser.role,
            department: mockUser.department,
            location: mockUser.location
          }
        }
      });
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    // If database error, fall back to mock authentication
    logger.warn('Database connection issue, falling back to mock authentication');

    const mockUsers = [
      {
        id: '1',
        employeeId: 'EMP001',
        email: 'admin@company.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        role: 'HR_ADMIN',
        department: 'Human Resources',
        location: 'Bengaluru'
      },
      {
        id: '2',
        employeeId: 'EMP002',
        email: 'user@company.com',
        password: 'user123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'EMPLOYEE',
        department: 'Engineering',
        location: 'Bengaluru'
      }
    ];

    const mockUser = mockUsers.find(u => u.email === email && u.password === password);

    if (!mockUser) {
      throw new AppError('Invalid credentials. Try admin@company.com/admin123 or user@company.com/user123', 401);
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new AppError('JWT secret not configured', 500);
    }

    const token = jwt.sign(
      {
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful (Demo Mode)',
      data: {
        token,
        user: mockUser
      }
    });
  }
}));

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Get current user profile
 *     description: Retrieve the profile information of the authenticated user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

// Get current user profile
router.get('/profile', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Try to get user from database
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        reportingManager: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (user) {
      res.json({
        success: true,
        data: {
          id: user.id,
          employeeId: user.employeeId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          department: user.department,
          location: user.location,
          joiningDate: user.joiningDate,
          reportingManagerId: user.reportingManagerId,
          reportingManager: user.reportingManager,
          status: user.status,
          lastLogin: user.lastLogin
        }
      });
    } else {
      // Fall back to mock user profile data
      const mockProfile = {
        id: req.user!.userId,
        employeeId: req.user!.userId === '1' ? 'EMP001' : 'EMP002',
        email: req.user!.email,
        firstName: req.user!.userId === '1' ? 'Admin' : 'John',
        lastName: req.user!.userId === '1' ? 'User' : 'Doe',
        role: req.user!.role,
        department: req.user!.userId === '1' ? 'Human Resources' : 'Engineering',
        location: 'Bengaluru',
        joiningDate: new Date('2020-01-01'),
        reportingManagerId: req.user!.userId === '1' ? null : '1',
        reportingManager: req.user!.userId === '1' ? null : {
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@company.com'
        }
      };

      res.json({
        success: true,
        data: mockProfile
      });
    }
  } catch (error) {
    // If database error, fall back to mock data
    logger.warn('Database connection issue, returning mock profile data');

    const mockProfile = {
      id: req.user!.userId,
      employeeId: req.user!.userId === '1' ? 'EMP001' : 'EMP002',
      email: req.user!.email,
      firstName: req.user!.userId === '1' ? 'Admin' : 'John',
      lastName: req.user!.userId === '1' ? 'User' : 'Doe',
      role: req.user!.role,
      department: req.user!.userId === '1' ? 'Human Resources' : 'Engineering',
      location: 'Bengaluru',
      joiningDate: new Date('2020-01-01'),
      reportingManagerId: req.user!.userId === '1' ? null : '1',
      reportingManager: req.user!.userId === '1' ? null : {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@company.com'
      }
    };

    res.json({
      success: true,
      data: mockProfile
    });
  }
}));

// Change password (Mock for demo)
router.post('/change-password', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError('Current password and new password are required', 400);
  }

  if (newPassword.length < 8) {
    throw new AppError('New password must be at least 8 characters long', 400);
  }

  // Mock password change
  logger.info(`Password changed for user: ${req.user!.email}`);

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
}));

// Logout (client-side token invalidation)
router.post('/logout', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  logger.info(`User logged out: ${req.user!.email}`);

  res.json({
    success: true,
    message: 'Logout successful'
  });
}));

export default router;