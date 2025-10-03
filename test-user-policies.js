const axios = require('axios');

const API_BASE = 'http://localhost:3003/api/v1';

const adminAuth = { email: 'admin@company.com', password: 'admin123' };
const userAuth = { email: 'user@company.com', password: 'user123' };

async function makeRequest(method, endpoint, data = null, token = '') {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
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

async function testUserPolicyAssignment() {
  console.log('🔐 Testing User Policy Assignment Fix...\n');

  // Admin login
  const adminLogin = await makeRequest('POST', '/auth/login', adminAuth);
  if (!adminLogin.success) {
    console.log('❌ Admin login failed:', adminLogin.error);
    return;
  }
  const adminToken = adminLogin.data.data?.token || adminLogin.data.token;
  console.log('✅ Admin login successful');

  // User login
  const userLogin = await makeRequest('POST', '/auth/login', userAuth);
  if (!userLogin.success) {
    console.log('❌ User login failed:', userLogin.error);
    return;
  }
  const userToken = userLogin.data.data?.token || userLogin.data.token;
  console.log('✅ User login successful');

  // Test user policies endpoint
  console.log('\n🧪 Testing /policies/user-policies endpoint...');
  const userPolicies = await makeRequest('GET', '/policies/user-policies', null, userToken);

  if (userPolicies.success) {
    console.log('✅ User Policy Assignment: SUCCESS');
    console.log('📊 Retrieved user policies:', JSON.stringify(userPolicies.data, null, 2));
  } else {
    console.log('❌ User Policy Assignment: FAILED');
    console.log('Error details:', JSON.stringify(userPolicies.error, null, 2));
  }
}

testUserPolicyAssignment().catch(console.error);