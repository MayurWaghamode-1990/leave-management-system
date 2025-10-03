import { PrismaClient } from '@prisma/client';
import {
  startOfMonth,
  endOfMonth,
  addMonths,
  differenceInMonths,
  getDate,
  isAfter,
  isBefore,
  endOfYear,
  startOfYear
} from 'date-fns';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface JoiningProRationRule {
  joiningDateRange: '1-15' | '16-31';
  clAccrual: number; // CL days for that month
  plAccrual: number; // PL days for that month
}

export interface MonthlyAccrualResult {
  success: boolean;
  employeeId: string;
  month: number;
  year: number;
  casualLeave: number;
  privilegeLeave: number;
  proRated: boolean;
  joiningDateRule?: '1-15' | '16-31';
  message: string;
}

export interface MaternityLeaveInfo {
  isOnMaternityLeave: boolean;
  startDate?: Date;
  endDate?: Date;
  suspendAccrual: boolean;
}

export class EnhancedIndiaAccrualService {
  // GLF India Joining Date Pro-ration Rules
  private static readonly JOINING_PRORATION_RULES: JoiningProRationRule[] = [
    {
      joiningDateRange: '1-15',
      clAccrual: 1.0, // Full CL for joining between 1st-15th
      plAccrual: 1.0  // Full PL for joining between 1st-15th
    },
    {
      joiningDateRange: '16-31',
      clAccrual: 0.5, // Half CL for joining after 15th
      plAccrual: 0.5  // Half PL for joining after 15th
    }
  ];

  /**
   * Get joining date pro-ration rule based on joining date
   */
  static getJoiningProRationRule(joiningDate: Date): JoiningProRationRule {
    const dayOfMonth = getDate(joiningDate);

    if (dayOfMonth <= 15) {
      return this.JOINING_PRORATION_RULES.find(rule => rule.joiningDateRange === '1-15')!;
    } else {
      return this.JOINING_PRORATION_RULES.find(rule => rule.joiningDateRange === '16-31')!;
    }
  }

  /**
   * Check if employee is on maternity leave and accrual should be suspended
   */
  static async checkMaternityLeaveStatus(
    employeeId: string,
    targetDate: Date
  ): Promise<MaternityLeaveInfo> {
    try {
      // Check for active maternity leave during the target month
      const maternityLeave = await prisma.leaveRequest.findFirst({
        where: {
          employeeId: employeeId,
          leaveType: 'MATERNITY_LEAVE',
          status: 'APPROVED',
          startDate: {
            lte: endOfMonth(targetDate)
          },
          endDate: {
            gte: startOfMonth(targetDate)
          }
        }
      });

      if (maternityLeave) {
        return {
          isOnMaternityLeave: true,
          startDate: maternityLeave.startDate,
          endDate: maternityLeave.endDate,
          suspendAccrual: true
        };
      }

      return {
        isOnMaternityLeave: false,
        suspendAccrual: false
      };
    } catch (error) {
      logger.error('Error checking maternity leave status', error);
      return {
        isOnMaternityLeave: false,
        suspendAccrual: false
      };
    }
  }

