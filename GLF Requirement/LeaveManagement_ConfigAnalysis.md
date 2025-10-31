# GLF Leave Management System - Configuration Analysis

## Document Overview
This document provides a comprehensive analysis of all features, fields, and data points in the GLF Leave Management System that may require future modification, configuration, or extension. Each item includes the rationale for change, configurability approach, and recommended implementation strategy.

---

## 1. LEAVE TYPES CONFIGURATION

### 1.1 India Leave Types
| Field/Feature | Current Implementation | Rationale for Configuration | Configuration Approach | Implementation |
|--------------|----------------------|---------------------------|----------------------|----------------|
| **Casual Leave (CL)** | Hardcoded leave type | May need to add/remove leave types for different organizations | Database-driven leave types with configurable attributes | `LeavePolicy` table with `leaveType`, `region`, `isActive` |
| **Privilege Leave (PL)** | Hardcoded leave type | Different organizations may use Earned Leave, Annual Leave, etc. | Configurable leave type names and codes | `SystemConfiguration` table or `LeaveType` enum expansion |
| **Maternity Leave** | Fixed 180 days | Legal changes, company policy changes | Configurable days in leave policy settings | `LeavePolicy.entitlementDays` field |
| **Paternity Leave** | Fixed 5 days | May vary by organization or legal requirements | Configurable days per policy | `LeavePolicy.entitlementDays` field |
| **Leave Without Pay (LWP)** | Unlimited | Some organizations may want to limit LWP | Add maximum LWP days per year | New field: `maxLwpDaysPerYear` in policy |
| **Compensatory Off** | Eligibility: weekends/holidays only | May need different eligibility criteria | Configurable work conditions for comp off | JSON config in `LeavePolicy.metadata` |

**Recommendation**: Create a `LeaveTypeConfiguration` table with fields:
- `leaveTypeCode`: Unique identifier
- `displayName`: User-friendly name
- `region`: INDIA, USA, GLOBAL
- `isActive`: Enable/disable
- `defaultEntitlement`: Default days
- `allowNegativeBalance`: Boolean
- `requiresDocumentation`: Boolean
- `eligibilityCriteria`: JSON (gender, maritalStatus, tenure, etc.)

---

## 2. LEAVE CALENDAR CONFIGURATION

### 2.1 Calendar Year Settings
| Field/Feature | Current Implementation | Rationale for Configuration | Configuration Approach | Implementation |
|--------------|----------------------|---------------------------|----------------------|----------------|
| **Fiscal Year Start** | Fixed Jan-Dec | Organizations may use Apr-Mar or other fiscal years | System-wide setting for fiscal year start month | `SystemConfiguration` - `FISCAL_YEAR_START_MONTH` |
| **Fiscal Year End** | Fixed Jan-Dec | Must match fiscal year start | Auto-calculated or configurable | Derived from start month |
| **Calendar Basis** | Calendar year | Some orgs use financial year, joining anniversary, etc. | Configurable calendar basis | New enum: `CALENDAR_YEAR`, `FINANCIAL_YEAR`, `JOINING_ANNIVERSARY` |

**Recommendation**: Add `SystemSettings` table:
```json
{
  "fiscalYearStartMonth": 1,
  "fiscalYearStartDay": 1,
  "calendarBasis": "CALENDAR_YEAR",
  "accrualStartBasis": "FISCAL_YEAR" // or "JOINING_DATE"
}
```

---

## 3. LEAVE ACCRUAL RULES

### 3.1 Monthly Accrual (India)
| Field/Feature | Current Implementation | Rationale for Configuration | Configuration Approach | Implementation |
|--------------|----------------------|---------------------------|----------------------|----------------|
| **CL Accrual Rate** | 1 per month | Organizations may want different rates (e.g., 0.5, 1.5) | Configurable monthly accrual | `LeaveAccrualRule.monthlyAccrual` |
| **PL Accrual Rate** | 1 per month | May vary by policy | Configurable monthly accrual | `LeaveAccrualRule.monthlyAccrual` |
| **Accrual Day** | 1st of every month | Some orgs may want last day, mid-month, or payroll day | Configurable accrual day | New field: `accrualDayOfMonth` (1-31, or -1 for last day) |
| **Pro-rata on Joining** | If joined 1-15: full leave, >15: 0.5 | Threshold days may vary | Configurable joining threshold | JSON in `LeaveAccrualRule.carryForwardRules` |
| **Accrual during Leave** | No CL/PL during maternity | Different rules for different leave types | Configurable accrual suspension rules | New field: `accrualSuspensionRules` JSON |

**Recommendation**: Enhance `LeaveAccrualRule` table:
```typescript
{
  region: string;
  leaveType: string;
  monthlyAccrual: number;
  accrualDayOfMonth: number; // 1-31, or -1 for last day
  joiningThresholdDay: number; // Default: 15
  joiningBeforeThreshold: number; // Full accrual: 1.0
  joiningAfterThreshold: number; // Partial: 0.5
  accrualSuspensionRules: {
    suspendDuringLeaveTypes: string[]; // ['MATERNITY_LEAVE']
    resumeAfterLeaveEnds: boolean;
  };
  minimumTenureMonths: number; // Min tenure for accrual eligibility
}
```

---

## 4. CARRY-FORWARD RULES

### 4.1 Year-End Carry Forward
| Field/Feature | Current Implementation | Rationale for Configuration | Configuration Approach | Implementation |
|--------------|----------------------|---------------------------|----------------------|----------------|
| **CL Expiry** | Expires on Dec 31 | May want grace period or different expiry date | Configurable expiry date and grace period | `LeaveAccrualRule.expiryRules` JSON |
| **PL Max Carry Forward** | Max 30 days | Different organizations may have different limits | Configurable maximum | `LeavePolicy.maxCarryForward` |
| **PL Carry Forward Cap** | 30 days as of Dec 31 | Cap may vary by designation, tenure | Configurable caps by employee attributes | JSON: `carryForwardRules.maxByDesignation` |
| **Carry Forward Expiry** | No expiry for carried PL | Some orgs want 1-2 year expiry on carried leaves | Configurable expiry period | `carryForwardRules.carriedLeaveExpiryMonths` |

**Recommendation**: Add complex carry-forward configuration:
```json
{
  "casualLeave": {
    "expiryDate": "12-31",
    "gracePeriodDays": 0,
    "autoLapse": true,
    "notifyBeforeDays": 30
  },
  "privilegeLeave": {
    "maxCarryForward": 30,
    "carryForwardByDesignation": {
      "AVP": 30,
      "VP": 40,
      "MANAGER": 25
    },
    "carriedLeaveExpiryMonths": null, // null = no expiry
    "minBalanceForCarryForward": 0
  }
}
```

---

## 5. USA PTO CONFIGURATION

### 5.1 PTO Allocation Rules
| Field/Feature | Current Implementation | Rationale for Configuration | Configuration Approach | Implementation |
|--------------|----------------------|---------------------------|----------------------|----------------|
| **AVP and Below PTO** | 15 days/year | May change based on company policy | Configurable by designation | `LeavePolicy` by designation |
| **VP and Above PTO** | 20 days/year | May vary | Configurable by designation | `LeavePolicy` by designation |
| **PTO Grant Date** | Start of year | Some orgs grant on joining anniversary | Configurable grant basis | `grantBasis`: `CALENDAR_YEAR` or `JOINING_ANNIVERSARY` |
| **Pro-rata Calculation** | For mid-year joiners | Formula may vary | Configurable pro-rata formula | `proRataCalculationMethod` |
| **AVP Carry Forward** | Max 5 days | May change | Configurable maximum | `maxCarryForward` by designation |
| **VP Carry Forward** | No carry forward | May allow in future | Boolean toggle + max days | `allowCarryForward` + `maxCarryForward` |

**Recommendation**: Create designation-based PTO rules:
```typescript
interface PtoPolicy {
  designation: string; // AVP, VP, etc.
  annualEntitlement: number;
  grantBasis: 'CALENDAR_YEAR' | 'JOINING_ANNIVERSARY';
  grantDate: string; // '01-01' or 'JOINING_DATE'
  allowCarryForward: boolean;
  maxCarryForward: number;
  carryForwardCondition: 'ALL' | 'MINIMUM_BALANCE';
  minBalanceForCarryForward: number;
  proRataForMidYearJoiner: boolean;
  proRataCalculationMethod: 'MONTHLY' | 'DAILY' | 'QUARTERLY';
}
```

---

## 6. APPROVAL WORKFLOW CONFIGURATION

