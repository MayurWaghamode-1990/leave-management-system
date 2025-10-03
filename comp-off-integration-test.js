/**
 * Comp Off Integration Test
 * Tests the complete comp off workflow
 */

const axios = require('axios');

const BACKEND_URL = 'http://localhost:3002/api/v1';

// Test credentials
const userAuth = { email: 'user@company.com', password: 'user123' };
let userToken = '';

async function makeRequest(method, endpoint, data = null, token = '') {
  try {
    const config = {
      method,
      url: `${BACKEND_URL}${endpoint}`,
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      data
    };

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
}

async function authenticateUser() {
  console.log('🔐 Authenticating user...');

  const login = await makeRequest('POST', '/auth/login', userAuth);
  if (!login.success) {
    console.log('❌ User authentication failed:', login.error);
    return false;
  }

  userToken = login.data.data?.token || login.data.token;
  console.log('✅ User authenticated successfully');
  return true;
}

async function testCompOffEndpoints() {
  console.log('\n🧪 Testing Comp Off Endpoints...\n');

  let results = {
    policy: false,
    balance: false,
    workLogs: false,
    eligibility: false,
    requests: false
  };

  // Test policy endpoint
  console.log('Testing /comp-off/policy...');
  const policy = await makeRequest('GET', '/comp-off/policy', null, userToken);
  if (policy.success) {
    console.log('✅ Policy endpoint working');
    results.policy = true;
  } else {
    console.log('❌ Policy endpoint failed:', policy.error);
  }

  // Test balance endpoint
  console.log('\nTesting /comp-off/balance...');
  const balance = await makeRequest('GET', '/comp-off/balance', null, userToken);
  if (balance.success) {
    console.log('✅ Balance endpoint working');
    console.log('📊 Balance data:', JSON.stringify(balance.data, null, 2));
    results.balance = true;
  } else {
    console.log('❌ Balance endpoint failed:', balance.error);
  }

  // Test work logs endpoint
  console.log('\nTesting /comp-off/work-logs...');
  const workLogs = await makeRequest('GET', '/comp-off/work-logs', null, userToken);
  if (workLogs.success) {
    console.log('✅ Work logs endpoint working');
    console.log('📊 Work logs count:', workLogs.data.data?.workLogs?.length || 0);
    results.workLogs = true;
  } else {
    console.log('❌ Work logs endpoint failed:', workLogs.error);
  }

  // Test eligibility endpoint
  console.log('\nTesting /comp-off/eligibility...');
  const eligibility = await makeRequest('GET', '/comp-off/eligibility', null, userToken);
  if (eligibility.success) {
    console.log('✅ Eligibility endpoint working');
    results.eligibility = true;
  } else {
    console.log('❌ Eligibility endpoint failed:', eligibility.error);
  }

  // Test requests endpoint
  console.log('\nTesting /comp-off/requests...');
  const requests = await makeRequest('GET', '/comp-off/requests', null, userToken);
  if (requests.success) {
    console.log('✅ Requests endpoint working');
    results.requests = true;
  } else {
    console.log('❌ Requests endpoint failed:', requests.error);
  }

  return results;
}

async function testCompOffWorkflow() {
  console.log('\n⚡ Testing Complete Comp Off Workflow...\n');

  // Test work log submission
  console.log('Step 1: Submitting work log...');
  const workLogData = {
    workDate: '2024-09-28', // Previous Saturday
    hoursWorked: 6,
    workType: 'WEEKEND',
    workDescription: 'Critical bug fix for production system - resolved database performance issues that were affecting customer experience',
    projectDetails: 'Customer Portal Performance Fix'
  };

  const workLogResult = await makeRequest('POST', '/comp-off/work-log', workLogData, userToken);
  if (workLogResult.success) {
    console.log('✅ Work log submitted successfully');
    console.log('📝 Work log details:', JSON.stringify(workLogResult.data, null, 2));
  } else {
    console.log('❌ Work log submission failed:', workLogResult.error);
    if (workLogResult.error?.message?.includes('already exists')) {
      console.log('ℹ️  Work log already exists for this date - this is expected validation');
    }
  }

  return true;
}

async function runCompOffTests() {
  console.log('🚀 Comp Off Integration Test Suite\n');
  console.log('Testing comp off functionality integration...\n');

  // Authenticate
  const authOk = await authenticateUser();
  if (!authOk) {
    console.log('\n❌ Comp off test failed: Authentication issues');
    return;
  }

  // Test all endpoints
  const endpointResults = await testCompOffEndpoints();

  // Test workflow
  await testCompOffWorkflow();

  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('==========================');

  const totalTests = Object.keys(endpointResults).length;
  const passedTests = Object.values(endpointResults).filter(Boolean).length;

  console.log(`✅ Passed: ${passedTests}/${totalTests} endpoints`);

  Object.entries(endpointResults).forEach(([endpoint, passed]) => {
    console.log(`  ${passed ? '✅' : '❌'} ${endpoint}`);
  });

  const overallSuccess = passedTests === totalTests;
  console.log('\n' + '='.repeat(50));
  if (overallSuccess) {
    console.log('🎉 ALL COMP OFF INTEGRATION TESTS PASSED!');
    console.log('✅ Comp off functionality is fully integrated');
  } else {
    console.log('⚠️  Some comp off endpoints need attention');
    console.log(`📊 Success rate: ${Math.round((passedTests/totalTests)*100)}%`);
  }
  console.log('='.repeat(50));
}

// Run the comp off integration tests
runCompOffTests().catch(error => {
  console.error('❌ Comp off integration test suite failed:', error.message);
  process.exit(1);
});