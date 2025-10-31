import { prisma } from '../index';
import { LocationPolicyService } from './locationPolicyService';
import { emailService } from './emailService';
import cron from 'node-cron';

interface AccrualCalculation {
  employeeId: string;
  employeeName: string;
  year: number;
  month: number;
  leaveType: string;
  accrualAmount: number;
  isProRated: boolean;
  joiningDate?: Date;
  proRateReason?: string;
}

interface AccrualSummary {
  processedDate: Date;
  totalEmployeesProcessed: number;
  totalAccrualsCreated: number;
  accrualsByType: Record<string, number>;
  proRatedEmployees: number;
  errors: string[];
}

export class AccrualAutomationService {
  private static instance: AccrualAutomationService;
  private isJobRunning = false;

  private constructor() {
    this.setupCronJobs();
  }

  public static getInstance(): AccrualAutomationService {
    if (!AccrualAutomationService.instance) {
      AccrualAutomationService.instance = new AccrualAutomationService();
    }
    return AccrualAutomationService.instance;
  }

  /**
   * Setup cron jobs for automated monthly accrual
   */
  private setupCronJobs() {
    // Run monthly accrual on 1st of every month at 2 AM
    cron.schedule('0 2 1 * *', async () => {
      console.log('🕐 Starting monthly leave accrual automation...');
      const currentDate = new Date();
      await this.processMonthlyAccrual(currentDate.getFullYear(), currentDate.getMonth() + 1);
    });

    // Run year-end carry forward on January 1st at 3 AM
    cron.schedule('0 3 1 1 *', async () => {
      console.log('🗓️ Starting year-end carry forward...');
      const currentYear = new Date().getFullYear();
      await this.processYearEndCarryForward(currentYear - 1, currentYear);
    });

    console.log('✅ Accrual automation cron jobs initialized');
  }

  /**
   * Process monthly accrual for India employees (GLF Requirement)
   * India Policy: 1 CL + 1 PL added on 1st of every month
   */
  async processMonthlyAccrual(year: number, month: number): Promise<AccrualSummary> {
    if (this.isJobRunning) {
      throw new Error('Accrual job is already running');
    }

    this.isJobRunning = true;
    const summary: AccrualSummary = {
      processedDate: new Date(),
      totalEmployeesProcessed: 0,
      totalAccrualsCreated: 0,
      accrualsByType: {},
      proRatedEmployees: 0,
      errors: []
    };

    try {
      console.log(`📅 Processing monthly accrual for ${year}-${month.toString().padStart(2, '0')}`);

      // Get all active India employees
      const indiaEmployees = await prisma.user.findMany({
        where: {
          country: 'INDIA',
          status: 'ACTIVE'
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeId: true,
          joiningDate: true,
          role: true,
          email: true
        }
      });

      console.log(`👥 Found ${indiaEmployees.length} India employees for processing`);

      const accrualCalculations: AccrualCalculation[] = [];

      for (const employee of indiaEmployees) {
        summary.totalEmployeesProcessed++;

        try {
          // Calculate accruals for this employee
          const calculations = await this.calculateEmployeeAccrual(employee, year, month);
          accrualCalculations.push(...calculations);

          // Track pro-rated employees
          if (calculations.some(calc => calc.isProRated)) {
            summary.proRatedEmployees++;
          }

        } catch (error) {
          const errorMsg = `Failed to calculate accrual for employee ${employee.employeeId}: ${error}`;
          console.error(errorMsg);
          summary.errors.push(errorMsg);
        }
      }

      // Process all accrual calculations
      for (const calculation of accrualCalculations) {
        try {
          await this.processAccrualCalculation(calculation);
          summary.totalAccrualsCreated++;

          // Track accruals by type
          if (!summary.accrualsByType[calculation.leaveType]) {
            summary.accrualsByType[calculation.leaveType] = 0;
          }
          summary.accrualsByType[calculation.leaveType] += calculation.accrualAmount;

        } catch (error) {
          const errorMsg = `Failed to process accrual for ${calculation.employeeId} - ${calculation.leaveType}: ${error}`;
          console.error(errorMsg);
          summary.errors.push(errorMsg);
        }
      }

      // Send summary email to HR
      await this.sendAccrualSummaryEmail(summary, year, month);

      console.log(`✅ Monthly accrual completed. Processed: ${summary.totalEmployeesProcessed} employees, Created: ${summary.totalAccrualsCreated} accruals`);

    } catch (error) {
      console.error('❌ Monthly accrual process failed:', error);
      summary.errors.push(`Process failure: ${error}`);
    } finally {
      this.isJobRunning = false;
    }

    return summary;
  }

