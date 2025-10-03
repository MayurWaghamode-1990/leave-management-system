import { PrismaClient } from '@prisma/client'
import { LeaveType } from '../../shared/src/types'

const prisma = new PrismaClient()

interface JoiningDateRule {
  dayOfMonth: number
  casualLeaveCredit: number
  privilegeLeaveCredit: number
}

interface AccrualResult {
  employeeId: string
  year: number
  month: number
  casualLeave: number
  privilegeLeave: number
  proRated: boolean
  reason: string
}

export class IndiaAccrualService {
  // GLF Rule: Joining 1st-15th = full credit, 16th+ = 0.5 credit
  private calculateJoiningDateCredit(joiningDate: Date, targetMonth: number, targetYear: number): JoiningDateRule {
    const joiningMonth = joiningDate.getMonth() + 1 // 1-12
    const joiningYear = joiningDate.getFullYear()
    const joiningDay = joiningDate.getDate()

    // If joining is not in the target month/year, give full credit
    if (joiningYear !== targetYear || joiningMonth !== targetMonth) {
      return {
        dayOfMonth: 1,
        casualLeaveCredit: 1.0,
        privilegeLeaveCredit: 1.0
      }
    }

    // GLF Rule: 1st-15th = full credit (1 CL + 1 PL), 16th+ = half credit (0.5 CL + 0.5 PL)
    if (joiningDay <= 15) {
      return {
        dayOfMonth: joiningDay,
        casualLeaveCredit: 1.0,
        privilegeLeaveCredit: 1.0
      }
    } else {
      return {
        dayOfMonth: joiningDay,
        casualLeaveCredit: 0.5,
        privilegeLeaveCredit: 0.5
      }
    }
  }

