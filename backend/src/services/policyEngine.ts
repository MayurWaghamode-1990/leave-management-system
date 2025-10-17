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

      // Calculate actual working days (excluding weekends and holidays)
      await this.validateAndCalculateWorkingDays(request, employee, result);

      // Check leave balance
      await this.validateLeaveBalance(request, result);

      // Validate maternity/paternity eligibility
      await this.validateMaternityPaternityEligibility(request, employee, result);

      // Apply policy rules
      await this.applyPolicyRules(request, employee, result);

      // Check for conflicting leave periods (e.g., no CL/PL during maternity)
      await this.validateLeaveConflicts(request, employee, result);

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
   * Validates and calculates actual working days (excluding weekends and holidays)
   */
  private async validateAndCalculateWorkingDays(request: LeaveValidationRequest, employee: any, result: LeaveValidationResult): Promise<void> {
    try {
      // Calculate business days excluding weekends and holidays
      const workingDays = await this.calculateBusinessDays(
        request.startDate,
        request.endDate,
        employee.location
      );

      // If half day, reduce by 0.5
      const actualLeaveDays = request.isHalfDay ? workingDays - 0.5 : workingDays;

      // Update the total days in the request to reflect actual working days
      if (actualLeaveDays !== request.totalDays) {
        result.warnings.push(
          `Leave days adjusted: Requested ${request.totalDays} days, actual working days ${actualLeaveDays} (excluding weekends/holidays)`
        );

        // Update the request object for subsequent validations
        (request as any).adjustedTotalDays = actualLeaveDays;
      }

      // Validate that there are actually working days in the selected period
      if (workingDays === 0) {
        result.errors.push('Selected date range contains no working days (only weekends/holidays)');
        result.isValid = false;
      }

    } catch (error) {
      result.warnings.push('Could not validate working days, using requested days');
      console.warn('Working days validation failed:', error);
    }
  }

  /**
   * Validates available leave balance (including pending leaves)
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

      // Calculate pending leaves of the same type
      const pendingLeaves = await prisma.leaveRequest.findMany({
        where: {
          employeeId: request.employeeId,
          leaveType: request.leaveType,
          status: 'PENDING'
        }
      });

      const totalPendingDays = pendingLeaves.reduce((sum, leave) => sum + Number(leave.totalDays), 0);

      // Use adjusted total days if available, otherwise use original
      const effectiveDays = (request as any).adjustedTotalDays || request.totalDays;

      // Calculate real available balance (current available - pending requests)
      const realAvailable = leaveBalance.available - totalPendingDays;

      if (totalPendingDays > 0) {
        result.warnings.push(`Note: ${totalPendingDays} days are already pending approval for ${request.leaveType}`);
      }

      if (effectiveDays > realAvailable) {
        result.isValid = false;
        result.errors.push(`Insufficient leave balance. Available: ${realAvailable} days (after pending: ${totalPendingDays}), Requested: ${effectiveDays} days`);
      } else if (effectiveDays > realAvailable * 0.8) {
        result.warnings.push(`Using most of available leave balance (${effectiveDays}/${realAvailable} days)`);
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
      const effectiveDays = (request as any).adjustedTotalDays || request.totalDays;

      if (effectiveDays > available) {
        result.isValid = false;
        result.errors.push(`Insufficient leave balance. Available: ${available} days, Requested: ${effectiveDays} days`);
      }
    }
  }

  /**
   * Validates eligibility for maternity and paternity leave based on gender and marital status
   */
  private async validateMaternityPaternityEligibility(
    request: LeaveValidationRequest,
    employee: any,
    result: LeaveValidationResult
  ): Promise<void> {
    // Check maternity leave eligibility
    if (request.leaveType === LeaveType.MATERNITY_LEAVE) {
      // Maternity leave is only for female employees
      if (!employee.gender || employee.gender !== 'FEMALE') {
        result.isValid = false;
        result.errors.push('Maternity leave is only available for female employees');
        return;
      }

      // Check if employee is married (optional check - some policies may require this)
      if (employee.maritalStatus && employee.maritalStatus !== 'MARRIED') {
        result.warnings.push('Maternity leave is typically available for married employees. Please provide necessary documentation.');
      }

      // Check if employee has already taken maternity leave in the current year
      try {
        const currentYear = new Date().getFullYear();
        const existingMaternityLeave = await prisma.leaveRequest.findFirst({
          where: {
            employeeId: request.employeeId,
            leaveType: LeaveType.MATERNITY_LEAVE,
            status: { in: ['APPROVED', 'PENDING'] },
            startDate: {
              gte: new Date(`${currentYear}-01-01`),
              lte: new Date(`${currentYear}-12-31`)
            }
          }
        });

        if (existingMaternityLeave) {
          result.isValid = false;
          result.errors.push(`You already have a maternity leave request for this year (Status: ${existingMaternityLeave.status})`);
        }
      } catch (error) {
        result.warnings.push('Could not verify existing maternity leave requests');
      }

      result.requiredDocumentation = true;
      result.warnings.push('Medical certificate and pregnancy proof required for maternity leave');
    }

    // Check paternity leave eligibility
    if (request.leaveType === LeaveType.PATERNITY_LEAVE) {
      // Paternity leave is only for male employees
      if (!employee.gender || employee.gender !== 'MALE') {
        result.isValid = false;
        result.errors.push('Paternity leave is only available for male employees');
        return;
      }

      // Check if employee is married (typically required for paternity leave)
      if (!employee.maritalStatus || employee.maritalStatus !== 'MARRIED') {
        result.isValid = false;
        result.errors.push('Paternity leave is only available for married employees');
        return;
      }

      // Check if employee has already taken paternity leave in the current year
      try {
        const currentYear = new Date().getFullYear();
        const existingPaternityLeave = await prisma.leaveRequest.findFirst({
          where: {
            employeeId: request.employeeId,
            leaveType: LeaveType.PATERNITY_LEAVE,
            status: { in: ['APPROVED', 'PENDING'] },
            startDate: {
              gte: new Date(`${currentYear}-01-01`),
              lte: new Date(`${currentYear}-12-31`)
            }
          }
        });

        if (existingPaternityLeave) {
          result.isValid = false;
          result.errors.push(`You already have a paternity leave request for this year (Status: ${existingPaternityLeave.status})`);
        }
      } catch (error) {
        result.warnings.push('Could not verify existing paternity leave requests');
      }

      result.requiredDocumentation = true;
      result.warnings.push('Birth certificate or medical certificate required for paternity leave');
    }
  }

  /**
   * Validates for conflicting leave periods (e.g., no CL/PL during maternity leave)
   */
  private async validateLeaveConflicts(request: LeaveValidationRequest, employee: any, result: LeaveValidationResult): Promise<void> {
    try {
      // Check if applying for CL or PL during an active maternity leave period
      if (request.leaveType === LeaveType.CASUAL_LEAVE || request.leaveType === LeaveType.EARNED_LEAVE) {

        // Find any overlapping approved maternity leave requests
        const overlappingMaternityLeave = await prisma.leaveRequest.findFirst({
          where: {
            employeeId: request.employeeId,
            leaveType: LeaveType.MATERNITY_LEAVE,
            status: 'APPROVED',
            // Check if the requested dates overlap with maternity leave
            AND: [
              { startDate: { lte: request.endDate } },
              { endDate: { gte: request.startDate } }
            ]
          }
        });

        if (overlappingMaternityLeave) {
          result.isValid = false;
          result.errors.push(
            `Cannot apply for ${request.leaveType.replace('_', ' ').toLowerCase()} during active maternity leave period ` +
            `(${overlappingMaternityLeave.startDate.toISOString().split('T')[0]} to ${overlappingMaternityLeave.endDate.toISOString().split('T')[0]})`
          );
        }
      }

      // Check if applying for maternity leave while having other active leaves
      if (request.leaveType === LeaveType.MATERNITY_LEAVE) {
        const overlappingLeaves = await prisma.leaveRequest.findMany({
          where: {
            employeeId: request.employeeId,
            status: 'APPROVED',
            leaveType: {
              in: [LeaveType.CASUAL_LEAVE, LeaveType.EARNED_LEAVE, LeaveType.SICK_LEAVE]
            },
            // Check if any approved leaves overlap with maternity leave period
            AND: [
              { startDate: { lte: request.endDate } },
              { endDate: { gte: request.startDate } }
            ]
          }
        });

        if (overlappingLeaves.length > 0) {
          result.warnings.push(
            `Note: Maternity leave period overlaps with ${overlappingLeaves.length} existing approved leave(s). ` +
            'These may need to be cancelled or adjusted.'
          );
        }
      }

      // Similar check for paternity leave
      if (request.leaveType === LeaveType.CASUAL_LEAVE || request.leaveType === LeaveType.EARNED_LEAVE) {
        const overlappingPaternityLeave = await prisma.leaveRequest.findFirst({
          where: {
            employeeId: request.employeeId,
            leaveType: LeaveType.PATERNITY_LEAVE,
            status: 'APPROVED',
            AND: [
              { startDate: { lte: request.endDate } },
              { endDate: { gte: request.startDate } }
            ]
          }
        });

        if (overlappingPaternityLeave) {
          result.warnings.push(
            `Requested leave overlaps with approved paternity leave period ` +
            `(${overlappingPaternityLeave.startDate.toISOString().split('T')[0]} to ${overlappingPaternityLeave.endDate.toISOString().split('T')[0]})`
          );
        }
      }

    } catch (error) {
      console.warn('Leave conflict validation failed:', error);
      result.warnings.push('Could not validate leave conflicts');
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
   * Calculates business days between two dates (excluding weekends and holidays)
   */
  async calculateBusinessDays(startDate: Date, endDate: Date, location?: string): Promise<number> {
    let count = 0;
    const currentDate = new Date(startDate);

    // Get holidays for the date range
    let holidays: Date[] = [];
    try {
      const holidayRecords = await prisma.holiday.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate
          },
          ...(location && { location })
        }
      });
      holidays = holidayRecords.map(h => new Date(h.date));
    } catch (error) {
      console.warn('Failed to fetch holidays, excluding weekends only:', error);
    }

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday (0) or Saturday (6)
      const isHoliday = holidays.some(holiday =>
        holiday.getFullYear() === currentDate.getFullYear() &&
        holiday.getMonth() === currentDate.getMonth() &&
        holiday.getDate() === currentDate.getDate()
      );

      // Only count if it's not a weekend and not a holiday
      if (!isWeekend && !isHoliday) {
        count++;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return count;
  }

  /**
   * Legacy method for backwards compatibility (weekends only)
   */
  calculateBusinessDaysSync(startDate: Date, endDate: Date): number {
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