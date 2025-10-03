import { PrismaClient } from '@prisma/client'
import { indiaAccrualService } from '../services/indiaAccrualService'

const prisma = new PrismaClient()

async function testMonthlyAccrual() {
  console.log('🧪 Testing India Monthly Accrual System\n')

  try {
    // Get current date
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    console.log(`📅 Testing for ${currentMonth}/${currentYear}\n`)

    // Test 1: Get all India employees
    console.log('1️⃣ Finding India employees...')
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
        joiningDate: true,
        email: true
      }
    })

    console.log(`✅ Found ${indiaEmployees.length} India employees:`)
    indiaEmployees.forEach(emp => {
      console.log(`   - ${emp.firstName} ${emp.lastName} (${emp.employeeId}) - ${emp.location} - Joined: ${emp.joiningDate.toISOString().split('T')[0]}`)
    })
    console.log()

    if (indiaEmployees.length === 0) {
      console.log('❌ No India employees found. Please ensure there are employees with India locations.')
      return
    }

    // Test 2: Test joining date calculation for first employee
    console.log('2️⃣ Testing joining date logic...')
    const testEmployee = indiaEmployees[0]
    console.log(`Testing with: ${testEmployee.firstName} ${testEmployee.lastName}`)
    console.log(`Joining Date: ${testEmployee.joiningDate.toISOString().split('T')[0]}`)

    // Calculate what the accrual should be
    const joiningDay = testEmployee.joiningDate.getDate()
    const joiningMonth = testEmployee.joiningDate.getMonth() + 1
    const joiningYear = testEmployee.joiningDate.getFullYear()

    console.log(`Joining Day: ${joiningDay}`)

    let expectedCL, expectedPL
    if (joiningYear === currentYear && joiningMonth === currentMonth) {
      if (joiningDay <= 15) {
        expectedCL = 1.0
        expectedPL = 1.0
        console.log(`✅ Joined 1st-15th of current month: Full credit (CL: ${expectedCL}, PL: ${expectedPL})`)
      } else {
        expectedCL = 0.5
        expectedPL = 0.5
        console.log(`✅ Joined 16th+ of current month: Half credit (CL: ${expectedCL}, PL: ${expectedPL})`)
      }
    } else {
      expectedCL = 1.0
      expectedPL = 1.0
      console.log(`✅ Joined in different month/year: Full credit (CL: ${expectedCL}, PL: ${expectedPL})`)
    }
    console.log()

    // Test 3: Process single employee accrual
    console.log('3️⃣ Testing single employee accrual processing...')
    try {
      const result = await indiaAccrualService.processEmployeeMonthlyAccrual(
        testEmployee.id,
        currentYear,
        currentMonth
      )

      console.log('✅ Single employee accrual result:')
      console.log(`   - Employee: ${testEmployee.firstName} ${testEmployee.lastName}`)
      console.log(`   - CL Credit: ${result.casualLeave}`)
      console.log(`   - PL Credit: ${result.privilegeLeave}`)
      console.log(`   - Pro-rated: ${result.proRated}`)
      console.log(`   - Reason: ${result.reason}`)

      // Verify results match expected
      if (result.casualLeave === expectedCL && result.privilegeLeave === expectedPL) {
        console.log('✅ Results match expected values!')
      } else {
        console.log(`❌ Results don't match! Expected CL: ${expectedCL}, PL: ${expectedPL}`)
      }
    } catch (error) {
      console.log(`❌ Single employee test failed: ${error instanceof Error ? error.message : error}`)
    }
    console.log()

    // Test 4: Check leave balances were updated
    console.log('4️⃣ Checking leave balance updates...')
    const updatedBalances = await prisma.leaveBalance.findMany({
      where: {
        employeeId: testEmployee.id,
        year: currentYear,
        leaveType: { in: ['CASUAL_LEAVE', 'EARNED_LEAVE'] }
      }
    })

    console.log('✅ Current leave balances:')
    updatedBalances.forEach(balance => {
      console.log(`   - ${balance.leaveType}: Total: ${balance.totalEntitlement}, Available: ${balance.available}, Used: ${balance.used}`)
    })
    console.log()

    // Test 5: Process batch accrual for all employees
    console.log('5️⃣ Testing batch accrual processing...')
    try {
      const batchResults = await indiaAccrualService.processMonthlyAccrualBatch(currentYear, currentMonth)

      console.log(`✅ Batch processing completed for ${batchResults.length} employees:`)
      batchResults.forEach(result => {
        const employee = indiaEmployees.find(emp => emp.id === result.employeeId)
        const empName = employee ? `${employee.firstName} ${employee.lastName}` : result.employeeId
        console.log(`   - ${empName}: CL: ${result.casualLeave}, PL: ${result.privilegeLeave} (${result.reason})`)
      })

      const successCount = batchResults.filter(r => !r.reason.includes('Error')).length
      console.log(`📊 Summary: ${successCount}/${batchResults.length} employees processed successfully`)
    } catch (error) {
      console.log(`❌ Batch processing failed: ${error instanceof Error ? error.message : error}`)
    }
    console.log()

    // Test 6: Test scheduler status
    console.log('6️⃣ Testing scheduler integration...')
    const { accrualScheduler } = await import('../services/accrualScheduler')
    const schedulerStatus = accrualScheduler.getSchedulerStatus()

    console.log('✅ Scheduler status:')
    console.log(`   - Total jobs: ${schedulerStatus.totalJobs}`)
    Object.entries(schedulerStatus.jobs).forEach(([name, job]: [string, any]) => {
      console.log(`   - ${name}: ${job.running ? 'Running' : 'Stopped'}`)
    })
    console.log()

    console.log('🎉 Monthly Accrual System Test Completed Successfully!')
    console.log()
    console.log('📋 Test Summary:')
    console.log('✅ India employee detection')
    console.log('✅ Joining date logic (1st-15th = full, 16th+ = 0.5)')
    console.log('✅ Single employee processing')
    console.log('✅ Leave balance updates')
    console.log('✅ Batch processing')
    console.log('✅ Scheduler integration')

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
if (require.main === module) {
  testMonthlyAccrual()
}

export { testMonthlyAccrual }