  // Process monthly accrual for a specific employee
  async processEmployeeMonthlyAccrual(employeeId: string, year: number, month: number): Promise<AccrualResult> {
    // Get employee details
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        location: true,
        joiningDate: true,
        status: true
      }
    })

    if (!employee) {
      throw new Error(`Employee not found: ${employeeId}`)
    }

    // Only process for India location employees
    const indiaLocations = ['mumbai', 'bangalore', 'delhi', 'chennai', 'hyderabad', 'pune', 'india']
    if (!indiaLocations.includes(employee.location.toLowerCase())) {
      throw new Error(`Employee ${employeeId} is not in India location`)
    }

    // Skip if employee is inactive
    if (employee.status !== 'ACTIVE') {
      throw new Error(`Employee ${employeeId} is not active`)
    }

    // Calculate credit based on joining date
    const joiningDateRule = this.calculateJoiningDateCredit(employee.joiningDate, month, year)
    const isProRated = joiningDateRule.dayOfMonth > 1

    // Check if accrual already processed for this month
    const existingAccrual = await prisma.monthlyAccrual?.findUnique({
      where: {
        employeeId_year_month: {
          employeeId,
          year,
          month
        }
      }
    }).catch(() => null) // Handle if table doesn't exist yet

    if (existingAccrual) {
      return {
        employeeId,
        year,
        month,
        casualLeave: existingAccrual.casualLeave,
        privilegeLeave: existingAccrual.privilegeLeave,
        proRated: existingAccrual.proRated,
        reason: 'Already processed'
      }
    }

    // Create accrual record (if table exists)
    try {
      await prisma.monthlyAccrual?.create({
        data: {
          employeeId,
          year,
          month,
          casualLeave: joiningDateRule.casualLeaveCredit,
          privilegeLeave: joiningDateRule.privilegeLeaveCredit,
          proRated: isProRated,
          joiningDate: employee.joiningDate,
          status: 'PROCESSED'
        }
      })
    } catch (error) {
      console.log('MonthlyAccrual table not available yet, skipping record creation')
    }

    // Update leave balances
    await this.updateLeaveBalance(employeeId, year, 'CASUAL_LEAVE', joiningDateRule.casualLeaveCredit)
    await this.updateLeaveBalance(employeeId, year, 'EARNED_LEAVE', joiningDateRule.privilegeLeaveCredit)

    return {
      employeeId,
      year,
      month,
      casualLeave: joiningDateRule.casualLeaveCredit,
      privilegeLeave: joiningDateRule.privilegeLeaveCredit,
      proRated: isProRated,
      reason: isProRated ? `Pro-rated: joined on ${joiningDateRule.dayOfMonth}` : 'Full month credit'
    }
  }

  // Update leave balance with monthly accrual
  private async updateLeaveBalance(employeeId: string, year: number, leaveType: string, creditAmount: number): Promise<void> {
    const existingBalance = await prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveType_year: {
          employeeId,
          leaveType,
          year
        }
      }
    })

    if (existingBalance) {
      // Update existing balance
      await prisma.leaveBalance.update({
        where: {
          employeeId_leaveType_year: {
            employeeId,
            leaveType,
            year
          }
        },
        data: {
          totalEntitlement: existingBalance.totalEntitlement + creditAmount,
          available: existingBalance.available + creditAmount
        }
      })
    } else {
      // Create new balance
      await prisma.leaveBalance.create({
        data: {
          employeeId,
          leaveType,
          year,
          totalEntitlement: creditAmount,
          used: 0,
          available: creditAmount,
          carryForward: 0
        }
      })
    }
  }

  // Process monthly accrual for all India employees
  async processMonthlyAccrualBatch(year: number, month: number): Promise<AccrualResult[]> {
    // Get all active India employees
    const indiaEmployees = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        location: { in: ['Mumbai', 'Bangalore', 'Delhi', 'Chennai', 'Hyderabad', 'Pune', 'India'] }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeId: true,
        location: true,
        joiningDate: true
      }
    })

    console.log(`Processing monthly accrual for ${indiaEmployees.length} India employees for ${month}/${year}`)

    const results: AccrualResult[] = []

    for (const employee of indiaEmployees) {
      try {
        const result = await this.processEmployeeMonthlyAccrual(employee.id, year, month)
        results.push(result)
        console.log(`✅ Processed ${employee.firstName} ${employee.lastName}: CL=${result.casualLeave}, PL=${result.privilegeLeave}`)
      } catch (error) {
        console.error(`❌ Failed to process ${employee.firstName} ${employee.lastName}: ${error instanceof Error ? error.message : error}`)
        results.push({
          employeeId: employee.id,
          year,
          month,
          casualLeave: 0,
          privilegeLeave: 0,
          proRated: false,
          reason: `Error: ${error instanceof Error ? error.message : error}`
        })
      }
    }

    return results
  }

  // Apply carry-forward rules for India (CL expires Dec 31, PL max 30 days carry forward)
  async applyYearEndCarryForwardRules(year: number): Promise<void> {
    console.log(`Applying year-end carry-forward rules for ${year}`)

    // Get all India employees' leave balances
    const indiaEmployees = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        location: { in: ['Mumbai', 'Bangalore', 'Delhi', 'Chennai', 'Hyderabad', 'Pune', 'India'] }
      },
      include: {
        leaveBalances: {
          where: {
            year,
            leaveType: { in: ['CASUAL_LEAVE', 'EARNED_LEAVE'] }
          }
        }
      }
    })

    for (const employee of indiaEmployees) {
      for (const balance of employee.leaveBalances) {
        if (balance.leaveType === 'CASUAL_LEAVE') {
          // GLF Rule: Casual Leave expires on Dec 31 - no carry forward
          if (balance.available > 0) {
            console.log(`Expiring ${balance.available} CL for ${employee.firstName} ${employee.lastName}`)
            await prisma.leaveBalance.update({
              where: { id: balance.id },
              data: {
                available: 0, // Reset to 0 for next year
                carryForward: 0
              }
            })
          }
        } else if (balance.leaveType === 'EARNED_LEAVE') {
          // GLF Rule: Privilege Leave (Earned Leave) max 30 days carry forward
          const carryForwardAmount = Math.min(balance.available, 30)

          if (carryForwardAmount > 0) {
            console.log(`Carrying forward ${carryForwardAmount} PL for ${employee.firstName} ${employee.lastName}`)

            // Create or update next year's balance
            await prisma.leaveBalance.upsert({
              where: {
                employeeId_leaveType_year: {
                  employeeId: employee.id,
                  leaveType: 'EARNED_LEAVE',
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
                leaveType: 'EARNED_LEAVE',
                year: year + 1,
                totalEntitlement: carryForwardAmount,
                used: 0,
                available: carryForwardAmount,
                carryForward: carryForwardAmount
              }
            })
          }
        }
      }
    }
  }

  // Schedule next month's accrual processing (to be called by cron job)
  async scheduleMonthlyAccrual(): Promise<void> {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

    console.log(`🕐 Scheduled monthly accrual processing for ${month}/${year}`)

    try {
      const results = await this.processMonthlyAccrualBatch(year, month)
      const successCount = results.filter(r => !r.reason.includes('Error')).length

      console.log(`✅ Monthly accrual completed: ${successCount}/${results.length} employees processed successfully`)
    } catch (error) {
      console.error(`❌ Monthly accrual failed: ${error}`)
      throw error
    }
  }

  // Get accrual history for an employee
  async getEmployeeAccrualHistory(employeeId: string, year?: number): Promise<any[]> {
    try {
      const accruals = await prisma.monthlyAccrual?.findMany({
        where: {
          employeeId,
          ...(year && { year })
        },
        orderBy: [
          { year: 'desc' },
          { month: 'desc' }
        ]
      })

      return accruals || []
    } catch (error) {
      console.log('MonthlyAccrual table not available yet')
      return []
    }
  }
}

export const indiaAccrualService = new IndiaAccrualService()