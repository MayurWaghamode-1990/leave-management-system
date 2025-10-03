import { prisma } from '../index';
import { startOfYear, endOfYear, startOfMonth, endOfMonth, addMonths, differenceInDays } from 'date-fns';

interface LocationPolicyConfig {
  region: 'INDIA' | 'USA';
  leaveTypes: LeaveTypeConfig[];
  carryForwardRules: CarryForwardRule[];
  accrualRules: AccrualRule[];
  approvalWorkflow: ApprovalWorkflow;
}

interface LeaveTypeConfig {
  type: string;
  name: string;
  allocation: {
    type: 'MONTHLY' | 'ANNUAL';
    amount: number;
    roleBasedRules?: RoleBasedRule[];
  };
  eligibility?: {
    maritalStatus?: string[];
    gender?: string[];
    minimumService?: number; // months
  };
  restrictions?: {
    maxConsecutive?: number;
    minimumGap?: number;
    requiresDocumentation?: boolean;
    documentationThreshold?: number;
  };
}

interface RoleBasedRule {
  roles: string[]; // VP, AVP, etc.
  allocation: number;
}

interface CarryForwardRule {
  leaveType: string;
  maxCarryForward: number;
  expiryDate?: string; // "31-DEC" for year-end expiry
  roleBasedRules?: RoleBasedCarryForward[];
}

interface RoleBasedCarryForward {
  roles: string[];
  maxCarryForward: number;
  allowed: boolean;
}

interface AccrualRule {
  leaveType: string;
  monthlyAccrual: number;
  joiningDateRule: {
    fullMonthThreshold: number; // day of month (15)
    proRateAfterThreshold: number; // 0.5 for half day
  };
}

interface ApprovalWorkflow {
  leaves: ApprovalLevel[];
  compOff: ApprovalLevel[];
}

interface ApprovalLevel {
  level: number;
  role: string;
  description: string;
}

export class LocationPolicyService {
  private static readonly INDIA_POLICY: LocationPolicyConfig = {
    region: 'INDIA',
    leaveTypes: [
      {
        type: 'CASUAL_LEAVE',
        name: 'Casual Leave',
        allocation: {
          type: 'MONTHLY',
          amount: 1.0
        },
        restrictions: {
          maxConsecutive: 7,
          minimumGap: 1
        }
      },
      {
        type: 'PRIVILEGE_LEAVE',
        name: 'Privilege Leave',
        allocation: {
          type: 'MONTHLY',
          amount: 1.0
        },
        restrictions: {
          maxConsecutive: 30
        }
      },
      {
        type: 'MATERNITY_LEAVE',
        name: 'Maternity Leave',
        allocation: {
          type: 'ANNUAL',
          amount: 180
        },
        eligibility: {
          maritalStatus: ['MARRIED'],
          gender: ['FEMALE']
        }
      },
      {
        type: 'PATERNITY_LEAVE',
        name: 'Paternity Leave',
        allocation: {
          type: 'ANNUAL',
          amount: 5
        },
        eligibility: {
          maritalStatus: ['MARRIED'],
          gender: ['MALE']
        }
      },
      {
        type: 'LWP',
        name: 'Leave Without Pay',
        allocation: {
          type: 'ANNUAL',
          amount: 0 // Unlimited but unpaid
        }
      },
      {
        type: 'COMP_OFF',
        name: 'Compensatory Off',
        allocation: {
          type: 'ANNUAL',
          amount: 0 // Earned through overtime work
        }
      }
    ],
    carryForwardRules: [
      {
        leaveType: 'CASUAL_LEAVE',
        maxCarryForward: 0, // Expires on 31st December
        expiryDate: '31-DEC'
      },
      {
        leaveType: 'PRIVILEGE_LEAVE',
        maxCarryForward: 30 // Maximum 30 PLs can be carried forward
      }
    ],
    accrualRules: [
      {
        leaveType: 'CASUAL_LEAVE',
        monthlyAccrual: 1.0,
        joiningDateRule: {
          fullMonthThreshold: 15,
          proRateAfterThreshold: 0.5
        }
      },
      {
        leaveType: 'PRIVILEGE_LEAVE',
        monthlyAccrual: 1.0,
        joiningDateRule: {
          fullMonthThreshold: 15,
          proRateAfterThreshold: 0.5
        }
      }
    ],
    approvalWorkflow: {
      leaves: [
        { level: 1, role: 'L1_MANAGER', description: 'Direct Manager' },
        { level: 2, role: 'HR_ADMIN', description: 'HR Admin' }
      ],
      compOff: [
        { level: 1, role: 'L1_MANAGER', description: 'Direct Manager' },
        { level: 2, role: 'L2_MANAGER', description: 'Senior Manager' },
        { level: 3, role: 'HR_ADMIN', description: 'HR Admin' }
      ]
    }
  };

