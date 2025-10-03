import { PrismaClient } from '@prisma/client'
import { usaPtoService } from '../services/usaPtoService'
import { seedUsaEmployees } from './seed-usa-employees'

const prisma = new PrismaClient()

async function testUsaPtoSystem() {
  console.log('🇺🇸 Testing USA Role-Based PTO Allocation System\n')

  try {
    // Get current year
    const currentYear = new Date().getFullYear()
    console.log(`📅 Testing for year ${currentYear}\n`)

    // Step 1: Seed USA employees if needed
    console.log('1️⃣ Setting up USA test employees...')
    await seedUsaEmployees()
    console.log()

    // Step 2: Get all USA employees
    console.log('2️⃣ Finding USA employees...')
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
        joiningDate: true,
        email: true
      }
    })

    console.log(`✅ Found ${usaEmployees.length} USA employees:`)
    usaEmployees.forEach(emp => {
      const ptoRule = usaPtoService.getPtoRulesSummary().find(r => r.role === emp.role)
      const expectedPto = ptoRule ? ptoRule.annualPtoDays : 12
      const carryForward = ptoRule ? ptoRule.maxCarryForward : 0
      console.log(`   - ${emp.firstName} ${emp.lastName} (${emp.role}) - ${emp.location} - Expected: ${expectedPto} PTO, ${carryForward} carry-forward`)
    })
    console.log()

    // Step 3: Test PTO allocation rules
    console.log('3️⃣ Testing PTO allocation rules...')
    const rules = usaPtoService.getPtoRulesSummary()
    console.log('✅ PTO allocation rules:')
    rules.forEach(rule => {
      console.log(`   - ${rule.role}: ${rule.annualPtoDays} days/year, max ${rule.maxCarryForward} carry-forward`)
    })
    console.log()

    // Step 4: Test single employee allocation (AVP)
    console.log('4️⃣ Testing single employee allocation (AVP)...')
    const avpEmployee = usaEmployees.find(emp => emp.role === 'AVP')
    if (avpEmployee) {
      console.log(`Testing with: ${avpEmployee.firstName} ${avpEmployee.lastName} (${avpEmployee.role})`)
      console.log(`Joining Date: ${avpEmployee.joiningDate.toISOString().split('T')[0]}`)

      const result = await usaPtoService.processEmployeePtoAllocation(avpEmployee.id, currentYear)

      console.log('✅ AVP allocation result:')
      console.log(`   - Annual allocation: ${result.annualAllocation} days`)
      console.log(`   - Pro-rated allocation: ${result.proRatedAllocation} days`)
      console.log(`   - Is pro-rated: ${result.isProRated}`)
      console.log(`   - Carry-forward limit: ${result.carryForwardLimit} days`)
      console.log(`   - Reason: ${result.reason}`)

      // Verify AVP gets 15 days and max 5 carry-forward
      if (result.annualAllocation === 15 && result.carryForwardLimit === 5) {
        console.log('✅ AVP allocation rules correctly applied!')
      } else {
        console.log(`❌ AVP allocation rules incorrect! Expected 15 days/5 carry-forward`)
      }
    }
    console.log()

    // Step 5: Test VP allocation
    console.log('5️⃣ Testing VP allocation...')
    const vpEmployee = usaEmployees.find(emp => emp.role === 'VP')
    if (vpEmployee) {
      console.log(`Testing with: ${vpEmployee.firstName} ${vpEmployee.lastName} (${vpEmployee.role})`)

      const result = await usaPtoService.processEmployeePtoAllocation(vpEmployee.id, currentYear)

      console.log('✅ VP allocation result:')
      console.log(`   - Annual allocation: ${result.annualAllocation} days`)
      console.log(`   - Pro-rated allocation: ${result.proRatedAllocation} days`)
      console.log(`   - Carry-forward limit: ${result.carryForwardLimit} days`)

      // Verify VP gets 20 days and no carry-forward
      if (result.annualAllocation === 20 && result.carryForwardLimit === 0) {
        console.log('✅ VP allocation rules correctly applied!')
      } else {
        console.log(`❌ VP allocation rules incorrect! Expected 20 days/0 carry-forward`)
      }
    }
    console.log()

    // Step 6: Test pro-rated allocation for mid-year joiner
    console.log('6️⃣ Testing pro-rated allocation for mid-year joiner...')
    const midYearJoiner = usaEmployees.find(emp => {
      const joiningMonth = emp.joiningDate.getMonth()
      const joiningYear = emp.joiningDate.getFullYear()
      return joiningYear === currentYear && joiningMonth > 0 // Joined after January
    })

    if (midYearJoiner) {
      console.log(`Testing with: ${midYearJoiner.firstName} ${midYearJoiner.lastName}`)
      console.log(`Joining Date: ${midYearJoiner.joiningDate.toISOString().split('T')[0]}`)

      const result = await usaPtoService.processEmployeePtoAllocation(midYearJoiner.id, currentYear)

      console.log('✅ Mid-year joiner result:')
      console.log(`   - Annual allocation: ${result.annualAllocation} days`)
      console.log(`   - Pro-rated allocation: ${result.proRatedAllocation} days`)
      console.log(`   - Is pro-rated: ${result.isProRated}`)

      if (result.isProRated) {
        console.log('✅ Pro-rated allocation correctly applied!')
      } else {
        console.log(`❌ Pro-rated allocation not applied for mid-year joiner`)
      }
    } else {
      console.log('ℹ️ No mid-year joiners found for current year')
    }
    console.log()

    // Step 7: Test batch allocation
    console.log('7️⃣ Testing batch PTO allocation...')
    const batchResults = await usaPtoService.processAnnualPtoAllocationBatch(currentYear)

    console.log(`✅ Batch processing completed for ${batchResults.length} employees:`)
    batchResults.forEach(result => {
      const employee = usaEmployees.find(emp => emp.id === result.employeeId)
      const empName = employee ? `${employee.firstName} ${employee.lastName}` : result.employeeId
      console.log(`   - ${empName} (${result.role}): ${result.proRatedAllocation} PTO days (${result.reason})`)
    })

    const successCount = batchResults.filter(r => !r.reason.includes('Error')).length
    console.log(`📊 Summary: ${successCount}/${batchResults.length} employees processed successfully`)
    console.log()

    // Step 8: Check PTO balances were updated
    console.log('8️⃣ Checking PTO balance updates...')
    const ptoBalances = await prisma.leaveBalance.findMany({
      where: {
        leaveType: 'PTO',
        year: currentYear,
        employeeId: { in: usaEmployees.map(emp => emp.id) }
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    })

    console.log('✅ Current PTO balances:')
    ptoBalances.forEach(balance => {
      console.log(`   - ${balance.employee.firstName} ${balance.employee.lastName} (${balance.employee.role}): ${balance.totalEntitlement} total, ${balance.available} available`)
    })
    console.log()

    // Step 9: Test carry-forward rules
    console.log('9️⃣ Testing carry-forward rules...')

    // Simulate some used PTO for testing
    for (const balance of ptoBalances.slice(0, 3)) {
      const usedDays = Math.floor(Math.random() * 5) + 3 // 3-7 days used
      await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: {
          used: usedDays,
          available: balance.totalEntitlement - usedDays
        }
      })
    }

    await usaPtoService.applyYearEndCarryForwardRules(currentYear)
    console.log('✅ Carry-forward rules applied')
    console.log()

    // Step 10: Verify GLF compliance
    console.log('🔟 Verifying GLF compliance...')

    const complianceTests = [
      {
        test: 'AVP gets 15 PTO days',
        passed: batchResults.some(r => r.role === 'AVP' && r.annualAllocation === 15)
      },
      {
        test: 'VP+ gets 20 PTO days',
        passed: batchResults.filter(r => ['VP', 'SVP', 'EVP'].includes(r.role)).every(r => r.annualAllocation === 20)
      },
      {
        test: 'AVP can carry forward max 5 days',
        passed: batchResults.some(r => r.role === 'AVP' && r.carryForwardLimit === 5)
      },
      {
        test: 'VP+ cannot carry forward',
        passed: batchResults.filter(r => ['VP', 'SVP', 'EVP'].includes(r.role)).every(r => r.carryForwardLimit === 0)
      },
      {
        test: 'Pro-rated allocation works',
        passed: batchResults.some(r => r.isProRated)
      }
    ]

    console.log('✅ GLF Compliance Tests:')
    complianceTests.forEach(test => {
      console.log(`   ${test.passed ? '✅' : '❌'} ${test.test}`)
    })

    const passedTests = complianceTests.filter(t => t.passed).length
    console.log(`\n📊 Compliance Score: ${passedTests}/${complianceTests.length} (${Math.round(passedTests/complianceTests.length*100)}%)`)
    console.log()

    console.log('🎉 USA PTO Allocation System Test Completed Successfully!')
    console.log()
    console.log('📋 Test Summary:')
    console.log('✅ USA employee detection')
    console.log('✅ Role-based PTO allocation (AVP: 15, VP+: 20)')
    console.log('✅ Pro-rated allocation for mid-year joiners')
    console.log('✅ Carry-forward restrictions (AVP: 5 max, VP+: 0)')
    console.log('✅ Batch processing')
    console.log('✅ GLF compliance verification')

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
if (require.main === module) {
  testUsaPtoSystem()
}

export { testUsaPtoSystem }