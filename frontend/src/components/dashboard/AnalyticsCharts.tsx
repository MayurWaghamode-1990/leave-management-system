import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  Assessment,
  DonutSmall,
  Timeline
} from '@mui/icons-material';

import api from '@/config/api';
import toast from 'react-hot-toast';

interface LeaveAnalytics {
  monthlyTrends: Array<{
    month: string;
    approved: number;
    pending: number;
    rejected: number;
    total: number;
  }>;
  leaveTypeDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  departmentAnalytics: Array<{
    department: string;
    totalLeaves: number;
    averageDays: number;
    utilization: number;
  }>;
  compOffTrends: Array<{
    month: string;
    earned: number;
    used: number;
    balance: number;
  }>;
  teamProductivity: Array<{
    week: string;
    onLeave: number;
    available: number;
    productivity: number;
  }>;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088cc', '#00c49f'];

const AnalyticsCharts: React.FC = () => {
  const [analytics, setAnalytics] = useState<LeaveAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6months');
  const [selectedMetric, setSelectedMetric] = useState('all');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/reports/analytics?range=${timeRange}&metric=${selectedMetric}`);

      // Mock data if API doesn't exist yet
      const mockData: LeaveAnalytics = {
        monthlyTrends: [
          { month: 'Jan', approved: 15, pending: 3, rejected: 2, total: 20 },
          { month: 'Feb', approved: 12, pending: 5, rejected: 1, total: 18 },
          { month: 'Mar', approved: 18, pending: 4, rejected: 3, total: 25 },
          { month: 'Apr', approved: 22, pending: 6, rejected: 2, total: 30 },
          { month: 'May', approved: 28, pending: 4, rejected: 3, total: 35 },
          { month: 'Jun', approved: 25, pending: 7, rejected: 2, total: 34 }
        ],
        leaveTypeDistribution: [
          { name: 'Earned Leave', value: 45, color: '#8884d8' },
          { name: 'Sick Leave', value: 25, color: '#82ca9d' },
          { name: 'Casual Leave', value: 20, color: '#ffc658' },
          { name: 'Comp Off', value: 7, color: '#ff7300' },
          { name: 'Maternity', value: 3, color: '#0088cc' }
        ],
        departmentAnalytics: [
          { department: 'Engineering', totalLeaves: 45, averageDays: 8.5, utilization: 78 },
          { department: 'Marketing', totalLeaves: 32, averageDays: 6.2, utilization: 65 },
          { department: 'Sales', totalLeaves: 28, averageDays: 7.8, utilization: 72 },
          { department: 'HR', totalLeaves: 15, averageDays: 5.5, utilization: 58 }
        ],
        compOffTrends: [
          { month: 'Jan', earned: 8, used: 5, balance: 12 },
          { month: 'Feb', earned: 6, used: 7, balance: 11 },
          { month: 'Mar', earned: 10, used: 6, balance: 15 },
          { month: 'Apr', earned: 12, used: 8, balance: 19 },
          { month: 'May', earned: 9, used: 11, balance: 17 },
          { month: 'Jun', earned: 11, used: 9, balance: 19 }
        ],
        teamProductivity: [
          { week: 'W1', onLeave: 5, available: 45, productivity: 92 },
          { week: 'W2', onLeave: 8, available: 42, productivity: 88 },
          { week: 'W3', onLeave: 3, available: 47, productivity: 96 },
          { week: 'W4', onLeave: 12, available: 38, productivity: 82 }
        ]
      };

      setAnalytics(response.data?.data || mockData);
    } catch (error) {
      console.error('Analytics fetch error:', error);
      // Use mock data on error
      const mockData: LeaveAnalytics = {
        monthlyTrends: [
          { month: 'Jan', approved: 15, pending: 3, rejected: 2, total: 20 },
          { month: 'Feb', approved: 12, pending: 5, rejected: 1, total: 18 },
          { month: 'Mar', approved: 18, pending: 4, rejected: 3, total: 25 },
          { month: 'Apr', approved: 22, pending: 6, rejected: 2, total: 30 },
          { month: 'May', approved: 28, pending: 4, rejected: 3, total: 35 },
          { month: 'Jun', approved: 25, pending: 7, rejected: 2, total: 34 }
        ],
        leaveTypeDistribution: [
          { name: 'Earned Leave', value: 45, color: '#8884d8' },
          { name: 'Sick Leave', value: 25, color: '#82ca9d' },
          { name: 'Casual Leave', value: 20, color: '#ffc658' },
          { name: 'Comp Off', value: 7, color: '#ff7300' },
          { name: 'Maternity', value: 3, color: '#0088cc' }
        ],
        departmentAnalytics: [
          { department: 'Engineering', totalLeaves: 45, averageDays: 8.5, utilization: 78 },
          { department: 'Marketing', totalLeaves: 32, averageDays: 6.2, utilization: 65 },
          { department: 'Sales', totalLeaves: 28, averageDays: 7.8, utilization: 72 },
          { department: 'HR', totalLeaves: 15, averageDays: 5.5, utilization: 58 }
        ],
        compOffTrends: [
          { month: 'Jan', earned: 8, used: 5, balance: 12 },
          { month: 'Feb', earned: 6, used: 7, balance: 11 },
          { month: 'Mar', earned: 10, used: 6, balance: 15 },
          { month: 'Apr', earned: 12, used: 8, balance: 19 },
          { month: 'May', earned: 9, used: 11, balance: 17 },
          { month: 'Jun', earned: 11, used: 9, balance: 19 }
        ],
        teamProductivity: [
          { week: 'W1', onLeave: 5, available: 45, productivity: 92 },
          { week: 'W2', onLeave: 8, available: 42, productivity: 88 },
          { week: 'W3', onLeave: 3, available: 47, productivity: 96 },
          { week: 'W4', onLeave: 12, available: 38, productivity: 82 }
        ]
      };
      setAnalytics(mockData);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
            Analytics Dashboard
          </Typography>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <Box>
      {/* Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
              Analytics Dashboard
            </Typography>
            <Box display="flex" gap={2}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={timeRange}
                  label="Time Range"
                  onChange={(e) => setTimeRange(e.target.value)}
                >
                  <MenuItem value="3months">Last 3 Months</MenuItem>
                  <MenuItem value="6months">Last 6 Months</MenuItem>
                  <MenuItem value="year">Last Year</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Metric</InputLabel>
                <Select
                  value={selectedMetric}
                  label="Metric"
                  onChange={(e) => setSelectedMetric(e.target.value)}
                >
                  <MenuItem value="all">All Metrics</MenuItem>
                  <MenuItem value="leaves">Leave Trends</MenuItem>
                  <MenuItem value="compoff">Comp Off</MenuItem>
                  <MenuItem value="productivity">Productivity</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Monthly Leave Trends */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                Monthly Leave Trends
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="approved" stackId="a" fill="#4caf50" name="Approved" />
                    <Bar dataKey="pending" stackId="a" fill="#ff9800" name="Pending" />
                    <Bar dataKey="rejected" stackId="a" fill="#f44336" name="Rejected" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Leave Type Distribution */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <DonutSmall sx={{ mr: 1, verticalAlign: 'middle' }} />
                Leave Type Distribution
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.leaveTypeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.leaveTypeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Comp Off Trends */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Timeline sx={{ mr: 1, verticalAlign: 'middle' }} />
                Comp Off Trends
              </Typography>
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.compOffTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="earned"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                      name="Earned"
                    />
                    <Area
                      type="monotone"
                      dataKey="used"
                      stackId="1"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      name="Used"
                    />
                    <Line
                      type="monotone"
                      dataKey="balance"
                      stroke="#ff7300"
                      strokeWidth={3}
                      name="Balance"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Team Productivity */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Team Productivity Impact
              </Typography>
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.teamProductivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="productivity"
                      stroke="#2196f3"
                      strokeWidth={3}
                      name="Productivity %"
                    />
                    <Bar dataKey="onLeave" fill="#f44336" name="On Leave" />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Department Analytics Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Department Analytics
              </Typography>
              <Grid container spacing={2}>
                {(analytics?.departmentAnalytics || []).map((dept) => (
                  <Grid item xs={12} sm={6} md={3} key={dept.department}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {dept.department}
                      </Typography>
                      <Box mt={1}>
                        <Typography variant="body2" color="textSecondary">
                          Total Leaves: <strong>{dept.totalLeaves}</strong>
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Avg Days: <strong>{dept.averageDays}</strong>
                        </Typography>
                        <Box display="flex" alignItems="center" mt={1}>
                          <Typography variant="body2" sx={{ mr: 1 }}>
                            Utilization:
                          </Typography>
                          <Chip
                            label={`${dept.utilization}%`}
                            color={dept.utilization > 70 ? 'success' : dept.utilization > 50 ? 'warning' : 'error'}
                            size="small"
                          />
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={dept.utilization}
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsCharts;