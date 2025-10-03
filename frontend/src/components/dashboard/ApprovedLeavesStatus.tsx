import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Avatar,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Grid,
  IconButton,
  Tooltip,
  Paper,
  LinearProgress
} from '@mui/material'
import {
  CheckCircle,
  Schedule,
  Cancel,
  Pending,
  Info,
  Refresh,
  TrendingUp,
  Assessment,
  EventNote,
  CalendarToday
} from '@mui/icons-material'
import { format, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import api from '@/config/api'
import { LeaveStatus, LeaveType } from '@/types'

interface LeaveStatusStats {
  approved: number
  pending: number
  rejected: number
  cancelled: number
  total: number
}

interface RecentLeaveRequest {
  id: string
  type: LeaveType
  startDate: string
  endDate: string
  totalDays: number
  status: LeaveStatus
  appliedDate: string
  approvedDate?: string
  rejectedDate?: string
  reason?: string
  comments?: string
}

interface ApprovedLeavesData {
  stats: LeaveStatusStats
  recentRequests: RecentLeaveRequest[]
  approvalRate: number
  averageProcessingDays: number
}

const ApprovedLeavesStatus: React.FC = () => {
  const [leaveStatusData, setLeaveStatusData] = useState<ApprovedLeavesData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaveStatusData()
  }, [])

  const fetchLeaveStatusData = async () => {
    try {
      setLoading(true)
      const response = await api.get('/leaves/status-overview')
      setLeaveStatusData(response.data.data)
    } catch (error) {
      console.error('Error fetching leave status data:', error)
      toast.error('Failed to load leave status information')
    } finally {
      setLoading(false)
    }
  }

  const getLeaveTypeLabel = (type: LeaveType) => {
    const labels: Record<LeaveType, string> = {
      [LeaveType.SICK_LEAVE]: 'Sick Leave',
      [LeaveType.CASUAL_LEAVE]: 'Casual Leave',
      [LeaveType.EARNED_LEAVE]: 'Earned Leave',
      [LeaveType.MATERNITY_LEAVE]: 'Maternity Leave',
      [LeaveType.PATERNITY_LEAVE]: 'Paternity Leave',
      [LeaveType.COMPENSATORY_OFF]: 'Comp Off',
      [LeaveType.BEREAVEMENT_LEAVE]: 'Bereavement',
      [LeaveType.MARRIAGE_LEAVE]: 'Marriage Leave'
    }
    return labels[type] || type.replace('_', ' ')
  }

  const getStatusIcon = (status: LeaveStatus) => {
    switch (status) {
      case LeaveStatus.APPROVED:
        return <CheckCircle color="success" />
      case LeaveStatus.PENDING:
        return <Schedule color="warning" />
      case LeaveStatus.REJECTED:
        return <Cancel color="error" />
      case LeaveStatus.CANCELLED:
        return <EventNote color="disabled" />
      default:
        return <Pending color="info" />
    }
  }

  const getStatusColor = (status: LeaveStatus) => {
    switch (status) {
      case LeaveStatus.APPROVED:
        return 'success' as const
      case LeaveStatus.PENDING:
        return 'warning' as const
      case LeaveStatus.REJECTED:
        return 'error' as const
      case LeaveStatus.CANCELLED:
        return 'default' as const
      default:
        return 'info' as const
    }
  }

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = parseISO(startDate)
    const end = parseISO(endDate)

    if (format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
      return format(start, 'MMM dd, yyyy')
    } else {
      return `${format(start, 'MMM dd')} - ${format(end, 'MMM dd, yyyy')}`
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Assessment color="primary" />
            <Typography variant="h6">Leave Status Overview</Typography>
          </Box>
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    )
  }

  if (!leaveStatusData) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            Failed to load leave status data. Please try refreshing.
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const { stats, recentRequests, approvalRate, averageProcessingDays } = leaveStatusData

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <Assessment color="primary" />
            <Typography variant="h6">Leave Status Overview</Typography>
          </Box>
          <Tooltip title="Refresh Status Data">
            <IconButton onClick={fetchLeaveStatusData} size="small">
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Status Statistics Cards */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
              <Typography variant="h3" fontWeight="bold">
                {stats.approved}
              </Typography>
              <Typography variant="body2">
                Approved
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'warning.contrastText' }}>
              <Typography variant="h3" fontWeight="bold">
                {stats.pending}
              </Typography>
              <Typography variant="body2">
                Pending
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light', color: 'error.contrastText' }}>
              <Typography variant="h3" fontWeight="bold">
                {stats.rejected}
              </Typography>
              <Typography variant="body2">
                Rejected
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'info.contrastText' }}>
              <Typography variant="h3" fontWeight="bold">
                {stats.total}
              </Typography>
              <Typography variant="body2">
                Total
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Performance Metrics */}
        <Box mb={3}>
          <Typography variant="subtitle2" gutterBottom>
            Performance Metrics
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2" color="textSecondary">
                    Approval Rate
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {approvalRate.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={approvalRate}
                  sx={{ height: 8, borderRadius: 4 }}
                  color={approvalRate >= 80 ? 'success' : approvalRate >= 60 ? 'warning' : 'error'}
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box display="flex" alignItems="center" gap={1}>
                <TrendingUp color="info" />
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Avg. Processing Time
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {averageProcessingDays.toFixed(1)} days
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Recent Requests */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Recent Leave Requests
          </Typography>
          {recentRequests.length > 0 ? (
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
              {recentRequests.map((request, index) => (
                <React.Fragment key={request.id}>
                  <ListItem
                    alignItems="flex-start"
                    sx={{
                      px: 0,
                      py: 1.5,
                      '&:hover': {
                        bgcolor: 'action.hover',
                        borderRadius: 1
                      }
                    }}
                  >
                    <ListItemIcon sx={{ mt: 0.5 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {getStatusIcon(request.status)}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <Typography variant="body2" fontWeight="medium">
                            {getLeaveTypeLabel(request.type)}
                          </Typography>
                          <Chip
                            label={request.status}
                            size="small"
                            color={getStatusColor(request.status)}
                            variant="outlined"
                          />
                          <Chip
                            label={`${request.totalDays} ${request.totalDays === 1 ? 'day' : 'days'}`}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="textPrimary" display="block">
                            {formatDateRange(request.startDate, request.endDate)}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" display="block">
                            Applied: {format(parseISO(request.appliedDate), 'MMM dd, yyyy')}
                            {request.approvedDate && ` • Approved: ${format(parseISO(request.approvedDate), 'MMM dd')}`}
                            {request.rejectedDate && ` • Rejected: ${format(parseISO(request.rejectedDate), 'MMM dd')}`}
                          </Typography>
                          {request.comments && (
                            <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 0.5 }}>
                              "{request.comments}"
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <Box>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => {/* Handle view details */}}>
                          <Info fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItem>
                  {index < recentRequests.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box textAlign="center" py={4}>
              <CalendarToday sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No recent leave requests
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Start by applying for your first leave request
              </Typography>
              <Button
                variant="contained"
                href="/leaves"
                startIcon={<EventNote />}
              >
                Apply for Leave
              </Button>
            </Box>
          )}
        </Box>

        {/* Quick Insights */}
        {stats.total > 0 && (
          <Box mt={3} p={2} bgcolor="background.default" borderRadius={1}>
            <Typography variant="caption" color="textSecondary">
              💡 Quick Insights:
            </Typography>
            <Typography variant="caption" display="block" color="textSecondary">
              • {((stats.approved / stats.total) * 100).toFixed(0)}% of your leave requests have been approved
              {stats.pending > 0 && ` • ${stats.pending} request${stats.pending > 1 ? 's' : ''} pending approval`}
              {averageProcessingDays <= 2 && ' • Fast processing time - typically approved within 2 days'}
              {approvalRate >= 90 && ' • Excellent approval rate'}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default ApprovedLeavesStatus