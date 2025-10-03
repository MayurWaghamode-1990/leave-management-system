import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  LinearProgress,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Alert
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Visibility,
  Schedule,
  People,
  CalendarMonth
} from '@mui/icons-material';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

import api from '@/config/api';
import { LeaveType, LeaveStatus } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useApprovals, ApprovalRequest } from '@/contexts/ApprovalsContext';
import TeamCalendarView from '@/components/approvals/TeamCalendarView';


const ApprovalsPage: React.FC = () => {
  const { user } = useAuth();
  const { requests: teamRequests, pendingCount, approvedCount, rejectedCount, loading, refreshRequests } = useApprovals();
  const [actionLoading, setActionLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'approve' | 'reject'>('view');
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [comments, setComments] = useState('');
  const [tabValue, setTabValue] = useState(0);

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


  const handleViewRequest = (request: ApprovalRequest) => {
    setDialogMode('view');
    setSelectedRequest(request);
    setComments('');
    setOpenDialog(true);
  };

  const handleApproveClick = (request: ApprovalRequest) => {
    setDialogMode('approve');
    setSelectedRequest(request);
    setComments('');
    setOpenDialog(true);
  };

  const handleRejectClick = (request: ApprovalRequest) => {
    setDialogMode('reject');
    setSelectedRequest(request);
    setComments('');
    setOpenDialog(true);
  };

  const handleApproveRequest = async () => {
    if (!selectedRequest) return;

    try {
      setActionLoading(true);
      await api.patch(`/leaves/${selectedRequest.id}/approve`, {
        comments: comments.trim() || undefined
      });
      toast.success('Leave request approved successfully');
      setOpenDialog(false);
      refreshRequests();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to approve request';
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest) return;

    if (!comments.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setActionLoading(true);
      await api.patch(`/leaves/${selectedRequest.id}/reject`, {
        comments: comments.trim()
      });
      toast.success('Leave request rejected successfully');
      setOpenDialog(false);
      refreshRequests();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to reject request';
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const getFilteredRequests = () => {
    switch (tabValue) {
      case 1:
        return teamRequests.filter(req => req.status === LeaveStatus.PENDING);
      case 2:
        return teamRequests.filter(req => req.status === LeaveStatus.APPROVED);
      case 3:
        return teamRequests.filter(req => req.status === LeaveStatus.REJECTED);
      default:
        return teamRequests;
    }
  };


  // Check if user has manager or admin role
  if (!user || (user.role !== 'MANAGER' && user.role !== 'HR_ADMIN')) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Alert severity="warning">
          <Typography>
            Access Denied. This page is only available to Managers and HR Administrators.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Team Leave Approvals
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <Chip
            icon={<Schedule />}
            label={`${pendingCount} Pending`}
            color="warning"
            variant="outlined"
          />
          <Chip
            icon={<People />}
            label={`${teamRequests.length} Total Requests`}
            color="primary"
            variant="outlined"
          />
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Tabs for filtering */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          variant="fullWidth"
        >
          <Tab label={`All (${teamRequests.length})`} />
          <Tab label={`Pending (${pendingCount})`} />
          <Tab label={`Approved (${approvedCount})`} />
          <Tab label={`Rejected (${rejectedCount})`} />
          <Tab
            icon={<CalendarMonth />}
            label="Team Calendar"
            sx={{ minHeight: 48 }}
          />
        </Tabs>
      </Card>

      {/* Content based on selected tab */}
      {tabValue === 4 ? (
        // Calendar View
        <TeamCalendarView />
      ) : (
        // Team Requests Table
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {tabValue === 1 && 'Pending Approval Requests'}
              {tabValue === 2 && 'Approved Requests'}
              {tabValue === 3 && 'Rejected Requests'}
              {tabValue === 0 && 'All Team Leave Requests'}
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Leave Type</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell>End Date</TableCell>
                    <TableCell>Days</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Applied Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getFilteredRequests().map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        Employee {request.employeeId === '1' ? 'Admin User' : 'John Doe'}
                      </TableCell>
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
                      <TableCell>{dayjs(request.appliedDate).format('MMM DD, YYYY')}</TableCell>
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
                              <Tooltip title="Approve">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleApproveClick(request)}
                                >
                                  <CheckCircle />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Reject">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleRejectClick(request)}
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
                  {getFilteredRequests().length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography variant="body2" color="textSecondary">
                          No leave requests found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Approval Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'view' && 'Leave Request Details'}
          {dialogMode === 'approve' && 'Approve Leave Request'}
          {dialogMode === 'reject' && 'Reject Leave Request'}
        </DialogTitle>
        <DialogContent dividers>
          {selectedRequest && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography><strong>Employee:</strong> {
                    selectedRequest.employeeId === '1' ? 'Admin User' : 'John Doe'
                  }</Typography>
                </Grid>
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

              {dialogMode !== 'view' && (
                <Box sx={{ mt: 3 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label={dialogMode === 'approve' ? 'Comments (Optional)' : 'Reason for Rejection *'}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    required={dialogMode === 'reject'}
                    helperText={
                      dialogMode === 'approve'
                        ? 'Add any comments for the employee'
                        : 'Please provide a reason for rejecting this request'
                    }
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Cancel
          </Button>
          {dialogMode === 'approve' && (
            <Button
              variant="contained"
              color="success"
              onClick={handleApproveRequest}
              disabled={actionLoading}
              startIcon={<CheckCircle />}
            >
              Approve Request
            </Button>
          )}
          {dialogMode === 'reject' && (
            <Button
              variant="contained"
              color="error"
              onClick={handleRejectRequest}
              disabled={actionLoading || !comments.trim()}
              startIcon={<Cancel />}
            >
              Reject Request
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApprovalsPage;