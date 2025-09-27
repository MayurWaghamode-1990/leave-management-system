const axios = require('axios');

// Basic test suite for leave management business logic
class LeaveValidationTests {
  constructor(baseUrl = 'http://localhost:3001/api/v1') {
    this.baseUrl = baseUrl;
    this.token = null;
  }

  async authenticate() {
    try {
      const response = await axios.post(`${this.baseUrl}/auth/login`, {
        email: 'engineering.manager@company.com',
        password: 'password123'
      });
      this.token = response.data.data.token;
      return true;
    } catch (error) {
      console.error('Authentication failed:', error.message);
      return false;
    }
  }

  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  async testOverlapValidation() {
    console.log('🧪 Testing date overlap validation...');

    try {
      // Generate future dates
      const futureDate1 = new Date();
      futureDate1.setDate(futureDate1.getDate() + 10);
      const futureDate2 = new Date();
      futureDate2.setDate(futureDate2.getDate() + 12);
      const futureDate3 = new Date();
      futureDate3.setDate(futureDate3.getDate() + 11);
      const futureDate4 = new Date();
      futureDate4.setDate(futureDate4.getDate() + 13);

      // Create first leave request
      const firstLeave = await axios.post(`${this.baseUrl}/leaves`, {
        type: 'CASUAL_LEAVE',
        startDate: futureDate1.toISOString().split('T')[0],
        endDate: futureDate2.toISOString().split('T')[0],
        reason: 'First leave request for overlap testing',
        isHalfDay: false
      }, { headers: this.getAuthHeaders() });

      console.log('✅ First leave created successfully');

      // Try to create overlapping leave request
      try {
        const overlappingLeave = await axios.post(`${this.baseUrl}/leaves`, {
          type: 'EARNED_LEAVE',
          startDate: futureDate3.toISOString().split('T')[0],
          endDate: futureDate4.toISOString().split('T')[0],
          reason: 'Overlapping leave request - should be rejected',
          isHalfDay: false
        }, { headers: this.getAuthHeaders() });

        console.log('❌ FAIL: Overlapping leave was allowed!');
        return false;
      } catch (error) {
        if (error.response?.status === 409) {
          console.log('✅ PASS: Overlap validation working - request correctly rejected');
          return true;
        } else {
          console.log('❌ FAIL: Wrong error type:', error.response?.data?.message);
          return false;
        }
      }
    } catch (error) {
      console.log('❌ FAIL: Test setup failed:', error.message);
      return false;
    }
  }

  async testBalanceDeduction() {
    console.log('🧪 Testing balance deduction for auto-approved leave...');

    try {
      // Get initial balance
      const initialResponse = await axios.get(`${this.baseUrl}/leaves/balances`, {
        headers: this.getAuthHeaders()
      });
      const initialBalances = initialResponse.data.data;
      const sickLeaveBalance = initialBalances.find(b => b.leaveType === 'SICK_LEAVE');
      const initialAvailable = sickLeaveBalance ? sickLeaveBalance.available : 0;

      console.log(`Initial SICK_LEAVE balance: ${initialAvailable}`);

      // Create sick leave (should be auto-approved) with future date
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      const sickLeave = await axios.post(`${this.baseUrl}/leaves`, {
        type: 'SICK_LEAVE',
        startDate: futureDate.toISOString().split('T')[0],
        endDate: futureDate.toISOString().split('T')[0],
        reason: 'Sick leave for balance deduction testing',
        isHalfDay: false
      }, { headers: this.getAuthHeaders() });

      console.log('✅ Sick leave created');

      // Check if it was auto-approved
      if (sickLeave.data.data.request.status === 'APPROVED') {
        console.log('✅ Auto-approval working');

        // Wait a moment for processing
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check updated balance
        const updatedResponse = await axios.get(`${this.baseUrl}/leaves/balances`, {
          headers: this.getAuthHeaders()
        });
        const updatedBalances = updatedResponse.data.data;
        const updatedSickBalance = updatedBalances.find(b => b.leaveType === 'SICK_LEAVE');
        const updatedAvailable = updatedSickBalance ? updatedSickBalance.available : 0;

        const expectedDeduction = 1; // 1 day leave
        const actualDeduction = initialAvailable - updatedAvailable;

        if (actualDeduction === expectedDeduction) {
          console.log('✅ PASS: Balance deduction working correctly');
          return true;
        } else {
          console.log(`❌ FAIL: Expected deduction ${expectedDeduction}, got ${actualDeduction}`);
          return false;
        }
      } else {
        console.log('❌ FAIL: Sick leave not auto-approved');
        return false;
      }
    } catch (error) {
      console.log('❌ FAIL: Balance deduction test failed:', error.response?.data?.message || error.message);
      return false;
    }
  }

  async testKeyGeneration() {
    console.log('🧪 Testing unique ID generation...');

    try {
      const requests = [];

      // Create multiple requests quickly with future dates
      for (let i = 0; i < 3; i++) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 20 + i);

        const response = await axios.post(`${this.baseUrl}/leaves`, {
          type: 'CASUAL_LEAVE',
          startDate: futureDate.toISOString().split('T')[0],
          endDate: futureDate.toISOString().split('T')[0],
          reason: `ID uniqueness test ${i + 1}`,
          isHalfDay: false
        }, { headers: this.getAuthHeaders() });

        requests.push(response.data.data.request.id);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Check if all IDs are unique
      const uniqueIds = [...new Set(requests)];
      if (uniqueIds.length === requests.length) {
        console.log('✅ PASS: All request IDs are unique');
        return true;
      } else {
        console.log('❌ FAIL: Duplicate IDs found:', requests);
        return false;
      }
    } catch (error) {
      console.log('❌ FAIL: ID generation test failed:', error.message);
      return false;
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Leave Management Unit Tests...\n');

    const authenticated = await this.authenticate();
    if (!authenticated) {
      console.log('❌ Cannot run tests without authentication');
      return;
    }

    const results = {
      overlapValidation: await this.testOverlapValidation(),
      balanceDeduction: await this.testBalanceDeduction(),
      keyGeneration: await this.testKeyGeneration()
    };

    const passed = Object.values(results).filter(Boolean).length;
    const total = Object.keys(results).length;

    console.log('\n📊 TEST RESULTS SUMMARY:');
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${total - passed}/${total}`);

    if (passed === total) {
      console.log('🎉 ALL TESTS PASSED!');
    } else {
      console.log('⚠️  Some tests failed - check implementation');
    }

    return results;
  }
}

// Run tests if this file is executed directly
async function main() {
  const tester = new LeaveValidationTests();
  await tester.runAllTests();
}

if (require.main === module) {
  main();
}

module.exports = { LeaveValidationTests };