import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function testCoreFunctionality() {
  console.log('\n🧪 TESTING CORE FUNCTIONALITY\n')
  console.log('═══════════════════════════════════════════════════\n')

  const results = {
    passed: [] as string[],
    failed: [] as string[],
    warnings: [] as string[]
  }

  // Test 1: Check if users exist
  console.log('1️⃣  Testing: User Authentication Data')
  console.log('─────────────────────────────────────────────────')
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        employeeId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        password: true
      }
    })

    console.log(`✅ Found ${users.length} users in database`)

    // Test admin user
    const adminUser = users.find(u => u.email === 'admin@company.com')
    if (adminUser) {
      console.log(`✅ Admin user found: ${adminUser.firstName} ${adminUser.lastName}`)
      console.log(`   Email: ${adminUser.email}`)
      console.log(`   Role: ${adminUser.role}`)
      console.log(`   Employee ID: ${adminUser.employeeId}`)

      // Test password
      const passwordMatch = await bcrypt.compare('admin123', adminUser.password)
      if (passwordMatch) {
        console.log(`✅ Admin password verified successfully`)
        results.passed.push('Admin authentication')
      } else {
        console.log(`❌ Admin password mismatch`)
        results.failed.push('Admin authentication - password mismatch')
      }
    } else {
      console.log(`❌ Admin user not found`)
      results.failed.push('Admin user missing')
    }

    // List all users
    console.log(`\n📋 All Users:`)
    users.forEach(u => {
      console.log(`   - ${u.email} | ${u.role} | ${u.firstName} ${u.lastName}`)
    })

    results.passed.push('User data retrieval')
  } catch (error) {
    console.error(`❌ Error: ${error}`)
    results.failed.push('User data retrieval')
  }

  // Test 2: Check leave balances
  console.log(`\n2️⃣  Testing: Leave Balances`)
  console.log('─────────────────────────────────────────────────')
  try {
    const balances = await prisma.leaveBalance.findMany({
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      take: 5
    })

    console.log(`✅ Found ${balances.length} leave balance records (showing first 5)`)
    balances.forEach(b => {
      console.log(`   - ${b.employee.firstName} ${b.employee.lastName}: ${b.leaveType} = ${b.available}/${b.totalEntitlement} days`)
    })

    const totalBalances = await prisma.leaveBalance.count()
    console.log(`\n📊 Total leave balances in system: ${totalBalances}`)
    results.passed.push('Leave balances')
  } catch (error) {
    console.error(`❌ Error: ${error}`)
    results.failed.push('Leave balances')
  }

  // Test 3: Check leave requests
  console.log(`\n3️⃣  Testing: Leave Requests`)
  console.log('─────────────────────────────────────────────────')
  try {
    const leaves = await prisma.leaveRequest.findMany({
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      take: 5,
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`✅ Found ${leaves.length} leave requests (showing first 5)`)
    leaves.forEach(l => {
      console.log(`   - ${l.employee.firstName} ${l.employee.lastName}: ${l.leaveType} | ${l.status} | ${l.totalDays} days`)
    })

    const totalLeaves = await prisma.leaveRequest.count()
    const statusCounts = await prisma.leaveRequest.groupBy({
      by: ['status'],
      _count: true
    })

    console.log(`\n📊 Total leave requests: ${totalLeaves}`)
    console.log(`📊 By Status:`)
    statusCounts.forEach(s => {
      console.log(`   - ${s.status}: ${s._count} requests`)
    })

    results.passed.push('Leave requests')
  } catch (error) {
    console.error(`❌ Error: ${error}`)
    results.failed.push('Leave requests')
  }

  // Test 4: Check approvals
  console.log(`\n4️⃣  Testing: Leave Approvals`)
  console.log('─────────────────────────────────────────────────')
  try {
    const approvals = await prisma.approval.findMany({
      include: {
        leaveRequest: {
          include: {
            employee: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        approver: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      take: 5
    })

    console.log(`✅ Found ${approvals.length} approvals (showing first 5)`)
    approvals.forEach(a => {
      console.log(`   - ${a.leaveRequest.employee.firstName} → ${a.approver.firstName}: ${a.status}`)
    })

    const totalApprovals = await prisma.approval.count()
    console.log(`\n📊 Total approvals in system: ${totalApprovals}`)
    results.passed.push('Leave approvals')
  } catch (error) {
    console.error(`❌ Error: ${error}`)
    results.failed.push('Leave approvals')
  }

  // Test 5: Check holidays
  console.log(`\n5️⃣  Testing: Holidays`)
  console.log('─────────────────────────────────────────────────')
  try {
    const holidays = await prisma.holiday.findMany({
      where: {
        date: {
          gte: new Date('2025-01-01')
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    console.log(`✅ Found ${holidays.length} holidays for 2025`)
    holidays.forEach(h => {
      console.log(`   - ${h.name}: ${h.date.toLocaleDateString()}`)
    })

    results.passed.push('Holidays')
  } catch (error) {
    console.error(`❌ Error: ${error}`)
    results.failed.push('Holidays')
  }

  // Test 6: Check policies
  console.log(`\n6️⃣  Testing: Leave Policies`)
  console.log('─────────────────────────────────────────────────')
  try {
    const policies = await prisma.leavePolicy.findMany({
      where: {
        isActive: true
      }
    })

    console.log(`✅ Found ${policies.length} active leave policies`)
    policies.forEach(p => {
      console.log(`   - ${p.name}: ${p.entitlementDays} days | ${p.leaveType}`)
    })

    results.passed.push('Leave policies')
  } catch (error) {
    console.error(`❌ Error: ${error}`)
    results.failed.push('Leave policies')
  }

  // Test 7: Check comp-off balances
  console.log(`\n7️⃣  Testing: Comp-Off Balances`)
  console.log('─────────────────────────────────────────────────')
  try {
    const compOffBalances = await prisma.compOffBalance.findMany({
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    if (compOffBalances.length > 0) {
      console.log(`✅ Found ${compOffBalances.length} comp-off balances`)
      compOffBalances.forEach(c => {
        console.log(`   - ${c.employee.firstName} ${c.employee.lastName}: ${c.available} days available`)
      })
      results.passed.push('Comp-off balances')
    } else {
      console.log(`⚠️  No comp-off balances found`)
      results.warnings.push('No comp-off data')
    }
  } catch (error) {
    console.error(`❌ Error: ${error}`)
    results.failed.push('Comp-off balances')
  }

  // Final Summary
  console.log(`\n\n${'═'.repeat(50)}`)
  console.log('📊 TEST SUMMARY')
  console.log('═'.repeat(50))

  console.log(`\n✅ PASSED (${results.passed.length}):`)
  results.passed.forEach(t => console.log(`   ✓ ${t}`))

  if (results.warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS (${results.warnings.length}):`)
    results.warnings.forEach(t => console.log(`   ! ${t}`))
  }

  if (results.failed.length > 0) {
    console.log(`\n❌ FAILED (${results.failed.length}):`)
    results.failed.forEach(t => console.log(`   ✗ ${t}`))
  }

  const totalTests = results.passed.length + results.failed.length
  const passRate = ((results.passed.length / totalTests) * 100).toFixed(1)

  console.log(`\n📈 Overall: ${results.passed.length}/${totalTests} tests passed (${passRate}%)`)
  console.log('═'.repeat(50))

  if (results.failed.length === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Core functionality is working correctly.\n')
  } else {
    console.log('\n⚠️  SOME TESTS FAILED! Please review the failures above.\n')
  }
}

async function main() {
  try {
    await testCoreFunctionality()
  } catch (error) {
    console.error('Fatal error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