  private static readonly USA_POLICY: LocationPolicyConfig = {
    region: 'USA',
    leaveTypes: [
      {
        type: 'PTO',
        name: 'Paid Time Off',
        allocation: {
          type: 'ANNUAL',
          amount: 15, // Default for AVP and below
          roleBasedRules: [
            { roles: ['VP', 'SVP', 'EVP'], allocation: 20 }
          ]
        }
      },
      {
        type: 'BEREAVEMENT_LEAVE',
        name: 'Bereavement Leave',
        allocation: {
          type: 'ANNUAL',
          amount: 5
        }
      },
      {
        type: 'LWP',
        name: 'Leave Without Pay',
        allocation: {
          type: 'ANNUAL',
          amount: 0
        }
      },
      {
        type: 'COMP_OFF',
        name: 'Compensatory Off',
        allocation: {
          type: 'ANNUAL',
          amount: 0
        }
      }
    ],
    carryForwardRules: [
      {
        leaveType: 'PTO',
        maxCarryForward: 5,
        roleBasedRules: [
          { roles: ['AVP', 'MANAGER', 'SENIOR_MANAGER'], maxCarryForward: 5, allowed: true },
          { roles: ['VP', 'SVP', 'EVP'], maxCarryForward: 0, allowed: false }
        ]
      }
    ],
    accrualRules: [],
    approvalWorkflow: {
      leaves: [
        { level: 1, role: 'L1_MANAGER', description: 'Direct Manager' },
        { level: 2, role: 'HR_ADMIN', description: 'HR Admin' }
      ],
      compOff: [
        { level: 1, role: 'L1_MANAGER', description: 'Direct Manager' },
        { level: 2, role: 'L2_MANAGER', description: 'Senior Manager' },
        { level: 3, role: 'HR_ADMIN', description: 'HR Admin' }
      ]
    }
  };

  /**
   * Get location-based policy configuration
   */
  static getLocationPolicy(region: 'INDIA' | 'USA'): LocationPolicyConfig {
    return region === 'INDIA' ? this.INDIA_POLICY : this.USA_POLICY;
  }

  /**
   * Calculate leave allocation for a user based on their location and role
   */
  static async calculateLeaveAllocation(userId: string, year: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        country: true,
        role: true,
        joiningDate: true,
        gender: true,
        maritalStatus: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const region = (user.country as 'INDIA' | 'USA') || 'INDIA';
    const policy = this.getLocationPolicy(region);
    const allocations: any[] = [];

    for (const leaveType of policy.leaveTypes) {
      // Check eligibility
      if (!this.checkEligibility(user, leaveType)) {
        continue;
      }

      let allocation = leaveType.allocation.amount;

      // Apply role-based rules
      if (leaveType.allocation.roleBasedRules) {
        const roleRule = leaveType.allocation.roleBasedRules.find(rule =>
          rule.roles.includes(user.role)
        );
        if (roleRule) {
          allocation = roleRule.allocation;
        }
      }

      // For annual allocation types, check if mid-year joiner
      if (leaveType.allocation.type === 'ANNUAL' && user.joiningDate) {
        const joiningYear = new Date(user.joiningDate).getFullYear();
        if (joiningYear === year) {
          allocation = this.calculateProRatedAllocation(allocation, user.joiningDate, year);
        }
      }

      allocations.push({
        leaveType: leaveType.type,
        name: leaveType.name,
        allocation,
        allocationType: leaveType.allocation.type
      });
    }

    return allocations;
  }

  /**
   * Check if user is eligible for a specific leave type
   */
  private static checkEligibility(user: any, leaveType: LeaveTypeConfig): boolean {
    if (!leaveType.eligibility) return true;

    // Check marital status
    if (leaveType.eligibility.maritalStatus && user.maritalStatus) {
      if (!leaveType.eligibility.maritalStatus.includes(user.maritalStatus)) {
        return false;
      }
    }

    // Check gender
    if (leaveType.eligibility.gender && user.gender) {
      if (!leaveType.eligibility.gender.includes(user.gender)) {
        return false;
      }
    }

    // Check minimum service (could be added later)
    if (leaveType.eligibility.minimumService && user.joiningDate) {
      const monthsOfService = differenceInDays(new Date(), new Date(user.joiningDate)) / 30;
      if (monthsOfService < leaveType.eligibility.minimumService) {
        return false;
      }
    }

    return true;
  }

  /**
   * Calculate prorated allocation for mid-year joiners
   */
  private static calculateProRatedAllocation(totalAllocation: number, joiningDate: Date, year: number): number {
    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(new Date(year, 0, 1));
    const joiningDateInYear = new Date(Math.max(joiningDate.getTime(), yearStart.getTime()));

    const totalDaysInYear = differenceInDays(yearEnd, yearStart) + 1;
    const remainingDaysInYear = differenceInDays(yearEnd, joiningDateInYear) + 1;

    return Math.round((totalAllocation * remainingDaysInYear / totalDaysInYear) * 100) / 100;
  }

  /**
   * Process monthly accrual for India employees
   */
  static async processMonthlyAccrual(year: number, month: number) {
    // Get all India employees
    const indiaEmployees = await prisma.user.findMany({
      where: {
        country: 'INDIA',
        status: 'ACTIVE'
      },
      select: {
        id: true,
        joiningDate: true,
        role: true
      }
    });

    const accrualRules = this.INDIA_POLICY.accrualRules;
    const results = [];

    for (const employee of indiaEmployees) {
      for (const rule of accrualRules) {
        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = endOfMonth(monthStart);

        let accrualAmount = rule.monthlyAccrual;
        let isProRated = false;

        // Check if employee joined mid-month
        if (employee.joiningDate) {
          const joiningDate = new Date(employee.joiningDate);
          if (joiningDate >= monthStart && joiningDate <= monthEnd) {
            isProRated = true;
            const joiningDay = joiningDate.getDate();

            if (joiningDay > rule.joiningDateRule.fullMonthThreshold) {
              accrualAmount = rule.joiningDateRule.proRateAfterThreshold;
            }
          }
        }

        // Create or update monthly accrual record
        await prisma.monthlyAccrual.upsert({
          where: {
            employeeId_year_month: {
              employeeId: employee.id,
              year,
              month
            }
          },
          update: {
            [rule.leaveType === 'CASUAL_LEAVE' ? 'casualLeave' : 'privilegeLeave']: accrualAmount,
            proRated: isProRated
          },
          create: {
            employeeId: employee.id,
            year,
            month,
            casualLeave: rule.leaveType === 'CASUAL_LEAVE' ? accrualAmount : 0,
            privilegeLeave: rule.leaveType === 'PRIVILEGE_LEAVE' ? accrualAmount : 0,
            proRated: isProRated,
            joiningDate: isProRated ? employee.joiningDate : null
          }
        });

        // Update leave balance
        await this.updateLeaveBalance(employee.id, rule.leaveType, accrualAmount, year);

        results.push({
          employeeId: employee.id,
          leaveType: rule.leaveType,
          accrualAmount,
          isProRated
        });
      }
    }

    return results;
  }

