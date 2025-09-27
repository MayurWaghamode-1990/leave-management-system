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
  Paper
} from '@mui/material';
import {
  Add,
  PersonAdd,
  Cancel,
  CheckCircle,
  Schedule,
  People
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import toast from 'react-hot-toast';

import api from '@/config/api';
import { useAuth } from '@/hooks/useAuth';

interface LeaveDelegation {
  id: string;
  delegatorId: string;
  delegateId: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  reason: string;
  createdAt: string;
  revokedAt?: string;
  revokedBy?: string;
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

const mockUsers = [
  { id: '1', name: 'Admin User', role: 'HR_ADMIN' },
  { id: '2', name: 'Manager User', role: 'MANAGER' },
  { id: '3', name: 'Employee User', role: 'EMPLOYEE' },
  { id: '4', name: 'John Doe', role: 'EMPLOYEE' },
  { id: '5', name: 'Jane Smith', role: 'EMPLOYEE' },
  { id: '6', name: 'Bob Wilson', role: 'EMPLOYEE' }
];

const DelegationsPage: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [delegations, setDelegations] = useState<{
    given: LeaveDelegation[];
    received: LeaveDelegation[];
  }>({ given: [], received: [] });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    delegateId: '',
    startDate: null as Dayjs | null,
    endDate: null as Dayjs | null,
    reason: ''
  });

  const isManager = user?.role === 'MANAGER' || user?.role === 'HR_ADMIN';

  useEffect(() => {
    fetchDelegations();
  }, []);

  const fetchDelegations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/leaves/delegations');
      if (response.data.success) {
        setDelegations(response.data.data);
      }
    } catch (error: any) {
      toast.error('Failed to fetch delegations');
      console.error('Error fetching delegations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDelegation = async () => {
    try {
      if (!formData.delegateId || !formData.startDate || !formData.endDate || !formData.reason) {
        toast.error('Please fill all required fields');
        return;
      }

      const delegationData = {
        delegateId: formData.delegateId,
        startDate: formData.startDate.format('YYYY-MM-DD'),
        endDate: formData.endDate.format('YYYY-MM-DD'),
        reason: formData.reason
      };

      const response = await api.post('/leaves/delegations', delegationData);

      if (response.data.success) {
        toast.success('Delegation created successfully');
        setDialogOpen(false);
        resetForm();
        fetchDelegations();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create delegation');
    }
  };

  const handleRevokeDelegation = async (delegationId: string) => {
    if (!confirm('Are you sure you want to revoke this delegation?')) return;

    try {
      const response = await api.post(`/leaves/delegations/${delegationId}/revoke`);
      if (response.data.success) {
        toast.success('Delegation revoked successfully');
        fetchDelegations();
      }
    } catch (error: any) {
      toast.error('Failed to revoke delegation');
    }
  };

  const resetForm = () => {
    setFormData({
      delegateId: '',
      startDate: null,
      endDate: null,
      reason: ''
    });
  };

  const getUserName = (userId: string) => {
    const userObj = mockUsers.find(u => u.id === userId);
    return userObj?.name || 'Unknown User';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'EXPIRED': return 'warning';
      case 'REVOKED': return 'error';
      default: return 'default';
    }
  };

  const renderDelegationCard = (delegation: LeaveDelegation, type: 'given' | 'received') => (
    <Grid item xs={12} md={6} key={delegation.id}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              {type === 'given' ? 'Delegated to' : 'Received from'}: {' '}
              {type === 'given'
                ? getUserName(delegation.delegateId)
                : getUserName(delegation.delegatorId)
              }
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip
                label={delegation.status}
                color={getStatusColor(delegation.status) as any}
                size="small"
              />
              {type === 'given' && delegation.status === 'ACTIVE' && (
                <Tooltip title="Revoke Delegation">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRevokeDelegation(delegation.id)}
                  >
                    <Cancel />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>

          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Period:</strong> {dayjs(delegation.startDate).format('MMM DD, YYYY')} - {dayjs(delegation.endDate).format('MMM DD, YYYY')}
          </Typography>

          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Reason:</strong> {delegation.reason}
          </Typography>

          <Typography variant="caption" color="textSecondary">
            Created: {dayjs(delegation.createdAt).format('MMM DD, YYYY')}
          </Typography>

          {delegation.revokedAt && (
            <Typography variant="caption" color="error" sx={{ display: 'block' }}>
              Revoked: {dayjs(delegation.revokedAt).format('MMM DD, YYYY')}
            </Typography>
          )}
        </CardContent>
      </Card>
    </Grid>
  );

  const eligibleDelegates = mockUsers.filter(u =>
    u.id !== user?.id &&
    (u.role === 'MANAGER' || u.role === 'HR_ADMIN')
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <People />
              Leave Delegations
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Delegate leave approval authority to other managers temporarily
            </Typography>
          </Box>
          {isManager && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}
            >
              Create Delegation
            </Button>
          )}
        </Box>

        {!isManager && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Only managers and HR admins can create delegations. You can view delegations received from others.
          </Alert>
        )}

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={currentTab}
            onChange={(e, newValue) => setCurrentTab(newValue)}
            indicatorColor="primary"
            textColor="primary"
          >
            {isManager && <Tab label="Delegations Given" icon={<PersonAdd />} />}
            <Tab label="Delegations Received" icon={<CheckCircle />} />
          </Tabs>
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Given Delegations Tab */}
            {isManager && (
              <TabPanel value={currentTab} index={0}>
                {delegations.given.length === 0 ? (
                  <Alert severity="info">
                    No delegations created yet. Create a delegation to temporarily assign your approval authority to another manager.
                  </Alert>
                ) : (
                  <Grid container spacing={3}>
                    {delegations.given.map(delegation =>
                      renderDelegationCard(delegation, 'given')
                    )}
                  </Grid>
                )}
              </TabPanel>
            )}

            {/* Received Delegations Tab */}
            <TabPanel value={currentTab} index={isManager ? 1 : 0}>
              {delegations.received.length === 0 ? (
                <Alert severity="info">
                  No delegations received. When someone delegates their approval authority to you, it will appear here.
                </Alert>
              ) : (
                <Grid container spacing={3}>
                  {delegations.received.map(delegation =>
                    renderDelegationCard(delegation, 'received')
                  )}
                </Grid>
              )}
            </TabPanel>
          </>
        )}

        {/* Create Delegation Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create New Delegation</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Alert severity="info">
                Delegate your leave approval authority to another manager or HR admin for a specific period.
              </Alert>

              <TextField
                select
                label="Delegate To"
                value={formData.delegateId}
                onChange={(e) => setFormData({ ...formData, delegateId: e.target.value })}
                required
                fullWidth
              >
                {eligibleDelegates.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </MenuItem>
                ))}
              </TextField>

              <DatePicker
                label="Start Date"
                value={formData.startDate}
                onChange={(date) => setFormData({ ...formData, startDate: date })}
                slotProps={{ textField: { fullWidth: true, required: true } }}
              />

              <DatePicker
                label="End Date"
                value={formData.endDate}
                onChange={(date) => setFormData({ ...formData, endDate: date })}
                slotProps={{ textField: { fullWidth: true, required: true } }}
              />

              <TextField
                label="Reason for Delegation"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                required
                multiline
                rows={3}
                fullWidth
                placeholder="e.g., Going on vacation, need coverage for approvals"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateDelegation} variant="contained">
              Create Delegation
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default DelegationsPage;