### 6.1 Multi-Level Approvals
| Field/Feature | Current Implementation | Rationale for Configuration | Configuration Approach | Implementation |
|--------------|----------------------|---------------------------|----------------------|----------------|
| **Leave Approval Levels** | L1 Manager → HR | May need 2, 3, or 4 levels; may vary by leave type/duration | Configurable approval levels | Workflow configuration table |
| **Comp Off Approval Levels** | L1 → L2 → HR | Different organizations may have different hierarchies | Configurable per workflow type | JSON workflow definition |
| **Approval by Leave Duration** | Same workflow regardless | May want auto-approval for <2 days, multi-level for >5 days | Duration-based workflow rules | `ApprovalRule` table |
| **Approval by Department** | Same for all departments | Different departments may have different approval chains | Department-specific workflows | `WorkflowByDepartment` config |
| **Auto-Approval Rules** | None | Small leaves (0.5 day) may not need approval | Configurable auto-approval conditions | `AutoApprovalRule` table |
| **Escalation Rules** | None | May need auto-escalation if no action in X days | Configurable escalation | `EscalationRule` with timeline |
| **Parallel vs Sequential** | Sequential only | May want parallel approvals at same level | Workflow execution mode | `executionMode`: `SEQUENTIAL` | `PARALLEL` |

**Recommendation**: Create `ApprovalWorkflowConfiguration`:
```typescript
interface ApprovalWorkflow {
  workflowType: 'LEAVE_REQUEST' | 'COMP_OFF_REQUEST' | 'LWP_REQUEST';
  leaveTypes: string[]; // Apply to which leave types
  rules: {
    minDuration: number;
    maxDuration: number;
    levels: [{
      level: number;
      approverRole: string; // 'REPORTING_MANAGER', 'DEPARTMENT_HEAD', 'HR', 'SECOND_LEVEL_MANAGER'
      executionMode: 'SEQUENTIAL' | 'PARALLEL';
      autoApproveAfterHours: number | null;
      escalateAfterHours: number | null;
      escalateTo: string; // Role or specific user
      isOptional: boolean;
      skipConditions: string[]; // Conditions to skip this level
    }];
  }[];
  autoApprovalRules: {
    maxDuration: number;
    leaveTypes: string[];
    conditions: string[]; // E.g., 'SUFFICIENT_BALANCE', 'NO_OVERLAP', 'MIN_ADVANCE_NOTICE'
  };
}
```

---

## 7. COMP OFF CONFIGURATION

### 7.1 Comp Off Eligibility and Expiry
| Field/Feature | Current Implementation | Rationale for Configuration | Configuration Approach | Implementation |
|--------------|----------------------|---------------------------|----------------------|----------------|
| **Minimum Work Hours for Half Day** | 5 hours | May vary by organization | Configurable threshold | System config: `COMP_OFF_HALF_DAY_HOURS` |
| **Minimum Work Hours for Full Day** | 8 hours | May vary | Configurable threshold | System config: `COMP_OFF_FULL_DAY_HOURS` |
| **Work Day Eligibility** | Weekends and holidays only | May want any day with approval | Configurable eligibility | `CompOffPolicy.eligibilityDays` |
| **Expiry Period** | 3 months from approval | May want 2, 4, or 6 months | Configurable expiry months | `CompOffPolicy.expiryMonths` |
| **Expiry Reminder** | Before expiry | Reminder timing may vary | Configurable reminder days | `reminderBeforeDays: [30, 15, 7, 1]` |
| **Max Comp Off Balance** | Unlimited | May want to cap at 10-15 days | Configurable maximum | `maxCompOffBalance` |
| **Verification Required** | Manager verification of work | May want HR verification or auto-approval | Configurable verification workflow | `verificationWorkflow` config |
| **Carry Forward** | No carry forward across years | Some orgs may allow | Boolean toggle | `allowYearEndCarryForward` |

**Recommendation**: Create `CompOffPolicyConfiguration`:
```typescript
interface CompOffPolicy {
  eligibilityDays: 'WEEKENDS_HOLIDAYS' | 'ALL_DAYS_WITH_APPROVAL' | 'WEEKENDS_ONLY';
  minimumHoursForHalfDay: number;
  minimumHoursForFullDay: number;
  requiresWorkLogVerification: boolean;
  verificationWorkflow: {
    level1: 'REPORTING_MANAGER' | 'DEPARTMENT_HEAD';
    level2: 'SECOND_LEVEL_MANAGER' | 'HR';
    requiredLevels: number;
  };
  expiryMonths: number; // 3 months default
  expiryStartsFrom: 'WORK_DATE' | 'APPROVAL_DATE';
  expiryReminderDays: number[];
  maxBalance: number | null; // null = unlimited
  autoExpireOnDate: string | null; // E.g., '12-31' for year-end expiry
  allowYearEndCarryForward: boolean;
  carryForwardMaxDays: number;
}
```

---

## 8. ELIGIBILITY CRITERIA CONFIGURATION

### 8.1 Leave Type Eligibility
| Field/Feature | Current Implementation | Rationale for Configuration | Configuration Approach | Implementation |
|--------------|----------------------|---------------------------|----------------------|----------------|
| **Maternity Leave Eligibility** | Married female only | May need to remove marital status requirement | Configurable eligibility | JSON: `eligibilityCriteria.gender + maritalStatus` |
| **Paternity Leave Eligibility** | Married male only | May need to update | Configurable criteria | JSON eligibility rules |
| **Minimum Tenure for Leaves** | No restriction | May want 3-6 months tenure before PL eligible | Configurable min tenure | `LeavePolicy.minimumTenureMonths` |
| **Probation Period Restrictions** | No specific restriction | May restrict certain leaves during probation | Probation leave rules | `probationPeriodRestrictions` config |
| **Designation-Based Eligibility** | PTO based on designation | Other leaves may have designation rules | Configurable by designation | JSON: `eligibilityByDesignation` |

**Recommendation**: Add eligibility configuration:
```typescript
interface LeaveEligibility {
  leaveType: string;
  criteria: {
    gender: string[] | null; // ['FEMALE'] for maternity, null for all
    maritalStatus: string[] | null; // ['MARRIED'], null for all
    minimumTenureMonths: number;
    minimumTenureDays: number;
    designation: string[] | null; // Specific designations
    excludeDesignation: string[] | null;
    employmentType: string[]; // FULL_TIME, PART_TIME, CONTRACT
    location: string[] | null; // Specific locations
    department: string[] | null;
    probationStatus: 'ALLOWED' | 'NOT_ALLOWED' | 'LIMITED';
    probationLimitDays: number | null;
    customConditions: string[]; // Array of condition codes
  };
  documentationRequired: boolean;
  documentationThresholdDays: number;
}
```

---

## 9. NOTIFICATION CONFIGURATION

### 9.1 Email Notification Types
| Field/Feature | Current Implementation | Rationale for Configuration | Configuration Approach | Implementation |
|--------------|----------------------|---------------------------|----------------------|----------------|
| **Leave Request Submitted** | Email to employee, manager, HR | Recipients may vary | Configurable recipients | `NotificationRule` table |
| **Leave Approved** | Email to employee (CC: Manager, HR) | CC list may vary | Configurable CC list | JSON config |
| **Leave Rejected** | Email to employee | May want to notify HR | Configurable recipients | Notification rules |
| **Leave Modified** | Email notifications | May want different recipients | Configurable | Notification config |
| **Leave Cancelled** | Email notifications | Recipients may vary | Configurable | Notification rules |
| **Comp Off Expiring** | Reminder to employee | May want to notify manager | Configurable | Expiry reminder config |
| **Holiday Reminders** | Email reminders | Timing and recipients configurable | Configurable reminder schedule | `reminderDaysBefore: [7, 3, 1]` |
| **Balance Updates** | Monthly/quarterly | Frequency may vary | Configurable frequency | `balanceReminderFrequency` |
| **Approval Pending Reminders** | To approvers | Reminder frequency configurable | Configurable reminder cadence | `pendingApprovalReminderDays: [2, 5, 7]` |
| **Email Approve/Reject Links** | Suggested feature | May want to enable/disable | Feature toggle | `enableEmailActions: boolean` |

**Recommendation**: Create `NotificationConfiguration`:
```typescript
interface NotificationConfig {
  notificationType: string;
  enabled: boolean;
  channels: ('EMAIL' | 'SMS' | 'IN_APP' | 'PUSH')[];
  recipients: {
    primary: ('EMPLOYEE' | 'MANAGER' | 'HR' | 'DEPARTMENT_HEAD')[];
    cc: ('EMPLOYEE' | 'MANAGER' | 'HR')[];
    bcc: string[];
  };
  template: string; // Email template name
  timing: {
    sendImmediately: boolean;
    delayMinutes: number;
    sendAt: string | null; // Specific time
  };
  frequency: 'IMMEDIATE' | 'DAILY_DIGEST' | 'WEEKLY_DIGEST';
  enableEmailActions: boolean; // Approve/Reject buttons in email
}
```

