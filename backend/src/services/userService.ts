import bcrypt from 'bcryptjs';
import { prisma } from './databaseService';
import { logger } from '../utils/logger';

export interface CreateUserData {
  employeeId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
  department: string;
  location: string;
  reportingManagerId?: string;
  joiningDate?: Date;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  role?: string;
  department?: string;
  location?: string;
  reportingManagerId?: string;
  status?: string;
}

export interface UserFilters {
  role?: string;
  department?: string;
  location?: string;
  status?: string;
  search?: string;
}

class UserService {
  // Get all users with filters
  async getUsers(filters: UserFilters = {}, page = 1, limit = 10) {
    try {
      const where: any = {};

      if (filters.role) where.role = filters.role;
      if (filters.department) where.department = filters.department;
      if (filters.location) where.location = filters.location;
      if (filters.status) where.status = filters.status;

      if (filters.search) {
        where.OR = [
          { firstName: { contains: filters.search } },
          { lastName: { contains: filters.search } },
          { email: { contains: filters.search } },
          { employeeId: { contains: filters.search } },
        ];
      }

      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
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
            lastLogin: true,
            reportingManagerId: true,
            reportingManager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                employeeId: true,
              },
            },
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.user.count({ where }),
      ]);

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error fetching users:', error);
      throw error;
    }
  }

  // Get user by ID
  async getUserById(id: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
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
          lastLogin: true,
          reportingManagerId: true,
          reportingManager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              employeeId: true,
            },
          },
          directReports: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              employeeId: true,
              role: true,
              department: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      });

      return user;
    } catch (error) {
      logger.error('Error fetching user:', error);
      throw error;
    }
  }

  // Get user by email
  async getUserByEmail(email: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          reportingManager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              employeeId: true,
            },
          },
        },
      });

      return user;
    } catch (error) {
      logger.error('Error fetching user by email:', error);
      throw error;
    }
  }

  // Create new user
  async createUser(data: CreateUserData) {
    try {
      // Check if email or employeeId already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: data.email },
            { employeeId: data.employeeId },
          ],
        },
      });

      if (existingUser) {
        throw new Error('User with this email or employee ID already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      const user = await prisma.user.create({
        data: {
          ...data,
          password: hashedPassword,
          role: data.role || 'EMPLOYEE',
          joiningDate: data.joiningDate || new Date(),
          status: 'ACTIVE',
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
          reportingManagerId: true,
          createdAt: true,
        },
      });

      // Create initial leave balances
      await this.createInitialLeaveBalances(user.id);

      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  // Update user
  async updateUser(id: string, data: UpdateUserData) {
    try {
      const user = await prisma.user.update({
        where: { id },
        data,
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
          reportingManagerId: true,
          updatedAt: true,
        },
      });

      return user;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  // Delete user
  async deleteUser(id: string) {
    try {
      // Check if user has any dependencies
      const hasLeaveRequests = await prisma.leaveRequest.findFirst({
        where: { employeeId: id },
      });

      if (hasLeaveRequests) {
        // Soft delete by updating status
        await prisma.user.update({
          where: { id },
          data: { status: 'INACTIVE' },
        });
      } else {
        // Hard delete if no dependencies
        await prisma.user.delete({
          where: { id },
        });
      }

      return true;
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  // Update last login
  async updateLastLogin(id: string) {
    try {
      await prisma.user.update({
        where: { id },
        data: { lastLogin: new Date() },
      });
    } catch (error) {
      logger.error('Error updating last login:', error);
      throw error;
    }
  }

  // Get user's direct reports
  async getDirectReports(managerId: string) {
    try {
      const directReports = await prisma.user.findMany({
        where: { reportingManagerId: managerId },
        select: {
          id: true,
          employeeId: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          department: true,
          location: true,
          status: true,
          joiningDate: true,
        },
        orderBy: { firstName: 'asc' },
      });

      return directReports;
    } catch (error) {
      logger.error('Error fetching direct reports:', error);
      throw error;
    }
  }

  // Get managers for dropdown
  async getManagers() {
    try {
      const managers = await prisma.user.findMany({
        where: {
          role: {
            in: ['MANAGER', 'HR_ADMIN'],
          },
          status: 'ACTIVE',
        },
        select: {
          id: true,
          employeeId: true,
          firstName: true,
          lastName: true,
          email: true,
          department: true,
        },
        orderBy: { firstName: 'asc' },
      });

      return managers;
    } catch (error) {
      logger.error('Error fetching managers:', error);
      throw error;
    }
  }

  // Create initial leave balances for new user
  private async createInitialLeaveBalances(userId: string) {
    try {
      const currentYear = new Date().getFullYear();
      const leaveTypes = [
        { type: 'CASUAL_LEAVE', entitlement: 12 },
        { type: 'SICK_LEAVE', entitlement: 12 },
        { type: 'EARNED_LEAVE', entitlement: 21 },
      ];

      const balanceData = leaveTypes.map(({ type, entitlement }) => ({
        employeeId: userId,
        leaveType: type,
        totalEntitlement: entitlement,
        used: 0,
        available: entitlement,
        carryForward: 0,
        year: currentYear,
      }));

      await prisma.leaveBalance.createMany({
        data: balanceData,
      });
    } catch (error) {
      logger.error('Error creating initial leave balances:', error);
      throw error;
    }
  }

  // Get user statistics
  async getUserStatistics() {
    try {
      const [
        totalUsers,
        activeUsers,
        inactiveUsers,
        totalEmployees,
        totalManagers,
        totalHRAdmins,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: 'ACTIVE' } }),
        prisma.user.count({ where: { status: 'INACTIVE' } }),
        prisma.user.count({ where: { role: 'EMPLOYEE' } }),
        prisma.user.count({ where: { role: 'MANAGER' } }),
        prisma.user.count({ where: { role: 'HR_ADMIN' } }),
      ]);

      return {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        employees: totalEmployees,
        managers: totalManagers,
        hrAdmins: totalHRAdmins,
      };
    } catch (error) {
      logger.error('Error fetching user statistics:', error);
      throw error;
    }
  }
}

export const userService = new UserService();