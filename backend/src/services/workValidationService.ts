import { prisma } from '../index';
import { isWeekend, isAfter, isBefore, startOfDay, endOfDay, parseISO } from 'date-fns';

interface WorkLogValidation {
  isValid: boolean;
  eligibleForCompOff: boolean;
  compOffHours: number;
  validationErrors: string[];
  workType: 'WEEKEND' | 'HOLIDAY' | 'EXTENDED_HOURS' | 'INVALID';
  holidayDetails?: any;
}

interface CompOffEligibilityRule {
  workType: 'WEEKEND' | 'HOLIDAY' | 'EXTENDED_HOURS';
  minimumHours: number;
  compOffRate: number; // multiplier for comp off calculation
  requiresApproval: boolean;
  description: string;
}

export class WorkValidationService {
  // GLF Comp Off Policy Rules
  private static readonly COMP_OFF_RULES: CompOffEligibilityRule[] = [
    {
      workType: 'WEEKEND',
      minimumHours: 5,
      compOffRate: 1.0, // 1:1 ratio
      requiresApproval: true,
      description: '5+ hours weekend work = equivalent comp off'
    },
    {
      workType: 'HOLIDAY',
      minimumHours: 5,
      compOffRate: 1.0, // 1:1 ratio
      requiresApproval: true,
      description: '5+ hours holiday work = equivalent comp off'
    },
    {
      workType: 'EXTENDED_HOURS',
      minimumHours: 10, // Extended hours beyond normal work day
      compOffRate: 0.5, // 2:1 ratio (need 2 hours extra to get 1 hour comp off)
      requiresApproval: true,
      description: '10+ hours extended work = 50% comp off rate'
    }
  ];