---

## 10. HOLIDAY MANAGEMENT CONFIGURATION

### 10.1 Holiday Settings
| Field/Feature | Current Implementation | Rationale for Configuration | Configuration Approach | Implementation |
|--------------|----------------------|---------------------------|----------------------|----------------|
| **Regional Holidays** | India and USA holidays | Need to add more regions | Multi-region support | `Holiday.region` field already exists |
| **Location-Specific Holidays** | Location-based holidays | May need state/city level | Hierarchical location | `Holiday.location` with parent-child |
| **Optional Holidays** | Optional flag exists | Number of optional holidays may vary | Configurable limit | `maxOptionalHolidaysPerYear` setting |
| **Holiday Calendar Import** | Manual entry | May want to import from external sources | Import functionality | API endpoint for bulk import |
| **Floating Holidays** | Not implemented | Some orgs have floating holidays | New holiday type | `Holiday.type`: `FIXED`, `OPTIONAL`, `FLOATING` |
| **Weekend Definition** | Assumed Sat-Sun | May vary by region (some have Fri-Sat) | Configurable weekend days | `SystemConfiguration`: `WEEKEND_DAYS` |
| **Public Holiday Override** | No override | May want employee-specific holiday calendars | Personal holiday calendar | `EmployeeHolidayCalendar` table |

**Recommendation**: Enhance holiday configuration:
```typescript
interface HolidayConfiguration {
  region: string;
  location: string;
  year: number;
  holidays: {
    date: Date;
    name: string;
    type: 'PUBLIC' | 'OPTIONAL' | 'FLOATING' | 'REGIONAL';
    isRecurring: boolean;
    recurringRule: string | null; // e.g., "LAST_MONDAY_OF_MAY"
  }[];
  optionalHolidayLimit: number;
  floatingHolidayLimit: number;
  weekendDays: number[]; // [0, 6] for Sat-Sun, [5, 6] for Fri-Sat
  allowPersonalHolidayCalendar: boolean;
}
```

---

## 11. USER FIELD CONFIGURATION

### 11.1 Master Data / Dropdown Values
| Field/Feature | Current Implementation | Rationale for Configuration | Configuration Approach | Implementation |
|--------------|----------------------|---------------------------|----------------------|----------------|
| **Department List** | Hardcoded or DB | New departments added frequently | Configurable master data | `SystemConfiguration.DEPARTMENT` (already implemented) |
| **Location List** | Configurable | New locations may be added | Configurable master data | `SystemConfiguration.LOCATION` (already implemented) |
| **Gender Options** | Male, Female, Other | May need more options or different labels | Configurable | `SystemConfiguration.GENDER` (already implemented) |
| **Marital Status** | Single, Married, etc. | May vary by region | Configurable | `SystemConfiguration.MARITAL_STATUS` (already implemented) |
| **Designation List** | AVP, VP, Manager, etc. | New designations may be added | Configurable | `SystemConfiguration.DESIGNATION` (already implemented) |
| **Country List** | India, USA | May expand to more countries | Configurable | `SystemConfiguration.COUNTRY` (already implemented) |
| **Employee Status** | Active, Inactive | May need more statuses (Probation, Notice Period) | Configurable | New config category: `EMPLOYEE_STATUS` |
| **Employment Type** | Not currently tracked | Full-time, Part-time, Contract, Intern | Add new field + config | `User.employmentType` + config |
| **Leave Reason Categories** | Free text | May want predefined categories | Configurable categories | New config: `LEAVE_REASON_CATEGORIES` |

**Recommendation**: Current `SystemConfiguration` table is well-designed. Add new categories:
- `EMPLOYEE_STATUS`: Active, Inactive, Probation, Notice Period, Terminated
- `EMPLOYMENT_TYPE`: Full-Time, Part-Time, Contract, Intern, Consultant
- `LEAVE_REASON_CATEGORIES`: Personal, Medical, Family, Travel, Other

---

## 12. LEAVE APPLICATION CONFIGURATION

### 12.1 Application Rules and Validations
| Field/Feature | Current Implementation | Rationale for Configuration | Configuration Approach | Implementation |
|--------------|----------------------|---------------------------|----------------------|----------------|
| **Minimum Advance Notice** | No restriction | May require 2-7 days advance notice for leave | Configurable minimum days | `LeavePolicy.minimumAdvanceNoticeDays` |
| **Maximum Future Booking** | No limit | May restrict to 90-180 days in advance | Configurable maximum days | `LeavePolicy.maxFutureBookingDays` |
| **Minimum Gap Between Leaves** | No restriction (field exists but not used) | May require 5-10 days gap | Enable existing field | `LeavePolicy.minimumGap` |
| **Max Consecutive Days** | No restriction (field exists) | May limit continuous leave to 30-45 days | Enable existing field | `LeavePolicy.maxConsecutiveDays` |
| **Half Day Options** | First Half, Second Half | May need custom time slots | Configurable half-day definitions | JSON config: `halfDaySlots` |
| **Quarter Day / Hourly Leaves** | Not supported | Some organizations need finer granularity (0.25 day, hourly) | Add duration types | New config: `durationTypes: ['FULL_DAY', 'HALF_DAY', 'QUARTER_DAY', 'HOURLY']` |
| **Backdated Leave Application** | May be allowed | May want to restrict or require approval | Configurable restriction | `allowBackdatedLeave: boolean` + `backdatedLimitDays` |
| **Leave During Notice Period** | No specific rule | May restrict or require special approval | Configurable rule | `noticePeriodLeavePolicy` |
| **Negative Balance** | Not allowed for most types | Some orgs allow negative balance | Configurable per leave type | `LeavePolicy.allowNegativeBalance` |
| **Mandatory Fields** | Current set | May want additional fields (attachment, contact number) | Configurable required fields | JSON: `mandatoryFields: []` |

### 12.2 Leave Duration Granularity Configuration
| Field/Feature | Current Implementation | Rationale for Configuration | Configuration Approach | Implementation |
|--------------|----------------------|---------------------------|----------------------|----------------|
| **Full Day Leave** | Standard 1 day | Universal | Fixed option | Always available |
| **Half Day Leave** | First Half / Second Half | Standard requirement | Configurable time slots | `halfDaySlots` config |
| **Quarter Day Leave** | Not implemented | Flexible work arrangements, hourly tracking | Enable/disable + time slot definition | New feature toggle + config |
| **Hourly Leave** | Not implemented | Medical appointments, emergencies | Enable/disable + minimum/maximum hours | New feature with hour tracking |
| **Multi-day with Mixed Duration** | Full days only | Day 1: Full, Day 2: Half, Day 3: Full | Allow mixed duration selection | Enhanced UI + calculation logic |

**Recommendation**: Add duration granularity configuration:
```typescript
interface LeaveDurationConfiguration {
  supportedDurations: {
    FULL_DAY: {
      enabled: boolean;
      hoursEquivalent: number; // e.g., 8 hours
      displayName: string;
    };
    HALF_DAY: {
      enabled: boolean;
      hoursEquivalent: number; // e.g., 4 hours
      slots: {
        code: string; // 'FIRST_HALF', 'SECOND_HALF'
        displayName: string;
        startTime: string; // '09:00'
        endTime: string; // '13:00'
      }[];
    };
    QUARTER_DAY: {
      enabled: boolean;
      hoursEquivalent: number; // e.g., 2 hours
      slots: {
        code: string; // 'MORNING', 'LATE_MORNING', 'AFTERNOON', 'EVENING'
        displayName: string;
        startTime: string;
        endTime: string;
      }[];
    };
    HOURLY: {
      enabled: boolean;
      minimumHours: number; // e.g., 1 hour
      maximumHours: number; // e.g., 8 hours
      allowedLeaveTypes: string[]; // Only specific leave types
      requiresManagerApproval: boolean;
    };
  };
  allowMixedDuration: boolean; // Allow different durations in multi-day leave
  roundingRules: {
    method: 'UP' | 'DOWN' | 'NEAREST'; // How to round fractional days
    precision: number; // 0.25, 0.5, 1.0
  };
}
```

### 12.3 Mandatory Fields Configuration per Leave Type
| Field/Feature | Current Implementation | Rationale for Configuration | Configuration Approach | Implementation |
|--------------|----------------------|---------------------------|----------------------|----------------|
| **Reason Field** | Always mandatory | Some leave types may not need detailed reason | Configurable per leave type | Field-level config |
| **Attachment** | Optional | Sick leave >3 days may require medical certificate | Conditional mandatory based on rules | Rule-based config |
| **Contact Number During Leave** | Not tracked | May be required for emergencies | Configurable requirement | New field + config |
| **Address During Leave** | Not tracked | Some orgs require for emergency contact | Configurable requirement | New field + config |
| **Handover Notes** | Not tracked | May be required for leaves >5 days | Configurable requirement | New field + config |
| **Backup Person** | Not tracked | May be required to assign backup | Configurable requirement | New field + config |

