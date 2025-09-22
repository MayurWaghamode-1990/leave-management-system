import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Tab,
  Tabs,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Cancel,
  Edit,
  CheckCircle,
  Schedule,
  Assignment,
  Visibility
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import toast from 'react-hot-toast';

import api from '@/config/api';
import { useAuth } from '@/hooks/useAuth';

interface CancellationRequest {
  id: string;
  leaveRequestId: string;
  employeeId: string;
  cancellationReason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  appliedDate: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  leaveRequest?: any;
  employee?: any;
}

interface ModificationRequest {
  id: string;
  originalLeaveId: string;
  employeeId: string;
  newStartDate?: string;
  newEndDate?: string;
  newLeaveType?: string;
  newReason?: string;
  modificationReason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  appliedDate: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  originalLeave?: any;
  employee?: any;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const leaveTypes = [
  { value: 'CASUAL_LEAVE', label: 'Casual Leave' },
  { value: 'SICK_LEAVE', label: 'Sick Leave' },
  { value: 'EARNED_LEAVE', label: 'Earned Leave' },
  { value: 'MATERNITY_LEAVE', label: 'Maternity Leave' },
  { value: 'PATERNITY_LEAVE', label: 'Paternity Leave' }
];

const AdvancedRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [cancellationRequests, setCancellationRequests] = useState<CancellationRequest[]>([]);
  const [modificationRequests, setModificationRequests] = useState<ModificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve-cancel' | 'approve-modify' | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const isManager = user?.role === 'MANAGER' || user?.role === 'HR_ADMIN';

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);

      if (isManager) {
        // Fetch both cancellation and modification requests for managers
        const [cancellationResponse, modificationResponse] = await Promise.all([
          api.get('/leaves/cancellation-requests'),
          api.get('/leaves/modification-requests')
        ]);

        if (cancellationResponse.data.success) {
          setCancellationRequests(cancellationResponse.data.data);
        }

        if (modificationResponse.data.success) {
          setModificationRequests(modificationResponse.data.data);
        }
      }
    } catch (error: any) {
      toast.error('Failed to fetch requests');
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCancellation = async (requestId: string) => {
    try {
      const response = await api.post(`/leaves/cancellation-requests/${requestId}/approve`);
      if (response.data.success) {
        toast.success('Cancellation request approved successfully');
        setActionDialogOpen(false);
        fetchRequests();
      }
    } catch (error: any) {
      toast.error('Failed to approve cancellation request');
    }
  };

  const handleApproveModification = async (requestId: string) => {
    try {
      const response = await api.post(`/leaves/modification-requests/${requestId}/approve`);
      if (response.data.success) {
        toast.success('Modification request approved successfully');
        setActionDialogOpen(false);
        fetchRequests();
      }
    } catch (error: any) {
      toast.error('Failed to approve modification request');
    }
  };

  const openApprovalDialog = (request: any, type: 'approve-cancel' | 'approve-modify') => {
    setSelectedRequest(request);
    setActionType(type);
    setActionDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'PENDING': return 'warning';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

  const getLeaveTypeLabel = (leaveType?: string) => {
    if (!leaveType) return 'N/A';
    return leaveTypes.find(type => type.value === leaveType)?.label || leaveType;
  };

  const renderCancellationRequests = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Employee</TableCell>
            <TableCell>Original Leave</TableCell>
            <TableCell>Cancellation Reason</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Applied Date</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {cancellationRequests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>{request.employee?.name || 'Unknown'}</TableCell>
              <TableCell>
                <Box>
                  <Typography variant="body2">
                    {getLeaveTypeLabel(request.leaveRequest?.leaveType)}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {request.leaveRequest?.startDate && dayjs(request.leaveRequest.startDate).format('MMM DD')} - {' '}
                    {request.leaveRequest?.endDate && dayjs(request.leaveRequest.endDate).format('MMM DD, YYYY')}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ maxWidth: 200 }}>
                  {request.cancellationReason}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={request.status}
                  color={getStatusColor(request.status) as any}
                  size="small"
                />
              </TableCell>
              <TableCell>
                {dayjs(request.appliedDate).format('MMM DD, YYYY')}
              </TableCell>
              <TableCell>
                {request.status === 'PENDING' && (
                  <Tooltip title="Approve Cancellation">
                    <IconButton
                      size="small"
                      color="success"
                      onClick={() => openApprovalDialog(request, 'approve-cancel')}
                    >
                      <CheckCircle />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="View Details">
                  <IconButton size="small" color="primary">
                    <Visibility />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {cancellationRequests.length === 0 && !loading && (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">
            No cancellation requests found
          </Typography>
        </Box>
      )}
    </TableContainer>
  );

  const renderModificationRequests = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Employee</TableCell>
            <TableCell>Original Leave</TableCell>
            <TableCell>Requested Changes</TableCell>
            <TableCell>Modification Reason</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Applied Date</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {modificationRequests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>{request.employee?.name || 'Unknown'}</TableCell>
              <TableCell>
                <Box>
                  <Typography variant="body2">
                    {getLeaveTypeLabel(request.originalLeave?.leaveType)}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {request.originalLeave?.startDate && dayjs(request.originalLeave.startDate).format('MMM DD')} - {' '}
                    {request.originalLeave?.endDate && dayjs(request.originalLeave.endDate).format('MMM DD, YYYY')}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ maxWidth: 200 }}>
                  {request.newStartDate && (
                    <Typography variant="caption" display="block">
                      New Start: {dayjs(request.newStartDate).format('MMM DD, YYYY')}
                    </Typography>
                  )}
                  {request.newEndDate && (
                    <Typography variant="caption" display="block">
                      New End: {dayjs(request.newEndDate).format('MMM DD, YYYY')}
                    </Typography>
                  )}
                  {request.newLeaveType && (
                    <Typography variant="caption" display="block">
                      New Type: {getLeaveTypeLabel(request.newLeaveType)}
                    </Typography>
                  )}
                  {request.newReason && (
                    <Typography variant="caption" display="block">
                      New Reason: {request.newReason.substring(0, 50)}...
                    </Typography>
                  )}
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ maxWidth: 200 }}>
                  {request.modificationReason}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={request.status}
                  color={getStatusColor(request.status) as any}
                  size="small"
                />
              </TableCell>
              <TableCell>
                {dayjs(request.appliedDate).format('MMM DD, YYYY')}
              </TableCell>
              <TableCell>
                {request.status === 'PENDING' && (
                  <Tooltip title="Approve Modification">
                    <IconButton
                      size="small"
                      color="success"
                      onClick={() => openApprovalDialog(request, 'approve-modify')}
                    >
                      <CheckCircle />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="View Details">
                  <IconButton size="small" color="primary">
                    <Visibility />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {modificationRequests.length === 0 && !loading && (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">
            No modification requests found
          </Typography>
        </Box>
      )}
    </TableContainer>
  );

  if (!isManager) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Advanced Leave Requests
        </Typography>
        <Alert severity="info">
          Only managers and HR admins can view and manage cancellation and modification requests.
        </Alert>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Assignment />
            Advanced Leave Requests
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Manage leave cancellation and modification requests from employees
          </Typography>
        </Box>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={currentTab}
            onChange={(e, newValue) => setCurrentTab(newValue)}
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label="Cancellation Requests" icon={<Cancel />} />
            <Tab label="Modification Requests" icon={<Edit />} />
          </Tabs>
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Cancellation Requests Tab */}
            <TabPanel value={currentTab} index={0}>
              {renderCancellationRequests()}
            </TabPanel>

            {/* Modification Requests Tab */}
            <TabPanel value={currentTab} index={1}>
              {renderModificationRequests()}
            </TabPanel>
          </>
        )}

        {/* Approval Dialog */}
        <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {actionType === 'approve-cancel' ? 'Approve Cancellation Request' : 'Approve Modification Request'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ py: 2 }}>
              {selectedRequest && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Employee: {selectedRequest.employee?.name}
                  </Typography>

                  {actionType === 'approve-cancel' ? (
                    <>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        <strong>Cancellation Reason:</strong> {selectedRequest.cancellationReason}
                      </Typography>
                      <Alert severity="warning">
                        Approving this will cancel the employee's approved leave and restore their leave balance.
                      </Alert>
                    </>
                  ) : (
                    <>
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        <strong>Modification Reason:</strong> {selectedRequest.modificationReason}
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2">Requested Changes:</Typography>
                        {selectedRequest.newStartDate && (
                          <Typography variant="body2">• New Start Date: {dayjs(selectedRequest.newStartDate).format('MMM DD, YYYY')}</Typography>
                        )}
                        {selectedRequest.newEndDate && (
                          <Typography variant="body2">• New End Date: {dayjs(selectedRequest.newEndDate).format('MMM DD, YYYY')}</Typography>
                        )}
                        {selectedRequest.newLeaveType && (
                          <Typography variant="body2">• New Leave Type: {getLeaveTypeLabel(selectedRequest.newLeaveType)}</Typography>
                        )}
                        {selectedRequest.newReason && (
                          <Typography variant="body2">• New Reason: {selectedRequest.newReason}</Typography>
                        )}
                      </Box>
                      <Alert severity="info">
                        Approving this will update the original leave request with the new details.
                      </Alert>
                    </>
                  )}
                </>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setActionDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (actionType === 'approve-cancel') {
                  handleApproveCancellation(selectedRequest.id);
                } else {
                  handleApproveModification(selectedRequest.id);
                }
              }}
              variant="contained"
              color="success"
            >
              Approve
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default AdvancedRequestsPage;