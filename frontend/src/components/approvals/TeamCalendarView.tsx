import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  Tooltip,
  IconButton,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Paper,
  useTheme,
  useMediaQuery
} from '@mui/material'
import {
  CalendarMonth,
  ChevronLeft,
  ChevronRight,
  Visibility,
  People,
  Event,
  Schedule,
  CheckCircle,
  Cancel,
  Today,
  FilterList
} from '@mui/icons-material'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addMonths, subMonths, isSameMonth, isToday, isWeekend } from 'date-fns'
import toast from 'react-hot-toast'
import api from '@/config/api'
import { LeaveStatus, LeaveType } from '@/types'

interface TeamMember {
  id: string
  name: string
  email: string
  department?: string
  role?: string
  avatar?: string
}

interface TeamLeave {
  id: string
  employeeId: string
  employeeName: string
  employeeAvatar?: string
  department?: string
  leaveType: LeaveType
  startDate: string
  endDate: string
  totalDays: number
  isHalfDay: boolean
  halfDayPeriod?: 'FIRST_HALF' | 'SECOND_HALF'
  status: LeaveStatus
  reason?: string
  appliedDate: string
}

interface CalendarDay {
  date: Date
  leaves: TeamLeave[]
  isCurrentMonth: boolean
  isToday: boolean
  isWeekend: boolean
}

