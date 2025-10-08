import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function clearDatabase() {
  console.log('🧹 Clearing database...')

  // Delete in correct order to avoid foreign key constraints
  await prisma.approval.deleteMany()
  await prisma.leaveRequest.deleteMany()
  await prisma.leaveBalance.deleteMany()
  await prisma.leavePolicy.deleteMany()
  await prisma.holiday.deleteMany()
  await prisma.user.deleteMany()

  console.log('✅ Database cleared')
}

async function seedUsers() {
  console.log('👥 Creating users...')

  const users = [
    {
      id: 'admin-001',
      employeeId: 'EMP001',
      email: 'admin@company.com',
      password: await bcrypt.hash('admin123', 10),
      firstName: 'System',
      lastName: 'Administrator',
      role: 'ADMIN',
      department: 'IT',
      reportingManagerId: null,
      joiningDate: new Date('2020-01-01'),
      location: 'Mumbai'
    },
    {
      id: 'mgr-hr',
      employeeId: 'MGR001',
      email: 'hr.manager@company.com',
      password: await bcrypt.hash('manager123', 10),
      firstName: 'HR',
      lastName: 'Manager',
      role: 'MANAGER',
      department: 'Human Resources',
      reportingManagerId: 'admin-001',
      joiningDate: new Date('2021-01-15'),
      location: 'Mumbai'
    },
    {
      id: 'mgr-engineering',
      employeeId: 'MGR002',
      email: 'engineering.manager@company.com',
      password: await bcrypt.hash('manager123', 10),
      firstName: 'Rajesh',
      lastName: 'Kumar',
      role: 'MANAGER',
      department: 'Engineering',
      reportingManagerId: 'admin-001',
      joiningDate: new Date('2021-03-01'),
      location: 'Bangalore'
    },
    {
      id: 'emp-001',
      employeeId: 'EMP002',
      email: 'john.doe@company.com',
      password: await bcrypt.hash('employee123', 10),
      firstName: 'John',
      lastName: 'Doe',
      role: 'EMPLOYEE',
      department: 'Engineering',
      reportingManagerId: 'mgr-engineering',
      joiningDate: new Date('2022-06-01'),
      location: 'Bangalore'
    },
    {
      id: 'emp-002',
      employeeId: 'EMP003',
      email: 'jane.smith@company.com',
      password: await bcrypt.hash('employee123', 10),
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'EMPLOYEE',
      department: 'Engineering',
      reportingManagerId: 'mgr-engineering',
      joiningDate: new Date('2022-08-15'),
      location: 'Bangalore'
    },
    {
      id: 'emp-hr-001',
      employeeId: 'EMP004',
      email: 'sarah.wilson@company.com',
      password: await bcrypt.hash('employee123', 10),
      firstName: 'Sarah',
      lastName: 'Wilson',
      role: 'EMPLOYEE',
      department: 'Human Resources',
      reportingManagerId: 'mgr-hr',
      joiningDate: new Date('2023-01-10'),
      location: 'Mumbai'
    }
  ]

  for (const user of users) {
    // First try to find by employeeId, then by email
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { employeeId: user.employeeId },
          { email: user.email }
        ]
      }
    });

    if (existingUser) {
      // Update existing user
      await prisma.user.update({
        where: { id: existingUser.id },
        data: user
      });
      console.log(`✅ Updated user: ${user.firstName} ${user.lastName} (${user.email})`)
    } else {
      // Create new user
      await prisma.user.create({
        data: user
      });
      console.log(`✅ Created user: ${user.firstName} ${user.lastName} (${user.email})`)
    }
  }
}

