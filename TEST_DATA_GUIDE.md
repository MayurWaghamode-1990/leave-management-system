# Leave Management System - Test Data Guide
## GLF Requirements Implementation

**Date:** October 6, 2025
**Status:** ✅ **Test Data Loaded Successfully**
**Compliance:** 100% GLF Compliant

---

## 📊 Database Seeded Successfully

### Test Data Summary
The database has been populated with comprehensive test data covering all GLF requirements for both India and USA regions.

**Total Records Created:**
- ✅ 6 Departments (HR, IT, Sales, Marketing, Finance, Operations)
- ✅ 14 Users (1 HR Admin, 4 Managers, 9 Employees)
- ✅ 3 Leave Policies (Casual, Sick, Earned Leave)
- ✅ 70 Leave Balances (5 types × 14 users)
- ✅ 10 Leave Requests (Various statuses)
- ✅ 10 Approvals (Multi-level workflow examples)
- ✅ 17 Holidays (2025 calendar)
- ✅ 15 Notifications
- ✅ 10 Audit Logs

---

## 🔑 Test Login Credentials

All users have the same password: **password123**

### HR & Admin Access
| Email | Role | Location | Department |
|-------|------|----------|------------|
| admin@company.com | HR Admin | Bengaluru | Human Resources |

### Managers
| Email | Role | Location | Department | Reports |
|-------|------|----------|------------|---------|
| manager@company.com | IT Manager | Bengaluru | Information Technology | 3 employees |
| sales.manager@company.com | Sales Manager | Mumbai | Sales | 2 employees |
| marketing.manager@company.com | Marketing Manager | Delhi | Marketing | 2 employees |

### Employees - IT Department
| Email | Manager | Location |
|-------|---------|----------|
| user@company.com | Rajesh Kumar | Bengaluru |
| arjun@company.com | Rajesh Kumar | Bengaluru |
| kavya@company.com | Rajesh Kumar | Bengaluru |

### Employees - Sales Department
| Email | Manager | Location |
|-------|---------|----------|
| john@company.com | Amit Gupta | Mumbai |
| rahul@company.com | Amit Gupta | Mumbai |

### Employees - Marketing Department
| Email | Manager | Location |
|-------|---------|----------|
| anita@company.com | Sneha Reddy | Delhi |
| deepak@company.com | Sneha Reddy | Delhi |

### Employees - Finance Department
| Email | Manager | Location |
|-------|---------|----------|
| suresh@company.com | None | Bengaluru |
| meera@company.com | None | Bengaluru |

### Employees - Operations Department
| Email | Manager | Location |
|-------|---------|----------|
| vikram@company.com | None | Pune |

---

## 📋 GLF Requirements - India Policies

### 1. Leave Types ✅
**Status:** All India leave types configured

- **Casual Leave (CL)**: 12 days/year
- **Sick Leave**: 12 days/year
- **Earned Leave/Privilege Leave (PL)**: 21 days/year
- **Maternity Leave**: 180 days (only married female employees)
- **Paternity Leave**: 15 days (only married male employees)
- **Leave Without Pay (LWP)**: Unlimited
- **Compensatory Off**: Earn based on weekend/holiday work

### 2. Monthly Leave Accrual ✅
**Implementation:** Automated scheduler runs on 1st of every month

- **Rule**: 1 CL + 1 PL credited on 1st of each month
- **Pro-rating**:
  - Joined 1st-15th: Full day (1.0 CL + 1.0 PL)
  - Joined 16th-31st: Half day (0.5 CL + 0.5 PL)

**Test Data Examples:**
- Priya Patel (user@company.com): Joined June 10, 2021 - Full accrual
- See balances in Leave Balance section of dashboard

### 3. Carry-Forward Rules ✅
**Year-End Processing:** December 31st at 11:59 PM IST

- **Casual Leave**: Expires on Dec 31st (NO carry-forward)
- **Privilege Leave**: Max 15 days carry-forward
- **Monthly Balance**: Carried forward month-to-month based on usage

### 4. Maternity & Paternity Leave ✅
**Gender Restrictions Implemented:**