  /**
   * Calculate accrual for a specific employee based on GLF requirements
   */
  private async calculateEmployeeAccrual(employee: any, year: number, month: number): Promise<AccrualCalculation[]> {
    const calculations: AccrualCalculation[] = [];
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);

    // Check if employee already has accrual for this month
    const existingAccrual = await prisma.monthlyAccrual.findUnique({
      where: {
        employeeId_year_month: {
          employeeId: employee.id,
          year,
          month
        }
      }
    });

    if (existingAccrual) {
      console.log(`⏭️ Skipping ${employee.employeeId} - accrual already processed for ${year}-${month}`);
      return calculations;
    }

    // Check if employee is on active maternity/paternity leave (GLF Requirement)
    // No accrual should be credited during maternity/paternity leave period
    const activeMaternityLeave = await prisma.leaveRequest.findFirst({
      where: {
        employeeId: employee.id,
        leaveType: {
          in: ['MATERNITY_LEAVE', 'PATERNITY_LEAVE']
        },
        status: 'APPROVED',
        startDate: {
          lte: monthEnd
        },
        endDate: {
          gte: monthStart
        }
      }
    });

    if (activeMaternityLeave) {
      console.log(`🚫 Skipping ${employee.employeeId} - on active ${activeMaternityLeave.leaveType} from ${activeMaternityLeave.startDate.toISOString().split('T')[0]} to ${activeMaternityLeave.endDate.toISOString().split('T')[0]}`);

      // Create a record to track that accrual was skipped
      await prisma.monthlyAccrual.create({
        data: {
          employeeId: employee.id,
          year,
          month,
          casualLeave: 0,
          privilegeLeave: 0,
          proRated: false,
          status: 'SKIPPED_MATERNITY',
          joiningDate: employee.joiningDate
        }
      });

      return calculations;
    }

    // GLF India Policy: 1 CL + 1 PL per month
    const accrualRules = [
      { leaveType: 'CASUAL_LEAVE', monthlyAmount: 1.0 },
      { leaveType: 'PRIVILEGE_LEAVE', monthlyAmount: 1.0 }
    ];

    for (const rule of accrualRules) {
      let accrualAmount = rule.monthlyAmount;
      let isProRated = false;
      let proRateReason = '';

      // Check if employee joined mid-month (GLF Requirement)
      if (employee.joiningDate) {
        const joiningDate = new Date(employee.joiningDate);

        if (joiningDate >= monthStart && joiningDate <= monthEnd) {
          isProRated = true;
          const joiningDay = joiningDate.getDate();

          // GLF Rule: Full month if joined 1st-15th, half month if joined after 15th
          if (joiningDay > 15) {
            accrualAmount = 0.5;
            proRateReason = `Joined on ${joiningDay}th - after 15th threshold`;
          } else {
            proRateReason = `Joined on ${joiningDay}th - before 15th threshold`;
          }
        }
      }

      calculations.push({
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        year,
        month,
        leaveType: rule.leaveType,
        accrualAmount,
        isProRated,
        joiningDate: employee.joiningDate,
        proRateReason
      });
    }

