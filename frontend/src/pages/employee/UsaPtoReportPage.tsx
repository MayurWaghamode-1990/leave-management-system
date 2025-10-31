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
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  Button
} from '@mui/material';
import {
  Download as DownloadIcon,
  TrendingUp as TrendingUpIcon,
  CalendarMonth as CalendarIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { UsaPtoReport } from '../../types/usaPto';
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

const UsaPtoReportPage: React.FC = () => {
  const [report, setReport] = useState<UsaPtoReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [tabValue, setTabValue] = useState(0);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`/api/v1/usa-pto/report`, {
        params: { year: selectedYear }
      });
      setReport(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch PTO report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedYear]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    alert('Export functionality coming soon!');
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!report) return null;

  const usagePercentage = report.accrual.total > 0
    ? (report.accrual.used / report.accrual.total) * 100
    : 0;

  const carryForwardExpiryDate = report.carryForward.expiryDate
    ? new Date(report.carryForward.expiryDate)
    : null;

  const daysUntilExpiry = carryForwardExpiryDate
    ? Math.ceil((carryForwardExpiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          🇺🇸 USA PTO Report
        </Typography>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
        >
          Export Report
        </Button>
      </Box>

      {/* Year Selector */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Box display="flex" gap={2} alignItems="center">
          <Typography variant="body1">Select Year:</Typography>
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

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        {/* Total Available */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Total Available
              </Typography>
              <Typography variant="h4" component="div" color="primary">
                {report.accrual.total.toFixed(1)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                days
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Used */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Used
              </Typography>
              <Typography variant="h4" component="div" color="error.main">
                {report.accrual.used.toFixed(1)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                days ({usagePercentage.toFixed(0)}%)
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Balance */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Balance
              </Typography>
              <Typography variant="h4" component="div" color="success.main">
                {report.accrual.balance.toFixed(1)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                days
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Carry Forward */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Carry Forward
              </Typography>
              <Typography variant="h4" component="div" color="secondary.main">
                {report.carryForward.remaining.toFixed(1)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                of {report.carryForward.amount.toFixed(1)} days
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pro-rated Info */}
      {report.accrual.proRated && (
        <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
          Your PTO was pro-rated based on your mid-year joining date.
        </Alert>
      )}

      {/* Carry Forward Expiry Warning */}
      {daysUntilExpiry !== null && daysUntilExpiry <= 60 && report.carryForward.remaining > 0 && (
        <Alert
          severity={daysUntilExpiry <= 30 ? 'warning' : 'info'}
          icon={<CalendarIcon />}
          sx={{ mb: 3 }}
        >
          <Typography variant="body2">
            <strong>{report.carryForward.remaining.toFixed(1)} carry-forward days</strong> will expire on{' '}
            <strong>{carryForwardExpiryDate?.toLocaleDateString()}</strong>
            {' '}({daysUntilExpiry} days remaining)
          </Typography>
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Accrual Breakdown" />
          <Tab label="Carry Forward Details" />
          <Tab label="Leave History" />
        </Tabs>
      </Paper>

      {/* Tab Panel 1: Accrual Breakdown */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon color="primary" />
                Annual Accrual
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" justifyContent="space-between">
                  <Typography color="text.secondary">Annual Allocation:</Typography>
                  <Typography fontWeight="bold">{report.accrual.annual} days</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography color="text.secondary">Carry Forward:</Typography>
                  <Typography fontWeight="bold">{report.accrual.carryForward} days</Typography>
                </Box>
                <Divider />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="subtitle1" fontWeight="bold">Total Entitlement:</Typography>
                  <Typography variant="subtitle1" fontWeight="bold" color="primary">
                    {report.accrual.total} days
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Usage Summary
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" justifyContent="space-between">
                  <Typography color="text.secondary">Used:</Typography>
                  <Typography color="error.main" fontWeight="bold">
                    {report.accrual.used} days
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography color="text.secondary">Remaining:</Typography>
                  <Typography color="success.main" fontWeight="bold">
                    {report.accrual.balance} days
                  </Typography>
                </Box>
                <Divider />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="subtitle1" fontWeight="bold">Usage Rate:</Typography>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {usagePercentage.toFixed(1)}%
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Tab Panel 2: Carry Forward Details */}
      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Carry Forward from {selectedYear - 1}
          </Typography>
          <Divider sx={{ my: 2 }} />

          {report.carryForward.status === 'N/A' ? (
            <Alert severity="info">No carry-forward balance for this year.</Alert>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography color="text.secondary">Carried Forward:</Typography>
                    <Typography fontWeight="bold">{report.carryForward.amount} days</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography color="text.secondary">Used:</Typography>
                    <Typography color="error.main">-{report.carryForward.used} days</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography color="text.secondary">Expired:</Typography>
                    <Typography color="warning.main">-{report.carryForward.expired} days</Typography>
                  </Box>
                  <Divider />
                  <Box display="flex" justifyContent="space-between">
                    <Typography fontWeight="bold">Remaining:</Typography>
                    <Typography fontWeight="bold" color="success.main">
                      {report.carryForward.remaining} days
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography color="text.secondary">Status:</Typography>
                    <Chip
                      label={report.carryForward.status}
                      color={
                        report.carryForward.status === 'ACTIVE'
                          ? 'success'
                          : report.carryForward.status === 'EXPIRED'
                          ? 'error'
                          : 'default'
                      }
                      size="small"
                    />
                  </Box>
                  {carryForwardExpiryDate && (
                    <Box display="flex" justifyContent="space-between">
                      <Typography color="text.secondary">Expiry Date:</Typography>
                      <Typography fontWeight="bold">
                        {carryForwardExpiryDate.toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}
                  {daysUntilExpiry !== null && daysUntilExpiry > 0 && (
                    <Box display="flex" justifyContent="space-between">
                      <Typography color="text.secondary">Days Until Expiry:</Typography>
                      <Typography
                        fontWeight="bold"
                        color={daysUntilExpiry <= 30 ? 'warning.main' : 'text.primary'}
                      >
                        {daysUntilExpiry} days
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>
          )}
        </Paper>
      </TabPanel>

      {/* Tab Panel 3: Leave History */}
      <TabPanel value={tabValue} index={2}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell align="center">Days</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {report.leaveRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography color="text.secondary">No leave requests for this year</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                report.leaveRequests.map((leave) => (
                  <TableRow key={leave.id}>
                    <TableCell>{new Date(leave.startDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(leave.endDate).toLocaleDateString()}</TableCell>
                    <TableCell align="center">{leave.totalDays}</TableCell>
                    <TableCell>
                      <Chip
                        label={leave.status}
                        size="small"
                        color={
                          leave.status === 'APPROVED'
                            ? 'success'
                            : leave.status === 'PENDING'
                            ? 'warning'
                            : leave.status === 'REJECTED'
                            ? 'error'
                            : 'default'
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>
    </Container>
  );
};

export default UsaPtoReportPage;
