import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface PtoAccrualResult {
  employeeId: string;
  employeeName: string;
  designation: string;
  accrualAmount: number;
  carryForwardAmount: number;
  totalAvailable: number;
  proRated: boolean;
  proRataMonths?: number;
}

interface CarryForwardResult {
  employeeId: string;
  employeeName: string;
  carriedDays: number;
  expiryDate: Date;
  status: string;
}

export class UsaPtoAutomationService {

  /**
   * Process annual PTO accrual for USA employees
   * Typically run on January 1st of each year
   */
  async processAnnualPtoAccrual(year: number): Promise<{
    success: boolean;
    processedCount: number;
    results: PtoAccrualResult[];
    errors: string[];
  }> {
    logger.info(`🇺🇸 Starting USA PTO annual accrual for year ${year}`);

    const results: PtoAccrualResult[] = [];
    const errors: string[] = [];

    try {
      // Get all USA employees
      const usaEmployees = await prisma.user.findMany({
        where: {
          country: 'USA',
          status: 'ACTIVE'
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeId: true,
          designation: true,
          joiningDate: true
        }
      });

      logger.info(`Found ${usaEmployees.length} USA employees for PTO accrual`);

      for (const employee of usaEmployees) {
        try {
          // Get PTO policy for employee's designation
          const ptoPolicy = await this.getPtoPolicyForDesignation(employee.designation || 'MANAGER');

          if (!ptoPolicy) {
            errors.push(`No PTO policy found for designation: ${employee.designation}`);
            continue;
          }

          // Calculate pro-rata if mid-year joiner
          const accrualResult = await this.calculatePtoAccrual(
            employee,
            ptoPolicy,
            year
          );

          // Get carry-forward from previous year
          const carryForward = await this.getCarryForwardAmount(employee.id, year);

          // Create accrual record
          await prisma.usaPtoAccrual.create({
            data: {
              employeeId: employee.id,
              year,
              month: null, // Annual accrual
              designation: employee.designation || 'MANAGER',
              accrualAmount: accrualResult.accrualAmount,
              carryForwardAmount: carryForward,
              totalAvailable: accrualResult.accrualAmount + carryForward,
              used: 0,
              balance: accrualResult.accrualAmount + carryForward,
              proRated: accrualResult.proRated,
              proRataMonths: accrualResult.proRataMonths,
              status: 'PROCESSED'
            }
          });

          // Update leave balance
          await this.updateLeaveBalance(
            employee.id,
            year,
            accrualResult.accrualAmount,
            carryForward
          );

          results.push({
            employeeId: employee.id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            designation: employee.designation || 'MANAGER',
            accrualAmount: accrualResult.accrualAmount,
            carryForwardAmount: carryForward,
            totalAvailable: accrualResult.accrualAmount + carryForward,
            proRated: accrualResult.proRated,
            proRataMonths: accrualResult.proRataMonths
          });

          logger.info(`✅ Processed PTO accrual for ${employee.employeeId}: ${accrualResult.accrualAmount} days`);

        } catch (error: any) {
          errors.push(`Error processing ${employee.employeeId}: ${error.message}`);
          logger.error(`Failed to process PTO for ${employee.employeeId}:`, error);
        }
      }

      logger.info(`🏁 Completed USA PTO accrual: ${results.length} processed, ${errors.length} errors`);

      return {
        success: errors.length === 0,
        processedCount: results.length,
        results,
        errors
      };

    } catch (error: any) {
      logger.error('Failed to process USA PTO annual accrual:', error);
      throw error;
    }
  }

  /**
   * Calculate PTO accrual for an employee
   * Handles pro-rata calculation for mid-year joiners
   */
  private async calculatePtoAccrual(
    employee: any,
    ptoPolicy: any,
    year: number
  ): Promise<{
    accrualAmount: number;
    proRated: boolean;
    proRataMonths?: number;
  }> {
    const joiningDate = new Date(employee.joiningDate);
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);

