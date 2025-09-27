import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Chip,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Alert,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { LWPApplicationForm } from '../../components/lwp/LWPApplicationForm';
import { api } from '../../config/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface LWPApplication {
  id: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  appliedDate: string;
  approvals: Array<{
    level: number;
    status: string;
    approver: {
      firstName: string;
      lastName: string;
      role: string;
    };
    comments?: string;
    approvedAt?: string;
  }>;
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
      id={`lwp-tabpanel-${index}`}
      aria-labelledby={`lwp-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const statusColors = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error'
} as const;

const statusIcons = {
  PENDING: <AccessTimeIcon />,
  APPROVED: <CheckCircleIcon />,
  REJECTED: <CancelIcon />
};

export const LWPPage: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [myApplications, setMyApplications] = useState<LWPApplication[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<LWPApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<LWPApplication | null>(null);

  useEffect(() => {
    fetchMyApplications();
    fetchPendingApprovals();
  }, []);

  const fetchMyApplications = async () => {
    try {
      const response = await api.get('/lwp/my-applications');
      if (response.data.success) {
        setMyApplications(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching LWP applications:', error);
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      const response = await api.get('/lwp/pending');
      if (response.data.success) {
        setPendingApprovals(response.data.data);
      }
    } catch (error) {
      // User might not have approval permissions, which is fine
      console.log('No pending approvals or insufficient permissions');
    }
  };

  const handleApplicationSuccess = () => {
    setShowApplicationForm(false);
    fetchMyApplications();
    toast.success('LWP application submitted successfully!');
  };

  const handleViewDetails = async (applicationId: string) => {
    try {
      const response = await api.get(`/lwp/${applicationId}`);
      if (response.data.success) {
        setSelectedApplication(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch application details');
    }
  };

  const handleApproval = async (applicationId: string, decision: 'APPROVED' | 'REJECTED', comments?: string) => {
    try {
      setLoading(true);
      const response = await api.put(`/lwp/${applicationId}/approve`, {
        decision,
        comments
      });

      if (response.data.success) {
        toast.success(`LWP application ${decision.toLowerCase()} successfully`);
        fetchPendingApprovals();
        fetchMyApplications();
      }
    } catch (error: any) {
      const message = error.response?.data?.message || `Failed to ${decision.toLowerCase()} application`;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const getApprovalProgress = (approvals: LWPApplication['approvals']) => {
    const totalLevels = Math.max(...approvals.map(a => a.level));
    const completedLevels = approvals.filter(a => a.status === 'APPROVED').length;
    return (completedLevels / totalLevels) * 100;
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Leave Without Pay (LWP)
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your LWP applications and approvals
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowApplicationForm(true)}
            size="large"
          >
            Apply for LWP
          </Button>
        </Box>

        {/* Information Cards */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <InfoIcon color="info" />
                  <Box>
                    <Typography variant="h6">What is LWP?</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Leave Without Pay is an extended leave option where employees take time off without salary.
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <WarningIcon color="warning" />
                  <Box>
                    <Typography variant="h6">Requirements</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Minimum 3 months employment, documentation required, enhanced approval process.
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <AccessTimeIcon color="primary" />
                  <Box>
                    <Typography variant="h6">Processing Time</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Varies by urgency: Standard (7-10 days) to Critical (same day).
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Card>
          <Tabs
            value={currentTab}
            onChange={(_, newValue) => setCurrentTab(newValue)}
            aria-label="LWP tabs"
          >
            <Tab label={`My Applications (${myApplications.length})`} />
            {pendingApprovals.length > 0 && (
              <Tab label={`Pending Approvals (${pendingApprovals.length})`} />
            )}
          </Tabs>

          <TabPanel value={currentTab} index={0}>
            {myApplications.length === 0 ? (
              <Alert severity="info" icon={<InfoIcon />}>
                You haven't applied for any LWP yet. Click "Apply for LWP" to submit your first application.
              </Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Applied Date</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Total Days</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Approval Progress</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {myApplications.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell>
                          {format(new Date(application.appliedDate), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          {format(new Date(application.startDate), 'MMM dd, yyyy')} -{' '}
                          {format(new Date(application.endDate), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>{application.totalDays}</TableCell>
                        <TableCell>
                          <Chip
                            icon={statusIcons[application.status]}
                            label={application.status}
                            color={statusColors[application.status]}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <LinearProgress
                              variant="determinate"
                              value={getApprovalProgress(application.approvals)}
                              sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                            />
                            <Typography variant="caption">
                              {application.approvals.filter(a => a.status === 'APPROVED').length}/
                              {application.approvals.length}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton
                              onClick={() => handleViewDetails(application.id)}
                              size="small"
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          {pendingApprovals.length > 0 && (
            <TabPanel value={currentTab} index={1}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Employee</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Total Days</TableCell>
                      <TableCell>Applied Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingApprovals.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {application.employee?.firstName} {application.employee?.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {application.employee?.department}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {format(new Date(application.startDate), 'MMM dd, yyyy')} -{' '}
                          {format(new Date(application.endDate), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>{application.totalDays}</TableCell>
                        <TableCell>
                          {format(new Date(application.appliedDate), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={() => handleApproval(application.id, 'APPROVED')}
                              disabled={loading}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => handleApproval(application.id, 'REJECTED')}
                              disabled={loading}
                            >
                              Reject
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleViewDetails(application.id)}
                            >
                              View
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>
          )}
        </Card>

        {/* Application Form Dialog */}
        <Dialog
          open={showApplicationForm}
          onClose={() => setShowApplicationForm(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">New LWP Application</Typography>
              <IconButton onClick={() => setShowApplicationForm(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <LWPApplicationForm
              onSuccess={handleApplicationSuccess}
              onCancel={() => setShowApplicationForm(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Application Details Dialog */}
        <Dialog
          open={!!selectedApplication}
          onClose={() => setSelectedApplication(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">LWP Application Details</Typography>
              <IconButton onClick={() => setSelectedApplication(null)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedApplication && (
              <Box>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Duration:</Typography>
                    <Typography variant="body1">
                      {format(new Date(selectedApplication.startDate), 'MMM dd, yyyy')} -{' '}
                      {format(new Date(selectedApplication.endDate), 'MMM dd, yyyy')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Total Days:</Typography>
                    <Typography variant="body1">{selectedApplication.totalDays} working days</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Reason:</Typography>
                    <Typography variant="body1">{selectedApplication.reason}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Approval Status:
                    </Typography>
                    <Paper sx={{ p: 2 }}>
                      {selectedApplication.approvals.map((approval, index) => (
                        <Box key={index} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="body2">
                            Level {approval.level}: {approval.approver.firstName} {approval.approver.lastName} ({approval.approver.role})
                          </Typography>
                          <Chip
                            icon={statusIcons[approval.status as keyof typeof statusIcons]}
                            label={approval.status}
                            color={statusColors[approval.status as keyof typeof statusColors]}
                            size="small"
                          />
                        </Box>
                      ))}
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
        </Dialog>
      </Box>
    </Container>
  );
};