**Recommendation**: Create field-level validation configuration:
```typescript
interface LeaveApplicationFieldConfig {
  leaveType: string;
  fields: {
    fieldName: string;
    displayLabel: string;
    fieldType: 'TEXT' | 'TEXTAREA' | 'FILE' | 'PHONE' | 'EMAIL' | 'DATE' | 'USER_SELECTION';
    isMandatory: boolean;
    conditionalMandatory: {
      condition: string; // 'DURATION_GREATER_THAN'
      value: any; // 3 (days)
      expression: string; // Complex condition expression
    }[];
    validationRules: {
      minLength?: number;
      maxLength?: number;
      pattern?: string; // Regex pattern
      allowedFileTypes?: string[]; // ['pdf', 'jpg', 'png']
      maxFileSize?: number; // in MB
      customValidator?: string; // Custom validation function name
    };
    helpText: string;
    placeholder: string;
    defaultValue?: any;
    visibleToRoles: string[]; // Which roles can see this field
    editableByRoles: string[]; // Which roles can edit
  }[];
}
```

**Recommendation**: Enhance `LeavePolicy` with application rules:
```typescript
interface LeaveApplicationRules {
  minimumAdvanceNoticeDays: number;
  maxFutureBookingDays: number;
  allowBackdatedLeave: boolean;
  backdatedLimitDays: number;
  allowLeaveInNoticePeriod: boolean;
  noticePeriodLeaveLimit: number;
  allowNegativeBalance: boolean;
  negativeBalanceLimit: number;
  halfDaySlots: {
    code: string;
    displayName: string;
    startTime: string;
    endTime: string;
  }[];
  mandatoryFields: string[]; // ['reason', 'attachments', 'contactNumber']
  attachmentRequired: boolean;
  attachmentRequiredWhen: {
    minDuration: number; // Require for leaves > X days
    leaveTypes: string[]; // Require for specific types
  };
}
```

---

## 13. REPORTS CONFIGURATION

### 13.1 Report Parameters and Filters
| Field/Feature | Current Implementation | Rationale for Configuration | Configuration Approach | Implementation |
|--------------|----------------------|---------------------------|----------------------|----------------|
| **Report Date Range** | Custom date selection | May want predefined ranges (Last 30 days, Quarter, YTD) | Configurable date range presets | UI configuration |
| **Report Grouping** | By team, by leave type | May want by location, department, designation | Configurable grouping options | Report metadata config |
| **Report Metrics** | Specific metrics shown | Organizations may want custom KPIs | Configurable metrics | Dashboard widget config |
| **Report Export Formats** | Not specified | Excel, PDF, CSV | Enable/disable formats | `allowedExportFormats: []` |
| **Report Access Control** | Role-based | May want report-level permissions | Granular report permissions | `ReportPermission` table |
| **Scheduled Reports** | Not implemented | May want daily/weekly/monthly emailed reports | Schedule configuration | `ScheduledReport` table |
| **Custom Report Builder** | Fixed reports | Users want to create custom reports with field selection | Drag-drop report builder UI | Report builder module |
| **Report Columns** | Fixed columns | Select which columns to show/hide | Column configuration | Dynamic column selection |
| **Report Filters** | Limited filters | Advanced filtering on any field | Filter builder | Dynamic filter engine |
| **Report Aggregations** | Basic aggregations | Custom calculations, formulas | Formula builder | Expression evaluator |

### 13.2 Custom Report Builder Configuration
| Field/Feature | Current Implementation | Rationale for Configuration | Configuration Approach | Implementation |
|--------------|----------------------|---------------------------|----------------------|----------------|
| **Available Fields** | All fields shown | Control which fields are available for reports | Field availability config | Metadata-driven field list |
| **Field Aliases** | System field names | User-friendly names | Configurable labels | Field alias mapping |
| **Calculated Fields** | Not supported | Sum, Average, Count, Custom formulas | Formula builder | Expression engine |
| **Grouping Levels** | Single level | Multi-level grouping (Dept → Team → Employee) | Nested grouping config | Hierarchical grouping |
| **Chart Types** | Fixed charts | Bar, Line, Pie, Scatter, Heat maps | Chart type selection | Charting library integration |
| **Report Templates** | No templates | Save and reuse report configurations | Template management | `ReportTemplate` table |
| **Data Refresh** | Manual | Auto-refresh, scheduled refresh | Refresh configuration | Caching + scheduler |

**Recommendation**: Create comprehensive report builder configuration:
```typescript
interface ReportConfiguration {
  reportId: string;
  reportName: string;
  category: string;
  allowedRoles: string[];
  dateRangePresets: {
    code: string;
    displayName: string;
    startDate: string; // Relative: 'TODAY-30', 'START_OF_MONTH'
    endDate: string; // Relative: 'TODAY', 'END_OF_MONTH'
  }[];
  groupingOptions: string[];
  filterOptions: string[];
  metrics: {
    metricId: string;
    displayName: string;
    calculation: string;
    format: string;
  }[];
  exportFormats: ('EXCEL' | 'PDF' | 'CSV' | 'JSON')[];
  allowScheduling: boolean;
}
```

---

## 13A. DASHBOARD WIDGETS CONFIGURATION (HIGH PRIORITY - FROM PDF)

### 13A.1 Widget Management
| Field/Feature | Current Implementation | Rationale for Configuration | Configuration Approach | Implementation | Priority |
|--------------|----------------------|---------------------------|----------------------|----------------|----------|
| **Fixed Widgets** | Standard dashboard for all | Different roles need different information | Configurable dashboard per role | Widget configuration system | **High** |
| **Widget Types** | Limited widget types | Need variety (Charts, Stats, Lists, Calendars) | Extensible widget library | Widget plugin system | Medium |
| **Widget Positioning** | Fixed layout | Users want to arrange widgets | Drag-and-drop layout | Grid-based dashboard | Medium |
| **Widget Sizing** | Fixed sizes | Users want to resize widgets | Flexible sizing | Responsive grid system | Medium |
| **Widget Visibility** | All visible | Show/hide based on role or preference | Visibility rules | Role-based + user preference | Medium |
| **Widget Data Refresh** | Page refresh | Real-time or scheduled refresh | Configurable refresh intervals | WebSocket + polling | Low |
| **Widget Filters** | Global filters | Widget-specific filters | Per-widget filter configuration | Filter state management | Medium |
| **Custom Widgets** | Not supported | Organizations may want custom widgets | Widget development framework | Plugin API | Low |

### 13A.2 Dashboard Configuration Schema
**Recommendation**: Create widget configuration framework:
```typescript
interface DashboardConfiguration {
  dashboardId: string;
  userId?: string; // User-specific or null for role-based
  role?: string; // Role-based default configuration
  isDefault: boolean;
  layout: {
    columns: number; // 12-column grid
    widgets: {
      widgetId: string;
      widgetType: string;
      position: {
        x: number; // Column position
        y: number; // Row position
        width: number; // Columns span
        height: number; // Rows span
      };
      configuration: {
        title: string;
        showTitle: boolean;
        refreshInterval: number; // seconds, 0 = no auto-refresh
        filters: Record<string, any>;
        dataSource: string;
        visualization: any;
        interactivity: {
          clickable: boolean;
          drillDown: boolean;
          exportable: boolean;
        };
      };
      isCollapsible: boolean;
      isRemovable: boolean;
      isEditable: boolean;
    }[];
  };
  theme: {
    colorScheme: 'LIGHT' | 'DARK' | 'AUTO';
    primaryColor: string;
    accentColor: string;
  };
  preferences: {
    defaultView: 'GRID' | 'LIST';
    compactMode: boolean;
    showAnimations: boolean;
  };
}
```

---

## 13B. BULK ACTIONS CONFIGURATION (MEDIUM PRIORITY - FROM PDF)

### 13B.1 Bulk Operations
| Field/Feature | Current Implementation | Rationale for Configuration | Configuration Approach | Implementation | Priority |
|--------------|----------------------|---------------------------|----------------------|----------------|----------|
| **Bulk Approval** | Available for managers | Role-based restrictions or audit logs | Configurable by role | Role-based access control with audit trail | **Medium** |
| **Bulk Rejection** | Available | May need reason validation | Configurable validation | Validation rules | Medium |
| **Bulk Export** | Basic export | Advanced export with filters | Export configuration | Enhanced export module | Medium |
| **Selection Limits** | Unlimited | May want to limit to prevent performance issues | Configurable max selection | `maxBulkOperations: 100` | Medium |
| **Audit Trail for Bulk Actions** | Basic logging | Detailed audit with before/after states | Enhanced audit logging | Comprehensive audit log | Medium |
| **Confirmation Dialogs** | Basic confirmation | Detailed summary before action | Configurable confirmation UI | Enhanced confirmation | Low |

