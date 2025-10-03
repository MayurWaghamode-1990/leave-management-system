import { prisma } from '../index';
import { differenceInMonths, addMonths, startOfDay, isBefore, isAfter } from 'date-fns';

interface EligibilityCheck {
  isEligible: boolean;
  reason?: string;
  requirements: string[];
  eligibilityErrors: string[];
  additionalInfo?: any;
}

interface MaternityPaternityEligibility extends EligibilityCheck {
  leaveType: 'MATERNITY_LEAVE' | 'PATERNITY_LEAVE';
  entitlementDays: number;
  serviceRequirement?: {
    minimumMonths: number;
    currentService: number;
    isMetBySatisfied: boolean;
  };
}

interface LeaveEligibilityRules {
  leaveType: string;
  requirements: {
    gender?: 'MALE' | 'FEMALE';
    maritalStatus?: string[];
    minimumService?: number; // months
    maxAllowedPerYear?: number;
    region?: 'INDIA' | 'USA';
    cooldownPeriod?: number; // months between applications
  };
  entitlement: {
    totalDays: number;
    description: string;
  };
  restrictions: {
    blockOtherLeaves?: boolean;
    requiresMedicalCertificate?: boolean;
    advanceNoticeRequired?: number; // days
  };
}

export class EligibilityService {
  // GLF Leave Eligibility Rules
  private static readonly LEAVE_ELIGIBILITY_RULES: LeaveEligibilityRules[] = [
    {
      leaveType: 'MATERNITY_LEAVE',
      requirements: {
        gender: 'FEMALE',
        maritalStatus: ['MARRIED'],
        minimumService: 0, // No minimum service requirement in GLF
        maxAllowedPerYear: 1,
        region: 'INDIA'
      },
      entitlement: {
        totalDays: 180,
        description: '180 days maternity leave for married female employees'
      },
      restrictions: {
        blockOtherLeaves: true,
        requiresMedicalCertificate: true,
        advanceNoticeRequired: 30
      }
    },
    {
      leaveType: 'PATERNITY_LEAVE',
      requirements: {
        gender: 'MALE',
        maritalStatus: ['MARRIED'],
        minimumService: 0,
        maxAllowedPerYear: 1,
        region: 'INDIA'
      },
      entitlement: {
        totalDays: 5,
        description: '5 days paternity leave for married male employees'
      },
      restrictions: {
        blockOtherLeaves: false,
        requiresMedicalCertificate: false,
        advanceNoticeRequired: 7
      }
    },
    {
      leaveType: 'CASUAL_LEAVE',
      requirements: {
        region: 'INDIA'
      },
      entitlement: {
        totalDays: 12, // 1 per month
        description: '12 days casual leave per year (1 per month)'
      },
      restrictions: {
        blockOtherLeaves: false,
        requiresMedicalCertificate: false,
        advanceNoticeRequired: 1
      }
    },
    {
      leaveType: 'PRIVILEGE_LEAVE',
      requirements: {
        region: 'INDIA'
      },
      entitlement: {
        totalDays: 12, // 1 per month
        description: '12 days privilege leave per year (1 per month)'
      },
      restrictions: {
        blockOtherLeaves: false,
        requiresMedicalCertificate: false,
        advanceNoticeRequired: 1
      }
    },
    {
      leaveType: 'PTO',
      requirements: {
        region: 'USA'
      },
      entitlement: {
        totalDays: 15, // Default for AVP and below
        description: 'Paid Time Off based on role (15-20 days)'
      },
      restrictions: {
        blockOtherLeaves: false,
        requiresMedicalCertificate: false,
        advanceNoticeRequired: 3
      }
    },
    {
      leaveType: 'BEREAVEMENT_LEAVE',
      requirements: {
        region: 'USA'
      },
      entitlement: {
        totalDays: 5,
        description: '5 days bereavement leave'
      },
      restrictions: {
        blockOtherLeaves: false,
        requiresMedicalCertificate: false,
        advanceNoticeRequired: 0
      }
    }
  ];