const TeamCalendarView: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [currentDate, setCurrentDate] = useState(new Date())
  const [teamLeaves, setTeamLeaves] = useState<TeamLeave[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [dateDetailsOpen, setDateDetailsOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<LeaveStatus | 'ALL'>('ALL')
  const [filterDepartment, setFilterDepartment] = useState<string>('ALL')

  useEffect(() => {
    fetchTeamCalendarData()
  }, [currentDate])

  const fetchTeamCalendarData = async () => {
    try {
      setLoading(true)
      const startDate = startOfMonth(currentDate)
      const endDate = endOfMonth(currentDate)

      const [leavesResponse, membersResponse] = await Promise.all([
        api.get('/leaves/team-calendar', {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          }
        }),
        api.get('/users/team-members')
      ])

      setTeamLeaves(leavesResponse.data.data)
      setTeamMembers(membersResponse.data.data)
    } catch (error) {
      console.error('Error fetching team calendar data:', error)
      toast.error('Failed to load team calendar')
    } finally {
      setLoading(false)
    }
  }

  const getLeaveTypeLabel = (type: LeaveType) => {
    const labels: Record<LeaveType, string> = {
      [LeaveType.SICK_LEAVE]: 'Sick',
      [LeaveType.CASUAL_LEAVE]: 'Casual',
      [LeaveType.EARNED_LEAVE]: 'Earned',
      [LeaveType.MATERNITY_LEAVE]: 'Maternity',
      [LeaveType.PATERNITY_LEAVE]: 'Paternity',
      [LeaveType.COMPENSATORY_OFF]: 'Comp Off',
      [LeaveType.BEREAVEMENT_LEAVE]: 'Bereavement',
      [LeaveType.MARRIAGE_LEAVE]: 'Marriage'
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

  const getStatusColor = (status: LeaveStatus) => {
    switch (status) {
      case LeaveStatus.APPROVED:
        return 'success' as const
      case LeaveStatus.PENDING:
        return 'warning' as const
      case LeaveStatus.REJECTED:
        return 'error' as const
      default:
        return 'default' as const
    }
  }

  const isLeaveOnDate = (leave: TeamLeave, date: Date) => {
    const startDate = parseISO(leave.startDate)
    const endDate = parseISO(leave.endDate)
    return date >= startDate && date <= endDate
  }

  const getLeavesForDate = (date: Date) => {
    return teamLeaves.filter(leave => {
      if (filterStatus !== 'ALL' && leave.status !== filterStatus) return false
      if (filterDepartment !== 'ALL' && leave.department !== filterDepartment) return false
      return isLeaveOnDate(leave, date)
    })
  }

  const generateCalendarDays = (): CalendarDay[] => {
    const startDate = startOfMonth(currentDate)
    const endDate = endOfMonth(currentDate)
    const days = eachDayOfInterval({ start: startDate, end: endDate })

    return days.map(date => ({
      date,
      leaves: getLeavesForDate(date),
      isCurrentMonth: isSameMonth(date, currentDate),
      isToday: isToday(date),
      isWeekend: isWeekend(date)
    }))
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setDateDetailsOpen(true)
  }

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const calendarDays = generateCalendarDays()
  const selectedDateLeaves = selectedDate ? getLeavesForDate(selectedDate) : []

  // Get unique departments for filter
  const departments = Array.from(new Set(teamMembers.map(m => m.department).filter(Boolean)))

  // Statistics for the current month
  const monthStats = {
    totalLeaves: teamLeaves.filter(leave => filterStatus === 'ALL' || leave.status === filterStatus).length,
    approvedLeaves: teamLeaves.filter(leave => leave.status === LeaveStatus.APPROVED).length,
    pendingLeaves: teamLeaves.filter(leave => leave.status === LeaveStatus.PENDING).length,
    teamMembersOnLeave: new Set(teamLeaves.filter(leave =>
      leave.status === LeaveStatus.APPROVED &&
      isLeaveOnDate(leave, new Date())
    ).map(leave => leave.employeeId)).size
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" display="flex" alignItems="center" gap={1}>
          <CalendarMonth />
          Team Leave Calendar
        </Typography>
        <Box display="flex" gap={1} alignItems="center">
          <Button size="small" onClick={handleToday} startIcon={<Today />}>
            Today
          </Button>
          <IconButton onClick={handlePrevMonth}>
            <ChevronLeft />
          </IconButton>
          <Typography variant="subtitle1" sx={{ minWidth: 120, textAlign: 'center' }}>
            {format(currentDate, 'MMMM yyyy')}
          </Typography>
          <IconButton onClick={handleNextMonth}>
            <ChevronRight />
          </IconButton>
        </Box>
      </Box>

      {/* Filters and Stats */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ py: 2 }}>
              <Box display="flex" gap={2}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    label="Status"
                    onChange={(e) => setFilterStatus(e.target.value as LeaveStatus | 'ALL')}
                  >
                    <MenuItem value="ALL">All</MenuItem>
                    <MenuItem value={LeaveStatus.APPROVED}>Approved</MenuItem>
                    <MenuItem value={LeaveStatus.PENDING}>Pending</MenuItem>
                    <MenuItem value={LeaveStatus.REJECTED}>Rejected</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={filterDepartment}
                    label="Department"
                    onChange={(e) => setFilterDepartment(e.target.value)}
                  >
                    <MenuItem value="ALL">All</MenuItem>
                    {departments.map(dept => (
                      <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ py: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={3}>
                  <Box textAlign="center">
                    <Typography variant="h6" color="primary">
                      {monthStats.totalLeaves}
                    </Typography>
                    <Typography variant="caption">Total</Typography>
                  </Box>
                </Grid>
                <Grid item xs={3}>
                  <Box textAlign="center">
                    <Typography variant="h6" color="success.main">
                      {monthStats.approvedLeaves}
                    </Typography>
                    <Typography variant="caption">Approved</Typography>
                  </Box>
                </Grid>
                <Grid item xs={3}>
                  <Box textAlign="center">
                    <Typography variant="h6" color="warning.main">
                      {monthStats.pendingLeaves}
                    </Typography>
                    <Typography variant="caption">Pending</Typography>
                  </Box>
                </Grid>
                <Grid item xs={3}>
                  <Box textAlign="center">
                    <Typography variant="h6" color="info.main">
                      {monthStats.teamMembersOnLeave}
                    </Typography>
                    <Typography variant="caption">On Leave</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Calendar Grid */}
      <Card>
        <CardContent>
          {/* Calendar Header */}
          <Grid container sx={{ mb: 1 }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <Grid item xs key={day} sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle2" color="textSecondary" sx={{ py: 1 }}>
                  {day}
                </Typography>
              </Grid>
            ))}
          </Grid>

          {/* Calendar Days */}
          <Grid container spacing={0.5}>
            {calendarDays.map((day, index) => (
              <Grid item xs key={index} sx={{ aspectRatio: '1', minHeight: 100 }}>
                <Paper
                  sx={{
                    height: '100%',
                    p: 0.5,
                    cursor: 'pointer',
                    border: day.isToday ? 2 : 1,
                    borderColor: day.isToday ? 'primary.main' : 'divider',
                    bgcolor: day.isWeekend ? 'action.hover' : 'background.paper',
                    '&:hover': {
                      bgcolor: 'action.selected'
                    }
                  }}
                  onClick={() => handleDateClick(day.date)}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography
                      variant="caption"
                      fontWeight={day.isToday ? 'bold' : 'normal'}
                      color={day.isToday ? 'primary' : 'textPrimary'}
                    >
                      {format(day.date, 'd')}
                    </Typography>
                    {day.leaves.length > 0 && (
                      <Chip
                        label={day.leaves.length}
                        size="small"
                        color="primary"
                        sx={{ height: 16, fontSize: '0.6rem' }}
                      />
                    )}
                  </Box>

                  {/* Leave indicators */}
                  <Box>
                    {day.leaves.slice(0, 3).map((leave, leaveIndex) => (
                      <Tooltip
                        key={`${leave.id}-${leaveIndex}`}
                        title={`${leave.employeeName} - ${getLeaveTypeLabel(leave.leaveType)}`}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            mb: 0.25,
                            p: 0.25,
                            borderRadius: 0.5,
                            bgcolor: `${getLeaveTypeColor(leave.leaveType)}20`,
                            border: `1px solid ${getLeaveTypeColor(leave.leaveType)}40`
                          }}
                        >
                          <Avatar
                            sx={{
                              width: 12,
                              height: 12,
                              fontSize: '0.5rem',
                              bgcolor: getLeaveTypeColor(leave.leaveType)
                            }}
                          >
                            {leave.employeeName.charAt(0)}
                          </Avatar>
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: '0.5rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1
                            }}
                          >
                            {getLeaveTypeLabel(leave.leaveType)}
                          </Typography>
                        </Box>
                      </Tooltip>
                    ))}
                    {day.leaves.length > 3 && (
                      <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.5rem' }}>
                        +{day.leaves.length - 3} more
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Date Details Dialog */}
      <Dialog
        open={dateDetailsOpen}
        onClose={() => setDateDetailsOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Event />
            <Box>
              <Typography variant="h6">
                {selectedDate && format(selectedDate, 'EEEE, MMMM dd, yyyy')}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {selectedDateLeaves.length} leave{selectedDateLeaves.length !== 1 ? 's' : ''} on this date
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedDateLeaves.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Schedule sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="textSecondary">
                No leaves scheduled for this date
              </Typography>
            </Box>
          ) : (
            <List>
              {selectedDateLeaves.map((leave, index) => (
                <React.Fragment key={leave.id}>
                  <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: getLeaveTypeColor(leave.leaveType) }}>
                        {leave.employeeName.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <Typography variant="subtitle2">
                            {leave.employeeName}
                          </Typography>
                          <Chip
                            label={getLeaveTypeLabel(leave.leaveType)}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={leave.status}
                            size="small"
                            color={getStatusColor(leave.status)}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textPrimary">
                            {format(parseISO(leave.startDate), 'MMM dd')} - {format(parseISO(leave.endDate), 'MMM dd, yyyy')}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {leave.totalDays} {leave.totalDays === 1 ? 'day' : 'days'}
                            {leave.isHalfDay && ` (${leave.halfDayPeriod?.replace('_', ' ')})`}
                          </Typography>
                          {leave.department && (
                            <Typography variant="caption" color="textSecondary">
                              {leave.department}
                            </Typography>
                          )}
                          {leave.reason && (
                            <Typography variant="caption" display="block" color="textSecondary" sx={{ mt: 0.5 }}>
                              Reason: {leave.reason}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <Tooltip title="View Details">
                      <IconButton size="small">
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </ListItem>
                  {index < selectedDateLeaves.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDateDetailsOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default TeamCalendarView