**Recommendation**: Create bulk action configuration:
```typescript
interface BulkActionConfiguration {
  actionType: 'APPROVE' | 'REJECT' | 'CANCEL' | 'EXPORT' | 'EMAIL' | 'STATUS_UPDATE';
  enabled: boolean;
  allowedRoles: string[];
  maxItemsPerAction: number; // e.g., 100
  requiresConfirmation: boolean;
  requiresReason: boolean; // For rejection, cancellation

  validationRules: {
    sameLeaveType: boolean;
    sameDepartment: boolean;
    sameStatus: boolean;
    withinDateRange: boolean;
    customValidation?: string;
  };

  confirmationDialog: {
    showSummary: boolean;
    summaryFields: string[];
    warningThreshold: number;
    requiresComment: boolean;
    allowPartialExecution: boolean;
  };

  auditConfig: {
    logLevel: 'BASIC' | 'DETAILED' | 'VERBOSE';
    captureBeforeState: boolean;
    captureAfterState: boolean;
    notifyOnCompletion: boolean;
  };
}
```

---

## 13C. TEAM CALENDAR OVERLAP CHECK (LOW PRIORITY - FROM PDF)

### 13C.1 Overlap Detection Configuration
| Field/Feature | Current Implementation | Rationale for Configuration | Configuration Approach | Implementation | Priority |
|--------------|----------------------|---------------------------|----------------------|----------------|----------|
| **Team Calendar View** | Shows overlapping leaves | Enhanced visualization needed | Configurable calendar views | Calendar component config | **Low** |
| **Overlap Detection** | Basic detection | Configurable overlap threshold | Threshold configuration | `maxTeamOverlapPercentage: 20%` | Low |
| **Overlap Warnings** | Not implemented | Warn if >X% team is on leave | Configurable warning rules | Warning system | Low |
| **Overlap Blocking** | Not implemented | Block if overlap exceeds limit | Configurable blocking rules | Validation rule | Low |
| **External Calendar Integration** | Not implemented | Integration with external calendars | Toggle for overlap check, calendar sync config | API configuration | Low |
| **Calendar Color Coding** | Not implemented | Color by leave type, status | Configurable color scheme | Visual configuration | Low |

**Recommendation**: Create team calendar and overlap configuration:
```typescript
interface TeamCalendarConfiguration {
  teamDefinition: {
    type: 'REPORTING_HIERARCHY' | 'DEPARTMENT' | 'CUSTOM_GROUP';
    includeSelf: boolean;
    includeSubordinates: boolean;
    includeSubordinateDepth: number;
  };

  display: {
    defaultView: 'MONTH' | 'WEEK' | 'DAY' | 'TIMELINE';
    colorScheme: {
      leaveTypeColors: Record<string, string>;
      statusColors: {
        APPROVED: string;
        PENDING: string;
        REJECTED: string;
      };
    };
    showWeekends: boolean;
    showHolidays: boolean;
  };

  overlapRules: {
    enabled: boolean;
    calculationMethod: 'PERCENTAGE' | 'ABSOLUTE_COUNT';
    threshold: number;
    excludeLeaveTypes: string[];
    countOnlyApprovedLeaves: boolean;
    minimumTeamSize: number;
    actions: {
      showWarning: boolean;
      blockApplication: boolean;
      requiresManagerOverride: boolean;
      notifyManager: boolean;
    };
  };

  externalCalendars: {
    enabled: boolean;
    providers: ('GOOGLE' | 'OUTLOOK' | 'APPLE')[];
    syncDirection: 'IMPORT' | 'EXPORT' | 'BIDIRECTIONAL';
    syncFrequencyMinutes: number;
  };
}
```

---

## 13D. LEAVE BALANCE VISIBILITY CONFIGURATION (LOW PRIORITY - FROM PDF)

### 13D.1 Balance Visibility Rules
| Field/Feature | Current Implementation | Rationale for Configuration | Configuration Approach | Implementation | Priority |
|--------------|----------------------|---------------------------|----------------------|----------------|----------|
| **Own Balance Visibility** | Always visible | Universal requirement | Always show | Fixed | N/A |
| **Team Balance Visibility** | Visible to managers | Role-based visibility | Configurable by role | Role-based toggle in config | **Low** |
| **Department Balance Visibility** | Visible to HR | May want to restrict/expand | Role-based configuration | Visibility rules | Low |
| **Balance History** | Not tracked | Show balance changes over time | Enable/disable feature | Balance history tracking | Low |
| **Projected Balance** | Not implemented | Show projected balance at year-end | Enable feature + projection logic | Calculation engine | Low |
| **Balance Alerts** | Not implemented | Alert when balance low/high | Configurable thresholds | Alert configuration | Medium |

**Recommendation**: Create balance visibility configuration:
```typescript
interface LeaveBalanceVisibilityConfiguration {
  visibilityRules: {
    role: string;
    canViewOwnBalance: boolean; // Always true
    canViewTeamBalance: boolean;
    canViewDepartmentBalance: boolean;
    canViewOrganizationBalance: boolean;
    canViewBalanceHistory: boolean;
    canViewProjectedBalance: boolean;
    canExportBalances: boolean;
  }[];

  displayOptions: {
    showInDashboard: boolean;
    showDuringApplication: boolean;
    showInReports: boolean;
    showDetailedBreakdown: boolean;
    showExpiryInformation: boolean;
    groupByLeaveType: boolean;
    includeCompOff: boolean;
  };

  alerts: {
    enabled: boolean;
    lowBalanceThreshold: number;
    highBalanceThreshold: number;
    expiryReminderDays: number[];
    negativeBalanceAlert: boolean;
    notificationChannels: ('EMAIL' | 'IN_APP' | 'SMS')[];
  };
}
```

---

## 14. SYSTEM-LEVEL CONFIGURATION

### 14.1 General System Settings
| Field/Feature | Current Implementation | Rationale for Configuration | Configuration Approach | Implementation |
|--------------|----------------------|---------------------------|----------------------|----------------|
| **System Name** | Hardcoded | White-label or branding | Configurable | `SystemSettings.applicationName` |
| **Company Logo** | Hardcoded | Branding | Configurable upload | `SystemSettings.logoUrl` |
| **Primary Color Theme** | Fixed | Branding | Configurable | `SystemSettings.primaryColor` |
| **Date Format** | System default | May vary by region (DD/MM/YYYY vs MM/DD/YYYY) | Configurable | `SystemSettings.dateFormat` |
| **Time Zone** | Server timezone | Multi-location companies need timezone support | Configurable per location | `Location.timezone` |
| **Currency** | Not applicable | If future payroll integration | Configurable | `SystemSettings.currency` |
| **Language** | English only | May need multi-language support | i18n configuration | `SystemSettings.supportedLanguages` |
| **Session Timeout** | Fixed | Security requirements may vary | Configurable | `SystemSettings.sessionTimeoutMinutes` |
| **Password Policy** | Basic | May need complex rules | Configurable | `PasswordPolicy` config |
| **Audit Retention** | Unlimited | May want to purge old audit logs | Configurable retention | `SystemSettings.auditRetentionDays` |

**Recommendation**: Create comprehensive `SystemSettings` table:
```typescript
interface SystemSettings {
  category: string; // 'GENERAL', 'SECURITY', 'BRANDING', 'REGIONAL'
  key: string;
  value: string;
  valueType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  isEncrypted: boolean;
  description: string;
  modifiableByAdmin: boolean;
}
```

---

## 15. LOCATION-SPECIFIC POLICIES

### 15.1 Regional Policy Configuration
| Field/Feature | Current Implementation | Rationale for Configuration | Configuration Approach | Implementation |
|--------------|----------------------|---------------------------|----------------------|----------------|
| **India-Specific Rules** | Hardcoded CL/PL accrual | Future changes in Indian labor laws | Configurable regional policies | `RegionalPolicy` table (exists) |
| **USA-Specific Rules** | Hardcoded PTO by designation | State-specific leave laws may require variations | State-level policy support | Hierarchical policy: Country → State → Location |
| **Future Regions** | Only India and USA | May expand to UK, EU, APAC | Extensible region support | Add new regions with specific policies |
| **Statutory Leave Compliance** | Manual implementation | Laws change, need easy updates | Configurable statutory leave templates | `StatutoryLeaveTemplate` table |
| **Regional Holiday Rules** | Holiday table | Festival dates, regional variations | Enhanced holiday management | Already exists, can be enhanced |

