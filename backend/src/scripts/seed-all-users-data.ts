import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Define leave types and statuses
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

// Helper functions
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

async function seedAllUsersData() {
  console.log('👥 Seeding comprehensive data for ALL users...\n')

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

  console.log(`📝 Processing ${employees.length} employees and ${managers.length} managers\n`)

  const today = new Date()
  const currentYear = today.getFullYear()
  const previousYear = currentYear - 1

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
      'Personal commitments',
      'Family event',
      'Religious ceremony'
    ],
    [LeaveType.SICK_LEAVE]: [
      'Medical checkup',
      'Fever and cold',
      'Doctor appointment',
      'Health issues',
      'Medical procedure',
      'Recovery',
      'Dental appointment',
      'Medical emergency'
    ],
    [LeaveType.EARNED_LEAVE]: [
      'Vacation with family',
      'Travel abroad',
      'Long weekend trip',
      'Holiday planning',
      'Extended vacation',
      'Personal time off',
      'Visit hometown',
      'Leisure travel'
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

  // 1. Ensure ALL users have leave balances for current and previous year
  console.log('💰 Creating leave balances for all users...\n')

  let balanceCount = 0
  for (const user of users) {
    for (const year of [previousYear, currentYear]) {
      for (const leaveType of leaveTypes) {
        const entitlement = leaveType === LeaveType.CASUAL_LEAVE ? 12 :
                           leaveType === LeaveType.SICK_LEAVE ? 15 :
                           leaveType === LeaveType.EARNED_LEAVE ? 21 : 10

        await prisma.leaveBalance.upsert({
          where: {
            employeeId_leaveType_year: {
              employeeId: user.id,
              leaveType: leaveType,
              year: year
            }
          },
          update: {
            totalEntitlement: entitlement,
          },
          create: {
            employeeId: user.id,
            leaveType: leaveType,
            year: year,
            totalEntitlement: entitlement,
            available: entitlement,
            used: 0,
            carryForward: 0
          }
        })
        balanceCount++
      }
    }
    console.log(`✅ Created balances for ${user.firstName} ${user.lastName} (${user.employeeId})`)
  }
  console.log(`\n📊 Total leave balances created: ${balanceCount}\n`)

  // 2. Create leave requests for EVERY employee
  console.log('📅 Creating leave requests for all employees...\n')

  let totalRequests = 0
  let approvedCount = 0
  let pendingCount = 0
  let rejectedCount = 0

  // Create leave requests for each employee
  for (const employee of employees) {
    const manager = employee.reportingManagerId
      ? users.find(u => u.id === employee.reportingManagerId) || getRandomElement(managers)
      : getRandomElement(managers)

    // Create 3-6 historical leaves per employee (last 6 months)
    const historicalLeaves = getRandomInt(3, 6)

    for (let i = 0; i < historicalLeaves; i++) {
      const monthOffset = getRandomInt(1, 6)
      const monthDate = subtractMonths(today, monthOffset)
      const dayInMonth = getRandomInt(1, 25)
      const startDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), dayInMonth)
      const duration = getRandomInt(1, 5)
      const leaveType = getRandomElement(leaveTypes)

      // 75% approved, 15% pending, 10% rejected
      const statusRoll = Math.random()
      let status: string
      let approvalStatus: string
      let comments: string | null
      let approvedAt: Date | null

      if (statusRoll < 0.75) {
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
            endDate: addDays(startDate, duration - 1),
            totalDays: duration,
            reason: getRandomElement(reasons[leaveType]),
            status: status,
            isHalfDay: Math.random() < 0.1, // 10% half day
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
          await prisma.leaveBalance.updateMany({
            where: {
              employeeId: employee.id,
              leaveType: leaveType,
              year: startDate.getFullYear()
            },
            data: {
              used: { increment: duration },
              available: { decrement: duration }
            }
          })
        }

        totalRequests++
      } catch (error) {
        console.error(`Failed to create leave for ${employee.firstName}:`, error)
      }
    }

    // Create 1-2 upcoming leaves per employee
    const upcomingLeaves = getRandomInt(1, 2)

    for (let i = 0; i < upcomingLeaves; i++) {
      const daysAhead = getRandomInt(7, 45)
      const startDate = addDays(today, daysAhead)
      const duration = getRandomInt(2, 5)
      const leaveType = getRandomElement(leaveTypes)

      // 40% approved, 60% pending for future leaves
      const isApproved = Math.random() < 0.4

      try {
        await prisma.leaveRequest.create({
          data: {
            employeeId: employee.id,
            leaveType: leaveType,
            startDate: startDate,
            endDate: addDays(startDate, duration - 1),
            totalDays: duration,
            reason: getRandomElement(reasons[leaveType]),
            status: isApproved ? LeaveStatus.APPROVED : LeaveStatus.PENDING,
            isHalfDay: false,
            approvals: {
              create: {
                level: 1,
                approverId: manager.id,
                status: isApproved ? LeaveStatus.APPROVED : LeaveStatus.PENDING,
                comments: isApproved ? 'Approved' : null,
                approvedAt: isApproved ? new Date() : null
              }
            }
          }
        })

        if (isApproved) {
          approvedCount++
          await prisma.leaveBalance.updateMany({
            where: {
              employeeId: employee.id,
              leaveType: leaveType,
              year: currentYear
            },
            data: {
              used: { increment: duration },
              available: { decrement: duration }
            }
          })
        } else {
          pendingCount++
        }

        totalRequests++
      } catch (error) {
        console.error(`Failed to create upcoming leave for ${employee.firstName}:`, error)
      }
    }

    console.log(`✅ Created ${historicalLeaves + upcomingLeaves} leaves for ${employee.firstName} ${employee.lastName}`)
  }

  console.log('\n📊 Leave Requests Summary:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`Total Leave Requests Created: ${totalRequests}`)
  console.log(`  ✅ Approved: ${approvedCount} (${((approvedCount/totalRequests)*100).toFixed(1)}%)`)
  console.log(`  ⏳ Pending: ${pendingCount} (${((pendingCount/totalRequests)*100).toFixed(1)}%)`)
  console.log(`  ❌ Rejected: ${rejectedCount} (${((rejectedCount/totalRequests)*100).toFixed(1)}%)`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // 3. Create comp-off balances for employees who worked overtime
  console.log('💼 Creating comp-off balances...\n')

  let compOffCount = 0
  for (const employee of employees) {
    // 60% of employees have earned comp-offs
    if (Math.random() < 0.6) {
      const compOffsEarned = getRandomInt(1, 3)

      await prisma.compOffBalance.upsert({
        where: {
          employeeId_year: {
            employeeId: employee.id,
            year: currentYear
          }
        },
        update: {
          totalEarned: compOffsEarned,
          available: compOffsEarned,
          totalUsed: 0,
          expired: 0
        },
        create: {
          employeeId: employee.id,
          year: currentYear,
          totalEarned: compOffsEarned,
          available: compOffsEarned,
          totalUsed: 0,
          expired: 0
        }
      })
      compOffCount++
    }
  }
  console.log(`✅ Created comp-off balances for ${compOffCount} employees\n`)

  // 4. Update user profiles with additional information
  console.log('👤 Updating user profile information...\n')

  const genders = ['MALE', 'FEMALE', 'OTHER']
  const maritalStatuses = ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']
  const countries = ['INDIA', 'USA']
  const designations = ['ENGINEER', 'SENIOR_ENGINEER', 'LEAD', 'MANAGER', 'SENIOR_MANAGER', 'AVP', 'VP', 'DIRECTOR']

  for (const user of users) {
    // Only update if fields are null
    await prisma.user.update({
      where: { id: user.id },
      data: {
        gender: user.gender || getRandomElement(genders),
        maritalStatus: user.maritalStatus || getRandomElement(maritalStatuses),
        country: user.country || getRandomElement(countries),
        designation: user.designation || getRandomElement(designations)
      }
    })
  }
  console.log(`✅ Updated profile information for all ${users.length} users\n`)

  // 5. Create notifications for pending approvals
  console.log('🔔 Creating notifications for pending approvals...\n')

  const pendingLeaves = await prisma.leaveRequest.findMany({
    where: { status: LeaveStatus.PENDING },
    include: { approvals: true }
  })

  let notificationCount = 0
  for (const leave of pendingLeaves) {
    const approval = leave.approvals[0]
    if (approval) {
      try {
        await prisma.notification.create({
          data: {
            userId: approval.approverId,
            type: 'LEAVE_REQUEST',
            title: 'Pending Leave Approval',
            message: `You have a pending leave request to review`,
            relatedId: leave.id,
            isRead: false
          }
        })
        notificationCount++
      } catch (error) {
        // Skip if notification already exists
      }
    }
  }
  console.log(`✅ Created ${notificationCount} notifications\n`)

  // Summary
  console.log('🎉 All Users Data Seeding Complete!\n')
  console.log('📊 Summary:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`👥 Total Users: ${users.length}`)
  console.log(`   - Employees: ${employees.length}`)
  console.log(`   - Managers: ${managers.length}`)
  console.log(`\n💰 Leave Balances: ${balanceCount}`)
  console.log(`📅 Leave Requests: ${totalRequests}`)
  console.log(`💼 Comp-Off Balances: ${compOffCount}`)
  console.log(`🔔 Notifications: ${notificationCount}`)
  console.log(`👤 User Profiles: ${users.length} updated`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log('✨ Every user now has:')
  console.log('   ✅ Leave balances for current and previous year')
  console.log('   ✅ Historical leave requests (3-6 leaves)')
  console.log('   ✅ Upcoming leave requests (1-2 leaves)')
  console.log('   ✅ Complete profile information')
  console.log('   ✅ Comp-off balances (60% of users)')
  console.log('   ✅ Notifications for pending approvals\n')
}

async function main() {
  try {
    await seedAllUsersData()
  } catch (error) {
    console.error('❌ Error seeding all users data:', error)
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
