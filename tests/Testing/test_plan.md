# Leave Management System - Comprehensive Test Plan

**Document Version:** 1.0
**Date:** November 1, 2025
**Prepared By:** QA Architecture Team
**Project:** GLF Leave Management System (India & USA)

---

## Executive Summary

This test plan outlines the comprehensive testing strategy for the Leave Management System supporting both India and USA leave policies. The system manages multiple leave types, multi-level approval workflows, compensatory offs, automated accruals, and integrations with calendar and email systems.

### High-Risk Areas Identified
1. **Leave Balance Calculations** - Financial impact, salary deductions
2. **Multi-level Approval Chains** - Business process critical
3. **Accrual Logic** - Complex rules for India (monthly) and USA (annual/prorated)
4. **Carry-Forward Rules** - Year-end processing, potential data loss
5. **Comp Off Expiry** - 3-month auto-expiry logic
6. **Weekend/Holiday Exclusion** - Date calculation errors
7. **Maternity/Paternity Eligibility** - Legal compliance requirements
8. **Data Integrity on Delete/Update** - Cascading effects
9. **Concurrent Approval Actions** - Race conditions
10. **Security & Role-Based Access Control** - Data privacy violations

---

## 1. Test Objectives

### Primary Objectives
- Validate all functional requirements as per GLF requirements document
- Ensure data integrity across all CRUD operations
- Verify role-based access control (Employee, Manager, HR, Admin)
- Validate business rules for India and USA leave policies
- Test multi-level approval workflows
- Ensure accurate leave balance calculations
- Verify automated accrual processes
- Test edge cases and boundary conditions
- Validate security and data privacy
- Ensure performance under load
- Verify integration points (Email, Calendar)

### Success Criteria
- **Functional Coverage:** 100% of requirements mapped to test cases
- **Pass Rate Target:** ≥ 98% for critical/high priority tests
- **Defect Density:** < 2 critical defects per module
- **Performance:** API response time < 2s for 95th percentile
- **Security:** Zero high-severity vulnerabilities
- **Accessibility:** WCAG 2.1 Level AA compliance for critical flows

---

## 2. Scope

### In Scope

#### Functional Testing
- **Leave Management Module**
  - Leave types (India: CL, PL, Maternity, Paternity, LWP, Comp Off)
  - Leave types (USA: PTO, Bereavement, LWP, Comp Off)
  - Leave application (full day, half day, date ranges)
  - Leave balance viewing and calculations
  - Leave approval/rejection workflows
  - Leave cancellation and modifications
  - Leave history and audit trails

- **Comp Off Module**
  - Comp off request and approval
  - Comp off balance tracking
  - 3-month expiry logic
  - Weekend/holiday work validation
  - Hour-based comp off calculation (5 hrs = 0.5 day, 8 hrs = 1 day)

- **Accrual System**
  - India: Monthly accrual (1 CL + 1 PL on 1st of month)
  - India: Joining-based allocation (full if joined 1-15, 0.5 if after 15)
  - USA: Annual PTO allocation (AVP & below: 15 days, VP+: 20 days)
  - USA: Mid-year joining prorated calculation

- **Carry-Forward Rules**
  - India: CL expires Dec 31, PL max 30 days carry-forward
  - USA: AVP & below can carry max 5 days, VP+ no carry-forward

- **Dashboard & Reporting**
  - Leave balance display
  - Booked leaves section
  - Approved leaves status
  - Upcoming holidays
  - Team calendar
  - Leave reports (trend, by type, by team)

- **Holiday Management**
  - India and USA holiday lists
  - Holiday reminders
  - Weekend exclusion in leave calculations

- **Multi-Level Approvals**
  - Leave: Employee → L1 Manager → HR
  - Comp Off: Employee → L1 Manager → L2 Manager → HR

- **Notifications**
  - Email notifications for all actions
  - CC to HR and Manager
  - Approve/Reject links in emails
  - Comp off expiry reminders

#### Integration Testing
- Email service integration
- Calendar sync (Outlook/Google Calendar)
- Database transactions and rollback
- API endpoint integration

#### Non-Functional Testing
- **Performance Testing**
  - Load testing (concurrent users: 100, 500, 1000)
  - Stress testing (bulk leave uploads: 10K records)
  - Response time benchmarks
  - Database query optimization

