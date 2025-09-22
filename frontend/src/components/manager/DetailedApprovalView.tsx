import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore,
  Person,
  CalendarToday,
  AccessTime,
  Comment,
  Warning,
  CheckCircle,
  Cancel,
  Schedule,
  Phone,
  Email,
  Business,
  LocationOn,
  Assignment,
  History,
  AttachFile,
  Download,
  Print,
  Share
} from '@mui/icons-material';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

import api from '@/config/api';

interface DetailedApprovalViewProps {
  open: boolean;
  onClose: () => void;
  requestId: string | null;
  onApprovalComplete: () => void;
}

interface ApprovalHistoryItem {
  id: string;
  approver: {
    name: string;
    role: string;
    avatar?: string;
  };
  action: 'APPROVED' | 'REJECTED' | 'PENDING' | 'REQUESTED_CHANGES';
  timestamp: string;
  comments?: string;
  level: number;
}

interface LeaveRequestDetail {
  id: string;
  employee: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    department: string;
    role: string;
    manager: string;
    phone?: string;
    employeeId: string;
  };
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  isHalfDay: boolean;
  halfDayPeriod?: 'MORNING' | 'AFTERNOON';
  reason: string;
  status: string;
  submittedAt: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  emergencyContact?: string;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    size: number;
    type: string;
  }>;
  delegatedTo?: {
    id: string;
    name: string;
    avatar?: string;
  };
  leaveBalance: {
    current: number;
    afterLeave: number;
    type: string;
  };
  teamImpact: {
    overlappingLeaves: Array<{
      employee: string;
      dates: string;
    }>;
    projectsAffected: string[];
    coverageArrangements?: string;
  };
  approvalChain: ApprovalHistoryItem[];
  previousRequests: Array<{
    id: string;
    dates: string;
    status: string;
    type: string;
  }>;
}

