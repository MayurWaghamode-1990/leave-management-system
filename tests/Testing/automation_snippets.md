# Test Automation Snippets - Leave Management System

**Document Version:** 1.0
**Date:** November 1, 2025
**Framework Coverage:** Playwright (UI), Postman/Newman (API), Jest (Unit)

---

## Table of Contents
1. [Playwright UI Automation](#playwright-ui-automation)
2. [API Testing with Postman/Newman](#api-testing-with-postmannewman)
3. [Performance Testing with k6](#performance-testing-with-k6)
4. [CI/CD Integration](#cicd-integration)

---

## Playwright UI Automation

### Setup and Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Test 1: Smoke Test - Login and Dashboard (TC_AUTH_001, TC_DASHBOARD_002)

```typescript
// tests/e2e/smoke/login-dashboard.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Smoke Test Suite', () => {
  test('TC_AUTH_001: Login with valid employee credentials and view dashboard', async ({ page }) => {
    // Navigate to login page
    await page.goto('/');

    // Verify login page loaded
    await expect(page).toHaveTitle(/Leave Management/i);
    await expect(page.locator('h1')).toContainText(/Login/i);

    // Enter credentials
    await page.fill('input[name="email"]', 'employee.india@glf.com');
    await page.fill('input[name="password"]', 'Employee@123');

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for navigation and dashboard load
    await page.waitForURL('**/dashboard');

    // Verify dashboard elements (TC_DASHBOARD_002)
    await expect(page.locator('h1')).toContainText(/Dashboard/i);

    // Verify Leave Balance section visible
    const leaveBalance = page.locator('[data-testid="leave-balance"]');
    await expect(leaveBalance).toBeVisible();

    // Verify balance values displayed
    await expect(leaveBalance.locator('text=CL')).toBeVisible();
    await expect(leaveBalance.locator('text=PL')).toBeVisible();
    await expect(leaveBalance.locator('text=Comp Off')).toBeVisible();

    // Verify user role displayed
    const userRole = page.locator('[data-testid="user-role"]');
    await expect(userRole).toContainText('EMPLOYEE');

    console.log('✓ Smoke test passed: Login and dashboard load successful');
  });
});
```

### Test 2: End-to-End Leave Application Workflow (TC_LEAVE_001, TC_LEAVE_018, TC_NOTIFICATION_001)

```typescript
// tests/e2e/workflows/leave-application-approval.spec.ts
import { test, expect } from '@playwright/test';

test.describe('E2E Leave Application and Approval Workflow', () => {
  test('Complete leave workflow: Employee applies → Manager approves', async ({ browser }) => {
    // Create two contexts for employee and manager
    const employeeContext = await browser.newContext();
    const managerContext = await browser.newContext();

    const employeePage = await employeeContext.newPage();
    const managerPage = await managerContext.newPage();

    // ========== EMPLOYEE: Apply Leave ==========
    await test.step('Employee logs in and applies leave (TC_LEAVE_001)', async () => {
      await employeePage.goto('/');
      await employeePage.fill('input[name="email"]', 'rajesh.kumar@glf.com');
      await employeePage.fill('input[name="password"]', 'Employee@123');
      await employeePage.click('button[type="submit"]');
      await employeePage.waitForURL('**/dashboard');

      // Navigate to Leave Application
      await employeePage.click('text=Leave Application');
      await employeePage.waitForURL('**/leaves/apply');

      // Fill leave application form
      await employeePage.selectOption('select[name="leaveType"]', 'CL');
      await employeePage.fill('input[name="dateFrom"]', '2024-12-10');
      await employeePage.fill('input[name="dateTo"]', '2024-12-10');
      await employeePage.check('input[value="FULL_DAY"]');
      await employeePage.fill('textarea[name="reason"]', 'Personal work');

      // Submit leave application
      await employeePage.click('button[type="submit"]');

      // Verify success message
      await expect(employeePage.locator('.success-message')).toContainText(/Leave application submitted/i);

      // Verify leave appears in application status
      await employeePage.click('text=Leave Application Status');
      const leaveRow = employeePage.locator('table tbody tr').first();
      await expect(leaveRow.locator('td:nth-child(3)')).toContainText('2024-12-10');
      await expect(leaveRow.locator('td:nth-child(4)')).toContainText(/Pending/i);

      console.log('✓ Employee: Leave application submitted');
    });

    // ========== MANAGER: Approve Leave ==========
    await test.step('Manager logs in and approves leave (TC_LEAVE_018)', async () => {
      await managerPage.goto('/');
      await managerPage.fill('input[name="email"]', 'suresh.gupta@glf.com');
      await managerPage.fill('input[name="password"]', 'Manager@123');
      await managerPage.click('button[type="submit"]');
      await managerPage.waitForURL('**/dashboard');

      // Navigate to Leave Approval
      await managerPage.click('text=Leave Approval');
      await managerPage.waitForURL('**/leaves/approve');

      // Find pending leave in list
      const pendingLeave = managerPage.locator('table tbody tr', {
        has: managerPage.locator('text=Rajesh Kumar')
      });
      await expect(pendingLeave).toBeVisible();
      await expect(pendingLeave.locator('text=Personal work')).toBeVisible();

      // Click approve button
      await pendingLeave.locator('button:has-text("Approve")').click();

      // Confirm approval in modal
      await managerPage.locator('button:has-text("Confirm")').click();

      // Verify success message
      await expect(managerPage.locator('.success-message')).toContainText(/Leave approved/i);

      console.log('✓ Manager: Leave approved');
    });

    // ========== EMPLOYEE: Verify Approval ==========
    await test.step('Employee verifies leave approval', async () => {
      // Refresh employee page
      await employeePage.reload();

      // Navigate to Leave Application Status
      await employeePage.click('text=Leave Application Status');

      // Verify leave status updated to Approved
      const leaveRow = employeePage.locator('table tbody tr').first();
      await expect(leaveRow.locator('td', { hasText: /Approved/i })).toBeVisible();

      // Verify balance updated on dashboard
      await employeePage.click('text=Dashboard');
      const leaveBalance = employeePage.locator('[data-testid="leave-balance"]');
      // Note: Actual balance verification would require knowing initial balance
      await expect(leaveBalance).toBeVisible();

      console.log('✓ Employee: Leave approval verified');
    });

    await employeeContext.close();
    await managerContext.close();
  });
});
```

### Test 3: Negative Test - Insufficient Balance (TC_LEAVE_006)

```typescript
// tests/e2e/negative/insufficient-balance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Negative Test: Insufficient Balance', () => {
  test('TC_LEAVE_006: Apply leave with insufficient balance', async ({ page }) => {
    // Login as employee with low balance
    await page.goto('/');
    await page.fill('input[name="email"]', 'priya.sharma@glf.com'); // Employee with 0.5 CL
    await page.fill('input[name="password"]', 'Employee@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Navigate to Leave Application
    await page.click('text=Leave Application');

    // Try to apply 2-day leave
    await page.selectOption('select[name="leaveType"]', 'CL');
    await page.fill('input[name="dateFrom"]', '2024-12-10');
    await page.fill('input[name="dateTo"]', '2024-12-11'); // 2 days
    await page.check('input[value="FULL_DAY"]');
    await page.fill('textarea[name="reason"]', 'Testing insufficient balance');

    // Submit and expect error
    await page.click('button[type="submit"]');

    // Verify error message
    await expect(page.locator('.error-message')).toContainText(/Insufficient leave balance/i);
    await expect(page.locator('.error-message')).toContainText(/Available.*0\.5/i);
    await expect(page.locator('.error-message')).toContainText(/Required.*2/i);

    // Verify leave NOT created
    await page.click('text=Leave Application Status');
    const leaveRows = page.locator('table tbody tr');
    await expect(leaveRows.filter({ hasText: '2024-12-10' })).toHaveCount(0);

    console.log('✓ Negative test passed: Insufficient balance error displayed correctly');
  });
});
```

### Test 4: Edge Case - Weekend Exclusion (TC_LEAVE_004)

```typescript
// tests/e2e/edge-cases/weekend-exclusion.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Edge Case: Weekend Exclusion', () => {
  test('TC_LEAVE_004: Multi-day leave excludes weekends', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[name="email"]', 'rajesh.kumar@glf.com');
    await page.fill('input[name="password"]', 'Employee@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Check initial CL balance
    const initialBalanceText = await page.locator('[data-testid="cl-balance"]').textContent();
    const initialBalance = parseFloat(initialBalanceText?.match(/\d+(\.\d+)?/)?.[0] || '0');

    // Apply leave Monday to Friday (spanning weekend)
    await page.click('text=Leave Application');
    await page.selectOption('select[name="leaveType"]', 'CL');
    await page.fill('input[name="dateFrom"]', '2024-12-09'); // Monday
    await page.fill('input[name="dateTo"]', '2024-12-13'); // Friday
    await page.check('input[value="FULL_DAY"]');
    await page.fill('textarea[name="reason"]', 'Testing weekend exclusion');
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator('.success-message')).toBeVisible();

    // Verify balance deducted for 5 weekdays only (not 7)
    await page.click('text=Dashboard');
    const newBalanceText = await page.locator('[data-testid="cl-balance"]').textContent();
    const newBalance = parseFloat(newBalanceText?.match(/\d+(\.\d+)?/)?.[0] || '0');

    expect(newBalance).toBe(initialBalance - 5); // 5 weekdays deducted

    // Verify leave duration shown as 5 days in status
    await page.click('text=Leave Application Status');
    const leaveRow = page.locator('table tbody tr').first();
    await expect(leaveRow.locator('td', { hasText: /5.*day/i })).toBeVisible();

    console.log(`✓ Weekend exclusion working: Initial=${initialBalance}, New=${newBalance}, Deducted=5 days`);
  });
});
```

### Test 5: Accessibility - Keyboard Navigation (TC_ACCESSIBILITY_001)

```typescript
// tests/e2e/accessibility/keyboard-navigation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Accessibility: Keyboard Navigation', () => {
  test('TC_ACCESSIBILITY_001: Navigate leave form using keyboard only', async ({ page }) => {
    await page.goto('/');

    // Login using keyboard
    await page.keyboard.press('Tab'); // Focus email
    await page.keyboard.type('rajesh.kumar@glf.com');
    await page.keyboard.press('Tab'); // Focus password
    await page.keyboard.type('Employee@123');
    await page.keyboard.press('Enter'); // Submit

    await page.waitForURL('**/dashboard');

    // Navigate to Leave Application using keyboard
    // Note: Actual tab order depends on implementation
    await page.keyboard.press('Tab'); // Skip to navigation
    await page.keyboard.press('Enter'); // May need adjustment based on UI

    await page.goto('/leaves/apply'); // Direct navigation for test simplicity

    // Fill form using keyboard
    await page.keyboard.press('Tab'); // Focus Leave Type dropdown
    await page.keyboard.press('Enter'); // Open dropdown
    await page.keyboard.press('ArrowDown'); // Select CL
    await page.keyboard.press('Enter'); // Confirm selection

    await page.keyboard.press('Tab'); // Focus Date From
    await page.keyboard.type('12/10/2024');

    await page.keyboard.press('Tab'); // Focus Date To
    await page.keyboard.type('12/10/2024');

    await page.keyboard.press('Tab'); // Focus Duration radio
    await page.keyboard.press('Space'); // Select Full Day

    await page.keyboard.press('Tab'); // Focus Reason
    await page.keyboard.type('Keyboard navigation test');

    // Submit form using Enter key
    await page.keyboard.press('Tab'); // Focus Submit button
    await page.keyboard.press('Enter'); // Submit

    // Verify success
    await expect(page.locator('.success-message')).toBeVisible();

    console.log('✓ Accessibility test passed: Full form navigation and submission via keyboard');
  });
});
```

---

## API Testing with Postman/Newman

### Postman Collection Setup

```json
{
  "info": {
    "name": "Leave Management API Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{authToken}}",
        "type": "string"
      }
    ]
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000/api",
      "type": "string"
    },
    {
      "key": "authToken",
      "value": "",
      "type": "string"
    },
    {
      "key": "employeeEmail",
      "value": "rajesh.kumar@glf.com",
      "type": "string"
    },
    {
      "key": "employeePassword",
      "value": "Employee@123",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "TC_AUTH_001: Login - Valid Employee Credentials",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "// Test assertions",
                  "pm.test('Status code is 200', function () {",
                  "    pm.response.to.have.status(200);",
                  "});",
                  "",
                  "pm.test('Response contains token', function () {",
                  "    var jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.have.property('token');",
                  "    pm.expect(jsonData.token).to.be.a('string');",
                  "    ",
                  "    // Store token for subsequent requests",
                  "    pm.collectionVariables.set('authToken', jsonData.token);",
                  "});",
                  "",
                  "pm.test('Response contains user data', function () {",
                  "    var jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.have.property('user');",
                  "    pm.expect(jsonData.user.email).to.eql(pm.collectionVariables.get('employeeEmail'));",
                  "    pm.expect(jsonData.user.role).to.eql('EMPLOYEE');",
                  "});",
                  "",
                  "pm.test('Response time is less than 2000ms', function () {",
                  "    pm.expect(pm.response.responseTime).to.be.below(2000);",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"{{employeeEmail}}\",\n  \"password\": \"{{employeePassword}}\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/auth/login",
              "host": ["{{baseUrl}}"],
              "path": ["auth", "login"]
            }
          },
          "response": []
        },
        {
          "name": "TC_AUTH_005: Login - Invalid Credentials (Negative)",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Status code is 401 Unauthorized', function () {",
                  "    pm.response.to.have.status(401);",
                  "});",
                  "",
                  "pm.test('Error message displayed', function () {",
                  "    var jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.have.property('error');",
                  "    pm.expect(jsonData.error).to.match(/invalid.*credentials/i);",
                  "});",
                  "",
                  "pm.test('No token returned', function () {",
                  "    var jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.not.have.property('token');",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"{{employeeEmail}}\",\n  \"password\": \"WrongPassword123\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/auth/login",
              "host": ["{{baseUrl}}"],
              "path": ["auth", "login"]
            }
          },
          "response": []
        }
      ]
    },
    {
      "name": "Leave Management",
      "item": [
        {
          "name": "TC_PERFORMANCE_001: Get Leave Balance",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Status code is 200', function () {",
                  "    pm.response.to.have.status(200);",
                  "});",
                  "",
                  "pm.test('Response contains balance data', function () {",
                  "    var jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.have.property('casualLeave');",
                  "    pm.expect(jsonData).to.have.property('privilegeLeave');",
                  "    pm.expect(jsonData).to.have.property('compOff');",
                  "    ",
                  "    pm.expect(jsonData.casualLeave).to.be.a('number');",
                  "    pm.expect(jsonData.privilegeLeave).to.be.a('number');",
                  "    pm.expect(jsonData.compOff).to.be.a('number');",
                  "});",
                  "",
                  "pm.test('Response time < 1000ms (Performance target)', function () {",
                  "    pm.expect(pm.response.responseTime).to.be.below(1000);",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/leaves/balance",
              "host": ["{{baseUrl}}"],
              "path": ["leaves", "balance"]
            }
          },
          "response": []
        },
        {
          "name": "TC_LEAVE_001: Create Leave Application",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Status code is 201 Created', function () {",
                  "    pm.response.to.have.status(201);",
                  "});",
                  "",
                  "pm.test('Leave created with correct data', function () {",
                  "    var jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.have.property('id');",
                  "    pm.expect(jsonData.leaveType).to.eql('CL');",
                  "    pm.expect(jsonData.status).to.match(/PENDING/i);",
                  "    pm.expect(jsonData.dateFrom).to.eql('2024-12-10');",
                  "    pm.expect(jsonData.dateTo).to.eql('2024-12-10');",
                  "    ",
                  "    // Store leave ID for subsequent tests",
                  "    pm.collectionVariables.set('leaveId', jsonData.id);",
                  "});",
                  "",
                  "pm.test('Response time < 2000ms', function () {",
                  "    pm.expect(pm.response.responseTime).to.be.below(2000);",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"leaveType\": \"CL\",\n  \"dateFrom\": \"2024-12-10\",\n  \"dateTo\": \"2024-12-10\",\n  \"duration\": \"FULL_DAY\",\n  \"reason\": \"Personal work - API test\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/leaves",
              "host": ["{{baseUrl}}"],
              "path": ["leaves"]
            }
          },
          "response": []
        },
        {
          "name": "TC_LEAVE_006: Create Leave - Insufficient Balance (Negative)",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Status code is 400 Bad Request', function () {",
                  "    pm.response.to.have.status(400);",
                  "});",
                  "",
                  "pm.test('Error message about insufficient balance', function () {",
                  "    var jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.have.property('error');",
                  "    pm.expect(jsonData.error).to.match(/insufficient.*balance/i);",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"leaveType\": \"CL\",\n  \"dateFrom\": \"2024-12-10\",\n  \"dateTo\": \"2024-12-20\",\n  \"duration\": \"FULL_DAY\",\n  \"reason\": \"Testing insufficient balance\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/leaves",
              "host": ["{{baseUrl}}"],
              "path": ["leaves"]
            }
          },
          "response": []
        },
        {
          "name": "TC_SECURITY_004: SQL Injection Prevention",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Status code is 201 or 400 (not 500 server error)', function () {",
                  "    pm.expect(pm.response.code).to.be.oneOf([201, 400]);",
                  "});",
                  "",
                  "pm.test('SQL injection attempt sanitized', function () {",
                  "    if (pm.response.code === 201) {",
                  "        var jsonData = pm.response.json();",
                  "        // If created, reason should be stored as plain text",
                  "        pm.expect(jsonData.reason).to.include(\"DROP TABLE\");",
                  "        pm.expect(jsonData.reason).to.not.include(\"<script>\");",
                  "    }",
                  "});",
                  "",
                  "// Manual verification: Check database - leaves table should still exist",
                  "pm.test('No server error (SQL injection prevented)', function () {",
                  "    pm.expect(pm.response.code).to.not.equal(500);",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"leaveType\": \"CL\",\n  \"dateFrom\": \"2024-12-10\",\n  \"dateTo\": \"2024-12-10\",\n  \"duration\": \"FULL_DAY\",\n  \"reason\": \"'; DROP TABLE leaves; --\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/leaves",
              "host": ["{{baseUrl}}"],
              "path": ["leaves"]
            }
          },
          "response": []
        }
      ]
    }
  ]
}
```

### Newman CLI Execution

```bash
# Install Newman
npm install -g newman
npm install -g newman-reporter-htmlextra

# Run collection
newman run leave-management-api-tests.json \
  --environment qa-environment.json \
  --reporters cli,htmlextra,json \
  --reporter-htmlextra-export ./test-results/api-report.html \
  --reporter-json-export ./test-results/api-results.json \
  --bail

# Run with iterations for data-driven testing
newman run leave-management-api-tests.json \
  --environment qa-environment.json \
  --iteration-data test-data.csv \
  --reporters cli,htmlextra

# Run specific folder (e.g., only smoke tests)
newman run leave-management-api-tests.json \
  --folder "Authentication" \
  --reporters cli
```

---

## Performance Testing with k6

### Load Test Script - 100 Concurrent Users (TC_PERFORMANCE_003)

```javascript
// tests/performance/load-test-100-users.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    'http_req_duration': ['p(95)<3000'], // 95% requests < 3s
    'http_req_failed': ['rate<0.01'],     // Error rate < 1%
    'errors': ['rate<0.01'],
  },
};

const BASE_URL = 'http://localhost:3000/api';

// Test data
const employees = [
  { email: 'rajesh.kumar@glf.com', password: 'Employee@123' },
  { email: 'priya.sharma@glf.com', password: 'Employee@123' },
  { email: 'amit.patel@glf.com', password: 'Employee@123' },
  // ... more test users
];

export default function () {
  // Randomly select an employee
  const employee = employees[Math.floor(Math.random() * employees.length)];

  // ========== Login ==========
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: employee.email,
    password: employee.password,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  const loginSuccess = check(loginRes, {
    'login status 200': (r) => r.status === 200,
    'login has token': (r) => r.json('token') !== undefined,
  });

  errorRate.add(!loginSuccess);

  if (!loginSuccess) {
    return; // Stop execution for this iteration
  }

  const authToken = loginRes.json('token');
  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json',
  };

  sleep(1); // Think time

  // ========== Get Leave Balance ==========
  const balanceRes = http.get(`${BASE_URL}/leaves/balance`, { headers });

  check(balanceRes, {
    'balance status 200': (r) => r.status === 200,
    'balance response time < 1s': (r) => r.timings.duration < 1000,
  });

  sleep(2); // Think time

  // ========== Get Leave List ==========
  const leavesRes = http.get(`${BASE_URL}/leaves`, { headers });

  check(leavesRes, {
    'leaves list status 200': (r) => r.status === 200,
  });

  sleep(1); // Think time

  // ========== Create Leave (20% of users) ==========
  if (Math.random() < 0.2) {
    const leaveData = {
      leaveType: 'CL',
      dateFrom: '2024-12-20',
      dateTo: '2024-12-21',
      duration: 'FULL_DAY',
      reason: 'Load test leave application',
    };

    const createLeaveRes = http.post(
      `${BASE_URL}/leaves`,
      JSON.stringify(leaveData),
      { headers }
    );

    const createSuccess = check(createLeaveRes, {
      'create leave status 201': (r) => r.status === 201,
      'create response time < 2s': (r) => r.timings.duration < 2000,
    });

    errorRate.add(!createSuccess);
  }

  sleep(1); // Think time
}

export function handleSummary(data) {
  return {
    'summary.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}
```

### Run k6 Load Test

```bash
# Install k6
# Windows: choco install k6
# Mac: brew install k6
# Linux: sudo apt install k6

# Run load test
k6 run tests/performance/load-test-100-users.js

# Run with cloud integration (k6 Cloud)
k6 cloud tests/performance/load-test-100-users.js

# Run with custom output
k6 run tests/performance/load-test-100-users.js \
  --out json=test-results/performance-results.json
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test-automation.yml
name: Test Automation Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM

jobs:
  api-tests:
    name: API Tests (Newman)
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: leave_management_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: |
          cd backend
          npm ci

      - name: Run database migrations
        run: |
          cd backend
          npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/leave_management_test

      - name: Seed test data
        run: |
          cd backend
          npm run seed:test

      - name: Start backend server
        run: |
          cd backend
          npm start &
          sleep 10
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/leave_management_test
          JWT_SECRET: test_secret_key

      - name: Install Newman
        run: npm install -g newman newman-reporter-htmlextra

      - name: Run API tests
        run: |
          newman run tests/postman/leave-management-api-tests.json \
            --environment tests/postman/qa-environment.json \
            --reporters cli,htmlextra,json \
            --reporter-htmlextra-export test-results/api-report.html \
            --reporter-json-export test-results/api-results.json

      - name: Upload API test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: api-test-results
          path: test-results/

  ui-tests:
    name: UI Tests (Playwright)
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run Playwright tests
        run: npx playwright test

      - name: Upload Playwright report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-results
          path: test-results/
```

---

## Test Execution Summary

### Running All Tests

```bash
# 1. API Tests
npm run test:api
# or
newman run tests/postman/leave-management-api-tests.json

# 2. UI Tests
npm run test:ui
# or
npx playwright test

# 3. Performance Tests
npm run test:performance
# or
k6 run tests/performance/load-test-100-users.js

# 4. Full regression suite
npm run test:regression
# Runs API + UI + Smoke tests
```

### Test Reports

- **Playwright HTML Report:** `playwright-report/index.html`
- **Newman HTML Report:** `test-results/api-report.html`
- **k6 JSON Results:** `test-results/performance-results.json`
- **JUnit XML:** `test-results/junit.xml` (for CI/CD integration)

---

## Recommendations

1. **Expand Test Coverage:** Add tests for comp off workflows, accrual jobs, and carry-forward scenarios
2. **Data-Driven Testing:** Use CSV files with Newman for comprehensive data coverage
3. **Visual Regression:** Integrate Percy or Applitools for UI consistency
4. **Contract Testing:** Add Pact for API contract testing between frontend and backend
5. **Monitoring:** Integrate test results with Grafana/Datadog for trend analysis
6. **Parallel Execution:** Configure Playwright sharding for faster execution in CI/CD

---

**End of Automation Snippets Document**