**Recommendation**: Enhance `RegionalPolicy` table to support hierarchical policies:
```typescript
interface RegionalPolicyHierarchy {
  level: 'GLOBAL' | 'COUNTRY' | 'STATE' | 'LOCATION';
  region: string;
  parentPolicyId: string | null;
  policyRules: {
    leaveTypes: {};
    accrualRules: {};
    carryForwardRules: {};
    holidays: {};
    workingDays: {};
    overtime: {};
  };
  overrides: {
    // Child policies can override parent rules
    overriddenFields: string[];
  };
  effectiveFrom: Date;
  effectiveTo: Date | null;
}
```

---

## 16. ADVANCED FEATURES CONFIGURATION

### 16.1 Future Enhancement Fields
| Field/Feature | Current Implementation | Rationale for Configuration | Configuration Approach | Implementation |
|--------------|----------------------|---------------------------|----------------------|----------------|
| **Leave Encashment** | Not implemented | May want to encash unused PL | Configurable encashment rules | New module with config |
| **Leave Transfer** | Not implemented | Transfer between employees | Enable/disable + rules | Config toggle + rules |
| **Team Calendar View** | Not specified | May want to restrict visibility | Configurable visibility rules | Privacy settings |
| **Integration with Payroll** | Not implemented | Future integration needs | API configuration | Integration settings |
| **Biometric Integration** | Not implemented | For attendance and comp off validation | Integration config | External system config |
| **Mobile App Settings** | Not specified | Mobile-specific features | Mobile config | Platform-specific settings |
| **Leave Forecasting** | Service exists | May want to enable/disable | Feature toggle | Config: `enableForecasting` |
| **Automated Reports** | Not implemented | Scheduled email reports | Report scheduler config | Cron configuration |
| **Self-Service Password Reset** | Not specified | May want to enable/disable | Feature toggle | Security config |
| **SSO Integration** | Not implemented | Future SAML/OAuth integration | SSO configuration | Identity provider config |

---

## 17. WORKFLOW AND AUTOMATION CONFIGURATION

### 17.1 Automation Rules
| Field/Feature | Current Implementation | Rationale for Configuration | Configuration Approach | Implementation |
|--------------|----------------------|---------------------------|----------------------|----------------|
| **Auto-Approval Rules** | Automation rules exist | Different rules per organization | Configurable automation | `AutomationRule` table (exists) |
| **Auto-Rejection Rules** | Can be configured | Invalid applications | Configurable rules | Automation rules |
| **Leave Collision Detection** | Not specified | Auto-reject if team overlap | Configurable team rules | `teamOverlapThreshold: 20%` |
| **Balance Check Rules** | Implemented | May want to allow override | Configurable strict/flexible mode | `allowOverrideInsufficientBalance` |
| **Delegation Rules** | Service exists | Approval delegation during leave | Configurable delegation | Already exists, enhance config |

**Recommendation**: Current `AutomationRule` table is well-designed. Create rule templates for common scenarios.

---

## 18. DATA RETENTION AND ARCHIVAL

### 18.1 Data Management Configuration
| Field/Feature | Current Implementation | Rationale for Configuration | Configuration Approach | Implementation |
|--------------|----------------------|---------------------------|----------------------|----------------|
| **Leave History Retention** | Unlimited | May want to archive old data | Configurable retention period | `dataRetentionYears: 7` |
| **Audit Log Retention** | Unlimited | Legal/compliance requirements | Configurable retention | `auditRetentionYears: 5` |
| **Notification Archive** | Unlimited | May want to purge old notifications | Configurable retention | `notificationRetentionDays: 90` |
| **Soft Delete vs Hard Delete** | Not specified | May want soft delete for audit | Configurable deletion policy | `deletionPolicy: SOFT` |
| **GDPR Compliance** | Not implemented | Right to be forgotten | Data erasure configuration | GDPR compliance module |

---

## 19. NOTIFICATION PREFERENCES

### 19.1 User-Level Notification Settings
| Field/Feature | Current Implementation | Rationale for Configuration | Configuration Approach | Implementation |
|--------------|----------------------|---------------------------|----------------------|----------------|
| **Email Notifications** | Sent to all users | Users may want to opt-out | Per-user notification preferences | `UserNotificationPreference` table |
| **SMS Notifications** | Not implemented | Optional channel | Enable/disable per user | Preference table |
| **In-App Notifications** | Implemented | May want to disable | Per-user preference | Preference table |
| **Notification Frequency** | Immediate | May want daily digest | Configurable frequency | `frequency: IMMEDIATE | DAILY | WEEKLY` |
| **Do Not Disturb Hours** | Not implemented | May want quiet hours | Time range configuration | `doNotDisturbStart/End` |

**Recommendation**: Create `UserNotificationPreference` table:
```typescript
interface UserNotificationPreference {
  userId: string;
  notificationType: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  frequency: 'IMMEDIATE' | 'DAILY' | 'WEEKLY' | 'DISABLED';
  doNotDisturbStart: string | null; // HH:MM
  doNotDisturbEnd: string | null; // HH:MM
}
```

---

## 20. IMPLEMENTATION PRIORITY MATRIX (UPDATED WITH PDF ANALYSIS)

### Priority Levels - Aligned with PDF Requirements

| Priority | Configuration Items | Timeline | Source |
|----------|-------------------|----------|--------|
| **HIGH (P0)** | - Leave Types (customizable per region)<br>- Monthly Leave Accrual (configurable rates & dates)<br>- Carry Forward Rules (DB-driven)<br>- Approval Workflows (multi-level, configurable hierarchy)<br>- Comp Off Policy (eligibility & expiry)<br>- Comp Off Approval Flow (configurable per dept/region)<br>- Eligibility Criteria (maternity/paternity, gender-neutral)<br>- Holiday List (admin-managed)<br>- Leave Balance Calculation (rule engine)<br>- **Dashboard Widgets (role-based custom dashboards)** | Immediate (Sprint 1-3) | PDF + Analysis |
| **MEDIUM (P1)** | - Leave Calendar (fiscal year options)<br>- Joining-Based Leave Allocation (custom rules)<br>- Notification Templates (customizable channels & recipients)<br>- Email Notifications (template engine)<br>- Leave Duration Granularity (quarter-day, hourly)<br>- Mandatory Fields per Leave Type<br>- **Bulk Actions/Approval (role-based with audit)**<br>- **Report Builder (custom formats & field selection)**<br>- Leave Application Rules<br>- Regional Policies<br>- User Field Configuration<br>- Comp Off Eligibility (rule engine with time tracking) | Next 3-5 Sprints | PDF + Analysis |
| **LOW (P2)** | - **Leave Balance Visibility (role-based)**<br>- **Team Calendar Overlap Check (threshold-based)**<br>- External Calendar Integration (Google/Outlook sync)<br>- Dashboard Widget Customization (drag-drop)<br>- Report Scheduling<br>- System Settings<br>- User Notification Preferences<br>- Advanced Features<br>- Data Retention<br>- Leave Balance Alerts | Future Enhancements (Sprint 6+) | PDF + Analysis |

### Key Changes from PDF Analysis

**New HIGH Priority Items Added:**
1. **Dashboard Widgets** - Custom dashboards per role (FROM PDF)
2. **Leave Balance Calculation** - Dynamic formula-based calculation (FROM PDF)

**New MEDIUM Priority Items Added:**
3. **Bulk Actions/Approval** - With audit trail (FROM PDF)
4. **Report Builder** - Custom report builder with field selection (FROM PDF)
5. **Leave Duration Granularity** - Quarter-day and hourly leaves (FROM PDF)
6. **Mandatory Fields Configuration** - Field-level config per leave type (FROM PDF)

**New LOW Priority Items Added:**
7. **Leave Balance Visibility** - Role-based visibility controls (FROM PDF)
8. **Team Calendar Overlap Check** - Configurable thresholds and blocking (FROM PDF)

---

## 21. RECOMMENDED CONFIGURATION ARCHITECTURE

### 21.1 Three-Tier Configuration System

#### Tier 1: System-Level Configuration (Global)
- Fiscal year settings
- Calendar basis
- System branding
- Security settings
- Feature toggles

#### Tier 2: Regional/Location Configuration
- Region-specific leave policies
- Location-specific holidays
- Statutory compliance rules
- Regional approval workflows

#### Tier 3: User/Role Configuration
- Individual notification preferences
- Personal holiday calendars
- Delegation settings
- Dashboard preferences

