import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  Tooltip,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Paper
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  Assignment,
  Visibility,
  FilterList,
  GetApp,
  CheckCircle,
  Cancel,
  Schedule,
  Person,
  Work,
  CalendarToday,
  AccessTime,
  Business,
  Comment
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import toast from 'react-hot-toast';

import api from '@/config/api';
import { useAuth } from '@/hooks/useAuth';

interface CompOffRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  hoursToRedeem: number;
  startDate: string;
  endDate: string;
  reason: string;
  isHalfDay: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  submittedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  expiryDate?: string;
  workLog: {
    id: string;
    workDate: string;
    hoursWorked: number;
    workType: 'WEEKEND' | 'HOLIDAY' | 'EXTENDED_HOURS';
    workDescription: string;
    projectDetails?: string;
    verifiedBy: string;
    verifiedAt: string;
  };
  approvals: {
    id: string;
    level: number;
    approverId: string;
    approverName: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    comments?: string;
    actionDate?: string;
  }[];
}

interface FilterOptions {
  status: string;
  employee: string;
  department: string;
  dateFrom: Dayjs | null;
  dateTo: Dayjs | null;
  workType: string;
}

const CompOffApprovalStatusPage: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<CompOffRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<CompOffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState<CompOffRequest | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [filters, setFilters] = useState<FilterOptions>({
    status: '',
    employee: '',
    department: '',
    dateFrom: null,
    dateTo: null,
    workType: ''
  });

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'EXPIRED', label: 'Expired' }
  ];

  const workTypeOptions = [
    { value: '', label: 'All Work Types' },
    { value: 'WEEKEND', label: 'Weekend Work' },
    { value: 'HOLIDAY', label: 'Holiday Work' },
    { value: 'EXTENDED_HOURS', label: 'Extended Hours' }
  ];

  const departmentOptions = [
    { value: '', label: 'All Departments' },
    { value: 'Engineering', label: 'Engineering' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Sales', label: 'Sales' },
    { value: 'HR', label: 'Human Resources' }
  ];

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [requests, filters, searchTerm]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      // Mock data for demo - in real implementation, fetch from API
      const mockRequests: CompOffRequest[] = [
        {
          id: '1',
          employeeId: 'EMP001',
          employeeName: 'John Doe',
          department: 'Engineering',
          hoursToRedeem: 8,
          startDate: '2024-10-01',
          endDate: '2024-10-01',
          reason: 'Personal work',
          isHalfDay: false,
          status: 'PENDING',
          submittedAt: '2024-09-25T10:00:00Z',
          workLog: {
            id: 'WL001',
            workDate: '2024-09-15',
            hoursWorked: 8,
            workType: 'WEEKEND',
            workDescription: 'Emergency server maintenance during weekend',
            projectDetails: 'Critical bug fix deployment',
            verifiedBy: 'Manager Smith',
            verifiedAt: '2024-09-16T09:00:00Z'
          },
          approvals: [
            {
              id: 'APP001',
              level: 1,
              approverId: 'MGR001',
              approverName: 'Manager Smith',
              status: 'PENDING',
              comments: '',
              actionDate: undefined
            }
          ]
        },
        {
          id: '2',
          employeeId: 'EMP002',
          employeeName: 'Jane Smith',
          department: 'Marketing',
          hoursToRedeem: 5,
          startDate: '2024-09-28',
          endDate: '2024-09-28',
          reason: 'Medical appointment',
          isHalfDay: true,
          status: 'APPROVED',
          submittedAt: '2024-09-20T14:30:00Z',
          approvedAt: '2024-09-21T11:00:00Z',
          expiryDate: '2024-12-28',
          workLog: {
            id: 'WL002',
            workDate: '2024-09-10',
            hoursWorked: 6,
            workType: 'HOLIDAY',
            workDescription: 'Campaign preparation work during public holiday',
            projectDetails: 'Q4 marketing campaign',
            verifiedBy: 'Marketing Head',
            verifiedAt: '2024-09-11T10:00:00Z'
          },
          approvals: [
            {
              id: 'APP002',
              level: 1,
              approverId: 'MGR002',
              approverName: 'Marketing Head',
              status: 'APPROVED',
              comments: 'Approved for valid reason',
              actionDate: '2024-09-21T11:00:00Z'
            }
          ]
        }
      ];
      setRequests(mockRequests);
    } catch (error: any) {
      toast.error('Failed to fetch comp off requests');
      console.error('Requests fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = requests;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.workLog.workDescription.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(request => request.status === filters.status);
    }

    // Department filter
    if (filters.department) {
      filtered = filtered.filter(request => request.department === filters.department);
    }

    // Work type filter
    if (filters.workType) {
      filtered = filtered.filter(request => request.workLog.workType === filters.workType);
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(request =>
        dayjs(request.submittedAt).isAfter(filters.dateFrom?.subtract(1, 'day'))
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(request =>
        dayjs(request.submittedAt).isBefore(filters.dateTo?.add(1, 'day'))
      );
    }

    setFilteredRequests(filtered);
  };

  const getFilteredRequestsByTab = () => {
    switch (tabValue) {
      case 1:
        return filteredRequests.filter(req => req.status === 'PENDING');
      case 2:
        return filteredRequests.filter(req => req.status === 'APPROVED');
      case 3:
        return filteredRequests.filter(req => req.status === 'REJECTED');
      case 4:
        return filteredRequests.filter(req => req.status === 'EXPIRED');
      default:
        return filteredRequests;
    }
  };

  const handleViewDetails = (request: CompOffRequest) => {
    setSelectedRequest(request);
    setDetailDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'REJECTED':
        return 'error';
      case 'EXPIRED':
        return 'default';
      default:
        return 'default';
    }
  };

  const getWorkTypeLabel = (workType: string) => {
    const option = workTypeOptions.find(opt => opt.value === workType);
    return option ? option.label : workType;
  };

  const exportToCSV = () => {
    const csvData = getFilteredRequestsByTab().map(request => ({
      'Employee Name': request.employeeName,
      'Department': request.department,
      'Hours': request.hoursToRedeem,
      'Leave Dates': `${dayjs(request.startDate).format('MMM DD')} - ${dayjs(request.endDate).format('MMM DD, YYYY')}`,
      'Work Date': dayjs(request.workLog.workDate).format('MMM DD, YYYY'),
      'Work Type': getWorkTypeLabel(request.workLog.workType),
      'Status': request.status,
      'Submitted Date': dayjs(request.submittedAt).format('MMM DD, YYYY'),
      'Reason': request.reason
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comp-off-requests-${dayjs().format('YYYY-MM-DD')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      employee: '',
      department: '',
      dateFrom: null,
      dateTo: null,
      workType: ''
    });
    setSearchTerm('');
  };

  const displayedRequests = getFilteredRequestsByTab();

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" gutterBottom>
            <Assignment sx={{ mr: 1, verticalAlign: 'middle' }} />
            Comp Off Approval Status
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setFilterDialogOpen(true)}
            >
              Filters
            </Button>
            <Button
              variant="outlined"
              startIcon={<GetApp />}
              onClick={exportToCSV}
              disabled={displayedRequests.length === 0}
            >
              Export
            </Button>
          </Box>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Track the status of all comp off requests, view approval workflow, and manage pending applications.
          </Typography>
        </Alert>

        {/* Search and Summary */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              placeholder="Search by employee name, reason, or work description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="primary">
                {displayedRequests.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Requests
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Card sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            variant="fullWidth"
          >
            <Tab label={`All (${filteredRequests.length})`} />
            <Tab label={`Pending (${filteredRequests.filter(r => r.status === 'PENDING').length})`} />
            <Tab label={`Approved (${filteredRequests.filter(r => r.status === 'APPROVED').length})`} />
            <Tab label={`Rejected (${filteredRequests.filter(r => r.status === 'REJECTED').length})`} />
            <Tab label={`Expired (${filteredRequests.filter(r => r.status === 'EXPIRED').length})`} />
          </Tabs>
        </Card>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Requests Table */}
        <Card>
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Hours</TableCell>
                    <TableCell>Leave Dates</TableCell>
                    <TableCell>Work Date</TableCell>
                    <TableCell>Work Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {request.employeeName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {request.employeeId}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{request.department}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <AccessTime fontSize="small" sx={{ mr: 1 }} />
                          {request.hoursToRedeem}h
                          {request.isHalfDay && (
                            <Chip label="Half Day" size="small" sx={{ ml: 1 }} />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {dayjs(request.startDate).format('MMM DD')} - {dayjs(request.endDate).format('MMM DD, YYYY')}
                      </TableCell>
                      <TableCell>
                        {dayjs(request.workLog.workDate).format('MMM DD, YYYY')}
                      </TableCell>
                      <TableCell>
                        {getWorkTypeLabel(request.workLog.workType)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={request.status}
                          color={getStatusColor(request.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {dayjs(request.submittedAt).format('MMM DD, YYYY')}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(request)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {displayedRequests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        <Typography variant="body2" color="textSecondary">
                          No comp off requests found matching the current filters.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Filter Dialog */}
        <Dialog
          open={filterDialogOpen}
          onClose={() => setFilterDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <FilterList sx={{ mr: 1, verticalAlign: 'middle' }} />
            Filter Requests
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    label="Status"
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  >
                    {statusOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={filters.department}
                    label="Department"
                    onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                  >
                    {departmentOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Work Type</InputLabel>
                  <Select
                    value={filters.workType}
                    label="Work Type"
                    onChange={(e) => setFilters({ ...filters, workType: e.target.value })}
                  >
                    {workTypeOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                {/* Empty grid for layout */}
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Date From"
                  value={filters.dateFrom}
                  onChange={(newValue) => setFilters({ ...filters, dateFrom: newValue })}
                  slotProps={{
                    textField: {
                      fullWidth: true
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Date To"
                  value={filters.dateTo}
                  onChange={(newValue) => setFilters({ ...filters, dateTo: newValue })}
                  slotProps={{
                    textField: {
                      fullWidth: true
                    }
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={clearFilters}>
              Clear All
            </Button>
            <Button onClick={() => setFilterDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => setFilterDialogOpen(false)}
            >
              Apply Filters
            </Button>
          </DialogActions>
        </Dialog>

        {/* Request Detail Dialog */}
        <Dialog
          open={detailDialogOpen}
          onClose={() => setDetailDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Comp Off Request Details
          </DialogTitle>
          <DialogContent dividers>
            {selectedRequest && (
              <Grid container spacing={3}>
                {/* Request Information */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Request Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography><strong>Employee:</strong> {selectedRequest.employeeName}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography><strong>Department:</strong> {selectedRequest.department}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography><strong>Hours to Redeem:</strong> {selectedRequest.hoursToRedeem}h</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography><strong>Leave Dates:</strong> {dayjs(selectedRequest.startDate).format('MMM DD')} - {dayjs(selectedRequest.endDate).format('MMM DD, YYYY')}</Typography>
                    </Grid>
                    <Grid item xs={12}>
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
                          color={getStatusColor(selectedRequest.status) as any}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>

                {/* Work Log Information */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    <Work sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Work Log Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography><strong>Work Date:</strong> {dayjs(selectedRequest.workLog.workDate).format('MMMM DD, YYYY')}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography><strong>Hours Worked:</strong> {selectedRequest.workLog.hoursWorked}h</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography><strong>Work Type:</strong> {getWorkTypeLabel(selectedRequest.workLog.workType)}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography><strong>Verified By:</strong> {selectedRequest.workLog.verifiedBy}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography><strong>Work Description:</strong></Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>{selectedRequest.workLog.workDescription}</Typography>
                    </Grid>
                    {selectedRequest.workLog.projectDetails && (
                      <Grid item xs={12}>
                        <Typography><strong>Project Details:</strong></Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>{selectedRequest.workLog.projectDetails}</Typography>
                      </Grid>
                    )}
                  </Grid>
                </Grid>

                {/* Approval Timeline */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    <Schedule sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Approval Timeline
                  </Typography>
                  <Timeline>
                    <TimelineItem>
                      <TimelineOppositeContent color="textSecondary">
                        {dayjs(selectedRequest.submittedAt).format('MMM DD, YYYY HH:mm')}
                      </TimelineOppositeContent>
                      <TimelineSeparator>
                        <TimelineDot color="primary">
                          <Assignment />
                        </TimelineDot>
                        <TimelineConnector />
                      </TimelineSeparator>
                      <TimelineContent>
                        <Typography variant="h6">Request Submitted</Typography>
                        <Typography>Comp off request submitted by {selectedRequest.employeeName}</Typography>
                      </TimelineContent>
                    </TimelineItem>

                    {selectedRequest.approvals.map((approval, index) => (
                      <TimelineItem key={approval.id}>
                        <TimelineOppositeContent color="textSecondary">
                          {approval.actionDate ? dayjs(approval.actionDate).format('MMM DD, YYYY HH:mm') : 'Pending'}
                        </TimelineOppositeContent>
                        <TimelineSeparator>
                          <TimelineDot color={
                            approval.status === 'APPROVED' ? 'success' :
                            approval.status === 'REJECTED' ? 'error' : 'warning'
                          }>
                            {approval.status === 'APPROVED' ? <CheckCircle /> :
                             approval.status === 'REJECTED' ? <Cancel /> : <Schedule />}
                          </TimelineDot>
                          {index < selectedRequest.approvals.length - 1 && <TimelineConnector />}
                        </TimelineSeparator>
                        <TimelineContent>
                          <Typography variant="h6">
                            Level {approval.level} - {approval.status}
                          </Typography>
                          <Typography>
                            {approval.approverName}
                            {approval.comments && (
                              <Box mt={1}>
                                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                  "{approval.comments}"
                                </Typography>
                              </Box>
                            )}
                          </Typography>
                        </TimelineContent>
                      </TimelineItem>
                    ))}
                  </Timeline>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default CompOffApprovalStatusPage;