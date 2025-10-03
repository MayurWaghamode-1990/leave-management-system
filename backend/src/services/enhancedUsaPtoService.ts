import { PrismaClient } from '@prisma/client';
import { addMonths, differenceInMonths, startOfYear, endOfYear } from 'date-fns';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface DesignationPTOAllocation {
  designation: string;
  annualPTODays: number;
  carryForwardAllowed: boolean;
  maxCarryForwardDays: number;
}

export interface PTOAllocationResult {
  success: boolean;
  message: string;
  allocation?: {
    totalEntitlement: number;
    carryForward: number;
    available: number;
    designation: string;
  };
  error?: string;
}

export interface JoiningProRationResult {
  success: boolean;
  proRatedDays: number;
  remainingMonths: number;
  joiningDate: Date;
  fullYearEntitlement: number;
}

export class EnhancedUsaPtoService {
  // GLF USA PTO Allocation Rules
  private static readonly PTO_ALLOCATION_RULES: DesignationPTOAllocation[] = [
    {
      designation: 'AVP',
      annualPTODays: 15,
      carryForwardAllowed: true,
      maxCarryForwardDays: 5
    },
    {
      designation: 'BELOW_AVP', // All designations below AVP
      annualPTODays: 15,
      carryForwardAllowed: true,
      maxCarryForwardDays: 5
    },
    {
      designation: 'VP',
      annualPTODays: 20,
      carryForwardAllowed: false,
      maxCarryForwardDays: 0
    },
    {
      designation: 'ABOVE_VP', // SVP, C-level, etc.
      annualPTODays: 20,
      carryForwardAllowed: false,
      maxCarryForwardDays: 0
    }
  ];

  /**
   * Get PTO allocation rules based on employee designation
   */
  static getPTOAllocationRule(designation: string | null): DesignationPTOAllocation {
    if (!designation) {
      // Default to BELOW_AVP for employees without designation
      return this.PTO_ALLOCATION_RULES.find(rule => rule.designation === 'BELOW_AVP')!;
    }

    const upperDesignation = designation.toUpperCase();

    // VP and above get higher allocation with no carry-forward
    if (['VP', 'SVP', 'EVP', 'CEO', 'CTO', 'CFO', 'COO'].includes(upperDesignation)) {
      return this.PTO_ALLOCATION_RULES.find(rule => rule.designation === 'VP')!;
    }

    // AVP gets standard allocation with carry-forward
    if (upperDesignation === 'AVP') {
      return this.PTO_ALLOCATION_RULES.find(rule => rule.designation === 'AVP')!;
    }

    // All others (Manager, Senior Manager, etc.) get BELOW_AVP allocation
    return this.PTO_ALLOCATION_RULES.find(rule => rule.designation === 'BELOW_AVP')!;
  }

  /**
   * Calculate pro-rated PTO for mid-year joiners (USA specific)
   * Based on remaining months in the year
   */
  static calculateMidYearProRation(
    joiningDate: Date,
    fullYearEntitlement: number,
    year?: number
  ): JoiningProRationResult {
    try {
      const targetYear = year || joiningDate.getFullYear();
      const yearStart = startOfYear(new Date(targetYear, 0, 1));
      const yearEnd = endOfYear(new Date(targetYear, 11, 31));

      // Calculate remaining months from joining date to year end
      const remainingMonths = differenceInMonths(yearEnd, joiningDate) + 1; // +1 to include current month
      const totalMonths = 12;

      // Pro-rate based on remaining months
      const proRatedDays = Math.round((fullYearEntitlement * remainingMonths) / totalMonths);

      logger.info('USA PTO Pro-ration calculated', {
        joiningDate: joiningDate.toISOString(),
        remainingMonths,
        fullYearEntitlement,
        proRatedDays
      });

      return {
        success: true,
        proRatedDays,
        remainingMonths,
        joiningDate,
        fullYearEntitlement
      };
    } catch (error) {
      logger.error('Error calculating USA PTO pro-ration', error);
      return {
        success: false,
        proRatedDays: 0,
        remainingMonths: 0,
        joiningDate,
        fullYearEntitlement
      };
    }
  }

