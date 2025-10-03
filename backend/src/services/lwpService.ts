import { PrismaClient } from '@prisma/client';
import { multiLevelApprovalService } from './multiLevelApprovalService';
import { emailService } from './emailService';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface LWPApplicationData {
  employeeId: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  additionalDetails?: string;
  expectedReturnDate?: Date;
  contactInformation?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  attachments?: string[];
}

export interface LWPApprovalContext {
  isManagerApproved: boolean;
  managerComments?: string;
  hrComments?: string;
  adminComments?: string;
  requiresAdditionalApproval: boolean;
  businessJustification?: string;
}

export class LWPService {
  /**
   * Apply for Leave Without Pay
   */
  static async applyForLWP(data: LWPApplicationData): Promise<LeaveRequest> {
    try {
      logger.info('Processing LWP application:', {
        employeeId: data.employeeId,
        startDate: data.startDate,
        endDate: data.endDate
      });

      // Validate employee exists and is active
      const employee = await prisma.user.findUnique({
        where: { id: data.employeeId },
        include: { reportingManager: true }
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      if (employee.status !== 'ACTIVE') {
        throw new Error('Only active employees can apply for LWP');
      }

      // Calculate total days
      const totalDays = this.calculateWorkingDays(data.startDate, data.endDate);

      // Validate LWP specific business rules
      await this.validateLWPRules(data, employee, totalDays);

      // Create the leave request
      const leaveRequest = await prisma.leaveRequest.create({
        data: {
          employeeId: data.employeeId,
          leaveType: LeaveType.LEAVE_WITHOUT_PAY,
          startDate: data.startDate,
          endDate: data.endDate,
          totalDays,
          isHalfDay: false, // LWP is always full day
          reason: data.reason,
          attachments: data.attachments ? JSON.stringify(data.attachments) : null,
          status: LeaveStatus.PENDING,
        },
        include: {
          employee: {
            include: {
              reportingManager: true
            }
          }
        }
      });

      // Create approval workflow - LWP requires enhanced approval process
      await this.createLWPApprovalWorkflow(leaveRequest, data);

      // Store additional LWP metadata
      await this.storeLWPMetadata(leaveRequest.id, data);

      // Send notifications
      await this.sendLWPNotifications(leaveRequest, 'APPLIED');

      logger.info('LWP application created successfully:', {
        leaveRequestId: leaveRequest.id,
        employeeId: data.employeeId
      });

      return leaveRequest;
    } catch (error) {
      logger.error('Error processing LWP application:', error);
      throw error;
    }
  }

  /**
   * Validate LWP specific business rules
   */
  private static async validateLWPRules(
    data: LWPApplicationData,
    employee: User,
    totalDays: number
  ): Promise<void> {
    // Check minimum employment duration (3 months)
    const employmentDuration = Date.now() - employee.joiningDate.getTime();
    const threeMonthsInMs = 90 * 24 * 60 * 60 * 1000;

    if (employmentDuration < threeMonthsInMs) {
      throw new Error('Employee must complete at least 3 months of employment before applying for LWP');
    }

    // Check for existing LWP in the current year
    const currentYear = new Date().getFullYear();
    const existingLWP = await prisma.leaveRequest.findFirst({
      where: {
        employeeId: data.employeeId,
        leaveType: LeaveType.LEAVE_WITHOUT_PAY,
        startDate: {
          gte: new Date(currentYear, 0, 1),
          lte: new Date(currentYear, 11, 31)
        },
        status: {
          in: [LeaveStatus.APPROVED, LeaveStatus.PENDING]
        }
      }
    });

    if (existingLWP) {
      throw new Error('Employee already has LWP request in current year. Multiple LWP requests require special approval.');
    }

    // Validate maximum continuous LWP duration (1 year)
    if (totalDays > 365) {
      throw new Error('LWP duration cannot exceed 365 days');
    }

    // Check for overlap with other approved leaves
    const overlappingLeaves = await prisma.leaveRequest.findMany({
      where: {
        employeeId: data.employeeId,
        status: LeaveStatus.APPROVED,
        OR: [
          {
            startDate: { lte: data.endDate },
            endDate: { gte: data.startDate }
          }
        ]
      }
    });

    if (overlappingLeaves.length > 0) {
      throw new Error('LWP dates overlap with existing approved leaves');
    }

    // Validate advance notice (minimum 30 days for long-term LWP)
    const advanceNotice = data.startDate.getTime() - Date.now();
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;

    if (totalDays > 30 && advanceNotice < thirtyDaysInMs && data.urgencyLevel !== 'CRITICAL') {
      throw new Error('Long-term LWP (>30 days) requires at least 30 days advance notice');
    }
  }

  /**
   * Create enhanced approval workflow for LWP
   */
  private static async createLWPApprovalWorkflow(
    leaveRequest: LeaveRequest & { employee: User & { reportingManager: User | null } },
    data: LWPApplicationData
  ): Promise<void> {
    const approvals = [];

    // Level 1: Direct Manager (mandatory)
    if (leaveRequest.employee.reportingManagerId) {
      approvals.push({
        leaveRequestId: leaveRequest.id,
        approverId: leaveRequest.employee.reportingManagerId,
        level: 1,
        status: 'PENDING'
      });
    }

    // Level 2: HR Admin (mandatory for LWP)
    const hrAdmin = await prisma.user.findFirst({
      where: { role: 'HR_ADMIN' }
    });

    if (hrAdmin) {
      approvals.push({
        leaveRequestId: leaveRequest.id,
        approverId: hrAdmin.id,
        level: 2,
        status: 'PENDING'
      });
    }

    // Level 3: Additional approval for long-term LWP (>90 days)
    if (leaveRequest.totalDays > 90) {
      const itAdmin = await prisma.user.findFirst({
        where: { role: 'IT_ADMIN' }
      });

      if (itAdmin) {
        approvals.push({
          leaveRequestId: leaveRequest.id,
          approverId: itAdmin.id,
          level: 3,
          status: 'PENDING'
        });
      }
    }

    // Create all approval records
    await prisma.approval.createMany({
      data: approvals
    });
  }

  /**
   * Store additional LWP metadata
   */
  private static async storeLWPMetadata(
    leaveRequestId: string,
    data: LWPApplicationData
  ): Promise<void> {
    const metadata = {
      urgencyLevel: data.urgencyLevel,
      additionalDetails: data.additionalDetails,
      expectedReturnDate: data.expectedReturnDate?.toISOString(),
      contactInformation: data.contactInformation,
      emergencyContactName: data.emergencyContactName,
      emergencyContactPhone: data.emergencyContactPhone,
      applicationDate: new Date().toISOString(),
      lwpType: 'EXTENDED' // Could be MEDICAL, PERSONAL, STUDY, etc.
    };

    // Store in audit log for tracking
    await prisma.auditLog.create({
      data: {
        entity: 'LeaveRequest',
        entityId: leaveRequestId,
        action: 'LWP_METADATA_STORED',
        newValues: JSON.stringify(metadata),
        createdAt: new Date()
      }
    });
  }

  /**
   * Calculate working days between two dates
   */
  private static calculateWorkingDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      // Count only weekdays (Monday = 1, Friday = 5)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  /**
   * Send LWP specific notifications
   */
  private static async sendLWPNotifications(
    leaveRequest: any,
    action: 'APPLIED' | 'APPROVED' | 'REJECTED'
  ): Promise<void> {
    // Create notification for employee
    await prisma.notification.create({
      data: {
        userId: leaveRequest.employeeId,
        type: 'LWP_APPLICATION',
        title: `LWP Application ${action}`,
        message: `Your Leave Without Pay application for ${leaveRequest.totalDays} days has been ${action.toLowerCase()}`,
        metadata: JSON.stringify({
          leaveRequestId: leaveRequest.id,
          startDate: leaveRequest.startDate,
          endDate: leaveRequest.endDate,
          urgency: 'HIGH' // LWP notifications are high priority
        })
      }
    });

    // Create notification for manager if exists
    if (leaveRequest.employee?.reportingManagerId) {
      await prisma.notification.create({
        data: {
          userId: leaveRequest.employee.reportingManagerId,
          type: 'LWP_APPROVAL_REQUIRED',
          title: 'LWP Approval Required',
          message: `${leaveRequest.employee.firstName} ${leaveRequest.employee.lastName} has applied for Leave Without Pay requiring your approval`,
          metadata: JSON.stringify({
            leaveRequestId: leaveRequest.id,
            employeeId: leaveRequest.employeeId,
            urgency: 'HIGH'
          })
        }
      });
    }
  }

  /**
   * Get LWP application details with metadata
   */
  static async getLWPDetails(leaveRequestId: string): Promise<any> {
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: leaveRequestId },
      include: {
        employee: true,
        approvals: {
          include: { approver: true }
        }
      }
    });

