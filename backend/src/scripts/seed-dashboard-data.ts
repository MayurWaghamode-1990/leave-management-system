import { PrismaClient, LeaveStatus, LeaveType } from '@prisma/client'

const prisma = new PrismaClient()

// Helper function to add days to a date
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

async function seedDashboardData() {
  console.log('🌱 Seeding comprehensive dashboard data...\n')

  // Get all users
  const users = await prisma.user.findMany()
  console.log(`Found ${users.length} users\n`)

  // 1. Verify and create leave balances for year 2025
  console.log('💰 Creating leave balances for 2025...')
  for (const user of users) {
    const leaveTypes = [
      LeaveType.CASUAL_LEAVE,
      LeaveType.SICK_LEAVE,
      LeaveType.EARNED_LEAVE,
      LeaveType.COMPENSATORY_OFF
    ]

    for (const leaveType of leaveTypes) {
      const entitlement = leaveType === LeaveType.CASUAL_LEAVE ? 12 :
                         leaveType === LeaveType.SICK_LEAVE ? 15 :
                         leaveType === LeaveType.EARNED_LEAVE ? 21 : 10

      await prisma.leaveBalance.upsert({
        where: {
          employeeId_leaveType_year: {
            employeeId: user.id,
            leaveType: leaveType,
            year: 2025
          }
        },
        update: {
          totalEntitlement: entitlement,
          available: entitlement,
          used: 0,
          carryForward: 0
        },
        create: {
          employeeId: user.id,
          leaveType: leaveType,
          year: 2025,
          totalEntitlement: entitlement,
          available: entitlement,
          used: 0,
          carryForward: 0
        }
      })
    }
    console.log(`✅ Created balances for ${user.firstName} ${user.lastName}`)
  }

  // 2. Create sample leave requests
  console.log('\n📝 Creating sample leave requests...')

  const employees = users.filter(u => u.role === 'EMPLOYEE')
  const managers = users.filter(u => u.role === 'MANAGER')

  if (employees.length > 0 && managers.length > 0) {
    const employee = employees[0]
    const manager = managers[0]

    const today = new Date()

    // Approved leave
    const approvedLeave = await prisma.leaveRequest.create({
      data: {
        employeeId: employee.id,
        leaveType: LeaveType.CASUAL_LEAVE,
        startDate: subtractDays(today, 10),
        endDate: subtractDays(today, 8),
        totalDays: 3,
        reason: 'Family function',
        status: LeaveStatus.APPROVED,
        isHalfDay: false,
        approvals: {
          create: {
            level: 1,
            approverId: manager.id,
            status: LeaveStatus.APPROVED,
            comments: 'Approved',
            respondedAt: subtractDays(today, 9)
          }
        }
      }
    })
    console.log(`✅ Created approved leave request for ${employee.firstName}`)

    // Pending leave
    const pendingLeave = await prisma.leaveRequest.create({
      data: {
        employeeId: employee.id,
        leaveType: LeaveType.SICK_LEAVE,
        startDate: addDays(today, 5),
        endDate: addDays(today, 7),
        totalDays: 3,
        reason: 'Medical appointment',
        status: LeaveStatus.PENDING,
        isHalfDay: false,
        approvals: {
          create: {
            level: 1,
            approverId: manager.id,
            status: LeaveStatus.PENDING,
            comments: null,
            respondedAt: null
          }
        }
      }
    })
    console.log(`✅ Created pending leave request for ${employee.firstName}`)

    // Rejected leave
    if (employees.length > 1) {
      const employee2 = employees[1]
      const rejectedLeave = await prisma.leaveRequest.create({
        data: {
          employeeId: employee2.id,
          leaveType: LeaveType.CASUAL_LEAVE,
          startDate: addDays(today, 2),
          endDate: addDays(today, 4),
          totalDays: 3,
          reason: 'Personal work',
          status: LeaveStatus.REJECTED,
          isHalfDay: false,
          approvals: {
            create: {
              level: 1,
              approverId: manager.id,
              status: LeaveStatus.REJECTED,
              comments: 'Team is short-staffed during this period',
              respondedAt: today
            }
          }
        }
      })
      console.log(`✅ Created rejected leave request for ${employee2.firstName}`)
    }

    // Create more approved leaves for the admin user
    const admin = users.find(u => u.role === 'ADMIN')
    if (admin && manager) {
      const adminApprovedLeave = await prisma.leaveRequest.create({
        data: {
          employeeId: admin.id,
          leaveType: LeaveType.EARNED_LEAVE,
          startDate: subtractDays(today, 20),
          endDate: subtractDays(today, 16),
          totalDays: 5,
          reason: 'Vacation',
          status: LeaveStatus.APPROVED,
          isHalfDay: false,
          approvals: {
            create: {
              level: 1,
              approverId: manager.id,
              status: LeaveStatus.APPROVED,
              comments: 'Approved - Enjoy your vacation!',
              respondedAt: subtractDays(today, 19)
            }
          }
        }
      })
      console.log(`✅ Created approved leave for admin user`)

      // Update leave balance to reflect used leave
      await prisma.leaveBalance.update({
        where: {
          employeeId_leaveType_year: {
            employeeId: admin.id,
            leaveType: LeaveType.EARNED_LEAVE,
            year: 2025
          }
        },
        data: {
          used: 5,
          available: 16
        }
      })
      console.log(`✅ Updated admin leave balance`)
    }
  }

  // 3. Create holidays for 2025
  console.log('\n🎉 Creating holidays for 2025...')
  const holidays = [
    {
      id: 'holiday-2025-new-year',
      name: 'New Year Day',
      date: new Date('2025-01-01'),
      location: 'ALL',
      isOptional: false
    },
    {
      id: 'holiday-2025-republic-day',
      name: 'Republic Day',
      date: new Date('2025-01-26'),
      location: 'ALL',
      isOptional: false
    },
    {
      id: 'holiday-2025-holi',
      name: 'Holi',
      date: new Date('2025-03-14'),
      location: 'ALL',
      isOptional: false
    },
    {
      id: 'holiday-2025-independence',
      name: 'Independence Day',
      date: new Date('2025-08-15'),
      location: 'ALL',
      isOptional: false
    },
    {
      id: 'holiday-2025-gandhi-jayanti',
      name: 'Gandhi Jayanti',
      date: new Date('2025-10-02'),
      location: 'ALL',
      isOptional: false
    },
    {
      id: 'holiday-2025-diwali',
      name: 'Diwali',
      date: new Date('2025-10-20'),
      location: 'ALL',
      isOptional: false
    },
    {
      id: 'holiday-2025-christmas',
      name: 'Christmas',
      date: new Date('2025-12-25'),
      location: 'ALL',
      isOptional: false
    }
  ]

  for (const holiday of holidays) {
    await prisma.holiday.upsert({
      where: { id: holiday.id },
      update: holiday,
      create: holiday
    })
  }
  console.log(`✅ Created ${holidays.length} holidays for 2025`)

  console.log('\n🎉 Dashboard data seeding completed successfully!\n')
}

async function main() {
  try {
    await seedDashboardData()
  } catch (error) {
    console.error('❌ Error seeding dashboard data:', error)
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
