import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users over 2 minutes
    { duration: '5m', target: 10 }, // Stay at 10 users for 5 minutes
    { duration: '2m', target: 20 }, // Ramp up to 20 users over 2 minutes
    { duration: '5m', target: 20 }, // Stay at 20 users for 5 minutes
    { duration: '2m', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests must complete below 1s
    http_req_failed: ['rate<0.1'],     // Error rate must be below 10%
    errors: ['rate<0.1'],              // Custom error rate must be below 10%
  },
};

const BASE_URL = 'http://localhost:3001/api/v1';

// Test data
const testUsers = [
  { email: 'test1@company.com', password: 'password123' },
  { email: 'test2@company.com', password: 'password123' },
  { email: 'test3@company.com', password: 'password123' },
];

let authToken = '';

export function setup() {
  // Setup test data - create test users and get auth token
  const loginResponse = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: 'admin@company.com',
    password: 'admin123'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (loginResponse.status === 200) {
    const body = JSON.parse(loginResponse.body);
    return { token: body.data.token };
  }

  return { token: '' };
}

export default function(data) {
  const token = data.token;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // Test scenarios with weights
  const scenarios = [
    { weight: 40, name: 'health_check' },
    { weight: 30, name: 'get_leave_balance' },
    { weight: 20, name: 'get_leave_requests' },
    { weight: 10, name: 'create_leave_request' },
  ];

  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];

  switch (scenario.name) {
    case 'health_check':
      testHealthCheck();
      break;
    case 'get_leave_balance':
      testGetLeaveBalance(headers);
      break;
    case 'get_leave_requests':
      testGetLeaveRequests(headers);
      break;
    case 'create_leave_request':
      testCreateLeaveRequest(headers);
      break;
  }

  sleep(1); // Think time between requests
}

function testHealthCheck() {
  const response = http.get(`${BASE_URL}/health`);

  const result = check(response, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 100ms': (r) => r.timings.duration < 100,
  });

  errorRate.add(!result);
}

function testGetLeaveBalance(headers) {
  const response = http.get(`${BASE_URL}/leave-balance`, { headers });

  const result = check(response, {
    'leave balance status is 200': (r) => r.status === 200,
    'leave balance response time < 500ms': (r) => r.timings.duration < 500,
    'leave balance has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true && Array.isArray(body.data);
      } catch (e) {
        return false;
      }
    },
  });

  errorRate.add(!result);
}

function testGetLeaveRequests(headers) {
  const params = {
    page: Math.floor(Math.random() * 3) + 1,
    limit: 10,
    status: ['PENDING', 'APPROVED', 'REJECTED'][Math.floor(Math.random() * 3)],
  };

  const url = `${BASE_URL}/leave-requests?${Object.entries(params)
    .map(([k, v]) => `${k}=${v}`)
    .join('&')}`;

  const response = http.get(url, { headers });

  const result = check(response, {
    'leave requests status is 200': (r) => r.status === 200,
    'leave requests response time < 1000ms': (r) => r.timings.duration < 1000,
    'leave requests has pagination': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true && body.data.pagination;
      } catch (e) {
        return false;
      }
    },
  });

  errorRate.add(!result);
}

function testCreateLeaveRequest(headers) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30) + 1);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 5) + 1);

  const leaveRequest = {
    leaveTypeId: 'annual_leave',
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    isHalfDay: Math.random() > 0.8,
    reason: `Load test request ${Math.random().toString(36).substring(7)}`,
  };

  const response = http.post(
    `${BASE_URL}/leave-requests`,
    JSON.stringify(leaveRequest),
    { headers }
  );

  const result = check(response, {
    'create leave request status is 201': (r) => r.status === 201,
    'create leave request response time < 2000ms': (r) => r.timings.duration < 2000,
    'create leave request returns ID': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true && body.data.id;
      } catch (e) {
        return false;
      }
    },
  });

  errorRate.add(!result);
}

export function teardown(data) {
  // Cleanup test data if needed
  console.log('Load test completed');
}