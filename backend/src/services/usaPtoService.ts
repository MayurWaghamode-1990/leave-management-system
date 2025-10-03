import { PrismaClient } from '@prisma/client'
import { UserRole } from '../../shared/src/types'

const prisma = new PrismaClient()

interface PtoAllocationRule {
  role: string
  annualPtoDays: number
  maxCarryForward: number
  description: string
}

interface PtoAllocationResult {
  employeeId: string
  role: string
  year: number
  annualAllocation: number
  proRatedAllocation: number
  joiningDate: Date
  isProRated: boolean
  carryForwardLimit: number
  reason: string
}

export class UsaPtoService {
  // GLF Role-based PTO allocation rules
  private readonly ptoRules: PtoAllocationRule[] = [
    {
      role: 'AVP',
      annualPtoDays: 15,
      maxCarryForward: 5, // AVP can carry forward max 5 days
      description: 'Assistant Vice President'
    },
    {
      role: 'VP',
      annualPtoDays: 20,
      maxCarryForward: 0, // VP and above cannot carry forward
      description: 'Vice President'
    },
    {
      role: 'SVP',
      annualPtoDays: 20,
      maxCarryForward: 0, // VP and above cannot carry forward
      description: 'Senior Vice President'
    },
    {
      role: 'EVP',
      annualPtoDays: 20,
      maxCarryForward: 0, // VP and above cannot carry forward
      description: 'Executive Vice President'
    },
    {
      role: 'MANAGER',
      annualPtoDays: 15, // Default for other managers
      maxCarryForward: 5,
      description: 'Manager (default USA allocation)'
    },
    {
      role: 'EMPLOYEE',
      annualPtoDays: 12, // Default for employees
      maxCarryForward: 3,
      description: 'Employee (default USA allocation)'
    }
  ]

  // Get PTO allocation rule for a role
  private getPtoRuleForRole(role: string): PtoAllocationRule {
    const rule = this.ptoRules.find(r => r.role === role)

    // Default fallback for unknown roles
    if (!rule) {
      return {
        role: 'EMPLOYEE',
        annualPtoDays: 12,
        maxCarryForward: 3,
        description: 'Default allocation for unspecified role'
      }
    }

    return rule
  }

  // Calculate pro-rated PTO for mid-year joiners
  private calculateProRatedPto(joiningDate: Date, annualPtoDays: number, targetYear: number): number {
    const joiningYear = joiningDate.getFullYear()

    // If joined in a different year, give full allocation
    if (joiningYear !== targetYear) {
      return annualPtoDays
    }

    // Calculate remaining months in the year
    const joiningMonth = joiningDate.getMonth() // 0-11
    const remainingMonths = 12 - joiningMonth

    // Pro-rate based on remaining months
    const proRatedDays = (annualPtoDays * remainingMonths) / 12

    // Round to nearest 0.5 for practical use
    return Math.round(proRatedDays * 2) / 2
  }

