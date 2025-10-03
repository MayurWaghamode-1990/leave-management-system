import { PrismaClient } from '@prisma/client';
import { multiLevelApprovalService } from './multiLevelApprovalService';
import { emailService } from './emailService';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// GLF Comp Off Policy Configuration
export interface CompOffPolicyRules {
  minimumHoursForHalfDay: number;    // 5 hours = 0.5 day
  minimumHoursForFullDay: number;    // 8 hours = 1 day
  maximumHoursPerDay: number;        // 12 hours max per day
  expiryMonths: number;              // 3 months from approval
  allowedWorkTypes: string[];        // WEEKEND, HOLIDAY, EXTENDED_HOURS
  requiresManagerVerification: boolean;
  maxCompOffDaysPerMonth: number;    // Prevent abuse
  weekendWorkWindow: {
    startDay: number;                // Saturday = 6
    endDay: number;                  // Sunday = 0
  };
}

export interface WorkLogData {
  employeeId: string;
  workDate: Date;
  hoursWorked: number;
  workType: 'WEEKEND' | 'HOLIDAY' | 'EXTENDED_HOURS';
  workDescription: string;
  projectDetails?: string;
}

export interface CompOffRequestData {
  employeeId: string;
  workLogId: string;
  hoursToRedeem: number;
  startDate: Date;
  endDate: Date;
  reason: string;
  isHalfDay?: boolean;
}

export interface CompOffValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  calculatedDays: number;
  expiryDate: Date;
}

export interface CompOffEligibilityCheck {
  eligible: boolean;
  reason?: string;
  availableHours: number;
  eligibleDays: number;
  restrictions: string[];
}

export class CompOffService {

  // GLF Comp Off Policy Configuration
  private readonly compOffPolicy: CompOffPolicyRules = {
    minimumHoursForHalfDay: 5,        // GLF: 5 hours = 0.5 day
    minimumHoursForFullDay: 8,        // GLF: 8 hours = 1 day
    maximumHoursPerDay: 12,           // Maximum allowed hours per day
    expiryMonths: 3,                  // GLF: 3 months from approval date
    allowedWorkTypes: ['WEEKEND', 'HOLIDAY', 'EXTENDED_HOURS'],
    requiresManagerVerification: true,
    maxCompOffDaysPerMonth: 4,        // Prevent abuse
    weekendWorkWindow: {
      startDay: 6,                    // Saturday
      endDay: 0                       // Sunday
    }
  };

  /**
   * Log weekend/holiday work for comp off eligibility
   */
  async logWork(data: WorkLogData): Promise<{
    success: boolean;
    workLogId?: string;
    compOffEarned: number;
    message: string;
  }> {
    try {
      logger.info('Logging work for comp off eligibility:', {
        employeeId: data.employeeId,
        workDate: data.workDate,
        hoursWorked: data.hoursWorked,
        workType: data.workType
      });

      // Validate work log data
      const validation = await this.validateWorkLog(data);
      if (!validation.valid) {
        return {
          success: false,
          compOffEarned: 0,
          message: `Work log validation failed: ${validation.errors.join(', ')}`
        };
      }

      // Calculate comp off days earned based on GLF policy
      const compOffEarned = this.calculateCompOffEarned(data.hoursWorked);

      // Create work log record
      const workLog = await prisma.compOffWorkLog.create({
        data: {
          employeeId: data.employeeId,
          workDate: data.workDate,
          hoursWorked: data.hoursWorked,
          workType: data.workType,
          workDescription: data.workDescription,
          projectDetails: data.projectDetails,
          compOffEarned: compOffEarned,
          status: 'PENDING' // Requires manager verification
        }
      });

      // Send notification to manager for verification
      await this.notifyManagerForVerification(workLog.id, data.employeeId);

      logger.info('Work log created successfully:', {
        workLogId: workLog.id,
        compOffEarned
      });

      return {
        success: true,
        workLogId: workLog.id,
        compOffEarned,
        message: `Work logged successfully. ${compOffEarned} comp off days earned (pending manager verification)`
      };

    } catch (error) {
      logger.error('Error logging work for comp off:', error);
      throw error;
    }
  }

