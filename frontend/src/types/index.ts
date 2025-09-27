// User and Authentication Types
export interface User {
  id: string
  employeeId: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  department: string
  location: string
  joiningDate: string
  reportingManagerId?: string
  reportingManager?: {
    firstName: string
    lastName: string
    email: string
  }
  status: UserStatus
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  success: boolean
  message: string
  data: {
    token: string
    user: User
  }
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

// Leave Types
export interface LeaveRequest {
  id: string
  employeeId: string
  leaveType: LeaveType
  startDate: string
  endDate: string
  totalDays: number
  isHalfDay: boolean
  reason: string
  attachments: string[]
  status: LeaveStatus
  appliedDate: string
  createdAt: string
  updatedAt: string
  employee?: {
    firstName: string
    lastName: string
    employeeId: string
    department: string
  }
  approvals?: Approval[]
}

export interface CreateLeaveRequest {
  leaveType: LeaveType
  startDate: string
  endDate: string
  reason: string
  isHalfDay?: boolean
  attachments?: string[]
}

export interface Approval {
  id: string
  leaveRequestId: string
  approverId: string
  level: number
  status: ApprovalStatus
  comments?: string
  approvedAt?: string
  createdAt: string
  updatedAt: string
  approver: {
    firstName: string
    lastName: string
  }
}

export interface ApprovalAction {
  action: 'approve' | 'reject'
  comments?: string
}

export interface LeaveBalance {
  id: string
  employeeId: string
  leaveType: LeaveType
  totalEntitlement: number
  used: number
  available: number
  carryForward: number
  year: number
  createdAt: string
  updatedAt: string
}

// Policy Types
export interface LeavePolicy {
  id: string
  name: string
  leaveType: LeaveType
  entitlementDays: number
  accrualRate: number
  maxCarryForward: number
  minimumGap: number
  maxConsecutiveDays: number
  requiresDocumentation: boolean
  documentationThreshold: number
  location: string
  region: Region
  effectiveFrom: string
  effectiveTo?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Holiday Types
export interface Holiday {
  id: string
  name: string
  date: string
  location: string
  region: Region
  isOptional: boolean
  type: HolidayType
  createdAt: string
  updatedAt: string
}

// Notification Types
export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

export interface PaginatedResponse<T = any> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Enums
export enum UserRole {
  EMPLOYEE = 'EMPLOYEE',
  MANAGER = 'MANAGER',
  HR_ADMIN = 'HR_ADMIN',
  PAYROLL_OFFICER = 'PAYROLL_OFFICER',
  IT_ADMIN = 'IT_ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum LeaveType {
  SICK_LEAVE = 'SICK_LEAVE',
  CASUAL_LEAVE = 'CASUAL_LEAVE',
  EARNED_LEAVE = 'EARNED_LEAVE',
  MATERNITY_LEAVE = 'MATERNITY_LEAVE',
  PATERNITY_LEAVE = 'PATERNITY_LEAVE',
  COMPENSATORY_OFF = 'COMPENSATORY_OFF',
  BEREAVEMENT_LEAVE = 'BEREAVEMENT_LEAVE',
  MARRIAGE_LEAVE = 'MARRIAGE_LEAVE',
  LEAVE_WITHOUT_PAY = 'LEAVE_WITHOUT_PAY',
  PTO = 'PTO'
}

export enum LeaveStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum Region {
  INDIA = 'INDIA',
  USA = 'USA',
}

export enum HolidayType {
  NATIONAL = 'NATIONAL',
  REGIONAL = 'REGIONAL',
  COMPANY = 'COMPANY',
}

export enum NotificationType {
  LEAVE_REQUESTED = 'LEAVE_REQUESTED',
  LEAVE_APPROVED = 'LEAVE_APPROVED',
  LEAVE_REJECTED = 'LEAVE_REJECTED',
  LEAVE_CANCELLED = 'LEAVE_CANCELLED',
  APPROVAL_PENDING = 'APPROVAL_PENDING',
  BALANCE_LOW = 'BALANCE_LOW',
  LEAVE_REMINDER = 'LEAVE_REMINDER',
}

// Form Types
export interface LeaveRequestFormData {
  leaveType: LeaveType
  startDate: Date | null
  endDate: Date | null
  isHalfDay: boolean
  reason: string
}

// Dashboard Types
export interface DashboardStats {
  totalRequests: number
  pendingApprovals: number
  upcomingLeaves: number
  teamOnLeave: number
}

export interface LeaveStats {
  leaveType: string
  used: number
  available: number
  total: number
}

// Chart Types
export interface ChartData {
  name: string
  value: number
  color?: string
}

// Error Types
export interface ApiError {
  message: string
  statusCode: number
  error?: string
}

// Table Types
export interface TableColumn<T = any> {
  id: keyof T
  label: string
  minWidth?: number
  align?: 'right' | 'left' | 'center'
  format?: (value: any) => string
  sortable?: boolean
}

export interface SortConfig {
  key: string
  direction: 'asc' | 'desc'
}

// Filter Types
export interface FilterConfig {
  status?: LeaveStatus[]
  leaveType?: LeaveType[]
  dateRange?: {
    start: Date
    end: Date
  }
  employee?: string
}