import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  PlayArrow as TriggerIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  TrendingUp as AccrualIcon,
  CalendarMonth as CarryForwardIcon,
  Schedule as ExpiryIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import {
  UsaPtoSystemStatus,
  UsaPtoAccrualSummary,
  UsaPtoCarryForwardSummary,
  UsaPtoPolicy
} from '../../types/usaPto';
import axios from 'axios';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index} style={{ marginTop: 24 }}>
      {value === index && children}
    </div>
  );
};

const UsaPtoManagementPage: React.FC = () => {
  const [status, setStatus] = useState<UsaPtoSystemStatus | null>(null);
  const [accruals, setAccruals] = useState<UsaPtoAccrualSummary | null>(null);
  const [carryForwards, setCarryForwards] = useState<UsaPtoCarryForwardSummary | null>(null);
  const [policies, setPolicies] = useState<UsaPtoPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Dialog states
  const [triggerDialogOpen, setTriggerDialogOpen] = useState(false);
  const [triggerType, setTriggerType] = useState<'accrual' | 'carryForward' | 'expiry'>('accrual');
  const [triggerYear, setTriggerYear] = useState(new Date().getFullYear());
  const [triggering, setTriggering] = useState(false);

  const fetchStatus = async () => {
    try {
      const response = await axios.get('/api/v1/usa-pto/status');
      setStatus(response.data.data);
    } catch (err: any) {
      console.error('Failed to fetch status:', err);
    }
  };

  const fetchAccruals = async (year: number) => {
    try {
      const response = await axios.get(`/api/v1/usa-pto/accruals/${year}`);
      setAccruals(response.data.data);
    } catch (err: any) {
      console.error('Failed to fetch accruals:', err);
    }
  };

  const fetchCarryForwards = async (year: number) => {
    try {
      const response = await axios.get(`/api/v1/usa-pto/carry-forwards/${year}`);
      setCarryForwards(response.data.data);
    } catch (err: any) {
      console.error('Failed to fetch carry-forwards:', err);
    }
  };

  const fetchPolicies = async () => {
    try {
      const response = await axios.get('/api/v1/usa-pto/policies');
      setPolicies(response.data.data);
    } catch (err: any) {
      console.error('Failed to fetch policies:', err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([
        fetchStatus(),
        fetchAccruals(selectedYear),
        fetchCarryForwards(selectedYear),
        fetchPolicies()
      ]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleTriggerOpen = (type: 'accrual' | 'carryForward' | 'expiry') => {
    setTriggerType(type);
    setTriggerYear(selectedYear);
    setTriggerDialogOpen(true);
  };

  const handleTriggerClose = () => {
    setTriggerDialogOpen(false);
    setTriggering(false);
  };

  const handleTrigger = async () => {
    try {
      setTriggering(true);
      setError(null);

      const endpoints = {
        accrual: '/api/v1/usa-pto/accrual/trigger',
        carryForward: '/api/v1/usa-pto/carry-forward/trigger',
        expiry: '/api/v1/usa-pto/expiry/trigger'
      };

      const response = await axios.post(endpoints[triggerType], { year: triggerYear });

      alert(response.data.message || 'Process triggered successfully!');
      handleTriggerClose();
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to trigger process');
      setTriggering(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          🇺🇸 USA PTO Management
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchData}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<SettingsIcon />}
            href="#policies"
          >
            Manage Policies
          </Button>
        </Box>
      </Box>

      {/* System Status Cards */}
      {status && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  USA Employees
                </Typography>
                <Typography variant="h3" component="div" color="primary">
                  {status.usaEmployees}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Active Policies
                </Typography>
                <Typography variant="h3" component="div">
                  {status.activePolicies}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Accrual Records
                </Typography>
                <Typography variant="h3" component="div">
                  {status.accrualRecords}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Year {status.currentYear}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Active Carry-Forwards
                </Typography>
                <Typography variant="h3" component="div" color="secondary">
                  {status.activeCarryForwards}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Scheduled Jobs Info */}
      {status && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Scheduled Jobs
          </Typography>
          <Grid container spacing={2}>
            {status.scheduledJobs.map((job, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {job.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {job.schedule}
                  </Typography>
                  <Chip label={job.cron} size="small" variant="outlined" />
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Manual Triggers */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Manual Triggers (For Testing)
        </Typography>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <strong>Caution:</strong> These manual triggers are for testing only. Production accruals run automatically on schedule.
        </Alert>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<AccrualIcon />}
            onClick={() => handleTriggerOpen('accrual')}
          >
            Trigger Annual Accrual
          </Button>
          <Button
            variant="outlined"
            startIcon={<CarryForwardIcon />}
            onClick={() => handleTriggerOpen('carryForward')}
          >
            Trigger Carry-Forward
          </Button>
          <Button
            variant="outlined"
            startIcon={<ExpiryIcon />}
            onClick={() => handleTriggerOpen('expiry')}
          >
            Trigger Q1 Expiry
          </Button>
        </Box>
      </Paper>

      {/* Year Selector */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Box display="flex" gap={2} alignItems="center">
          <Typography variant="body1">View Data For Year:</Typography>
          {[2023, 2024, 2025, 2026].map((year) => (
            <Chip
              key={year}
              label={year}
              onClick={() => setSelectedYear(year)}
              color={selectedYear === year ? 'primary' : 'default'}
              variant={selectedYear === year ? 'filled' : 'outlined'}
            />
          ))}
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Accrual Records" />
          <Tab label="Carry-Forwards" />
          <Tab label="PTO Policies" />
        </Tabs>
      </Paper>

      {/* Tab Panel 1: Accrual Records */}
      <TabPanel value={tabValue} index={0}>
        {accruals && (
          <>
            {/* Summary */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Accrual Summary for {selectedYear}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={2}>
                  <Typography variant="caption" color="text.secondary">Total Employees</Typography>
                  <Typography variant="h6">{accruals.summary.totalEmployees}</Typography>
                </Grid>
                <Grid item xs={6} md={2}>
                  <Typography variant="caption" color="text.secondary">Total Accrued</Typography>
                  <Typography variant="h6">{accruals.summary.totalAccrued.toFixed(1)}</Typography>
                </Grid>
                <Grid item xs={6} md={2}>
                  <Typography variant="caption" color="text.secondary">Carry Forward</Typography>
                  <Typography variant="h6">{accruals.summary.totalCarryForward.toFixed(1)}</Typography>
                </Grid>
                <Grid item xs={6} md={2}>
                  <Typography variant="caption" color="text.secondary">Total Used</Typography>
                  <Typography variant="h6" color="error.main">{accruals.summary.totalUsed.toFixed(1)}</Typography>
                </Grid>
                <Grid item xs={6} md={2}>
                  <Typography variant="caption" color="text.secondary">Total Balance</Typography>
                  <Typography variant="h6" color="success.main">{accruals.summary.totalBalance.toFixed(1)}</Typography>
                </Grid>
                <Grid item xs={6} md={2}>
                  <Typography variant="caption" color="text.secondary">Pro-Rated</Typography>
                  <Typography variant="h6">{accruals.summary.proRatedCount}</Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* Table */}
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Designation</TableCell>
                    <TableCell align="right">Accrual</TableCell>
                    <TableCell align="right">Carry Fwd</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="right">Used</TableCell>
                    <TableCell align="right">Balance</TableCell>
                    <TableCell align="center">Pro-Rated</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {accruals.accruals.map((accrual) => (
                    <TableRow key={accrual.id}>
                      <TableCell>{accrual.employeeName}</TableCell>
                      <TableCell>{accrual.department}</TableCell>
                      <TableCell>
                        <Chip label={accrual.designation} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="right">{accrual.accrualAmount.toFixed(1)}</TableCell>
                      <TableCell align="right">{accrual.carryForwardAmount.toFixed(1)}</TableCell>
                      <TableCell align="right">{accrual.totalAvailable.toFixed(1)}</TableCell>
                      <TableCell align="right" sx={{ color: 'error.main' }}>
                        {accrual.used.toFixed(1)}
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                        {accrual.balance.toFixed(1)}
                      </TableCell>
                      <TableCell align="center">
                        {accrual.proRated ? (
                          <Tooltip title={`${accrual.proRataMonths} months worked`}>
                            <Chip label="Yes" size="small" color="info" />
                          </Tooltip>
                        ) : (
                          <Chip label="No" size="small" variant="outlined" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </TabPanel>

      {/* Tab Panel 2: Carry-Forwards */}
      <TabPanel value={tabValue} index={1}>
        {carryForwards && (
          <>
            {/* Summary */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Carry-Forward Summary for {selectedYear}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={2}>
                  <Typography variant="caption" color="text.secondary">Total Records</Typography>
                  <Typography variant="h6">{carryForwards.summary.totalCarryForwards}</Typography>
                </Grid>
                <Grid item xs={6} md={2}>
                  <Typography variant="caption" color="text.secondary">Active</Typography>
                  <Typography variant="h6" color="success.main">{carryForwards.summary.activeCount}</Typography>
                </Grid>
                <Grid item xs={6} md={2}>
                  <Typography variant="caption" color="text.secondary">Expired</Typography>
                  <Typography variant="h6" color="error.main">{carryForwards.summary.expiredCount}</Typography>
                </Grid>
                <Grid item xs={6} md={2}>
                  <Typography variant="caption" color="text.secondary">Total Days</Typography>
                  <Typography variant="h6">{carryForwards.summary.totalCarriedDays.toFixed(1)}</Typography>
                </Grid>
                <Grid item xs={6} md={2}>
                  <Typography variant="caption" color="text.secondary">Used</Typography>
                  <Typography variant="h6">{carryForwards.summary.totalUsed.toFixed(1)}</Typography>
                </Grid>
                <Grid item xs={6} md={2}>
                  <Typography variant="caption" color="text.secondary">Remaining</Typography>
                  <Typography variant="h6" color="success.main">{carryForwards.summary.totalRemaining.toFixed(1)}</Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* Table */}
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell align="center">From Year</TableCell>
                    <TableCell align="center">To Year</TableCell>
                    <TableCell align="right">Carried</TableCell>
                    <TableCell align="right">Used</TableCell>
                    <TableCell align="right">Expired</TableCell>
                    <TableCell align="right">Remaining</TableCell>
                    <TableCell>Expiry Date</TableCell>
                    <TableCell align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {carryForwards.carryForwards.map((cf, index) => (
                    <TableRow key={index}>
                      <TableCell>{cf.employeeName}</TableCell>
                      <TableCell>{cf.department}</TableCell>
                      <TableCell align="center">{cf.fromYear}</TableCell>
                      <TableCell align="center">{cf.toYear}</TableCell>
                      <TableCell align="right">{cf.carriedDays.toFixed(1)}</TableCell>
                      <TableCell align="right">{cf.used.toFixed(1)}</TableCell>
                      <TableCell align="right">{cf.expired.toFixed(1)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {cf.remaining.toFixed(1)}
                      </TableCell>
                      <TableCell>{new Date(cf.expiryDate).toLocaleDateString()}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={cf.status}
                          size="small"
                          color={
                            cf.status === 'ACTIVE'
                              ? 'success'
                              : cf.status === 'EXPIRED'
                              ? 'error'
                              : 'default'
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </TabPanel>

      {/* Tab Panel 3: Policies */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          {policies.map((policy) => (
            <Grid item xs={12} md={6} lg={4} key={policy.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {policy.designation}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Box display="flex" flexDirection="column" gap={1.5}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Annual PTO:
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {policy.annualPtoDays} days
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Max Carry-Forward:
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {policy.maxCarryForward} days
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Carry-Forward Expiry:
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {policy.carryForwardExpiry} days (Q1)
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Pro-Rata:
                      </Typography>
                      <Chip
                        label={policy.proRataCalculation ? 'Enabled' : 'Disabled'}
                        size="small"
                        color={policy.proRataCalculation ? 'success' : 'default'}
                      />
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Status:
                      </Typography>
                      <Chip
                        label={policy.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={policy.isActive ? 'success' : 'default'}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Trigger Dialog */}
      <Dialog open={triggerDialogOpen} onClose={handleTriggerClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Manual Trigger: {
            triggerType === 'accrual' ? 'Annual Accrual' :
            triggerType === 'carryForward' ? 'Year-End Carry-Forward' :
            'Q1 Expiry Check'
          }
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <strong>Warning:</strong> This will process {
              triggerType === 'accrual' ? 'annual PTO accrual for all USA employees' :
              triggerType === 'carryForward' ? 'year-end carry-forward for all employees' :
              'Q1 expiry for all carry-forward balances'
            }. Use with caution in production.
          </Alert>

          <TextField
            label="Year"
            type="number"
            value={triggerYear}
            onChange={(e) => setTriggerYear(parseInt(e.target.value))}
            fullWidth
            margin="normal"
            helperText={
              triggerType === 'accrual' ? 'Year to allocate PTO for' :
              triggerType === 'carryForward' ? 'Year to process carry-forward from' :
              'Year to check expiry for'
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleTriggerClose} disabled={triggering}>
            Cancel
          </Button>
          <Button
            onClick={handleTrigger}
            variant="contained"
            disabled={triggering}
            startIcon={triggering ? <CircularProgress size={20} /> : <TriggerIcon />}
          >
            {triggering ? 'Processing...' : 'Trigger'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UsaPtoManagementPage;