- **Security Testing**
  - Authentication and authorization
  - Role-based access control
  - SQL injection prevention
  - XSS prevention
  - CSRF protection
  - API token validation
  - Data encryption in transit and at rest

- **Usability Testing**
  - UI/UX flow validation
  - Accessibility (keyboard navigation, screen readers)
  - Mobile responsiveness

- **Compatibility Testing**
  - Browser compatibility (Chrome, Firefox, Safari, Edge)
  - Mobile browsers (iOS Safari, Chrome Android)
  - Screen resolutions

### Out of Scope
- Third-party SSO provider testing (beyond integration points)
- Infrastructure/hardware testing
- Network layer testing
- Email server configuration testing
- Calendar service internal functionality

---

## 3. Test Environment

### Environment Setup

#### Test Environments
1. **DEV Environment**
   - Purpose: Development testing, unit tests
   - Data: Mock data, developer-managed
   - Refresh: On-demand

2. **QA/TEST Environment**
   - Purpose: Functional, integration, regression testing
   - Data: Synthetic test data (100+ user profiles)
   - Refresh: Daily database refresh
   - **Endpoints:**
     - UI: `http://localhost:5173` (assumed)
     - API: `http://localhost:3000/api` (assumed)

3. **STAGING/UAT Environment**
   - Purpose: User acceptance testing, pre-production validation
   - Data: Anonymized production-like data
   - Refresh: Weekly

4. **PERFORMANCE Environment**
   - Purpose: Load, stress, and performance testing
   - Data: High-volume synthetic data
   - Specifications: Production-equivalent infrastructure

### Technical Stack
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Frontend:** React, TypeScript
- **Authentication:** JWT tokens
- **Email:** SMTP integration
- **Calendar:** Outlook/Google Calendar APIs

### Test Data Requirements
- **User Profiles:** 100+ covering all roles and scenarios
  - Employees: India (50), USA (30)
  - Managers: 15
  - HR Personnel: 3
  - Admins: 2
  - Edge cases: Newly joined, long-tenured, contract-based, cross-timezone

- **Leave Data:** Pre-seeded balances for testing all scenarios
- **Holiday Calendars:** India and USA holiday lists for 2024-2025
- **Historical Data:** Past leave records for reporting tests

### Test Tools
- **API Testing:** Postman, Newman (CLI), REST-assured
- **UI Automation:** Playwright, Cypress
- **Load Testing:** JMeter, k6
- **Security Testing:** OWASP ZAP, Burp Suite (manual testing)
- **Accessibility:** axe DevTools, NVDA screen reader
- **Test Management:** Spreadsheets (CSV), JSON reports
- **CI/CD:** GitHub Actions (assumed)

### Access & Credentials
- **Admin User:** `admin@glf.com` / `Admin@123` (assumed)
- **HR User:** `hr@glf.com` / `Hr@123` (assumed)
- **Manager User:** `manager@glf.com` / `Manager@123` (assumed)
- **Employee User:** `employee@glf.com` / `Employee@123` (assumed)

*Note: Actual credentials to be confirmed before test execution*

---

## 4. Test Strategy

### Test Levels

#### 1. Unit Testing
- **Responsibility:** Development Team
- **Coverage:** All service layer functions, utility functions
- **Framework:** Jest, Mocha
- **Target Coverage:** ≥ 80% code coverage

#### 2. Integration Testing
- **Responsibility:** QA Team
- **Coverage:** API endpoints, database transactions, service integrations
- **Approach:** Black-box and gray-box testing
- **Priority:** High for approval workflows, balance calculations

#### 3. System Testing
- **Responsibility:** QA Team
- **Coverage:** End-to-end workflows, complete user journeys
- **Approach:** Functional, non-functional, and exploratory testing

#### 4. Regression Testing
- **Responsibility:** QA Team (automated) + Manual spot checks
- **Trigger:** Every code merge, before release
- **Suite:** Automated suite covering critical paths

#### 5. User Acceptance Testing (UAT)
- **Responsibility:** Business stakeholders, HR team
- **Coverage:** Business process validation, usability
- **Duration:** 2 weeks before production release

### Test Types

#### Functional Testing
- **Positive Testing:** Valid inputs, expected flows
- **Negative Testing:** Invalid inputs, error handling
- **Boundary Testing:** Min/max values, edge dates
- **Equivalence Partitioning:** Representative test cases for input classes
- **Decision Table Testing:** Complex business rules (accrual, carry-forward)

