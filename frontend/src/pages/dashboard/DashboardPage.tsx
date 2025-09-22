import React, { useState, useEffect } from 'react'
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  LinearProgress,
  Button,
  Alert
} from '@mui/material'
import {
  EventNote,
  CheckCircle,
  Schedule,
  Group,
  TrendingUp,
  CalendarMonth,
  AccountBalance,
  Pending,
  Cancel,
  Refresh
} from '@mui/icons-material'
import toast from 'react-hot-toast'

import { useAuth } from '@/hooks/useAuth'
import { LeaveStatus, LeaveType } from '@/types'
import api from '@/config/api'
import EnhancedLeaveBalance from '@/components/dashboard/EnhancedLeaveBalance'

interface DashboardStats {
  personal: {
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    totalLeaveBalance: number;
    upcomingLeaves: number;
  };
  team?: {
    totalTeamRequests: number;
    pendingApprovals: number;
    teamOnLeaveToday: number;
    upcomingTeamLeaves: number;
    recentApprovals: number;
  };
  recentActivity: Array<{
    id: string;
    type: LeaveType;
    startDate: string;
    endDate: string;
    status: LeaveStatus;
    appliedDate: string;
    totalDays: number;
  }>;
  user: {
    role: string;
    name: string;
  };
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [leaveBalances, setLeaveBalances] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [statsResponse, balancesResponse] = await Promise.all([
        api.get('/leaves/dashboard-stats'),
        api.get('/leaves/balances')
      ])

      setDashboardStats(statsResponse.data.data)
      setLeaveBalances(balancesResponse.data.data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDashboardData()
    setRefreshing(false)
    toast.success('Dashboard refreshed!')
  }

  const getLeaveTypeLabel = (type: LeaveType) => {
    switch (type) {
      case LeaveType.SICK_LEAVE:
        return 'Sick Leave'
      case LeaveType.CASUAL_LEAVE:
        return 'Casual Leave'
      case LeaveType.EARNED_LEAVE:
        return 'Earned Leave'
      case LeaveType.MATERNITY_LEAVE:
        return 'Maternity Leave'
      case LeaveType.PATERNITY_LEAVE:
        return 'Paternity Leave'
      case LeaveType.COMPENSATORY_OFF:
        return 'Compensatory Off'
      case LeaveType.BEREAVEMENT_LEAVE:
        return 'Bereavement Leave'
      case LeaveType.MARRIAGE_LEAVE:
        return 'Marriage Leave'
      default:
        return (type as string).replace('_', ' ')
    }
  }

  const getStatusColor = (status: LeaveStatus) => {
    switch (status) {
      case LeaveStatus.APPROVED:
        return 'success'
      case LeaveStatus.PENDING:
        return 'warning'
      case LeaveStatus.REJECTED:
        return 'error'
      case LeaveStatus.CANCELLED:
        return 'default'
      default:
        return 'default'
    }
  }

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <LinearProgress />
      </Box>
    )
  }

  if (!dashboardStats) {
    return (
      <Box>
        <Alert severity="error">
          Failed to load dashboard data. Please try refreshing the page.
        </Alert>
      </Box>
    )
  }

  const StatCard: React.FC<{
    title: string
    value: number
    icon: React.ReactElement
    color: string
  }> = ({ title, value, icon, color }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
            {icon}
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {value}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {title}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )

  return (
    <Box>
      {/* Welcome Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Welcome back, {dashboardStats.user.name}! 👋
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Here's your leave management overview.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Personal Stats Cards */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalance />
            Your Leave Summary
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Requests"
            value={dashboardStats.personal.totalRequests}
            icon={<EventNote />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Requests"
            value={dashboardStats.personal.pendingRequests}
            icon={<Pending />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Upcoming Leaves"
            value={dashboardStats.personal.upcomingLeaves}
            icon={<CalendarMonth />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Available Balance"
            value={dashboardStats.personal.totalLeaveBalance}
            icon={<TrendingUp />}
            color="#9c27b0"
          />
        </Grid>

        {/* Team Stats for Managers */}
        {dashboardStats.team && (
          <>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, mt: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Group />
                Team Management
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Pending Approvals"
                value={dashboardStats.team.pendingApprovals}
                icon={<Schedule />}
                color="#f57c00"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Team on Leave Today"
                value={dashboardStats.team.teamOnLeaveToday}
                icon={<Group />}
                color="#d32f2f"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Upcoming Team Leaves"
                value={dashboardStats.team.upcomingTeamLeaves}
                icon={<CalendarMonth />}
                color="#388e3c"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Recent Approvals"
                value={dashboardStats.team.recentApprovals}
                icon={<CheckCircle />}
                color="#1976d2"
              />
            </Grid>
          </>
        )}

        {/* Enhanced Leave Balance */}
        <Grid item xs={12} md={6}>
          <EnhancedLeaveBalance />
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Leave Activity
              </Typography>
              <List>
                {dashboardStats.recentActivity.map((request, index) => (
                  <React.Fragment key={request.id}>
                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: getStatusColor(request.status) === 'success' ? 'success.main' :
                                    getStatusColor(request.status) === 'warning' ? 'warning.main' :
                                    getStatusColor(request.status) === 'error' ? 'error.main' : 'grey.400',
                            width: 32,
                            height: 32,
                          }}
                        >
                          {request.status === LeaveStatus.APPROVED ? <CheckCircle fontSize="small" /> :
                           request.status === LeaveStatus.PENDING ? <Schedule fontSize="small" /> :
                           request.status === LeaveStatus.REJECTED ? <Cancel fontSize="small" /> :
                           <EventNote fontSize="small" />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight="medium">
                              {getLeaveTypeLabel(request.type)}
                            </Typography>
                            <Chip
                              label={request.status}
                              size="small"
                              color={getStatusColor(request.status) as any}
                            />
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" color="textSecondary">
                            {request.startDate} - {request.endDate} ({request.totalDays} days)
                          </Typography>
                        }
                      />
                    </ListItem>
                    {index < dashboardStats.recentActivity.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
                {dashboardStats.recentActivity.length === 0 && (
                  <Box textAlign="center" py={3}>
                    <Typography variant="body2" color="textSecondary">
                      No recent leave activity
                    </Typography>
                  </Box>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.default' }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Access common leave management functions
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button variant="contained" href="/leaves" color="primary">
                Apply for Leave
              </Button>
              {dashboardStats.team && (
                <Button variant="outlined" href="/approvals" color="warning">
                  Review Approvals ({dashboardStats.team.pendingApprovals})
                </Button>
              )}
              <Button variant="outlined" href="/reports" color="info">
                View Reports
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default DashboardPage