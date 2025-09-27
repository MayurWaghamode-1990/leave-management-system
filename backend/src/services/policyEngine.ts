import { PrismaClient } from '@prisma/client';
import { LeaveType, UserRole, Region } from '../types/enums';

const prisma = new PrismaClient();

export interface LeaveValidationRequest {
  employeeId: string;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  isHalfDay?: boolean;
  reason?: string;
}

export interface LeaveValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  requiredDocumentation: boolean;
  autoApprovalEligible: boolean;
  approvalChain: string[];
}

export interface LeaveBalance {
  totalEntitlement: number;
  used: number;
  available: number;
  carryForward: number;
}

export class LeaveValidationEngine {
  /**
   * Validates a leave request against all applicable policies
   */
  async validateLeaveRequest(request: LeaveValidationRequest): Promise<LeaveValidationResult> {
    const result: LeaveValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      requiredDocumentation: false,
      autoApprovalEligible: false,
      approvalChain: []
    };

    try {
      // Get employee details
      const employee = await prisma.user.findUnique({
        where: { id: request.employeeId },
        include: { reportingManager: true }
      });

      if (!employee) {
        result.isValid = false;
        result.errors.push('Employee not found');
        return result;
      }

      // Basic date validations
      await this.validateDates(request, result);

      // Check leave balance
      await this.validateLeaveBalance(request, result);

      // Apply policy rules
      await this.applyPolicyRules(request, employee, result);

      // Determine approval chain
      await this.determineApprovalChain(request, employee, result);

      // Check if auto-approval eligible
      this.checkAutoApprovalEligibility(request, employee, result);

    } catch (error) {
      result.isValid = false;
      result.errors.push('Policy validation failed: ' + (error as Error).message);
    }

