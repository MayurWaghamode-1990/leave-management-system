import axios, { AxiosInstance, AxiosResponse } from 'axios'
import toast from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error) => {
    const { response } = error

    if (!response) {
      toast.error('Network error. Please check your connection.')
      return Promise.reject(error)
    }

    const { status, data } = response

    switch (status) {
      case 400:
        toast.error(data?.message || 'Bad request')
        break
      case 401:
        toast.error('Session expired. Please login again.')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        break
      case 403:
        toast.error('You do not have permission to perform this action.')
        break
      case 404:
        toast.error('Requested resource not found.')
        break
      case 422:
        toast.error(data?.message || 'Validation error')
        break
      case 429:
        toast.error('Too many requests. Please try again later.')
        break
      case 500:
        toast.error('Internal server error. Please try again later.')
        break
      default:
        toast.error(data?.message || 'Something went wrong.')
    }

    return Promise.reject(error)
  }
)

export default api
export { api }

// API endpoints configuration
export const endpoints = {
  // Authentication
  auth: {
    login: '/auth/login',
    profile: '/auth/profile',
    changePassword: '/auth/change-password',
    logout: '/auth/logout',
  },

  // Users
  users: {
    list: '/users',
    profile: (id: string) => `/users/${id}`,
    create: '/users',
    update: (id: string) => `/users/${id}`,
    delete: (id: string) => `/users/${id}`,
    directReports: (id: string) => `/users/${id}/direct-reports`,
  },

  // Leave Requests
  leaves: {
    list: '/leaves',
    create: '/leaves',
    detail: (id: string) => `/leaves/${id}`,
    update: (id: string) => `/leaves/${id}`,
    delete: (id: string) => `/leaves/${id}`,
    approve: (id: string) => `/leaves/${id}/approval`,
    balances: '/leaves/balances',
    pendingApprovals: '/leaves/pending-approvals',
  },

  // Policies
  policies: {
    list: '/policies',
    create: '/policies',
    detail: (id: string) => `/policies/${id}`,
    update: (id: string) => `/policies/${id}`,
    delete: (id: string) => `/policies/${id}`,
  },

  // Holidays
  holidays: {
    list: '/holidays',
    create: '/holidays',
    detail: (id: string) => `/holidays/${id}`,
    update: (id: string) => `/holidays/${id}`,
    delete: (id: string) => `/holidays/${id}`,
    byLocation: (location: string) => `/holidays?location=${location}`,
  },

  // Reports
  reports: {
    dashboard: '/reports/dashboard',
    leaveUtilization: '/reports/leave-utilization',
    teamSummary: '/reports/team-summary',
    compliance: '/reports/compliance',
  },

  // Notifications
  notifications: {
    list: '/notifications',
    markRead: (id: string) => `/notifications/${id}/read`,
    markAllRead: '/notifications/mark-all-read',
    unreadCount: '/notifications/unread-count',
  },

  // Automation Rules
  automationRules: {
    list: '/automation-rules',
    create: '/automation-rules',
    detail: (id: string) => `/automation-rules/${id}`,
    update: (id: string) => `/automation-rules/${id}`,
    delete: (id: string) => `/automation-rules/${id}`,
    test: (id: string) => `/automation-rules/${id}/test`,
    execute: '/automation-rules/execute',
    stats: '/automation-rules/stats/overview',
  },

  // Advanced Leave Requests
  advancedLeaves: {
    // Cancellation requests
    cancellationRequests: '/advanced-leaves/cancellation-requests',
    approveCancellation: (id: string) => `/advanced-leaves/cancellation-requests/${id}/approve`,
    rejectCancellation: (id: string) => `/advanced-leaves/cancellation-requests/${id}/reject`,

    // Modification requests
    modificationRequests: '/advanced-leaves/modification-requests',
    approveModification: (id: string) => `/advanced-leaves/modification-requests/${id}/approve`,
    rejectModification: (id: string) => `/advanced-leaves/modification-requests/${id}/reject`,

    // Statistics
    stats: '/advanced-leaves/stats',
  },

  // Email
  email: {
    test: '/email/test',
    config: '/email/config',
  },

  // Templates
  templates: {
    list: '/templates',
    create: '/templates',
    detail: (id: string) => `/templates/${id}`,
    update: (id: string) => `/templates/${id}`,
    delete: (id: string) => `/templates/${id}`,
    use: (id: string) => `/templates/${id}/use`,
    categories: '/templates/categories',
  },

  // Comp Off
  compOff: {
    policy: '/comp-off/policy',
    workLog: '/comp-off/work-log',
    workLogs: '/comp-off/work-logs',
    balance: '/comp-off/balance',
    apply: '/comp-off/apply',
    eligibility: '/comp-off/eligibility',
    requests: '/comp-off/requests',
    detail: (id: string) => `/comp-off/requests/${id}`,
    approve: (id: string) => `/comp-off/requests/${id}/approve`,
    reject: (id: string) => `/comp-off/requests/${id}/reject`,
    verifyWorkLog: (id: string) => `/comp-off/work-log/${id}/verify`,
    processExpiration: '/comp-off/process-expiration',
  },

  // Multi-level Approvals
  multiLevelApprovals: {
    workflowSummary: '/multi-level-approvals/workflow-summary',
    compOffApprovals: '/multi-level-approvals/comp-off-approvals',
  },

  // Special Leave Types
  specialLeaveTypes: {
    checkEligibility: '/special-leave-types/check-eligibility',
    list: '/special-leave-types',
  },

  // USA PTO
  usaPto: {
    rules: '/usa-pto/rules',
    apply: '/usa-pto/apply',
    balance: '/usa-pto/balance',
  },

  // Accrual
  accrual: {
    schedulerStatus: '/accrual/scheduler/status',
    run: '/accrual/run',
    history: '/accrual/history',
  },

  // Email Actions
  emailActions: {
    status: '/email-actions/status',
    validateToken: '/email-actions/validate-token',
    approve: '/email-actions/approve',
    reject: '/email-actions/reject',
  },
} as const

export type ApiEndpoints = typeof endpoints