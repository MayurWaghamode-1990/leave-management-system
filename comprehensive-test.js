const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';
let authToken = '';
let testUserId = '';
let testUserName = 'Engineering Manager';

class LeaveTestSuite {
  constructor() {
    this.results = {
      authentication: null,
      leaveCreation: [],
      multipleLeaveTypes: null,
      leaveTypeRetention: null,
      balanceDeduction: null,
      edgeCases: [],
      uiConsistency: []
    };
    this.console = console;
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const levels = {
      info: '📝',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      test: '🧪'
    };
    console.log(`${levels[level]} [${timestamp}] ${message}`);
  }

  async authenticate() {
    try {
      this.log('Starting authentication test...', 'test');

      const response = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'engineering.manager@company.com',
        password: 'password123'
      });

      if (response.data.success && response.data.data.token) {
        authToken = response.data.data.token;
        testUserId = response.data.data.user.id;
        testUserName = `${response.data.data.user.firstName} ${response.data.data.user.lastName}`;
        this.results.authentication = { success: true, token: authToken, userId: testUserId };
        this.log(`Authentication successful for ${testUserName} (${testUserId})`, 'success');
        return true;
      } else {
        throw new Error('Authentication failed - no token received');
      }
    } catch (error) {
      this.results.authentication = { success: false, error: error.message };
      this.log(`Authentication failed: ${error.message}`, 'error');
      return false;
    }
  }

  async getAuthHeaders() {
    return {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
  }

  async fetchLeaveBalances() {
    try {
      const response = await axios.get(`${BASE_URL}/leaves/balances`, {
        headers: await this.getAuthHeaders()
      });
      this.log(`Retrieved leave balances for user ${testUserId}`, 'success');
      return response.data.data;
    } catch (error) {
      this.log(`Failed to fetch leave balances: ${error.message}`, 'error');
      return [];
    }
  }

  async fetchLeaveRequests() {
    try {
      const response = await axios.get(`${BASE_URL}/leaves`, {
        headers: await this.getAuthHeaders()
      });
      this.log(`Retrieved ${response.data.data.requests?.length || 0} leave requests`, 'info');
      return response.data.data.requests || [];
    } catch (error) {
      this.log(`Failed to fetch leave requests: ${error.message}`, 'error');
      return [];
    }
  }

  async testBasicLeaveCreation() {
    this.log('Testing basic leave creation...', 'test');

    const testCases = [
      {
        name: 'Casual Leave - Single Day',
        data: {
          type: 'CASUAL_LEAVE',
          startDate: '2025-01-15',
          endDate: '2025-01-15',
          reason: 'Personal work - need to visit bank for important documentation',
          isHalfDay: false
        }
      },
      {
        name: 'Sick Leave - Half Day',
        data: {
          type: 'SICK_LEAVE',
          startDate: '2025-01-20',
          endDate: '2025-01-20',
          reason: 'Medical consultation with family doctor for routine checkup',
          isHalfDay: true
        }
      },
      {
        name: 'Earned Leave - Multiple Days',
        data: {
          type: 'EARNED_LEAVE',
          startDate: '2025-02-10',
          endDate: '2025-02-12',
          reason: 'Family vacation planned for long weekend with relatives visiting',
          isHalfDay: false
        }
      }
    ];

    for (const testCase of testCases) {
      try {
        // Get initial balance
        const initialBalances = await this.fetchLeaveBalances();
        const initialBalance = initialBalances.find(b => b.leaveType === testCase.data.type);

        this.log(`Creating leave request: ${testCase.name}`, 'info');

        const response = await axios.post(`${BASE_URL}/leaves`, testCase.data, {
          headers: await this.getAuthHeaders()
        });

        if (response.data.success) {
          const createdRequest = response.data.data.request;

          // Verify leave type retention
          const leaveTypeRetained = createdRequest.leaveType === testCase.data.type;

          this.results.leaveCreation.push({
            testCase: testCase.name,
            success: true,
            requestId: createdRequest.id,
            leaveType: createdRequest.leaveType,
            expectedLeaveType: testCase.data.type,
            leaveTypeRetained: leaveTypeRetained,
            totalDays: createdRequest.totalDays,
            status: createdRequest.status,
            initialBalance: initialBalance?.available || 0
          });

          this.log(`✅ Created ${testCase.name}: ID=${createdRequest.id}, Type=${createdRequest.leaveType}, Days=${createdRequest.totalDays}`, 'success');

          if (!leaveTypeRetained) {
            this.log(`⚠️  ISSUE: Leave type not retained! Expected: ${testCase.data.type}, Got: ${createdRequest.leaveType}`, 'warning');
          }
        } else {
          throw new Error(response.data.message || 'Request failed');
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        this.results.leaveCreation.push({
          testCase: testCase.name,
          success: false,
          error: error.response?.data?.message || error.message
        });
        this.log(`❌ Failed to create ${testCase.name}: ${error.response?.data?.message || error.message}`, 'error');
      }
    }
  }

  async testMultipleLeaveTypesForSameDateRange() {
    this.log('Testing multiple leave types for same date range...', 'test');

    const sameDateRange = {
      startDate: '2025-03-15',
      endDate: '2025-03-17',
      reason: 'Testing overlapping leave types for same period - system validation check'
    };

    const leaveTypes = ['CASUAL_LEAVE', 'EARNED_LEAVE', 'COMPENSATORY_OFF'];
    const results = [];

    for (const leaveType of leaveTypes) {
      try {
        this.log(`Attempting ${leaveType} for ${sameDateRange.startDate} to ${sameDateRange.endDate}`, 'info');

        const response = await axios.post(`${BASE_URL}/leaves`, {
          type: leaveType,
          ...sameDateRange,
          isHalfDay: false
        }, {
          headers: await this.getAuthHeaders()
        });

        results.push({
          leaveType,
          success: response.data.success,
          requestId: response.data.data?.request?.id,
          error: null
        });

        this.log(`✅ ${leaveType} request created successfully for same date range`, 'success');

        // Small delay
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        results.push({
          leaveType,
          success: false,
          error: error.response?.data?.message || error.message
        });

        this.log(`❌ ${leaveType} request failed: ${error.response?.data?.message || error.message}`, 'error');
      }
    }

    const successCount = results.filter(r => r.success).length;
    this.results.multipleLeaveTypes = {
      dateRange: sameDateRange,
      attemptedTypes: leaveTypes,
      results,
      successCount,
      allowsMultiple: successCount > 1,
      issue: successCount > 1 ? 'System allows multiple leave types for same date range' : 'System properly prevents multiple leave types'
    };

    if (successCount > 1) {
      this.log(`⚠️  ISSUE: System allowed ${successCount} different leave types for the same date range!`, 'warning');
    } else {
      this.log('✅ System properly handles multiple leave type validation', 'success');
    }
  }

  async testLeaveBalanceDeduction() {
    this.log('Testing leave balance deduction...', 'test');

    // Get current balances
    const initialBalances = await this.fetchLeaveBalances();
    this.log(`Initial balances retrieved: ${initialBalances.length} leave types`, 'info');

    // Create a leave request
    const testLeaveData = {
      type: 'CASUAL_LEAVE',
      startDate: '2025-04-10',
      endDate: '2025-04-11',
      reason: 'Testing balance deduction mechanism with two day leave request',
      isHalfDay: false
    };

    try {
      // Create leave request
      const createResponse = await axios.post(`${BASE_URL}/leaves`, testLeaveData, {
        headers: await this.getAuthHeaders()
      });

      if (!createResponse.data.success) {
        throw new Error('Leave request creation failed');
      }

      const leaveRequest = createResponse.data.data.request;
      this.log(`Leave request created: ${leaveRequest.id} for ${leaveRequest.totalDays} days`, 'success');

      // Wait a moment for processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get updated balances
      const updatedBalances = await this.fetchLeaveBalances();

      // Compare balances
      const initialCasualBalance = initialBalances.find(b => b.leaveType === 'CASUAL_LEAVE');
      const updatedCasualBalance = updatedBalances.find(b => b.leaveType === 'CASUAL_LEAVE');

      const expectedDeduction = leaveRequest.totalDays;
      const actualDeduction = (initialCasualBalance?.available || 0) - (updatedCasualBalance?.available || 0);

      this.results.balanceDeduction = {
        initialBalance: initialCasualBalance?.available || 0,
        updatedBalance: updatedCasualBalance?.available || 0,
        requestDays: leaveRequest.totalDays,
        expectedDeduction,
        actualDeduction,
        deductionWorking: actualDeduction === expectedDeduction,
        leaveRequestId: leaveRequest.id
      };

      if (actualDeduction === expectedDeduction) {
        this.log(`✅ Balance deduction working correctly: ${actualDeduction} days deducted`, 'success');
      } else {
        this.log(`⚠️  ISSUE: Balance deduction incorrect! Expected: ${expectedDeduction}, Actual: ${actualDeduction}`, 'warning');
      }

    } catch (error) {
      this.results.balanceDeduction = {
        error: error.response?.data?.message || error.message,
        deductionWorking: false
      };
      this.log(`❌ Balance deduction test failed: ${error.message}`, 'error');
    }
  }

  async testEdgeCases() {
    this.log('Testing edge cases...', 'test');

    const edgeCaseTests = [
      {
        name: 'Overlapping Leave Requests',
        test: async () => {
          try {
            // Create first leave
            const firstLeave = await axios.post(`${BASE_URL}/leaves`, {
              type: 'CASUAL_LEAVE',
              startDate: '2025-05-10',
              endDate: '2025-05-12',
              reason: 'First leave request for overlapping test period check',
              isHalfDay: false
            }, { headers: await this.getAuthHeaders() });

            // Try to create overlapping leave
            const overlappingLeave = await axios.post(`${BASE_URL}/leaves`, {
              type: 'SICK_LEAVE',
              startDate: '2025-05-11',
              endDate: '2025-05-13',
              reason: 'Overlapping leave request to test system validation logic',
              isHalfDay: false
            }, { headers: await this.getAuthHeaders() });

            return {
              success: true,
              firstLeaveCreated: firstLeave.data.success,
              overlappingLeaveCreated: overlappingLeave.data.success,
              allowsOverlapping: true,
              issue: 'System allows overlapping leave requests'
            };
          } catch (error) {
            return {
              success: true,
              error: error.response?.data?.message || error.message,
              allowsOverlapping: false,
              preventsOverlapping: true
            };
          }
        }
      },
      {
        name: 'Weekend Leave Request',
        test: async () => {
          try {
            const response = await axios.post(`${BASE_URL}/leaves`, {
              type: 'CASUAL_LEAVE',
              startDate: '2025-05-17', // Saturday
              endDate: '2025-05-18', // Sunday
              reason: 'Weekend leave request to test business day calculation and validation',
              isHalfDay: false
            }, { headers: await this.getAuthHeaders() });

            return {
              success: response.data.success,
              weekendAllowed: true,
              calculatedDays: response.data.data?.request?.totalDays,
              requestId: response.data.data?.request?.id
            };
          } catch (error) {
            return {
              success: false,
              error: error.response?.data?.message || error.message,
              weekendAllowed: false
            };
          }
        }
      },
      {
        name: 'Past Date Leave Request',
        test: async () => {
          const pastDate = new Date();
          pastDate.setDate(pastDate.getDate() - 5);
          const pastDateStr = pastDate.toISOString().split('T')[0];

          try {
            const response = await axios.post(`${BASE_URL}/leaves`, {
              type: 'SICK_LEAVE',
              startDate: pastDateStr,
              endDate: pastDateStr,
              reason: 'Retroactive sick leave request for past date validation testing',
              isHalfDay: false
            }, { headers: await this.getAuthHeaders() });

            return {
              success: response.data.success,
              pastDateAllowed: true,
              requestId: response.data.data?.request?.id
            };
          } catch (error) {
            return {
              success: false,
              error: error.response?.data?.message || error.message,
              pastDateAllowed: false,
              preventsPastDates: true
            };
          }
        }
      },
      {
        name: 'Excessive Leave Days',
        test: async () => {
          try {
            const response = await axios.post(`${BASE_URL}/leaves`, {
              type: 'CASUAL_LEAVE',
              startDate: '2025-06-01',
              endDate: '2025-06-30', // 30 days
              reason: 'Extended leave request to test system limits and balance validation checks',
              isHalfDay: false
            }, { headers: await this.getAuthHeaders() });

            return {
              success: response.data.success,
              allowsExcessiveDays: true,
              requestedDays: response.data.data?.request?.totalDays,
              issue: 'System allows requests exceeding typical limits'
            };
          } catch (error) {
            return {
              success: false,
              error: error.response?.data?.message || error.message,
              allowsExcessiveDays: false,
              preventsExcessiveDays: true
            };
          }
        }
      }
    ];

    for (const edgeCase of edgeCaseTests) {
      this.log(`Testing edge case: ${edgeCase.name}`, 'info');
      try {
        const result = await edgeCase.test();
        this.results.edgeCases.push({
          name: edgeCase.name,
          ...result
        });

        if (result.issue) {
          this.log(`⚠️  ${edgeCase.name}: ${result.issue}`, 'warning');
        } else {
          this.log(`✅ ${edgeCase.name}: Handled appropriately`, 'success');
        }
      } catch (error) {
        this.results.edgeCases.push({
          name: edgeCase.name,
          success: false,
          error: error.message
        });
        this.log(`❌ ${edgeCase.name} failed: ${error.message}`, 'error');
      }

      // Delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  async validateDatabaseConsistency() {
    this.log('Validating database consistency...', 'test');

    try {
      // Get all leave requests
      const requests = await this.fetchLeaveRequests();
      const balances = await this.fetchLeaveBalances();

      this.results.uiConsistency.push({
        name: 'Database Consistency Check',
        totalRequests: requests.length,
        totalBalanceRecords: balances.length,
        requestsWithIds: requests.filter(r => r.id).length,
        balancesWithIds: balances.filter(b => b.id).length,
        consistent: requests.length > 0 && balances.length > 0
      });

      this.log(`Database consistency: ${requests.length} requests, ${balances.length} balance records`, 'info');
    } catch (error) {
      this.results.uiConsistency.push({
        name: 'Database Consistency Check',
        error: error.message,
        consistent: false
      });
    }
  }

  generateReport() {
    this.log('Generating comprehensive test report...', 'test');

    const report = {
      testExecutionDate: new Date().toISOString(),
      testUser: {
        email: 'engineering.manager@company.com',
        userId: testUserId,
        name: testUserName
      },
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        identifiedIssues: []
      },
      detailedResults: this.results
    };

    // Calculate summary
    let totalTests = 0;
    let passedTests = 0;
    let issues = [];

    // Authentication
    totalTests++;
    if (this.results.authentication?.success) passedTests++;
    else issues.push('Authentication failed');

    // Leave creation tests
    this.results.leaveCreation.forEach(test => {
      totalTests++;
      if (test.success) {
        passedTests++;
        if (!test.leaveTypeRetained) {
          issues.push(`Leave type retention issue: ${test.testCase} - Expected ${test.expectedLeaveType}, got ${test.leaveType}`);
        }
      } else {
        issues.push(`Leave creation failed: ${test.testCase} - ${test.error}`);
      }
    });

    // Multiple leave types test
    totalTests++;
    if (this.results.multipleLeaveTypes?.successCount > 0) {
      passedTests++;
      if (this.results.multipleLeaveTypes.allowsMultiple) {
        issues.push('System allows multiple leave types for same date range');
      }
    }

    // Balance deduction test
    totalTests++;
    if (this.results.balanceDeduction?.deductionWorking) {
      passedTests++;
    } else {
      issues.push('Leave balance deduction not working correctly');
    }

    // Edge cases
    this.results.edgeCases.forEach(test => {
      totalTests++;
      if (test.success) passedTests++;
      if (test.issue) issues.push(`${test.name}: ${test.issue}`);
    });

    // UI consistency tests
    this.results.uiConsistency.forEach(test => {
      totalTests++;
      if (test.consistent) passedTests++;
      else if (test.error) issues.push(`${test.name}: ${test.error}`);
    });

    report.summary = {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      identifiedIssues: issues,
      successRate: `${((passedTests / totalTests) * 100).toFixed(1)}%`
    };

    return report;
  }

  async runFullTestSuite() {
    this.log('🚀 Starting comprehensive leave management test suite...', 'test');
    this.log(`Testing user: engineering.manager@company.com`, 'info');

    const authenticated = await this.authenticate();
    if (!authenticated) {
      this.log('Cannot proceed without authentication', 'error');
      return this.generateReport();
    }

    await this.testBasicLeaveCreation();
    await this.testMultipleLeaveTypesForSameDateRange();
    await this.testLeaveBalanceDeduction();
    await this.testEdgeCases();
    await this.validateDatabaseConsistency();

    const report = this.generateReport();

    this.log('📊 TEST SUITE COMPLETED', 'success');
    this.log(`Total Tests: ${report.summary.totalTests}`, 'info');
    this.log(`Passed: ${report.summary.passedTests}`, 'success');
    this.log(`Failed: ${report.summary.failedTests}`, 'error');
    this.log(`Success Rate: ${report.summary.successRate}`, 'info');
    this.log(`Issues Identified: ${report.summary.identifiedIssues.length}`, 'warning');

    if (report.summary.identifiedIssues.length > 0) {
      this.log('🚨 IDENTIFIED ISSUES:', 'warning');
      report.summary.identifiedIssues.forEach((issue, index) => {
        this.log(`${index + 1}. ${issue}`, 'warning');
      });
    }

    return report;
  }
}

// Check if axios is available
async function checkDependencies() {
  try {
    await axios.get('http://localhost:3001/health');
    return true;
  } catch (error) {
    console.log('❌ Backend server not accessible. Please ensure it\'s running on localhost:3001');
    return false;
  }
}

// Main execution
async function main() {
  const canRun = await checkDependencies();
  if (!canRun) {
    process.exit(1);
  }

  const testSuite = new LeaveTestSuite();
  const report = await testSuite.runFullTestSuite();

  // Save report to file
  const fs = require('fs');
  const reportPath = './test-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);

  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = { LeaveTestSuite };