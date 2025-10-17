# Leave Management System - New Features Documentation

## Overview

This document provides a comprehensive overview of all new features, enhancements, and technical improvements implemented in the Leave Management System. It serves as a technical reference for developers, QA teams, and product stakeholders.

---

## Table of Contents

1. [Regional Leave System (USA + India)](#1-regional-leave-system-usa--india)
2. [Maternity & Paternity Leave Management](#2-maternity--paternity-leave-management)
3. [Half-Day Leave with Period Selection](#3-half-day-leave-with-period-selection)
4. [Real-Time Leave Balance Validation](#4-real-time-leave-balance-validation)
5. [Advanced Comp Off Management](#5-advanced-comp-off-management)
6. [Automated Leave Accrual System](#6-automated-leave-accrual-system)
7. [Leave Cancellation & Modification Workflow](#7-leave-cancellation--modification-workflow)
8. [Calendar Integration (Google & Outlook)](#8-calendar-integration-google--outlook)
9. [Leave Templates System](#9-leave-templates-system)
10. [Weekend & Holiday Exclusion](#10-weekend--holiday-exclusion)
11. [Multi-Level Approval Workflow](#11-multi-level-approval-workflow)
12. [Automation Rules Engine](#12-automation-rules-engine)

---

## 1. Regional Leave System (USA + India)

### Overview
The system now supports region-specific leave policies for both USA and India, with different leave types, accrual rules, and entitlements.

### India Leave Types
- **Casual Leave (CL)**: 12 days/year, monthly accrual (1 day/month)
- **Sick Leave (SL)**: 12 days/year, monthly accrual (1 day/month)
- **Privilege Leave (PL)**: 12 days/year, monthly accrual (1 day/month)
- **Maternity Leave**: 180 days (6 months) for eligible female employees
- **Paternity Leave**: 15 days for eligible married male employees
- **Comp Off**: Earned through weekend/holiday work, 3-month expiry

### USA Leave Types
- **PTO (Paid Time Off)**: Unified leave system
  - **VP**: 25 days/year
  - **AVP**: 20 days/year
  - **Employees**: 15 days/year
- **No Carry Forward**: PTO resets annually
- **Pro-rata Calculation**: Mid-year joiners get proportional days

### Technical Implementation

#### Database Schema
```typescript
// User model with region fields
model User {
  country: String?       // USA, INDIA
  designation: String?   // AVP, VP, MANAGER (for USA PTO policies)
  gender: String?        // MALE, FEMALE, OTHER
  maritalStatus: String? // SINGLE, MARRIED, DIVORCED, WIDOWED
}

// Leave Policy with region support
model LeavePolicy {
  region: String @default("INDIA")
  location: String
  entitlementDays: Float
  accrualRate: Float @default(1.0)
}
```

#### Seed Data Structure
- **India Users**: 16 employees across departments (HR, IT, Sales, Marketing, Finance, Operations)
- **USA Users**: 4 employees (1 VP, 1 AVP, 2 Employees with different joining dates)
- **Test Accounts**: Married employees for maternity/paternity testing

#### Files Changed
- `backend/prisma/schema.prisma` - Added country, designation, gender, maritalStatus fields
- `backend/prisma/seed.ts` - Enhanced with USA employees and PTO balances
- `backend/src/services/policyEngine.ts` - Region-specific validation logic

---

## 2. Maternity & Paternity Leave Management

### Overview
Comprehensive maternity and paternity leave system with eligibility validation, documentation requirements, and duplicate prevention.

### Maternity Leave Features

#### Eligibility Criteria
- **Gender**: FEMALE (mandatory)
- **Marital Status**: MARRIED (recommended, warning if not married)
- **Entitlement**: 180 days (6 months)
- **Frequency**: Once per calendar year

#### Validations
1. **Frontend Filtering**: Maternity leave option only shown to female employees
2. **Backend Validation**: Double-check gender eligibility
3. **Duplicate Prevention**: Cannot apply twice in the same year (checks PENDING and APPROVED status)
4. **Documentation**: Medical certificate and pregnancy proof required

#### Error Messages
```typescript
// Gender validation
"Maternity leave is only available for female employees"

// Duplicate check
"You already have a maternity leave request for this year (Status: APPROVED)"

// Documentation warning
"Medical certificate and pregnancy proof required for maternity leave"
```

### Paternity Leave Features

#### Eligibility Criteria
- **Gender**: MALE (mandatory)
- **Marital Status**: MARRIED (mandatory - hard requirement)
- **Entitlement**: 15 days
- **Frequency**: Once per calendar year

#### Validations
1. **Frontend Filtering**: Paternity leave only shown to married male employees
2. **Backend Validation**: Checks both gender and marital status
3. **Duplicate Prevention**: One request per year
4. **Documentation**: Birth certificate or medical certificate required

#### Error Messages
```typescript
// Gender validation
"Paternity leave is only available for male employees"

// Marital status validation
"Paternity leave is only available for married employees"

// Duplicate check
"You already have a paternity leave request for this year (Status: PENDING)"

// Documentation warning
"Birth certificate or medical certificate required for paternity leave"
```

### Technical Implementation

#### Backend Service (`policyEngine.ts:120-180`)
```typescript
private async validateMaternityPaternityEligibility(
  request: LeaveValidationRequest,
  employee: any,
  result: LeaveValidationResult
): Promise<void> {
  const currentYear = new Date().getFullYear();

  // Maternity leave validation
  if (request.leaveType === LeaveType.MATERNITY_LEAVE) {
    if (!employee.gender || employee.gender !== 'FEMALE') {
      result.isValid = false;
      result.errors.push('Maternity leave is only available for female employees');
      return;
    }

    // Check for duplicate
    const existingMaternityLeave = await prisma.leaveRequest.findFirst({
      where: {
        employeeId: request.employeeId,
        leaveType: LeaveType.MATERNITY_LEAVE,
        status: { in: ['APPROVED', 'PENDING'] },
        startDate: {
          gte: new Date(`${currentYear}-01-01`),
          lte: new Date(`${currentYear}-12-31`)
        }
      }
    });

    if (existingMaternityLeave) {
      result.isValid = false;
      result.errors.push(`You already have a maternity leave request for this year`);
    }

    result.requiredDocumentation = true;
    result.warnings.push('Medical certificate and pregnancy proof required');
  }

  // Paternity leave validation (similar logic)
}
```

#### Frontend Filtering (`LeavesPage.tsx:450-470`)
```typescript
// Filter leave types based on user profile
const availableLeaveTypes = Object.values(LeaveType).filter(type => {
  // Maternity leave only for female employees
  if (type === LeaveType.MATERNITY_LEAVE) {
    return currentUser?.gender === 'FEMALE';
  }

  // Paternity leave only for married male employees
  if (type === LeaveType.PATERNITY_LEAVE) {
    return currentUser?.gender === 'MALE' &&
           currentUser?.maritalStatus === 'MARRIED';
  }

  return true;
});
```

#### Test Accounts
```typescript
// Maternity leave testing
Email: lakshmi@company.com
Password: password123
Gender: FEMALE
Marital Status: MARRIED
Employee ID: IND015

// Paternity leave testing
Email: karthik@company.com
Password: password123
Gender: MALE
Marital Status: MARRIED
Employee ID: IND016
```

---

## 3. Half-Day Leave with Period Selection

### Overview
Enhanced half-day leave functionality with explicit period selection (morning/afternoon) for better clarity and reporting.

### Features

#### Period Options
- **First Half (Morning)**: Takes leave in the morning session
- **Second Half (Afternoon)**: Takes leave in the afternoon session

#### UI Enhancements
- Smooth Collapse animation when toggling half-day switch
- Clear labeling: "First Half (Morning)" / "Second Half (Afternoon)"
- Helper text: "Select which half of the day you want to take off"
- Real-time summary showing selected period

### Technical Implementation

#### Database Schema (`schema.prisma:91`)
```typescript
model LeaveRequest {
  isHalfDay: Boolean @default(false)
  halfDayPeriod: String? // FIRST_HALF, SECOND_HALF (only when isHalfDay is true)
}
```

#### Frontend Component (`LeavesPage.tsx:580-600`)
```typescript
// Form state
const [formData, setFormData] = useState({
  leaveType: LeaveType.CASUAL_LEAVE,
  startDate: null as Dayjs | null,
  endDate: null as Dayjs | null,
  reason: '',
  isHalfDay: false,
  halfDayPeriod: 'FIRST_HALF' as 'FIRST_HALF' | 'SECOND_HALF',
  employeeId: ''
});

// UI Component with Collapse animation
{formData.isHalfDay && (
  <Grid item xs={12}>
    <Collapse in={formData.isHalfDay}>
      <TextField
        select
        fullWidth
        label="Half Day Period"
        value={formData.halfDayPeriod}
        onChange={(e) => setFormData(prev => ({
          ...prev,
          halfDayPeriod: e.target.value as 'FIRST_HALF' | 'SECOND_HALF'
        }))}
        helperText="Select which half of the day you want to take off"
      >
        <MenuItem value="FIRST_HALF">First Half (Morning)</MenuItem>
        <MenuItem value="SECOND_HALF">Second Half (Afternoon)</MenuItem>
      </TextField>
    </Collapse>
  </Grid>
)}

// Submit includes halfDayPeriod
const requestData = {
  type: formData.leaveType,
  startDate: formData.startDate.format('YYYY-MM-DD'),
  endDate: formData.endDate.format('YYYY-MM-DD'),
  reason: formData.reason.trim(),
  isHalfDay: formData.isHalfDay,
  ...(formData.isHalfDay && { halfDayPeriod: formData.halfDayPeriod })
};
```

#### Display in Leave Summary
```typescript
<Alert severity="info">
  Total days: {calculateTotalDays()}
  {formData.isHalfDay &&
    `(Half Day - ${formData.halfDayPeriod === 'FIRST_HALF' ? 'Morning' : 'Afternoon'})`
  }
</Alert>
```

### User Experience Flow
1. User selects leave dates
2. Toggles "Half Day Leave" switch
3. Period selector appears with smooth animation
4. User selects "First Half (Morning)" or "Second Half (Afternoon)"
5. Summary shows: "Total days: 0.5 (Half Day - Morning)"
6. Submission includes halfDayPeriod in request

---

## 4. Real-Time Leave Balance Validation

### Overview
Enhanced balance validation that considers pending leave requests, preventing over-booking and providing accurate available balance.

### Features

#### Smart Balance Calculation
- **Total Entitlement**: Original allocation for the year
- **Used**: Approved and consumed leaves
- **Pending**: Currently awaiting approval
- **Real Available**: `available - pending`

#### Real-Time Warnings
```typescript
"Note: 5 days are already pending approval for CASUAL_LEAVE"
"Insufficient balance. Available: 7 days (after pending: 5), Requested: 10 days"
```

### Technical Implementation

#### Enhanced Validation Logic (`policyEngine.ts:85-115`)
```typescript
private async validateLeaveBalance(
  request: LeaveValidationRequest,
  result: LeaveValidationResult
): Promise<void> {
  // Get current balance
  const leaveBalance = await prisma.leaveBalance.findFirst({
    where: {
      employeeId: request.employeeId,
      leaveType: request.leaveType,
      year: currentYear
    }
  });

  if (!leaveBalance) {
    result.isValid = false;
    result.errors.push(`No leave balance found for ${request.leaveType}`);
    return;
  }

  // Calculate pending leaves of the same type
  const pendingLeaves = await prisma.leaveRequest.findMany({
    where: {
      employeeId: request.employeeId,
      leaveType: request.leaveType,
      status: 'PENDING'
    }
  });

  const totalPendingDays = pendingLeaves.reduce(
    (sum, leave) => sum + Number(leave.totalDays),
    0
  );

  // Real available = available - pending
  const realAvailable = leaveBalance.available - totalPendingDays;

  // Show warning if pending exists
  if (totalPendingDays > 0) {
    result.warnings.push(
      `Note: ${totalPendingDays} days are already pending approval for ${request.leaveType}`
    );
  }

  // Validate against real available
  const effectiveDays = request.totalDays ||
    this.calculateBusinessDays(request.startDate, request.endDate);

  if (effectiveDays > realAvailable) {
    result.isValid = false;
    result.errors.push(
      `Insufficient leave balance. Available: ${realAvailable} days ` +
      `(after pending: ${totalPendingDays}), Requested: ${effectiveDays} days`
    );
  }
}
```

### Example Scenario
```
Initial Balance: 12 days (Casual Leave)
First Request: 5 days (Status: PENDING)
Second Request: 10 days (Attempting)

Validation Result:
- Total Entitlement: 12 days
- Used: 0 days
- Pending: 5 days
- Real Available: 7 days
- Requested: 10 days
- Result: ❌ INVALID
- Error: "Insufficient balance. Available: 7 days (after pending: 5), Requested: 10 days"
```

---

## 5. Advanced Comp Off Management

### Overview
Comprehensive compensatory off system for tracking weekend/holiday work and managing comp off leaves with expiry.

### Features

#### Comp Off Work Log
- **Work Date**: Date of weekend/holiday work
- **Hours Worked**: Actual hours worked
- **Work Type**: WEEKEND, HOLIDAY, EXTENDED_HOURS
- **Work Description**: Details of work performed
- **Manager Verification**: Requires manager approval
- **Comp Off Earned**: Auto-calculated based on hours

#### Comp Off Request
- **Work Log Reference**: Links to verified work log
- **Hours to Redeem**: Hours being converted to comp off
- **Days Requested**: Calculated based on policy (8 hours = 1 day)
- **Expiry Date**: 3 months from approval
- **Auto-Expiry**: Scheduled job expires unused comp offs

### Database Schema

```typescript
model CompOffWorkLog {
  id: String @id @default(cuid())
  employeeId: String
  workDate: DateTime
  hoursWorked: Float
  workType: String // WEEKEND, HOLIDAY, EXTENDED_HOURS
  workDescription: String
  isVerified: Boolean @default(false)
  verifiedBy: String?
  compOffEarned: Float @default(0)
  status: String @default("PENDING") // PENDING, VERIFIED, REJECTED, CONSUMED
}

model CompOffRequest {
  id: String @id @default(cuid())
  employeeId: String
  workLogId: String
  hoursToRedeem: Float
  daysRequested: Float
  startDate: DateTime
  endDate: DateTime
  status: String @default("PENDING")
  expiryDate: DateTime // 3 months from approval
  isExpired: Boolean @default(false)
}

model CompOffBalance {
  id: String @id @default(cuid())
  employeeId: String
  year: Int
  totalEarned: Float @default(0)
  totalUsed: Float @default(0)
  available: Float @default(0)
  expired: Float @default(0)
}
```

### Workflow
1. **Employee logs weekend work** → Creates CompOffWorkLog (status: PENDING)
2. **Manager verifies work** → Updates status to VERIFIED, calculates compOffEarned
3. **Employee requests comp off** → Creates CompOffRequest with workLogId
4. **Manager approves** → Sets expiryDate (3 months from approval)
5. **Employee uses leave** → Deducts from CompOffBalance
6. **Scheduled expiry job** → Marks expired comp offs after 3 months

### Automation
```typescript
// Scheduled job runs daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  // Expire comp offs older than 3 months
  await prisma.compOffRequest.updateMany({
    where: {
      expiryDate: { lt: new Date() },
      status: 'APPROVED',
      isExpired: false
    },
    data: {
      status: 'EXPIRED',
      isExpired: true
    }
  });
});
```

---

## 6. Automated Leave Accrual System

### Overview
Automated monthly accrual system for India employees with pro-rata calculations for mid-month joiners.

### India Monthly Accrual Rules

#### Standard Accrual
- **Casual Leave**: 1 day/month (12 days/year)
- **Sick Leave**: 1 day/month (12 days/year)
- **Privilege Leave**: 1 day/month (12 days/year)

#### Pro-Rata Calculation
- **Joined Before 15th**: Full month accrual
- **Joined After 15th**: Half month accrual
- **Mid-Year Joiners**: Remaining months calculated

### Technical Implementation

#### Monthly Accrual Model
```typescript
model MonthlyAccrual {
  id: String @id @default(cuid())
  employeeId: String
  year: Int
  month: Int // 1-12
  casualLeave: Float @default(0)
  privilegeLeave: Float @default(0)
  proRated: Boolean @default(false)
  joiningDate: DateTime?
  processedAt: DateTime @default(now())
  status: String @default("PROCESSED")

  @@unique([employeeId, year, month])
}
```

#### Accrual Service (`backend/src/services/accrualService.ts`)
```typescript
export async function processMonthlyAccrual() {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Get all India employees
  const indiaEmployees = await prisma.user.findMany({
    where: {
      country: 'INDIA',
      status: 'ACTIVE'
    }
  });

  for (const employee of indiaEmployees) {
    // Check if already processed
    const existingAccrual = await prisma.monthlyAccrual.findUnique({
      where: {
        employeeId_year_month: {
          employeeId: employee.id,
          year: currentYear,
          month: currentMonth
        }
      }
    });

    if (existingAccrual) continue;

    // Calculate pro-rata if joining month
    const joiningMonth = employee.joiningDate.getMonth() + 1;
    const joiningDay = employee.joiningDate.getDate();
    const isJoiningMonth = (joiningMonth === currentMonth &&
                            employee.joiningDate.getFullYear() === currentYear);

    let clAccrual = 1.0;
    let plAccrual = 1.0;
    let slAccrual = 1.0;

    if (isJoiningMonth) {
      if (joiningDay > 15) {
        clAccrual = 0.5;
        plAccrual = 0.5;
        slAccrual = 0.5;
      }
    }

    // Create accrual record
    await prisma.monthlyAccrual.create({
      data: {
        employeeId: employee.id,
        year: currentYear,
        month: currentMonth,
        casualLeave: clAccrual,
        privilegeLeave: plAccrual,
        proRated: isJoiningMonth && joiningDay > 15,
        joiningDate: employee.joiningDate,
        status: 'PROCESSED'
      }
    });

    // Update leave balance
    await updateLeaveBalance(employee.id, 'CASUAL_LEAVE', clAccrual);
    await updateLeaveBalance(employee.id, 'PRIVILEGE_LEAVE', plAccrual);
    await updateLeaveBalance(employee.id, 'SICK_LEAVE', slAccrual);
  }
}
```

#### Scheduled Job (`backend/src/services/scheduledJobs.ts:15-25`)
```typescript
// Run monthly accrual on 1st of every month at 1 AM
cron.schedule('0 1 1 * *', async () => {
  console.log('Running monthly leave accrual...');
  await processMonthlyAccrual();
  console.log('Monthly accrual completed');
});
```

### Year-End Carry Forward

#### Carry Forward Rules (India)
- **Casual Leave**: Max 5 days carry forward
- **Privilege Leave**: Max 10 days carry forward
- **Sick Leave**: No carry forward (use-it-or-lose-it)

#### Implementation
```typescript
// Runs on December 31st at 11 PM
cron.schedule('0 23 31 12 *', async () => {
  console.log('Processing year-end carry forward...');

  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  const allBalances = await prisma.leaveBalance.findMany({
    where: { year: currentYear }
  });

  for (const balance of allBalances) {
    let carryForwardDays = 0;

    switch (balance.leaveType) {
      case 'CASUAL_LEAVE':
        carryForwardDays = Math.min(balance.available, 5);
        break;
      case 'PRIVILEGE_LEAVE':
        carryForwardDays = Math.min(balance.available, 10);
        break;
      case 'SICK_LEAVE':
        carryForwardDays = 0; // No carry forward
        break;
    }

    // Create next year's balance with carry forward
    await prisma.leaveBalance.create({
      data: {
        employeeId: balance.employeeId,
        leaveType: balance.leaveType,
        year: nextYear,
        totalEntitlement: getEntitlement(balance.leaveType),
        carryForward: carryForwardDays,
        available: getEntitlement(balance.leaveType) + carryForwardDays,
        used: 0
      }
    });
  }
});
```

---

## 7. Leave Cancellation & Modification Workflow

### Overview
Comprehensive workflow for cancelling or modifying approved/pending leave requests with manager approval.

### Features

#### Leave Cancellation
- **Cancellation Request**: Employee can request to cancel approved/pending leave
- **Cancellation Reason**: Mandatory reason for cancellation
- **Manager Approval**: Requires manager approval to cancel
- **Status Tracking**: PENDING → APPROVED → CANCELLED
- **Balance Restoration**: Automatically restores leave balance upon approval

#### Leave Modification
- **Modify Dates**: Change start/end dates
- **Modify Leave Type**: Change leave type (subject to balance)
- **Modify Reason**: Update leave reason
- **Modification Reason**: Mandatory reason for modification
- **Manager Approval**: Requires manager approval

### Database Schema

```typescript
model LeaveCancellationRequest {
  id: String @id @default(cuid())
  leaveRequestId: String
  employeeId: String
  cancellationReason: String
  status: String @default("PENDING") // PENDING, APPROVED, REJECTED
  approvedBy: String?
  approvedAt: DateTime?
  rejectionReason: String?
}

model LeaveModificationRequest {
  id: String @id @default(cuid())
  originalLeaveId: String
  employeeId: String
  newStartDate: DateTime?
  newEndDate: DateTime?
  newLeaveType: String?
  newReason: String?
  modificationReason: String
  status: String @default("PENDING")
  approvedBy: String?
  approvedAt: DateTime?
  rejectionReason: String?
}
```

### Workflow Examples

#### Cancellation Flow
```
1. Employee has APPROVED leave (June 10-15, 2025)
2. Employee requests cancellation
   - Reason: "Family emergency resolved, no longer need leave"
3. System creates LeaveCancellationRequest (status: PENDING)
4. Manager receives notification
5. Manager approves cancellation
6. System updates:
   - LeaveRequest status: CANCELLED
   - LeaveCancellationRequest status: APPROVED
   - LeaveBalance: Restores 6 days
7. Employee receives confirmation
```

#### Modification Flow
```
1. Employee has APPROVED leave (June 10-15, 2025, Casual Leave)
2. Employee requests modification
   - New dates: June 12-17, 2025
   - Reason: "Need to adjust dates due to project deadline"
3. System validates:
   - New dates don't overlap with other leaves
   - Balance sufficient for new dates
4. Manager approves
5. System updates LeaveRequest with new dates
6. Calendar events updated (Google/Outlook)
```

---

## 8. Calendar Integration (Google & Outlook)

### Overview
Automatic synchronization of leave requests with Google Calendar and Outlook Calendar for better visibility.

### Features

#### Supported Providers
- **Google Calendar**: OAuth 2.0 integration
- **Outlook Calendar**: Microsoft Graph API integration

#### Auto-Sync Events
- **Leave Approved**: Creates calendar event
- **Leave Modified**: Updates existing event
- **Leave Cancelled**: Deletes calendar event
- **Event Details**: Leave type, dates, reason

### Database Schema

```typescript
model CalendarIntegration {
  id: String @id @default(cuid())
  userId: String
  provider: String // 'google' or 'outlook'
  accessToken: String
  refreshToken: String?
  calendarId: String?
  enabled: Boolean @default(true)
}

model LeaveRequest {
  googleCalendarEventId: String?
  outlookCalendarEventId: String?
}
```

### Implementation

#### Calendar Service (`backend/src/services/calendarService.ts`)
```typescript
export async function createCalendarEvent(
  leaveRequest: LeaveRequest,
  userId: string
): Promise<void> {
  const integrations = await prisma.calendarIntegration.findMany({
    where: {
      userId: userId,
      enabled: true
    }
  });

  for (const integration of integrations) {
    if (integration.provider === 'google') {
      const eventId = await createGoogleEvent(leaveRequest, integration);
      await prisma.leaveRequest.update({
        where: { id: leaveRequest.id },
        data: { googleCalendarEventId: eventId }
      });
    } else if (integration.provider === 'outlook') {
      const eventId = await createOutlookEvent(leaveRequest, integration);
      await prisma.leaveRequest.update({
        where: { id: leaveRequest.id },
        data: { outlookCalendarEventId: eventId }
      });
    }
  }
}

async function createGoogleEvent(
  leaveRequest: LeaveRequest,
  integration: CalendarIntegration
): Promise<string> {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: integration.accessToken,
    refresh_token: integration.refreshToken
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const event = {
    summary: `Leave: ${leaveRequest.leaveType}`,
    description: leaveRequest.reason,
    start: {
      date: leaveRequest.startDate.toISOString().split('T')[0]
    },
    end: {
      date: leaveRequest.endDate.toISOString().split('T')[0]
    },
    colorId: '11' // Red color for leave
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event
  });

  return response.data.id;
}
```

#### Trigger Points
```typescript
// On leave approval
await createCalendarEvent(leaveRequest, employeeId);

// On leave modification
await updateCalendarEvent(leaveRequest, employeeId);

// On leave cancellation
await deleteCalendarEvent(leaveRequest, employeeId);
```

---

## 9. Leave Templates System

### Overview
Reusable leave templates for common leave scenarios, reducing repetitive data entry and improving consistency.

### Features

#### Template Categories
- **PERSONAL**: Personal/family emergencies
- **MEDICAL**: Medical appointments, procedures
- **VACATION**: Planned vacations
- **CUSTOM**: User-defined templates

#### Template Properties
- **Name**: Template name (e.g., "Annual Vacation")
- **Description**: Template description
- **Leave Type**: Pre-selected leave type
- **Duration**: Fixed or variable days
- **Reason**: Pre-filled reason text
- **Is Half Day**: Half-day flag
- **Public/Private**: Shareable or personal
- **Tags**: Categorization tags

### Database Schema

```typescript
model LeaveTemplate {
  id: String @id @default(cuid())
  name: String
  description: String?
  category: String @default("PERSONAL")

  // Template data
  leaveType: String
  duration: Int? // null for variable duration
  reason: String
  isHalfDay: Boolean @default(false)

  // Sharing
  isPublic: Boolean @default(false)
  isActive: Boolean @default(true)
  usageCount: Int @default(0)

  // Owner
  createdBy: String
  tags: String? // JSON array
}
```

### Example Templates

```typescript
// Personal Templates
{
  name: "Medical Appointment",
  category: "MEDICAL",
  leaveType: "SICK_LEAVE",
  duration: 1,
  reason: "Doctor's appointment for routine check-up",
  isHalfDay: true,
  isPublic: true
}

{
  name: "Family Emergency",
  category: "PERSONAL",
  leaveType: "CASUAL_LEAVE",
  duration: null, // Variable
  reason: "Family emergency - details to be provided",
  isPublic: false
}

// Vacation Templates
{
  name: "Annual Vacation - 2 Weeks",
  category: "VACATION",
  leaveType: "PRIVILEGE_LEAVE",
  duration: 10,
  reason: "Annual vacation with family",
  isPublic: true
}
```

### Usage Flow
```
1. Employee clicks "Use Template"
2. Selects template from list
3. Form auto-fills with template data
4. Employee adjusts dates/reason if needed
5. Submits leave request
6. Template usage count increments
```

---

## 10. Weekend & Holiday Exclusion

### Overview
Intelligent calculation of working days by automatically excluding weekends and company holidays from leave requests.

### Features

#### Auto-Exclusion Logic
- **Weekends**: Saturdays and Sundays excluded
- **Company Holidays**: Location-specific holidays excluded
- **Real-Time Calculation**: Updates as user selects dates
- **Warning Display**: Shows adjusted working days

### Implementation

#### Holiday Model
```typescript
model Holiday {
  id: String @id @default(cuid())
  name: String
  date: DateTime
  location: String
  region: String @default("INDIA")
  isOptional: Boolean @default(false)
  type: String @default("COMPANY")
}
```

#### Business Days Calculation (`policyEngine.ts:250-290`)
```typescript
private calculateBusinessDays(startDate: Date, endDate: Date): number {
  let businessDays = 0;
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();

    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Check if it's a holiday
      const isHoliday = await prisma.holiday.findFirst({
        where: {
          date: currentDate,
          location: employee.location
        }
      });

      if (!isHoliday) {
        businessDays++;
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return businessDays;
}
```

### Example Calculation

```
Leave Request: June 9 (Friday) - June 12 (Monday)
Calendar Days: 4

Breakdown:
- June 9 (Friday): ✅ Working day → Count: 1
- June 10 (Saturday): ❌ Weekend → Excluded
- June 11 (Sunday): ❌ Weekend → Excluded
- June 12 (Monday): ✅ Working day → Count: 2

Result: 2 business days

If June 12 is also a holiday:
Result: 1 business day

Warning: "Leave days adjusted: Requested 4 days, actual working days 2"
```

### User Experience
```typescript
// Real-time display in UI
<Alert severity="info">
  Calendar Days: 4 | Working Days: 2 (2 weekends excluded)
</Alert>

// Warning if significant difference
{calendarDays !== workingDays && (
  <Alert severity="warning">
    Leave days adjusted: Requested {calendarDays} days,
    actual working days {workingDays}
  </Alert>
)}
```

---

## 11. Multi-Level Approval Workflow

### Overview
Hierarchical approval system supporting multiple approval levels based on leave type, duration, or organizational hierarchy.

### Features

#### Approval Levels
- **Level 1**: Direct reporting manager (always required)
- **Level 2**: Department head (for long leaves >5 days)
- **Level 3**: HR Admin (for special leaves like maternity/paternity)

#### Approval States
- **PENDING**: Awaiting approval
- **APPROVED**: Approved by approver
- **REJECTED**: Rejected by approver

### Database Schema

```typescript
model Approval {
  id: String @id @default(cuid())
  leaveRequestId: String
  approverId: String
  level: Int @default(1)
  status: String @default("PENDING")
  comments: String?
  approvedAt: DateTime?

  @@unique([leaveRequestId, level])
}
```

### Approval Logic

```typescript
// Determine approval levels based on leave type and duration
function determineApprovalLevels(leaveRequest: LeaveRequest): number[] {
  const levels: number[] = [1]; // Level 1 always required

  // Long leaves require department head approval
  if (leaveRequest.totalDays > 5) {
    levels.push(2);
  }

  // Special leaves require HR approval
  if (['MATERNITY_LEAVE', 'PATERNITY_LEAVE', 'COMP_OFF'].includes(leaveRequest.leaveType)) {
    levels.push(3);
  }

  return levels;
}

// Create approval records
async function createApprovals(leaveRequestId: string, employeeId: string): Promise<void> {
  const employee = await prisma.user.findUnique({
    where: { id: employeeId },
    include: { reportingManager: true }
  });

  const leaveRequest = await prisma.leaveRequest.findUnique({
    where: { id: leaveRequestId }
  });

  const levels = determineApprovalLevels(leaveRequest);

  for (const level of levels) {
    let approverId: string;

    if (level === 1) {
      approverId = employee.reportingManagerId;
    } else if (level === 2) {
      // Find department head
      approverId = await findDepartmentHead(employee.department);
    } else if (level === 3) {
      // Find HR Admin
      approverId = await findHRAdmin();
    }

    await prisma.approval.create({
      data: {
        leaveRequestId,
        approverId,
        level,
        status: 'PENDING'
      }
    });
  }
}
```

### Approval Workflow

```
Example: 7-day Maternity Leave Request

Step 1: Create Leave Request (status: PENDING)
Step 2: Create Approval Records
  - Level 1: Reporting Manager (PENDING)
  - Level 2: Department Head (PENDING)
  - Level 3: HR Admin (PENDING)

Step 3: Level 1 Approval
  - Manager approves with comments
  - Approval.status = APPROVED
  - Notification sent to Department Head

Step 4: Level 2 Approval
  - Department Head approves
  - Approval.status = APPROVED
  - Notification sent to HR Admin

Step 5: Level 3 Approval (Final)
  - HR Admin approves
  - Approval.status = APPROVED
  - LeaveRequest.status = APPROVED
  - Leave balance deducted
  - Calendar event created
  - Notifications sent to all parties
```

---

## 12. Automation Rules Engine

### Overview
Flexible automation system for defining custom rules and actions based on leave events and conditions.

### Features

#### Trigger Types
- **LEAVE_REQUEST**: New leave request submitted
- **APPROVAL_PENDING**: Approval awaiting action
- **LEAVE_APPROVED**: Leave request approved
- **LEAVE_REJECTED**: Leave request rejected
- **LEAVE_CANCELLED**: Leave request cancelled
- **BALANCE_LOW**: Leave balance below threshold

#### Condition Types
- **Leave Type**: Match specific leave types
- **Duration**: Leave duration thresholds
- **Department**: Employee department
- **Balance**: Leave balance conditions
- **Date Range**: Specific date ranges

#### Action Types
- **SEND_NOTIFICATION**: Send notification to user/manager
- **SEND_EMAIL**: Send email to specified addresses
- **AUTO_APPROVE**: Auto-approve under conditions
- **ESCALATE**: Escalate to higher authority
- **REQUIRE_DOCUMENTATION**: Flag for documentation
- **ADJUST_BALANCE**: Adjust leave balance

### Database Schema

```typescript
model AutomationRule {
  id: String @id @default(cuid())
  name: String
  description: String?
  enabled: Boolean @default(true)
  priority: Int @default(1)
  triggerType: String
  triggerConditions: String // JSON string
  actions: String // JSON string
  validationRules: String? // JSON string
  createdBy: String
  lastExecuted: DateTime?
  executionCount: Int @default(0)
}

model RuleExecution {
  id: String @id @default(cuid())
  ruleId: String
  triggerContext: String // JSON string
  result: String // JSON string
  success: Boolean
  executionTime: Int // milliseconds
  actionsExecuted: String // JSON string
  errors: String?
}
```

### Example Rules

#### Rule 1: Auto-Approve Short Leaves
```json
{
  "name": "Auto-Approve Casual Leave <= 2 Days",
  "triggerType": "LEAVE_REQUEST",
  "triggerConditions": {
    "leaveType": "CASUAL_LEAVE",
    "duration": { "lte": 2 }
  },
  "actions": [
    {
      "type": "AUTO_APPROVE",
      "approvalLevel": 1
    },
    {
      "type": "SEND_NOTIFICATION",
      "recipient": "EMPLOYEE",
      "message": "Your leave request has been auto-approved"
    }
  ]
}
```

#### Rule 2: Escalate Long Pending Approvals
```json
{
  "name": "Escalate Approvals Pending > 48 Hours",
  "triggerType": "APPROVAL_PENDING",
  "triggerConditions": {
    "pendingDuration": { "gte": 48 }
  },
  "actions": [
    {
      "type": "ESCALATE",
      "escalateTo": "DEPARTMENT_HEAD"
    },
    {
      "type": "SEND_EMAIL",
      "recipients": ["manager@company.com", "hr@company.com"],
      "subject": "Approval Escalation Required",
      "template": "escalation_notification"
    }
  ]
}
```

#### Rule 3: Low Balance Warning
```json
{
  "name": "Warn When Casual Leave < 3 Days",
  "triggerType": "BALANCE_LOW",
  "triggerConditions": {
    "leaveType": "CASUAL_LEAVE",
    "balance": { "lt": 3 }
  },
  "actions": [
    {
      "type": "SEND_NOTIFICATION",
      "recipient": "EMPLOYEE",
      "message": "Your casual leave balance is running low (< 3 days)"
    }
  ]
}
```

### Execution Flow

```typescript
// Automation engine service
export async function executeAutomationRules(
  triggerType: string,
  context: any
): Promise<void> {
  // Find matching rules
  const rules = await prisma.automationRule.findMany({
    where: {
      triggerType,
      enabled: true
    },
    orderBy: { priority: 'desc' }
  });

  for (const rule of rules) {
    const startTime = Date.now();

    try {
      // Parse conditions
      const conditions = JSON.parse(rule.triggerConditions);

      // Check if conditions match
      if (!evaluateConditions(conditions, context)) {
        continue;
      }

      // Parse and execute actions
      const actions = JSON.parse(rule.actions);
      const executedActions = [];

      for (const action of actions) {
        const result = await executeAction(action, context);
        executedActions.push({ action, result });
      }

      // Log execution
      const executionTime = Date.now() - startTime;
      await prisma.ruleExecution.create({
        data: {
          ruleId: rule.id,
          triggerContext: JSON.stringify(context),
          result: JSON.stringify(executedActions),
          success: true,
          executionTime,
          actionsExecuted: JSON.stringify(executedActions)
        }
      });

      // Update rule stats
      await prisma.automationRule.update({
        where: { id: rule.id },
        data: {
          lastExecuted: new Date(),
          executionCount: { increment: 1 }
        }
      });

    } catch (error) {
      // Log error
      await prisma.ruleExecution.create({
        data: {
          ruleId: rule.id,
          triggerContext: JSON.stringify(context),
          result: JSON.stringify({ error: error.message }),
          success: false,
          executionTime: Date.now() - startTime,
          errors: JSON.stringify(error)
        }
      });
    }
  }
}
```

---

## API Endpoints Summary

### Leave Management
- `POST /api/v1/leaves` - Create leave request
- `GET /api/v1/leaves` - Get all leaves (with filters)
- `GET /api/v1/leaves/:id` - Get leave by ID
- `PUT /api/v1/leaves/:id` - Update leave request
- `DELETE /api/v1/leaves/:id` - Delete leave request
- `POST /api/v1/leaves/validate` - Validate leave request

### Leave Actions
- `POST /api/v1/leaves/:id/approve` - Approve leave
- `POST /api/v1/leaves/:id/reject` - Reject leave
- `POST /api/v1/leaves/:id/cancel` - Request cancellation
- `POST /api/v1/leaves/:id/modify` - Request modification

### Leave Balance
- `GET /api/v1/balances` - Get leave balances
- `GET /api/v1/balances/:employeeId` - Get balance for employee
- `POST /api/v1/balances/adjust` - Manual balance adjustment (HR only)

### Comp Off
- `POST /api/v1/comp-off/work-log` - Log weekend/holiday work
- `POST /api/v1/comp-off/request` - Request comp off
- `GET /api/v1/comp-off/balance` - Get comp off balance
- `POST /api/v1/comp-off/:id/verify` - Verify work log (Manager)

### Templates
- `GET /api/v1/templates` - Get all templates
- `POST /api/v1/templates` - Create template
- `GET /api/v1/templates/:id` - Get template
- `PUT /api/v1/templates/:id` - Update template
- `DELETE /api/v1/templates/:id` - Delete template

### Calendar Integration
- `POST /api/v1/calendar/connect` - Connect calendar
- `DELETE /api/v1/calendar/:provider/disconnect` - Disconnect calendar
- `GET /api/v1/calendar/integrations` - Get active integrations

### Reports & Analytics
- `GET /api/v1/reports/team-calendar` - Team leave calendar
- `GET /api/v1/reports/balance-summary` - Balance summary report
- `GET /api/v1/reports/usage-analytics` - Leave usage analytics
- `GET /api/v1/reports/audit-log` - Audit log report

---

## Testing

Refer to [TESTING_GUIDE.md](./TESTING_GUIDE.md) for comprehensive testing instructions including:
- Test accounts and credentials
- Detailed test scenarios for all features
- API testing examples with curl commands
- Regression testing checklist
- Expected results and validation

---

## Deployment

Refer to DEPLOYMENT.md (to be created) for production deployment instructions.

---

## Future Enhancements

1. **Document Upload**: File upload for medical certificates, birth certificates
2. **Extended Maternity Leave**: Support for extended maternity leave (beyond 180 days)
3. **Age-Based Restrictions**: Minimum age requirements for maternity leave
4. **Regional Compliance**: Additional country-specific leave policies (UK, Canada, Australia)
5. **Grace Period for Paternity**: Allow paternity leave within X days of birth
6. **Leave Delegation**: Delegate approvals during manager absence
7. **Mobile App**: Native mobile application for leave management
8. **Advanced Analytics**: ML-based leave pattern analysis and predictions
9. **Bulk Operations**: Bulk approve/reject leaves
10. **Leave Swapping**: Allow employees to swap approved leaves

---

## Support

For technical support or questions:
- **Developer Documentation**: See code comments and inline documentation
- **Testing Guide**: [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- **API Documentation**: Swagger UI at `/api-docs` (when server running)
- **Database Schema**: [backend/prisma/schema.prisma](./backend/prisma/schema.prisma)

---

**Document Version**: 1.0
**Last Updated**: 2025-10-18
**Maintained By**: Development Team
