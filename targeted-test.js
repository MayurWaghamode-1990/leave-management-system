const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';
let authToken = '';
let testUserId = '';

class TargetedLeaveTest {
  constructor() {
    this.results = [];
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const levels = { info: '📝', success: '✅', error: '❌', warning: '⚠️', test: '🧪' };
    console.log(`${levels[level]} [${timestamp}] ${message}`);
  }

  async authenticate() {
    try {
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'engineering.manager@company.com',
        password: 'password123'
      });

      if (response.data.success) {
        authToken = response.data.data.token;
        testUserId = response.data.data.user.id;
        this.log(`Authenticated as ${response.data.data.user.firstName} ${response.data.data.user.lastName} (${testUserId})`, 'success');
        return true;
      }
    } catch (error) {
      this.log(`Authentication failed: ${error.message}`, 'error');
      return false;
    }
  }

  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
  }

  // Generate future dates
  getFutureDates() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);

    const twoWeeks = new Date(now);
    twoWeeks.setDate(now.getDate() + 14);

    return {
      tomorrow: tomorrow.toISOString().split('T')[0],
      nextWeek: nextWeek.toISOString().split('T')[0],
      twoWeeks: twoWeeks.toISOString().split('T')[0]
    };
  }

  async testLeaveTypeRetention() {
    this.log('🧪 Testing leave type retention issue...', 'test');
    const dates = this.getFutureDates();

    const testCases = [
      { type: 'CASUAL_LEAVE', name: 'Casual Leave' },
      { type: 'SICK_LEAVE', name: 'Sick Leave' },
      { type: 'EARNED_LEAVE', name: 'Earned Leave' },
      { type: 'COMPENSATORY_OFF', name: 'Compensatory Off' }
    ];

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + (i + 1) * 3); // Space out the dates
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 1);

        const response = await axios.post(`${BASE_URL}/leaves`, {
          type: testCase.type,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          reason: `Testing ${testCase.name} retention - checking if leave type is preserved correctly`,
          isHalfDay: false
        }, { headers: this.getAuthHeaders() });

        if (response.data.success) {
          const created = response.data.data.request;
          const retained = created.leaveType === testCase.type;

          this.results.push({
            test: 'Leave Type Retention',
            leaveType: testCase.type,
            expectedType: testCase.type,
            actualType: created.leaveType,
            retained: retained,
            requestId: created.id,
            issue: !retained ? `Expected ${testCase.type}, got ${created.leaveType}` : null
          });

          if (retained) {
            this.log(`✅ ${testCase.name}: Type retained correctly (${created.leaveType})`, 'success');
          } else {
            this.log(`⚠️ ${testCase.name}: Type NOT retained! Expected: ${testCase.type}, Got: ${created.leaveType}`, 'warning');
          }
        }
      } catch (error) {
        this.log(`❌ Failed to create ${testCase.name}: ${error.response?.data?.message}`, 'error');
        this.results.push({
          test: 'Leave Type Retention',
          leaveType: testCase.type,
          error: error.response?.data?.message,
          retained: false
        });
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  async testMultipleLeaveSameDateRange() {
    this.log('🧪 Testing multiple leave types for same date range...', 'test');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 20);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 2);

    const dateRange = {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };

    const types = ['CASUAL_LEAVE', 'EARNED_LEAVE', 'COMPENSATORY_OFF'];
    const createdRequests = [];

    for (const type of types) {
      try {
        const response = await axios.post(`${BASE_URL}/leaves`, {
          type: type,
          startDate: dateRange.start,
          endDate: dateRange.end,
          reason: `Testing ${type} for overlapping date validation - same period as other requests`,
          isHalfDay: false
        }, { headers: this.getAuthHeaders() });

        if (response.data.success) {
          createdRequests.push({
            type: type,
            id: response.data.data.request.id,
            success: true
          });
          this.log(`✅ Created ${type} for ${dateRange.start} to ${dateRange.end}`, 'success');
        }
      } catch (error) {
        createdRequests.push({
          type: type,
          success: false,
          error: error.response?.data?.message
        });
        this.log(`❌ Failed to create ${type}: ${error.response?.data?.message}`, 'error');
      }

      await new Promise(resolve => setTimeout(resolve, 300));
    }

    const successCount = createdRequests.filter(r => r.success).length;
    this.results.push({
      test: 'Multiple Leave Types Same Date',
      dateRange: dateRange,
      attempts: createdRequests,
      successCount: successCount,
      allowsMultiple: successCount > 1,
      issue: successCount > 1 ? 'System allows multiple leave types for same dates' : null
    });

    if (successCount > 1) {
      this.log(`⚠️ ISSUE: System allowed ${successCount} different leave types for the same date range!`, 'warning');
    } else {
      this.log('✅ System properly prevents multiple leave types for same dates', 'success');
    }
  }

  async testLeaveBalanceDeduction() {
    this.log('🧪 Testing leave balance deduction...', 'test');

    try {
      // Get initial balance
      const initialResponse = await axios.get(`${BASE_URL}/leaves/balances`, {
        headers: this.getAuthHeaders()
      });

      const initialBalances = initialResponse.data.data || [];
      this.log(`Retrieved ${initialBalances.length} initial balance records`, 'info');

      // Find casual leave balance
      const casualBalance = initialBalances.find(b => b.leaveType === 'CASUAL_LEAVE');
      const initialAvailable = casualBalance ? casualBalance.available : 0;

      this.log(`Initial CASUAL_LEAVE balance: ${initialAvailable}`, 'info');

      // Create a leave request
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 25);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 1); // 2 days

      const leaveResponse = await axios.post(`${BASE_URL}/leaves`, {
        type: 'CASUAL_LEAVE',
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        reason: 'Testing balance deduction functionality - checking if days are properly deducted from available balance',
        isHalfDay: false
      }, { headers: this.getAuthHeaders() });

      if (leaveResponse.data.success) {
        const leaveRequest = leaveResponse.data.data.request;
        const requestedDays = leaveRequest.totalDays;
        this.log(`Created leave request for ${requestedDays} days`, 'success');

        // Wait and get updated balance
        await new Promise(resolve => setTimeout(resolve, 1000));

        const updatedResponse = await axios.get(`${BASE_URL}/leaves/balances`, {
          headers: this.getAuthHeaders()
        });

        const updatedBalances = updatedResponse.data.data || [];
        const updatedCasualBalance = updatedBalances.find(b => b.leaveType === 'CASUAL_LEAVE');
        const updatedAvailable = updatedCasualBalance ? updatedCasualBalance.available : 0;

        const expectedDeduction = requestedDays;
        const actualDeduction = initialAvailable - updatedAvailable;

        this.results.push({
          test: 'Leave Balance Deduction',
          initialBalance: initialAvailable,
          requestedDays: requestedDays,
          expectedFinalBalance: initialAvailable - requestedDays,
          actualFinalBalance: updatedAvailable,
          expectedDeduction: expectedDeduction,
          actualDeduction: actualDeduction,
          deductionWorking: actualDeduction === expectedDeduction,
          leaveRequestId: leaveRequest.id
        });

        if (actualDeduction === expectedDeduction) {
          this.log(`✅ Balance deduction working: ${actualDeduction} days deducted correctly`, 'success');
        } else {
          this.log(`⚠️ ISSUE: Balance deduction incorrect! Expected: ${expectedDeduction}, Actual: ${actualDeduction}`, 'warning');
        }
      }
    } catch (error) {
      this.log(`❌ Balance deduction test failed: ${error.message}`, 'error');
      this.results.push({
        test: 'Leave Balance Deduction',
        error: error.response?.data?.message || error.message,
        deductionWorking: false
      });
    }
  }

  async testHalfDayLeaves() {
    this.log('🧪 Testing half-day leave functionality...', 'test');

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 30);

      const response = await axios.post(`${BASE_URL}/leaves`, {
        type: 'SICK_LEAVE',
        startDate: startDate.toISOString().split('T')[0],
        endDate: startDate.toISOString().split('T')[0],
        reason: 'Testing half-day leave calculation and balance deduction functionality',
        isHalfDay: true
      }, { headers: this.getAuthHeaders() });

      if (response.data.success) {
        const request = response.data.data.request;
        const correctCalculation = request.totalDays === 0.5;

        this.results.push({
          test: 'Half Day Leave',
          requestId: request.id,
          totalDays: request.totalDays,
          isHalfDay: request.isHalfDay,
          correctCalculation: correctCalculation,
          issue: !correctCalculation ? `Expected 0.5 days, got ${request.totalDays}` : null
        });

        if (correctCalculation) {
          this.log(`✅ Half-day leave calculated correctly: ${request.totalDays} days`, 'success');
        } else {
          this.log(`⚠️ ISSUE: Half-day calculation wrong! Expected 0.5, got ${request.totalDays}`, 'warning');
        }
      }
    } catch (error) {
      this.log(`❌ Half-day leave test failed: ${error.response?.data?.message}`, 'error');
    }
  }

  async testLeaveRequestCancellation() {
    this.log('🧪 Testing leave request cancellation...', 'test');

    try {
      // Create a leave request first
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 35);

      const createResponse = await axios.post(`${BASE_URL}/leaves`, {
        type: 'CASUAL_LEAVE',
        startDate: startDate.toISOString().split('T')[0],
        endDate: startDate.toISOString().split('T')[0],
        reason: 'Testing leave cancellation functionality - request to be cancelled immediately',
        isHalfDay: false
      }, { headers: this.getAuthHeaders() });

      if (createResponse.data.success) {
        const requestId = createResponse.data.data.request.id;
        this.log(`Created leave request ${requestId} for cancellation test`, 'success');

        // Try to cancel it
        const cancelResponse = await axios.delete(`${BASE_URL}/leaves/${requestId}`, {
          headers: this.getAuthHeaders()
        });

        if (cancelResponse.data.success) {
          this.log(`✅ Leave request ${requestId} cancelled successfully`, 'success');
          this.results.push({
            test: 'Leave Cancellation',
            requestId: requestId,
            cancellationWorking: true
          });
        } else {
          throw new Error('Cancellation response indicated failure');
        }
      }
    } catch (error) {
      this.log(`❌ Leave cancellation test failed: ${error.response?.data?.message}`, 'error');
      this.results.push({
        test: 'Leave Cancellation',
        cancellationWorking: false,
        error: error.response?.data?.message || error.message
      });
    }
  }

  generateReport() {
    const issues = [];
    const summary = {
      totalTests: this.results.length,
      testsWithIssues: 0,
      criticalIssues: 0
    };

    this.results.forEach(result => {
      if (result.issue) {
        issues.push(result.issue);
        summary.testsWithIssues++;
      }
      if (result.error) {
        issues.push(`${result.test}: ${result.error}`);
        summary.testsWithIssues++;
      }

      // Check for specific critical issues
      if (result.test === 'Leave Type Retention' && !result.retained) {
        summary.criticalIssues++;
      }
      if (result.test === 'Leave Balance Deduction' && !result.deductionWorking) {
        summary.criticalIssues++;
      }
      if (result.test === 'Multiple Leave Types Same Date' && result.allowsMultiple) {
        summary.criticalIssues++;
      }
    });

    return {
      testExecutionDate: new Date().toISOString(),
      testUser: 'engineering.manager@company.com',
      summary,
      identifiedIssues: issues,
      detailedResults: this.results,
      recommendations: this.generateRecommendations()
    };
  }

  generateRecommendations() {
    const recommendations = [];

    this.results.forEach(result => {
      if (result.test === 'Leave Type Retention' && !result.retained) {
        recommendations.push('Fix leave type retention bug in backend API - ensure POST /leaves preserves the submitted leave type');
      }
      if (result.test === 'Leave Balance Deduction' && !result.deductionWorking) {
        recommendations.push('Implement proper leave balance deduction logic after leave approval');
      }
      if (result.test === 'Multiple Leave Types Same Date' && result.allowsMultiple) {
        recommendations.push('Add date range overlap validation to prevent multiple leave types for same period');
      }
    });

    return [...new Set(recommendations)]; // Remove duplicates
  }

  async runTargetedTests() {
    this.log('🚀 Starting targeted leave management tests...', 'test');

    const authenticated = await this.authenticate();
    if (!authenticated) return null;

    await this.testLeaveTypeRetention();
    await this.testMultipleLeaveSameDateRange();
    await this.testLeaveBalanceDeduction();
    await this.testHalfDayLeaves();
    await this.testLeaveRequestCancellation();

    const report = this.generateReport();

    this.log('📊 TARGETED TESTS COMPLETED', 'success');
    this.log(`Total Issues Found: ${report.identifiedIssues.length}`, 'warning');
    this.log(`Critical Issues: ${report.summary.criticalIssues}`, 'error');

    if (report.identifiedIssues.length > 0) {
      this.log('🚨 IDENTIFIED ISSUES:', 'warning');
      report.identifiedIssues.forEach((issue, index) => {
        this.log(`${index + 1}. ${issue}`, 'warning');
      });
    }

    if (report.recommendations.length > 0) {
      this.log('💡 RECOMMENDATIONS:', 'info');
      report.recommendations.forEach((rec, index) => {
        this.log(`${index + 1}. ${rec}`, 'info');
      });
    }

    return report;
  }
}

async function main() {
  const tester = new TargetedLeaveTest();
  const report = await tester.runTargetedTests();

  if (report) {
    const fs = require('fs');
    fs.writeFileSync('./targeted-test-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed report saved to: ./targeted-test-report.json');
  }
}

if (require.main === module) {
  main();
}

module.exports = { TargetedLeaveTest };