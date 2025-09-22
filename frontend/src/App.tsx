import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useRealTimeNotifications } from './hooks/useRealTimeNotifications'

// Pages
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import LeavesPage from './pages/leaves/LeavesPage'
import ApprovalsPage from './pages/approvals/ApprovalsPage'
import TeamPage from './pages/team/TeamPage'
import ReportsPage from './pages/reports/ReportsPage'
import NotificationsPage from './pages/notifications/NotificationsPage'
import ProfilePage from './pages/profile/ProfilePage'
import HolidaysPage from './pages/holidays/HolidaysPage'
import HRPoliciesPage from './pages/hr/PoliciesPage'
import HRUsersPage from './pages/hr/UsersPage'
import BulkOperationsPage from './pages/admin/BulkOperationsPage'
import CalendarPage from './pages/calendar/CalendarPage'
import TemplatesPage from './pages/templates/TemplatesPage'
import DraftsPage from './pages/drafts/DraftsPage'
import DelegationsPage from './pages/delegations/DelegationsPage'
import AdvancedRequestsPage from './pages/advanced-requests/AdvancedRequestsPage'
import ManagerDashboard from './pages/manager/ManagerDashboard'
import NotFoundPage from './pages/NotFoundPage'

// Components
import Layout from './components/layout/Layout'
import LoadingSpinner from './components/common/LoadingSpinner'
import ProtectedRoute from './components/auth/ProtectedRoute'

function App() {
  const { isLoading } = useAuth()

  // Initialize real-time notifications
  const { isConnected } = useRealTimeNotifications()

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="leaves/*" element={<LeavesPage />} />
        <Route path="approvals" element={<ApprovalsPage />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="holidays" element={<HolidaysPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="drafts" element={<DraftsPage />} />
        <Route path="delegations" element={<DelegationsPage />} />
        <Route path="advanced-requests" element={<AdvancedRequestsPage />} />
        <Route path="profile" element={<ProfilePage />} />

        {/* Manager routes */}
        <Route path="manager">
          <Route path="dashboard" element={<ManagerDashboard />} />
        </Route>

        {/* HR Admin routes */}
        <Route path="hr">
          <Route path="policies" element={<HRPoliciesPage />} />
          <Route path="users" element={<HRUsersPage />} />
        </Route>

        {/* Admin routes */}
        <Route path="admin">
          <Route path="bulk-operations" element={<BulkOperationsPage />} />
        </Route>
      </Route>

      {/* 404 route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App