  /**
   * Validate work log for comp off eligibility (GLF Requirement)
   * Rule: Only weekend and holiday work eligible for comp off
   */
  static async validateWorkForCompOff(
    workDate: Date,
    hoursWorked: number,
    employeeLocation: string = 'INDIA'
  ): Promise<WorkLogValidation> {
    const validation: WorkLogValidation = {
      isValid: false,
      eligibleForCompOff: false,
      compOffHours: 0,
      validationErrors: [],
      workType: 'INVALID'
    };

    try {
      // Check basic validation
      if (hoursWorked <= 0) {
        validation.validationErrors.push('Hours worked must be greater than 0');
        return validation;
      }

      if (hoursWorked > 24) {
        validation.validationErrors.push('Hours worked cannot exceed 24 hours per day');
        return validation;
      }

      // Check if work date is in the future
      const today = startOfDay(new Date());
      const workDay = startOfDay(workDate);

      if (isAfter(workDay, today)) {
        validation.validationErrors.push('Cannot log work for future dates');
        return validation;
      }

      // Check if work date is too old (more than 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      if (isBefore(workDay, startOfDay(thirtyDaysAgo))) {
        validation.validationErrors.push('Cannot log work older than 30 days');
        return validation;
      }

      validation.isValid = true;

      // GLF Rule: Check if work was on weekend
      if (isWeekend(workDate)) {
        const weekendRule = this.COMP_OFF_RULES.find(rule => rule.workType === 'WEEKEND');
        if (weekendRule && hoursWorked >= weekendRule.minimumHours) {
          validation.eligibleForCompOff = true;
          validation.compOffHours = hoursWorked * weekendRule.compOffRate;
          validation.workType = 'WEEKEND';
        } else {
          validation.validationErrors.push(`Weekend work requires minimum ${weekendRule?.minimumHours} hours for comp off eligibility`);
          validation.workType = 'WEEKEND';
        }
        return validation;
      }

      // GLF Rule: Check if work was on holiday
      const holidayCheck = await this.checkHolidayWork(workDate, employeeLocation);
      if (holidayCheck.isHoliday) {
        const holidayRule = this.COMP_OFF_RULES.find(rule => rule.workType === 'HOLIDAY');
        if (holidayRule && hoursWorked >= holidayRule.minimumHours) {
          validation.eligibleForCompOff = true;
          validation.compOffHours = hoursWorked * holidayRule.compOffRate;
          validation.workType = 'HOLIDAY';
          validation.holidayDetails = holidayCheck.holiday;
        } else {
          validation.validationErrors.push(`Holiday work requires minimum ${holidayRule?.minimumHours} hours for comp off eligibility`);
          validation.workType = 'HOLIDAY';
        }
        return validation;
      }

      // GLF Rule: Regular weekday work is NOT eligible for comp off
      validation.eligibleForCompOff = false;
      validation.validationErrors.push('Comp off is only available for weekend and holiday work');
      validation.workType = 'INVALID';

      return validation;

    } catch (error) {
      validation.validationErrors.push(`Validation error: ${error}`);
      return validation;
    }
  }

  /**
   * Check if work date was a holiday
   */
  private static async checkHolidayWork(workDate: Date, location: string) {
    try {
      const holiday = await prisma.holiday.findFirst({
        where: {
          date: {
            gte: startOfDay(workDate),
            lte: endOfDay(workDate)
          },
          OR: [
            { location: location },
            { location: null }, // Global holidays
            { region: location === 'INDIA' ? 'INDIA' : 'USA' }
          ]
        }
      });

      return {
        isHoliday: !!holiday,
        holiday
      };
    } catch (error) {
      console.error('Error checking holiday:', error);
      return { isHoliday: false, holiday: null };
    }
  }

  /**
   * Validate multiple work logs for batch processing
   */
  static async validateMultipleWorkLogs(workLogs: Array<{
    workDate: Date;
    hoursWorked: number;
    employeeLocation?: string;
  }>) {
    const validations = [];

    for (const workLog of workLogs) {
      const validation = await this.validateWorkForCompOff(
        workLog.workDate,
        workLog.hoursWorked,
        workLog.employeeLocation || 'INDIA'
      );

      validations.push({
        ...workLog,
        validation
      });
    }

    return {
      totalLogs: workLogs.length,
      validLogs: validations.filter(v => v.validation.isValid).length,
      eligibleForCompOff: validations.filter(v => v.validation.eligibleForCompOff).length,
      totalCompOffHours: validations.reduce((sum, v) => sum + v.validation.compOffHours, 0),
      validations
    };
  }

  /**
   * Calculate comp off days from hours based on company policy
   */
  static calculateCompOffDays(compOffHours: number): {
    fullDays: number;
    halfDays: number;
    totalDays: number;
    remainingHours: number;
  } {
    // GLF Policy: 8 hours = 1 full day, 5 hours = 0.5 day (half day)
    const fullDays = Math.floor(compOffHours / 8);
    const remainingHoursAfterFullDays = compOffHours % 8;

    const halfDays = remainingHoursAfterFullDays >= 5 ? 1 : 0;
    const finalRemainingHours = halfDays > 0 ? remainingHoursAfterFullDays - 5 : remainingHoursAfterFullDays;

    return {
      fullDays,
      halfDays,
      totalDays: fullDays + (halfDays * 0.5),
      remainingHours: finalRemainingHours
    };
  }

  /**
   * Get comp off eligibility rules
   */
  static getCompOffRules(): CompOffEligibilityRule[] {
    return this.COMP_OFF_RULES;
  }

  /**
   * Validate and create work log entry
   */
  static async createValidatedWorkLog(employeeId: string, workLogData: {
    workDate: string;
    hoursWorked: number;
    workDescription: string;
    projectDetails?: string;
  }) {
    // Get employee details for location
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: { location: true, country: true }
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    const workDate = parseISO(workLogData.workDate);
    const validation = await this.validateWorkForCompOff(
      workDate,
      workLogData.hoursWorked,
      employee.location || employee.country || 'INDIA'
    );

    if (!validation.isValid) {
      throw new Error(`Work log validation failed: ${validation.validationErrors.join(', ')}`);
    }

    // Create work log entry
    const workLog = await prisma.compOffWorkLog.create({
      data: {
        employeeId,
        workDate,
        hoursWorked: workLogData.hoursWorked,
        workType: validation.workType,
        workDescription: workLogData.workDescription,
        projectDetails: workLogData.projectDetails,
        isVerified: false,
        compOffEarned: validation.compOffHours,
        status: validation.eligibleForCompOff ? 'PENDING' : 'REJECTED'
      }
    });

    return {
      workLog,
      validation,
      compOffDays: this.calculateCompOffDays(validation.compOffHours)
    };
  }

  /**
   * Verify work log by manager
   */
  static async verifyWorkLog(
    workLogId: string,
    verifierId: string,
    approved: boolean,
    comments?: string
  ) {
    const workLog = await prisma.compOffWorkLog.findUnique({
      where: { id: workLogId },
      include: {
        employee: {
          select: { reportingManagerId: true }
        }
      }
    });

    if (!workLog) {
      throw new Error('Work log not found');
    }

    if (workLog.employee.reportingManagerId !== verifierId) {
      throw new Error('Only direct manager can verify work logs');
    }

    if (workLog.isVerified) {
      throw new Error('Work log already verified');
    }

    return await prisma.compOffWorkLog.update({
      where: { id: workLogId },
      data: {
        isVerified: approved,
        verifiedBy: verifierId,
        verifiedAt: new Date(),
        status: approved ? 'VERIFIED' : 'REJECTED',
        workDescription: comments ? `${workLog.workDescription}\n\nManager Comments: ${comments}` : workLog.workDescription
      }
    });
  }

  /**
   * Get work logs pending verification for a manager
   */
  static async getPendingWorkLogsForManager(managerId: string) {
    return await prisma.compOffWorkLog.findMany({
      where: {
        employee: {
          reportingManagerId: managerId
        },
        isVerified: false,
        status: 'PENDING'
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get comp off statistics for employee
   */
  static async getEmployeeCompOffStats(employeeId: string, year?: number) {
    const whereClause: any = { employeeId };
    if (year) {
      whereClause.workDate = {
        gte: new Date(year, 0, 1),
        lte: new Date(year, 11, 31)
      };
    }

    const [totalLogs, verifiedLogs, totalHours, pendingHours] = await Promise.all([
      prisma.compOffWorkLog.count({ where: whereClause }),
      prisma.compOffWorkLog.count({ where: { ...whereClause, isVerified: true } }),
      prisma.compOffWorkLog.aggregate({
        where: { ...whereClause, isVerified: true },
        _sum: { compOffEarned: true }
      }),
      prisma.compOffWorkLog.aggregate({
        where: { ...whereClause, isVerified: false, status: 'PENDING' },
        _sum: { compOffEarned: true }
      })
    ]);

    const totalCompOffHours = totalHours._sum.compOffEarned || 0;
    const pendingCompOffHours = pendingHours._sum.compOffEarned || 0;

    return {
      totalWorkLogs: totalLogs,
      verifiedWorkLogs: verifiedLogs,
      pendingVerification: totalLogs - verifiedLogs,
      totalCompOffHours,
      pendingCompOffHours,
      availableCompOffDays: this.calculateCompOffDays(totalCompOffHours),
      pendingCompOffDays: this.calculateCompOffDays(pendingCompOffHours)
    };
  }

  /**
   * Check if employee has sufficient comp off balance for leave request
   */
  static async checkCompOffBalance(employeeId: string, requestedHours: number) {
    const stats = await this.getEmployeeCompOffStats(employeeId);

    const availableHours = stats.totalCompOffHours;
    const requestedDays = this.calculateCompOffDays(requestedHours);

    return {
      hasBalance: availableHours >= requestedHours,
      availableHours,
      requestedHours,
      shortfall: Math.max(0, requestedHours - availableHours),
      requestedDays,
      availableDays: stats.availableCompOffDays
    };
  }

  /**
   * Get upcoming holidays for comp off planning
   */
  static async getUpcomingHolidays(location: string = 'INDIA', daysAhead: number = 90) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);

    return await prisma.holiday.findMany({
      where: {
        date: {
          gte: today,
          lte: futureDate
        },
        OR: [
          { location: location },
          { location: null },
          { region: location === 'INDIA' ? 'INDIA' : 'USA' }
        ]
      },
      orderBy: { date: 'asc' }
    });
  }

  /**
   * Generate work validation report
   */
  static async generateValidationReport(managerId: string, year?: number) {
    const currentYear = year || new Date().getFullYear();

    // Get all team members
    const teamMembers = await prisma.user.findMany({
      where: { reportingManagerId: managerId },
      select: { id: true, firstName: true, lastName: true, employeeId: true }
    });

    const report = {
      generatedAt: new Date(),
      managerId,
      year: currentYear,
      teamSize: teamMembers.length,
      summary: {
        totalWorkLogs: 0,
        verifiedWorkLogs: 0,
        pendingVerification: 0,
        totalCompOffHours: 0,
        weekendWork: 0,
        holidayWork: 0
      },
      teamMembers: [] as any[]
    };

    for (const member of teamMembers) {
      const stats = await this.getEmployeeCompOffStats(member.id, currentYear);

      const workLogDetails = await prisma.compOffWorkLog.findMany({
        where: {
          employeeId: member.id,
          workDate: {
            gte: new Date(currentYear, 0, 1),
            lte: new Date(currentYear, 11, 31)
          }
        }
      });

      const weekendWork = workLogDetails.filter(log => log.workType === 'WEEKEND').length;
      const holidayWork = workLogDetails.filter(log => log.workType === 'HOLIDAY').length;

      report.summary.totalWorkLogs += stats.totalWorkLogs;
      report.summary.verifiedWorkLogs += stats.verifiedWorkLogs;
      report.summary.pendingVerification += stats.pendingVerification;
      report.summary.totalCompOffHours += stats.totalCompOffHours;
      report.summary.weekendWork += weekendWork;
      report.summary.holidayWork += holidayWork;

      report.teamMembers.push({
        ...member,
        stats,
        weekendWork,
        holidayWork
      });
    }

    return report;
  }
}

export { WorkValidationService, type WorkLogValidation };