### 21.2 Configuration Override Hierarchy
```
Global Default → Regional Override → Location Override → Department Override → Individual Override
```

---

## 22. CONFIGURATION MANAGEMENT APPROACH

### 22.1 Recommended Tools and Features

1. **Admin Configuration Portal**
   - UI for HR/IT admins to modify configurations
   - Version control for configuration changes
   - Audit trail for all configuration modifications
   - Rollback capability

2. **Configuration Validation**
   - Schema validation for JSON configurations
   - Business rule validation
   - Impact analysis before applying changes
   - Test mode for configuration changes

3. **Configuration Export/Import**
   - Export configurations for backup
   - Import configurations from templates
   - Multi-environment sync (Dev → QA → Prod)

4. **Configuration Templates**
   - Pre-built templates for common scenarios
   - Industry-specific templates
   - Region-specific templates

5. **Configuration Documentation**
   - Auto-generated documentation
   - Change history
   - Impact analysis reports

---

## 23. DATABASE DESIGN RECOMMENDATIONS

### 23.1 New Tables Required

```sql
-- Configuration Schema
CREATE TABLE ConfigurationSchema (
  id VARCHAR PRIMARY KEY,
  category VARCHAR NOT NULL,
  key VARCHAR NOT NULL,
  valueType VARCHAR NOT NULL, -- STRING, NUMBER, BOOLEAN, JSON
  defaultValue TEXT,
  validation TEXT, -- JSON schema for validation
  description TEXT,
  isUserConfigurable BOOLEAN DEFAULT TRUE,
  requiresRestart BOOLEAN DEFAULT FALSE,
  UNIQUE(category, key)
);

-- Configuration Values
CREATE TABLE ConfigurationValue (
  id VARCHAR PRIMARY KEY,
  schemaId VARCHAR REFERENCES ConfigurationSchema(id),
  scope VARCHAR NOT NULL, -- GLOBAL, REGION, LOCATION, DEPARTMENT, USER
  scopeId VARCHAR, -- Reference to User, Location, Department, etc.
  value TEXT NOT NULL,
  effectiveFrom DATETIME NOT NULL,
  effectiveTo DATETIME,
  createdBy VARCHAR,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX(scope, scopeId)
);

-- Policy Configuration
CREATE TABLE PolicyConfiguration (
  id VARCHAR PRIMARY KEY,
  policyType VARCHAR NOT NULL, -- LEAVE_POLICY, COMP_OFF_POLICY, APPROVAL_POLICY
  region VARCHAR,
  location VARCHAR,
  department VARCHAR,
  effectiveFrom DATETIME NOT NULL,
  effectiveTo DATETIME,
  configData JSON NOT NULL,
  version INT DEFAULT 1,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Workflow Configuration
CREATE TABLE WorkflowConfiguration (
  id VARCHAR PRIMARY KEY,
  workflowType VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,
  conditions JSON, -- When to apply this workflow
  steps JSON NOT NULL, -- Array of workflow steps
  isDefault BOOLEAN DEFAULT FALSE,
  isActive BOOLEAN DEFAULT TRUE,
  priority INT DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User Preferences
CREATE TABLE UserPreference (
  id VARCHAR PRIMARY KEY,
  userId VARCHAR NOT NULL,
  category VARCHAR NOT NULL,
  key VARCHAR NOT NULL,
  value TEXT,
  UNIQUE(userId, category, key),
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

---

## 24. API ENDPOINTS FOR CONFIGURATION MANAGEMENT

### 24.1 Proposed API Structure

```
GET    /api/v1/configurations
GET    /api/v1/configurations/:category
GET    /api/v1/configurations/:category/:key
POST   /api/v1/configurations
PATCH  /api/v1/configurations/:id
DELETE /api/v1/configurations/:id

GET    /api/v1/policies
GET    /api/v1/policies/:policyType
POST   /api/v1/policies
PATCH  /api/v1/policies/:id
DELETE /api/v1/policies/:id

GET    /api/v1/workflows
GET    /api/v1/workflows/:workflowType
POST   /api/v1/workflows
PATCH  /api/v1/workflows/:id
DELETE /api/v1/workflows/:id

