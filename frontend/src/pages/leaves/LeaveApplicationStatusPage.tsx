import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  LinearProgress,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Avatar,
  Timeline,
  TimelineItem,
  TimelineContent,
  TimelineDot,
  TimelineSeparator,
  TimelineConnector,
  TimelineOppositeContent,
  TablePagination,
  InputAdornment
} from '@mui/material'
import {
  Visibility,
  CheckCircle,
  Cancel,
  Schedule,
  FilterList,
  Search,
  Download,
  Edit,
  Delete,
  ExpandMore,
  ExpandLess,
  CalendarMonth,
  Person,
  Comment,
  History,
  Refresh,
  EventNote,
  AccessTime,
  Assignment
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs, { Dayjs } from 'dayjs'
import { format, parseISO, differenceInDays } from 'date-fns'
import toast from 'react-hot-toast'
import api from '@/config/api'
import { LeaveStatus, LeaveType } from '@/types'
import { useAuth } from '@/hooks/useAuth'

interface LeaveApplication {
  id: string
  employeeId: string
  employeeName: string
  employeeEmail: string
  department?: string
  leaveType: LeaveType
  startDate: string
  endDate: string
  totalDays: number
  isHalfDay: boolean
  halfDayPeriod?: 'FIRST_HALF' | 'SECOND_HALF'
  reason: string
  status: LeaveStatus
  appliedDate: string
  approvedBy?: string
  approvedAt?: string
  rejectedAt?: string
  cancelledAt?: string
  comments?: string
  documents?: string[]
  history: ApplicationHistory[]
}

interface ApplicationHistory {
  id: string
  action: string
  performedBy: string
  performedAt: string
  comments?: string
  oldStatus?: LeaveStatus
  newStatus?: LeaveStatus
}

interface FilterOptions {
  status: LeaveStatus | 'ALL'
  leaveType: LeaveType | 'ALL'
  dateRange: {
    start: Dayjs | null
    end: Dayjs | null
  }
  employee: string
  department: string
}

const LeaveApplicationStatusPage: React.FC = () => {
  const { user } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [applications, setApplications] = useState<LeaveApplication[]>([])
  const [filteredApplications, setFilteredApplications] = useState<LeaveApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState<LeaveApplication | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const [filters, setFilters] = useState<FilterOptions>({
    status: 'ALL',
    leaveType: 'ALL',
    dateRange: {
      start: null,
      end: null
    },
    employee: '',
    department: ''
  })

  useEffect(() => {
    fetchApplications()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [applications, filters, searchTerm])

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const response = await api.get('/leaves/all-applications')
      setApplications(response.data.data)
    } catch (error) {
      console.error('Error fetching applications:', error)
      toast.error('Failed to load leave applications')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...applications]

    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(app =>
        app.employeeName.toLowerCase().includes(search) ||
        app.employeeEmail.toLowerCase().includes(search) ||
        app.reason.toLowerCase().includes(search) ||
        app.id.toLowerCase().includes(search)
      )
    }

    // Status filter
    if (filters.status !== 'ALL') {
      filtered = filtered.filter(app => app.status === filters.status)
    }

    // Leave type filter
    if (filters.leaveType !== 'ALL') {
      filtered = filtered.filter(app => app.leaveType === filters.leaveType)
    }

    // Date range filter
    if (filters.dateRange.start && filters.dateRange.end) {
      const startDate = filters.dateRange.start.toDate()
      const endDate = filters.dateRange.end.toDate()
      filtered = filtered.filter(app => {
        const appStart = new Date(app.startDate)
        return appStart >= startDate && appStart <= endDate
      })
    }

    // Employee filter
    if (filters.employee.trim()) {
      filtered = filtered.filter(app =>
        app.employeeName.toLowerCase().includes(filters.employee.toLowerCase())
      )
    }

    // Department filter
    if (filters.department.trim()) {
      filtered = filtered.filter(app =>
        app.department?.toLowerCase().includes(filters.department.toLowerCase())
      )
    }

    setFilteredApplications(filtered)
    setPage(0) // Reset to first page when filters change
  }

  const handleViewDetails = (application: LeaveApplication) => {
    setSelectedApplication(application)
    setDetailsDialogOpen(true)
  }

  const handleUpdateStatus = async (applicationId: string, newStatus: LeaveStatus, comments?: string) => {
    try {
      await api.patch(`/leaves/${applicationId}/status`, {
        status: newStatus,
        comments
      })
      toast.success(`Application ${newStatus.toLowerCase()} successfully`)
      fetchApplications()
      setDetailsDialogOpen(false)
    } catch (error: any) {
      console.error('Error updating status:', error)
      toast.error(error.response?.data?.message || 'Failed to update application status')
    }
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
        return <Schedule color="info" />
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

  const getDaysFromNow = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const days = differenceInDays(date, now)

    if (days === 0) return 'Today'
    if (days === 1) return 'Tomorrow'
    if (days === -1) return 'Yesterday'
    if (days > 0) return `In ${days} days`
    return `${Math.abs(days)} days ago`
  }

  const clearFilters = () => {
    setFilters({
      status: 'ALL',
      leaveType: 'ALL',
      dateRange: { start: null, end: null },
      employee: '',
      department: ''
    })
    setSearchTerm('')
  }

  const exportToCSV = () => {
    const headers = [
      'Application ID',
      'Employee Name',
      'Leave Type',
      'Start Date',
      'End Date',
      'Total Days',
      'Status',
      'Applied Date',
      'Reason'
    ]

    const csvData = filteredApplications.map(app => [
      app.id,
      app.employeeName,
      getLeaveTypeLabel(app.leaveType),
      format(parseISO(app.startDate), 'yyyy-MM-dd'),
      format(parseISO(app.endDate), 'yyyy-MM-dd'),
      app.totalDays,
      app.status,
      format(parseISO(app.appliedDate), 'yyyy-MM-dd'),
      app.reason
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `leave_applications_${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Statistics
  const stats = {
    total: applications.length,
    pending: applications.filter(app => app.status === LeaveStatus.PENDING).length,
    approved: applications.filter(app => app.status === LeaveStatus.APPROVED).length,
    rejected: applications.filter(app => app.status === LeaveStatus.REJECTED).length
  }

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Leave Application Status
        </Typography>
        <LinearProgress />
      </Box>
    )
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Leave Application Status
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Track and manage all leave applications in the system
            </Typography>
          </Box>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={exportToCSV}
              disabled={filteredApplications.length === 0}
            >
              Export CSV
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchApplications}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Assignment color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.total}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Applications
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Schedule color="warning" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.pending}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Pending Review
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <CheckCircle color="success" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.approved}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Approved
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Cancel color="error" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.rejected}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Rejected
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search and Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" gap={2} alignItems="center" mb={2}>
              <TextField
                fullWidth
                placeholder="Search by employee name, email, reason, or application ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  )
                }}
              />
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                endIcon={filtersOpen ? <ExpandLess /> : <ExpandMore />}
                onClick={() => setFiltersOpen(!filtersOpen)}
              >
                Filters
              </Button>
            </Box>

            <Collapse in={filtersOpen}>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filters.status}
                      label="Status"
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as LeaveStatus | 'ALL' }))}
                    >
                      <MenuItem value="ALL">All Statuses</MenuItem>
                      <MenuItem value={LeaveStatus.PENDING}>Pending</MenuItem>
                      <MenuItem value={LeaveStatus.APPROVED}>Approved</MenuItem>
                      <MenuItem value={LeaveStatus.REJECTED}>Rejected</MenuItem>
                      <MenuItem value={LeaveStatus.CANCELLED}>Cancelled</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Leave Type</InputLabel>
                    <Select
                      value={filters.leaveType}
                      label="Leave Type"
                      onChange={(e) => setFilters(prev => ({ ...prev, leaveType: e.target.value as LeaveType | 'ALL' }))}
                    >
                      <MenuItem value="ALL">All Types</MenuItem>
                      {Object.values(LeaveType).map(type => (
                        <MenuItem key={type} value={type}>
                          {getLeaveTypeLabel(type)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={3}>
                  <DatePicker
                    label="Start Date"
                    value={filters.dateRange.start}
                    onChange={(date) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: date }
                    }))}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <DatePicker
                    label="End Date"
                    value={filters.dateRange.end}
                    onChange={(date) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: date }
                    }))}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Employee Name"
                    value={filters.employee}
                    onChange={(e) => setFilters(prev => ({ ...prev, employee: e.target.value }))}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Department"
                    value={filters.department}
                    onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box display="flex" gap={2}>
                    <Button onClick={clearFilters}>
                      Clear All Filters
                    </Button>
                    <Typography variant="body2" color="textSecondary" sx={{ alignSelf: 'center' }}>
                      Showing {filteredApplications.length} of {applications.length} applications
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Collapse>
          </CardContent>
        </Card>

        {/* Applications Table */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Leave Applications
            </Typography>

            {filteredApplications.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Assignment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  No applications found
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {applications.length === 0
                    ? 'No leave applications have been submitted yet'
                    : 'Try adjusting your search criteria or filters'
                  }
                </Typography>
              </Box>
            ) : (
              <>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Employee</TableCell>
                        <TableCell>Leave Type</TableCell>
                        <TableCell>Period</TableCell>
                        <TableCell>Days</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Applied</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredApplications
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((application) => (
                          <TableRow key={application.id} hover>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={2}>
                                <Avatar sx={{ width: 32, height: 32 }}>
                                  {application.employeeName.charAt(0).toUpperCase()}
                                </Avatar>
                                <Box>
                                  <Typography variant="subtitle2">
                                    {application.employeeName}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    {application.employeeEmail}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={getLeaveTypeLabel(application.leaveType)}
                                variant="outlined"
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {format(parseISO(application.startDate), 'MMM dd')} - {format(parseISO(application.endDate), 'MMM dd, yyyy')}
                              </Typography>
                              {application.isHalfDay && (
                                <Typography variant="caption" color="textSecondary" display="block">
                                  Half Day ({application.halfDayPeriod?.replace('_', ' ')})
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {application.totalDays} {application.totalDays === 1 ? 'day' : 'days'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                icon={getStatusIcon(application.status)}
                                label={application.status}
                                color={getStatusColor(application.status)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {format(parseISO(application.appliedDate), 'MMM dd, yyyy')}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {getDaysFromNow(application.appliedDate)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Tooltip title="View Details">
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewDetails(application)}
                                >
                                  <Visibility fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TablePagination
                  component="div"
                  count={filteredApplications.length}
                  page={page}
                  onPageChange={(_, newPage) => setPage(newPage)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10))
                    setPage(0)
                  }}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Application Details Dialog */}
        <Dialog
          open={detailsDialogOpen}
          onClose={() => setDetailsDialogOpen(false)}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={2}>
              <Assignment />
              <Box>
                <Typography variant="h6">
                  Leave Application Details
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  ID: {selectedApplication?.id}
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedApplication && (
              <Grid container spacing={3}>
                {/* Employee Information */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Employee Information
                  </Typography>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Avatar sx={{ width: 48, height: 48 }}>
                      {selectedApplication.employeeName.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1">
                        {selectedApplication.employeeName}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {selectedApplication.employeeEmail}
                      </Typography>
                      {selectedApplication.department && (
                        <Typography variant="caption" color="textSecondary">
                          {selectedApplication.department}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Grid>

                {/* Leave Details */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Leave Details
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <CalendarMonth />
                      </ListItemIcon>
                      <ListItemText
                        primary="Leave Type"
                        secondary={getLeaveTypeLabel(selectedApplication.leaveType)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <AccessTime />
                      </ListItemIcon>
                      <ListItemText
                        primary="Duration"
                        secondary={`${selectedApplication.totalDays} ${selectedApplication.totalDays === 1 ? 'day' : 'days'}`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Schedule />
                      </ListItemIcon>
                      <ListItemText
                        primary="Period"
                        secondary={`${format(parseISO(selectedApplication.startDate), 'MMM dd, yyyy')} - ${format(parseISO(selectedApplication.endDate), 'MMM dd, yyyy')}`}
                      />
                    </ListItem>
                  </List>
                </Grid>

                {/* Status & Approval */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Status & Approval
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        {getStatusIcon(selectedApplication.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary="Current Status"
                        secondary={selectedApplication.status}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <EventNote />
                      </ListItemIcon>
                      <ListItemText
                        primary="Applied Date"
                        secondary={format(parseISO(selectedApplication.appliedDate), 'MMM dd, yyyy')}
                      />
                    </ListItem>
                    {selectedApplication.approvedBy && (
                      <ListItem>
                        <ListItemIcon>
                          <Person />
                        </ListItemIcon>
                        <ListItemText
                          primary="Approved By"
                          secondary={selectedApplication.approvedBy}
                        />
                      </ListItem>
                    )}
                  </List>
                </Grid>

                {/* Reason */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Reason for Leave
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Typography variant="body2">
                      {selectedApplication.reason}
                    </Typography>
                  </Paper>
                </Grid>

                {/* Comments */}
                {selectedApplication.comments && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Comments
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                      <Typography variant="body2">
                        {selectedApplication.comments}
                      </Typography>
                    </Paper>
                  </Grid>
                )}

                {/* Application History */}
                {selectedApplication.history.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Application History
                    </Typography>
                    <Timeline position="left">
                      {selectedApplication.history.map((entry, index) => (
                        <TimelineItem key={entry.id}>
                          <TimelineOppositeContent color="textSecondary" variant="caption">
                            {format(parseISO(entry.performedAt), 'MMM dd, yyyy HH:mm')}
                          </TimelineOppositeContent>
                          <TimelineSeparator>
                            <TimelineDot color={
                              entry.newStatus === LeaveStatus.APPROVED ? 'success' :
                              entry.newStatus === LeaveStatus.REJECTED ? 'error' :
                              entry.newStatus === LeaveStatus.PENDING ? 'warning' : 'primary'
                            }>
                              {entry.newStatus === LeaveStatus.APPROVED ? <CheckCircle fontSize="small" /> :
                               entry.newStatus === LeaveStatus.REJECTED ? <Cancel fontSize="small" /> :
                               entry.newStatus === LeaveStatus.PENDING ? <Schedule fontSize="small" /> :
                               <History fontSize="small" />}
                            </TimelineDot>
                            {index < selectedApplication.history.length - 1 && <TimelineConnector />}
                          </TimelineSeparator>
                          <TimelineContent>
                            <Typography variant="body2" fontWeight="medium">
                              {entry.action}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              by {entry.performedBy}
                            </Typography>
                            {entry.comments && (
                              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                "{entry.comments}"
                              </Typography>
                            )}
                          </TimelineContent>
                        </TimelineItem>
                      ))}
                    </Timeline>
                  </Grid>
                )}
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailsDialogOpen(false)}>
              Close
            </Button>
            {selectedApplication?.status === LeaveStatus.PENDING && user?.role === 'MANAGER' && (
              <>
                <Button
                  color="error"
                  onClick={() => handleUpdateStatus(selectedApplication.id, LeaveStatus.REJECTED)}
                >
                  Reject
                </Button>
                <Button
                  color="success"
                  variant="contained"
                  onClick={() => handleUpdateStatus(selectedApplication.id, LeaveStatus.APPROVED)}
                >
                  Approve
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  )
}

export default LeaveApplicationStatusPage