    return result;
  }

  /**
   * Validates basic date constraints
   */
  private async validateDates(request: LeaveValidationRequest, result: LeaveValidationResult): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start date cannot be after end date
    if (request.startDate > request.endDate) {
      result.isValid = false;
      result.errors.push('Start date cannot be after end date');
    }

    // Cannot apply for leave more than 365 days in advance
    const maxAdvanceDays = 365;
    const maxAdvanceDate = new Date();
    maxAdvanceDate.setDate(maxAdvanceDate.getDate() + maxAdvanceDays);

    if (request.startDate > maxAdvanceDate) {
      result.isValid = false;
      result.errors.push(`Cannot apply for leave more than ${maxAdvanceDays} days in advance`);
    }

    // Cannot apply for past dates (except for retroactive applications within 30 days)
    const minPastDays = -30;
    const minPastDate = new Date();
    minPastDate.setDate(minPastDate.getDate() + minPastDays);

    if (request.startDate < minPastDate) {
      result.isValid = false;
      result.errors.push('Cannot apply for leave more than 30 days in the past');
    }

    // Check for weekends and holidays
    await this.checkWeekendsAndHolidays(request, result);
  }

  /**
   * Checks if leave dates fall on weekends or holidays
   */
  private async checkWeekendsAndHolidays(request: LeaveValidationRequest, result: LeaveValidationResult): Promise<void> {
    const startDate = new Date(request.startDate);
    const endDate = new Date(request.endDate);

    // Mock weekend check (Saturday = 6, Sunday = 0)
    const isWeekend = (date: Date) => {
      const day = date.getDay();
      return day === 0 || day === 6;
    };

    if (isWeekend(startDate) || isWeekend(endDate)) {
      result.warnings.push('Leave application includes weekend dates');
    }

    // Check against holidays (simplified - could be enhanced with actual holiday calendar)
    try {
      const holidays = await prisma.holiday.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      if (holidays.length > 0) {
        result.warnings.push(`Leave period includes ${holidays.length} holiday(s): ${holidays.map(h => h.name).join(', ')}`);
      }
    } catch {
      // If database query fails, continue without holiday check
    }
  }

  /**
   * Validates available leave balance
   */
  private async validateLeaveBalance(request: LeaveValidationRequest, result: LeaveValidationResult): Promise<void> {
    try {
      const currentYear = new Date().getFullYear();

      const leaveBalance = await prisma.leaveBalance.findUnique({
        where: {
          employeeId_leaveType_year: {
            employeeId: request.employeeId,
            leaveType: request.leaveType,
            year: currentYear
          }
        }
      });

      if (!leaveBalance) {
        result.isValid = false;
        result.errors.push(`No leave balance found for ${request.leaveType}`);
        return;
      }

      if (request.totalDays > leaveBalance.available) {
        result.isValid = false;
        result.errors.push(`Insufficient leave balance. Available: ${leaveBalance.available} days, Requested: ${request.totalDays} days`);
      } else if (request.totalDays > leaveBalance.available * 0.8) {
        result.warnings.push(`Using most of available leave balance (${request.totalDays}/${leaveBalance.available} days)`);
      }

    } catch {
      // If database query fails, use mock validation
      result.warnings.push('Using mock leave balance validation');

      // Mock balance check
      const mockBalances: Record<LeaveType, number> = {
        SICK_LEAVE: 12,
        CASUAL_LEAVE: 12,
        EARNED_LEAVE: 21,
        MATERNITY_LEAVE: 180,
        PATERNITY_LEAVE: 15,
        COMPENSATORY_OFF: 10,
        BEREAVEMENT_LEAVE: 3,
        MARRIAGE_LEAVE: 5,
        LEAVE_WITHOUT_PAY: 365,
        PTO: 20
      };

      const available = mockBalances[request.leaveType] || 0;
      if (request.totalDays > available) {
        result.isValid = false;
        result.errors.push(`Insufficient leave balance. Available: ${available} days, Requested: ${request.totalDays} days`);
      }
    }
  }

  /**
   * Applies policy rules based on leave type and employee details
   */
  private async applyPolicyRules(request: LeaveValidationRequest, employee: any, result: LeaveValidationResult): Promise<void> {
    // Get applicable policy
    try {
      const policy = await prisma.leavePolicy.findFirst({
        where: {
          leaveType: request.leaveType,
          location: employee.location,
          isActive: true,
          effectiveFrom: { lte: new Date() },
          OR: [
            { effectiveTo: null },
            { effectiveTo: { gte: new Date() } }
          ]
        }
      });

      if (policy) {
        await this.applySpecificPolicyRules(request, policy, result);
      } else {
        // Apply default policy rules
        await this.applyDefaultPolicyRules(request, result);
      }
    } catch {
      // If database query fails, apply default rules
      await this.applyDefaultPolicyRules(request, result);
    }
  }

  /**
   * Applies rules from a specific policy
   */
  private async applySpecificPolicyRules(request: LeaveValidationRequest, policy: any, result: LeaveValidationResult): Promise<void> {
    // Check maximum consecutive days
    if (request.totalDays > policy.maxConsecutiveDays) {
      result.isValid = false;
      result.errors.push(`Maximum consecutive days for ${request.leaveType} is ${policy.maxConsecutiveDays}`);
    }

    // Check documentation requirement
    if (policy.requiresDocumentation && request.totalDays >= policy.documentationThreshold) {
      result.requiredDocumentation = true;
      result.warnings.push(`Documentation required for ${request.leaveType} leave of ${request.totalDays} days or more`);
    }

    // Check minimum gap (if applicable)
    if (policy.minimumGap > 0) {
      // This would require checking against previous leave requests
      result.warnings.push(`Minimum ${policy.minimumGap} days gap required between ${request.leaveType} applications`);
    }
  }

  /**
   * Applies default policy rules when no specific policy is found
   */
  private async applyDefaultPolicyRules(request: LeaveValidationRequest, result: LeaveValidationResult): Promise<void> {
    const rules: Record<LeaveType, any> = {
      SICK_LEAVE: { maxConsecutive: 10, documentationThreshold: 3, autoApproval: false },
      CASUAL_LEAVE: { maxConsecutive: 3, documentationThreshold: 0, autoApproval: true },
      EARNED_LEAVE: { maxConsecutive: 30, documentationThreshold: 0, autoApproval: false },
      MATERNITY_LEAVE: { maxConsecutive: 180, documentationThreshold: 1, autoApproval: false },
      PATERNITY_LEAVE: { maxConsecutive: 15, documentationThreshold: 1, autoApproval: false },
      COMPENSATORY_OFF: { maxConsecutive: 2, documentationThreshold: 0, autoApproval: true },
      BEREAVEMENT_LEAVE: { maxConsecutive: 5, documentationThreshold: 1, autoApproval: false },
      MARRIAGE_LEAVE: { maxConsecutive: 7, documentationThreshold: 1, autoApproval: false },
      LEAVE_WITHOUT_PAY: { maxConsecutive: 365, documentationThreshold: 1, autoApproval: false },
      PTO: { maxConsecutive: 30, documentationThreshold: 0, autoApproval: false }
    };

    const rule = rules[request.leaveType];
    if (!rule) {
      result.warnings.push(`No policy rules defined for ${request.leaveType}`);
      return;
    }

    // Check maximum consecutive days
    if (request.totalDays > rule.maxConsecutive) {
      result.isValid = false;
      result.errors.push(`Maximum consecutive days for ${request.leaveType} is ${rule.maxConsecutive}`);
    }

    // Check documentation requirement
    if (rule.documentationThreshold > 0 && request.totalDays >= rule.documentationThreshold) {
      result.requiredDocumentation = true;
      result.warnings.push(`Documentation may be required for ${request.leaveType} leave of ${request.totalDays} days`);
    }
  }

  /**
   * Determines the approval chain for the leave request
   */
  private async determineApprovalChain(request: LeaveValidationRequest, employee: any, result: LeaveValidationResult): Promise<void> {
    const approvers: string[] = [];

    // Level 1: Direct Manager (for most leave types)
    if (employee.reportingManagerId) {
      approvers.push(employee.reportingManagerId);
    }

    // Level 2: HR Admin for long leaves or special leave types
    const requiresHRApproval = [
      'MATERNITY_LEAVE',
      'PATERNITY_LEAVE',
      'BEREAVEMENT_LEAVE',
      'MARRIAGE_LEAVE'
    ].includes(request.leaveType) || request.totalDays > 10;

    if (requiresHRApproval) {
      try {
        const hrAdmin = await prisma.user.findFirst({
          where: { role: UserRole.HR_ADMIN },
          select: { id: true }
        });

        if (hrAdmin && !approvers.includes(hrAdmin.id)) {
          approvers.push(hrAdmin.id);
        }
      } catch {
        // If database query fails, add mock HR admin
        approvers.push('hr-admin-1');
      }
    }

    // Level 3: IT Admin for extended leaves (more than 30 days)
    if (request.totalDays > 30) {
      try {
        const itAdmin = await prisma.user.findFirst({
          where: { role: UserRole.IT_ADMIN },
          select: { id: true }
        });

        if (itAdmin && !approvers.includes(itAdmin.id)) {
          approvers.push(itAdmin.id);
        }
      } catch {
        // If database query fails, add mock IT admin
        approvers.push('it-admin-1');
      }
    }

    result.approvalChain = approvers;
  }

  /**
   * Checks if the request is eligible for auto-approval
   */
  private checkAutoApprovalEligibility(request: LeaveValidationRequest, employee: any, result: LeaveValidationResult): void {
    // Auto-approval criteria
    const autoApprovalTypes = [LeaveType.CASUAL_LEAVE, LeaveType.COMPENSATORY_OFF];
    const maxAutoApprovalDays = 2;
    const isShortLeave = request.totalDays <= maxAutoApprovalDays;
    const isAutoApprovalType = autoApprovalTypes.includes(request.leaveType);

    // Additional criteria
    const hasValidBalance = result.errors.length === 0;
    const isRegularEmployee = employee.role === UserRole.EMPLOYEE;
    const noDocumentationRequired = !result.requiredDocumentation;

    result.autoApprovalEligible =
      isShortLeave &&
      isAutoApprovalType &&
      hasValidBalance &&
      isRegularEmployee &&
      noDocumentationRequired &&
      result.isValid;

    if (result.autoApprovalEligible) {
      result.warnings.push('This request is eligible for auto-approval');
    }
  }

  /**
   * Calculates business days between two dates (excluding weekends)
   */
  calculateBusinessDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
        count++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return count;
  }

  /**
   * Gets leave entitlements for an employee based on their role and location
   */
  async getLeaveEntitlements(employeeId: string): Promise<Record<LeaveType, LeaveBalance>> {
    const defaultEntitlements: Record<LeaveType, LeaveBalance> = {
      [LeaveType.SICK_LEAVE]: { totalEntitlement: 12, used: 0, available: 12, carryForward: 0 },
      [LeaveType.CASUAL_LEAVE]: { totalEntitlement: 12, used: 0, available: 12, carryForward: 0 },
      [LeaveType.EARNED_LEAVE]: { totalEntitlement: 21, used: 0, available: 21, carryForward: 0 },
      [LeaveType.MATERNITY_LEAVE]: { totalEntitlement: 180, used: 0, available: 180, carryForward: 0 },
      [LeaveType.PATERNITY_LEAVE]: { totalEntitlement: 15, used: 0, available: 15, carryForward: 0 },
      [LeaveType.COMPENSATORY_OFF]: { totalEntitlement: 10, used: 0, available: 10, carryForward: 0 },
      [LeaveType.BEREAVEMENT_LEAVE]: { totalEntitlement: 3, used: 0, available: 3, carryForward: 0 },
      [LeaveType.MARRIAGE_LEAVE]: { totalEntitlement: 5, used: 0, available: 5, carryForward: 0 },
      [LeaveType.LEAVE_WITHOUT_PAY]: { totalEntitlement: 365, used: 0, available: 365, carryForward: 0 },
      [LeaveType.PTO]: { totalEntitlement: 20, used: 0, available: 20, carryForward: 0 }
    };

    try {
      const currentYear = new Date().getFullYear();
      const balances = await prisma.leaveBalance.findMany({
        where: {
          employeeId,
          year: currentYear
        }
      });

      // Update with actual balances from database
      balances.forEach(balance => {
        if (balance.leaveType in defaultEntitlements) {
          defaultEntitlements[balance.leaveType as LeaveType] = {
            totalEntitlement: Number(balance.totalEntitlement),
            used: Number(balance.used),
            available: Number(balance.available),
            carryForward: Number(balance.carryForward)
          };
        }
      });

    } catch (error) {
      // Return default entitlements if database query fails
      console.warn('Failed to fetch leave balances, using defaults:', error);
    }

    return defaultEntitlements;
  }
}

// Export a singleton instance
export const leaveValidationEngine = new LeaveValidationEngine();