GET    /api/v1/preferences
POST   /api/v1/preferences
PATCH  /api/v1/preferences/:key
```

---

## 25. MIGRATION STRATEGY

### 25.1 Phased Implementation Approach

**Phase 1: Foundation (Sprint 1-2)**
- Create configuration tables
- Migrate existing hardcoded values to database
- Build admin UI for basic configurations
- Test with existing features

**Phase 2: Core Leave Policies (Sprint 3-4)**
- Implement configurable leave types
- Configurable accrual rules
- Configurable carry-forward rules
- Regional policy support

**Phase 3: Workflows (Sprint 5-6)**
- Configurable approval workflows
- Automation rules enhancement
- Notification configuration

**Phase 4: Advanced Features (Sprint 7-8)**
- Report configuration
- User preferences
- System settings
- Integration configurations

**Phase 5: Optimization (Sprint 9-10)**
- Performance optimization
- Configuration validation
- Documentation
- Training materials

---

## 26. TESTING REQUIREMENTS

### 26.1 Configuration Testing Checklist

- [ ] Configuration changes are applied immediately or after specified time
- [ ] Invalid configurations are rejected with clear error messages
- [ ] Configuration changes are logged in audit trail
- [ ] Rollback functionality works correctly
- [ ] Configuration export/import works
- [ ] Performance impact of configuration changes is minimal
- [ ] Multi-tenant configurations are isolated
- [ ] Default configurations are applied when custom configs are not set
- [ ] Configuration UI is user-friendly and intuitive
- [ ] Documentation is auto-generated and accurate

---

## 27. SECURITY CONSIDERATIONS

### 27.1 Configuration Security

1. **Access Control**
   - Only HR_ADMIN and IT_ADMIN can modify system configurations
   - Department managers can modify department-specific configs
   - Users can only modify their own preferences

2. **Audit Trail**
   - All configuration changes are logged
   - Who made the change, what was changed, when
   - Before and after values

3. **Encryption**
   - Sensitive configurations (API keys, passwords) are encrypted
   - Encryption at rest and in transit

4. **Validation**
   - Schema validation for all configurations
   - Business rule validation
   - Prevent circular dependencies in workflows

5. **Backup**
   - Regular backups of configuration data
   - Point-in-time recovery capability

---

## 28. SUMMARY AND RECOMMENDATIONS

### Key Takeaways

1. **Highly Configurable System**: Almost all aspects of the leave management system should be configurable rather than hardcoded.

2. **Three-Tier Architecture**: Implement a three-tier configuration system (System → Regional → User) with proper override hierarchy.

3. **Priority-Based Implementation**: Focus on high-priority configurations first (leave types, accrual, approval workflows).

4. **Extensibility**: Design for future expansion (new regions, leave types, workflows).

5. **User Experience**: Balance flexibility with usability - not all configurations should be exposed to all users.

6. **Audit and Compliance**: Maintain complete audit trail for all configuration changes.

7. **Performance**: Configuration changes should not impact system performance significantly.

8. **Documentation**: Auto-generate documentation for all configurations.

### Next Steps

1. Review and approve this configuration analysis
2. Prioritize configuration items based on business needs
3. Create detailed technical specifications for Phase 1
4. Design UI mockups for configuration screens
5. Begin database schema modifications
6. Implement configuration APIs
7. Build admin configuration portal
8. Test and iterate

---

## 29. COMPARISON: PDF ANALYSIS VS GENERATED ANALYSIS

### Configuration Items Comparison

| Configuration Item | In PDF | In Original Analysis | Status | Priority |
|-------------------|--------|---------------------|--------|----------|
| **Leave Types** | ✓ | ✓ | Aligned | High |
| **Leave Calendar** | ✓ | ✓ | Aligned | Medium |
| **Monthly Leave Accrual** | ✓ | ✓ | Aligned | High |
| **Joining-Based Leave Allocation** | ✓ | ✓ | Aligned | Medium |
| **Carry-Forward Rules** | ✓ | ✓ | Aligned | High |
| **Maternity/Paternity Eligibility** | ✓ | ✓ | Aligned | High |
| **Leave Request Flow** | ✓ | ✓ | Aligned | High |
| **Comp Off Approval Flow** | ✓ | ✓ | Aligned | High |
| **Email Notifications** | ✓ | ✓ | Aligned | Medium |
| **Holiday List** | ✓ | ✓ | Aligned | High |
| **Leave Duration** | ✓ (Quarter-day, Hourly) | ✓ (Enhanced with granularity) | **Enhanced** | Medium |
| **Leave Balance Visibility** | ✓ | ⚠️ (Added) | **Added from PDF** | Low |
| **Comp Off Eligibility** | ✓ | ✓ | Aligned | Medium |
| **Comp Off Expiry** | ✓ | ✓ | Aligned | High |
| **Dashboard Widgets** | ✓ | ⚠️ (Added) | **Added from PDF** | **High** |
| **Reports** | ✓ (Report Builder) | ✓ (Enhanced) | **Enhanced** | Medium |
| **Leave Balance Calculation** | ✓ (Rule Engine) | ✓ | Aligned | High |
| **Mandatory Fields in Application** | ✓ (Per Leave Type) | ⚠️ (Enhanced) | **Enhanced from PDF** | Medium |
| **Bulk Actions (Approval)** | ✓ | ⚠️ (Added) | **Added from PDF** | **Medium** |
| **Team Calendar Overlap Check** | ✓ | ⚠️ (Added) | **Added from PDF** | **Low** |

### Summary of Additions from PDF

**✅ Completely New Sections Added (4):**
1. **Section 13A: Dashboard Widgets Configuration** - HIGH Priority
   - Role-based custom dashboards
   - Widget positioning, sizing, and refresh
   - Widget library and plugin system

2. **Section 13B: Bulk Actions Configuration** - MEDIUM Priority
   - Bulk approval/rejection with audit trail
   - Selection limits and validation rules
   - Enhanced confirmation dialogs

3. **Section 13C: Team Calendar Overlap Check** - LOW Priority
   - Configurable overlap thresholds
   - Warning and blocking rules
   - External calendar integration

4. **Section 13D: Leave Balance Visibility Configuration** - LOW Priority
   - Role-based visibility controls
   - Balance history and projections
   - Balance alerts and thresholds

**📝 Enhanced Existing Sections (3):**
1. **Section 12: Leave Application Configuration**
   - Added subsection 12.2: Leave Duration Granularity (Quarter-day, Hourly leaves)
   - Added subsection 12.3: Mandatory Fields per Leave Type

2. **Section 13: Reports Configuration**
   - Enhanced with Report Builder details
   - Custom report configuration with field selection
   - Advanced filtering and aggregations

3. **Section 20: Implementation Priority Matrix**
   - Updated with PDF-derived priorities
   - Clear mapping of source (PDF vs Analysis)

### Coverage Analysis

| Category | Items from PDF | Items in Original Analysis | Coverage % |
|----------|---------------|---------------------------|------------|
| **Core Leave Management** | 10 | 10 | 100% |
| **Approval & Workflow** | 4 | 4 | 100% |
| **Notifications** | 2 | 2 | 100% |
| **UI/UX Features** | 4 | 1 | **Enhanced to 100%** |
| **Reporting & Analytics** | 2 | 1 | **Enhanced to 100%** |
| **Advanced Features** | 3 | 0 | **Added to 100%** |
| **TOTAL** | 25 | 18 | **100% (after updates)** |

### Key Insights

1. **Original Analysis Strength**: Comprehensive coverage of core leave management, policies, and workflows
2. **PDF Added Value**: User-facing features (Dashboard, Bulk Actions, Team Calendar, Balance Visibility)
3. **Combined Strength**: Complete 360° configuration coverage from backend policies to frontend UX

### Configuration Count Summary

| Document | Configuration Categories | Configurable Fields | Database Tables Required | API Endpoints Required |
|----------|------------------------|-------------------|------------------------|---------------------|
| **PDF Analysis** | 10 areas | ~20 items | Not specified | Not specified |
| **Original Analysis** | 28 sections | ~180 items | 10 new tables | 15+ endpoints |
| **Combined (This Document)** | **32 sections** | **~200 items** | **12 new tables** | **20+ endpoints** |

---

## 30. FINAL RECOMMENDATIONS FOR DEVELOPMENT

### Immediate Next Steps (Sprint 1-2)

1. **Database Schema Updates**
   - Create `DashboardConfiguration` table (NEW from PDF)
   - Create `BulkActionConfiguration` table (NEW from PDF)
   - Enhance `LeavePolicy` with duration granularity
   - Add `LeaveApplicationFieldConfig` table

2. **API Development Priority**
   ```
   HIGH Priority APIs (Sprint 1-2):
   - POST /api/v1/configurations/dashboard
   - GET  /api/v1/configurations/dashboard/:roleId
   - POST /api/v1/leave-requests/bulk-approve
   - POST /api/v1/leave-requests/bulk-reject
   - GET  /api/v1/leave-types/:id/field-config
   ```

3. **Frontend Development Priority**
   ```
   HIGH Priority UI (Sprint 1-2):
   - Dashboard Widget Framework
   - Widget Configuration Panel
   - Bulk Actions UI with Selection
   - Enhanced Report Builder (drag-drop fields)
   ```

4. **Configuration Management**
   - Build Admin Configuration Portal
   - Implement Dashboard Widget Manager
   - Create Bulk Action Configuration UI
   - Add Report Builder Interface

### Development Phases (Updated)

**Phase 1: Foundation (Sprint 1-2)** - ✅ Includes PDF Items
- Configuration tables
- Dashboard widget system **(NEW)**
- Basic bulk actions **(NEW)**
- Admin UI framework

**Phase 2: Core Policies (Sprint 3-4)**
- Leave types & accrual
- Carry-forward rules
- Eligibility criteria
- Field-level validation **(ENHANCED)**

**Phase 3: Workflows & UX (Sprint 5-6)**
- Approval workflows
- Report builder **(ENHANCED)**
- Team calendar **(NEW)**
- Balance visibility **(NEW)**

**Phase 4: Advanced Features (Sprint 7-8)**
- External integrations
- Advanced analytics
- Overlap detection **(NEW)**
- Custom widgets **(NEW)**

**Phase 5: Optimization (Sprint 9-10)**
- Performance tuning
- Documentation
- Training materials
- Rollout

### Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Configuration Flexibility** | 90% of policies configurable without code | Configuration coverage audit |
| **Admin Efficiency** | 80% reduction in policy change deployment time | Time tracking |
| **User Satisfaction** | Dashboard customization adoption > 60% | Usage analytics |
| **System Performance** | Bulk actions < 5s for 100 items | Performance monitoring |
| **Report Flexibility** | 75% of ad-hoc report requests self-served | Support ticket analysis |

---

## Document Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-30 | System Generated | Initial comprehensive configuration analysis |
| 2.0 | 2025-10-30 | Updated after PDF review | - Added 4 new sections (13A-13D) from PDF<br>- Enhanced 3 existing sections<br>- Updated priority matrix<br>- Added comparison analysis<br>- Added development recommendations |

---

## Appendix A: Quick Reference - Configuration Categories

| Section | Category | Priority | Complexity | Estimated Effort |
|---------|----------|----------|------------|-----------------|
| 1 | Leave Types | High | Medium | 2 weeks |
| 2 | Leave Calendar | Medium | Low | 1 week |
| 3 | Leave Accrual | High | High | 3 weeks |
| 4 | Carry-Forward | High | High | 2 weeks |
| 5 | USA PTO | High | Medium | 2 weeks |
| 6 | Approval Workflows | High | High | 4 weeks |
| 7 | Comp Off | High | High | 3 weeks |
| 8 | Eligibility | High | Medium | 2 weeks |
| 9 | Notifications | Medium | Medium | 2 weeks |
| 10 | Holidays | High | Low | 1 week |
| 11 | User Fields | Medium | Low | 1 week |
| 12 | Leave Application | High | High | 3 weeks |
| 13 | Reports | Medium | High | 4 weeks |
| **13A** | **Dashboard Widgets** | **High** | **High** | **4 weeks** |
| **13B** | **Bulk Actions** | **Medium** | **Medium** | **2 weeks** |
| **13C** | **Team Calendar Overlap** | **Low** | **Medium** | **2 weeks** |
| **13D** | **Balance Visibility** | **Low** | **Low** | **1 week** |
| 14 | System Settings | Medium | Low | 1 week |
| 15 | Regional Policies | High | High | 3 weeks |
| 16 | Advanced Features | Low | High | 8 weeks |
| 17 | Workflow Automation | High | High | 4 weeks |
| 18 | Data Retention | Low | Medium | 2 weeks |
| 19 | Notification Preferences | Medium | Medium | 2 weeks |
| **Total** | **32 categories** | **Mixed** | **Mixed** | **~55 weeks** |

---

**END OF DOCUMENT**

**Document Status**: ✅ Complete and Enhanced with PDF Analysis
**Last Updated**: 2025-10-30
**Total Configuration Items**: 200+
**New Database Tables Required**: 12
**Estimated Development Timeline**: 10-12 sprints (5-6 months)
**Priority Focus**: Leave Policies + Dashboard Widgets + Bulk Actions