const DetailedApprovalView: React.FC<DetailedApprovalViewProps> = ({
  open,
  onClose,
  requestId,
  onApprovalComplete
}) => {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [request, setRequest] = useState<LeaveRequestDetail | null>(null);
  const [approvalAction, setApprovalAction] = useState<'APPROVE' | 'REJECT' | 'REQUEST_CHANGES'>('APPROVE');
  const [comments, setComments] = useState('');
  const [conditions, setConditions] = useState('');

  useEffect(() => {
    if (open && requestId) {
      fetchRequestDetails();
    }
  }, [open, requestId]);

  const fetchRequestDetails = async () => {
    if (!requestId) return;

    setLoading(true);
    try {
      const response = await api.get(`/leaves/${requestId}/detailed`);
      setRequest(response.data.data);
    } catch (error) {
      console.error('Failed to fetch request details:', error);
      toast.error('Failed to load request details');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalSubmit = async () => {
    if (!request) return;

    setActionLoading(true);
    try {
      await api.post(`/leaves/${request.id}/approve`, {
        action: approvalAction,
        comments,
        conditions: approvalAction === 'APPROVE' ? conditions : undefined
      });

      toast.success(`Leave request ${approvalAction.toLowerCase()}d successfully`);
      onApprovalComplete();
      onClose();
    } catch (error) {
      console.error('Failed to process approval:', error);
      toast.error('Failed to process approval');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      case 'REQUESTED_CHANGES': return 'info';
      default: return 'default';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      default: return 'default';
    }
  };

  const getDaysUntilStart = () => {
    if (!request) return 0;
    return dayjs(request.startDate).diff(dayjs(), 'day');
  };

  if (!request) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <Typography>Loading request details...</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Leave Request Details</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton size="small" onClick={() => {/* Print functionality */}}>
              <Print />
            </IconButton>
            <IconButton size="small" onClick={() => {/* Share functionality */}}>
              <Share />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Employee Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar src={request.employee.avatar} sx={{ width: 56, height: 56 }}>
                    {request.employee.name.charAt(0)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6">{request.employee.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {request.employee.role} • {request.employee.department}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ID: {request.employee.employeeId}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <List dense>
                  <ListItem>
                    <ListItemIcon><Email /></ListItemIcon>
                    <ListItemText primary={request.employee.email} />
                  </ListItem>
                  {request.employee.phone && (
                    <ListItem>
                      <ListItemIcon><Phone /></ListItemIcon>
                      <ListItemText primary={request.employee.phone} />
                    </ListItem>
                  )}
                  <ListItem>
                    <ListItemIcon><Business /></ListItemIcon>
                    <ListItemText primary={request.employee.department} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Person /></ListItemIcon>
                    <ListItemText primary={`Manager: ${request.employee.manager}`} />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Leave Request Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Leave Request Details</Typography>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Leave Type</Typography>
                    <Chip label={request.leaveType} variant="outlined" />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Status</Typography>
                    <Chip
                      label={request.status}
                      color={getStatusColor(request.status)}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Start Date</Typography>
                    <Typography>{dayjs(request.startDate).format('MMM DD, YYYY')}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">End Date</Typography>
                    <Typography>{dayjs(request.endDate).format('MMM DD, YYYY')}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Duration</Typography>
                    <Typography>
                      {request.days} day{request.days !== 1 ? 's' : ''}
                      {request.isHalfDay && ` (${request.halfDayPeriod?.toLowerCase()} half-day)`}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Urgency</Typography>
                    <Chip
                      label={request.urgency}
                      color={getUrgencyColor(request.urgency)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Reason</Typography>
                    <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                      <Typography>{request.reason}</Typography>
                    </Paper>
                  </Grid>
                  {request.emergencyContact && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2">Emergency Contact</Typography>
                      <Typography>{request.emergencyContact}</Typography>
                    </Grid>
                  )}
                </Grid>

                {getDaysUntilStart() <= 1 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      ⚠️ This leave starts {getDaysUntilStart() <= 0 ? 'today or is overdue' : 'tomorrow'}
                    </Typography>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Leave Balance Impact */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Leave Balance Impact</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Current Balance ({request.leaveBalance.type})</Typography>
                  <Typography fontWeight="bold">{request.leaveBalance.current} days</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Requested Days</Typography>
                  <Typography color="warning.main">-{request.days} days</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography fontWeight="bold">Balance After Leave</Typography>
                  <Typography
                    fontWeight="bold"
                    color={request.leaveBalance.afterLeave < 0 ? 'error' : 'success.main'}
                  >
                    {request.leaveBalance.afterLeave} days
                  </Typography>
                </Box>
                {request.leaveBalance.afterLeave < 0 && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    Insufficient leave balance! This request exceeds available leave.
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Team Impact */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Team Impact Analysis</Typography>

                {request.teamImpact.overlappingLeaves.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="warning.main">
                      Overlapping Team Leaves
                    </Typography>
                    {request.teamImpact.overlappingLeaves.map((overlap, index) => (
                      <Typography key={index} variant="body2">
                        • {overlap.employee}: {overlap.dates}
                      </Typography>
                    ))}
                  </Box>
                )}

                {request.teamImpact.projectsAffected.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="info.main">
                      Projects Affected
                    </Typography>
                    {request.teamImpact.projectsAffected.map((project, index) => (
                      <Typography key={index} variant="body2">
                        • {project}
                      </Typography>
                    ))}
                  </Box>
                )}

                {request.teamImpact.coverageArrangements && (
                  <Box>
                    <Typography variant="subtitle2">Coverage Arrangements</Typography>
                    <Typography variant="body2">{request.teamImpact.coverageArrangements}</Typography>
                  </Box>
                )}

                {request.delegatedTo && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2">Delegated To</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Avatar src={request.delegatedTo.avatar} sx={{ width: 32, height: 32 }}>
                        {request.delegatedTo.name.charAt(0)}
                      </Avatar>
                      <Typography>{request.delegatedTo.name}</Typography>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Attachments */}
          {request.attachments && request.attachments.length > 0 && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>Attachments</Typography>
                  <List>
                    {request.attachments.map((attachment) => (
                      <ListItem
                        key={attachment.id}
                        secondaryAction={
                          <IconButton onClick={() => window.open(attachment.url, '_blank')}>
                            <Download />
                          </IconButton>
                        }
                      >
                        <ListItemIcon>
                          <AttachFile />
                        </ListItemIcon>
                        <ListItemText
                          primary={attachment.name}
                          secondary={`${(attachment.size / 1024).toFixed(1)} KB • ${attachment.type}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Approval History */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Approval History</Typography>
                <Timeline>
                  {request.approvalChain.map((item, index) => (
                    <TimelineItem key={item.id}>
                      <TimelineSeparator>
                        <TimelineDot
                          color={
                            item.action === 'APPROVED' ? 'success' :
                            item.action === 'REJECTED' ? 'error' :
                            item.action === 'PENDING' ? 'warning' : 'primary'
                          }
                        >
                          {item.action === 'APPROVED' ? <CheckCircle /> :
                           item.action === 'REJECTED' ? <Cancel /> :
                           item.action === 'PENDING' ? <Schedule /> : <Comment />}
                        </TimelineDot>
                        {index < request.approvalChain.length - 1 && <TimelineConnector />}
                      </TimelineSeparator>
                      <TimelineContent>
                        <Box sx={{ mb: 1 }}>
                          <Typography fontWeight="medium">
                            {item.action} by {item.approver.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.approver.role} • Level {item.level}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {dayjs(item.timestamp).format('MMM DD, YYYY [at] HH:mm')}
                          </Typography>
                        </Box>
                        {item.comments && (
                          <Paper variant="outlined" sx={{ p: 1, mt: 1 }}>
                            <Typography variant="body2">{item.comments}</Typography>
                          </Paper>
                        )}
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              </CardContent>
            </Card>
          </Grid>

          {/* Previous Requests */}
          {request.previousRequests.length > 0 && (
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">Previous Leave Requests ({request.previousRequests.length})</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List>
                    {request.previousRequests.map((prevRequest) => (
                      <ListItem key={prevRequest.id}>
                        <ListItemIcon>
                          <History />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${prevRequest.type} - ${prevRequest.dates}`}
                          secondary={
                            <Chip
                              label={prevRequest.status}
                              color={getStatusColor(prevRequest.status)}
                              size="small"
                            />
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Box sx={{ width: '100%' }}>
          {/* Approval Form */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Action</InputLabel>
                <Select
                  value={approvalAction}
                  label="Action"
                  onChange={(e) => setApprovalAction(e.target.value as any)}
                >
                  <MenuItem value="APPROVE">Approve</MenuItem>
                  <MenuItem value="REJECT">Reject</MenuItem>
                  <MenuItem value="REQUEST_CHANGES">Request Changes</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder={
                  approvalAction === 'APPROVE' ? 'Add approval comments...' :
                  approvalAction === 'REJECT' ? 'Provide rejection reason...' :
                  'Specify required changes...'
                }
              />
            </Grid>
            {approvalAction === 'APPROVE' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Approval Conditions (Optional)"
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                  placeholder="Any specific conditions or requirements for this approval..."
                />
              </Grid>
            )}
          </Grid>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button onClick={onClose} disabled={actionLoading}>
              Cancel
            </Button>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                color={
                  approvalAction === 'APPROVE' ? 'success' :
                  approvalAction === 'REJECT' ? 'error' : 'primary'
                }
                onClick={handleApprovalSubmit}
                disabled={actionLoading || !comments.trim()}
              >
                {actionLoading ? 'Processing...' :
                 approvalAction === 'APPROVE' ? 'Approve Request' :
                 approvalAction === 'REJECT' ? 'Reject Request' : 'Request Changes'}
              </Button>
            </Box>
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default DetailedApprovalView;