#### Non-Functional Testing
- **Performance Testing:**
  - Load: 100 concurrent users (typical), 500 (peak)
  - Soak: 24-hour sustained load
  - Spike: Sudden traffic surge (year-end scenario)
  - Response time: < 2s for 95% requests, < 5s for 99%

- **Security Testing:**
  - OWASP Top 10 validation
  - Role-based access violations
  - Token expiration and refresh
  - Data leakage between users

- **Usability Testing:**
  - Intuitive navigation
  - Clear error messages
  - Help text and tooltips
  - Mobile-friendly UI

- **Accessibility Testing:**
  - Keyboard-only navigation
  - Screen reader compatibility
  - Color contrast (WCAG AA)
  - Focus indicators

#### Exploratory Testing
- **Time-boxed sessions:** 2-hour sessions per module
- **Personas:** Employee, Manager, HR, Admin
- **Scenarios:** Common workflows, edge cases, creative misuse

---

## 5. Test Approach

### Test Design Techniques
1. **Boundary Value Analysis**
   - Leave dates (past, present, future)
   - Leave balance (0, max, negative scenarios)
   - Comp off hours (4.99, 5, 5.01, 7.99, 8, 8.01)
   - Carry-forward limits (29, 30, 31 PLs for India; 4, 5, 6 PTOs for USA)

2. **Equivalence Partitioning**
   - Leave types
   - User roles
   - Approval statuses
   - Date ranges (weekdays, weekends, holidays, mixed)

3. **Decision Tables**
   - Joining-based leave allocation
   - Carry-forward eligibility
   - Comp off calculation
   - Maternity/paternity eligibility

4. **State Transition Testing**
   - Leave request lifecycle: Draft → Pending → Approved/Rejected → Cancelled
   - Comp off lifecycle: Requested → Pending L1 → Pending L2 → Pending HR → Approved/Rejected

5. **Use Case Testing**
   - End-to-end scenarios from user perspective
   - Multi-actor workflows (employee submits, manager approves)

### Test Prioritization

#### P0 (Critical) - Must Pass Before Release
- User authentication and authorization
- Leave balance calculation
- Approval/rejection workflows
- Leave balance deduction on approval
- Accrual job execution
- Critical security issues

#### P1 (High) - Should Pass Before Release
- Leave application creation and editing
- Comp off request and approval
- Email notifications (all types)
- Carry-forward year-end processing
- Comp off expiry processing
- Dashboard data accuracy
- Holiday management
- Weekend/holiday exclusion logic

#### P2 (Medium) - Should Fix Soon
- Reports and analytics
- Team calendar view
- Bulk approval actions
- File attachments
- Leave history and audit trail
- Advanced filtering and search

#### P3 (Low) - Nice to Have
- Pie chart visualizations
- Export functionalities
- UI enhancements
- Tooltip and help text

### Test Execution Strategy

#### Phase 1: Smoke Testing (1 day)
- Basic functionality validation
- Critical path verification
- Build stability check
- Entry criteria for detailed testing

#### Phase 2: Functional Testing (5 days)
- Execute all functional test cases
- Log defects with priority
- Retest fixed defects
- Test all positive and negative scenarios

#### Phase 3: Integration Testing (3 days)
- Test API endpoints
- Validate email and calendar integrations
- Test database transactions
- Verify multi-system workflows

#### Phase 4: Regression Testing (2 days)
- Execute automated regression suite
- Manual regression for critical areas
- Verify no side effects from fixes

#### Phase 5: Non-Functional Testing (3 days)
- Performance testing
- Security testing
- Accessibility testing
- Usability testing

#### Phase 6: UAT (10 days)
- Business stakeholder validation
- Real-world scenario testing
- Sign-off collection

---

## 6. Roles and Responsibilities

| Role | Responsibilities | Name/Team |
|------|-----------------|-----------|
| **Test Manager** | Overall test strategy, planning, and reporting | TBD |
| **Test Lead** | Test case design, execution oversight, defect triage | TBD |
| **QA Engineers (Functional)** | Test case execution, defect logging, manual testing | Team (3-4 members) |
| **QA Engineers (Automation)** | Automation script development, CI/CD integration | Team (2 members) |
| **Performance Tester** | Load, stress, and performance testing | TBD |
| **Security Tester** | Security and penetration testing | TBD |
| **Business Analyst** | Requirement clarification, UAT coordination | TBD |
| **Dev Lead** | Unit test coverage, defect fixes | TBD |
| **DevOps Engineer** | Test environment setup, deployment | TBD |