  // Process PTO allocation for a specific USA employee
  async processEmployeePtoAllocation(employeeId: string, year: number): Promise<PtoAllocationResult> {
    // Get employee details
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        role: true,
        location: true,
        joiningDate: true,
        status: true,
        firstName: true,
        lastName: true
      }
    })

    if (!employee) {
      throw new Error(`Employee not found: ${employeeId}`)
    }

    // Only process for USA location employees
    const usaLocations = ['usa', 'united states', 'new york', 'san francisco', 'chicago', 'boston', 'seattle', 'los angeles']
    if (!usaLocations.includes(employee.location.toLowerCase())) {
      throw new Error(`Employee ${employeeId} is not in USA location`)
    }

    // Skip if employee is inactive
    if (employee.status !== 'ACTIVE') {
      throw new Error(`Employee ${employeeId} is not active`)
    }

    // Get PTO allocation rule for this role
    const ptoRule = this.getPtoRuleForRole(employee.role)

    // Calculate pro-rated allocation if joining mid-year
    const proRatedAllocation = this.calculateProRatedPto(
      employee.joiningDate,
      ptoRule.annualPtoDays,
      year
    )

    const isProRated = proRatedAllocation !== ptoRule.annualPtoDays

    // Check if allocation already exists for this year
    const existingBalance = await prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveType_year: {
          employeeId,
          leaveType: 'PTO',
          year
        }
      }
    })

    if (existingBalance) {
      return {
        employeeId,
        role: employee.role,
        year,
        annualAllocation: ptoRule.annualPtoDays,
        proRatedAllocation: existingBalance.totalEntitlement,
        joiningDate: employee.joiningDate,
        isProRated,
        carryForwardLimit: ptoRule.maxCarryForward,
        reason: 'Already allocated'
      }
    }

    // Create or update PTO balance
    await this.updatePtoBalance(employeeId, year, proRatedAllocation, ptoRule.maxCarryForward)

    return {
      employeeId,
      role: employee.role,
      year,
      annualAllocation: ptoRule.annualPtoDays,
      proRatedAllocation,
      joiningDate: employee.joiningDate,
      isProRated,
      carryForwardLimit: ptoRule.maxCarryForward,
      reason: isProRated
        ? `Pro-rated: ${proRatedAllocation} days (joined ${employee.joiningDate.toISOString().split('T')[0]})`
        : `Full allocation: ${proRatedAllocation} days`
    }
  }

  // Update PTO balance in database
  private async updatePtoBalance(employeeId: string, year: number, ptoDays: number, carryForwardLimit: number): Promise<void> {
    await prisma.leaveBalance.upsert({
      where: {
        employeeId_leaveType_year: {
          employeeId,
          leaveType: 'PTO',
          year
        }
      },
      update: {
        totalEntitlement: ptoDays,
        available: ptoDays
      },
      create: {
        employeeId,
        leaveType: 'PTO',
        year,
        totalEntitlement: ptoDays,
        used: 0,
        available: ptoDays,
        carryForward: 0
      }
    })
  }

  // Process PTO allocation for all USA employees
  async processAnnualPtoAllocationBatch(year: number): Promise<PtoAllocationResult[]> {
    // Get all active USA employees
    const usaEmployees = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        location: { in: ['USA', 'United States', 'New York', 'San Francisco', 'Chicago', 'Boston', 'Seattle', 'Los Angeles'] }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeId: true,
        role: true,
        location: true,
        joiningDate: true
      }
    })

    console.log(`Processing annual PTO allocation for ${usaEmployees.length} USA employees for ${year}`)

    const results: PtoAllocationResult[] = []

    for (const employee of usaEmployees) {
      try {
        const result = await this.processEmployeePtoAllocation(employee.id, year)
        results.push(result)
        console.log(`✅ Processed ${employee.firstName} ${employee.lastName} (${result.role}): ${result.proRatedAllocation} PTO days`)
      } catch (error) {
        console.error(`❌ Failed to process ${employee.firstName} ${employee.lastName}: ${error instanceof Error ? error.message : error}`)
        const rule = this.getPtoRuleForRole(employee.role)
        results.push({
          employeeId: employee.id,
          role: employee.role,
          year,
          annualAllocation: rule.annualPtoDays,
          proRatedAllocation: 0,
          joiningDate: employee.joiningDate,
          isProRated: false,
          carryForwardLimit: rule.maxCarryForward,
          reason: `Error: ${error instanceof Error ? error.message : error}`
        })
      }
    }

    return results
  }

  // Apply year-end carry-forward rules for USA (AVP max 5 days, VP+ no carry-forward)
  async applyYearEndCarryForwardRules(year: number): Promise<void> {
    console.log(`Applying USA year-end carry-forward rules for ${year}`)

    // Get all USA employees' PTO balances
    const usaEmployees = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        location: { in: ['USA', 'United States', 'New York', 'San Francisco', 'Chicago', 'Boston', 'Seattle', 'Los Angeles'] }
      },
      include: {
        leaveBalances: {
          where: {
            year,
            leaveType: 'PTO'
          }
        }
      }
    })

    for (const employee of usaEmployees) {
      const ptoBalance = employee.leaveBalances.find(b => b.leaveType === 'PTO')

      if (!ptoBalance || ptoBalance.available <= 0) {
        continue
      }

      const ptoRule = this.getPtoRuleForRole(employee.role)
      const maxCarryForward = ptoRule.maxCarryForward
      const carryForwardAmount = Math.min(ptoBalance.available, maxCarryForward)

      if (carryForwardAmount > 0) {
        console.log(`Carrying forward ${carryForwardAmount} PTO days for ${employee.firstName} ${employee.lastName} (${employee.role})`)

        // Create or update next year's PTO balance
        await prisma.leaveBalance.upsert({
          where: {
            employeeId_leaveType_year: {
              employeeId: employee.id,
              leaveType: 'PTO',
              year: year + 1
            }
          },
          update: {
            carryForward: carryForwardAmount,
            totalEntitlement: { increment: carryForwardAmount },
            available: { increment: carryForwardAmount }
          },
          create: {
            employeeId: employee.id,
            leaveType: 'PTO',
            year: year + 1,
            totalEntitlement: carryForwardAmount,
            used: 0,
            available: carryForwardAmount,
            carryForward: carryForwardAmount
          }
        })
      } else if (ptoRule.maxCarryForward === 0) {
        console.log(`No carry-forward allowed for ${employee.firstName} ${employee.lastName} (${employee.role}) - ${ptoBalance.available} days forfeited`)
      }
    }
  }

  // Get role-based PTO rules summary
  getPtoRulesSummary(): PtoAllocationRule[] {
    return this.ptoRules
  }

  // Get PTO allocation history for an employee
  async getEmployeePtoHistory(employeeId: string, year?: number): Promise<any[]> {
    const balances = await prisma.leaveBalance.findMany({
      where: {
        employeeId,
        leaveType: 'PTO',
        ...(year && { year })
      },
      orderBy: [
        { year: 'desc' }
      ]
    })

    return balances
  }

  // Annual PTO allocation processor (to be scheduled)
  async processAnnualPtoAllocation(year?: number): Promise<void> {
    const targetYear = year || new Date().getFullYear()

    console.log(`🕐 Processing annual PTO allocation for USA employees for ${targetYear}`)

    try {
      const results = await this.processAnnualPtoAllocationBatch(targetYear)
      const successCount = results.filter(r => !r.reason.includes('Error')).length

      console.log(`✅ Annual PTO allocation completed: ${successCount}/${results.length} employees processed successfully`)
    } catch (error) {
      console.error(`❌ Annual PTO allocation failed: ${error}`)
      throw error
    }
  }
}

export const usaPtoService = new UsaPtoService()