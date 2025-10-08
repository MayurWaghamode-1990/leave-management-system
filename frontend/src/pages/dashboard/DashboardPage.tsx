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
  Alert,
  alpha,
  useTheme,
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
  Refresh,
  WavingHand,
} from '@mui/icons-material'
import toast from 'react-hot-toast'

import { useAuth } from '@/hooks/useAuth'
import { LeaveStatus, LeaveType } from '@/types'
import api from '@/config/api'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import EnhancedLeaveBalance from '@/components/dashboard/EnhancedLeaveBalance'
import LeavePolicyDisplay from '@/components/dashboard/LeavePolicyDisplay'
import BookedLeavesSection from '@/components/dashboard/BookedLeavesSection'
import ApprovedLeavesStatus from '@/components/dashboard/ApprovedLeavesStatus'
import UpcomingHolidaysDisplay from '@/components/dashboard/UpcomingHolidaysDisplay'
import AnalyticsCharts from '@/components/dashboard/AnalyticsCharts'
import MetricsSummary from '@/components/dashboard/MetricsSummary'
import EnhancedStatCard from '@/components/dashboard/EnhancedStatCard'
import GlassCard from '@/components/common/GlassCard'
import GradientButton from '@/components/common/GradientButton'
import PageTransition from '@/components/common/PageTransition'
import SkeletonLoader from '@/components/common/SkeletonLoader'
import { fadeInUp } from '@/theme/animations'

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

  const theme = useTheme()

  if (loading) {
    return (
      <PageTransition>
        <SkeletonLoader variant="dashboard" />
      </PageTransition>
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

  return (
    <PageTransition>
      <Box>
        {/* Welcome Header */}
        <Box
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            borderRadius: 4,
            p: 4,
            mb: 4,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: `0 10px 40px ${alpha(theme.palette.primary.main, 0.3)}`,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: alpha('#ffffff', 0.1),
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -30,
              left: -30,
              width: 150,
              height: 150,
              borderRadius: '50%',
              background: alpha('#ffffff', 0.08),
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'relative',
              zIndex: 1,
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <WavingHand sx={{ color: '#FFD700', fontSize: 32 }} />
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                  Welcome back, {dashboardStats.user.name}!
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ color: alpha('#ffffff', 0.9) }}>
                Here's your leave management overview for today
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{
                borderColor: alpha('#ffffff', 0.3),
                color: 'white',
                '&:hover': {
                  borderColor: 'white',
                  background: alpha('#ffffff', 0.1),
                },
              }}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Personal Stats Cards */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <AccountBalance sx={{ color: theme.palette.primary.main }} />
              <Typography variant="h6" fontWeight={600}>
                Your Leave Summary
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <EnhancedStatCard
              title="Total Requests"
              value={dashboardStats.personal.totalRequests}
              icon={<EventNote />}
              color={theme.palette.info.main}
              gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
              subtitle="All time"
              delay={100}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <EnhancedStatCard
              title="Pending Requests"
              value={dashboardStats.personal.pendingRequests}
              icon={<Pending />}
              color={theme.palette.warning.main}
              gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
              subtitle="Awaiting approval"
              delay={200}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <EnhancedStatCard
              title="Upcoming Leaves"
              value={dashboardStats.personal.upcomingLeaves}
              icon={<CalendarMonth />}
              color={theme.palette.success.main}
              gradient="linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"
              subtitle="Next 30 days"
              delay={300}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <EnhancedStatCard
              title="Available Balance"
              value={dashboardStats.personal.totalLeaveBalance}
              icon={<TrendingUp />}
              color={theme.palette.secondary.main}
              gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              subtitle="Days remaining"
              delay={400}
            />
          </Grid>

          {/* Team Stats for Managers */}
          {dashboardStats.team && (
            <>
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Group sx={{ color: theme.palette.primary.main }} />
                  <Typography variant="h6" fontWeight={600}>
                    Team Management
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedStatCard
                  title="Pending Approvals"
                  value={dashboardStats.team.pendingApprovals}
                  icon={<Schedule />}
                  color="#f57c00"
                  gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
                  subtitle="Needs attention"
                  delay={100}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedStatCard
                  title="Team on Leave Today"
                  value={dashboardStats.team.teamOnLeaveToday}
                  icon={<Group />}
                  color="#d32f2f"
                  gradient="linear-gradient(135deg, #f857a6 0%, #ff5858 100%)"
                  subtitle="Currently away"
                  delay={200}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedStatCard
                  title="Upcoming Team Leaves"
                  value={dashboardStats.team.upcomingTeamLeaves}
                  icon={<CalendarMonth />}
                  color="#388e3c"
                  gradient="linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)"
                  subtitle="Next 7 days"
                  delay={300}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedStatCard
                  title="Recent Approvals"
                  value={dashboardStats.team.recentApprovals}
                  icon={<CheckCircle />}
                  color="#1976d2"
                  gradient="linear-gradient(135deg, #2196f3 0%, #21cbf3 100%)"
                  subtitle="Last 7 days"
                  delay={400}
                />
              </Grid>
            </>
          )}

        {/* Enhanced Leave Balance */}
        <Grid item xs={12} md={6}>
          <ErrorBoundary fallback={<Alert severity="warning">Unable to load leave balance</Alert>}>
            <EnhancedLeaveBalance />
          </ErrorBoundary>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <GlassCard gradient hover sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Recent Leave Activity
              </Typography>
              <List>
                {dashboardStats.recentActivity.map((request, index) => (
                  <React.Fragment key={request.id}>
                    <ListItem
                      alignItems="flex-start"
                      sx={{
                        px: 0,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        borderRadius: 2,
                        '&:hover': {
                          background: alpha(theme.palette.primary.main, 0.05),
                          transform: 'translateX(8px)',
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor:
                              getStatusColor(request.status) === 'success'
                                ? theme.palette.success.main
                                : getStatusColor(request.status) === 'warning'
                                  ? theme.palette.warning.main
                                  : getStatusColor(request.status) === 'error'
                                    ? theme.palette.error.main
                                    : 'grey.400',
                            width: 40,
                            height: 40,
                          }}
                        >
                          {request.status === LeaveStatus.APPROVED ? (
                            <CheckCircle fontSize="small" />
                          ) : request.status === LeaveStatus.PENDING ? (
                            <Schedule fontSize="small" />
                          ) : request.status === LeaveStatus.REJECTED ? (
                            <Cancel fontSize="small" />
                          ) : (
                            <EventNote fontSize="small" />
                          )}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="body2" fontWeight={600}>
                              {getLeaveTypeLabel(request.type)}
                            </Typography>
                            <Chip
                              label={request.status}
                              size="small"
                              color={getStatusColor(request.status) as any}
                              sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                            />
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {request.startDate} - {request.endDate} ({request.totalDays} days)
                          </Typography>
                        }
                      />
                    </ListItem>
                    {index < dashboardStats.recentActivity.length - 1 && (
                      <Divider sx={{ my: 1 }} />
                    )}
                  </React.Fragment>
                ))}
                {dashboardStats.recentActivity.length === 0 && (
                  <Box textAlign="center" py={6}>
                    <EventNote sx={{ fontSize: 48, color: theme.palette.text.disabled, mb: 2 }} />
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      No recent leave activity
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Your recent leave requests will appear here
                    </Typography>
                  </Box>
                )}
              </List>
            </CardContent>
          </GlassCard>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <GlassCard
            gradient
            sx={{
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(
                theme.palette.secondary.main,
                0.1
              )} 100%)`,
              backdropFilter: 'blur(20px)',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Quick Actions
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Access common leave management functions
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <GradientButton
                  variant="contained"
                  href="/leaves"
                  gradientType="primary"
                  sx={{ minWidth: 160 }}
                >
                  Apply for Leave
                </GradientButton>
                {dashboardStats.team && (
                  <GradientButton
                    variant="contained"
                    href="/approvals"
                    gradientType="warning"
                    sx={{ minWidth: 160 }}
                  >
                    Review Approvals ({dashboardStats.team.pendingApprovals})
                  </GradientButton>
                )}
                <GradientButton
                  variant="contained"
                  href="/reports"
                  gradientType="info"
                  sx={{ minWidth: 160 }}
                >
                  View Reports
                </GradientButton>
                <GradientButton
                  variant="contained"
                  href="/compoff/apply"
                  gradientType="secondary"
                  sx={{ minWidth: 160 }}
                >
                  Apply Comp Off
                </GradientButton>
              </Box>
            </CardContent>
          </GlassCard>
        </Grid>

        {/* Enhanced Analytics Section */}
        <Grid item xs={12}>
          <ErrorBoundary fallback={<Alert severity="warning">Unable to load metrics summary</Alert>}>
            <MetricsSummary />
          </ErrorBoundary>
        </Grid>

        {/* Analytics Charts */}
        <Grid item xs={12}>
          <ErrorBoundary fallback={<Alert severity="warning">Unable to load analytics charts</Alert>}>
            <AnalyticsCharts />
          </ErrorBoundary>
        </Grid>

        {/* Leave and Comp Off Policy Display */}
        <Grid item xs={12}>
          <ErrorBoundary fallback={<Alert severity="warning">Unable to load policy display</Alert>}>
            <LeavePolicyDisplay />
          </ErrorBoundary>
        </Grid>

        {/* Booked Leaves Section */}
        <Grid item xs={12} md={6}>
          <ErrorBoundary fallback={<Alert severity="warning">Unable to load booked leaves</Alert>}>
            <BookedLeavesSection />
          </ErrorBoundary>
        </Grid>

        {/* Approved Leaves Status */}
        <Grid item xs={12} md={6}>
          <ErrorBoundary fallback={<Alert severity="warning">Unable to load approved leaves status</Alert>}>
            <ApprovedLeavesStatus />
          </ErrorBoundary>
        </Grid>

        {/* Upcoming Holidays Display */}
        <Grid item xs={12} md={6}>
          <ErrorBoundary fallback={<Alert severity="warning">Unable to load upcoming holidays</Alert>}>
            <UpcomingHolidaysDisplay />
          </ErrorBoundary>
        </Grid>
      </Grid>
    </Box>
    </PageTransition>
  )
}

export default DashboardPage