async function seedPolicies() {
  console.log('📋 Creating leave policies...')

  const policies = [
    {
      id: 'policy-casual',
      name: 'Casual Leave Policy',
      leaveType: 'CASUAL_LEAVE',
      entitlementDays: 12,
      maxConsecutiveDays: 3,
      location: 'Mumbai',
      region: 'INDIA',
      effectiveFrom: new Date('2024-01-01'),
      isActive: true
    },
    {
      id: 'policy-sick',
      name: 'Sick Leave Policy',
      leaveType: 'SICK_LEAVE',
      entitlementDays: 15,
      maxConsecutiveDays: 7,
      location: 'Mumbai',
      region: 'INDIA',
      effectiveFrom: new Date('2024-01-01'),
      isActive: true
    },
    {
      id: 'policy-earned',
      name: 'Earned Leave Policy',
      leaveType: 'EARNED_LEAVE',
      entitlementDays: 21,
      maxConsecutiveDays: 15,
      maxCarryForward: 5,
      location: 'Mumbai',
      region: 'INDIA',
      effectiveFrom: new Date('2024-01-01'),
      isActive: true
    },
    {
      id: 'policy-comp-off',
      name: 'Compensatory Off Policy',
      leaveType: 'COMPENSATORY_OFF',
      entitlementDays: 10,
      maxConsecutiveDays: 2,
      location: 'Mumbai',
      region: 'INDIA',
      effectiveFrom: new Date('2024-01-01'),
      isActive: true
    }
  ]

  for (const policy of policies) {
    await prisma.leavePolicy.upsert({
      where: { id: policy.id },
      update: policy,
      create: policy
    })
    console.log(`✅ Created/Updated policy: ${policy.name}`)
  }
}

async function seedLeaveBalances() {
  console.log('💰 Creating leave balances...')

  const employees = await prisma.user.findMany({
    where: { role: { in: ['EMPLOYEE', 'MANAGER', 'ADMIN'] } }
  })

  const policies = await prisma.leavePolicy.findMany()

  for (const employee of employees) {
    for (const policy of policies) {
      const balance = {
        employeeId: employee.id,
        leaveType: policy.leaveType,
        year: 2024,
        totalEntitlement: policy.entitlementDays,
        used: 0,
        available: policy.entitlementDays,
        carryForward: 0
      }

      await prisma.leaveBalance.upsert({
        where: {
          employeeId_leaveType_year: {
            employeeId: employee.id,
            leaveType: policy.leaveType,
            year: 2024
          }
        },
        update: balance,
        create: balance
      })
      console.log(`✅ Created balance for ${employee.firstName} ${employee.lastName}: ${policy.leaveType} (${policy.entitlementDays} days)`)
    }
  }
}

async function seedHolidays() {
  console.log('🎉 Creating holidays...')

  const currentYear = new Date().getFullYear()
  const holidays = [
    {
      id: 'holiday-new-year',
      name: 'New Year Day',
      date: new Date(`${currentYear + 1}-01-01`),
      location: 'ALL',
      isOptional: false
    },
    {
      id: 'holiday-republic-day',
      name: 'Republic Day',
      date: new Date(`${currentYear + 1}-01-26`),
      location: 'ALL',
      isOptional: false
    },
    {
      id: 'holiday-independence',
      name: 'Independence Day',
      date: new Date(`${currentYear + 1}-08-15`),
      location: 'ALL',
      isOptional: false
    },
    {
      id: 'holiday-gandhi-jayanti',
      name: 'Gandhi Jayanti',
      date: new Date(`${currentYear + 1}-10-02`),
      location: 'ALL',
      isOptional: false
    },
    {
      id: 'holiday-diwali',
      name: 'Diwali',
      date: new Date(`${currentYear + 1}-11-12`),
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
    console.log(`✅ Created/Updated holiday: ${holiday.name}`)
  }
}

async function main() {
  try {
    console.log('🌱 Starting development database seed...\n')

    // Skip clearDatabase for now - just add data
    await seedUsers()
    await seedPolicies()
    await seedLeaveBalances()
    await seedHolidays()

    console.log('\n🎉 Development database seeded successfully!')
    console.log('\n📝 Test User Credentials:')
    console.log('Admin: admin@company.com / admin123')
    console.log('HR Manager: hr.manager@company.com / manager123')
    console.log('Engineering Manager: engineering.manager@company.com / manager123')
    console.log('Employee: john.doe@company.com / employee123')
    console.log('Employee: jane.smith@company.com / employee123')
    console.log('HR Employee: sarah.wilson@company.com / employee123')

  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})