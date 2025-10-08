# COMPREHENSIVE TEST DATA FOR MANUAL TESTING
## GLF Leave Management System

**Generated Date**: October 7, 2025
**QA Engineer**: Claude AI - Test Data Specialist
**Purpose**: Manual & Automated Testing Support
**Coverage**: All Modules, All User Roles, All Workflows

---

## 📋 TABLE OF CONTENTS

1. [User Test Data](#1-user-test-data)
2. [Department & Organization Data](#2-department--organization-data)
3. [Leave Balance Test Data](#3-leave-balance-test-data)
4. [Leave Request Test Data](#4-leave-request-test-data)
5. [Comp Off Test Data](#5-comp-off-test-data)
6. [Holiday Calendar Data](#6-holiday-calendar-data)
7. [Approval Workflow Data](#7-approval-workflow-data)
8. [Email Notification Test Data](#8-email-notification-test-data)
9. [Edge Cases & Boundary Test Data](#9-edge-cases--boundary-test-data)
10. [Performance Test Data](#10-performance-test-data)

---

## 1. USER TEST DATA

### 1.1 HR Admin Users

| User ID | Email | Password | Name | Role | Country | Gender | Marital Status | Location | Joining Date | Department |
|---|---|---|---|---|---|---|---|---|---|---|
| U001 | admin@company.com | password123 | Maya Sharma | HR_ADMIN | INDIA | FEMALE | MARRIED | Bengaluru | 2020-01-15 | Human Resources |
| U002 | hr.usa@company.com | password123 | Sarah Johnson | HR_ADMIN | USA | FEMALE | MARRIED | New York | 2019-06-01 | Human Resources |

**Test Purpose**:
- Full system access testing
- Policy management validation
- User management operations
- Report generation testing
- Bulk operations testing

---

### 1.2 Manager Users (India)

| User ID | Email | Password | Name | Role | Country | Gender | Marital Status | Location | Joining Date | Department | Direct Reports |
|---|---|---|---|---|---|---|---|---|---|---|---|
| U003 | manager@company.com | password123 | Rajesh Kumar | MANAGER | INDIA | MALE | MARRIED | Bengaluru | 2018-03-10 | Information Technology | 3 |
| U004 | sales.manager@company.com | password123 | Amit Gupta | MANAGER | INDIA | MALE | MARRIED | Mumbai | 2019-07-15 | Sales | 2 |
| U005 | marketing.manager@company.com | password123 | Sneha Reddy | MANAGER | INDIA | FEMALE | MARRIED | Delhi | 2020-02-20 | Marketing | 2 |

**Test Purpose**:
- Multi-level approval workflow testing
- Team leave calendar validation
- Approval/rejection scenarios
- Manager dashboard testing
- Team management features

---

### 1.3 Manager Users (USA)

| User ID | Email | Password | Name | Role | Country | Gender | Marital Status | Location | Joining Date | Department | Designation |
|---|---|---|---|---|---|---|---|---|---|---|---|
| U006 | vp.engineering@company.com | password123 | Michael Chen | MANAGER | USA | MALE | MARRIED | San Francisco | 2017-08-15 | Engineering | VP |
| U007 | avp.sales@company.com | password123 | Jennifer Davis | MANAGER | USA | FEMALE | MARRIED | Boston | 2018-11-20 | Sales | AVP |

**Test Purpose**:
- USA PTO policy testing
- VP vs AVP leave allocation validation
- Carry-forward rules testing
- Role-based PTO allocation

---

### 1.4 Employee Users (India) - Various Scenarios

| User ID | Email | Password | Name | Role | Country | Gender | Marital Status | Location | Joining Date | Department | Manager | Scenario |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| U008 | user@company.com | password123 | Priya Patel | EMPLOYEE | INDIA | FEMALE | MARRIED | Bengaluru | 2021-06-10 | IT | Rajesh Kumar | Standard employee |
| U009 | arjun@company.com | password123 | Arjun Singh | EMPLOYEE | INDIA | MALE | MARRIED | Bengaluru | 2022-01-05 | IT | Rajesh Kumar | Joined 1-15th (full accrual) |
| U010 | kavya@company.com | password123 | Kavya Menon | EMPLOYEE | INDIA | FEMALE | UNMARRIED | Bengaluru | 2023-08-20 | IT | Rajesh Kumar | Joined after 15th (half accrual) |
| U011 | john@company.com | password123 | John Doe | EMPLOYEE | INDIA | MALE | MARRIED | Mumbai | 2020-09-25 | Sales | Amit Gupta | Eligible for paternity |
| U012 | rahul@company.com | password123 | Rahul Verma | EMPLOYEE | INDIA | MALE | UNMARRIED | Mumbai | 2021-11-12 | Sales | Amit Gupta | Not eligible for paternity |
| U013 | anita@company.com | password123 | Anita Joshi | EMPLOYEE | INDIA | FEMALE | MARRIED | Delhi | 2019-05-18 | Marketing | Sneha Reddy | Eligible for maternity |
| U014 | deepak@company.com | password123 | Deepak Agarwal | EMPLOYEE | INDIA | MALE | MARRIED | Delhi | 2022-12-28 | Marketing | Sneha Reddy | Year-end joiner |

**Test Purpose**:
- Joining date pro-ration testing (1-15th vs after 15th)
- Gender & marital status validation
- Maternity/paternity eligibility testing
- Different joining month scenarios
- Year-end carry-forward testing

---

### 1.5 Employee Users (USA) - PTO Scenarios

| User ID | Email | Password | Name | Role | Country | Gender | Marital Status | Location | Joining Date | Department | Designation | PTO Days |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| U015 | alex.thompson@company.com | password123 | Alex Thompson | EMPLOYEE | USA | MALE | MARRIED | New York | 2021-01-01 | Engineering | Engineer | 15 (AVP) |
| U016 | emily.white@company.com | password123 | Emily White | EMPLOYEE | USA | FEMALE | MARRIED | Boston | 2020-07-15 | Sales | Senior Manager | 20 (VP) |
| U017 | david.brown@company.com | password123 | David Brown | EMPLOYEE | USA | MALE | MARRIED | San Francisco | 2024-06-01 | Engineering | Developer | Pro-rated (mid-year) |

**Test Purpose**:
- AVP PTO allocation (15 days)
- VP PTO allocation (20 days)
- Mid-year joiner pro-ration
- Carry-forward rules (AVP max 5, VP none)

---

### 1.6 Special Scenario Users

| User ID | Email | Password | Name | Role | Country | Gender | Marital Status | Location | Joining Date | Special Scenario |
|---|---|---|---|---|---|---|---|---|---|---|
| U018 | maternity.user@company.com | password123 | Lakshmi Iyer | EMPLOYEE | INDIA | FEMALE | MARRIED | Bengaluru | 2020-03-01 | On maternity leave (CL/PL blocked) |
| U019 | resigned.user@company.com | password123 | Vikram Mehta | EMPLOYEE | INDIA | MALE | MARRIED | Mumbai | 2019-01-10 | Resigned (exit process) |
| U020 | probation.user@company.com | password123 | Neha Kapoor | EMPLOYEE | INDIA | FEMALE | UNMARRIED | Delhi | 2024-09-15 | Probation period |

**Test Purpose**:
- Maternity leave blocking CL/PL accrual
- Exit process leave settlement
- Probation period leave restrictions

---

## 2. DEPARTMENT & ORGANIZATION DATA

### 2.1 Departments

| Dept ID | Department Name | Location | Country | Manager | Employee Count | Cost Center |
|---|---|---|---|---|---|---|
| D001 | Human Resources | Bengaluru | INDIA | Maya Sharma | 5 | CC-HR-001 |
| D002 | Information Technology | Bengaluru | INDIA | Rajesh Kumar | 12 | CC-IT-001 |
| D003 | Sales | Mumbai | INDIA | Amit Gupta | 8 | CC-SALES-001 |
| D004 | Marketing | Delhi | INDIA | Sneha Reddy | 6 | CC-MKT-001 |
| D005 | Engineering | San Francisco | USA | Michael Chen | 15 | CC-ENG-USA |
| D006 | Sales | Boston | USA | Jennifer Davis | 10 | CC-SALES-USA |
| D007 | Finance | Bengaluru | INDIA | - | 4 | CC-FIN-001 |
| D008 | Operations | Pune | INDIA | - | 7 | CC-OPS-001 |

**Test Purpose**:
- Department-wise leave reports
- Location-specific holiday calendars
- Team calendar views
- Manager hierarchy validation

---

### 2.2 Reporting Structure (Manager Hierarchy)

```
India Organization:
├── Maya Sharma (HR Admin)
├── Rajesh Kumar (IT Manager)
│   ├── Priya Patel
│   ├── Arjun Singh
│   └── Kavya Menon
├── Amit Gupta (Sales Manager)
│   ├── John Doe
│   └── Rahul Verma
└── Sneha Reddy (Marketing Manager)
    ├── Anita Joshi
    └── Deepak Agarwal

USA Organization:
├── Sarah Johnson (HR Admin)
├── Michael Chen (VP Engineering)
│   ├── Alex Thompson
│   └── David Brown
└── Jennifer Davis (AVP Sales)
    └── Emily White
```

**Test Purpose**:
- Multi-level approval routing
- Manager-employee relationship validation
- Team leave overlap detection
- Delegation scenarios

---

## 3. LEAVE BALANCE TEST DATA

### 3.1 India Leave Balances (Sample Users)

#### User: Priya Patel (user@company.com) - Joined June 2021

| Leave Type | Year | Total Entitlement | Accrued | Used | Available | Carry Forward | Status |
|---|---|---|---|---|---|---|---|
| Casual Leave | 2024 | 12 | 12 | 4 | 8 | 0 | Active |
| Privilege Leave | 2024 | 21 | 21 | 6 | 15 | 5 (from 2023) | Active |
| Sick Leave | 2024 | 12 | 12 | 2 | 10 | 0 | Active |
| Maternity Leave | 2024 | 180 | 0 | 0 | 180 | 0 | Eligible |
| Compensatory Off | 2024 | - | 2 | 0 | 2 | 0 | Active |

**Monthly Accrual History (2024)**:
- Jan 1: +1 CL, +1 PL
- Feb 1: +1 CL, +1 PL
- Mar 1: +1 CL, +1 PL (used 2 CL in March)
- Apr 1: +1 CL, +1 PL
- ... continues monthly

**Test Purpose**:
- Monthly accrual validation
- Balance deduction testing
- Carry-forward from previous year
- Multiple leave type management

---

#### User: Arjun Singh (arjun@company.com) - Joined Jan 5, 2022 (1-15th = Full Accrual)

| Leave Type | Year | Total Entitlement | Accrued (Jan) | Used | Available | Notes |
|---|---|---|---|---|---|---|
| Casual Leave | 2024 | 12 | 1.0 | 0 | 12 | Full day in joining month |
| Privilege Leave | 2024 | 21 | 1.0 | 3 | 18 | Full day in joining month |
| Sick Leave | 2024 | 12 | 0 | 1 | 11 | - |

**Test Purpose**:
- Joining 1-15th: Full day accrual validation
- First month accrual testing
- Pro-ration logic verification

---

#### User: Kavya Menon (kavya@company.com) - Joined Aug 20, 2023 (After 15th = Half Accrual)

| Leave Type | Year | Total Entitlement | Accrued (Aug) | Used | Available | Notes |
|---|---|---|---|---|---|---|
| Casual Leave | 2024 | 12 | 0.5 | 1 | 11 | Half day in joining month |
| Privilege Leave | 2024 | 21 | 0.5 | 2 | 19 | Half day in joining month |
| Sick Leave | 2024 | 12 | 0 | 0 | 12 | - |

**Test Purpose**:
- Joining after 15th: Half day accrual validation
- Pro-ration calculation testing
- Fractional leave balance handling

---

### 3.2 USA PTO Balances

#### User: Alex Thompson (AVP) - Joined Jan 1, 2021

| Leave Type | Year | Allocation | Used | Available | Carry Forward (Max 5) | Notes |
|---|---|---|---|---|---|---|
| PTO | 2024 | 15 | 8 | 7 | 5 (from 2023) | AVP level |
| Bereavement | 2024 | 5 | 0 | 5 | 0 | As needed |

**Year-End Scenario (Dec 31, 2024)**:
- Remaining PTO: 7 days
- Carry-forward rule: Max 5 days allowed
- **Result**: 5 days carry to 2025, 2 days forfeited

**Test Purpose**:
- AVP allocation (15 days)
- Carry-forward limit (max 5)
- Year-end processing

---

#### User: Emily White (VP) - Joined July 15, 2020

| Leave Type | Year | Allocation | Used | Available | Carry Forward | Notes |
|---|---|---|---|---|---|---|
| PTO | 2024 | 20 | 12 | 8 | 0 | VP level - no carry-forward |
| Bereavement | 2024 | 5 | 0 | 5 | 0 | As needed |

**Year-End Scenario (Dec 31, 2024)**:
- Remaining PTO: 8 days
- Carry-forward rule: VP and above = NO carry-forward
- **Result**: 8 days forfeited, 0 days carry to 2025

**Test Purpose**:
- VP allocation (20 days)
- No carry-forward rule for VP+
- Year-end processing

---

#### User: David Brown (Mid-Year Joiner) - Joined June 1, 2024

| Leave Type | Year | Annual Allocation | Pro-rated (Jun-Dec) | Used | Available | Calculation |
|---|---|---|---|---|---|---|
| PTO | 2024 | 15 | 8.75 | 3 | 5.75 | (15 × 7 months) / 12 |

**Pro-ration Calculation**:
- Annual PTO: 15 days (AVP level)
- Joining: June 1, 2024
- Remaining months: July-Dec = 7 months
- Pro-rated: (15 × 7) / 12 = 8.75 days

**Test Purpose**:
- Mid-year joiner pro-ration
- Fractional PTO calculation
- Partial year balance

---

### 3.3 Special Leave Balances

#### User: Lakshmi Iyer (On Maternity Leave)

| Leave Type | Year | Total | Accrued | Used | Available | Status |
|---|---|---|---|---|---|---|
| Casual Leave | 2024 | 12 | 6 | 4 | 2 | **Accrual BLOCKED** |
| Privilege Leave | 2024 | 21 | 10 | 5 | 5 | **Accrual BLOCKED** |
| Maternity Leave | 2024 | 180 | 180 | 120 | 60 | **ACTIVE** |

**Maternity Leave Period**: Apr 1, 2024 - Sep 28, 2024 (180 days)
**CL/PL Accrual Block**: Apr-Sep (6 months blocked)

**Test Purpose**:
- Maternity leave blocking CL/PL accrual
- 180-day maternity entitlement
- Accrual suspension during maternity

---

## 4. LEAVE REQUEST TEST DATA

### 4.1 Positive Test Cases (Approved Leaves)

| Request ID | Employee | Leave Type | Start Date | End Date | Total Days | Half Day | Status | Applied Date | Approved By | Approved Date |
|---|---|---|---|---|---|---|---|---|---|---|
| LR001 | Priya Patel | Casual Leave | 2024-10-15 | 2024-10-17 | 3 | No | APPROVED | 2024-10-05 | Rajesh Kumar | 2024-10-06 |
| LR002 | Arjun Singh | Sick Leave | 2024-10-10 | 2024-10-10 | 1 | No | APPROVED | 2024-10-10 | Rajesh Kumar | 2024-10-10 |
| LR003 | John Doe | Earned Leave | 2024-11-20 | 2024-11-25 | 6 | No | APPROVED | 2024-10-20 | Amit Gupta | 2024-10-22 |
| LR004 | Anita Joshi | Casual Leave | 2024-10-12 | 2024-10-12 | 0.5 | Yes (First Half) | APPROVED | 2024-10-08 | Sneha Reddy | 2024-10-09 |
| LR005 | Alex Thompson | PTO | 2024-11-01 | 2024-11-05 | 5 | No | APPROVED | 2024-10-15 | Michael Chen | 2024-10-16 |

**Test Purpose**:
- Standard leave approval workflow
- Different leave types
- Half-day leave testing
- Multi-day leave spans
- Manager approval validation

---

### 4.2 Pending Approval Test Cases

| Request ID | Employee | Leave Type | Start Date | End Date | Total Days | Status | Applied Date | Current Approver | Level |
|---|---|---|---|---|---|---|---|---|---|
| LR006 | Kavya Menon | Casual Leave | 2024-10-25 | 2024-10-27 | 3 | PENDING | 2024-10-20 | Rajesh Kumar | L1 Manager |
| LR007 | Rahul Verma | Earned Leave | 2024-11-10 | 2024-11-15 | 6 | PENDING | 2024-10-22 | Amit Gupta | L1 Manager |
| LR008 | Deepak Agarwal | Sick Leave | 2024-10-30 | 2024-10-31 | 2 | PENDING | 2024-10-28 | Sneha Reddy | L1 Manager |
| LR009 | Emily White | PTO | 2024-12-20 | 2024-12-31 | 10 | PENDING | 2024-10-25 | Jennifer Davis | L1 Manager |

**Test Purpose**:
- Pending approvals queue
- Manager notification testing
- Approval deadline scenarios
- Email reminder testing

---

### 4.3 Rejected Leave Test Cases

| Request ID | Employee | Leave Type | Start Date | End Date | Total Days | Status | Rejected By | Rejection Reason | Rejected Date |
|---|---|---|---|---|---|---|---|---|---|
| LR010 | Priya Patel | Casual Leave | 2024-12-24 | 2024-12-26 | 3 | REJECTED | Rajesh Kumar | Too many people on leave during Christmas | 2024-10-18 |
| LR011 | John Doe | Earned Leave | 2024-10-28 | 2024-11-02 | 6 | REJECTED | Amit Gupta | Critical project deadline | 2024-10-20 |
| LR012 | Arjun Singh | Casual Leave | 2024-11-08 | 2024-11-08 | 1 | REJECTED | Rajesh Kumar | Insufficient balance | 2024-10-22 |

**Test Purpose**:
- Rejection workflow
- Rejection reason validation
- Email notification on rejection
- Balance restoration after rejection

---

### 4.4 Cancelled Leave Test Cases

| Request ID | Employee | Leave Type | Start Date | End Date | Status | Applied Date | Cancelled Date | Cancellation Reason |
|---|---|---|---|---|---|---|---|---|
| LR013 | Kavya Menon | Casual Leave | 2024-10-18 | 2024-10-20 | CANCELLED | 2024-10-10 | 2024-10-16 | Personal reason |
| LR014 | Anita Joshi | Earned Leave | 2024-11-05 | 2024-11-07 | CANCELLED | 2024-10-15 | 2024-10-28 | Work commitment |

**Test Purpose**:
- Leave cancellation workflow
- Balance credit on cancellation
- Notification to manager/HR
- Cancellation window validation

---

### 4.5 Edge Case Leave Requests

| Request ID | Employee | Leave Type | Scenario | Start Date | End Date | Expected Result |
|---|---|---|---|---|---|---|
| LR015 | Priya Patel | Casual Leave | **Overlapping leave** | 2024-10-15 | 2024-10-17 | REJECT (conflicts with LR001) |
| LR016 | Arjun Singh | Casual Leave | **Insufficient balance** | 2024-11-01 | 2024-11-15 | REJECT (only 8 days available) |
| LR017 | Kavya Menon | Maternity Leave | **Wrong gender** | 2024-11-01 | 2024-04-29 | REJECT (male employee) |
| LR018 | John Doe | Maternity Leave | **Wrong gender** | 2024-11-01 | 2024-04-29 | REJECT (male employee) |
| LR019 | Deepak Agarwal | Casual Leave | **Past date** | 2024-09-15 | 2024-09-17 | REJECT (cannot apply for past) |
| LR020 | Emily White | PTO | **Exceeds balance** | 2024-11-01 | 2024-11-25 | REJECT (only 8 days available) |

**Test Purpose**:
- Overlapping leave detection
- Insufficient balance validation
- Gender restriction enforcement
- Past date prevention
- Balance limit validation

---

### 4.6 Weekend & Holiday Exclusion Test Cases

| Request ID | Employee | Start Date | End Date | Calendar Days | Weekends | Holidays | Working Days Deducted |
|---|---|---|---|---|---|---|---|
| LR021 | Priya Patel | 2024-11-04 (Mon) | 2024-11-08 (Fri) | 5 | Sat-Sun (Nov 9-10) | - | **5 days** |
| LR022 | Arjun Singh | 2024-11-08 (Fri) | 2024-11-11 (Mon) | 4 | Sat-Sun (Nov 9-10) | - | **2 days** (Fri + Mon only) |
| LR023 | John Doe | 2024-12-23 (Mon) | 2024-12-27 (Fri) | 5 | Sat-Sun (Dec 28-29) | Dec 25 (Christmas) | **4 days** (exclude Christmas) |
| LR024 | Anita Joshi | 2024-10-01 (Tue) | 2024-10-03 (Thu) | 3 | - | Oct 2 (Gandhi Jayanti) | **2 days** (exclude holiday) |

**Test Purpose**:
- Weekend exclusion from leave days
- Holiday exclusion validation
- Correct working day calculation
- Multi-day span with holidays

---

## 5. COMP OFF TEST DATA

### 5.1 Comp Off Request Test Cases

| Comp Off ID | Employee | Work Date | From Time | To Time | Hours Worked | Project | Comp Off Earned | Status | Request Date |
|---|---|---|---|---|---|---|---|---|---|
| CO001 | Priya Patel | 2024-10-06 (Sat) | 10:00 | 15:00 | 5 | Project Alpha | 0.5 day | APPROVED | 2024-10-07 |
| CO002 | Arjun Singh | 2024-10-12 (Sat) | 09:00 | 18:00 | 8 | Project Beta | 1.0 day | APPROVED | 2024-10-13 |
| CO003 | John Doe | 2024-10-02 (Wed - Gandhi Jayanti) | 10:00 | 18:00 | 8 | Critical Fix | 1.0 day | PENDING (L1) | 2024-10-03 |
| CO004 | Kavya Menon | 2024-09-15 (Sun) | 11:00 | 16:00 | 5 | Project Gamma | 0.5 day | APPROVED | 2024-09-16 |
| CO005 | Anita Joshi | 2024-10-15 (Tue - Regular Day) | 09:00 | 17:00 | 8 | Project Delta | 0 day | **REJECTED** (Not weekend/holiday) | 2024-10-16 |

**Comp Off Rules**:
- **5 hours work** = 0.5 day comp off
- **8 hours work** = 1.0 day comp off
- **Eligible only for**: Weekend work OR Holiday work
- **Expiry**: 3 months from approval date

**Test Purpose**:
- Comp off calculation (5hrs vs 8hrs)
- Weekend/holiday work validation
- Regular day rejection
- Multi-level approval (3 levels)

---

### 5.2 Comp Off Balance Test Cases

| Employee | Earned Date | Comp Off Days | Approval Date | Expiry Date (3 months) | Used | Available | Status |
|---|---|---|---|---|---|---|---|
| Priya Patel | 2024-10-06 | 0.5 | 2024-10-08 | 2025-01-08 | 0 | 0.5 | Active |
| Arjun Singh | 2024-10-12 | 1.0 | 2024-10-15 | 2025-01-15 | 0 | 1.0 | Active |
| Kavya Menon | 2024-06-15 | 0.5 | 2024-06-18 | 2024-09-18 | 0 | 0 | **EXPIRED** |
| John Doe | 2024-09-01 | 1.0 | 2024-09-05 | 2024-12-05 | 0.5 | 0.5 | Active (expiring soon) |

**Test Purpose**:
- Comp off balance tracking
- 3-month expiry validation
- Expiry reminder testing (7 days before)
- Partial usage scenarios

---

### 5.3 Comp Off Multi-Level Approval Test Cases

| Comp Off ID | Employee | L1 Approver | L1 Status | L2 Approver | L2 Status | HR Approver | HR Status | Final Status |
|---|---|---|---|---|---|---|---|---|
| CO006 | Priya Patel | Rajesh Kumar | APPROVED | - | APPROVED | Maya Sharma | APPROVED | **APPROVED** |
| CO007 | John Doe | Amit Gupta | APPROVED | - | PENDING | - | - | **PENDING (L2)** |
| CO008 | Kavya Menon | Rajesh Kumar | REJECTED | - | - | - | - | **REJECTED (L1)** |
| CO009 | Anita Joshi | Sneha Reddy | APPROVED | - | APPROVED | Maya Sharma | PENDING | **PENDING (HR)** |

**Approval Flow**: Employee → L1 Manager → L2 Manager → HR

**Test Purpose**:
- 3-level approval workflow
- Rejection at different levels
- Pending at each stage
- Email notifications at each level

---

## 6. HOLIDAY CALENDAR DATA

### 6.1 India Holidays 2024-2025

| Holiday Date | Holiday Name | Type | Applicable Location | Is Mandatory | Notes |
|---|---|---|---|---|---|
| 2024-01-26 | Republic Day | National | All India | Yes | - |
| 2024-03-25 | Holi | National | All India | Yes | - |
| 2024-03-29 | Good Friday | National | All India | Yes | - |
| 2024-04-11 | Eid ul-Fitr | Regional | All India | Yes | - |
| 2024-06-17 | Eid ul-Adha | Regional | All India | Yes | - |
| 2024-08-15 | Independence Day | National | All India | Yes | - |
| 2024-08-26 | Janmashtami | Optional | All India | No | - |
| 2024-10-02 | Gandhi Jayanti | National | All India | Yes | - |
| 2024-10-12 | Dussehra | Regional | North India | Yes | - |
| 2024-10-31 | Diwali | Regional | All India | Yes | - |
| 2024-11-01 | Karnataka Rajyotsava | Regional | Bengaluru Only | Yes | Location-specific |
| 2024-12-25 | Christmas | National | All India | Yes | - |
| 2025-01-01 | New Year's Day | National | All India | Yes | - |
| 2025-01-26 | Republic Day | National | All India | Yes | - |

**Test Purpose**:
- Holiday calendar display
- Location-specific holiday filtering
- Leave day calculation excluding holidays
- Holiday reminder emails (7, 3, 1 day before)

---

### 6.2 USA Holidays 2024-2025

| Holiday Date | Holiday Name | Type | Applicable Location | Is Mandatory |
|---|---|---|---|---|
| 2024-01-01 | New Year's Day | Federal | All USA | Yes |
| 2024-01-15 | Martin Luther King Jr. Day | Federal | All USA | Yes |
| 2024-02-19 | Presidents' Day | Federal | All USA | Yes |
| 2024-05-27 | Memorial Day | Federal | All USA | Yes |
| 2024-07-04 | Independence Day | Federal | All USA | Yes |
| 2024-09-02 | Labor Day | Federal | All USA | Yes |
| 2024-10-14 | Columbus Day | Federal | Select States | No |
| 2024-11-11 | Veterans Day | Federal | All USA | Yes |
| 2024-11-28 | Thanksgiving | Federal | All USA | Yes |
| 2024-11-29 | Day after Thanksgiving | Federal | All USA | Yes |
| 2024-12-25 | Christmas Day | Federal | All USA | Yes |
| 2025-01-01 | New Year's Day | Federal | All USA | Yes |

**Test Purpose**:
- USA holiday calendar
- Federal holiday validation
- State-specific holidays
- PTO calculation excluding holidays

---

### 6.3 Company-Specific Holidays

| Holiday Date | Holiday Name | Type | Applicable To | Notes |
|---|---|---|---|---|
| 2024-03-22 | Company Foundation Day | Company | All Employees | 10th Anniversary |
| 2024-09-15 | Annual Team Outing | Company | All Employees | Bangalore & Mumbai only |
| 2024-12-31 | Year End Celebration | Optional | All Employees | Half day |

**Test Purpose**:
- Company holiday management
- Optional holiday handling
- Multi-location company events

---

## 7. APPROVAL WORKFLOW DATA

### 7.1 Leave Approval Workflow (2 Levels)

| Request ID | Employee | Leave Type | L1 Approver | L1 Action | L1 Date | L2 Approver (HR) | L2 Action | L2 Date | Final Status |
|---|---|---|---|---|---|---|---|---|---|
| LR025 | Priya Patel | Casual Leave | Rajesh Kumar | APPROVED | 2024-10-10 | Maya Sharma | APPROVED | 2024-10-11 | **APPROVED** |
| LR026 | John Doe | Sick Leave | Amit Gupta | APPROVED | 2024-10-12 | Maya Sharma | PENDING | - | **PENDING (HR)** |
| LR027 | Kavya Menon | Earned Leave | Rajesh Kumar | REJECTED | 2024-10-14 | - | - | - | **REJECTED (L1)** |
| LR028 | Anita Joshi | Casual Leave | Sneha Reddy | PENDING | - | - | - | - | **PENDING (L1)** |

**Test Purpose**:
- 2-level leave approval
- Approval sequence validation
- Email notifications at each stage
- Rejection short-circuit (no L2 if L1 rejects)

---

### 7.2 Comp Off Approval Workflow (3 Levels)

| Comp Off ID | Employee | L1 Approver | L1 Action | L2 Approver | L2 Action | HR Approver | HR Action | Final Status | Balance Added? |
|---|---|---|---|---|---|---|---|---|---|
| CO010 | Priya Patel | Rajesh Kumar | APPROVED | Senior Mgr | APPROVED | Maya Sharma | APPROVED | **APPROVED** | ✅ Yes |
| CO011 | John Doe | Amit Gupta | APPROVED | Senior Mgr | APPROVED | Maya Sharma | PENDING | **PENDING (HR)** | ❌ No |
| CO012 | Kavya Menon | Rajesh Kumar | APPROVED | Senior Mgr | REJECTED | - | - | **REJECTED (L2)** | ❌ No |
| CO013 | Anita Joshi | Sneha Reddy | PENDING | - | - | - | - | **PENDING (L1)** | ❌ No |

**Important Rule**: Comp off balance added ONLY after HR final approval

**Test Purpose**:
- 3-level comp off approval
- Balance credit only after full approval
- Rejection at any level prevents balance addition
- Multi-stage email notifications

---

### 7.3 Delegation Scenarios

| Original Approver | Delegate To | Delegation Period | Active | Requests Delegated |
|---|---|---|---|---|
| Rajesh Kumar (on leave) | Amit Gupta | 2024-11-10 to 2024-11-20 | Yes | All IT team requests |
| Sneha Reddy (vacation) | Maya Sharma | 2024-12-20 to 2025-01-05 | Yes | All Marketing team requests |
| Michael Chen (conference) | Sarah Johnson | 2024-10-25 to 2024-10-30 | Yes | All Engineering (USA) requests |

**Test Purpose**:
- Manager delegation during absence
- Delegated approval validation
- Email routing to delegate
- Delegation period expiry

---

## 8. EMAIL NOTIFICATION TEST DATA

### 8.1 Leave Request Notifications

| Trigger Event | Recipient | CC | Email Template | Test Scenario |
|---|---|---|---|---|
| Leave Request Submitted | Employee | Manager, HR | leave-request-confirmation | Confirmation to employee |
| Leave Request Submitted | Manager | HR | leave-approval-request | Approval request to manager |
| Leave Approved (L1) | Employee | HR | leave-approved | Approval notification |
| Leave Approved (L2 - Final) | Employee | Manager, HR | leave-final-approval | Final approval |
| Leave Rejected | Employee | Manager, HR | leave-rejected | Rejection with reason |
| Leave Cancelled | Manager | HR | leave-cancelled | Cancellation notification |

**Test Purpose**:
- Email trigger validation
- Recipient list verification
- Template rendering
- CC list accuracy

---

### 8.2 Holiday Reminder Notifications

| Holiday | Reminder Type | Send Date | Recipients | Email Subject |
|---|---|---|---|---|
| Diwali (Oct 31) | 7-day reminder | Oct 24 | All India employees | Upcoming Holiday: Diwali in 7 days |
| Diwali (Oct 31) | 3-day reminder | Oct 28 | All India employees | Reminder: Diwali in 3 days |
| Diwali (Oct 31) | 1-day reminder | Oct 30 | All India employees | Tomorrow is Diwali - Holiday |
| Christmas (Dec 25) | 7-day reminder | Dec 18 | All employees | Upcoming Holiday: Christmas in 7 days |

**Test Purpose**:
- Scheduled email sending (7, 3, 1 day before)
- Location-based recipient filtering
- Holiday reminder template
- Email scheduling accuracy

---

### 8.3 Comp Off Expiry Reminder

| Employee | Comp Off Balance | Approval Date | Expiry Date | Reminder Date (7 days before) | Email Sent To |
|---|---|---|---|---|---|
| Kavya Menon | 0.5 day | 2024-06-18 | 2024-09-18 | 2024-09-11 | Employee, Manager, HR |
| John Doe | 0.5 day | 2024-09-05 | 2024-12-05 | 2024-11-28 | Employee, Manager, HR |
| Arjun Singh | 1.0 day | 2024-10-15 | 2025-01-15 | 2025-01-08 | Employee, Manager, HR |

**Email Content**:
- Subject: "Comp Off Expiring Soon - Use Before {expiry_date}"
- Body: "Your {days} comp off will expire on {expiry_date}. Please use it before expiry."

**Test Purpose**:
- 7-day expiry reminder
- Multi-recipient notification (Emp, Mgr, HR)
- Expiry date calculation
- Reminder scheduling

---

### 8.4 Email Action Buttons (Approve/Reject in Email)

| Request Type | Email Recipient | Action Buttons | Expected Behavior |
|---|---|---|---|
| Leave Request | Manager | [Approve] [Reject] | Direct approval/rejection from email |
| Comp Off Request | L1 Manager | [Approve] [Reject] | L1 approval from email |
| Comp Off Request | L2 Manager | [Approve] [Reject] | L2 approval from email |
| Comp Off Request | HR | [Approve] [Reject] | Final HR approval from email |

**Test Data**:
- Secure token-based authentication for email actions
- Single-click approval without login
- Rejection form with comment requirement
- Action logging and audit trail

**Test Purpose**:
- Email button functionality
- Tokenized authentication
- Direct approval workflow
- Security validation

---

## 9. EDGE CASES & BOUNDARY TEST DATA

### 9.1 Edge Case Scenarios

| Test Case ID | Scenario | Test Data | Expected Result | Purpose |
|---|---|---|---|---|
| EDGE-001 | **Exact balance application** | User has 5 CL, applies for 5 CL | APPROVED | Boundary testing |
| EDGE-002 | **Zero balance application** | User has 0 CL, applies for 1 CL | REJECTED (insufficient balance) | Negative testing |
| EDGE-003 | **Fractional day leave** | User applies 0.5 day half-day leave | APPROVED | Half-day handling |
| EDGE-004 | **Year-end carry-forward (CL)** | User has 5 CL on Dec 31 | All 5 CL expired on Jan 1 | CL expiry rule |
| EDGE-005 | **Year-end carry-forward (PL max 30)** | User has 35 PL on Dec 31 | Only 30 PL carried, 5 forfeited | PL max 30 rule |
| EDGE-006 | **Overlapping leave detection** | User applies Oct 10-12, already has Oct 11-13 | REJECTED (overlap on Oct 11-12) | Overlap validation |
| EDGE-007 | **Backdated leave** | User tries to apply for last week | REJECTED (past dates not allowed) | Past date validation |
| EDGE-008 | **Future leave (1 year ahead)** | User applies for Oct 2025 (in Oct 2024) | APPROVED (if balance available) | Future date handling |
| EDGE-009 | **Comp off expiry on exact date** | Comp off approved Jun 1, tested on Aug 31 | Still valid (expires Sep 1) | Expiry date precision |
| EDGE-010 | **Maternity during CL/PL accrual** | Female on maternity Apr-Sep | No CL/PL accrued Apr-Sep | Accrual blocking |

---

### 9.2 Boundary Value Testing

| Field | Minimum | Typical | Maximum | Beyond Max | Test Purpose |
|---|---|---|---|---|---|
| Leave Days | 0.5 (half day) | 5 days | 30 days | 100 days | Range validation |
| Reason Length | 10 chars | 100 chars | 500 chars | 1000 chars | Input validation |
| Comp Off Hours | 5 hours (min) | 8 hours | 12 hours | 24 hours | Hours validation |
| User Age | 18 years | 30 years | 65 years | 70 years | Age boundary |
| Service Years | 0 (new joiner) | 5 years | 40 years | 50 years | Service validation |

---

### 9.3 Negative Test Cases

| Test Case | Invalid Input | Expected Error Message | HTTP Status |
|---|---|---|---|
| Empty leave type | null | "Leave type is required" | 400 |
| Invalid email | "notanemail" | "Invalid email format" | 400 |
| Negative leave days | -5 | "Leave days must be positive" | 400 |
| End date before start date | Start: Oct 10, End: Oct 5 | "End date must be after start date" | 400 |
| Special characters in name | "John@Doe#123" | "Name contains invalid characters" | 400 |
| SQL injection attempt | "'; DROP TABLE users--" | Input sanitized, no execution | 400 |
| XSS attempt | "<script>alert('xss')</script>" | Escaped, not executed | 400 |

---

## 10. PERFORMANCE TEST DATA

### 10.1 Load Testing Scenarios

| Scenario | Concurrent Users | Operations | Duration | Expected Response Time | Pass Criteria |
|---|---|---|---|---|---|
| Peak login | 100 users | Login | 5 minutes | < 2 seconds | 95% success rate |
| Leave application surge | 50 users | Apply leave | 10 minutes | < 3 seconds | No failures |
| Approval processing | 20 managers | Approve 10 each | 5 minutes | < 2 seconds | 100% success |
| Report generation | 10 HR admins | Generate monthly report | 2 minutes | < 10 seconds | All reports generated |
| Dashboard load | 200 users | Load dashboard | 5 minutes | < 3 seconds | 90% under 3 sec |

---

### 10.2 Stress Testing Data

| Metric | Normal Load | Stress Load | Break Point | Recovery Time |
|---|---|---|---|---|
| Active users | 100 | 500 | 1000+ | < 1 minute |
| Leave requests/minute | 10 | 100 | 500+ | < 30 seconds |
| Database connections | 50 | 200 | 500+ | < 2 minutes |
| API requests/second | 50 | 500 | 2000+ | < 1 minute |

---

## 11. TEST DATA USAGE GUIDE

### 11.1 Quick Test Scenarios

#### **Scenario 1: Standard Leave Application Flow**
```
1. Login as: user@company.com (Priya Patel)
2. Navigate to: Apply Leave
3. Select: Casual Leave
4. Dates: Today + 7 days to Today + 9 days
5. Reason: "Family function"
6. Submit
7. Expected: Success, balance reduced, email sent
8. Logout

9. Login as: manager@company.com (Rajesh Kumar)
10. Navigate to: Approvals
11. Find Priya's request
12. Approve with comment: "Approved"
13. Expected: Status changed, email to Priya
```

#### **Scenario 2: Insufficient Balance Testing**
```
1. Login as: arjun@company.com (Arjun Singh)
2. Check CL balance: 8 days
3. Apply for: 10 days CL
4. Expected: Error "Insufficient balance! You have only 8 days available"
```

#### **Scenario 3: Gender Restriction Testing**
```
1. Login as: arjun@company.com (Male employee)
2. Navigate to: Apply Leave
3. Open: Leave Type dropdown
4. Expected: Maternity Leave NOT visible
5. Expected: Paternity Leave visible (if married)
```

#### **Scenario 4: Comp Off 3-Level Approval**
```
1. Login as: user@company.com (Priya Patel)
2. Navigate to: Comp Off → Apply
3. Work Date: Last Saturday
4. Hours: 8 hours (9 AM - 5 PM)
5. Submit
6. Expected: L1 pending approval

7. Login as L1 Manager, Approve
8. Expected: L2 pending approval

9. Login as L2 Manager, Approve
10. Expected: HR pending approval

11. Login as HR, Approve
12. Expected: Comp off 1.0 day added to balance
```

---

### 11.2 Data Reset Instructions

**For fresh testing, reset data in this order:**

1. **Delete Test Requests**:
   ```sql
   DELETE FROM leave_requests WHERE employee_id IN ('U008', 'U009', 'U010');
   DELETE FROM comp_off_requests WHERE employee_id IN ('U008', 'U009', 'U010');
   ```

2. **Reset Leave Balances**:
   ```sql
   UPDATE leave_balances SET used = 0, available = total_entitlement
   WHERE employee_id IN ('U008', 'U009', 'U010');
   ```

3. **Clear Notifications**:
   ```sql
   DELETE FROM notifications WHERE created_at > '2024-10-01';
   ```

4. **Reset Approval Queues**:
   ```sql
   DELETE FROM approvals WHERE status = 'PENDING';
   ```

---

## 12. TEST DATA SUMMARY

### 12.1 Coverage Matrix

| Module | Test Data Records | Positive Cases | Negative Cases | Edge Cases | Boundary Cases |
|---|---|---|---|---|---|
| Users | 20 | 15 | 3 | 2 | 5 |
| Departments | 8 | 8 | 0 | 0 | 0 |
| Leave Balances | 50+ | 40 | 5 | 5 | 10 |
| Leave Requests | 30+ | 15 | 8 | 7 | 5 |
| Comp Off | 15+ | 8 | 3 | 4 | 3 |
| Holidays | 25+ | 25 | 0 | 0 | 0 |
| Approvals | 20+ | 12 | 5 | 3 | 2 |
| Notifications | 30+ | 25 | 5 | 0 | 0 |
| **TOTAL** | **200+** | **148** | **29** | **21** | **25** |

---

### 12.2 Test Data Files

All test data is persisted in:
- **Database Seed**: `backend/prisma/seed.ts`
- **Test Guide**: `TEST_DATA_GUIDE.md`
- **This Document**: `TEST_DATA_COMPREHENSIVE.md`
- **QA Reports**: `QA_TEST_REPORT.md`, `QA_SUMMARY_REPORT.md`

---

## 13. APPENDIX

### 13.1 Common Test Credentials

**All test users password**: `password123`

**Quick Login Emails**:
- HR Admin (India): `admin@company.com`
- HR Admin (USA): `hr.usa@company.com`
- IT Manager: `manager@company.com`
- Standard Employee: `user@company.com`
- Married Female (Maternity): `anita@company.com`
- Married Male (Paternity): `john@company.com`
- Unmarried Female: `kavya@company.com`

### 13.2 Test Environment URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Docs**: http://localhost:3001/api/v1/docs

### 13.3 Test Execution Checklist

- [ ] User authentication (all roles)
- [ ] Leave balance display
- [ ] Leave application (all types)
- [ ] Half-day leaves
- [ ] Manager approvals
- [ ] HR approvals
- [ ] Comp off (3-level approval)
- [ ] Email notifications
- [ ] Holiday calendar
- [ ] Weekend/holiday exclusion
- [ ] Gender restrictions
- [ ] Marital status restrictions
- [ ] Past date validation
- [ ] Insufficient balance blocking
- [ ] Overlapping leave detection
- [ ] Year-end carry-forward
- [ ] Monthly accrual
- [ ] Joining date pro-ration
- [ ] Maternity CL/PL blocking
- [ ] Reports and analytics

---

**End of Comprehensive Test Data Document**

*This test data supports both manual and automated testing for the GLF Leave Management System. All scenarios are designed to validate GLF requirements and ensure 100% compliance.*
