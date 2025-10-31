import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  LinearProgress,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  TrendingUp as AccrualIcon,
  Schedule as ExpiryIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { UsaPtoBalance } from '../../types/usaPto';
import axios from 'axios';

interface UsaPtoBalanceWidgetProps {
  year?: number;
  compact?: boolean;
}

const UsaPtoBalanceWidget: React.FC<UsaPtoBalanceWidgetProps> = ({
  year = new Date().getFullYear(),
  compact = false
}) => {
  const [balance, setBalance] = useState<UsaPtoBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`/api/v1/usa-pto/balance`, {
        params: { year }
      });
      setBalance(response.data.data);
    } catch (err: any) {
      if (err.response?.status === 400 && err.response?.data?.message?.includes('USA')) {
        // Not a USA employee - don't show error
        setError(null);
      } else {
        setError(err.response?.data?.message || 'Failed to fetch PTO balance');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [year]);

  // Don't render if not a USA employee
  if (error === null && !balance && !loading) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={150}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  if (!balance) return null;

  const usagePercentage = balance.total > 0
    ? ((balance.total - balance.accrual) / balance.total) * 100
    : 0;

  const daysUntilExpiry = balance.carryForwardExpiry
    ? Math.ceil((new Date(balance.carryForwardExpiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const showExpiryWarning = daysUntilExpiry !== null && daysUntilExpiry <= 30 && balance.carryForward > 0;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            🇺🇸 USA PTO Balance
            <Tooltip title="Paid Time Off - USA Employees Only">
              <InfoIcon fontSize="small" color="action" />
            </Tooltip>
          </Typography>
          <IconButton size="small" onClick={fetchBalance}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Total Balance */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h2" component="div" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
            {balance.total.toFixed(1)}
            <Typography variant="h6" component="span" color="text.secondary" sx={{ ml: 1 }}>
              days
            </Typography>
          </Typography>
          <LinearProgress
            variant="determinate"
            value={Math.min(usagePercentage, 100)}
            sx={{
              height: 8,
              borderRadius: 1,
              backgroundColor: '#e0e0e0'
            }}
          />
        </Box>

        {!compact && (
          <>
            <Divider sx={{ my: 2 }} />

            {/* Breakdown */}
            <Box display="flex" flexDirection="column" gap={2}>
              {/* Annual Accrual */}
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box display="flex" alignItems="center" gap={1}>
                  <AccrualIcon color="primary" fontSize="small" />
                  <Typography variant="body2" color="text.secondary">
                    Annual Accrual
                  </Typography>
                </Box>
                <Chip
                  label={`${balance.accrual.toFixed(1)} days`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Box>

              {/* Carry Forward */}
              {balance.carryForward > 0 && (
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box display="flex" alignItems="center" gap={1}>
                    <CalendarIcon color="secondary" fontSize="small" />
                    <Typography variant="body2" color="text.secondary">
                      Carry Forward
                    </Typography>
                  </Box>
                  <Chip
                    label={`${balance.carryForward.toFixed(1)} days`}
                    size="small"
                    color="secondary"
                    variant="outlined"
                  />
                </Box>
              )}

              {/* Expiry Warning */}
              {showExpiryWarning && (
                <Alert
                  severity="warning"
                  icon={<ExpiryIcon />}
                  sx={{ py: 0.5 }}
                >
                  <Typography variant="caption">
                    {balance.carryForward.toFixed(1)} carry-forward days expire in {daysUntilExpiry} days
                    <br />
                    <strong>Use by {new Date(balance.carryForwardExpiry!).toLocaleDateString()}</strong>
                  </Typography>
                </Alert>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Quick Stats */}
            <Box display="flex" justifyContent="space-around" sx={{ mt: 2 }}>
              <Box textAlign="center">
                <Typography variant="caption" color="text.secondary" display="block">
                  Available
                </Typography>
                <Typography variant="h6" color="success.main">
                  {balance.total.toFixed(1)}
                </Typography>
              </Box>

              <Divider orientation="vertical" flexItem />

              <Box textAlign="center">
                <Typography variant="caption" color="text.secondary" display="block">
                  Year
                </Typography>
                <Typography variant="h6">
                  {year}
                </Typography>
              </Box>
            </Box>
          </>
        )}

        {/* Compact View Stats */}
        {compact && balance.carryForward > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Includes {balance.carryForward.toFixed(1)} days carry-forward
              {showExpiryWarning && ` (expires in ${daysUntilExpiry} days)`}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default UsaPtoBalanceWidget;
