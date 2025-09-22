import { prisma } from './databaseService';
import { logger } from '../utils/logger';

export interface CreateCancellationRequestData {
  leaveRequestId: string;
  employeeId: string;
  cancellationReason: string;
}

export interface CreateModificationRequestData {
  originalLeaveId: string;
  employeeId: string;
  newStartDate?: Date;
  newEndDate?: Date;
  newLeaveType?: string;
  newReason?: string;
  modificationReason: string;
}

export interface AdvancedRequestFilters {
  employeeId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}

class AdvancedLeaveService {
  // === CANCELLATION REQUESTS ===

  // Create cancellation request
  async createCancellationRequest(data: CreateCancellationRequestData) {
    try {
      // Check if leave request exists and is approved
      const leaveRequest = await prisma.leaveRequest.findUnique({
        where: { id: data.leaveRequestId },
        include: { employee: true },
      });

      if (!leaveRequest) {
        throw new Error('Leave request not found');
      }

      if (leaveRequest.status !== 'APPROVED') {
        throw new Error('Can only cancel approved leave requests');
      }

      if (leaveRequest.employeeId !== data.employeeId) {
        throw new Error('Not authorized to cancel this leave request');
      }

      // Check if cancellation request already exists
      const existingCancellation = await prisma.leaveCancellationRequest.findFirst({
        where: {
          leaveRequestId: data.leaveRequestId,
          status: 'PENDING',
        },
      });

      if (existingCancellation) {
        throw new Error('Cancellation request already exists for this leave');
      }

      const cancellationRequest = await prisma.leaveCancellationRequest.create({
        data: {
          leaveRequestId: data.leaveRequestId,
          employeeId: data.employeeId,
          cancellationReason: data.cancellationReason,
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
                },
              },
            },
          },
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

      // Create notification for manager
      if (leaveRequest.employee.reportingManagerId) {
        await prisma.notification.create({
          data: {
            userId: leaveRequest.employee.reportingManagerId,
            type: 'LEAVE_CANCELLED',
            title: 'Leave Cancellation Request',
            message: `${leaveRequest.employee.firstName} ${leaveRequest.employee.lastName} has requested to cancel an approved leave.`,
            metadata: JSON.stringify({
              cancellationRequestId: cancellationRequest.id,
              leaveRequestId: data.leaveRequestId,
            }),
          },
        });
      }

      logger.info('Cancellation request created:', {
        requestId: cancellationRequest.id,
        leaveRequestId: data.leaveRequestId
      });

      return cancellationRequest;
    } catch (error) {
      logger.error('Error creating cancellation request:', error);
      throw error;
    }
  }

  // Get cancellation requests
  async getCancellationRequests(filters: AdvancedRequestFilters = {}, page = 1, limit = 10) {
    try {
      const where: any = {};

      if (filters.employeeId) where.employeeId = filters.employeeId;
      if (filters.status) where.status = filters.status;

      const skip = (page - 1) * limit;

      const [requests, total] = await Promise.all([
        prisma.leaveCancellationRequest.findMany({
          where,
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
                  },
                },
              },
            },
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                employeeId: true,
              },
            },
            approver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { appliedDate: 'desc' },
          skip,
          take: limit,
        }),
        prisma.leaveCancellationRequest.count({ where }),
      ]);

      return {
        requests,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error fetching cancellation requests:', error);
      throw error;
    }
  }

  // Approve cancellation request
  async approveCancellationRequest(requestId: string, approverId: string) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Update cancellation request
        const cancellationRequest = await tx.leaveCancellationRequest.update({
          where: { id: requestId },
          data: {
            status: 'APPROVED',
            approvedBy: approverId,
            approvedAt: new Date(),
          },
          include: {
            leaveRequest: true,
            employee: true,
          },
        });

        // Update original leave request status
        await tx.leaveRequest.update({
          where: { id: cancellationRequest.leaveRequestId },
          data: { status: 'CANCELLED' },
        });

        // Restore leave balance
        const currentYear = new Date().getFullYear();
        await tx.leaveBalance.updateMany({
          where: {
            employeeId: cancellationRequest.employeeId,
            leaveType: cancellationRequest.leaveRequest.leaveType,
            year: currentYear,
          },
          data: {
            used: { decrement: cancellationRequest.leaveRequest.totalDays },
            available: { increment: cancellationRequest.leaveRequest.totalDays },
          },
        });

        // Create notification for employee
        await tx.notification.create({
          data: {
            userId: cancellationRequest.employeeId,
            type: 'LEAVE_CANCELLED',
            title: 'Leave Cancellation Approved',
            message: 'Your leave cancellation request has been approved.',
            metadata: JSON.stringify({
              cancellationRequestId: requestId,
              leaveRequestId: cancellationRequest.leaveRequestId,
            }),
          },
        });

        logger.info('Cancellation request approved:', { requestId });
        return cancellationRequest;
      });
    } catch (error) {
      logger.error('Error approving cancellation request:', error);
      throw error;
    }
  }

  // Reject cancellation request
  async rejectCancellationRequest(requestId: string, approverId: string, rejectionReason: string) {
    try {
      const cancellationRequest = await prisma.leaveCancellationRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          approvedBy: approverId,
          approvedAt: new Date(),
          rejectionReason,
        },
        include: {
          employee: true,
        },
      });

      // Create notification for employee
      await prisma.notification.create({
        data: {
          userId: cancellationRequest.employeeId,
          type: 'LEAVE_REJECTED',
          title: 'Leave Cancellation Rejected',
          message: `Your leave cancellation request has been rejected. Reason: ${rejectionReason}`,
          metadata: JSON.stringify({
            cancellationRequestId: requestId,
            rejectionReason,
          }),
        },
      });

      logger.info('Cancellation request rejected:', { requestId });
      return cancellationRequest;
    } catch (error) {
      logger.error('Error rejecting cancellation request:', error);
      throw error;
    }
  }

  // === MODIFICATION REQUESTS ===

  // Create modification request
  async createModificationRequest(data: CreateModificationRequestData) {
    try {
      // Check if original leave request exists
      const originalLeave = await prisma.leaveRequest.findUnique({
        where: { id: data.originalLeaveId },
        include: { employee: true },
      });

      if (!originalLeave) {
        throw new Error('Original leave request not found');
      }

      if (originalLeave.employeeId !== data.employeeId) {
        throw new Error('Not authorized to modify this leave request');
      }

      // Check if modification request already exists
      const existingModification = await prisma.leaveModificationRequest.findFirst({
        where: {
          originalLeaveId: data.originalLeaveId,
          status: 'PENDING',
        },
      });

      if (existingModification) {
        throw new Error('Modification request already exists for this leave');
      }

      const modificationRequest = await prisma.leaveModificationRequest.create({
        data: {
          originalLeaveId: data.originalLeaveId,
          employeeId: data.employeeId,
          newStartDate: data.newStartDate,
          newEndDate: data.newEndDate,
          newLeaveType: data.newLeaveType,
          newReason: data.newReason,
          modificationReason: data.modificationReason,
          status: 'PENDING',
        },
        include: {
          originalLeave: {
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
          },
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

      // Create notification for manager
      if (originalLeave.employee.reportingManagerId) {
        await prisma.notification.create({
          data: {
            userId: originalLeave.employee.reportingManagerId,
            type: 'APPROVAL_PENDING',
            title: 'Leave Modification Request',
            message: `${originalLeave.employee.firstName} ${originalLeave.employee.lastName} has requested to modify an existing leave.`,
            metadata: JSON.stringify({
              modificationRequestId: modificationRequest.id,
              originalLeaveId: data.originalLeaveId,
            }),
          },
        });
      }

      logger.info('Modification request created:', {
        requestId: modificationRequest.id,
        originalLeaveId: data.originalLeaveId
      });

      return modificationRequest;
    } catch (error) {
      logger.error('Error creating modification request:', error);
      throw error;
    }
  }

  // Get modification requests
  async getModificationRequests(filters: AdvancedRequestFilters = {}, page = 1, limit = 10) {
    try {
      const where: any = {};

      if (filters.employeeId) where.employeeId = filters.employeeId;
      if (filters.status) where.status = filters.status;

      const skip = (page - 1) * limit;

      const [requests, total] = await Promise.all([
        prisma.leaveModificationRequest.findMany({
          where,
          include: {
            originalLeave: {
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
            },
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                employeeId: true,
              },
            },
            approver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { appliedDate: 'desc' },
          skip,
          take: limit,
        }),
        prisma.leaveModificationRequest.count({ where }),
      ]);

      return {
        requests,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error fetching modification requests:', error);
      throw error;
    }
  }

  // Approve modification request
  async approveModificationRequest(requestId: string, approverId: string) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Get modification request
        const modificationRequest = await tx.leaveModificationRequest.update({
          where: { id: requestId },
          data: {
            status: 'APPROVED',
            approvedBy: approverId,
            approvedAt: new Date(),
          },
          include: {
            originalLeave: true,
            employee: true,
          },
        });

        // Calculate new total days if dates changed
        let newTotalDays = modificationRequest.originalLeave.totalDays;
        if (modificationRequest.newStartDate && modificationRequest.newEndDate) {
          const start = new Date(modificationRequest.newStartDate);
          const end = new Date(modificationRequest.newEndDate);
          newTotalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        }

        // Update original leave request
        const updateData: any = {};
        if (modificationRequest.newStartDate) updateData.startDate = modificationRequest.newStartDate;
        if (modificationRequest.newEndDate) updateData.endDate = modificationRequest.newEndDate;
        if (modificationRequest.newLeaveType) updateData.leaveType = modificationRequest.newLeaveType;
        if (modificationRequest.newReason) updateData.reason = modificationRequest.newReason;
        if (newTotalDays !== modificationRequest.originalLeave.totalDays) {
          updateData.totalDays = newTotalDays;
        }

        await tx.leaveRequest.update({
          where: { id: modificationRequest.originalLeaveId },
          data: updateData,
        });

        // Update leave balance if days changed
        if (newTotalDays !== modificationRequest.originalLeave.totalDays) {
          const difference = newTotalDays - modificationRequest.originalLeave.totalDays;
          const currentYear = new Date().getFullYear();

          await tx.leaveBalance.updateMany({
            where: {
              employeeId: modificationRequest.employeeId,
              leaveType: modificationRequest.newLeaveType || modificationRequest.originalLeave.leaveType,
              year: currentYear,
            },
            data: {
              used: { increment: difference },
              available: { decrement: difference },
            },
          });
        }

        // Create notification for employee
        await tx.notification.create({
          data: {
            userId: modificationRequest.employeeId,
            type: 'LEAVE_APPROVED',
            title: 'Leave Modification Approved',
            message: 'Your leave modification request has been approved.',
            metadata: JSON.stringify({
              modificationRequestId: requestId,
              originalLeaveId: modificationRequest.originalLeaveId,
            }),
          },
        });

        logger.info('Modification request approved:', { requestId });
        return modificationRequest;
      });
    } catch (error) {
      logger.error('Error approving modification request:', error);
      throw error;
    }
  }

  // Reject modification request
  async rejectModificationRequest(requestId: string, approverId: string, rejectionReason: string) {
    try {
      const modificationRequest = await prisma.leaveModificationRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          approvedBy: approverId,
          approvedAt: new Date(),
          rejectionReason,
        },
        include: {
          employee: true,
        },
      });

      // Create notification for employee
      await prisma.notification.create({
        data: {
          userId: modificationRequest.employeeId,
          type: 'LEAVE_REJECTED',
          title: 'Leave Modification Rejected',
          message: `Your leave modification request has been rejected. Reason: ${rejectionReason}`,
          metadata: JSON.stringify({
            modificationRequestId: requestId,
            rejectionReason,
          }),
        },
      });

      logger.info('Modification request rejected:', { requestId });
      return modificationRequest;
    } catch (error) {
      logger.error('Error rejecting modification request:', error);
      throw error;
    }
  }

  // Get advanced request statistics
  async getAdvancedRequestStats() {
    try {
      const [
        totalCancellations,
        pendingCancellations,
        approvedCancellations,
        totalModifications,
        pendingModifications,
        approvedModifications,
      ] = await Promise.all([
        prisma.leaveCancellationRequest.count(),
        prisma.leaveCancellationRequest.count({ where: { status: 'PENDING' } }),
        prisma.leaveCancellationRequest.count({ where: { status: 'APPROVED' } }),
        prisma.leaveModificationRequest.count(),
        prisma.leaveModificationRequest.count({ where: { status: 'PENDING' } }),
        prisma.leaveModificationRequest.count({ where: { status: 'APPROVED' } }),
      ]);

      return {
        cancellations: {
          total: totalCancellations,
          pending: pendingCancellations,
          approved: approvedCancellations,
        },
        modifications: {
          total: totalModifications,
          pending: pendingModifications,
          approved: approvedModifications,
        },
      };
    } catch (error) {
      logger.error('Error fetching advanced request statistics:', error);
      throw error;
    }
  }
}

export const advancedLeaveService = new AdvancedLeaveService();