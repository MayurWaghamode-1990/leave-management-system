import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Define leave types and statuses as strings
const LeaveType = {
  CASUAL_LEAVE: 'CASUAL_LEAVE',
  SICK_LEAVE: 'SICK_LEAVE',
  EARNED_LEAVE: 'EARNED_LEAVE',
  COMPENSATORY_OFF: 'COMPENSATORY_OFF'
} as const

const LeaveStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
} as const

// Helper functions for date manipulation
function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function subtractDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() - days)
  return result
}

function subtractMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() - months)
  return result
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

async function seedAnalyticsData() {
  console.log('📊 Seeding comprehensive analytics data...\n')

  // Get all users
  const users = await prisma.user.findMany()
  console.log(`Found ${users.length} users\n`)

  if (users.length === 0) {
    console.log('❌ No users found. Please run the main seed script first.')
    return
  }

  const employees = users.filter(u => u.role === 'EMPLOYEE' || u.role === 'MANAGER')
  const managers = users.filter(u => u.role === 'MANAGER' || u.role === 'HR_ADMIN' || u.role === 'ADMIN')

  if (employees.length === 0 || managers.length === 0) {
    console.log('❌ Not enough users with appropriate roles.')
    return
  }

  console.log(`📝 Employees: ${employees.length}, Managers: ${managers.length}\n`)

  // Delete existing leave requests to start fresh
  console.log('🗑️  Cleaning existing leave requests...')
  await prisma.approval.deleteMany({})
  await prisma.leaveRequest.deleteMany({})
  console.log('✅ Cleaned existing data\n')

  const today = new Date()
  const leaveTypes = [
    LeaveType.CASUAL_LEAVE,
    LeaveType.SICK_LEAVE,
    LeaveType.EARNED_LEAVE,
    LeaveType.COMPENSATORY_OFF
  ]

  const reasons = {
    [LeaveType.CASUAL_LEAVE]: [
      'Personal work',
      'Family function',
      'Wedding ceremony',
      'Home renovation',
      'Travel plans',
      'Personal commitments'
    ],
    [LeaveType.SICK_LEAVE]: [
      'Medical checkup',
      'Fever and cold',
      'Doctor appointment',
      'Health issues',
      'Medical procedure',
      'Recovery'
    ],
    [LeaveType.EARNED_LEAVE]: [
      'Vacation with family',
      'Travel abroad',
      'Long weekend trip',
      'Holiday planning',
      'Extended vacation',
      'Personal time off'
    ],
    [LeaveType.COMPENSATORY_OFF]: [
      'Worked on weekend',
      'Extra hours worked',
      'Holiday work compensation',
      'Overtime compensation',
      'Project deadline work',
      'Emergency work done'
    ]
  }

  let createdCount = 0
  let approvedCount = 0
  let rejectedCount = 0
  let pendingCount = 0

  // Generate leave requests for the past 12 months
  console.log('📅 Generating leave requests for the past 12 months...\n')

  for (let monthOffset = 11; monthOffset >= 0; monthOffset--) {
    const monthDate = subtractMonths(today, monthOffset)
    const monthName = monthDate.toLocaleString('default', { month: 'short' })
    const year = monthDate.getFullYear()

    console.log(`Creating leaves for ${monthName} ${year}...`)

    // Each employee gets 1-4 leave requests per month
    for (const employee of employees) {
      const numRequests = getRandomInt(1, 4)

      for (let i = 0; i < numRequests; i++) {
        const leaveType = getRandomElement(leaveTypes)
        const manager = getRandomElement(managers)

        // Random start date within the month
        const dayInMonth = getRandomInt(1, 25)
        const startDate = new Date(year, monthDate.getMonth(), dayInMonth)

        // Random duration (1-7 days)
        const duration = getRandomInt(1, 7)
        const endDate = addDays(startDate, duration - 1)

        // Random status with realistic distribution
        // 70% approved, 20% pending, 10% rejected
        const statusRoll = Math.random()
        let status: string
        let approvalStatus: string
        let comments: string | null
        let approvedAt: Date | null

        if (statusRoll < 0.7) {
          status = LeaveStatus.APPROVED
          approvalStatus = LeaveStatus.APPROVED
          comments = getRandomElement([
            'Approved',
            'Approved - Enjoy!',
            'All set',
            'Approved. Have a good time!',
            'Approved for the requested dates'
          ])
          approvedAt = addDays(startDate, -getRandomInt(1, 5))
          approvedCount++
        } else if (statusRoll < 0.9) {
          status = LeaveStatus.PENDING
          approvalStatus = LeaveStatus.PENDING
          comments = null
          approvedAt = null
          pendingCount++
        } else {
          status = LeaveStatus.REJECTED
          approvalStatus = LeaveStatus.REJECTED
          comments = getRandomElement([
            'Team is short-staffed during this period',
            'Critical project deadline',
            'Please reschedule',
            'Cannot approve due to team availability',
            'Peak period - unable to approve'
          ])
          approvedAt = addDays(startDate, -getRandomInt(1, 3))
          rejectedCount++
        }

        try {
          await prisma.leaveRequest.create({
            data: {
              employeeId: employee.id,
              leaveType: leaveType,
              startDate: startDate,
              endDate: endDate,
              totalDays: duration,
              reason: getRandomElement(reasons[leaveType]),
              status: status,
              isHalfDay: Math.random() < 0.15, // 15% half day
              approvals: {
                create: {
                  level: 1,
                  approverId: manager.id,
                  status: approvalStatus,
                  comments: comments,
                  approvedAt: approvedAt
                }
              }
            }
          })

          // Update leave balance for approved leaves
          if (status === LeaveStatus.APPROVED) {
            const balance = await prisma.leaveBalance.findUnique({
              where: {
                employeeId_leaveType_year: {
                  employeeId: employee.id,
                  leaveType: leaveType,
                  year: year
                }
              }
            })

            if (balance) {
              await prisma.leaveBalance.update({
                where: {
                  employeeId_leaveType_year: {
                    employeeId: employee.id,
                    leaveType: leaveType,
                    year: year
                  }
                },
                data: {
                  used: { increment: duration },
                  available: { decrement: duration }
                }
              })
            }
          }

          createdCount++
        } catch (error) {
          console.error(`Failed to create leave for ${employee.firstName}:`, error)
        }
      }
    }

    console.log(`✅ Created leaves for ${monthName} ${year}`)
  }

  console.log('\n📊 Analytics Data Summary:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`Total Leave Requests Created: ${createdCount}`)
  console.log(`  ✅ Approved: ${approvedCount} (${((approvedCount/createdCount)*100).toFixed(1)}%)`)
  console.log(`  ⏳ Pending: ${pendingCount} (${((pendingCount/createdCount)*100).toFixed(1)}%)`)
  console.log(`  ❌ Rejected: ${rejectedCount} (${((rejectedCount/createdCount)*100).toFixed(1)}%)`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // Create additional data for better analytics

  // 1. Add some comp-off usage data
  console.log('💼 Creating compensatory off usage data...')
  const compOffCount = employees.length * 2 // 2 comp-offs per employee
  let compOffCreated = 0

  for (const employee of employees) {
    // Create 2 comp-off requests for each employee
    for (let i = 0; i < 2; i++) {
      const monthOffset = getRandomInt(0, 5)
      const monthDate = subtractMonths(today, monthOffset)
      const dayInMonth = getRandomInt(1, 25)
      const startDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), dayInMonth)

      try {
        await prisma.leaveRequest.create({
          data: {
            employeeId: employee.id,
            leaveType: LeaveType.COMPENSATORY_OFF,
            startDate: startDate,
            endDate: startDate,
            totalDays: 1,
            reason: getRandomElement(reasons[LeaveType.COMPENSATORY_OFF]),
            status: LeaveStatus.APPROVED,
            isHalfDay: false,
            approvals: {
              create: {
                level: 1,
                approverId: getRandomElement(managers).id,
                status: LeaveStatus.APPROVED,
                comments: 'Compensatory off approved',
                approvedAt: addDays(startDate, -1)
              }
            }
          }
        })
        compOffCreated++
      } catch (error) {
        // Skip if error
      }
    }
  }
  console.log(`✅ Created ${compOffCreated} comp-off requests\n`)

  // 2. Create some long leaves for better distribution
  console.log('🏖️  Creating extended vacation data...')
  const extendedLeaves = Math.min(10, employees.length)

  for (let i = 0; i < extendedLeaves; i++) {
    const employee = employees[i]
    const monthOffset = getRandomInt(1, 6)
    const monthDate = subtractMonths(today, monthOffset)
    const startDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), getRandomInt(5, 20))
    const duration = getRandomInt(7, 14) // 1-2 weeks

    try {
      await prisma.leaveRequest.create({
        data: {
          employeeId: employee.id,
          leaveType: LeaveType.EARNED_LEAVE,
          startDate: startDate,
          endDate: addDays(startDate, duration - 1),
          totalDays: duration,
          reason: 'Extended vacation with family',
          status: LeaveStatus.APPROVED,
          isHalfDay: false,
          approvals: {
            create: {
              level: 1,
              approverId: getRandomElement(managers).id,
              status: LeaveStatus.APPROVED,
              comments: 'Approved - Enjoy your vacation!',
              approvedAt: addDays(startDate, -10)
            }
          }
        }
      })
    } catch (error) {
      // Skip if error
    }
  }
  console.log(`✅ Created ${extendedLeaves} extended vacation requests\n`)

  // 3. Create some upcoming pending leaves
  console.log('⏳ Creating upcoming pending leaves...')
  const upcomingPendingCount = Math.min(15, employees.length)

  for (let i = 0; i < upcomingPendingCount; i++) {
    const employee = employees[i]
    const daysAhead = getRandomInt(5, 30)
    const startDate = addDays(today, daysAhead)
    const duration = getRandomInt(2, 5)

    try {
      await prisma.leaveRequest.create({
        data: {
          employeeId: employee.id,
          leaveType: getRandomElement(leaveTypes),
          startDate: startDate,
          endDate: addDays(startDate, duration - 1),
          totalDays: duration,
          reason: getRandomElement(reasons[getRandomElement(leaveTypes)]),
          status: LeaveStatus.PENDING,
          isHalfDay: false,
          approvals: {
            create: {
              level: 1,
              approverId: getRandomElement(managers).id,
              status: LeaveStatus.PENDING,
              comments: null,
              approvedAt: null
            }
          }
        }
      })
    } catch (error) {
      // Skip if error
    }
  }
  console.log(`✅ Created ${upcomingPendingCount} upcoming pending requests\n`)

  console.log('🎉 Analytics data seeding completed successfully!\n')
  console.log('📈 Your Analytics Dashboard should now display rich data including:')
  console.log('   - Monthly leave trends for the past 12 months')
  console.log('   - Leave type distribution across all requests')
  console.log('   - Department-wise analytics')
  console.log('   - Comp-off usage patterns')
  console.log('   - Team productivity impact data')
  console.log('   - Pending, approved, and rejected leave statistics\n')
}

async function main() {
  try {
    await seedAnalyticsData()
  } catch (error) {
    console.error('❌ Error seeding analytics data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