---

## 7. Entry and Exit Criteria

### Entry Criteria
- [ ] Requirements document finalized and signed off
- [ ] Test environment setup complete and accessible
- [ ] Test data seeded in database
- [ ] Backend APIs deployed and functional
- [ ] Frontend application deployed and accessible
- [ ] Test cases reviewed and approved
- [ ] Test tools and frameworks configured
- [ ] Test user accounts created
- [ ] Smoke test passed (if not first iteration)

### Exit Criteria
- [ ] 100% test case execution complete
- [ ] ≥ 98% pass rate for P0 and P1 tests
- [ ] Zero open P0 (critical) defects
- [ ] < 5 open P1 (high) defects (with mitigation plan)
- [ ] Regression test suite passed
- [ ] Performance benchmarks met
- [ ] Security vulnerabilities addressed (High and Critical)
- [ ] UAT sign-off obtained
- [ ] Test summary report published
- [ ] Known issues documented in release notes

---

## 8. Defect Management

### Defect Lifecycle
1. **New** → 2. **Assigned** → 3. **In Progress** → 4. **Fixed** → 5. **Ready for Retest** → 6. **Retesting** → 7. **Closed** / **Reopened**

### Defect Severity
- **Critical (S1):** System crash, data loss, security breach, complete feature failure
- **High (S2):** Major feature not working, incorrect calculations, workflow blocker
- **Medium (S3):** Minor feature issue, workaround available, UI issues
- **Low (S4):** Cosmetic issues, typos, minor enhancements

### Defect Priority
- **P0:** Fix immediately (hotfix)
- **P1:** Fix in current sprint
- **P2:** Fix in next sprint
- **P3:** Backlog (fix when resources available)

### Defect Reporting Template
```
Defect ID: DEF-XXX
Title: [Clear, concise description]
Module: [e.g., Leave Application]
Severity: [Critical/High/Medium/Low]
Priority: [P0/P1/P2/P3]
Environment: [QA/Staging]
Reproducibility: [Always/Sometimes/Once]
Steps to Reproduce:
  1. ...
  2. ...
Expected Result: ...
Actual Result: ...
Test Data Used: ...
Screenshots/Logs: [Attached]
Assigned To: [Developer]
Found By: [QA Engineer]
Date: [YYYY-MM-DD]
```

---

## 9. Test Deliverables

### Test Artifacts
1. **Test Plan** (this document) - `test_plan.md`
2. **Test Cases** - `test_cases.csv` (150+ test cases)
3. **Test Data** - `test_data.csv` (100+ data rows)
4. **Traceability Matrix** - `traceability_matrix.csv`
5. **Test Execution Report** - `test_report.json`
6. **Automation Scripts** - `automation_snippets.md`
7. **Defect Reports** - Logged in issue tracker
8. **Test Summary Report** - `test_summary.md`
9. **Executive Summary** - `executive_summary.md`

### Reporting Schedule
- **Daily:** Test execution status (pass/fail count, defects logged)
- **Weekly:** Test progress report (% completion, risk updates)
- **End of Testing:** Comprehensive test summary report

---

## 10. Risks and Mitigation

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|
| **Requirements ambiguity** | High | Medium | Regular BA reviews, clarification sessions |
| **Test environment instability** | High | Medium | Dedicated DevOps support, automated health checks |
| **Insufficient test data** | Medium | Low | Test data generation scripts, synthetic data |
| **Delayed defect fixes** | High | Medium | Daily defect triage, priority alignment with Dev team |
| **Lack of automation** | Medium | Medium | Prioritize automation for regression suite |
| **Resource availability** | Medium | Low | Cross-training, buffer resources |
| **Scope creep** | Medium | Medium | Change control process, impact analysis |
| **Performance issues found late** | High | Medium | Early performance testing (Phase 3) |
| **Security vulnerabilities** | High | Low | Dedicated security testing phase, code reviews |
| **Integration failures** | Medium | Medium | Early integration testing, mock services |

---

## 11. Test Schedule

