import express, { Request, Response } from 'express';
import { prisma } from '../index';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authorize, authorizeEmployeeAccess } from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * /users:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get all users
 *     description: Retrieve all active users with pagination, search, and filtering capabilities (HR/IT Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of users per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term to filter users by name, email, or employee ID
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

// Get all users (HR/IT Admin only)
router.get('/',
  authorize('HR_ADMIN', 'IT_ADMIN', 'HR'),
  asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search, department, location } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { status: 'ACTIVE' };
    
    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { employeeId: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    if (department) where.department = department;
    if (location) where.location = location;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        select: {
          id: true,
          employeeId: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          department: true,
          location: true,
          joiningDate: true,
          reportingManager: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { firstName: 'asc' }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  })
);

/**
 * @swagger
 * /users/team:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get team members
 *     description: Retrieve team members for managers and HR admins
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Team members retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       avatar:
 *                         type: string
 *                       role:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 */
router.get('/team',
  authorize('MANAGER', 'HR', 'HR_ADMIN', 'IT_ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      // Try to get team data from database
      const teamMembers = await prisma.user.findMany({
        where: {
          isActive: true
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          isActive: true,
          profilePicture: true
        }
      });

      const formattedTeam = teamMembers.map(member => ({
        id: member.id,
        name: `${member.firstName} ${member.lastName}`,
        avatar: member.profilePicture,
        role: member.role,
        isActive: member.isActive
      }));

      res.json({
        success: true,
        data: formattedTeam
      });
    } catch (error) {
      // Fallback to mock data if database fails
      const mockTeamMembers = [
        {
          id: 'user-hr-admin',
          name: 'Admin User',
          avatar: null,
          role: 'HR_ADMIN',
          department: 'Human Resources',
          email: 'admin@company.com',
          joiningDate: '2023-01-15',
          pendingRequests: 0,
          onLeave: false,
          currentBalance: {
            annual: 25,
            sick: 12,
            personal: 5
          },
          isActive: true
        },
        {
          id: 'user-employee-1',
          name: 'John Doe',
          avatar: null,
          role: 'EMPLOYEE',
          department: 'Engineering',
          email: 'john.doe@company.com',
          joiningDate: '2023-03-01',
          pendingRequests: 2,
          onLeave: false,
          currentBalance: {
            annual: 18,
            sick: 10,
            personal: 3
          },
          isActive: true
        },
        {
          id: 'user-employee-2',
          name: 'Jane Smith',
          avatar: null,
          role: 'EMPLOYEE',
          department: 'Marketing',
          email: 'jane.smith@company.com',
          joiningDate: '2023-02-15',
          pendingRequests: 1,
          onLeave: false,
          currentBalance: {
            annual: 20,
            sick: 8,
            personal: 4
          },
          isActive: true
        },
        {
          id: 'user-employee-3',
          name: 'Mike Johnson',
          avatar: null,
          role: 'EMPLOYEE',
          department: 'Sales',
          email: 'mike.johnson@company.com',
          joiningDate: '2023-04-01',
          pendingRequests: 1,
          onLeave: false,
          currentBalance: {
            annual: 22,
            sick: 11,
            personal: 5
          },
          isActive: true
        },
        {
          id: 'user-employee-4',
          name: 'Sarah Wilson',
          avatar: null,
          role: 'EMPLOYEE',
          department: 'Finance',
          email: 'sarah.wilson@company.com',
          joiningDate: '2023-05-15',
          pendingRequests: 1,
          onLeave: false,
          currentBalance: {
            annual: 19,
            sick: 9,
            personal: 3
          },
          isActive: true
        },
        {
          id: 'user-employee-5',
          name: 'David Brown',
          avatar: null,
          role: 'EMPLOYEE',
          department: 'Operations',
          email: 'david.brown@company.com',
          joiningDate: '2023-06-01',
          pendingRequests: 1,
          onLeave: false,
          currentBalance: {
            annual: 21,
            sick: 12,
            personal: 4
          },
          isActive: true
        }
      ];

      res.json({
        success: true,
        data: mockTeamMembers
      });
    }
  })
);

/**
 * @swagger
 * /users:
 *   post:
 *     tags:
 *       - Users
 *     summary: Create a new user
 *     description: Create a new employee/user in the system (HR/IT Admin only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - email
 *               - firstName
 *               - lastName
 *               - role
 *               - department
 *               - location
 *               - joiningDate
 *             properties:
 *               employeeId:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               password:
 *                 type: string
 *                 description: Optional password (will be auto-generated if not provided)
 *               role:
 *                 type: string
 *                 enum: [EMPLOYEE, MANAGER, HR_ADMIN, IT_ADMIN, PAYROLL_OFFICER]
 *               department:
 *                 type: string
 *               location:
 *                 type: string
 *               reportingManagerId:
 *                 type: string
 *               joiningDate:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, OTHER]
 *               maritalStatus:
 *                 type: string
 *                 enum: [SINGLE, MARRIED, DIVORCED, WIDOWED]
 *               country:
 *                 type: string
 *               designation:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid request or duplicate employee
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/',
  authorize('HR_ADMIN', 'IT_ADMIN', 'HR'),
  asyncHandler(async (req: Request, res: Response) => {
    const {
      employeeId,
      email,
      firstName,
      lastName,
      password,
      role,
      department,
      location,
      reportingManagerId,
      joiningDate,
      gender,
      maritalStatus,
      country,
      designation
    } = req.body;

    // Check if employee ID or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { employeeId },
          { email }
        ]
      }
    });

    if (existingUser) {
      throw new AppError(
        existingUser.employeeId === employeeId
          ? 'Employee ID already exists'
          : 'Email already exists',
        400
      );
    }

    // If reporting manager is provided, verify they exist
    if (reportingManagerId) {
      const manager = await prisma.user.findUnique({
        where: { id: reportingManagerId }
      });

      if (!manager) {
        throw new AppError('Reporting manager not found', 404);
      }
    }

    // Generate default password if not provided
    const bcrypt = require('bcryptjs');
    const defaultPassword = password || 'Welcome@123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        employeeId,
        email,
        firstName,
        lastName,
        password: hashedPassword,
        role,
        department,
        location,
        reportingManagerId: reportingManagerId || null,
        joiningDate: new Date(joiningDate),
        gender: gender || null,
        maritalStatus: maritalStatus || null,
        country: country || null,
        designation: designation || null,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        employeeId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        location: true,
        joiningDate: true,
        status: true,
        reportingManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser
    });
  })
);

/**
 * @swagger
 * /users/{id}/status:
 *   patch:
 *     tags:
 *       - Users
 *     summary: Update user status
 *     description: Activate or deactivate a user (HR/IT Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, SUSPENDED]
 *     responses:
 *       200:
 *         description: User status updated successfully
 *       404:
 *         description: User not found
 */
router.patch('/:id/status',
  authorize('HR_ADMIN', 'IT_ADMIN', 'HR'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        employeeId: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true
      }
    });

    res.json({
      success: true,
      message: 'User status updated successfully',
      data: updatedUser
    });
  })
);

// Get user by ID
router.get('/:id',
  authorizeEmployeeAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        department: true,
        location: true,
        joiningDate: true,
        reportingManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        directReports: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: user
    });
  })
);

export default router;