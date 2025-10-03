import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Paper
} from '@mui/material';
import {
  AccountBalance,
  TrendingUp,
  Schedule,
  Warning,
  CheckCircle,
  Cancel,
  Visibility,
  CalendarToday,
  AccessTime,
  Assignment,
  Assessment
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

import api from '@/config/api';

interface CompOffBalance {
  year: number;
  totalEarned: number;
  totalUsed: number;
  available: number;
  expired: number;
  expiringThisMonth: number;
  expiringNext30Days: number;
}

interface CompOffTransaction {
  id: string;
  type: 'EARNED' | 'USED' | 'EXPIRED';
  hoursWorked?: number;
  hoursUsed?: number;
  hoursExpired?: number;
  workDate?: string;
  usageDate?: string;
  expiryDate?: string;
  reason?: string;
  status: string;
  workType?: string;
  createdAt: string;
}

interface CompOffRequest {
  id: string;
  hoursToRedeem: number;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  approvedAt?: string;
  expiryDate?: string;
  workLog: {
    workDate: string;
    workType: string;
    hoursWorked: number;
  };
}

const CompOffBalancePage: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [tabValue, setTabValue] = useState(0);
  const [balance, setBalance] = useState<CompOffBalance | null>(null);
  const [transactions, setTransactions] = useState<CompOffTransaction[]>([]);
  const [requests, setRequests] = useState<CompOffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<CompOffTransaction | null>(null);

  const availableYears = [2023, 2024, 2025];

  useEffect(() => {
    fetchBalanceData();
    fetchTransactions();
    fetchRequests();
  }, [selectedYear]);

  const fetchBalanceData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/comp-off/balance?year=${selectedYear}`);
      setBalance(response.data.data);
    } catch (error: any) {
      toast.error('Failed to fetch comp off balance');
      console.error('Balance fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      // Mock transaction data - in real implementation, add API endpoint
      const mockTransactions: CompOffTransaction[] = [
        {
          id: '1',
          type: 'EARNED',
          hoursWorked: 8,
          workDate: '2024-09-15',
          reason: 'Weekend project work',
          status: 'VERIFIED',
          workType: 'WEEKEND',
          createdAt: '2024-09-16T10:00:00Z'
        },
        {
          id: '2',
          type: 'USED',
          hoursUsed: 8,
          usageDate: '2024-09-20',
          reason: 'Personal work',
          status: 'APPROVED',
          createdAt: '2024-09-18T14:30:00Z'
        },
        {
          id: '3',
          type: 'EXPIRED',
          hoursExpired: 4,
          expiryDate: '2024-09-25',
          reason: 'Not used within 3 months',
          status: 'EXPIRED',
          createdAt: '2024-06-25T00:00:00Z'
        }
      ];
      setTransactions(mockTransactions);
    } catch (error: any) {
      console.error('Transactions fetch error:', error);
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await api.get('/comp-off/requests');
      setRequests(response.data.data.requests || []);
    } catch (error: any) {
      console.error('Requests fetch error:', error);
    }
  };

  const handleViewTransaction = (transaction: CompOffTransaction) => {
    setSelectedTransaction(transaction);
    setDetailDialogOpen(true);
  };

  const getBalanceData = () => {
    if (!balance) return [];

    return [
      { name: 'Available', value: balance.available, color: '#4caf50' },
      { name: 'Used', value: balance.totalUsed, color: '#2196f3' },
      { name: 'Expired', value: balance.expired, color: '#f44336' }
    ];
  };

  const getMonthlyTrendData = () => {
    // Mock monthly trend data
    return [
      { month: 'Jan', earned: 8, used: 0, expired: 0 },
      { month: 'Feb', earned: 0, used: 8, expired: 0 },
      { month: 'Mar', earned: 12, used: 4, expired: 0 },
      { month: 'Apr', earned: 0, used: 8, expired: 4 },
      { month: 'May', earned: 8, used: 0, expired: 0 },
      { month: 'Jun', earned: 0, used: 0, expired: 8 }
    ];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'VERIFIED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'REJECTED':
      case 'EXPIRED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'EARNED':
        return 'success';
      case 'USED':
        return 'info';
      case 'EXPIRED':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatHours = (hours: number) => {
    return `${hours}h`;
  };

  if (loading && !balance) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Comp Off Balance
        </Typography>
        <LinearProgress sx={{ mb: 2 }} />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          <AccountBalance sx={{ mr: 1, verticalAlign: 'middle' }} />
          Comp Off Balance
        </Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Year</InputLabel>
          <Select
            value={selectedYear}
            label="Year"
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {availableYears.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Balance Overview Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <CheckCircle color="success" sx={{ mr: 1 }} />
                <Typography variant="h6" color="success.main">
                  {formatHours(balance?.available || 0)}
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Available Balance
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <TrendingUp color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" color="primary">
                  {formatHours(balance?.totalEarned || 0)}
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Total Earned
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Assignment color="info" sx={{ mr: 1 }} />
                <Typography variant="h6" color="info.main">
                  {formatHours(balance?.totalUsed || 0)}
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Total Used
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Warning color="error" sx={{ mr: 1 }} />
                <Typography variant="h6" color="error.main">
                  {formatHours(balance?.expired || 0)}
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Expired
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Expiration Alerts */}
      {balance && balance.expiringNext30Days > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>{formatHours(balance.expiringNext30Days)}</strong> of comp off will expire in the next 30 days.
            Please plan to use them before they expire.
          </Typography>
        </Alert>
      )}

      {/* Charts Section */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Balance Distribution
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getBalanceData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${formatHours(value)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getBalanceData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => formatHours(value as number)} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Trend
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getMonthlyTrendData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip formatter={(value) => formatHours(value as number)} />
                    <Line type="monotone" dataKey="earned" stroke="#4caf50" name="Earned" />
                    <Line type="monotone" dataKey="used" stroke="#2196f3" name="Used" />
                    <Line type="monotone" dataKey="expired" stroke="#f44336" name="Expired" />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Tables */}
      <Card>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          variant="fullWidth"
        >
          <Tab label="Transaction History" />
          <Tab label="Active Requests" />
          <Tab label="Expiration Tracker" />
        </Tabs>

        <CardContent>
          {/* Transaction History Tab */}
          {tabValue === 0 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Hours</TableCell>
                    <TableCell>Work Type</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {dayjs(transaction.workDate || transaction.usageDate || transaction.expiryDate).format('MMM DD, YYYY')}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={transaction.type}
                          color={getTransactionTypeColor(transaction.type) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {formatHours(
                          transaction.hoursWorked ||
                          transaction.hoursUsed ||
                          transaction.hoursExpired ||
                          0
                        )}
                      </TableCell>
                      <TableCell>
                        {transaction.workType || '-'}
                      </TableCell>
                      <TableCell>
                        {transaction.reason || '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={transaction.status}
                          color={getStatusColor(transaction.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewTransaction(transaction)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Active Requests Tab */}
          {tabValue === 1 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Request Date</TableCell>
                    <TableCell>Hours</TableCell>
                    <TableCell>Leave Dates</TableCell>
                    <TableCell>Work Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Expiry Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        {dayjs(request.startDate).format('MMM DD, YYYY')}
                      </TableCell>
                      <TableCell>
                        {formatHours(request.hoursToRedeem)}
                      </TableCell>
                      <TableCell>
                        {dayjs(request.startDate).format('MMM DD')} - {dayjs(request.endDate).format('MMM DD, YYYY')}
                      </TableCell>
                      <TableCell>
                        {dayjs(request.workLog.workDate).format('MMM DD, YYYY')}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={request.status}
                          color={getStatusColor(request.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {request.expiryDate ? dayjs(request.expiryDate).format('MMM DD, YYYY') : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Expiration Tracker Tab */}
          {tabValue === 2 && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Track your comp off expiration dates to ensure you don't lose earned hours.
              </Alert>
              <Typography variant="h6" gutterBottom>
                Expiration Summary
              </Typography>
              <Grid container spacing={2} mb={3}>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">
                      {formatHours(balance?.expiringThisMonth || 0)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Expiring This Month
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="error.main">
                      {formatHours(balance?.expiringNext30Days || 0)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Expiring Next 30 Days
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Transaction Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Transaction Details
        </DialogTitle>
        <DialogContent dividers>
          {selectedTransaction && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography><strong>Type:</strong> {selectedTransaction.type}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography><strong>Hours:</strong> {formatHours(
                  selectedTransaction.hoursWorked ||
                  selectedTransaction.hoursUsed ||
                  selectedTransaction.hoursExpired ||
                  0
                )}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography><strong>Date:</strong> {dayjs(
                  selectedTransaction.workDate ||
                  selectedTransaction.usageDate ||
                  selectedTransaction.expiryDate
                ).format('MMMM DD, YYYY')}</Typography>
              </Grid>
              {selectedTransaction.workType && (
                <Grid item xs={12}>
                  <Typography><strong>Work Type:</strong> {selectedTransaction.workType}</Typography>
                </Grid>
              )}
              <Grid item xs={12}>
                <Typography><strong>Reason:</strong> {selectedTransaction.reason || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography><strong>Status:</strong>
                  <Chip
                    label={selectedTransaction.status}
                    color={getStatusColor(selectedTransaction.status) as any}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Typography>
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
  );
};

export default CompOffBalancePage;