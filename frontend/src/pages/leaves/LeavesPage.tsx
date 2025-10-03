import React, { useState, useEffect } from 'react';
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
  Switch,
  FormControlLabel,
  Alert,
  Fab,
  LinearProgress,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
  Collapse
} from '@mui/material';
import {
  Add,
  CalendarMonth,
  Edit,
  Delete,
  Visibility,
  CheckCircle,
  Cancel,
  Schedule,
  BarChart,
  Description
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import toast from 'react-hot-toast';

import api from '@/config/api';
import { LeaveType, LeaveStatus } from '@/types';
import TemplateSelector from '@/components/templates/TemplateSelector';

interface LeaveRequest {
  id: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  isHalfDay: boolean;
  reason: string;
  status: LeaveStatus;
  appliedDate: string;
  approvedBy?: string;
  approvedAt?: string;
  comments?: string;
}

interface LeaveBalance {
  id: string;
  leaveType: LeaveType;
  totalEntitlement: number;
  used: number;
  available: number;
  carryForward: number;
  year: number;
}

const LeavesPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);
  const [employees, setEmployees] = useState<Array<{id: string, firstName: string, lastName: string, employeeId: string}>>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    leaveType: LeaveType.CASUAL_LEAVE,
    startDate: null as Dayjs | null,
    endDate: null as Dayjs | null,
    reason: '',
    isHalfDay: false,
    employeeId: '' // For admin applications
  });

  const leaveTypeOptions = [
    { value: LeaveType.SICK_LEAVE, label: 'Sick Leave' },
    { value: LeaveType.CASUAL_LEAVE, label: 'Casual Leave' },
    { value: LeaveType.EARNED_LEAVE, label: 'Earned Leave' },
    { value: LeaveType.MATERNITY_LEAVE, label: 'Maternity Leave' },
    { value: LeaveType.PATERNITY_LEAVE, label: 'Paternity Leave' },
    { value: LeaveType.COMPENSATORY_OFF, label: 'Compensatory Off' },
    { value: LeaveType.BEREAVEMENT_LEAVE, label: 'Bereavement Leave' },
    { value: LeaveType.MARRIAGE_LEAVE, label: 'Marriage Leave' }
  ];

  const statusColors = {
    [LeaveStatus.PENDING]: 'warning',
    [LeaveStatus.APPROVED]: 'success',
    [LeaveStatus.REJECTED]: 'error',
    [LeaveStatus.CANCELLED]: 'default',
    [LeaveStatus.DRAFT]: 'info'
  } as const;

  useEffect(() => {
    fetchLeaveRequests();
    fetchLeaveBalances();
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser?.role === 'HR_ADMIN') {
      fetchEmployees();
    }
  }, [currentUser]);

  // Listen for template usage events
  useEffect(() => {
    const handleTemplateUse = (event: CustomEvent) => {
      const templateData = event.detail;
      setFormData({
        leaveType: templateData.leaveType as LeaveType,
        startDate: dayjs(),
        endDate: templateData.duration ? dayjs().add(templateData.duration - 1, 'day') : dayjs(),
        reason: templateData.reason,
        isHalfDay: templateData.isHalfDay || false,
        employeeId: ''
      });
      setDialogOpen(true);
    };

    window.addEventListener('useLeaveTemplate', handleTemplateUse as EventListener);

    return () => {
      window.removeEventListener('useLeaveTemplate', handleTemplateUse as EventListener);
    };
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/leaves');
      setLeaveRequests(response.data.data.requests || []);
    } catch (error) {
      toast.error('Failed to fetch leave requests');
      console.error('Error fetching leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveBalances = async () => {
    try {
      const response = await api.get('/leaves/balances');
      setLeaveBalances(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch leave balances');
      console.error('Error fetching leave balances:', error);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        setCurrentUser(JSON.parse(userStr));
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/users');
      setEmployees(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch employees');
      console.error('Error fetching employees:', error);
    }
  };

  const handleCreateRequest = () => {
    setDialogMode('create');
    setFormData({
      leaveType: LeaveType.CASUAL_LEAVE,
      startDate: null,
      endDate: null,
      reason: '',
      isHalfDay: false,
      employeeId: ''
    });
    setOpenDialog(true);
  };

  const handleSelectTemplate = (template: any) => {
    setFormData({
      leaveType: template.leaveType as LeaveType,
      startDate: dayjs(),
      endDate: template.duration ? dayjs().add(template.duration - 1, 'day') : dayjs(),
      reason: template.reason,
      isHalfDay: template.isHalfDay || false,
      employeeId: ''
    });
    setTemplateSelectorOpen(false);
  };

  const handleEditRequest = (request: LeaveRequest) => {
    setDialogMode('edit');
    setSelectedRequest(request);
    setFormData({
      leaveType: request.leaveType,
      startDate: dayjs(request.startDate),
      endDate: dayjs(request.endDate),
      reason: request.reason,
      isHalfDay: request.isHalfDay
    });
    setOpenDialog(true);
  };

  const handleViewRequest = (request: LeaveRequest) => {
    setDialogMode('view');
    setSelectedRequest(request);
    setOpenDialog(true);
  };

  const handleSubmitRequest = async () => {
    if (!formData.startDate || !formData.endDate || !formData.reason.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    // For admin users, validate employee selection
    if (currentUser?.role === 'HR_ADMIN' && !formData.employeeId) {
      toast.error('Please select an employee');
      return;
    }

    if (formData.reason.trim().length < 10) {
      toast.error('Reason must be at least 10 characters long');
      return;
    }

    try {
      setLoading(true);
      const requestData = {
        type: formData.leaveType,
        startDate: formData.startDate.format('YYYY-MM-DD'),
        endDate: formData.endDate.format('YYYY-MM-DD'),
        reason: formData.reason.trim(),
        isHalfDay: formData.isHalfDay,
        ...(currentUser?.role === 'HR_ADMIN' && formData.employeeId && { employeeId: formData.employeeId })
      };

      let response;
      if (dialogMode === 'create') {
        response = await api.post('/leaves', requestData);
      } else if (dialogMode === 'edit' && selectedRequest) {
        response = await api.put(`/leaves/${selectedRequest.id}`, requestData);
      }

      // Only show success if the request was actually successful
      if (response && response.data.success) {
        if (dialogMode === 'create') {
          toast.success('Leave request submitted successfully');
        } else {
          toast.success('Leave request updated successfully');
        }

        // Close dialog and refresh data only on success
        setOpenDialog(false);
        await fetchLeaveRequests();
        await fetchLeaveBalances();
      } else {
        throw new Error('Request was not successful');
      }
    } catch (error: any) {
      // Enhanced error handling for different types of conflicts
      let errorMessage = 'Failed to submit request';

      if (error.response?.status === 409) {
        // Handle overlap conflicts specifically
        errorMessage = error.response?.data?.message || 'Leave request conflicts with existing request. Please choose different dates.';
      } else if (error.response?.status === 400) {
        // Handle validation errors
        errorMessage = error.response?.data?.message || 'Invalid request data. Please check your inputs.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this leave request?')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/leaves/${requestId}`);
      toast.success('Leave request cancelled successfully');
      fetchLeaveRequests();
      fetchLeaveBalances();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to cancel request';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const days = formData.endDate.diff(formData.startDate, 'day') + 1;
    return formData.isHalfDay ? 0.5 : days;
  };

  const getAvailableBalance = (leaveType: LeaveType) => {
    const balance = leaveBalances.find(b => b.leaveType === leaveType);
    return balance?.available || 0;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" gutterBottom>
            My Leaves
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateRequest}
            disabled={loading}
          >
            Apply for Leave
          </Button>
        </Box>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Leave Balances */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Leave Balance Overview
            </Typography>
          </Grid>
          {leaveBalances.map((balance) => (
            <Grid item xs={12} sm={6} md={4} key={balance.id}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    {leaveTypeOptions.find(opt => opt.value === balance.leaveType)?.label}
                  </Typography>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography variant="h4" color="primary">
                      {balance.available}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      / {balance.totalEntitlement} days
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(balance.used / balance.totalEntitlement) * 100}
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="caption" color="textSecondary">
                    Used: {balance.used} days
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Leave Requests Table */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              My Leave Requests
            </Typography>

            {isMobile ? (
              // Mobile Card Layout
              <Box>
                {leaveRequests.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="textSecondary">
                      No leave requests found. Click "Apply for Leave" to create your first request.
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    {leaveRequests.map((request, index) => (
                      <Grid item xs={12} key={`${request.id}-${index}`}>
                        <Card variant="outlined" sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box>
                              <Typography variant="subtitle1" fontWeight="medium">
                                {leaveTypeOptions.find(opt => opt.value === request.leaveType)?.label}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                {dayjs(request.startDate).format('MMM DD')} - {dayjs(request.endDate).format('MMM DD, YYYY')}
                              </Typography>
                            </Box>
                            <Chip
                              label={request.status}
                              color={statusColors[request.status] as any}
                              size="small"
                            />
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                            <Typography variant="body2">
                              <strong>{request.totalDays} days</strong> {request.isHalfDay && '(Half Day)'}
                            </Typography>
                            <Box display="flex" gap={1}>
                              <Tooltip title="View Details">
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewRequest(request)}
                                >
                                  <Visibility />
                                </IconButton>
                              </Tooltip>
                              {request.status === LeaveStatus.PENDING && (
                                <>
                                  <Tooltip title="Edit">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleEditRequest(request)}
                                    >
                                      <Edit />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Cancel">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleCancelRequest(request.id)}
                                    >
                                      <Cancel />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                            </Box>
                          </Box>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            ) : (
              // Desktop Table Layout
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Leave Type</TableCell>
                      <TableCell>Start Date</TableCell>
                      <TableCell>End Date</TableCell>
                      <TableCell>Days</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Applied Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {leaveRequests.map((request, index) => (
                      <TableRow key={`${request.id}-${index}`}>
                        <TableCell>
                          {leaveTypeOptions.find(opt => opt.value === request.leaveType)?.label}
                        </TableCell>
                        <TableCell>{dayjs(request.startDate).format('MMM DD, YYYY')}</TableCell>
                        <TableCell>{dayjs(request.endDate).format('MMM DD, YYYY')}</TableCell>
                        <TableCell>
                          {request.totalDays} {request.isHalfDay && '(Half Day)'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={request.status}
                            color={statusColors[request.status] as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                          {dayjs(request.appliedDate).format('MMM DD, YYYY')}
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleViewRequest(request)}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            {request.status === LeaveStatus.PENDING && (
                              <>
                                <Tooltip title="Edit">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleEditRequest(request)}
                                  >
                                    <Edit />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Cancel">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleCancelRequest(request.id)}
                                  >
                                    <Cancel />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                    {leaveRequests.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography variant="body2" color="textSecondary">
                            No leave requests found. Click "Apply for Leave" to create your first request.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Leave Request Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6">
                {dialogMode === 'create' && 'Apply for Leave'}
                {dialogMode === 'edit' && 'Edit Leave Request'}
                {dialogMode === 'view' && 'Leave Request Details'}
              </Typography>
              {(dialogMode === 'create' || dialogMode === 'edit') && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Description />}
                  onClick={() => setTemplateSelectorOpen(true)}
                >
                  Use Template
                </Button>
              )}
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            {dialogMode === 'view' && selectedRequest ? (
              <Box>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography><strong>Leave Type:</strong> {
                      leaveTypeOptions.find(opt => opt.value === selectedRequest.leaveType)?.label
                    }</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography><strong>Start Date:</strong> {dayjs(selectedRequest.startDate).format('MMM DD, YYYY')}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography><strong>End Date:</strong> {dayjs(selectedRequest.endDate).format('MMM DD, YYYY')}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography><strong>Total Days:</strong> {selectedRequest.totalDays}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography><strong>Half Day:</strong> {selectedRequest.isHalfDay ? 'Yes' : 'No'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography><strong>Reason:</strong></Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>{selectedRequest.reason}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography><strong>Status:</strong>
                      <Chip
                        label={selectedRequest.status}
                        color={statusColors[selectedRequest.status] as any}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                  </Grid>
                  {selectedRequest.approvedBy && (
                    <Grid item xs={12}>
                      <Typography><strong>Approved By:</strong> {selectedRequest.approvedBy}</Typography>
                    </Grid>
                  )}
                  {selectedRequest.comments && (
                    <Grid item xs={12}>
                      <Typography><strong>Comments:</strong></Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>{selectedRequest.comments}</Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            ) : (
              <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSubmitRequest(); }}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      select
                      fullWidth
                      label="Leave Type"
                      value={formData.leaveType}
                      onChange={(e) => setFormData(prev => ({ ...prev, leaveType: e.target.value as LeaveType }))}
                      helperText={`Available: ${getAvailableBalance(formData.leaveType)} days`}
                    >
                      {leaveTypeOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {currentUser?.role === 'HR_ADMIN' && (
                    <Grid item xs={12}>
                      <TextField
                        select
                        fullWidth
                        label="Select Employee"
                        value={formData.employeeId}
                        onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                        required
                        helperText="Choose the employee to apply leave for"
                      >
                        <MenuItem value="">
                          <em>Select an employee</em>
                        </MenuItem>
                        {employees.map((employee) => (
                          <MenuItem key={employee.id} value={employee.id}>
                            {employee.firstName} {employee.lastName} ({employee.employeeId})
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                  )}

                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="Start Date"
                      value={formData.startDate}
                      onChange={(newValue) => setFormData(prev => ({ ...prev, startDate: newValue }))}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="End Date"
                      value={formData.endDate}
                      onChange={(newValue) => setFormData(prev => ({ ...prev, endDate: newValue }))}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.isHalfDay}
                          onChange={(e) => setFormData(prev => ({ ...prev, isHalfDay: e.target.checked }))}
                        />
                      }
                      label="Half Day Leave"
                    />
                  </Grid>

                  {formData.startDate && formData.endDate && (
                    <Grid item xs={12}>
                      <Alert severity="info">
                        Total days: {calculateTotalDays()} {formData.isHalfDay && '(Half Day)'}
                      </Alert>
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Reason"
                      value={formData.reason}
                      onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                      required
                      helperText="Provide a detailed reason for your leave request (minimum 10 characters)"
                    />
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>
              {dialogMode === 'view' ? 'Close' : 'Cancel'}
            </Button>
            {dialogMode !== 'view' && (
              <Button variant="contained" onClick={handleSubmitRequest} disabled={loading}>
                {dialogMode === 'create' ? 'Submit Request' : 'Update Request'}
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Template Selector Dialog */}
        <TemplateSelector
          open={templateSelectorOpen}
          onClose={() => setTemplateSelectorOpen(false)}
          onSelectTemplate={handleSelectTemplate}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default LeavesPage;