  /**
   * Process monthly accrual for India employees with GLF rules
   */
  static async processMonthlyAccrual(
    employeeId: string,
    year: number,
    month: number
  ): Promise<MonthlyAccrualResult> {
    try {
      // Get employee details
      const employee = await prisma.user.findUnique({
        where: { id: employeeId },
        select: {
          id: true,
          joiningDate: true,
          country: true,
          firstName: true,
          lastName: true,
          status: true
        }
      });

      if (!employee) {
        return {
          success: false,
          employeeId,
          month,
          year,
          casualLeave: 0,
          privilegeLeave: 0,
          proRated: false,
          message: 'Employee not found'
        };
      }

      if (employee.country !== 'INDIA') {
        return {
          success: false,
          employeeId,
          month,
          year,
          casualLeave: 0,
          privilegeLeave: 0,
          proRated: false,
          message: 'Monthly accrual is only for India employees'
        };
      }

      if (employee.status !== 'ACTIVE') {
        return {
          success: false,
          employeeId,
          month,
          year,
          casualLeave: 0,
          privilegeLeave: 0,
          proRated: false,
          message: 'Employee is not active'
        };
      }

      const targetDate = new Date(year, month - 1, 1); // month is 1-indexed
      const joiningYear = employee.joiningDate.getFullYear();
      const joiningMonth = employee.joiningDate.getMonth() + 1; // Convert to 1-indexed

      // Check maternity leave status (GLF: No CL/PL during maternity)
      const maternityStatus = await this.checkMaternityLeaveStatus(employeeId, targetDate);

      if (maternityStatus.suspendAccrual) {
        await this.recordMonthlyAccrual(employeeId, year, month, 0, 0, false, undefined, 'MATERNITY_SUSPENDED');

        return {
          success: true,
          employeeId,
          month,
          year,
          casualLeave: 0,
          privilegeLeave: 0,
          proRated: false,
          message: 'Accrual suspended due to maternity leave'
        };
      }

      // Determine accrual amounts
      let casualLeave = 1.0; // Default monthly CL
      let privilegeLeave = 1.0; // Default monthly PL
      let proRated = false;
      let joiningDateRule: '1-15' | '16-31' | undefined;

      // Check if this is the joining month for pro-ration
      if (joiningYear === year && joiningMonth === month) {
        const proRationRule = this.getJoiningProRationRule(employee.joiningDate);
        casualLeave = proRationRule.clAccrual;
        privilegeLeave = proRationRule.plAccrual;
        proRated = true;
        joiningDateRule = proRationRule.joiningDateRange;

        logger.info('Applying GLF joining date pro-ration', {
          employeeId,
          joiningDate: employee.joiningDate.toISOString(),
          joiningDateRule,
          casualLeave,
          privilegeLeave
        });
      }

      // Don't accrue for months before joining
      if (year < joiningYear || (year === joiningYear && month < joiningMonth)) {
        return {
          success: true,
          employeeId,
          month,
          year,
          casualLeave: 0,
          privilegeLeave: 0,
          proRated: false,
          message: 'No accrual before joining date'
        };
      }

      // Record the accrual
      await this.recordMonthlyAccrual(
        employeeId,
        year,
        month,
        casualLeave,
        privilegeLeave,
        proRated,
        joiningDateRule
      );

      // Update leave balances
      await this.updateLeaveBalances(employeeId, year, casualLeave, privilegeLeave);

      logger.info('India monthly accrual processed', {
        employeeId,
        year,
        month,
        casualLeave,
        privilegeLeave,
        proRated,
        joiningDateRule
      });

      return {
        success: true,
        employeeId,
        month,
        year,
        casualLeave,
        privilegeLeave,
        proRated,
        joiningDateRule,
        message: 'Monthly accrual processed successfully'
      };

    } catch (error) {
      logger.error('Error processing India monthly accrual', error);
      return {
        success: false,
        employeeId,
        month,
        year,
        casualLeave: 0,
        privilegeLeave: 0,
        proRated: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Record monthly accrual in database
   */
  private static async recordMonthlyAccrual(
    employeeId: string,
    year: number,
    month: number,
    casualLeave: number,
    privilegeLeave: number,
    proRated: boolean,
    joiningDateRule?: '1-15' | '16-31',
    status: string = 'PROCESSED'
  ): Promise<void> {
    await prisma.monthlyAccrual.upsert({
      where: {
        employeeId_year_month: {
          employeeId,
          year,
          month
        }
      },
      create: {
        employeeId,
        year,
        month,
        casualLeave,
        privilegeLeave,
        proRated,
        joiningDate: proRated ? (await prisma.user.findUnique({ where: { id: employeeId } }))?.joiningDate : undefined,
        status
      },
      update: {
        casualLeave,
        privilegeLeave,
        proRated,
        status
      }
    });
  }

  /**
   * Update leave balances with accrued amounts
   */
  private static async updateLeaveBalances(
    employeeId: string,
    year: number,
    casualLeaveAccrual: number,
    privilegeLeaveAccrual: number
  ): Promise<void> {
    // Update Casual Leave balance
    if (casualLeaveAccrual > 0) {
      await prisma.leaveBalance.upsert({
        where: {
          employeeId_leaveType_year: {
            employeeId,
            leaveType: 'CASUAL_LEAVE',
            year
          }
        },
        create: {
          employeeId,
          leaveType: 'CASUAL_LEAVE',
          totalEntitlement: casualLeaveAccrual,
          used: 0,
          available: casualLeaveAccrual,
          carryForward: 0,
          year
        },
        update: {
          totalEntitlement: {
            increment: casualLeaveAccrual
          },
          available: {
            increment: casualLeaveAccrual
          }
        }
      });
    }

    // Update Privilege Leave balance
    if (privilegeLeaveAccrual > 0) {
      await prisma.leaveBalance.upsert({
        where: {
          employeeId_leaveType_year: {
            employeeId,
            leaveType: 'EARNED_LEAVE',
            year
          }
        },
        create: {
          employeeId,
          leaveType: 'EARNED_LEAVE',
          totalEntitlement: privilegeLeaveAccrual,
          used: 0,
          available: privilegeLeaveAccrual,
          carryForward: 0,
          year
        },
        update: {
          totalEntitlement: {
            increment: privilegeLeaveAccrual
          },
          available: {
            increment: privilegeLeaveAccrual
          }
        }
      });
    }
  }

  /**
   * Process year-end carry-forward for India employees
   */
  static async processYearEndCarryForward(year: number): Promise<void> {
    try {
      // Get all India employees
      const indiaEmployees = await prisma.user.findMany({
        where: {
          country: 'INDIA',
          status: 'ACTIVE'
        },
        include: {
          leaveBalances: {
            where: {
              year: year,
              leaveType: {
                in: ['CASUAL_LEAVE', 'EARNED_LEAVE']
              }
            }
          }
        }
      });

      for (const employee of indiaEmployees) {
        const casualLeaveBalance = employee.leaveBalances.find(b => b.leaveType === 'CASUAL_LEAVE');
        const earnedLeaveBalance = employee.leaveBalances.find(b => b.leaveType === 'EARNED_LEAVE');

        // GLF Rule: CL expires on Dec 31st (no carry-forward)
        if (casualLeaveBalance && casualLeaveBalance.available > 0) {
          logger.info('CL balance expired (GLF rule)', {
            employeeId: employee.id,
            expiredCL: casualLeaveBalance.available,
            year
          });
          // CL balance will be reset to 0 for next year
        }

        // GLF Rule: PL can be carried forward, max 30 PLs total
        if (earnedLeaveBalance && earnedLeaveBalance.available > 0) {
          const carryForwardAmount = Math.min(earnedLeaveBalance.available, 30);

          // Create next year PL balance with carry-forward
          await prisma.leaveBalance.upsert({
            where: {
              employeeId_leaveType_year: {
                employeeId: employee.id,
                leaveType: 'EARNED_LEAVE',
                year: year + 1
              }
            },
            create: {
              employeeId: employee.id,
              leaveType: 'EARNED_LEAVE',
              totalEntitlement: 0, // Will be updated with monthly accrual
              used: 0,
              available: carryForwardAmount,
              carryForward: carryForwardAmount,
              year: year + 1
            },
            update: {
              carryForward: carryForwardAmount,
              available: {
                increment: carryForwardAmount
              }
            }
          });

          logger.info('PL carry-forward processed', {
            employeeId: employee.id,
            availablePL: earnedLeaveBalance.available,
            carryForwardAmount,
            year
          });
        }
      }

      logger.info('India year-end carry-forward processing completed', { year });
    } catch (error) {
      logger.error('Error processing India year-end carry-forward', error);
      throw error;
    }
  }

  /**
   * Bulk process monthly accrual for all India employees
   */
  static async processBulkMonthlyAccrual(year: number, month: number): Promise<void> {
    try {
      const indiaEmployees = await prisma.user.findMany({
        where: {
          country: 'INDIA',
          status: 'ACTIVE'
        }
      });

      logger.info('Starting bulk monthly accrual processing', {
        year,
        month,
        employeeCount: indiaEmployees.length
      });

      for (const employee of indiaEmployees) {
        await this.processMonthlyAccrual(employee.id, year, month);
      }

      logger.info('Bulk monthly accrual processing completed', { year, month });
    } catch (error) {
      logger.error('Error in bulk monthly accrual processing', error);
      throw error;
    }
  }
}

export const enhancedIndiaAccrualService = EnhancedIndiaAccrualService;