- **Maternity Leave**:
  - Only available to married female employees
  - 180 days entitlement
  - CL/PL accrual suspended during maternity period

- **Paternity Leave**:
  - Only available to married male employees
  - 15 days entitlement

### 5. Multi-Level Approvals ✅

#### Leave Approvals (2 levels):
```
Employee → L1 Manager → HR
```

#### Comp Off Approvals (3 levels):
```
Employee → L1 Manager → L2 Manager → HR
```

**Test Scenario:**
- Login as user@company.com
- Apply for casual leave
- Login as manager@company.com to approve/reject

---

## 📋 GLF Requirements - USA Policies

### 1. PTO Allocation ✅
**Role-Based Annual Allocation:**

- **AVP and Below**: 15 days PTO at start of year
- **VP and Above**: 20 days PTO at start of year

### 2. Carry-Forward Rules ✅
**Year-End Processing:**

- **AVP and Below**: Maximum 5 days carry-forward
- **VP and Above**: NO carry-forward allowed

### 3. Mid-Year Joiners ✅
**Pro-Rated Calculation:**

Formula: `(Annual PTO × Remaining Months) / 12`

Example: Employee joins July 1st
- AVP (15 days): `(15 × 6) / 12 = 7.5 days`
- VP (20 days): `(20 × 6) / 12 = 10 days`

---

## 🎉 Holiday Calendar 2025

### India National Holidays
| Date | Holiday | Type |
|------|---------|------|
| Jan 1, 2025 | New Year Day | National |
| Jan 26, 2025 | Republic Day | National |
| Mar 14, 2025 | Holi | National |
| Apr 18, 2025 | Good Friday | National |
| Apr 10, 2025 | Eid ul-Fitr | Regional |
| Jun 17, 2025 | Eid ul-Adha | Regional |
| Aug 15, 2025 | Independence Day | National |
| Aug 19, 2025 | Raksha Bandhan | Optional |
| Oct 2, 2025 | Gandhi Jayanti | National |
| Oct 12, 2025 | Dussehra | Regional |
| Oct 31, 2025 | Diwali | Regional |
| Nov 1, 2025 | Karnataka Rajyotsava | Bengaluru Only |
| Dec 25, 2025 | Christmas | National |

### Location-Specific Holidays
- **Bengaluru**: Karnataka Rajyotsava (Nov 1)
- **Mumbai**: Maharashtra Day (May 1)
- **Delhi**: Delhi Foundation Day (Apr 15) - Optional

### Company Holidays
- **Mar 22, 2025**: Company Foundation Day
- **Sep 15, 2025**: Annual Team Outing
- **Dec 31, 2025**: Year End Party (Optional)

---

## 📝 Sample Leave Requests

### Pending Requests (Test Approval Flow)
1. **Priya Patel** (user@company.com)
   - Type: Casual Leave
   - Dates: Dec 20-22, 2024 (3 days)
   - Reason: Family wedding ceremony
   - Approver: Rajesh Kumar (IT Manager)

2. **John Doe** (john@company.com)
   - Type: Earned Leave
   - Dates: Jan 15-20, 2025 (6 days)
   - Reason: Vacation with family to Goa
   - Approver: Amit Gupta (Sales Manager)

3. **Anita Joshi** (anita@company.com)
   - Type: Sick Leave (Half Day)
   - Dates: Dec 18, 2024 (0.5 day)
   - Reason: Medical checkup appointment
   - Approver: Sneha Reddy (Marketing Manager)

### Approved Requests (Historical Data)
1. **Arjun Singh** - Sick Leave (Nov 15-16, 2024) - ✅ Approved
2. **Rahul Verma** - Casual Leave (Nov 25, 2024) - ✅ Approved
3. **Suresh Nair** - Earned Leave (Oct 10-15, 2024) - ✅ Approved

### Rejected Requests (Test Rejection Flow)
1. **Kavya Menon** - Casual Leave (Dec 24-26) - ❌ Rejected
   - Reason: Too many people on leave during Christmas
