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
  Paper
} from '@mui/material'
import {
  EventAvailable,
  CalendarMonth,
  Schedule,
  Cancel,
  Refresh,
  Edit,
  Info,
  CheckCircle,
  Today,
  Upcoming
} from '@mui/icons-material'
import { format, parseISO, isAfter, isBefore, isToday, addDays, startOfDay } from 'date-fns'
import toast from 'react-hot-toast'
import api from '@/config/api'
import { LeaveStatus, LeaveType } from '@/types'

interface BookedLeave {
  id: string
  type: LeaveType
  startDate: string
  endDate: string
  totalDays: number
  status: LeaveStatus
  appliedDate: string
  approvedDate?: string
  reason?: string
  isHalfDay?: boolean
  halfDayPeriod?: 'FIRST_HALF' | 'SECOND_HALF'
}

interface BookedLeavesData {
  upcoming: BookedLeave[]
  current: BookedLeave[]
  thisMonth: BookedLeave[]
  summary: {
    totalBookedDays: number
    upcomingDays: number
    currentCount: number
  }
}

const BookedLeavesSection: React.FC = () => {
  const [bookedLeaves, setBookedLeaves] = useState<BookedLeavesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'upcoming' | 'current' | 'thisMonth'>('upcoming')

  useEffect(() => {
    fetchBookedLeaves()
  }, [])

  const fetchBookedLeaves = async () => {
    try {
      setLoading(true)
      const response = await api.get('/leaves/booked-leaves')
      setBookedLeaves(response.data.data)
    } catch (error) {
      console.error('Error fetching booked leaves:', error)
      toast.error('Failed to load booked leaves')
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

  const getLeaveTypeColor = (type: LeaveType) => {
    const colors: Record<LeaveType, string> = {
      [LeaveType.SICK_LEAVE]: '#f44336',
      [LeaveType.CASUAL_LEAVE]: '#2196f3',
      [LeaveType.EARNED_LEAVE]: '#4caf50',
      [LeaveType.MATERNITY_LEAVE]: '#e91e63',
      [LeaveType.PATERNITY_LEAVE]: '#9c27b0',
      [LeaveType.COMPENSATORY_OFF]: '#ff9800',
      [LeaveType.BEREAVEMENT_LEAVE]: '#795548',
      [LeaveType.MARRIAGE_LEAVE]: '#ff5722'
    }
    return colors[type] || '#757575'
  }

  const formatDateRange = (startDate: string, endDate: string, isHalfDay?: boolean, halfDayPeriod?: string) => {
    const start = parseISO(startDate)
    const end = parseISO(endDate)

    if (format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
      // Same day
      let dateStr = format(start, 'MMM dd, yyyy')
      if (isHalfDay) {
        dateStr += ` (${halfDayPeriod === 'FIRST_HALF' ? '1st Half' : '2nd Half'})`
      }
      return dateStr
    } else {
      // Date range
      return `${format(start, 'MMM dd')} - ${format(end, 'MMM dd, yyyy')}`
    }
  }

  const getLeaveStatus = (leave: BookedLeave) => {
    const today = startOfDay(new Date())
    const startDate = startOfDay(parseISO(leave.startDate))
    const endDate = startOfDay(parseISO(leave.endDate))

    if (isBefore(endDate, today)) {
      return { status: 'completed', label: 'Completed', color: 'success' as const }
    } else if (isToday(startDate) || (isAfter(today, startDate) && isBefore(today, addDays(endDate, 1)))) {
      return { status: 'active', label: 'Active', color: 'warning' as const }
    } else if (isAfter(startDate, today)) {
      return { status: 'upcoming', label: 'Upcoming', color: 'info' as const }
    } else {
      return { status: 'unknown', label: 'Unknown', color: 'default' as const }
    }
  }

  const renderLeaveItem = (leave: BookedLeave, index: number) => {
    const leaveStatus = getLeaveStatus(leave)

    return (
      <React.Fragment key={leave.id}>
        <ListItem
          alignItems="flex-start"
          sx={{
            px: 0,
            py: 2,
            '&:hover': {
              bgcolor: 'action.hover',
              borderRadius: 1
            }
          }}
        >
          <ListItemIcon sx={{ mt: 1 }}>
            <Avatar
              sx={{
                bgcolor: getLeaveTypeColor(leave.type),
                width: 40,
                height: 40
              }}
            >
              <EventAvailable fontSize="small" />
            </Avatar>
          </ListItemIcon>
          <ListItemText
            primary={
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <Typography variant="subtitle2" fontWeight="medium">
                  {getLeaveTypeLabel(leave.type)}
                </Typography>
                <Chip
                  label={leaveStatus.label}
                  size="small"
                  color={leaveStatus.color}
                  variant="outlined"
                />
                <Chip
                  label={`${leave.totalDays} ${leave.totalDays === 1 ? 'day' : 'days'}`}
                  size="small"
                  variant="outlined"
                />
              </Box>
            }
            secondary={
              <Box>
                <Typography variant="body2" color="textPrimary" gutterBottom>
                  {formatDateRange(leave.startDate, leave.endDate, leave.isHalfDay, leave.halfDayPeriod)}
                </Typography>
                {leave.reason && (
                  <Typography variant="caption" color="textSecondary" display="block">
                    {leave.reason.length > 80 ? `${leave.reason.substring(0, 80)}...` : leave.reason}
                  </Typography>
                )}
                <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 0.5 }}>
                  Applied: {format(parseISO(leave.appliedDate), 'MMM dd, yyyy')}
                  {leave.approvedDate && ` • Approved: ${format(parseISO(leave.approvedDate), 'MMM dd, yyyy')}`}
                </Typography>
              </Box>
            }
          />
          <Box display="flex" flexDirection="column" gap={1}>
            <Tooltip title="View Details">
              <IconButton size="small" onClick={() => {/* Handle view details */}}>
                <Info fontSize="small" />
              </IconButton>
            </Tooltip>
            {leaveStatus.status === 'upcoming' && (
              <Tooltip title="Edit Leave">
                <IconButton size="small" onClick={() => {/* Handle edit */}}>
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </ListItem>
        {index < (bookedLeaves?.[activeTab]?.length || 0) - 1 && <Divider />}
      </React.Fragment>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <EventAvailable color="primary" />
            <Typography variant="h6">Booked Leaves</Typography>
          </Box>
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    )
  }

  if (!bookedLeaves) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            Failed to load booked leaves. Please try refreshing.
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const currentData = bookedLeaves[activeTab] || []

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <EventAvailable color="primary" />
            <Typography variant="h6">Booked Leaves</Typography>
          </Box>
          <Tooltip title="Refresh Booked Leaves">
            <IconButton onClick={fetchBookedLeaves} size="small">
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'info.contrastText' }}>
              <Typography variant="h4" fontWeight="bold">
                {bookedLeaves.summary.upcomingDays}
              </Typography>
              <Typography variant="body2">
                Upcoming Days
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'warning.contrastText' }}>
              <Typography variant="h4" fontWeight="bold">
                {bookedLeaves.summary.currentCount}
              </Typography>
              <Typography variant="body2">
                Active Leaves
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
              <Typography variant="h4" fontWeight="bold">
                {bookedLeaves.summary.totalBookedDays}
              </Typography>
              <Typography variant="body2">
                Total Booked
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Tab Navigation */}
        <Box display="flex" gap={1} mb={3}>
          <Button
            variant={activeTab === 'upcoming' ? 'contained' : 'outlined'}
            size="small"
            startIcon={<Upcoming />}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming ({bookedLeaves.upcoming.length})
          </Button>
          <Button
            variant={activeTab === 'current' ? 'contained' : 'outlined'}
            size="small"
            startIcon={<Today />}
            onClick={() => setActiveTab('current')}
          >
            Current ({bookedLeaves.current.length})
          </Button>
          <Button
            variant={activeTab === 'thisMonth' ? 'contained' : 'outlined'}
            size="small"
            startIcon={<CalendarMonth />}
            onClick={() => setActiveTab('thisMonth')}
          >
            This Month ({bookedLeaves.thisMonth.length})
          </Button>
        </Box>

        {/* Leave List */}
        {currentData.length > 0 ? (
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {currentData.map((leave, index) => renderLeaveItem(leave, index))}
          </List>
        ) : (
          <Box textAlign="center" py={4}>
            <EventAvailable sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No {activeTab} leaves
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {activeTab === 'upcoming' && 'You have no upcoming approved leaves'}
              {activeTab === 'current' && 'You are not currently on leave'}
              {activeTab === 'thisMonth' && 'No leaves booked for this month'}
            </Typography>
            {activeTab === 'upcoming' && (
              <Button
                variant="contained"
                href="/leaves"
                sx={{ mt: 2 }}
                startIcon={<EventAvailable />}
              >
                Apply for Leave
              </Button>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default BookedLeavesSection