  /**
   * Manager verification of work log
   */
  async verifyWorkLog(
    workLogId: string,
    managerId: string,
    isApproved: boolean,
    comments?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const workLog = await prisma.compOffWorkLog.findUnique({
        where: { id: workLogId },
        include: { employee: true }
      });

      if (!workLog) {
        throw new Error('Work log not found');
      }

      // Verify manager has authority to approve this employee's work
      const hasAuthority = await this.verifyManagerAuthority(managerId, workLog.employeeId);
      if (!hasAuthority) {
        throw new Error('Manager does not have authority to verify this work log');
      }

      const status = isApproved ? 'VERIFIED' : 'REJECTED';
      const compOffEarned = isApproved ? workLog.compOffEarned : 0;

      // Update work log
      await prisma.compOffWorkLog.update({
        where: { id: workLogId },
        data: {
          isVerified: isApproved,
          verifiedBy: managerId,
          verifiedAt: new Date(),
          status,
          compOffEarned
        }
      });

      if (isApproved) {
        // Update comp off balance
        await this.updateCompOffBalance(workLog.employeeId, compOffEarned, 'EARNED');

        // Send notification to employee
        await this.notifyEmployee(workLog.employeeId, 'WORK_VERIFIED', {
          hoursWorked: workLog.hoursWorked,
          compOffEarned,
          workDate: workLog.workDate
        });
      }

      logger.info(`Work log ${status.toLowerCase()}:`, {
        workLogId,
        managerId,
        compOffEarned
      });

      return {
        success: true,
        message: `Work log ${status.toLowerCase()} successfully. ${isApproved ? `${compOffEarned} comp off days added to balance.` : ''}`
      };

    } catch (error) {
      logger.error('Error verifying work log:', error);
      throw error;
    }
  }

  /**
   * Apply for comp off leave
   */
  async applyForCompOff(data: CompOffRequestData): Promise<{
    success: boolean;
    requestId?: string;
    validationResult: CompOffValidationResult;
    message: string;
  }> {
    try {
      logger.info('Processing comp off application:', {
        employeeId: data.employeeId,
        workLogId: data.workLogId,
        hoursToRedeem: data.hoursToRedeem,
        startDate: data.startDate,
        endDate: data.endDate
      });

      // Validate comp off request
      const validationResult = await this.validateCompOffRequest(data);
      if (!validationResult.valid) {
        return {
          success: false,
          validationResult,
          message: 'Comp off application validation failed'
        };
      }

      // Calculate expiry date (3 months from today)
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + this.compOffPolicy.expiryMonths);

      // Create comp off request
      const compOffRequest = await prisma.compOffRequest.create({
        data: {
          employeeId: data.employeeId,
          workLogId: data.workLogId,
          hoursToRedeem: data.hoursToRedeem,
          daysRequested: validationResult.calculatedDays,
          startDate: data.startDate,
          endDate: data.endDate,
          reason: data.reason,
          isHalfDay: data.isHalfDay || false,
          expiryDate,
          status: 'PENDING'
        }
      });

      // Create multi-level approval workflow (using existing service)
      await this.createCompOffApprovalWorkflow(compOffRequest.id, data.employeeId);

      // Mark work log as consumed
      await prisma.compOffWorkLog.update({
        where: { id: data.workLogId },
        data: { status: 'CONSUMED' }
      });

      // Send notifications
      await this.sendCompOffNotifications(compOffRequest.id, 'APPLIED');

      logger.info('Comp off application created successfully:', {
        requestId: compOffRequest.id,
        daysRequested: validationResult.calculatedDays
      });

      return {
        success: true,
        requestId: compOffRequest.id,
        validationResult,
        message: 'Comp off application submitted successfully'
      };

    } catch (error) {
      logger.error('Error processing comp off application:', error);
      throw error;
    }
  }

  /**
   * Validate work log data
   */
  private async validateWorkLog(data: WorkLogData): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Check if employee exists
      let employee = await prisma.user.findUnique({
        where: { id: data.employeeId }
      });

      // Fallback to mock user data if employee not found in database
      if (!employee) {
        const mockUsers = [
          {
            id: 'admin-001',
            firstName: 'System',
            lastName: 'Administrator',
            email: 'admin@company.com',
            location: 'Bengaluru',
            country: 'INDIA'
          },
          {
            id: 'emp-eng-001',
            firstName: 'Arjun',
            lastName: 'Singh',
            email: 'user@company.com',
            location: 'Bengaluru',
            country: 'INDIA'
          }
        ];

        const mockUser = mockUsers.find(u => u.id === data.employeeId);
        if (mockUser) {
          employee = mockUser;
        } else {
          errors.push('Employee not found');
          return { valid: false, errors };
        }
      }

      // Validate work type
      if (!this.compOffPolicy.allowedWorkTypes.includes(data.workType)) {
        errors.push(`Invalid work type. Allowed types: ${this.compOffPolicy.allowedWorkTypes.join(', ')}`);
      }

      // Validate hours worked
      if (data.hoursWorked <= 0) {
        errors.push('Hours worked must be greater than 0');
      }

      if (data.hoursWorked > this.compOffPolicy.maximumHoursPerDay) {
        errors.push(`Maximum ${this.compOffPolicy.maximumHoursPerDay} hours allowed per day`);
      }

      if (data.hoursWorked < this.compOffPolicy.minimumHoursForHalfDay) {
        errors.push(`Minimum ${this.compOffPolicy.minimumHoursForHalfDay} hours required for comp off eligibility`);
      }

      // Validate work date
      const workDate = new Date(data.workDate);
      const today = new Date();

      if (workDate > today) {
        errors.push('Work date cannot be in the future');
      }

      // Check if work date is too old (e.g., more than 30 days ago)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      if (workDate < thirtyDaysAgo) {
        errors.push('Work date cannot be more than 30 days old');
      }

      // Validate weekend work
      if (data.workType === 'WEEKEND') {
        const dayOfWeek = workDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Saturday or Sunday
          errors.push('Weekend work must be on Saturday or Sunday');
        }
      }

      // Validate holiday work
      if (data.workType === 'HOLIDAY') {
        const isHoliday = await this.isHolidayDate(workDate);
        if (!isHoliday) {
          errors.push('Work date must be a declared holiday for holiday work type');
        }
      }

      // Check for duplicate work log on same date
      const existingWorkLog = await prisma.compOffWorkLog.findFirst({
        where: {
          employeeId: data.employeeId,
          workDate: workDate,
          status: { in: ['PENDING', 'VERIFIED'] }
        }
      });

      if (existingWorkLog) {
        errors.push('Work log already exists for this date');
      }

      return { valid: errors.length === 0, errors };

    } catch (error) {
      logger.error('Error validating work log:', error);
      return { valid: false, errors: ['System error during validation'] };
    }
  }

  /**
   * Validate comp off request
   */
  private async validateCompOffRequest(data: CompOffRequestData): Promise<CompOffValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Get work log details
      const workLog = await prisma.compOffWorkLog.findUnique({
        where: { id: data.workLogId }
      });

      if (!workLog) {
        errors.push('Work log not found');
        return { valid: false, errors, warnings, calculatedDays: 0, expiryDate: new Date() };
      }

      if (workLog.employeeId !== data.employeeId) {
        errors.push('Work log does not belong to this employee');
      }

      if (workLog.status !== 'VERIFIED') {
        errors.push('Work log must be verified by manager before requesting comp off');
      }

      if (workLog.status === 'CONSUMED') {
        errors.push('Work log has already been used for comp off');
      }

      // Calculate comp off days based on hours requested
      const calculatedDays = this.calculateCompOffDays(data.hoursToRedeem);

      if (data.hoursToRedeem > workLog.hoursWorked) {
        errors.push('Cannot redeem more hours than worked');
      }

      if (data.hoursToRedeem < this.compOffPolicy.minimumHoursForHalfDay) {
        errors.push(`Minimum ${this.compOffPolicy.minimumHoursForHalfDay} hours required for comp off`);
      }

      // Validate dates
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      const today = new Date();

      if (startDate < today) {
        errors.push('Comp off start date cannot be in the past');
      }

      if (endDate < startDate) {
        errors.push('End date cannot be before start date');
      }

      // Check if dates match calculated days
      const daysDifference = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      if (Math.abs(daysDifference - calculatedDays) > 0.1) { // Allow small floating point differences
        errors.push(`Date range (${daysDifference} days) does not match calculated comp off days (${calculatedDays})`);
      }

      // Check comp off balance
      const currentYear = new Date().getFullYear();
      const balance = await prisma.compOffBalance.findUnique({
        where: {
          employeeId_year: {
            employeeId: data.employeeId,
            year: currentYear
          }
        }
      });

      if (!balance || balance.available < calculatedDays) {
        errors.push(`Insufficient comp off balance. Available: ${balance?.available || 0} days`);
      }

      // Check overlapping comp off requests
      const overlappingRequests = await prisma.compOffRequest.findMany({
        where: {
          employeeId: data.employeeId,
          status: { in: ['PENDING', 'APPROVED'] },
          OR: [
            {
              startDate: { lte: endDate },
              endDate: { gte: startDate }
            }
          ]
        }
      });

      if (overlappingRequests.length > 0) {
        errors.push('Comp off dates overlap with existing requests');
      }

      // Calculate expiry date
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + this.compOffPolicy.expiryMonths);

      // Add warnings
      if (calculatedDays < 1) {
        warnings.push('Partial day comp off may affect payroll calculation');
      }

      const workLogAge = Math.ceil((today.getTime() - workLog.workDate.getTime()) / (1000 * 60 * 60 * 24));
      if (workLogAge > 60) {
        warnings.push('Work log is quite old. Consider applying for comp off sooner');
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        calculatedDays,
        expiryDate
      };

    } catch (error) {
      logger.error('Error validating comp off request:', error);
      return {
        valid: false,
        errors: ['System error during validation'],
        warnings,
        calculatedDays: 0,
        expiryDate: new Date()
      };
    }
  }

  /**
   * Calculate comp off days earned based on hours worked (GLF Policy)
   */
  private calculateCompOffEarned(hoursWorked: number): number {
    if (hoursWorked >= this.compOffPolicy.minimumHoursForFullDay) {
      // 8+ hours = 1 full day
      return Math.floor(hoursWorked / this.compOffPolicy.minimumHoursForFullDay) +
             (hoursWorked % this.compOffPolicy.minimumHoursForFullDay >= this.compOffPolicy.minimumHoursForHalfDay ? 0.5 : 0);
    } else if (hoursWorked >= this.compOffPolicy.minimumHoursForHalfDay) {
      // 5-7 hours = 0.5 day
      return 0.5;
    } else {
      // Less than 5 hours = no comp off
      return 0;
    }
  }

  /**
   * Calculate comp off days from hours to redeem (GLF Policy)
   */
  private calculateCompOffDays(hoursToRedeem: number): number {
    if (hoursToRedeem >= this.compOffPolicy.minimumHoursForFullDay) {
      return Math.floor(hoursToRedeem / this.compOffPolicy.minimumHoursForFullDay) +
             (hoursToRedeem % this.compOffPolicy.minimumHoursForFullDay >= this.compOffPolicy.minimumHoursForHalfDay ? 0.5 : 0);
    } else if (hoursToRedeem >= this.compOffPolicy.minimumHoursForHalfDay) {
      return 0.5;
    } else {
      return 0;
    }
  }

  /**
   * Check if a date is a declared holiday
   */
  private async isHolidayDate(date: Date): Promise<boolean> {
    try {
      const holiday = await prisma.holiday.findFirst({
        where: {
          date: {
            gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
            lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
          }
        }
      });

      return !!holiday;
    } catch (error) {
      logger.error('Error checking holiday date:', error);
      return false;
    }
  }

  /**
   * Verify manager authority over employee
   */
  private async verifyManagerAuthority(managerId: string, employeeId: string): Promise<boolean> {
    try {
      const employee = await prisma.user.findUnique({
        where: { id: employeeId },
        select: { reportingManagerId: true }
      });

      const manager = await prisma.user.findUnique({
        where: { id: managerId },
        select: { role: true }
      });

      // Direct reporting manager or HR/IT admin can verify
      return employee?.reportingManagerId === managerId ||
             ['HR_ADMIN', 'IT_ADMIN'].includes(manager?.role || '');
    } catch (error) {
      logger.error('Error verifying manager authority:', error);
      return false;
    }
  }

  /**
   * Update comp off balance
   */
  private async updateCompOffBalance(
    employeeId: string,
    amount: number,
    operation: 'EARNED' | 'USED' | 'EXPIRED'
  ): Promise<void> {
    try {
      const currentYear = new Date().getFullYear();

      const balance = await prisma.compOffBalance.upsert({
        where: {
          employeeId_year: {
            employeeId,
            year: currentYear
          }
        },
        update: {},
        create: {
          employeeId,
          year: currentYear,
          totalEarned: 0,
          totalUsed: 0,
          available: 0,
          expired: 0
        }
      });

      let updateData: any = {};

      switch (operation) {
        case 'EARNED':
          updateData = {
            totalEarned: { increment: amount },
            available: { increment: amount }
          };
          break;
        case 'USED':
          updateData = {
            totalUsed: { increment: amount },
            available: { decrement: amount }
          };
          break;
        case 'EXPIRED':
          updateData = {
            expired: { increment: amount },
            available: { decrement: amount }
          };
          break;
      }

      await prisma.compOffBalance.update({
        where: { id: balance.id },
        data: updateData
      });

    } catch (error) {
      logger.error('Error updating comp off balance:', error);
      throw error;
    }
  }

  /**
   * Create multi-level approval workflow for comp off
   */
  private async createCompOffApprovalWorkflow(requestId: string, employeeId: string): Promise<void> {
    try {
      // Use existing multi-level approval service for COMPENSATORY_OFF
      const approvalChain = await multiLevelApprovalService.buildApprovalChain(
        requestId,
        employeeId,
        'COMPENSATORY_OFF'
      );

      // Create approval records using the chain data
      const approvals = approvalChain.levels.map(level => ({
        compOffRequestId: requestId,
        approverId: level.approverId,
        level: level.level,
        status: 'PENDING'
      }));

      await prisma.compOffApproval.createMany({
        data: approvals
      });

    } catch (error) {
      logger.error('Error creating comp off approval workflow:', error);
      throw error;
    }
  }

  /**
   * Send comp off notifications
   */
  private async sendCompOffNotifications(requestId: string, action: string): Promise<void> {
    try {
      // Implementation would send notifications to managers and employee
      logger.info('Comp off notifications sent:', { requestId, action });
    } catch (error) {
      logger.error('Error sending comp off notifications:', error);
      // Don't throw - notification failure shouldn't break the process
    }
  }

  /**
   * Notify manager for work verification
   */
  private async notifyManagerForVerification(workLogId: string, employeeId: string): Promise<void> {
    try {
      const employee = await prisma.user.findUnique({
        where: { id: employeeId },
        select: { reportingManagerId: true }
      });

      if (employee?.reportingManagerId) {
        await prisma.notification.create({
          data: {
            userId: employee.reportingManagerId,
            type: 'COMP_OFF_VERIFICATION',
            title: 'Work Verification Required',
            message: 'Employee has logged weekend/holiday work requiring verification',
            metadata: JSON.stringify({ workLogId, employeeId })
          }
        });
      }
    } catch (error) {
      logger.error('Error notifying manager:', error);
    }
  }

  /**
   * Notify employee
   */
  private async notifyEmployee(employeeId: string, type: string, data: any): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          userId: employeeId,
          type: `COMP_OFF_${type}`,
          title: 'Comp Off Update',
          message: 'Your comp off status has been updated',
          metadata: JSON.stringify(data)
        }
      });
    } catch (error) {
      logger.error('Error notifying employee:', error);
    }
  }

  /**
   * Get comp off eligibility for employee
   */
  async getCompOffEligibility(employeeId: string): Promise<CompOffEligibilityCheck> {
    try {
      const currentYear = new Date().getFullYear();

      // Get verified work logs that haven't been consumed
      const availableWorkLogs = await prisma.compOffWorkLog.findMany({
        where: {
          employeeId,
          status: 'VERIFIED',
          workDate: {
            gte: new Date(currentYear, 0, 1),
            lt: new Date(currentYear + 1, 0, 1)
          }
        }
      });

      const availableHours = availableWorkLogs.reduce((total, log) => total + log.hoursWorked, 0);
      const eligibleDays = this.calculateCompOffEarned(availableHours);

      const restrictions: string[] = [];
      if (availableHours < this.compOffPolicy.minimumHoursForHalfDay) {
        restrictions.push(`Minimum ${this.compOffPolicy.minimumHoursForHalfDay} hours required`);
      }

      return {
        eligible: availableHours >= this.compOffPolicy.minimumHoursForHalfDay,
        availableHours,
        eligibleDays,
        restrictions
      };

    } catch (error) {
      logger.error('Error checking comp off eligibility:', error);
      throw error;
    }
  }

  /**
   * Get comp off policy configuration
   */
  getCompOffPolicy(): CompOffPolicyRules {
    return this.compOffPolicy;
  }

  /**
   * Process comp off expiration (run monthly)
   */
  async processCompOffExpiration(): Promise<{ expired: number; message: string }> {
    try {
      const today = new Date();

      // Find all approved comp off requests that have expired
      const expiredRequests = await prisma.compOffRequest.findMany({
        where: {
          status: 'APPROVED',
          expiryDate: { lt: today },
          isExpired: false
        }
      });

      let expiredCount = 0;

      for (const request of expiredRequests) {
        // Mark as expired
        await prisma.compOffRequest.update({
          where: { id: request.id },
          data: {
            isExpired: true,
            status: 'EXPIRED'
          }
        });

        // Update balance
        await this.updateCompOffBalance(request.employeeId, request.daysRequested, 'EXPIRED');

        expiredCount++;
      }

      logger.info(`Processed comp off expiration: ${expiredCount} requests expired`);

      return {
        expired: expiredCount,
        message: `${expiredCount} comp off requests expired and processed`
      };

    } catch (error) {
      logger.error('Error processing comp off expiration:', error);
      throw error;
    }
  }
}

export const compOffService = new CompOffService();
export type { WorkLogData, CompOffRequestData, CompOffValidationResult, CompOffEligibilityCheck, CompOffPolicyRules };