  /**
   * Check maternity leave eligibility (GLF Requirement)
   * Rule: Only married female employees eligible for 180 days
   */
  static async checkMaternityLeaveEligibility(employeeId: string): Promise<MaternityPaternityEligibility> {
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        gender: true,
        maritalStatus: true,
        country: true,
        joiningDate: true,
        firstName: true,
        lastName: true
      }
    });

    if (!employee) {
      return {
        isEligible: false,
        leaveType: 'MATERNITY_LEAVE',
        entitlementDays: 0,
        reason: 'Employee not found',
        requirements: [],
        eligibilityErrors: ['Employee not found']
      };
    }

    const rule = this.LEAVE_ELIGIBILITY_RULES.find(r => r.leaveType === 'MATERNITY_LEAVE')!;
    const eligibilityCheck: MaternityPaternityEligibility = {
      isEligible: true,
      leaveType: 'MATERNITY_LEAVE',
      entitlementDays: rule.entitlement.totalDays,
      requirements: [],
      eligibilityErrors: []
    };

    // GLF Rule: Only female employees
    if (employee.gender !== 'FEMALE') {
      eligibilityCheck.isEligible = false;
      eligibilityCheck.eligibilityErrors.push('Maternity leave is only available for female employees');
    } else {
      eligibilityCheck.requirements.push('✓ Gender requirement met (Female)');
    }

    // GLF Rule: Only married employees
    if (!employee.maritalStatus || !rule.requirements.maritalStatus?.includes(employee.maritalStatus)) {
      eligibilityCheck.isEligible = false;
      eligibilityCheck.eligibilityErrors.push('Maternity leave is only available for married employees');
    } else {
      eligibilityCheck.requirements.push('✓ Marital status requirement met (Married)');
    }

    // GLF Rule: Only India employees
    if (employee.country !== 'INDIA') {
      eligibilityCheck.isEligible = false;
      eligibilityCheck.eligibilityErrors.push('Maternity leave policy applies to India employees only');
    } else {
      eligibilityCheck.requirements.push('✓ Region requirement met (India)');
    }

    // Check if already taken maternity leave this year
    const currentYear = new Date().getFullYear();
    const existingMaternityLeave = await prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        leaveType: 'MATERNITY_LEAVE',
        startDate: {
          gte: new Date(currentYear, 0, 1),
          lte: new Date(currentYear, 11, 31)
        },
        status: { in: ['APPROVED', 'PENDING'] }
      }
    });

    if (existingMaternityLeave) {
      eligibilityCheck.isEligible = false;
      eligibilityCheck.eligibilityErrors.push('Maternity leave already taken/applied for this year');
    } else {
      eligibilityCheck.requirements.push('✓ No existing maternity leave this year');
    }

    // Add service information
    if (employee.joiningDate) {
      const serviceMonths = differenceInMonths(new Date(), new Date(employee.joiningDate));
      eligibilityCheck.serviceRequirement = {
        minimumMonths: 0,
        currentService: serviceMonths,
        isMetBySatisfied: true
      };
      eligibilityCheck.requirements.push(`✓ Service: ${serviceMonths} months (No minimum required)`);
    }

    if (eligibilityCheck.isEligible) {
      eligibilityCheck.reason = `Eligible for ${rule.entitlement.totalDays} days maternity leave`;
    } else {
      eligibilityCheck.reason = 'Not eligible for maternity leave';
    }

    return eligibilityCheck;
  }

  /**
   * Check paternity leave eligibility (GLF Requirement)
   * Rule: Only married male employees eligible for 5 days
   */
  static async checkPaternityLeaveEligibility(employeeId: string): Promise<MaternityPaternityEligibility> {
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        gender: true,
        maritalStatus: true,
        country: true,
        joiningDate: true,
        firstName: true,
        lastName: true
      }
    });

    if (!employee) {
      return {
        isEligible: false,
        leaveType: 'PATERNITY_LEAVE',
        entitlementDays: 0,
        reason: 'Employee not found',
        requirements: [],
        eligibilityErrors: ['Employee not found']
      };
    }

    const rule = this.LEAVE_ELIGIBILITY_RULES.find(r => r.leaveType === 'PATERNITY_LEAVE')!;
    const eligibilityCheck: MaternityPaternityEligibility = {
      isEligible: true,
      leaveType: 'PATERNITY_LEAVE',
      entitlementDays: rule.entitlement.totalDays,
      requirements: [],
      eligibilityErrors: []
    };

    // GLF Rule: Only male employees
    if (employee.gender !== 'MALE') {
      eligibilityCheck.isEligible = false;
      eligibilityCheck.eligibilityErrors.push('Paternity leave is only available for male employees');
    } else {
      eligibilityCheck.requirements.push('✓ Gender requirement met (Male)');
    }

    // GLF Rule: Only married employees
    if (!employee.maritalStatus || !rule.requirements.maritalStatus?.includes(employee.maritalStatus)) {
      eligibilityCheck.isEligible = false;
      eligibilityCheck.eligibilityErrors.push('Paternity leave is only available for married employees');
    } else {
      eligibilityCheck.requirements.push('✓ Marital status requirement met (Married)');
    }

    // GLF Rule: Only India employees
    if (employee.country !== 'INDIA') {
      eligibilityCheck.isEligible = false;
      eligibilityCheck.eligibilityErrors.push('Paternity leave policy applies to India employees only');
    } else {
      eligibilityCheck.requirements.push('✓ Region requirement met (India)');
    }

    // Check if already taken paternity leave this year
    const currentYear = new Date().getFullYear();
    const existingPaternityLeave = await prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        leaveType: 'PATERNITY_LEAVE',
        startDate: {
          gte: new Date(currentYear, 0, 1),
          lte: new Date(currentYear, 11, 31)
        },
        status: { in: ['APPROVED', 'PENDING'] }
      }
    });

    if (existingPaternityLeave) {
      eligibilityCheck.isEligible = false;
      eligibilityCheck.eligibilityErrors.push('Paternity leave already taken/applied for this year');
    } else {
      eligibilityCheck.requirements.push('✓ No existing paternity leave this year');
    }

    // Add service information
    if (employee.joiningDate) {
      const serviceMonths = differenceInMonths(new Date(), new Date(employee.joiningDate));
      eligibilityCheck.serviceRequirement = {
        minimumMonths: 0,
        currentService: serviceMonths,
        isMetBySatisfied: true
      };
      eligibilityCheck.requirements.push(`✓ Service: ${serviceMonths} months (No minimum required)`);
    }

    if (eligibilityCheck.isEligible) {
      eligibilityCheck.reason = `Eligible for ${rule.entitlement.totalDays} days paternity leave`;
    } else {
      eligibilityCheck.reason = 'Not eligible for paternity leave';
    }

    return eligibilityCheck;
  }

  /**
   * General leave eligibility check for any leave type
   */
  static async checkLeaveEligibility(employeeId: string, leaveType: string): Promise<EligibilityCheck> {
    if (leaveType === 'MATERNITY_LEAVE') {
      return await this.checkMaternityLeaveEligibility(employeeId);
    }

    if (leaveType === 'PATERNITY_LEAVE') {
      return await this.checkPaternityLeaveEligibility(employeeId);
    }

    // For other leave types, use general eligibility rules
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        gender: true,
        maritalStatus: true,
        country: true,
        role: true,
        joiningDate: true,
        status: true
      }
    });

    if (!employee) {
      return {
        isEligible: false,
        reason: 'Employee not found',
        requirements: [],
        eligibilityErrors: ['Employee not found']
      };
    }

    const rule = this.LEAVE_ELIGIBILITY_RULES.find(r => r.leaveType === leaveType);
    if (!rule) {
      return {
        isEligible: false,
        reason: 'Leave type not recognized',
        requirements: [],
        eligibilityErrors: ['Leave type not found in policy']
      };
    }

    const eligibilityCheck: EligibilityCheck = {
      isEligible: true,
      requirements: [],
      eligibilityErrors: []
    };

    // Check employee status
    if (employee.status !== 'ACTIVE') {
      eligibilityCheck.isEligible = false;
      eligibilityCheck.eligibilityErrors.push('Employee must be active to apply for leave');
    } else {
      eligibilityCheck.requirements.push('✓ Employee status: Active');
    }

    // Check region requirement
    if (rule.requirements.region && employee.country !== rule.requirements.region) {
      eligibilityCheck.isEligible = false;
      eligibilityCheck.eligibilityErrors.push(`This leave type is only available for ${rule.requirements.region} employees`);
    } else if (rule.requirements.region) {
      eligibilityCheck.requirements.push(`✓ Region requirement met (${rule.requirements.region})`);
    }

    // Check available balance
    const currentYear = new Date().getFullYear();
    const leaveBalance = await prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveType_year: {
          employeeId,
          leaveType,
          year: currentYear
        }
      }
    });

    if (leaveBalance && leaveBalance.available <= 0) {
      eligibilityCheck.isEligible = false;
      eligibilityCheck.eligibilityErrors.push('Insufficient leave balance');
    } else if (leaveBalance) {
      eligibilityCheck.requirements.push(`✓ Available balance: ${leaveBalance.available} days`);
    }

    eligibilityCheck.reason = eligibilityCheck.isEligible ?
      `Eligible for ${leaveType}` :
      'Not eligible for this leave type';

    return eligibilityCheck;
  }

  /**
   * Check if employee is on maternity leave and block other leaves
   */
  static async checkMaternityLeaveConflict(employeeId: string, requestStartDate: Date, requestEndDate: Date) {
    const overlappingMaternityLeave = await prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        leaveType: 'MATERNITY_LEAVE',
        status: 'APPROVED',
        OR: [
          {
            startDate: { lte: requestStartDate },
            endDate: { gte: requestStartDate }
          },
          {
            startDate: { lte: requestEndDate },
            endDate: { gte: requestEndDate }
          },
          {
            startDate: { gte: requestStartDate },
            endDate: { lte: requestEndDate }
          }
        ]
      }
    });

    return {
      hasConflict: !!overlappingMaternityLeave,
      conflictingLeave: overlappingMaternityLeave,
      message: overlappingMaternityLeave ?
        'Cannot apply for other leaves during maternity leave period' :
        'No maternity leave conflict'
    };
  }

  /**
   * Get all eligibility rules for display
   */
  static getEligibilityRules(): LeaveEligibilityRules[] {
    return this.LEAVE_ELIGIBILITY_RULES;
  }

  /**
   * Get eligibility summary for an employee
   */
  static async getEmployeeEligibilitySummary(employeeId: string) {
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        gender: true,
        maritalStatus: true,
        country: true,
        role: true,
        joiningDate: true
      }
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    const eligibilityChecks = [];

    // Check all leave types based on employee's region
    const applicableRules = this.LEAVE_ELIGIBILITY_RULES.filter(rule =>
      !rule.requirements.region || rule.requirements.region === employee.country
    );

    for (const rule of applicableRules) {
      const eligibility = await this.checkLeaveEligibility(employeeId, rule.leaveType);
      eligibilityChecks.push({
        leaveType: rule.leaveType,
        description: rule.entitlement.description,
        entitlementDays: rule.entitlement.totalDays,
        eligibility
      });
    }

    return {
      employee: {
        name: `${employee.firstName} ${employee.lastName}`,
        gender: employee.gender,
        maritalStatus: employee.maritalStatus,
        country: employee.country,
        role: employee.role,
        serviceMonths: employee.joiningDate ? differenceInMonths(new Date(), new Date(employee.joiningDate)) : 0
      },
      eligibilityChecks,
      generatedAt: new Date()
    };
  }

  /**
   * Validate leave request against eligibility rules
   */
  static async validateLeaveRequest(leaveRequestData: {
    employeeId: string;
    leaveType: string;
    startDate: Date;
    endDate: Date;
    totalDays: number;
  }) {
    const validationResult = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[],
      eligibilityCheck: null as EligibilityCheck | null
    };

    // Check basic eligibility
    const eligibility = await this.checkLeaveEligibility(leaveRequestData.employeeId, leaveRequestData.leaveType);
    validationResult.eligibilityCheck = eligibility;

    if (!eligibility.isEligible) {
      validationResult.isValid = false;
      validationResult.errors.push(...eligibility.eligibilityErrors);
    }

    // Check maternity leave conflict for other leave types
    if (leaveRequestData.leaveType !== 'MATERNITY_LEAVE') {
      const maternityConflict = await this.checkMaternityLeaveConflict(
        leaveRequestData.employeeId,
        leaveRequestData.startDate,
        leaveRequestData.endDate
      );

      if (maternityConflict.hasConflict) {
        validationResult.isValid = false;
        validationResult.errors.push(maternityConflict.message);
      }
    }

    // Check advance notice requirement
    const rule = this.LEAVE_ELIGIBILITY_RULES.find(r => r.leaveType === leaveRequestData.leaveType);
    if (rule?.restrictions.advanceNoticeRequired) {
      const daysUntilStart = Math.floor((leaveRequestData.startDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilStart < rule.restrictions.advanceNoticeRequired) {
        validationResult.warnings.push(`Recommended advance notice: ${rule.restrictions.advanceNoticeRequired} days (Current: ${daysUntilStart} days)`);
      }
    }

    return validationResult;
  }

  /**
   * Get leave policy information for employee dashboard
   */
  static async getEmployeeLeavePolicyInfo(employeeId: string) {
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: { country: true, gender: true, maritalStatus: true, role: true }
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    const applicableRules = this.LEAVE_ELIGIBILITY_RULES.filter(rule => {
      // Filter by region
      if (rule.requirements.region && rule.requirements.region !== employee.country) {
        return false;
      }

      // Filter by gender for maternity/paternity
      if (rule.requirements.gender && rule.requirements.gender !== employee.gender) {
        return false;
      }

      // Filter by marital status for maternity/paternity
      if (rule.requirements.maritalStatus &&
          (!employee.maritalStatus || !rule.requirements.maritalStatus.includes(employee.maritalStatus))) {
        return false;
      }

      return true;
    });

    return {
      region: employee.country,
      applicableLeaveTypes: applicableRules.map(rule => ({
        leaveType: rule.leaveType,
        entitlementDays: rule.entitlement.totalDays,
        description: rule.entitlement.description,
        advanceNotice: rule.restrictions.advanceNoticeRequired,
        requiresMedicalCertificate: rule.restrictions.requiresMedicalCertificate
      })),
      specialNotes: {
        maternityLeave: employee.gender === 'FEMALE' && employee.maritalStatus === 'MARRIED' ?
          'Available for married female employees' :
          'Not applicable',
        paternityLeave: employee.gender === 'MALE' && employee.maritalStatus === 'MARRIED' ?
          'Available for married male employees' :
          'Not applicable',
        compOff: 'Earned through weekend/holiday work only'
      }
    };
  }
}

export { EligibilityService, type EligibilityCheck, type MaternityPaternityEligibility };