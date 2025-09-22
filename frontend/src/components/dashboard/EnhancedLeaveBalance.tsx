import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  IconButton,
  Tooltip,
  Alert,
  Chip,
  LinearProgress,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  AccountBalance,
  TrendingUp,
  TrendingDown,
  Warning,
  Info,
  ExpandMore,
  History,
  CalendarMonth,
  AccessTime,
  CheckCircle
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { useAuth } from '@/hooks/useAuth';
import { LeaveType } from '@/types';
import api from '@/config/api';

interface LeaveBalance {
  id: string;
  leaveType: LeaveType;
  totalEntitlement: number;
  used: number;
  available: number;
  carryForward: number;
  pending: number;
  expiryDate?: string;
  lastUsed?: string;
  averageMonthlyUsage: number;
  projectedYearEnd: number;
  status: 'healthy' | 'warning' | 'critical';
  recommendations: string[];
}

interface BalanceHistory {
  date: string;
  type: string;
  change: number;
  reason: string;
  balance: number;
}

const EnhancedLeaveBalance: React.FC = () => {
  const { user } = useAuth();
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBalance, setSelectedBalance] = useState<LeaveBalance | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [balanceHistory, setBalanceHistory] = useState<BalanceHistory[]>([]);

  useEffect(() => {
    fetchBalanceData();
  }, []);

  const fetchBalanceData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/leaves/balances');
      setBalances(response.data.data || []);
    } catch (error) {
      console.error('Error fetching enhanced balance data:', error);
      // Fallback to mock data for demo
      setBalances(getMockBalanceData());
    } finally {
      setLoading(false);
    }
  };

  const fetchBalanceHistory = async (leaveType: LeaveType) => {
    try {
      const response = await api.get(`/leaves/balance-history/${leaveType}`);
      setBalanceHistory(response.data.data || []);
    } catch (error) {
      console.error('Error fetching balance history:', error);
      // Mock history data
      setBalanceHistory(getMockHistoryData());
    }
  };

  const getMockBalanceData = (): LeaveBalance[] => [
    {
      id: '1',
      leaveType: LeaveType.EARNED_LEAVE,
      totalEntitlement: 24,
      used: 8,
      available: 16,
      carryForward: 2,
      pending: 2,
      expiryDate: '2024-12-31',
      lastUsed: '2024-11-15',
      averageMonthlyUsage: 1.2,
      projectedYearEnd: 14,
      status: 'healthy',
      recommendations: ['Consider taking a longer break', 'Plan for year-end vacation']
    },
    {
      id: '2',
      leaveType: LeaveType.SICK_LEAVE,
      totalEntitlement: 12,
      used: 4,
      available: 8,
      carryForward: 0,
      pending: 0,
      averageMonthlyUsage: 0.8,
      projectedYearEnd: 9,
      status: 'healthy',
      recommendations: ['Good balance maintained']
    },
    {
      id: '3',
      leaveType: LeaveType.CASUAL_LEAVE,
      totalEntitlement: 12,
      used: 10,
      available: 2,
      carryForward: 0,
      pending: 1,
      lastUsed: '2024-12-10',
      averageMonthlyUsage: 1.8,
      projectedYearEnd: 0,
      status: 'warning',
      recommendations: ['Running low on casual leaves', 'Consider using earned leave instead']
    }
  ];

  const getMockHistoryData = (): BalanceHistory[] => [
    {
      date: '2024-12-10',
      type: 'Used',
      change: -1,
      reason: 'Personal work',
      balance: 2
    },
    {
      date: '2024-11-28',
      type: 'Used',
      change: -2,
      reason: 'Family event',
      balance: 3
    },
    {
      date: '2024-01-01',
      type: 'Credited',
      change: 12,
      reason: 'Annual allocation',
      balance: 12
    }
  ];

  const getLeaveTypeLabel = (type: LeaveType) => {
    const labels = {
      [LeaveType.EARNED_LEAVE]: 'Earned Leave',
      [LeaveType.SICK_LEAVE]: 'Sick Leave',
      [LeaveType.CASUAL_LEAVE]: 'Casual Leave',
      [LeaveType.MATERNITY_LEAVE]: 'Maternity Leave',
      [LeaveType.PATERNITY_LEAVE]: 'Paternity Leave',
      [LeaveType.COMPENSATORY_OFF]: 'Compensatory Off',
      [LeaveType.BEREAVEMENT_LEAVE]: 'Bereavement Leave',
      [LeaveType.MARRIAGE_LEAVE]: 'Marriage Leave'
    };
    return labels[type] || type.replace('_', ' ');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      default: return 'info';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle />;
      case 'warning': return <Warning />;
      case 'critical': return <Warning />;
      default: return <Info />;
    }
  };

  const getUtilizationPercentage = (used: number, total: number) => {
    return Math.round((used / total) * 100);
  };

  const getDaysUntilExpiry = (expiryDate?: string) => {
    if (!expiryDate) return null;
    return dayjs(expiryDate).diff(dayjs(), 'day');
  };

  const handleViewHistory = (balance: LeaveBalance) => {
    setSelectedBalance(balance);
    fetchBalanceHistory(balance.leaveType);
    setHistoryOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Enhanced Leave Balance
          </Typography>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccountBalance />
              Enhanced Leave Balance
            </Typography>
            <Button size="small" onClick={fetchBalanceData}>
              Refresh
            </Button>
          </Box>

          <Grid container spacing={2}>
            {balances.map((balance) => {
              const utilizationPercentage = getUtilizationPercentage(balance.used, balance.totalEntitlement);
              const daysUntilExpiry = getDaysUntilExpiry(balance.expiryDate);

              return (
                <Grid item xs={12} key={balance.id}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                        <Avatar
                          sx={{
                            bgcolor: getStatusColor(balance.status) + '.main',
                            width: 40,
                            height: 40
                          }}
                        >
                          {getStatusIcon(balance.status)}
                        </Avatar>

                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {getLeaveTypeLabel(balance.leaveType)}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Typography variant="body2" color="textSecondary">
                              {balance.available} available • {balance.used} used
                            </Typography>
                            {balance.pending > 0 && (
                              <Chip
                                label={`${balance.pending} pending`}
                                size="small"
                                color="warning"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </Box>

                        <Box sx={{ minWidth: 120 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="caption">
                              {utilizationPercentage}% used
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={utilizationPercentage}
                            color={utilizationPercentage > 80 ? 'error' : utilizationPercentage > 60 ? 'warning' : 'success'}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                      </Box>
                    </AccordionSummary>

                    <AccordionDetails>
                      <Grid container spacing={2}>
                        {/* Detailed Stats */}
                        <Grid item xs={12} md={8}>
                          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 2 }}>
                            <Box>
                              <Typography variant="caption" color="textSecondary">Total Entitlement</Typography>
                              <Typography variant="h6">{balance.totalEntitlement} days</Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="textSecondary">Carry Forward</Typography>
                              <Typography variant="h6">{balance.carryForward} days</Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="textSecondary">Avg Monthly Usage</Typography>
                              <Typography variant="h6">{balance.averageMonthlyUsage} days</Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="textSecondary">Projected Year-end</Typography>
                              <Typography variant="h6" color={balance.projectedYearEnd < 5 ? 'error.main' : 'text.primary'}>
                                {balance.projectedYearEnd} days
                              </Typography>
                            </Box>
                          </Box>

                          {/* Expiry Warning */}
                          {daysUntilExpiry && daysUntilExpiry < 60 && (
                            <Alert severity="warning" sx={{ mb: 2 }}>
                              <Typography variant="body2">
                                {daysUntilExpiry} days remaining until {balance.available} days expire
                              </Typography>
                            </Alert>
                          )}

                          {/* Recommendations */}
                          {balance.recommendations && balance.recommendations.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" gutterBottom>
                                Recommendations:
                              </Typography>
                              {balance.recommendations.map((rec, index) => (
                                <Typography key={index} variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                                  • {rec}
                                </Typography>
                              ))}
                            </Box>
                          )}
                        </Grid>

                        {/* Actions */}
                        <Grid item xs={12} md={4}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<History />}
                              onClick={() => handleViewHistory(balance)}
                            >
                              View History
                            </Button>
                            {balance.lastUsed && (
                              <Typography variant="caption" color="textSecondary">
                                Last used: {dayjs(balance.lastUsed).format('MMM DD, YYYY')}
                              </Typography>
                            )}
                          </Box>
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>

      {/* Balance History Dialog */}
      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedBalance && `${getLeaveTypeLabel(selectedBalance.leaveType)} History`}
        </DialogTitle>
        <DialogContent>
          {balanceHistory.map((entry, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
              <Avatar
                sx={{
                  bgcolor: entry.change > 0 ? 'success.main' : 'error.main',
                  width: 32,
                  height: 32
                }}
              >
                {entry.change > 0 ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2">{entry.reason}</Typography>
                <Typography variant="caption" color="textSecondary">
                  {dayjs(entry.date).format('MMM DD, YYYY')}
                </Typography>
              </Box>
              <Typography
                variant="body2"
                color={entry.change > 0 ? 'success.main' : 'error.main'}
                fontWeight="medium"
              >
                {entry.change > 0 ? '+' : ''}{entry.change} days
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Balance: {entry.balance}
              </Typography>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EnhancedLeaveBalance;