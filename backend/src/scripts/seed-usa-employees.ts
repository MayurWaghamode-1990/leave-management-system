import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function seedUsaEmployees() {
  console.log('🇺🇸 Creating USA employees for PTO testing...')

  const usaEmployees = [
    {
      id: 'usa-avp-001',
      employeeId: 'USA001',
      email: 'avp.finance@company.com',
      password: await bcrypt.hash('usa123', 10),
      firstName: 'Robert',
      lastName: 'Johnson',
      role: 'AVP',
      department: 'Finance',
      reportingManagerId: 'admin-001',
      joiningDate: new Date('2021-03-15'), // Joined mid-month
      location: 'New York'
    },
    {
      id: 'usa-vp-001',
      employeeId: 'USA002',
      email: 'vp.sales@company.com',
      password: await bcrypt.hash('usa123', 10),
      firstName: 'Jennifer',
      lastName: 'Davis',
      role: 'VP',
      department: 'Sales',
      reportingManagerId: 'admin-001',
      joiningDate: new Date('2020-01-01'), // Joined beginning of year
      location: 'San Francisco'
    },
    {
      id: 'usa-svp-001',
      employeeId: 'USA003',
      email: 'svp.operations@company.com',
      password: await bcrypt.hash('usa123', 10),
      firstName: 'Michael',
      lastName: 'Brown',
      role: 'SVP',
      department: 'Operations',
      reportingManagerId: 'admin-001',
      joiningDate: new Date('2019-07-01'), // Joined mid-year
      location: 'Chicago'
    },
    {
      id: 'usa-evp-001',
      employeeId: 'USA004',
      email: 'evp.strategy@company.com',
      password: await bcrypt.hash('usa123', 10),
      firstName: 'Sarah',
      lastName: 'Wilson',
      role: 'EVP',
      department: 'Strategy',
      reportingManagerId: 'admin-001',
      joiningDate: new Date('2018-12-01'),
      location: 'Boston'
    },
    {
      id: 'usa-mgr-001',
      employeeId: 'USA005',
      email: 'manager.tech@company.com',
      password: await bcrypt.hash('usa123', 10),
      firstName: 'David',
      lastName: 'Martinez',
      role: 'MANAGER',
      department: 'Technology',
      reportingManagerId: 'usa-vp-001',
      joiningDate: new Date('2022-06-20'), // Joined late in month
      location: 'Seattle'
    },
    {
      id: 'usa-emp-001',
      employeeId: 'USA006',
      email: 'employee.marketing@company.com',
      password: await bcrypt.hash('usa123', 10),
      firstName: 'Lisa',
      lastName: 'Anderson',
      role: 'EMPLOYEE',
      department: 'Marketing',
      reportingManagerId: 'usa-mgr-001',
      joiningDate: new Date('2023-09-01'), // Recent joiner
      location: 'Los Angeles'
    }
  ]

  for (const employee of usaEmployees) {
    await prisma.user.upsert({
      where: { email: employee.email },
      update: employee,
      create: employee
    })
    console.log(`✅ Created/Updated USA employee: ${employee.firstName} ${employee.lastName} (${employee.role}) - ${employee.location}`)
  }

  console.log(`\n🎉 Successfully seeded ${usaEmployees.length} USA employees`)
  console.log('\n📋 USA Employee Summary:')
  console.log('AVP (Robert Johnson): 15 PTO days, max 5 carry-forward')
  console.log('VP (Jennifer Davis): 20 PTO days, no carry-forward')
  console.log('SVP (Michael Brown): 20 PTO days, no carry-forward')
  console.log('EVP (Sarah Wilson): 20 PTO days, no carry-forward')
  console.log('Manager (David Martinez): 15 PTO days, max 5 carry-forward')
  console.log('Employee (Lisa Anderson): 12 PTO days, max 3 carry-forward')
}

async function main() {
  try {
    await seedUsaEmployees()
  } catch (error) {
    console.error('❌ Error seeding USA employees:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed
if (require.main === module) {
  main()
}

export { seedUsaEmployees }