  /**
   * Allocate PTO for USA employees based on designation
   */
  static async allocatePTOByDesignation(
    employeeId: string,
    year: number
  ): Promise<PTOAllocationResult> {
    try {
      // Get employee details
      const employee = await prisma.user.findUnique({
        where: { id: employeeId },
        select: {
          id: true,
          designation: true,
          joiningDate: true,
          country: true,
          firstName: true,
          lastName: true
        }
      });

      if (!employee) {
        return {
          success: false,
          message: 'Employee not found',
          error: 'EMPLOYEE_NOT_FOUND'
        };
      }

      if (employee.country !== 'USA') {
        return {
          success: false,
          message: 'PTO allocation is only for USA employees',
          error: 'INVALID_COUNTRY'
        };
      }

      // Get PTO allocation rule based on designation
      const allocationRule = this.getPTOAllocationRule(employee.designation);

      // Check if employee joined mid-year
      const joiningYear = employee.joiningDate.getFullYear();
      let totalEntitlement = allocationRule.annualPTODays;

      if (joiningYear === year && employee.joiningDate > startOfYear(new Date(year, 0, 1))) {
        // Pro-rate for mid-year joiners
        const proRation = this.calculateMidYearProRation(
          employee.joiningDate,
          allocationRule.annualPTODays,
          year
        );
        totalEntitlement = proRation.proRatedDays;
      }

      // Get previous year carry-forward (if applicable)
      let carryForward = 0;
      if (allocationRule.carryForwardAllowed && year > joiningYear) {
        const previousYearBalance = await prisma.leaveBalance.findUnique({
          where: {
            employeeId_leaveType_year: {
              employeeId: employeeId,
              leaveType: 'PTO',
              year: year - 1
            }
          }
        });

        if (previousYearBalance) {
          const remainingPTO = previousYearBalance.available;
          carryForward = Math.min(remainingPTO, allocationRule.maxCarryForwardDays);
        }
      }

      // Calculate total available PTO
      const available = totalEntitlement + carryForward;

      // Create or update leave balance
      await prisma.leaveBalance.upsert({
        where: {
          employeeId_leaveType_year: {
            employeeId: employeeId,
            leaveType: 'PTO',
            year: year
          }
        },
        create: {
          employeeId: employeeId,
          leaveType: 'PTO',
          totalEntitlement: totalEntitlement,
          used: 0,
          available: available,
          carryForward: carryForward,
          year: year
        },
        update: {
          totalEntitlement: totalEntitlement,
          available: available,
          carryForward: carryForward
        }
      });

      logger.info('USA PTO allocated successfully', {
        employeeId,
        designation: employee.designation,
        year,
        totalEntitlement,
        carryForward,
        available
      });

      return {
        success: true,
        message: 'PTO allocated successfully',
        allocation: {
          totalEntitlement,
          carryForward,
          available,
          designation: employee.designation || 'UNASSIGNED'
        }
      };

    } catch (error) {
      logger.error('Error allocating USA PTO', error);
      return {
        success: false,
        message: 'Failed to allocate PTO',
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * Process year-end carry-forward for USA employees
   */
  static async processYearEndCarryForward(year: number): Promise<void> {
    try {
      // Get all USA employees with PTO balances
      const usaEmployees = await prisma.user.findMany({
        where: {
          country: 'USA',
          status: 'ACTIVE'
        },
        include: {
          leaveBalances: {
            where: {
              leaveType: 'PTO',
              year: year
            }
          }
        }
      });

      for (const employee of usaEmployees) {
        const allocationRule = this.getPTOAllocationRule(employee.designation);
        const currentBalance = employee.leaveBalances[0];

        if (currentBalance && allocationRule.carryForwardAllowed) {
          // Calculate carry-forward amount
          const carryForwardAmount = Math.min(
            currentBalance.available,
            allocationRule.maxCarryForwardDays
          );

          // Log carry-forward processing
          logger.info('Processing PTO carry-forward', {
            employeeId: employee.id,
            designation: employee.designation,
            currentAvailable: currentBalance.available,
            carryForwardAmount,
            maxAllowed: allocationRule.maxCarryForwardDays
          });
        }
      }

      logger.info('USA PTO year-end carry-forward processing completed', { year });
    } catch (error) {
      logger.error('Error processing USA PTO year-end carry-forward', error);
      throw error;
    }
  }

  /**
   * Get PTO allocation summary for an employee
   */
  static async getPTOAllocationSummary(employeeId: string, year: number) {
    try {
      const employee = await prisma.user.findUnique({
        where: { id: employeeId },
        select: {
          designation: true,
          country: true,
          joiningDate: true
        }
      });

      if (!employee || employee.country !== 'USA') {
        throw new Error('Employee not found or not USA based');
      }

      const allocationRule = this.getPTOAllocationRule(employee.designation);
      const balance = await prisma.leaveBalance.findUnique({
        where: {
          employeeId_leaveType_year: {
            employeeId,
            leaveType: 'PTO',
            year
          }
        }
      });

      return {
        designation: employee.designation || 'UNASSIGNED',
        allocationRule,
        currentBalance: balance,
        isCarryForwardEligible: allocationRule.carryForwardAllowed
      };
    } catch (error) {
      logger.error('Error getting PTO allocation summary', error);
      throw error;
    }
  }
}

export const enhancedUsaPtoService = EnhancedUsaPtoService;