    // Check if employee joined mid-year
    if (joiningDate > yearStart && joiningDate <= yearEnd && ptoPolicy.proRataCalculation) {
      // Pro-rata calculation
      const monthsWorked = 12 - joiningDate.getMonth();
      const proRataAmount = (ptoPolicy.annualPtoDays / 12) * monthsWorked;

      return {
        accrualAmount: Math.round(proRataAmount * 100) / 100,
        proRated: true,
        proRataMonths: monthsWorked
      };
    }

    // Full year accrual
    return {
      accrualAmount: ptoPolicy.annualPtoDays,
      proRated: false
    };
  }

  /**
   * Get carry-forward amount from previous year
   */
  private async getCarryForwardAmount(employeeId: string, currentYear: number): Promise<number> {
    const carryForward = await prisma.usaPtoCarryForward.findUnique({
      where: {
        employeeId_fromYear_toYear: {
          employeeId,
          fromYear: currentYear - 1,
          toYear: currentYear
        }
      }
    });

    return carryForward?.remaining || 0;
  }

  /**
   * Process year-end carry-forward
   * Typically run on December 31st
   */
  async processYearEndCarryForward(year: number): Promise<{
    success: boolean;
    processedCount: number;
    results: CarryForwardResult[];
    errors: string[];
  }> {
    logger.info(`🇺🇸 Starting USA PTO carry-forward for year ${year} → ${year + 1}`);

    const results: CarryForwardResult[] = [];
    const errors: string[] = [];

    try {
      // Get all USA employees with unused PTO
      const accruals = await prisma.usaPtoAccrual.findMany({
        where: {
          year,
          month: null, // Annual accrual only
          balance: { gt: 0 }
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              designation: true
            }
          }
        }
      });

      for (const accrual of accruals) {
        try {
          // Get PTO policy to determine max carry-forward
          const ptoPolicy = await this.getPtoPolicyForDesignation(accrual.designation);

          if (!ptoPolicy) {
            errors.push(`No PTO policy for designation: ${accrual.designation}`);
            continue;
          }

          // Calculate carry-forward amount (limited by policy)
          const carriedDays = Math.min(accrual.balance, ptoPolicy.maxCarryForward);

          // Calculate expiry date (typically Q1 of next year)
          const expiryDate = new Date(year + 1, 2, 31); // March 31st

          // Create carry-forward record
          await prisma.usaPtoCarryForward.create({
            data: {
              employeeId: accrual.employeeId,
              fromYear: year,
              toYear: year + 1,
              carriedDays,
              expiryDate,
              used: 0,
              expired: 0,
              remaining: carriedDays,
              status: 'ACTIVE'
            }
          });

          results.push({
            employeeId: accrual.employeeId,
            employeeName: `${accrual.employee.firstName} ${accrual.employee.lastName}`,
            carriedDays,
            expiryDate,
            status: 'ACTIVE'
          });

          logger.info(`✅ Carried forward ${carriedDays} days for employee ${accrual.employeeId}`);

        } catch (error: any) {
          errors.push(`Error processing carry-forward for ${accrual.employeeId}: ${error.message}`);
          logger.error(`Failed carry-forward for ${accrual.employeeId}:`, error);
        }
      }

      logger.info(`🏁 Completed carry-forward: ${results.length} processed`);

      return {
        success: errors.length === 0,
        processedCount: results.length,
        results,
        errors
      };

    } catch (error: any) {
      logger.error('Failed to process year-end carry-forward:', error);
      throw error;
    }
  }

  /**
   * Expire Q1 carry-forward balances
   * Typically run on April 1st
   */
  async expireCarryForwardBalances(year: number): Promise<{
    success: boolean;
    expiredCount: number;
    totalExpiredDays: number;
  }> {
    logger.info(`🇺🇸 Expiring Q1 carry-forward balances for year ${year}`);

    try {
      const today = new Date();

      // Find expired carry-forwards
      const expiredCarryForwards = await prisma.usaPtoCarryForward.findMany({
        where: {
          toYear: year,
          status: 'ACTIVE',
          expiryDate: { lt: today },
          remaining: { gt: 0 }
        }
      });

      let totalExpiredDays = 0;

      for (const carryForward of expiredCarryForwards) {
        await prisma.usaPtoCarryForward.update({
          where: { id: carryForward.id },
          data: {
            expired: carryForward.remaining,
            remaining: 0,
            status: 'EXPIRED'
          }
        });

        totalExpiredDays += carryForward.remaining;

        logger.info(`⏰ Expired ${carryForward.remaining} carry-forward days for employee ${carryForward.employeeId}`);
      }

      logger.info(`🏁 Expired ${expiredCarryForwards.length} carry-forwards, total: ${totalExpiredDays} days`);

      return {
        success: true,
        expiredCount: expiredCarryForwards.length,
        totalExpiredDays
      };

    } catch (error: any) {
      logger.error('Failed to expire carry-forward balances:', error);
      throw error;
    }
  }

  /**
   * Get PTO policy for a designation
   */
  private async getPtoPolicyForDesignation(designation: string) {
    return await prisma.usaPtoPolicy.findUnique({
      where: {
        designation,
        isActive: true
      }
    });
  }

  /**
   * Update leave balance table for USA PTO
   */
  private async updateLeaveBalance(
    employeeId: string,
    year: number,
    accrualAmount: number,
    carryForward: number
  ) {
    const totalEntitlement = accrualAmount + carryForward;

    await prisma.leaveBalance.upsert({
      where: {
        employeeId_leaveType_year: {
          employeeId,
          leaveType: 'PTO',
          year
        }
      },
      update: {
        totalEntitlement,
        available: totalEntitlement,
        carryForward
      },
      create: {
        employeeId,
        leaveType: 'PTO',
        year,
        totalEntitlement,
        available: totalEntitlement,
        carryForward,
        used: 0
      }
    });
  }

  /**
   * Get employee's current PTO balance
   */
  async getEmployeePtoBalance(employeeId: string, year: number) {
    const accrual = await prisma.usaPtoAccrual.findUnique({
      where: {
        employeeId_year_month: {
          employeeId,
          year,
          month: null
        }
      }
    });

    const carryForward = await prisma.usaPtoCarryForward.findFirst({
      where: {
        employeeId,
        toYear: year,
        status: { in: ['ACTIVE', 'FULLY_USED'] }
      }
    });

    return {
      accrual: accrual?.balance || 0,
      carryForward: carryForward?.remaining || 0,
      total: (accrual?.balance || 0) + (carryForward?.remaining || 0),
      carryForwardExpiry: carryForward?.expiryDate
    };
  }

  /**
   * Get PTO usage report for an employee
   */
  async getEmployeePtoReport(employeeId: string, year: number) {
    const accrual = await prisma.usaPtoAccrual.findUnique({
      where: {
        employeeId_year_month: {
          employeeId,
          year,
          month: null
        }
      }
    });

    const carryForward = await prisma.usaPtoCarryForward.findFirst({
      where: {
        employeeId,
        toYear: year
      }
    });

    // Get leave requests for this year
    const leaveRequests = await prisma.leaveRequest.findMany({
      where: {
        employeeId,
        leaveType: 'PTO',
        startDate: {
          gte: new Date(year, 0, 1),
          lte: new Date(year, 11, 31)
        },
        status: 'APPROVED'
      },
      orderBy: { startDate: 'asc' }
    });

    return {
      accrual: {
        annual: accrual?.accrualAmount || 0,
        carryForward: accrual?.carryForwardAmount || 0,
        total: accrual?.totalAvailable || 0,
        used: accrual?.used || 0,
        balance: accrual?.balance || 0,
        proRated: accrual?.proRated || false
      },
      carryForward: {
        amount: carryForward?.carriedDays || 0,
        used: carryForward?.used || 0,
        expired: carryForward?.expired || 0,
        remaining: carryForward?.remaining || 0,
        expiryDate: carryForward?.expiryDate,
        status: carryForward?.status || 'N/A'
      },
      leaveRequests: leaveRequests.map(lr => ({
        id: lr.id,
        startDate: lr.startDate,
        endDate: lr.endDate,
        totalDays: lr.totalDays,
        status: lr.status
      }))
    };
  }
}

export const usaPtoAutomationService = new UsaPtoAutomationService();
