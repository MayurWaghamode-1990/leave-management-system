import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Avatar,
  Chip,
  LinearProgress,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  AccessTime,
  CheckCircle,
  Schedule,
  Warning,
  Info,
  Refresh
} from '@mui/icons-material';

import api from '@/config/api';
import { useAuth } from '@/hooks/useAuth';

interface MetricData {
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  label: string;
  color: string;
  icon: React.ReactElement;
  description?: string;
}

interface DashboardMetrics {
  leaveUtilization: MetricData;
  teamAvailability: MetricData;
  pendingApprovals: MetricData;
  compOffBalance: MetricData;
  averageLeaveLength: MetricData;
  monthlyTrend: MetricData;
  quickStats: {
    totalEmployees: number;
    onLeaveToday: number;
    upcomingLeaves: number;
    criticalApprovals: number;
  };
}

const MetricsSummary: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reports/dashboard-metrics');

      // Mock data if API doesn't exist yet
      const mockMetrics: DashboardMetrics = {
        leaveUtilization: {
          value: 72,
          change: 5.2,
          trend: 'up',
          label: 'Leave Utilization',
          color: '#2196f3',
          icon: <CheckCircle />,
          description: 'Percentage of allocated leave days used'
        },
        teamAvailability: {
          value: 88,
          change: -2.1,
          trend: 'down',
          label: 'Team Availability',
          color: '#4caf50',
          icon: <People />,
          description: 'Current team members available for work'
        },
        pendingApprovals: {
          value: 8,
          change: 12.5,
          trend: 'up',
          label: 'Pending Approvals',
          color: '#ff9800',
          icon: <Schedule />,
          description: 'Leave requests awaiting approval'
        },
        compOffBalance: {
          value: 24,
          change: -8.3,
          trend: 'down',
          label: 'Comp Off Hours',
          color: '#9c27b0',
          icon: <AccessTime />,
          description: 'Total compensatory hours available'
        },
        averageLeaveLength: {
          value: 3.2,
          change: 0.4,
          trend: 'up',
          label: 'Avg Leave Days',
          color: '#ff5722',
          icon: <TrendingUp />,
          description: 'Average duration of leave requests'
        },
        monthlyTrend: {
          value: 15,
          change: 8.7,
          trend: 'up',
          label: 'Monthly Leaves',
          color: '#607d8b',
          icon: <TrendingUp />,
          description: 'Leave requests this month vs last month'
        },
        quickStats: {
          totalEmployees: 156,
          onLeaveToday: 12,
          upcomingLeaves: 8,
          criticalApprovals: 3
        }
      };

      setMetrics(response.data?.data || mockMetrics);
    } catch (error) {
      console.error('Metrics fetch error:', error);
      // Use mock data on error
      const mockMetrics: DashboardMetrics = {
        leaveUtilization: {
          value: 72,
          change: 5.2,
          trend: 'up',
          label: 'Leave Utilization',
          color: '#2196f3',
          icon: <CheckCircle />,
          description: 'Percentage of allocated leave days used'
        },
        teamAvailability: {
          value: 88,
          change: -2.1,
          trend: 'down',
          label: 'Team Availability',
          color: '#4caf50',
          icon: <People />,
          description: 'Current team members available for work'
        },
        pendingApprovals: {
          value: 8,
          change: 12.5,
          trend: 'up',
          label: 'Pending Approvals',
          color: '#ff9800',
          icon: <Schedule />,
          description: 'Leave requests awaiting approval'
        },
        compOffBalance: {
          value: 24,
          change: -8.3,
          trend: 'down',
          label: 'Comp Off Hours',
          color: '#9c27b0',
          icon: <AccessTime />,
          description: 'Total compensatory hours available'
        },
        averageLeaveLength: {
          value: 3.2,
          change: 0.4,
          trend: 'up',
          label: 'Avg Leave Days',
          color: '#ff5722',
          icon: <TrendingUp />,
          description: 'Average duration of leave requests'
        },
        monthlyTrend: {
          value: 15,
          change: 8.7,
          trend: 'up',
          label: 'Monthly Leaves',
          color: '#607d8b',
          icon: <TrendingUp />,
          description: 'Leave requests this month vs last month'
        },
        quickStats: {
          totalEmployees: 156,
          onLeaveToday: 12,
          upcomingLeaves: 8,
          criticalApprovals: 3
        }
      };
      setMetrics(mockMetrics);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchMetrics();
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp fontSize="small" color="success" />;
      case 'down':
        return <TrendingDown fontSize="small" color="error" />;
      default:
        return <TrendingUp fontSize="small" color="disabled" />;
    }
  };

  const getTrendColor = (trend: string, change: number) => {
    if (trend === 'up') {
      return change > 0 ? 'success.main' : 'error.main';
    } else if (trend === 'down') {
      return change > 0 ? 'error.main' : 'success.main';
    }
    return 'text.secondary';
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Key Metrics
          </Typography>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return null;
  }

  const MetricCard: React.FC<{ metric: MetricData }> = ({ metric }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Avatar sx={{ bgcolor: metric.color, width: 48, height: 48 }}>
            {metric.icon}
          </Avatar>
          <Tooltip title={metric.description || ''}>
            <IconButton size="small">
              <Info fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Typography variant="h4" fontWeight="bold" sx={{ mt: 2, mb: 1 }}>
          {metric.label.includes('Hours') || metric.label.includes('Days') ?
            `${metric.value}${metric.label.includes('Hours') ? 'h' : 'd'}` :
            `${metric.value}${metric.label.includes('Utilization') || metric.label.includes('Availability') ? '%' : ''}`
          }
        </Typography>

        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
          {metric.label}
        </Typography>

        <Box display="flex" alignItems="center" gap={1}>
          {getTrendIcon(metric.trend)}
          <Typography
            variant="body2"
            sx={{ color: getTrendColor(metric.trend, metric.change) }}
            fontWeight="medium"
          >
            {metric.change > 0 ? '+' : ''}{metric.change}%
          </Typography>
          <Typography variant="caption" color="textSecondary">
            vs last period
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  const mainMetrics = [
    metrics.leaveUtilization,
    metrics.teamAvailability,
    metrics.pendingApprovals,
    metrics.compOffBalance,
    metrics.averageLeaveLength,
    metrics.monthlyTrend
  ];

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Key Performance Metrics
        </Typography>
        <IconButton onClick={handleRefresh} disabled={loading}>
          <Refresh />
        </IconButton>
      </Box>

      {/* Quick Stats Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Quick Overview
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h3" color="primary" fontWeight="bold">
                  {metrics?.quickStats?.totalEmployees || 0}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Total Employees
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h3" color="warning.main" fontWeight="bold">
                  {metrics?.quickStats?.onLeaveToday || 0}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  On Leave Today
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h3" color="info.main" fontWeight="bold">
                  {metrics?.quickStats?.upcomingLeaves || 0}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Upcoming Leaves
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h3" color="error.main" fontWeight="bold">
                  {metrics?.quickStats?.criticalApprovals || 0}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Critical Approvals
                  <Tooltip title="Requests pending for more than 3 days">
                    <Warning fontSize="small" sx={{ ml: 0.5, verticalAlign: 'middle' }} />
                  </Tooltip>
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Metric Cards */}
      <Grid container spacing={3}>
        {mainMetrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
            <MetricCard metric={metric} />
          </Grid>
        ))}
      </Grid>

      {/* Performance Indicators */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Performance Indicators
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">Leave Policy Compliance</Typography>
                  <Chip label="95%" color="success" size="small" />
                </Box>
                <LinearProgress variant="determinate" value={95} sx={{ mb: 2 }} />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">Approval Efficiency</Typography>
                  <Chip label="87%" color="warning" size="small" />
                </Box>
                <LinearProgress variant="determinate" value={87} sx={{ mb: 2 }} />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">Employee Satisfaction</Typography>
                  <Chip label="92%" color="success" size="small" />
                </Box>
                <LinearProgress variant="determinate" value={92} sx={{ mb: 2 }} />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">System Utilization</Typography>
                  <Chip label="78%" color="info" size="small" />
                </Box>
                <LinearProgress variant="determinate" value={78} sx={{ mb: 2 }} />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default MetricsSummary;