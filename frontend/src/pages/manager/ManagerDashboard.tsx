import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  Badge,
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
  Avatar,
  IconButton,
  Tooltip,
  Alert,
  LinearProgress,
  Divider,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  CheckCircle,
  Cancel,
  Visibility,
  Schedule,
  People,
  TrendingUp,
  Assessment,
  CalendarToday,
  Warning,
  NotificationImportant,
  FilterList,
  Download,
  Refresh,
  PersonAdd,
  BusinessCenter,
  DateRange,
  Timeline,
  BarChart
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import toast from 'react-hot-toast';

import api from '@/config/api';
import { LeaveType, LeaveStatus } from '@/types';
import { useAuth } from '@/hooks/useAuth';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`manager-tabpanel-${index}`}
      aria-labelledby={`manager-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface LeaveRequest {
  id: string;
  employeeName: string;
  employeeId: string;
  employeeAvatar?: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  submittedAt: string;
  urgency?: 'low' | 'medium' | 'high' | 'urgent';
  isHalfDay?: boolean;
  emergencyContact?: string;
  delegatedTo?: string;
  previousApprovals?: Array<{
    approver: string;
    action: string;
    date: string;
    comments?: string;
  }>;
}

interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  department: string;
  currentBalance?: {
    annual: number;
    sick: number;
    personal: number;
  };
  pendingRequests: number;
  onLeave: boolean;
  leaveEndDate?: string;
}

interface ManagerStats {
  totalTeamMembers: number;
  pendingApprovals: number;
  approvedThisMonth: number;
  rejectedThisMonth: number;
  teamOnLeave: number;
  upcomingLeaves: number;
  overdueApprovals: number;
}

const ManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState<ManagerStats>({
    totalTeamMembers: 0,
    pendingApprovals: 0,
    approvedThisMonth: 0,
    rejectedThisMonth: 0,
    teamOnLeave: 0,
    upcomingLeaves: 0,
    overdueApprovals: 0
  });

  // Dialog states
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [approvalComments, setApprovalComments] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<LeaveType | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<Dayjs | null>(null);
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'high' | 'urgent'>('all');

  useEffect(() => {
    fetchManagerData();
  }, []);

  const fetchManagerData = async () => {
    setLoading(true);
    try {
      // Fetch pending approvals
      const [requestsRes, teamRes, statsRes] = await Promise.all([
        api.get('/leaves?manager=true&status=pending'),
        api.get('/users/team'),
        api.get('/reports/manager-stats')
      ]);

      setRequests(Array.isArray(requestsRes.data.data) ? requestsRes.data.data : []);
      setTeamMembers(Array.isArray(teamRes.data.data) ? teamRes.data.data : []);
      setStats(statsRes.data.data || stats);
    } catch (error) {
      console.error('Failed to fetch manager data:', error);
      toast.error('Failed to load manager dashboard data');
      // Ensure we set empty arrays on error
      setRequests([]);
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalAction = async () => {
    if (!selectedRequest) return;

    setActionLoading(true);
    try {
      await api.post(`/leaves/${selectedRequest.id}/approve`, {
        action: approvalAction.toUpperCase(),
        comments: approvalComments
      });

      toast.success(`Leave request ${approvalAction}d successfully`);
      setApprovalDialog(false);
      setApprovalComments('');
      setSelectedRequest(null);
      fetchManagerData();
    } catch (error) {
      console.error(`Failed to ${approvalAction} request:`, error);
      toast.error(`Failed to ${approvalAction} leave request`);
    } finally {
      setActionLoading(false);
    }
  };

  const openApprovalDialog = (request: LeaveRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setApprovalAction(action);
    setApprovalDialog(true);
  };

  const getStatusColor = (status: LeaveStatus) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      case 'CANCELLED': return 'default';
      default: return 'default';
    }
  };

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      default: return 'default';
    }
  };

  const getDaysUntilStart = (startDate: string) => {
    return dayjs(startDate).diff(dayjs(), 'day');
  };

  const filteredRequests = (Array.isArray(requests) ? requests : []).filter(request => {
    if (statusFilter !== 'all' && request.status !== statusFilter) return false;
    if (typeFilter !== 'all' && request.leaveType !== typeFilter) return false;
    if (urgencyFilter !== 'all' && request.urgency !== urgencyFilter) return false;
    if (dateFilter && !dayjs(request.startDate).isSame(dateFilter, 'month')) return false;
    return true;
  });

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const urgentRequests = pendingRequests.filter(r => r.urgency === 'urgent' || getDaysUntilStart(r.startDate) <= 1);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" fontWeight="bold">
            Manager Dashboard
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchManagerData}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => {/* Export functionality */}}
            >
              Export
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <NotificationImportant />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{stats.pendingApprovals}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending Approvals
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                    <Warning />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{urgentRequests.length}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Urgent Requests
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <People />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{stats.teamOnLeave}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Team on Leave
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'info.main' }}>
                    <CalendarToday />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{stats.upcomingLeaves}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Upcoming Leaves
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Urgent Alerts */}
        {urgentRequests.length > 0 && (
          <Alert
            severity="warning"
            sx={{ mb: 3 }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => setCurrentTab(0)}
              >
                VIEW
              </Button>
            }
          >
            You have {urgentRequests.length} urgent leave request(s) requiring immediate attention!
          </Alert>
        )}

        {/* Tabs */}
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
              <Tab
                label={
                  <Badge badgeContent={pendingRequests.length} color="error">
                    Pending Approvals
                  </Badge>
                }
              />
              <Tab label="All Requests" />
              <Tab label="Team Overview" />
              <Tab label="Analytics" />
            </Tabs>
          </Box>

          {/* Pending Approvals Tab */}
          <TabPanel value={currentTab} index={0}>
            {loading && <LinearProgress />}

            {/* Quick Action Buttons */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircle />}
                disabled={pendingRequests.length === 0}
                onClick={() => {/* Bulk approve functionality */}}
              >
                Approve All Non-Urgent ({pendingRequests.filter(r => r.urgency !== 'urgent').length})
              </Button>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => {/* Filter dialog */}}
              >
                Filters
              </Button>
            </Box>

            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Leave Type</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell>Urgency</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingRequests.map((request) => (
                    <TableRow
                      key={request.id}
                      sx={{
                        bgcolor: request.urgency === 'urgent' ? 'error.light' :
                                getDaysUntilStart(request.startDate) <= 1 ? 'warning.light' : 'inherit',
                        opacity: request.urgency === 'urgent' ? 1 : 0.8
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar src={request.employeeAvatar}>
                            {request.employeeName.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography fontWeight="medium">{request.employeeName}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              ID: {request.employeeId}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={request.leaveType}
                          variant="outlined"
                          size="small"
                        />
                        {request.isHalfDay && (
                          <Chip
                            label="Half Day"
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography>{request.days} day{request.days !== 1 ? 's' : ''}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography>{dayjs(request.startDate).format('MMM DD, YYYY')}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {getDaysUntilStart(request.startDate) <= 0
                            ? 'Starting today/overdue'
                            : `In ${getDaysUntilStart(request.startDate)} days`
                          }
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={request.urgency || 'normal'}
                          color={getUrgencyColor(request.urgency)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={request.status}
                          color={getStatusColor(request.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => setSelectedRequest(request)}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Approve">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => openApprovalDialog(request, 'approve')}
                            >
                              <CheckCircle />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => openApprovalDialog(request, 'reject')}
                            >
                              <Cancel />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {pendingRequests.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  No pending approvals
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  All caught up! Your team's leave requests are up to date.
                </Typography>
              </Box>
            )}
          </TabPanel>

          {/* All Requests Tab */}
          <TabPanel value={currentTab} index={1}>
            {/* Filters */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value as LeaveStatus | 'all')}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="PENDING">Pending</MenuItem>
                    <MenuItem value="APPROVED">Approved</MenuItem>
                    <MenuItem value="REJECTED">Rejected</MenuItem>
                    <MenuItem value="CANCELLED">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={typeFilter}
                    label="Type"
                    onChange={(e) => setTypeFilter(e.target.value as LeaveType | 'all')}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="ANNUAL">Annual</MenuItem>
                    <MenuItem value="SICK">Sick</MenuItem>
                    <MenuItem value="PERSONAL">Personal</MenuItem>
                    <MenuItem value="EMERGENCY">Emergency</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="Month Filter"
                  views={['year', 'month']}
                  value={dateFilter}
                  onChange={(newValue) => setDateFilter(newValue)}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => {
                    setStatusFilter('all');
                    setTypeFilter('all');
                    setDateFilter(null);
                    setUrgencyFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              </Grid>
            </Grid>

            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Leave Type</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Dates</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar src={request.employeeAvatar}>
                            {request.employeeName.charAt(0)}
                          </Avatar>
                          <Typography>{request.employeeName}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={request.leaveType} variant="outlined" size="small" />
                      </TableCell>
                      <TableCell>{request.days} days</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {dayjs(request.startDate).format('MMM DD')} - {dayjs(request.endDate).format('MMM DD, YYYY')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={request.status}
                          color={getStatusColor(request.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {dayjs(request.submittedAt).format('MMM DD, YYYY')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <Visibility />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Team Overview Tab */}
          <TabPanel value={currentTab} index={2}>
            <Grid container spacing={3}>
              {teamMembers.map((member) => (
                <Grid item xs={12} md={6} lg={4} key={member.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar src={member.avatar}>{member.name.charAt(0)}</Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography fontWeight="medium">{member.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {member.role} • {member.department}
                          </Typography>
                        </Box>
                        {member.onLeave && (
                          <Chip label="On Leave" color="warning" size="small" />
                        )}
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Leave Balance
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Annual</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {member.currentBalance?.annual ?? 'N/A'} days
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Sick</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {member.currentBalance?.sick ?? 'N/A'} days
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">Personal</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {member.currentBalance?.personal ?? 'N/A'} days
                          </Typography>
                        </Box>
                      </Box>

                      {member.pendingRequests > 0 && (
                        <Alert severity="info" size="small">
                          {member.pendingRequests} pending request(s)
                        </Alert>
                      )}

                      {member.onLeave && member.leaveEndDate && (
                        <Alert severity="warning" size="small">
                          On leave until {dayjs(member.leaveEndDate).format('MMM DD, YYYY')}
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          {/* Analytics Tab */}
          <TabPanel value={currentTab} index={3}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Monthly Approval Statistics
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 2 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="success.main">
                          {stats.approvedThisMonth}
                        </Typography>
                        <Typography variant="body2">Approved</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="error.main">
                          {stats.rejectedThisMonth}
                        </Typography>
                        <Typography variant="body2">Rejected</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="warning.main">
                          {stats.pendingApprovals}
                        </Typography>
                        <Typography variant="body2">Pending</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Team Metrics
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="primary.main">
                          {stats.totalTeamMembers}
                        </Typography>
                        <Typography variant="body2">Total Team</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="info.main">
                          {Math.round((stats.teamOnLeave / stats.totalTeamMembers) * 100)}%
                        </Typography>
                        <Typography variant="body2">On Leave</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Quick Actions
                    </Typography>
                    <Stack direction="row" spacing={2} flexWrap="wrap">
                      <Button
                        variant="outlined"
                        startIcon={<Assessment />}
                        onClick={() => {/* Generate team report */}}
                      >
                        Generate Team Report
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<Timeline />}
                        onClick={() => {/* View team calendar */}}
                      >
                        Team Calendar
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<BarChart />}
                        onClick={() => {/* View analytics */}}
                      >
                        Detailed Analytics
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
        </Card>

        {/* Approval Dialog */}
        <Dialog
          open={approvalDialog}
          onClose={() => setApprovalDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {approvalAction === 'approve' ? 'Approve' : 'Reject'} Leave Request
          </DialogTitle>
          <DialogContent>
            {selectedRequest && (
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Employee</Typography>
                    <Typography>{selectedRequest.employeeName}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Leave Type</Typography>
                    <Typography>{selectedRequest.leaveType}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Start Date</Typography>
                    <Typography>{dayjs(selectedRequest.startDate).format('MMM DD, YYYY')}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">End Date</Typography>
                    <Typography>{dayjs(selectedRequest.endDate).format('MMM DD, YYYY')}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Reason</Typography>
                    <Typography>{selectedRequest.reason}</Typography>
                  </Grid>
                </Grid>

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label={`${approvalAction === 'approve' ? 'Approval' : 'Rejection'} Comments`}
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  sx={{ mt: 3 }}
                  placeholder={
                    approvalAction === 'approve'
                      ? 'Add any approval comments or conditions...'
                      : 'Please provide a reason for rejection...'
                  }
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setApprovalDialog(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleApprovalAction}
              variant="contained"
              color={approvalAction === 'approve' ? 'success' : 'error'}
              disabled={actionLoading}
            >
              {actionLoading ? 'Processing...' : `${approvalAction === 'approve' ? 'Approve' : 'Reject'}`}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default ManagerDashboard;