    return calculations;
  }

  /**
   * Process individual accrual calculation
   */
  private async processAccrualCalculation(calculation: AccrualCalculation) {
    // Create monthly accrual record
    await prisma.monthlyAccrual.create({
      data: {
        employeeId: calculation.employeeId,
        year: calculation.year,
        month: calculation.month,
        casualLeave: calculation.leaveType === 'CASUAL_LEAVE' ? calculation.accrualAmount : 0,
        privilegeLeave: calculation.leaveType === 'PRIVILEGE_LEAVE' ? calculation.accrualAmount : 0,
        proRated: calculation.isProRated,
        joiningDate: calculation.joiningDate,
        status: 'PROCESSED'
      }
    });

    // Update leave balance
    await this.updateLeaveBalance(calculation);

    console.log(`💰 Accrued ${calculation.accrualAmount} ${calculation.leaveType} for ${calculation.employeeName}${calculation.isProRated ? ' (pro-rated)' : ''}`);
  }

  /**
   * Update employee leave balance after accrual
   */
  private async updateLeaveBalance(calculation: AccrualCalculation) {
    await prisma.leaveBalance.upsert({
      where: {
        employeeId_leaveType_year: {
          employeeId: calculation.employeeId,
          leaveType: calculation.leaveType,
          year: calculation.year
        }
      },
      update: {
        totalEntitlement: { increment: calculation.accrualAmount },
        available: { increment: calculation.accrualAmount }
      },
      create: {
        employeeId: calculation.employeeId,
        leaveType: calculation.leaveType,
        year: calculation.year,
        totalEntitlement: calculation.accrualAmount,
        available: calculation.accrualAmount,
        used: 0,
        carryForward: 0
      }
    });
  }

  /**
   * Process year-end carry forward (GLF Requirements)
   */
  async processYearEndCarryForward(fromYear: number, toYear: number): Promise<any> {
    console.log(`🔄 Processing year-end carry forward from ${fromYear} to ${toYear}`);

    const summary = {
      processedDate: new Date(),
      totalEmployeesProcessed: 0,
      carryForwardsByType: {} as Record<string, number>,
      errors: [] as string[]
    };

    try {
      const employees = await prisma.user.findMany({
        where: { status: 'ACTIVE' },
        include: {
          leaveBalances: {
            where: { year: fromYear }
          }
        }
      });

      for (const employee of employees) {
        summary.totalEmployeesProcessed++;
        const region = (employee.country as 'INDIA' | 'USA') || 'INDIA';

        for (const balance of employee.leaveBalances) {
          try {
            const carryForwardRule = LocationPolicyService.getCarryForwardRules(
              employee.id,
              balance.leaveType,
              employee.role,
              region
            );

            if (carryForwardRule.allowed && balance.available > 0) {
              const carryForwardAmount = Math.min(balance.available, carryForwardRule.maxCarryForward);

              if (carryForwardAmount > 0) {
                // Create next year's balance with carry forward
                await prisma.leaveBalance.upsert({
                  where: {
                    employeeId_leaveType_year: {
                      employeeId: employee.id,
                      leaveType: balance.leaveType,
                      year: toYear
                    }
                  },
                  update: {
                    carryForward: { increment: carryForwardAmount },
                    available: { increment: carryForwardAmount },
                    totalEntitlement: { increment: carryForwardAmount }
                  },
                  create: {
                    employeeId: employee.id,
                    leaveType: balance.leaveType,
                    year: toYear,
                    totalEntitlement: carryForwardAmount,
                    available: carryForwardAmount,
                    used: 0,
                    carryForward: carryForwardAmount
                  }
                });

                // Track carry forwards
                if (!summary.carryForwardsByType[balance.leaveType]) {
                  summary.carryForwardsByType[balance.leaveType] = 0;
                }
                summary.carryForwardsByType[balance.leaveType] += carryForwardAmount;

                console.log(`📤 Carried forward ${carryForwardAmount} ${balance.leaveType} for ${employee.firstName} ${employee.lastName}`);
              }
            }

            // Handle expiry for Casual Leave (India) - expires on 31st December
            if (region === 'INDIA' && balance.leaveType === 'CASUAL_LEAVE' && balance.available > 0) {
              console.log(`🗑️ Expired ${balance.available} Casual Leave for ${employee.firstName} ${employee.lastName} (India policy)`);
            }

          } catch (error) {
            const errorMsg = `Carry forward failed for ${employee.employeeId} - ${balance.leaveType}: ${error}`;
            console.error(errorMsg);
            summary.errors.push(errorMsg);
          }
        }
      }

      console.log(`✅ Year-end carry forward completed. Processed: ${summary.totalEmployeesProcessed} employees`);

    } catch (error) {
      console.error('❌ Year-end carry forward failed:', error);
      summary.errors.push(`Process failure: ${error}`);
    }

    return summary;
  }

  /**
   * Manual trigger for monthly accrual (for testing or catch-up)
   */
  async triggerManualAccrual(year: number, month: number, employeeIds?: string[]): Promise<AccrualSummary> {
    console.log(`🔧 Manual accrual trigger for ${year}-${month}${employeeIds ? ` (${employeeIds.length} employees)` : ''}`);

    if (employeeIds) {
      // Process specific employees
      const employees = await prisma.user.findMany({
        where: {
          id: { in: employeeIds },
          country: 'INDIA',
          status: 'ACTIVE'
        }
      });

      if (employees.length === 0) {
        throw new Error('No eligible India employees found');
      }

      return this.processSpecificEmployeesAccrual(employees, year, month);
    } else {
      // Process all India employees
      return this.processMonthlyAccrual(year, month);
    }
  }

  /**
   * Process accrual for specific employees
   */
  private async processSpecificEmployeesAccrual(employees: any[], year: number, month: number): Promise<AccrualSummary> {
    const summary: AccrualSummary = {
      processedDate: new Date(),
      totalEmployeesProcessed: 0,
      totalAccrualsCreated: 0,
      accrualsByType: {},
      proRatedEmployees: 0,
      errors: []
    };

    for (const employee of employees) {
      try {
        const calculations = await this.calculateEmployeeAccrual(employee, year, month);

        for (const calculation of calculations) {
          await this.processAccrualCalculation(calculation);
          summary.totalAccrualsCreated++;

          if (!summary.accrualsByType[calculation.leaveType]) {
            summary.accrualsByType[calculation.leaveType] = 0;
          }
          summary.accrualsByType[calculation.leaveType] += calculation.accrualAmount;
        }

        if (calculations.some(calc => calc.isProRated)) {
          summary.proRatedEmployees++;
        }

        summary.totalEmployeesProcessed++;

      } catch (error) {
        const errorMsg = `Failed to process employee ${employee.employeeId}: ${error}`;
        console.error(errorMsg);
        summary.errors.push(errorMsg);
      }
    }

    return summary;
  }

  /**
   * Send accrual summary email to HR
   */
  private async sendAccrualSummaryEmail(summary: AccrualSummary, year: number, month: number) {
    try {
      const hrAdmins = await prisma.user.findMany({
        where: {
          role: 'HR_ADMIN',
          status: 'ACTIVE'
        },
        select: { email: true, firstName: true, lastName: true }
      });

      for (const hrAdmin of hrAdmins) {
        await emailService.sendAccrualSummaryNotification({
          hrName: `${hrAdmin.firstName} ${hrAdmin.lastName}`,
          hrEmail: hrAdmin.email,
          year,
          month,
          summary,
          portalUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
        });
      }

    } catch (error) {
      console.error('Failed to send accrual summary email:', error);
    }
  }

  /**
   * Get accrual history for an employee
   */
  async getEmployeeAccrualHistory(employeeId: string, year?: number) {
    const whereClause: any = { employeeId };
    if (year) whereClause.year = year;

    return prisma.monthlyAccrual.findMany({
      where: whereClause,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true
          }
        }
      }
    });
  }

  /**
   * Get accrual statistics
   */
  async getAccrualStatistics(year: number, month?: number) {
    const whereClause: any = { year };
    if (month) whereClause.month = month;

    const [totalAccruals, proRatedCount, totalByType] = await Promise.all([
      prisma.monthlyAccrual.count({ where: whereClause }),
      prisma.monthlyAccrual.count({ where: { ...whereClause, proRated: true } }),
      prisma.monthlyAccrual.groupBy({
        by: ['month'],
        where: whereClause,
        _sum: {
          casualLeave: true,
          privilegeLeave: true
        },
        _count: {
          employeeId: true
        }
      })
    ]);

    return {
      totalAccruals,
      proRatedCount,
      monthlyBreakdown: totalByType,
      lastProcessedDate: await this.getLastProcessedDate(year, month)
    };
  }

  /**
   * Get last processed date for accruals
   */
  private async getLastProcessedDate(year: number, month?: number) {
    const whereClause: any = { year };
    if (month) whereClause.month = month;

    const lastAccrual = await prisma.monthlyAccrual.findFirst({
      where: whereClause,
      orderBy: { processedAt: 'desc' },
      select: { processedAt: true }
    });

    return lastAccrual?.processedAt;
  }

  /**
   * Validate accrual data integrity
   */
  async validateAccrualIntegrity(year: number, month: number) {
    const issues = [];

    // Check for missing accruals
    const indiaEmployees = await prisma.user.findMany({
      where: { country: 'INDIA', status: 'ACTIVE' },
      select: { id: true, firstName: true, lastName: true, employeeId: true }
    });

    for (const employee of indiaEmployees) {
      const accrual = await prisma.monthlyAccrual.findUnique({
        where: {
          employeeId_year_month: {
            employeeId: employee.id,
            year,
            month
          }
        }
      });

      if (!accrual) {
        issues.push({
          type: 'MISSING_ACCRUAL',
          employeeId: employee.employeeId,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          message: `Missing accrual record for ${year}-${month}`
        });
      }
    }

    // Check for balance mismatches
    const balances = await prisma.leaveBalance.findMany({
      where: { year },
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeId: true }
        }
      }
    });

    for (const balance of balances) {
      const expectedTotal = balance.used + balance.available;
      if (Math.abs(expectedTotal - balance.totalEntitlement) > 0.01) {
        issues.push({
          type: 'BALANCE_MISMATCH',
          employeeId: balance.employee.employeeId,
          employeeName: `${balance.employee.firstName} ${balance.employee.lastName}`,
          leaveType: balance.leaveType,
          message: `Balance mismatch: Total=${balance.totalEntitlement}, Used+Available=${expectedTotal}`
        });
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      checkedDate: new Date()
    };
  }
}

// Export singleton instance
export const accrualAutomationService = AccrualAutomationService.getInstance();