| Phase | Duration | Start Date | End Date | Dependencies |
|-------|----------|------------|----------|--------------|
| **Test Planning** | 2 days | Day 1 | Day 2 | Requirements finalized |
| **Test Case Design** | 3 days | Day 3 | Day 5 | Test plan approved |
| **Test Environment Setup** | 2 days | Day 3 | Day 4 | Infrastructure ready |
| **Test Data Preparation** | 2 days | Day 4 | Day 5 | Database schema finalized |
| **Smoke Testing** | 1 day | Day 6 | Day 6 | Build deployed |
| **Functional Testing** | 5 days | Day 7 | Day 11 | Smoke test passed |
| **Integration Testing** | 3 days | Day 12 | Day 14 | Functional tests completed |
| **Regression Testing** | 2 days | Day 15 | Day 16 | Critical fixes deployed |
| **Non-Functional Testing** | 3 days | Day 17 | Day 19 | System stable |
| **Defect Retesting** | 2 days | Day 20 | Day 21 | Fixes available |
| **UAT** | 10 days | Day 22 | Day 31 | QA sign-off |
| **Test Closure** | 1 day | Day 32 | Day 32 | UAT complete |

**Total Duration:** ~7 weeks (including UAT)

---

## 12. Test Metrics

### Test Execution Metrics
- **Test Case Count:** Total, Executed, Passed, Failed, Blocked, Not Executed
- **Pass Rate:** (Passed / Executed) × 100%
- **Defect Count:** Total, By Severity, By Priority, By Module
- **Defect Density:** Defects per module / test cases per module
- **Defect Age:** Average days defects remain open
- **Test Coverage:** Requirements covered / Total requirements × 100%

### Quality Metrics
- **Defect Leakage:** Defects found in UAT or Production
- **Defect Removal Efficiency:** (Defects found in testing / Total defects) × 100%
- **Test Effectiveness:** (Critical defects found / Total critical defects) × 100%

### Automation Metrics
- **Automation Coverage:** Automated test cases / Total test cases × 100%
- **Automation Execution Time:** Time to run full regression suite
- **Automation ROI:** Time saved vs. maintenance effort

---

## 13. Assumptions

1. **Environment Assumptions**
   - Test environments (QA, Staging) will be available throughout testing phase
   - No runtime access to production database
   - Database will be refreshed daily in QA environment

2. **Authentication Assumptions**
   - Authentication method: JWT tokens (no SSO integration required for testing)
   - Test user accounts will be pre-created
   - No need to test SAML/OAuth2 flows

3. **Data Assumptions**
   - Test data will be synthetic and representative
   - No real PII (Personally Identifiable Information) will be used
   - Historical data for reporting will be pre-seeded

4. **Integration Assumptions**
   - Email integration: SMTP mock service or test email accounts available
   - Calendar integration: Test accounts for Outlook/Google Calendar available
   - External APIs: Staging/sandbox endpoints available

5. **Business Rules Assumptions**
   - Weekend definition: Saturday and Sunday (standard)
   - Half-day definition: First half (before 1 PM), Second half (after 1 PM)
   - Timezone: Server timezone will be consistent (UTC or local)

6. **Localization Assumptions**
   - Date format: DD/MM/YYYY (for display), ISO 8601 (for storage)
   - Language: English only (no multi-language support required)

7. **Out-of-Scope Assumptions**
   - No testing of underlying infrastructure (servers, networking)
   - No testing of database vendor-specific features
   - No testing of browser-specific rendering beyond compatibility

---

## 14. Approvals

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Test Manager** | | | |
| **Project Manager** | | | |
| **Development Lead** | | | |
| **Business Analyst** | | | |
| **Product Owner** | | | |

---

## 15. Appendix

### A. Glossary
- **CL:** Casual Leave
- **PL:** Privilege Leave
- **PTO:** Paid Time Off
- **LWP:** Leave Without Pay
- **Comp Off:** Compensatory Off
- **L1, L2:** Level 1, Level 2 (Manager hierarchy)
- **AVP:** Associate Vice President
- **VP:** Vice President
- **UAT:** User Acceptance Testing
- **RBAC:** Role-Based Access Control

### B. References
- GLF_Leave Management System.pdf
- LeaveManagement_ConfigAnalysis.pdf
- Test Prompt.txt
- Backend API Documentation (Swagger)
- Frontend UI Mockups

### C. Document Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-01 | QA Team | Initial test plan created |

---

**End of Test Plan**