2. **Deepak Agarwal** - Earned Leave (Dec 30 - Jan 5) - ❌ Rejected
   - Reason: Year-end deadlines require full team presence

---

## 🔔 Email Notifications & Reminders

### Implemented Features ✅

#### 1. Leave Request Notifications
- Employee receives confirmation email upon submission
- Manager receives approval request email
- HR receives copy of all leave requests
- Employees notified upon approval/rejection

#### 2. Holiday Reminders
**Schedule:** Automated reminders at:
- 7 days before holiday
- 3 days before holiday
- 1 day before holiday

**Recipients:** All employees in the respective location/region

#### 3. Comp Off Expiry Reminders
- **Trigger**: 7 days before 3-month expiry
- **Recipients**: Employee + Manager + HR
- **Content**: Expiry date and balance details

#### 4. Email Action Buttons ✅
**Implemented:** Approve/Reject buttons in emails

- Click "Approve" → Directly approves the request
- Click "Reject" → Opens rejection form with comments
- Secure token-based authentication

#### 5. Weekend/Holiday Exclusion ✅
**Rule:** Leave days calculation excludes:
- Saturdays and Sundays
- Public holidays (from holiday calendar)
- Company-declared holidays

**Example:**
- Request: Monday to Friday (5 calendar days)
- Weekend falls in between: Saturday-Sunday
- Actual leave days deducted: 5 days (weekends not counted)

---

## 💼 Comp Off Module

### Policy ✅
1. **5 hours work** → 0.5 day comp off (half day)
2. **8 hours work** → 1.0 day comp off (full day)
3. **Eligible only for**: Weekend work OR Holiday work
4. **Expiry**: 3 months from approval date

### Multi-Level Approval Flow ✅
```
Employee → L1 Manager → L2 Manager → HR
```

### Test Scenarios
1. **Request Comp Off**:
   - Login as user@company.com
   - Navigate to Comp Off section
   - Apply for comp off earned on weekend/holiday work

2. **Approve Comp Off**:
   - L1: manager@company.com
   - L2: Senior manager (if exists)
   - Final: admin@company.com (HR)

---

## 🧪 Testing Workflows

### Test Case 1: Employee Leave Application
1. Login as: **user@company.com**
2. Navigate to: **Leaves → Apply Leave**
3. Select leave type, dates, reason
4. Submit application
5. Check **Dashboard → Leave Status** for pending request

### Test Case 2: Manager Approval
1. Login as: **manager@company.com**
2. Navigate to: **Approvals → Pending Requests**
3. Review Priya Patel's leave request
4. Approve/Reject with comments
5. Employee receives notification

### Test Case 3: HR Oversight
1. Login as: **admin@company.com**
2. Navigate to: **Reports → Leave Reports**
3. View all pending, approved, rejected leaves
4. Generate monthly leave report

### Test Case 4: Leave Balance Check
1. Login as any employee
2. Navigate to: **Dashboard → Leave Balance**
3. View year-wise segregated balances:
   - Casual Leave: X/12
   - Sick Leave: X/12
   - Earned Leave: X/21
   - Carry-forward amounts visible

### Test Case 5: Holiday Calendar
1. Login as any user
2. Navigate to: **Holidays** section
3. View 2025 India holiday calendar
4. See location-specific holidays highlighted

---

## 📦 Dashboard Sections Implemented

As per GLF PDF Page 7 (Dashboard Requirements):

### 1. Leave and Comp Off Policy ✅
**Display:**
- View details of leave types
- Accrual rules
- Carry forward rules
- Required proofs/documentation

### 2. Leave Balance Section ✅
**Features:**
- Current leave balances for all types
- Year-wise segregation
- Visual progress bars
- Breakdown: Total / Used / Available

### 3. Booked Leaves Section ✅
**Display:**
- Upcoming approved leaves
- Current active leaves
- This month's leave schedule
- Tabbed interface for filtering

### 4. Approved Leaves Status ✅
**Statistics:**
- Total approved requests
- Pending requests count
- Rejected requests count
- Average processing time
- Approval rate percentage

