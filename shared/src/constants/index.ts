import { LeaveType, UserRole } from '../types';

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password'
  },
  LEAVE_REQUESTS: {
    BASE: '/leave-requests',
    APPROVE: (id: string) => `/leave-requests/${id}/approve`,
    REJECT: (id: string) => `/leave-requests/${id}/reject`,
    CANCEL: (id: string) => `/leave-requests/${id}/cancel`,
    BY_EMPLOYEE: (employeeId: string) => `/leave-requests/employee/${employeeId}`,
    PENDING: '/leave-requests/pending',
    TEAM: '/leave-requests/team'
  },
  LEAVE_BALANCES: {
    BASE: '/leave-balances',
    BY_EMPLOYEE: (employeeId: string) => `/leave-balances/employee/${employeeId}`,
    BULK_UPDATE: '/leave-balances/bulk-update'
  },
  EMPLOYEES: {
    BASE: '/employees',
    BY_MANAGER: (managerId: string) => `/employees/manager/${managerId}`,
    SEARCH: '/employees/search'
  },
  POLICIES: {
    BASE: '/policies',
    BY_LOCATION: (location: string) => `/policies/location/${location}`,
    ACTIVE: '/policies/active'
  },
  HOLIDAYS: {
    BASE: '/holidays',
    BY_LOCATION: (location: string) => `/holidays/location/${location}`,
    BY_YEAR: (year: number) => `/holidays/year/${year}`
  },
  REPORTS: {
    UTILIZATION: '/reports/utilization',
    ABSENTEEISM: '/reports/absenteeism',
    COMPLIANCE: '/reports/compliance',
    DASHBOARD: '/reports/dashboard'
  },
  NOTIFICATIONS: {
    BASE: '/notifications',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all'
  }
} as const;

// Leave type configurations
export const LEAVE_TYPE_CONFIG = {
  [LeaveType.SICK_LEAVE]: {
    label: 'Sick Leave',
    color: '#f44336',
    icon: 'LocalHospital',
    maxDays: 12,
    requiresDocumentation: true,
    documentationThreshold: 2
  },
  [LeaveType.CASUAL_LEAVE]: {
    label: 'Casual Leave',
    color: '#2196f3',
    icon: 'Event',
    maxDays: 12,
    requiresDocumentation: false,
    documentationThreshold: 0
  },
  [LeaveType.EARNED_LEAVE]: {
    label: 'Earned Leave',
    color: '#4caf50',
    icon: 'Beach',
    maxDays: 30,
    requiresDocumentation: false,
    documentationThreshold: 0
  },
  [LeaveType.MATERNITY_LEAVE]: {
    label: 'Maternity Leave',
    color: '#e91e63',
    icon: 'Pregnant',
    maxDays: 182,
    requiresDocumentation: true,
    documentationThreshold: 1
  },
  [LeaveType.PATERNITY_LEAVE]: {
    label: 'Paternity Leave',
    color: '#9c27b0',
    icon: 'Family',
    maxDays: 15,
    requiresDocumentation: true,
    documentationThreshold: 1
  },
  [LeaveType.COMPENSATORY_OFF]: {
    label: 'Compensatory Off',
    color: '#ff9800',
    icon: 'SwapHoriz',
    maxDays: 5,
    requiresDocumentation: false,
    documentationThreshold: 0
  },
  [LeaveType.BEREAVEMENT_LEAVE]: {
    label: 'Bereavement Leave',
    color: '#607d8b',
    icon: 'Sentiment',
    maxDays: 7,
    requiresDocumentation: true,
    documentationThreshold: 1
  },
  [LeaveType.MARRIAGE_LEAVE]: {
    label: 'Marriage Leave',
    color: '#ffeb3b',
    icon: 'Favorite',
    maxDays: 5,
    requiresDocumentation: false,
    documentationThreshold: 0
  }
} as const;