  /**
   * Update leave balance after accrual
   */
  private static async updateLeaveBalance(employeeId: string, leaveType: string, accrualAmount: number, year: number) {
    const existingBalance = await prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveType_year: {
          employeeId,
          leaveType,
          year
        }
      }
    });

    if (existingBalance) {
      const newAvailable = existingBalance.available + accrualAmount;
      await prisma.leaveBalance.update({
        where: { id: existingBalance.id },
        data: {
          totalEntitlement: existingBalance.totalEntitlement + accrualAmount,
          available: newAvailable
        }
      });
    } else {
      await prisma.leaveBalance.create({
        data: {
          employeeId,
          leaveType,
          year,
          totalEntitlement: accrualAmount,
          available: accrualAmount,
          used: 0,
          carryForward: 0
        }
      });
    }
  }

  /**
   * Get carry forward rules for a user (Enhanced for GLF VP/AVP rules)
   */
  static getCarryForwardRules(userId: string, leaveType: string, userRole: string, region: 'INDIA' | 'USA') {
    const policy = this.getLocationPolicy(region);
    const carryForwardRule = policy.carryForwardRules.find(rule => rule.leaveType === leaveType);

    if (!carryForwardRule) {
      return { maxCarryForward: 0, allowed: false, ruleApplied: 'NO_RULE' };
    }

    // GLF USA Rule: VP and above cannot carry forward PTOs
    if (region === 'USA' && leaveType === 'PTO') {
      // Check if user is VP level or above
      const vpAndAboveRoles = ['VP', 'SVP', 'EVP', 'CEO', 'PRESIDENT'];
      const isVPOrAbove = vpAndAboveRoles.some(role =>
        userRole.toUpperCase().includes(role) ||
        userRole.toUpperCase() === role
      );

      if (isVPOrAbove) {
        return {
          maxCarryForward: 0,
          allowed: false,
          ruleApplied: 'VP_NO_CARRYFORWARD',
          reason: 'VP and above employees cannot carry forward PTO (GLF USA Policy)'
        };
      }

      // AVP and below can carry forward maximum 5 days
      const avpAndBelowRoles = ['AVP', 'MANAGER', 'SENIOR_MANAGER', 'ASSISTANT_MANAGER', 'EMPLOYEE'];
      const isAVPOrBelow = avpAndBelowRoles.some(role =>
        userRole.toUpperCase().includes(role) ||
        userRole.toUpperCase() === role
      );

      if (isAVPOrBelow) {
        return {
          maxCarryForward: 5,
          allowed: true,
          ruleApplied: 'AVP_LIMITED_CARRYFORWARD',
          reason: 'AVP and below can carry forward maximum 5 days PTO (GLF USA Policy)'
        };
      }
    }

    // Check role-based rules from policy
    if (carryForwardRule.roleBasedRules) {
      const roleRule = carryForwardRule.roleBasedRules.find(rule =>
        rule.roles.some(role => userRole.toUpperCase().includes(role.toUpperCase()))
      );
      if (roleRule) {
        return {
          maxCarryForward: roleRule.maxCarryForward,
          allowed: roleRule.allowed,
          ruleApplied: 'ROLE_BASED',
          reason: `Role-based rule applied for ${userRole}`
        };
      }
    }

    return {
      maxCarryForward: carryForwardRule.maxCarryForward,
      allowed: carryForwardRule.maxCarryForward > 0,
      ruleApplied: 'DEFAULT',
      reason: 'Default carry forward rule applied'
    };
  }

  /**
   * Process year-end carry forward
   */
  static async processYearEndCarryForward(fromYear: number, toYear: number) {
    const users = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        country: true,
        role: true,
        leaveBalances: {
          where: { year: fromYear }
        }
      }
    });

    const results = [];

    for (const user of users) {
      const region = (user.country as 'INDIA' | 'USA') || 'INDIA';

      for (const balance of user.leaveBalances) {
        const carryForwardRule = this.getCarryForwardRules(
          user.id,
          balance.leaveType,
          user.role,
          region
        );

        if (carryForwardRule.allowed && balance.available > 0) {
          const carryForwardAmount = Math.min(balance.available, carryForwardRule.maxCarryForward);

          if (carryForwardAmount > 0) {
            // Create next year's balance with carry forward
            await prisma.leaveBalance.upsert({
              where: {
                employeeId_leaveType_year: {
                  employeeId: user.id,
                  leaveType: balance.leaveType,
                  year: toYear
                }
              },
              update: {
                carryForward: carryForwardAmount,
                available: carryForwardAmount
              },
              create: {
                employeeId: user.id,
                leaveType: balance.leaveType,
                year: toYear,
                totalEntitlement: 0,
                available: carryForwardAmount,
                used: 0,
                carryForward: carryForwardAmount
              }
            });

            results.push({
              employeeId: user.id,
              leaveType: balance.leaveType,
              carryForwardAmount
            });
          }
        }
      }
    }

    return results;
  }

  /**
   * Get approval workflow for a request type and region
   */
  static getApprovalWorkflow(requestType: 'leaves' | 'compOff', region: 'INDIA' | 'USA'): ApprovalLevel[] {
    const policy = this.getLocationPolicy(region);
    return policy.approvalWorkflow[requestType];
  }

  /**
   * Initialize leave policies in database
   */
  static async initializeLeavePolicies() {
    const policies = [this.INDIA_POLICY, this.USA_POLICY];

    for (const policy of policies) {
      for (const leaveType of policy.leaveTypes) {
        await prisma.leavePolicy.upsert({
          where: {
            name_region: {
              name: `${policy.region}_${leaveType.type}`,
              region: policy.region
            }
          },
          update: {
            entitlementDays: leaveType.allocation.amount,
            accrualRate: leaveType.allocation.type === 'MONTHLY' ? 12 : 1,
            maxCarryForward: policy.carryForwardRules.find(r => r.leaveType === leaveType.type)?.maxCarryForward || 0,
            requiresDocumentation: leaveType.restrictions?.requiresDocumentation || false,
            documentationThreshold: leaveType.restrictions?.documentationThreshold || 0,
            isActive: true
          },
          create: {
            name: `${policy.region}_${leaveType.type}`,
            leaveType: leaveType.type,
            entitlementDays: leaveType.allocation.amount,
            accrualRate: leaveType.allocation.type === 'MONTHLY' ? 12 : 1,
            maxCarryForward: policy.carryForwardRules.find(r => r.leaveType === leaveType.type)?.maxCarryForward || 0,
            requiresDocumentation: leaveType.restrictions?.requiresDocumentation || false,
            documentationThreshold: leaveType.restrictions?.documentationThreshold || 0,
            location: policy.region,
            region: policy.region,
            effectiveFrom: new Date(),
            isActive: true
          }
        });
      }

      // Create accrual rules
      for (const accrualRule of policy.accrualRules) {
        await prisma.leaveAccrualRule.upsert({
          where: {
            region_leaveType: {
              region: policy.region,
              leaveType: accrualRule.leaveType
            }
          },
          update: {
            monthlyAccrual: accrualRule.monthlyAccrual,
            joiningDayProRate: true,
            carryForwardRules: JSON.stringify(policy.carryForwardRules.find(r => r.leaveType === accrualRule.leaveType)),
            isActive: true
          },
          create: {
            region: policy.region,
            leaveType: accrualRule.leaveType,
            monthlyAccrual: accrualRule.monthlyAccrual,
            joiningDayProRate: true,
            carryForwardRules: JSON.stringify(policy.carryForwardRules.find(r => r.leaveType === accrualRule.leaveType)),
            expiryRules: JSON.stringify({ expiryDate: '31-DEC' }),
            isActive: true
          }
        });
      }
    }
  }
}