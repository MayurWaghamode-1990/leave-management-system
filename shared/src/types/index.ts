// User roles and authentication types
export enum UserRole {
  EMPLOYEE = 'EMPLOYEE',
  MANAGER = 'MANAGER',
  HR_ADMIN = 'HR_ADMIN',
  PAYROLL_OFFICER = 'PAYROLL_OFFICER',
  IT_ADMIN = 'IT_ADMIN'
}

export interface User {
  id: string;
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department: string;
  location: string;
  reportingManagerId?: string;
  joiningDate: Date;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

// Leave types and statuses
export enum LeaveType {
  SICK_LEAVE = 'SICK_LEAVE',
  CASUAL_LEAVE = 'CASUAL_LEAVE',
  EARNED_LEAVE = 'EARNED_LEAVE',
  MATERNITY_LEAVE = 'MATERNITY_LEAVE',
  PATERNITY_LEAVE = 'PATERNITY_LEAVE',
  COMPENSATORY_OFF = 'COMPENSATORY_OFF',
  BEREAVEMENT_LEAVE = 'BEREAVEMENT_LEAVE',
  MARRIAGE_LEAVE = 'MARRIAGE_LEAVE'
}

export enum LeaveStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  isHalfDay: boolean;
  reason: string;
  attachments?: string[];
  status: LeaveStatus;
  appliedDate: Date;
  approvals: Approval[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Approval {
  id: string;
  leaveRequestId: string;
  approverId: string;
  level: number;
  status: ApprovalStatus;
  comments?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Leave balance and policy types
export interface LeaveBalance {
  id: string;
  employeeId: string;
  leaveType: LeaveType;
  totalEntitlement: number;
  used: number;
  available: number;
  carryForward: number;
  year: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeavePolicy {
  id: string;
  name: string;
  leaveType: LeaveType;
  entitlementDays: number;
  accrualRate: number;
  maxCarryForward: number;
  minimumGap: number;
  maxConsecutiveDays: number;
  requiresDocumentation: boolean;
  location: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Holiday and calendar types
export interface Holiday {
  id: string;
  name: string;
  date: Date;
  location: string;
  isOptional: boolean;
  type: 'NATIONAL' | 'REGIONAL' | 'COMPANY';
  createdAt: Date;
  updatedAt: Date;
}

// Department and organization types
export interface Department {
  id: string;
  name: string;
  managerId?: string;
  parentDepartmentId?: string;
  location: string;
  createdAt: Date;
  updatedAt: Date;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Dashboard and reporting types
export interface DashboardStats {
  totalEmployees: number;
  pendingApprovals: number;
  leavesThisMonth: number;
  upcomingLeaves: number;
}

export interface LeaveUtilizationReport {
  department: string;
  totalEntitlement: number;
  totalUsed: number;
  utilizationPercentage: number;
}

export interface AbsenteeismReport {
  month: string;
  absenteeismRate: number;
  departmentBreakdown: {
    department: string;
    rate: number;
  }[];
}

// Regional compliance types
export enum Region {
  INDIA = 'INDIA',
  USA = 'USA'
}

export interface RegionalPolicy {
  id: string;
  region: Region;
  state?: string;
  policyRules: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Notification types
export enum NotificationType {
  LEAVE_REQUESTED = 'LEAVE_REQUESTED',
  LEAVE_APPROVED = 'LEAVE_APPROVED',
  LEAVE_REJECTED = 'LEAVE_REJECTED',
  LEAVE_CANCELLED = 'LEAVE_CANCELLED',
  APPROVAL_PENDING = 'APPROVAL_PENDING',
  BALANCE_LOW = 'BALANCE_LOW',
  LEAVE_REMINDER = 'LEAVE_REMINDER'
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// Form and validation types
export interface CreateLeaveRequestInput {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  isHalfDay?: boolean;
  reason: string;
  attachments?: File[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

// Export all types
export * from './index';