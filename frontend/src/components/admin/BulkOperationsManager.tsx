import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  IconButton,
  Tooltip,
  Badge,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Schedule,
  FilterList,
  GetApp,
  Upload,
  People,
  EventNote,
  Assignment,
  Autorenew,
  Warning,
  Info,
  CheckBox,
  IndeterminateCheckBox,
  PlayArrow,
  Stop,
  Refresh,
  Download,
  CloudUpload,
  Timeline,
  AdminPanelSettings,
  AccountTree
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useAuth } from '@/hooks/useAuth';
import dayjs, { Dayjs } from 'dayjs';
import toast from 'react-hot-toast';
import AutomationRulesManager from '@/components/workflow/AutomationRulesManager';
import ApprovalChainManager from '@/components/workflow/ApprovalChainManager';

interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason: string;
  appliedDate: string;
  managerId?: string;
}

interface BulkOperation {
  id: string;
  type: 'APPROVE' | 'REJECT' | 'CANCEL' | 'EXPORT' | 'IMPORT' | 'NOTIFY';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  targetCount: number;
  processedCount: number;
  createdAt: string;
  completedAt?: string;
  createdBy: string;
  errors?: string[];
}

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
      id={`bulk-ops-tabpanel-${index}`}
      aria-labelledby={`bulk-ops-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const BulkOperationsManager: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [bulkOperations, setBulkOperations] = useState<BulkOperation[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [operationType, setOperationType] = useState<string>('');
  const [filters, setFilters] = useState({
    status: 'all',
    department: 'all',
    dateFrom: null as Dayjs | null,
    dateTo: null as Dayjs | null,
    leaveType: 'all'
  });

  // Mock data for leave requests
  const mockLeaveRequests: LeaveRequest[] = [
    {
      id: '1',
      employeeId: 'EMP001',
      employeeName: 'John Doe',
      department: 'Engineering',
      leaveType: 'SICK_LEAVE',
      startDate: '2024-02-15',
      endDate: '2024-02-17',
      totalDays: 3,
      status: 'PENDING',
      reason: 'Medical treatment',
      appliedDate: '2024-02-10',
      managerId: 'MGR001'
    },
    {
      id: '2',
      employeeId: 'EMP002',
      employeeName: 'Jane Smith',
      department: 'Marketing',
      leaveType: 'CASUAL_LEAVE',
      startDate: '2024-02-20',
      endDate: '2024-02-22',
      totalDays: 3,
      status: 'PENDING',
      reason: 'Family vacation',
      appliedDate: '2024-02-12',
      managerId: 'MGR002'
    },
    {
      id: '3',
      employeeId: 'EMP003',
      employeeName: 'Mike Johnson',
      department: 'Sales',
      leaveType: 'EARNED_LEAVE',
      startDate: '2024-03-01',
      endDate: '2024-03-05',
      totalDays: 5,
      status: 'PENDING',
      reason: 'Personal work',
      appliedDate: '2024-02-14',
      managerId: 'MGR003'
    }
  ];

  const mockBulkOperations: BulkOperation[] = [
    {
      id: '1',
      type: 'APPROVE',
      status: 'COMPLETED',
      targetCount: 15,
      processedCount: 15,
      createdAt: '2024-02-14T10:30:00',
      completedAt: '2024-02-14T10:32:00',
      createdBy: 'HR Admin'
    },
    {
      id: '2',
      type: 'EXPORT',
      status: 'IN_PROGRESS',
      targetCount: 250,
      processedCount: 120,
      createdAt: '2024-02-15T14:15:00',
      createdBy: 'HR Admin'
    },
    {
      id: '3',
      type: 'REJECT',
      status: 'FAILED',
      targetCount: 8,
      processedCount: 3,
      createdAt: '2024-02-13T16:45:00',
      completedAt: '2024-02-13T16:47:00',
      createdBy: 'Manager',
      errors: ['Invalid employee ID: EMP999', 'Leave already processed: REQ456']
    }
  ];

  useEffect(() => {
    fetchLeaveRequests();
    fetchBulkOperations();
  }, [filters]);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLeaveRequests(mockLeaveRequests);
    } catch (error) {
      toast.error('Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchBulkOperations = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setBulkOperations(mockBulkOperations);
    } catch (error) {
      console.error('Failed to fetch bulk operations');
    }
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = leaveRequests
        .filter(request => request.status === 'PENDING')
        .map(request => request.id);
      setSelectedRequests(newSelected);
    } else {
      setSelectedRequests([]);
    }
  };

  const handleSelectRequest = (requestId: string) => {
    const selectedIndex = selectedRequests.indexOf(requestId);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedRequests, requestId);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedRequests.slice(1));
    } else if (selectedIndex === selectedRequests.length - 1) {
      newSelected = newSelected.concat(selectedRequests.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedRequests.slice(0, selectedIndex),
        selectedRequests.slice(selectedIndex + 1)
      );
    }

    setSelectedRequests(newSelected);
  };

  const handleBulkOperation = (operation: string) => {
    if (selectedRequests.length === 0) {
      toast.error('Please select at least one request');
      return;
    }
    setOperationType(operation);
    setConfirmDialogOpen(true);
  };

  const executeBulkOperation = async () => {
    try {
      setLoading(true);
      setConfirmDialogOpen(false);

      // Create new bulk operation
      const newOperation: BulkOperation = {
        id: Date.now().toString(),
        type: operationType as any,
        status: 'IN_PROGRESS',
        targetCount: selectedRequests.length,
        processedCount: 0,
        createdAt: new Date().toISOString(),
        createdBy: user?.firstName + ' ' + user?.lastName || 'Admin'
      };

      setBulkOperations(prev => [newOperation, ...prev]);

      // Simulate processing
      for (let i = 0; i < selectedRequests.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));

        // Update progress
        setBulkOperations(prev =>
          prev.map(op =>
            op.id === newOperation.id
              ? { ...op, processedCount: i + 1 }
              : op
          )
        );
      }

      // Complete operation
      setBulkOperations(prev =>
        prev.map(op =>
          op.id === newOperation.id
            ? {
                ...op,
                status: 'COMPLETED',
                completedAt: new Date().toISOString()
              }
            : op
        )
      );

      // Update leave requests status
      setLeaveRequests(prev =>
        prev.map(request =>
          selectedRequests.includes(request.id)
            ? {
                ...request,
                status: operationType === 'APPROVE' ? 'APPROVED' :
                        operationType === 'REJECT' ? 'REJECTED' : request.status
              }
            : request
        )
      );

      setSelectedRequests([]);
      toast.success(`Bulk ${operationType.toLowerCase()} completed successfully!`);

    } catch (error) {
      toast.error('Bulk operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const csvData = leaveRequests.map(request => ({
      'Employee ID': request.employeeId,
      'Employee Name': request.employeeName,
      'Department': request.department,
      'Leave Type': request.leaveType,
      'Start Date': request.startDate,
      'End Date': request.endDate,
      'Total Days': request.totalDays,
      'Status': request.status,
      'Reason': request.reason,
      'Applied Date': request.appliedDate
    }));

    const csvContent = "data:text/csv;charset=utf-8,"
      + Object.keys(csvData[0]).join(",") + "\n"
      + csvData.map(row => Object.values(row).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `leave-requests-${dayjs().format('YYYY-MM-DD')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Data exported successfully!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'COMPLETED':
        return 'success';
      case 'PENDING':
      case 'IN_PROGRESS':
        return 'warning';
      case 'REJECTED':
      case 'FAILED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'APPROVE':
        return <CheckCircle />;
      case 'REJECT':
        return <Cancel />;
      case 'EXPORT':
        return <Download />;
      case 'IMPORT':
        return <Upload />;
      case 'NOTIFY':
        return <EventNote />;
      default:
        return <Assignment />;
    }
  };

  const pendingRequests = leaveRequests.filter(req => req.status === 'PENDING');
  const isIndeterminate = selectedRequests.length > 0 && selectedRequests.length < pendingRequests.length;
  const isAllSelected = pendingRequests.length > 0 && selectedRequests.length === pendingRequests.length;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Bulk Operations Manager
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Badge badgeContent={selectedRequests.length} color="primary">
            <Button
              variant="outlined"
              startIcon={<CheckCircle />}
              onClick={() => handleBulkOperation('APPROVE')}
              disabled={selectedRequests.length === 0}
            >
              Approve Selected
            </Button>
          </Badge>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Cancel />}
            onClick={() => handleBulkOperation('REJECT')}
            disabled={selectedRequests.length === 0}
          >
            Reject Selected
          </Button>
          <Button
            variant="outlined"
            startIcon={<GetApp />}
            onClick={handleExport}
          >
            Export All
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <Schedule />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {pendingRequests.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Pending Requests
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
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <CheckBox />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {selectedRequests.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Selected Items
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
                  <Timeline />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {bulkOperations.filter(op => op.status === 'IN_PROGRESS').length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Running Operations
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
                  <AdminPanelSettings />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {bulkOperations.filter(op => op.status === 'COMPLETED').length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Completed Today
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Leave Requests" icon={<EventNote />} />
          <Tab label="Operations History" icon={<Timeline />} />
          <Tab label="Workflow Automation" icon={<Autorenew />} />
          <Tab label="Approval Chains" icon={<AccountTree />} />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <TabPanel value={currentTab} index={0}>
        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    label="Status"
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="PENDING">Pending</MenuItem>
                    <MenuItem value="APPROVED">Approved</MenuItem>
                    <MenuItem value="REJECTED">Rejected</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={filters.department}
                    label="Department"
                    onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                  >
                    <MenuItem value="all">All Departments</MenuItem>
                    <MenuItem value="Engineering">Engineering</MenuItem>
                    <MenuItem value="Marketing">Marketing</MenuItem>
                    <MenuItem value="Sales">Sales</MenuItem>
                    <MenuItem value="HR">HR</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <DatePicker
                  label="From Date"
                  value={filters.dateFrom}
                  onChange={(newValue) => setFilters(prev => ({ ...prev, dateFrom: newValue }))}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <DatePicker
                  label="To Date"
                  value={filters.dateTo}
                  onChange={(newValue) => setFilters(prev => ({ ...prev, dateTo: newValue }))}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Button
                  variant="outlined"
                  startIcon={<FilterList />}
                  onClick={fetchLeaveRequests}
                  fullWidth
                >
                  Apply Filters
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Button
                  variant="text"
                  startIcon={<Refresh />}
                  onClick={() => {
                    setFilters({
                      status: 'all',
                      department: 'all',
                      dateFrom: null,
                      dateTo: null,
                      leaveType: 'all'
                    });
                    setSelectedRequests([]);
                  }}
                  fullWidth
                >
                  Clear
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Leave Requests Table */}
        <Card>
          <CardContent>
            {loading && <LinearProgress />}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        indeterminate={isIndeterminate}
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell>Employee</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Leave Type</TableCell>
                    <TableCell>Period</TableCell>
                    <TableCell>Days</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Applied Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaveRequests.map((request) => (
                    <TableRow
                      key={request.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleSelectRequest(request.id)}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="primary"
                          checked={selectedRequests.indexOf(request.id) !== -1}
                          disabled={request.status !== 'PENDING'}
                        />
                      </TableCell>
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
                        <Chip
                          label={request.leaveType.replace('_', ' ')}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {request.startDate} to {request.endDate}
                        </Typography>
                      </TableCell>
                      <TableCell>{request.totalDays}</TableCell>
                      <TableCell>
                        <Chip
                          label={request.status}
                          size="small"
                          color={getStatusColor(request.status) as any}
                        />
                      </TableCell>
                      <TableCell>{request.appliedDate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        {/* Operations History */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Bulk Operations
            </Typography>
            <List>
              {bulkOperations.map((operation) => (
                <ListItem key={operation.id}>
                  <ListItemIcon>
                    {getOperationIcon(operation.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body1">
                          {operation.type.replace('_', ' ')} Operation
                        </Typography>
                        <Chip
                          label={operation.status}
                          size="small"
                          color={getStatusColor(operation.status) as any}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          {operation.processedCount}/{operation.targetCount} items processed
                        </Typography>
                        <Typography variant="caption" display="block">
                          Created by {operation.createdBy} on {dayjs(operation.createdAt).format('MMM DD, YYYY HH:mm')}
                        </Typography>
                        {operation.status === 'IN_PROGRESS' && (
                          <LinearProgress
                            variant="determinate"
                            value={(operation.processedCount / operation.targetCount) * 100}
                            sx={{ mt: 1, width: 200 }}
                          />
                        )}
                        {operation.errors && operation.errors.length > 0 && (
                          <Alert severity="error" sx={{ mt: 1 }}>
                            {operation.errors.length} errors occurred
                          </Alert>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        {/* Workflow Automation */}
        <AutomationRulesManager />
      </TabPanel>

      <TabPanel value={currentTab} index={3}>
        {/* Approval Chains */}
        <ApprovalChainManager />
      </TabPanel>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>
          Confirm Bulk {operationType}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {operationType.toLowerCase()} {selectedRequests.length} selected leave request(s)?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={executeBulkOperation}
            variant="contained"
            color={operationType === 'REJECT' ? 'error' : 'primary'}
          >
            Confirm {operationType}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BulkOperationsManager;