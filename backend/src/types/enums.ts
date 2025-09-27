// Enum definitions for the leave management system
// These are used when the database schema uses string fields instead of Prisma enums

export enum UserRole {
  EMPLOYEE = 'EMPLOYEE',
  MANAGER = 'MANAGER',
  HR = 'HR',
  HR_ADMIN = 'HR_ADMIN',
  ADMIN = 'ADMIN',
  IT_ADMIN = 'IT_ADMIN',
  PAYROLL_OFFICER = 'PAYROLL_OFFICER'
}

export enum LeaveType {
  EARNED_LEAVE = 'EARNED_LEAVE',
  SICK_LEAVE = 'SICK_LEAVE',
  CASUAL_LEAVE = 'CASUAL_LEAVE',
  MATERNITY_LEAVE = 'MATERNITY_LEAVE',
  PATERNITY_LEAVE = 'PATERNITY_LEAVE',
  COMPENSATORY_OFF = 'COMPENSATORY_OFF',
  BEREAVEMENT_LEAVE = 'BEREAVEMENT_LEAVE',
  MARRIAGE_LEAVE = 'MARRIAGE_LEAVE',
  LEAVE_WITHOUT_PAY = 'LEAVE_WITHOUT_PAY',
  PTO = 'PTO'
}

export enum Region {
  INDIA = 'INDIA',
  USA = 'USA',
  GLOBAL = 'GLOBAL'
}

export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  WITHDRAWN = 'WITHDRAWN'
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}