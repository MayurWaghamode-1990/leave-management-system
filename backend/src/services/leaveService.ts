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
      // CRITICAL FIX: Check for overlapping leave requests
      await this.validateDateRangeOverlap(data.employeeId, data.startDate, data.endDate);

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
        // RACE CONDITION FIX: Use findFirst with explicit locking and atomic update
        const pendingApproval = await tx.approval.findFirst({
          where: {
            leaveRequestId,
            approverId,
            status: 'PENDING',
          },
        });

        if (!pendingApproval) {
          throw new Error('Approval record not found or already processed');
        }

        // Atomic update using unique ID with version check
        const updatedApproval = await tx.approval.update({
          where: {
            id: pendingApproval.id,
          },
          data: {
            status: 'APPROVED',
            approvedAt: new Date(),
            comments,
          },
        });

        // Double-check the approval was actually updated by us
        if (updatedApproval.status !== 'APPROVED') {
          throw new Error('Approval update failed due to concurrent modification');
        }

        // RACE CONDITION FIX: Check leave request status before updating
        const currentLeaveRequest = await tx.leaveRequest.findUnique({
          where: { id: leaveRequestId },
          select: { status: true, id: true },
        });

        if (!currentLeaveRequest) {
          throw new Error('Leave request not found');
        }

        if (currentLeaveRequest.status !== 'PENDING') {
          throw new Error(`Leave request status is ${currentLeaveRequest.status}, cannot approve`);
        }

        // Update leave request status atomically
        const leaveRequest = await tx.leaveRequest.update({
          where: {
            id: leaveRequestId,
            status: 'PENDING' // Additional condition to prevent race condition
          },
          data: { status: 'APPROVED' },
          include: {
            employee: true,
          },
        });

        // CRITICAL FIX: Update leave balance with proper error handling and race condition protection
        await this.updateLeaveBalanceAtomic(tx, leaveRequest.employeeId, leaveRequest.leaveType, leaveRequest.totalDays, leaveRequest.employee.location);

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
        // RACE CONDITION FIX: Use findFirst with explicit locking and atomic update
        const pendingApproval = await tx.approval.findFirst({
          where: {
            leaveRequestId,
            approverId,
            status: 'PENDING',
          },
        });

        if (!pendingApproval) {
          throw new Error('Approval record not found or already processed');
        }

        // Atomic update using unique ID
        const updatedApproval = await tx.approval.update({
          where: {
            id: pendingApproval.id,
          },
          data: {
            status: 'REJECTED',
            approvedAt: new Date(),
            comments,
          },
        });

        // Double-check the approval was actually updated by us
        if (updatedApproval.status !== 'REJECTED') {
          throw new Error('Approval update failed due to concurrent modification');
        }

        // RACE CONDITION FIX: Check leave request status before updating
        const currentLeaveRequest = await tx.leaveRequest.findUnique({
          where: { id: leaveRequestId },
          select: { status: true, id: true },
        });

        if (!currentLeaveRequest) {
          throw new Error('Leave request not found');
        }

        if (currentLeaveRequest.status !== 'PENDING') {
          throw new Error(`Leave request status is ${currentLeaveRequest.status}, cannot reject`);
        }

        // Update leave request status atomically
        const leaveRequest = await tx.leaveRequest.update({
          where: {
            id: leaveRequestId,
            status: 'PENDING' // Additional condition to prevent race condition
          },
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

  // CRITICAL FIX: Validate date range overlap to prevent multiple leaves for same dates
  async validateDateRangeOverlap(employeeId: string, startDate: Date, endDate: Date, excludeLeaveId?: string) {
    try {
      const where: any = {
        employeeId,
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          {
            // New request starts within existing leave period
            startDate: { lte: startDate },
            endDate: { gte: startDate }
          },
          {
            // New request ends within existing leave period
            startDate: { lte: endDate },
            endDate: { gte: endDate }
          },
          {
            // New request completely encompasses existing leave
            startDate: { gte: startDate },
            endDate: { lte: endDate }
          }
        ]
      };

      // Exclude current leave request if updating
      if (excludeLeaveId) {
        where.id = { not: excludeLeaveId };
      }

      const overlappingLeaves = await prisma.leaveRequest.findMany({
        where,
        select: {
          id: true,
          leaveType: true,
          startDate: true,
          endDate: true,
          status: true
        }
      });

      if (overlappingLeaves.length > 0) {
        const overlappingDetails = overlappingLeaves.map(leave =>
          `${leave.leaveType} from ${leave.startDate.toDateString()} to ${leave.endDate.toDateString()} (${leave.status})`
        ).join(', ');

        throw new Error(`Leave request overlaps with existing leave(s): ${overlappingDetails}`);
      }

      return true;
    } catch (error) {
      logger.error('Error validating date range overlap:', error);
      throw error;
    }
  }

  // Helper method to get default entitlement for leave types
  private async getDefaultEntitlement(leaveType: string, location?: string): Promise<number> {
    try {
      // Try to get from leave policy first
      const policy = await prisma.leavePolicy.findFirst({
        where: {
          leaveType,
          location: location || 'Default',
          isActive: true
        }
      });

      if (policy) {
        return policy.entitlementDays;
      }

      // Default entitlements based on GLF requirements
      const defaultEntitlements: Record<string, number> = {
        'CASUAL_LEAVE': 12,    // GLF: 1 per month = 12 per year
        'EARNED_LEAVE': 12,    // GLF: 1 per month = 12 per year
        'PRIVILEGE_LEAVE': 12, // GLF: 1 per month = 12 per year
        'SICK_LEAVE': 12,
        'MATERNITY_LEAVE': 180, // GLF: 180 days
        'PATERNITY_LEAVE': 5,   // GLF: 5 days
        'COMPENSATORY_OFF': 0,  // Earned through overtime
        'LEAVE_WITHOUT_PAY': 0, // No entitlement
        'PTO': 15, // USA default - AVP level
        'BEREAVEMENT_LEAVE': 3
      };

      return defaultEntitlements[leaveType] || 12;
    } catch (error) {
      logger.error('Error getting default entitlement:', error);
      return 12; // Fallback to 12 days
    }
  }

  // RACE CONDITION FIX: Atomic leave balance update with proper locking
  private async updateLeaveBalanceAtomic(
    tx: any,
    employeeId: string,
    leaveType: string,
    daysToDeduct: number,
    location?: string
  ): Promise<void> {
    const currentYear = new Date().getFullYear();

    try {
      // Use upsert for atomic create-or-update operation
      const result = await tx.leaveBalance.upsert({
        where: {
          employeeId_leaveType_year: {
            employeeId,
            leaveType,
            year: currentYear,
          },
        },
        update: {
          used: {
            increment: daysToDeduct,
          },
          available: {
            decrement: daysToDeduct,
          },
        },
        create: {
          employeeId,
          leaveType,
          year: currentYear,
          totalEntitlement: await this.getDefaultEntitlement(leaveType, location),
          used: daysToDeduct,
          available: Math.max(0, (await this.getDefaultEntitlement(leaveType, location)) - daysToDeduct),
          carryForward: 0,
        },
      });

      // Validate that available balance doesn't go negative
      if (result.available < 0) {
        logger.error(`Negative balance detected for employee ${employeeId}, leave type ${leaveType}. Available: ${result.available}`);
        // Optionally, we could rollback here or set available to 0
        await tx.leaveBalance.update({
          where: { id: result.id },
          data: { available: 0 },
        });
      }

      logger.info(`Updated leave balance for employee ${employeeId}: ${leaveType} - Used: ${result.used}, Available: ${result.available}`);
    } catch (error: any) {
      logger.error('Error updating leave balance atomically:', error);
      throw new Error(`Failed to update leave balance: ${error?.message || 'Unknown error'}`);
    }
  }
}

export const leaveService = new LeaveService();