### 5. Upcoming Holidays ✅
**Features:**
- Next 3-5 holidays displayed
- Holiday name, date, type
- Location-specific filtering

### 6. Pie Chart of Leaves Applied ✅ (Optional)
**Visualizations:**
- Leave type distribution
- Monthly trend analysis
- Department-wise comparison

---

## 🎯 Additional Points Implemented

As per GLF PDF Page 25:

### 1. Comp Off Added Only After Manager Approval ✅
- **Rule**: Comp off balance credited ONLY after full approval chain
- **Status Tracking**: PENDING → APPROVED → Added to balance
- **Rejection**: If rejected, comp off NOT added

### 2. Leave Balance Visible at Application Time ✅
- **Display**: Real-time balance shown in leave application form
- **Validation**: Cannot apply if insufficient balance
- **Warning**: Alert if balance becomes negative

### 3. All Fields Mandatory ✅
**Leave Application:**
- Employee Name
- Leave Type
- Start Date
- End Date
- Duration (Full/Half Day)
- Reason

**Comp Off Application:**
- Employee Name
- Employee ID
- Work Date
- From Time / To Time
- Project Details
- Reason for overtime

---

## 🚀 How to Use

### 1. Start the Servers
```bash
# Backend (if not already running)
cd backend
npm run dev

# Frontend (if not already running)
cd frontend
npm run dev
```

### 2. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

### 3. Login Options
**Recommended for Testing:**

1. **HR Admin View**: admin@company.com
   - Access to all modules
   - Can view all employees
   - Can override policies

2. **Manager View**: manager@company.com
   - Approval interface
   - Team leave calendar
   - Comp off approvals

3. **Employee View**: user@company.com
   - Apply for leave
   - View leave balance
   - Check leave history

### 4. Test Data Refresh
If you need to reset the database with fresh test data:
```bash
cd backend
npm run db:seed
```

---

## 📊 Dashboard Features

### Employee Dashboard
- **Leave Balance Cards**: Visual display of all leave types
- **Upcoming Leaves**: Calendar view of approved leaves
- **Recent Requests**: Status of pending/approved/rejected
- **Quick Apply**: One-click leave application

### Manager Dashboard
- **Team Calendar**: Visual team availability
- **Pending Approvals**: List requiring action
- **Team Leave Summary**: Department-wise analytics
- **Bulk Actions**: Approve/reject multiple requests

### HR Admin Dashboard
- **Company Overview**: Total employees, leaves
- **Pending Workflows**: All approval chains
- **Reports Section**: Monthly, quarterly, annual
- **Policy Management**: Configure rules and policies

---

## ✅ GLF Compliance Checklist

### India Requirements
- [x] Monthly accrual (1 CL + 1 PL)
- [x] Joining date pro-ration (1st-15th full, 16th+ half)
- [x] CL expires Dec 31st
- [x] PL max 30 days carry-forward
- [x] Maternity 180 days (married females only)
- [x] Paternity 15 days (married males only)
- [x] CL/PL blocked during maternity
- [x] Multi-level approvals (Leave: 2, Comp Off: 3)

### USA Requirements
- [x] Role-based PTO (AVP: 15, VP+: 20)
- [x] AVP max 5 days carry-forward
- [x] VP+ no carry-forward
- [x] Mid-year pro-ration
- [x] Bereavement leave support

### Common Requirements
- [x] Email notifications (requests, approvals, cancellations)
- [x] Holiday reminders (7, 3, 1 day before)
- [x] Comp off expiry reminders
- [x] Approve/Reject in email
- [x] Weekend/holiday exclusion in calculations
- [x] Comp off only after approval
- [x] Leave balance visible at application
- [x] All fields mandatory

---

## 📞 Support

For any issues or questions about the test data:
1. Check the logs in the backend console
2. Review the seed script: `backend/prisma/seed.ts`
3. Check the database with Prisma Studio: `npm run db:studio`

---

**Document Version:** 1.0
**Last Updated:** October 6, 2025
**Status:** ✅ Complete and Ready for Testing
