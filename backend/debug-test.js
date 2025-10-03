const makeRequest = async (method, endpoint, data = null, token = '') => {
  try {
    const config = {
      method,
      url: 'http://localhost:3003/api/v1' + endpoint,
      headers: token ? { 'Authorization': 'Bearer ' + token } : {},
      data
    };

    const response = await require('axios')(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
};

const adminToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbi0wMDEiLCJlbWFpbCI6ImFkbWluQGNvbXBhbnkuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzU5MTQ3NDI5LCJleHAiOjE3NTk3NTIyMjl9.9F2Z9S_Rt2OgJAA3MUX1vDmF0HJ8fgB8F8Q9tSQsaFE';

(async () => {
  const result = await makeRequest('POST', '/special-leave-types/check-eligibility', {
    employeeId: 'admin-001',
    leaveType: 'MATERNITY_LEAVE'
  }, adminToken);
  
  console.log('Full result:', JSON.stringify(result, null, 2));
  console.log('result.success:', result.success);
  console.log('result.data:', result.data);
  console.log('result.data?.data:', result.data?.data);
  console.log('result.data?.data?.eligible:', result.data?.data?.eligible);
})();

