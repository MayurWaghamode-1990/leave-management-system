import { prisma } from './databaseService';
import { logger } from '../utils/logger';

export interface CreateLeaveRequestData {
  employeeId: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  isHalfDay?: boolean;
  reason: string;
  attachments?: string;
}

export interface UpdateLeaveRequestData {
  leaveType?: string;
  startDate?: Date;
  endDate?: Date;
  totalDays?: number;
  isHalfDay?: boolean;
  reason?: string;
  attachments?: string;
  status?: string;
}

export interface LeaveFilters {
  employeeId?: string;
  status?: string;
  leaveType?: string;
  startDate?: Date;
  endDate?: Date;
  approverId?: string;
}

class LeaveService {
  // Get all leave requests with optional filters
  async getLeaveRequests(filters: LeaveFilters = {}, page = 1, limit = 10) {
    try {
      const where: any = {};

      if (filters.employeeId) where.employeeId = filters.employeeId;
      if (filters.status) where.status = filters.status;
      if (filters.leaveType) where.leaveType = filters.leaveType;
      if (filters.startDate && filters.endDate) {
        where.startDate = {
          gte: filters.startDate,
          lte: filters.endDate,
        };
      }

      const skip = (page - 1) * limit;

      const [leaveRequests, total] = await Promise.all([
        prisma.leaveRequest.findMany({
          where,
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                employeeId: true,
                department: true,
              },
            },
            approvals: {
              include: {
                approver: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: { appliedDate: 'desc' },
          skip,
          take: limit,
        }),
        prisma.leaveRequest.count({ where }),
      ]);

      return {
        leaveRequests,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error fetching leave requests:', error);
      throw error;
    }
  }

  // Get leave request by ID
  async getLeaveRequestById(id: string) {
    try {
      const leaveRequest = await prisma.leaveRequest.findUnique({
        where: { id },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              employeeId: true,
              department: true,
            },
          },
          approvals: {
            include: {
              approver: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      return leaveRequest;
    } catch (error) {
      logger.error('Error fetching leave request:', error);
      throw error;
    }
  }

  // Create new leave request
  async createLeaveRequest(data: CreateLeaveRequestData) {
    try {
      // Check if employee has sufficient balance
      const balance = await this.getLeaveBalance(data.employeeId, data.leaveType, new Date().getFullYear());

      if (balance && balance.available < data.totalDays) {
        throw new Error('Insufficient leave balance');
      }

      const leaveRequest = await prisma.leaveRequest.create({
        data: {
          ...data,
          status: 'PENDING',
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              employeeId: true,
              department: true,
              reportingManagerId: true,
            },
          },
        },
      });

      // Create approval record for manager
      if (leaveRequest.employee.reportingManagerId) {
        await prisma.approval.create({
          data: {
            leaveRequestId: leaveRequest.id,
            approverId: leaveRequest.employee.reportingManagerId,
            level: 1,
            status: 'PENDING',
          },
        });
      }

      return leaveRequest;
    } catch (error) {
      logger.error('Error creating leave request:', error);
      throw error;
    }
  }

  // Update leave request
  async updateLeaveRequest(id: string, data: UpdateLeaveRequestData) {
    try {
      const leaveRequest = await prisma.leaveRequest.update({
        where: { id },
        data,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              employeeId: true,
              department: true,
            },
          },
          approvals: {
            include: {
              approver: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      return leaveRequest;
    } catch (error) {
      logger.error('Error updating leave request:', error);
      throw error;
    }
  }

  // Delete leave request
  async deleteLeaveRequest(id: string) {
    try {
      // Delete related approvals first
      await prisma.approval.deleteMany({
        where: { leaveRequestId: id },
      });

      // Delete the leave request
      await prisma.leaveRequest.delete({
        where: { id },
      });

      return true;
    } catch (error) {
      logger.error('Error deleting leave request:', error);
      throw error;
    }
  }

  // Approve leave request
  async approveLeaveRequest(leaveRequestId: string, approverId: string, comments?: string) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Update approval record
        const approval = await tx.approval.updateMany({
          where: {
            leaveRequestId,
            approverId,
            status: 'PENDING',
          },
          data: {
            status: 'APPROVED',
            approvedAt: new Date(),
            comments,
          },
        });

        if (approval.count === 0) {
          throw new Error('Approval record not found or already processed');
        }

        // Update leave request status
        const leaveRequest = await tx.leaveRequest.update({
          where: { id: leaveRequestId },
          data: { status: 'APPROVED' },
          include: {
            employee: true,
          },
        });

        // Update leave balance
        const currentYear = new Date().getFullYear();
        await tx.leaveBalance.updateMany({
          where: {
            employeeId: leaveRequest.employeeId,
            leaveType: leaveRequest.leaveType,
            year: currentYear,
          },
          data: {
            used: {
              increment: leaveRequest.totalDays,
            },
            available: {
              decrement: leaveRequest.totalDays,
            },
          },
        });

        return leaveRequest;
      });
    } catch (error) {
      logger.error('Error approving leave request:', error);
      throw error;
    }
  }

  // Reject leave request
  async rejectLeaveRequest(leaveRequestId: string, approverId: string, comments?: string) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Update approval record
        const approval = await tx.approval.updateMany({
          where: {
            leaveRequestId,
            approverId,
            status: 'PENDING',
          },
          data: {
            status: 'REJECTED',
            approvedAt: new Date(),
            comments,
          },
        });

        if (approval.count === 0) {
          throw new Error('Approval record not found or already processed');
        }

        // Update leave request status
        const leaveRequest = await tx.leaveRequest.update({
          where: { id: leaveRequestId },
          data: { status: 'REJECTED' },
          include: {
            employee: true,
          },
        });

        return leaveRequest;
      });
    } catch (error) {
      logger.error('Error rejecting leave request:', error);
      throw error;
    }
  }

  // Get leave balances for an employee
  async getLeaveBalances(employeeId: string, year?: number) {
    try {
      const currentYear = year || new Date().getFullYear();

      const balances = await prisma.leaveBalance.findMany({
        where: {
          employeeId,
          year: currentYear,
        },
        include: {
          employee: {
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

      return balances;
    } catch (error) {
      logger.error('Error fetching leave balances:', error);
      throw error;
    }
  }

  // Get specific leave balance
  async getLeaveBalance(employeeId: string, leaveType: string, year: number) {
    try {
      const balance = await prisma.leaveBalance.findUnique({
        where: {
          employeeId_leaveType_year: {
            employeeId,
            leaveType,
            year,
          },
        },
      });

      return balance;
    } catch (error) {
      logger.error('Error fetching leave balance:', error);
      throw error;
    }
  }

  // Get pending approvals for a manager
  async getPendingApprovals(approverId: string) {
    try {
      const approvals = await prisma.approval.findMany({
        where: {
          approverId,
          status: 'PENDING',
        },
        include: {
          leaveRequest: {
            include: {
              employee: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  employeeId: true,
                  department: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      return approvals;
    } catch (error) {
      logger.error('Error fetching pending approvals:', error);
      throw error;
    }
  }

  // Get leave statistics
  async getLeaveStatistics(filters: LeaveFilters = {}) {
    try {
      const where: any = {};

      if (filters.employeeId) where.employeeId = filters.employeeId;
      if (filters.leaveType) where.leaveType = filters.leaveType;

      const [
        totalRequests,
        pendingRequests,
        approvedRequests,
        rejectedRequests,
        cancelledRequests,
      ] = await Promise.all([
        prisma.leaveRequest.count({ where }),
        prisma.leaveRequest.count({ where: { ...where, status: 'PENDING' } }),
        prisma.leaveRequest.count({ where: { ...where, status: 'APPROVED' } }),
        prisma.leaveRequest.count({ where: { ...where, status: 'REJECTED' } }),
        prisma.leaveRequest.count({ where: { ...where, status: 'CANCELLED' } }),
      ]);

      return {
        total: totalRequests,
        pending: pendingRequests,
        approved: approvedRequests,
        rejected: rejectedRequests,
        cancelled: cancelledRequests,
      };
    } catch (error) {
      logger.error('Error fetching leave statistics:', error);
      throw error;
    }
  }
}

export const leaveService = new LeaveService();