    if (!leaveRequest || leaveRequest.leaveType !== LeaveType.LEAVE_WITHOUT_PAY) {
      throw new Error('LWP request not found');
    }

    // Get metadata from audit log
    const metadata = await prisma.auditLog.findFirst({
      where: {
        entity: 'LeaveRequest',
        entityId: leaveRequestId,
        action: 'LWP_METADATA_STORED'
      }
    });

    return {
      ...leaveRequest,
      lwpMetadata: metadata ? JSON.parse(metadata.newValues || '{}') : {}
    };
  }

  /**
   * Approve/Reject LWP with enhanced context
   */
  static async processLWPApproval(
    leaveRequestId: string,
    approverId: string,
    decision: 'APPROVED' | 'REJECTED',
    comments?: string,
    context?: LWPApprovalContext
  ): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        // Update the specific approval record
        const approval = await tx.approval.findFirst({
          where: {
            leaveRequestId,
            approverId,
            status: 'PENDING'
          }
        });

        if (!approval) {
          throw new Error('Approval record not found or already processed');
        }

        await tx.approval.update({
          where: { id: approval.id },
          data: {
            status: decision,
            comments,
            approvedAt: new Date()
          }
        });

        // Check if all required approvals are complete
        const pendingApprovals = await tx.approval.findMany({
          where: {
            leaveRequestId,
            status: 'PENDING'
          }
        });

        // If this was a rejection or all approvals are complete
        if (decision === 'REJECTED' || pendingApprovals.length === 0) {
          const finalStatus = decision === 'REJECTED' ? 'REJECTED' : 'APPROVED';

          await tx.leaveRequest.update({
            where: { id: leaveRequestId },
            data: { status: finalStatus }
          });

          // Store approval context
          if (context) {
            await tx.auditLog.create({
              data: {
                entity: 'LeaveRequest',
                entityId: leaveRequestId,
                action: `LWP_${decision}`,
                newValues: JSON.stringify({
                  approverId,
                  decision,
                  comments,
                  context,
                  processedAt: new Date().toISOString()
                })
              }
            });
          }
        }
      });

      logger.info(`LWP ${decision.toLowerCase()} processed`, {
        leaveRequestId,
        approverId,
        decision
      });
    } catch (error) {
      logger.error('Error processing LWP approval:', error);
      throw error;
    }
  }
}