// User role permissions
export const ROLE_PERMISSIONS = {
  [UserRole.EMPLOYEE]: {
    canCreateLeaveRequest: true,
    canViewOwnLeaves: true,
    canCancelOwnLeaves: true,
    canViewTeamLeaves: false,
    canApproveLeaves: false,
    canViewReports: false,
    canManageUsers: false,
    canManagePolicies: false
  },
  [UserRole.MANAGER]: {
    canCreateLeaveRequest: true,
    canViewOwnLeaves: true,
    canCancelOwnLeaves: true,
    canViewTeamLeaves: true,
    canApproveLeaves: true,
    canViewReports: true,
    canManageUsers: false,
    canManagePolicies: false
  },
  [UserRole.HR_ADMIN]: {
    canCreateLeaveRequest: true,
    canViewOwnLeaves: true,
    canCancelOwnLeaves: true,
    canViewTeamLeaves: true,
    canApproveLeaves: true,
    canViewReports: true,
    canManageUsers: true,
    canManagePolicies: true
  },
  [UserRole.PAYROLL_OFFICER]: {
    canCreateLeaveRequest: false,
    canViewOwnLeaves: true,
    canCancelOwnLeaves: false,
    canViewTeamLeaves: false,
    canApproveLeaves: false,
    canViewReports: true,
    canManageUsers: false,
    canManagePolicies: false
  },
  [UserRole.IT_ADMIN]: {
    canCreateLeaveRequest: true,
    canViewOwnLeaves: true,
    canCancelOwnLeaves: true,
    canViewTeamLeaves: false,
    canApproveLeaves: false,
    canViewReports: true,
    canManageUsers: true,
    canManagePolicies: true
  }
} as const;

// Regional configurations
export const REGIONAL_CONFIG = {
  INDIA: {
    workingDaysPerWeek: 5,
    weekends: [6, 0], // Saturday, Sunday
    fiscalYearStart: { month: 4, day: 1 }, // April 1st
    defaultHolidays: [
      'Republic Day',
      'Independence Day',
      'Gandhi Jayanti'
    ],
    sandwichPolicy: true,
    currency: 'INR',
    dateFormat: 'DD/MM/YYYY'
  },
  USA: {
    workingDaysPerWeek: 5,
    weekends: [6, 0], // Saturday, Sunday
    fiscalYearStart: { month: 1, day: 1 }, // January 1st
    defaultHolidays: [
      'New Year Day',
      'Independence Day',
      'Christmas Day'
    ],
    sandwichPolicy: false,
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY'
  }
} as const;

// Application constants
export const APP_CONFIG = {
  NAME: 'Leave Management System',
  VERSION: '1.0.0',
  SUPPORTED_REGIONS: ['INDIA', 'USA'],
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  SUPPORTED_FILE_TYPES: ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'],
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100
  },
  CACHE_TTL: {
    SHORT: 5 * 60, // 5 minutes
    MEDIUM: 30 * 60, // 30 minutes
    LONG: 24 * 60 * 60 // 24 hours
  }
} as const;

// Status colors for UI
export const STATUS_COLORS = {
  PENDING: '#ff9800',
  APPROVED: '#4caf50',
  REJECTED: '#f44336',
  CANCELLED: '#607d8b',
  DRAFT: '#9e9e9e'
} as const;

// Date and time formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM DD, YYYY',
  INPUT: 'YYYY-MM-DD',
  API: 'YYYY-MM-DD',
  DATETIME_DISPLAY: 'MMM DD, YYYY hh:mm A',
  DATETIME_API: 'YYYY-MM-DDTHH:mm:ss.SSSZ'
} as const;

// Validation constants
export const VALIDATION = {
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: true
  },
  LEAVE_REQUEST: {
    MIN_ADVANCE_DAYS: 1,
    MAX_FUTURE_DAYS: 365,
    MIN_REASON_LENGTH: 10,
    MAX_REASON_LENGTH: 500
  },
  EMAIL: {
    MAX_LENGTH: 254
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50
  }
} as const;

// Error messages
export const ERROR_MESSAGES = {
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    TOKEN_EXPIRED: 'Session expired, please login again',
    ACCESS_DENIED: 'Access denied',
    UNAUTHORIZED: 'Unauthorized access'
  },
  LEAVE: {
    INSUFFICIENT_BALANCE: 'Insufficient leave balance',
    OVERLAPPING_DATES: 'Leave dates overlap with existing request',
    INVALID_DATE_RANGE: 'Invalid date range',
    PAST_DATE_NOT_ALLOWED: 'Cannot apply for leave in the past'
  },
  VALIDATION: {
    REQUIRED_FIELD: 'This field is required',
    INVALID_EMAIL: 'Invalid email format',
    PASSWORD_TOO_WEAK: 'Password does not meet requirements',
    FILE_TOO_LARGE: 'File size exceeds limit',
    INVALID_FILE_TYPE: 'Invalid file type'
  },
  GENERAL: {
    NETWORK_ERROR: 'Network error, please try again',
    SERVER_ERROR: 'Server error, please try again later',
    UNEXPECTED_ERROR: 'An unexpected error occurred'
  }
} as const;