import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Chip,
  Avatar,
  LinearProgress,
  Button,
  Tab,
  Tabs,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Group,
  CalendarMonth,
  Schedule,
  Assessment,
  Download,
  FilterList,
  Refresh
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts';
import dayjs from 'dayjs';
import { useAuth } from '@/hooks/useAuth';
import api from '@/config/api';

interface AnalyticsData {
  leaveUsageTrends: Array<{
    month: string;
    totalLeaves: number;
    approvedLeaves: number;
    rejectedLeaves: number;
    sickLeaves: number;
    casualLeaves: number;
    earnedLeaves: number;
  }>;
  departmentStats: Array<{
    department: string;
    totalEmployees: number;
    onLeave: number;
    leavePercentage: number;
    avgLeaveDays: number;
  }>;
  leaveTypeDistribution: Array<{
    type: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  topInsights: Array<{
    type: 'trend' | 'warning' | 'info';
    title: string;
    description: string;
    value?: string;
    change?: number;
  }>;
  teamPerformance: Array<{
    team: string;
    productivity: number;
    leaveBalance: number;
    attendance: number;
  }>;
  seasonalAnalysis: Array<{
    quarter: string;
    leaves: number;
    trend: 'up' | 'down' | 'stable';
  }>;
}

interface AdvancedAnalyticsProps {
  refreshTrigger?: number;
}

const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({ refreshTrigger = 0 }) => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('12months');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [activeTab, setActiveTab] = useState(0);

  const mockAnalyticsData: AnalyticsData = {
    leaveUsageTrends: [
      { month: 'Jan', totalLeaves: 45, approvedLeaves: 40, rejectedLeaves: 5, sickLeaves: 15, casualLeaves: 18, earnedLeaves: 12 },
      { month: 'Feb', totalLeaves: 38, approvedLeaves: 35, rejectedLeaves: 3, sickLeaves: 12, casualLeaves: 15, earnedLeaves: 11 },
      { month: 'Mar', totalLeaves: 52, approvedLeaves: 48, rejectedLeaves: 4, sickLeaves: 18, casualLeaves: 20, earnedLeaves: 14 },
      { month: 'Apr', totalLeaves: 41, approvedLeaves: 38, rejectedLeaves: 3, sickLeaves: 14, casualLeaves: 16, earnedLeaves: 11 },
      { month: 'May', totalLeaves: 49, approvedLeaves: 46, rejectedLeaves: 3, sickLeaves: 16, casualLeaves: 19, earnedLeaves: 14 },
      { month: 'Jun', totalLeaves: 55, approvedLeaves: 51, rejectedLeaves: 4, sickLeaves: 20, casualLeaves: 21, earnedLeaves: 14 },
      { month: 'Jul', totalLeaves: 62, approvedLeaves: 58, rejectedLeaves: 4, sickLeaves: 22, casualLeaves: 24, earnedLeaves: 16 },
      { month: 'Aug', totalLeaves: 48, approvedLeaves: 44, rejectedLeaves: 4, sickLeaves: 17, casualLeaves: 18, earnedLeaves: 13 },
      { month: 'Sep', totalLeaves: 43, approvedLeaves: 40, rejectedLeaves: 3, sickLeaves: 15, casualLeaves: 17, earnedLeaves: 11 },
      { month: 'Oct', totalLeaves: 51, approvedLeaves: 47, rejectedLeaves: 4, sickLeaves: 18, casualLeaves: 19, earnedLeaves: 14 },
      { month: 'Nov', totalLeaves: 46, approvedLeaves: 42, rejectedLeaves: 4, sickLeaves: 16, casualLeaves: 18, earnedLeaves: 12 },
      { month: 'Dec', totalLeaves: 39, approvedLeaves: 36, rejectedLeaves: 3, sickLeaves: 13, casualLeaves: 16, earnedLeaves: 10 }
    ],
    departmentStats: [
      { department: 'Engineering', totalEmployees: 45, onLeave: 3, leavePercentage: 6.7, avgLeaveDays: 18.5 },
      { department: 'HR', totalEmployees: 12, onLeave: 1, leavePercentage: 8.3, avgLeaveDays: 22.1 },
      { department: 'Sales', totalEmployees: 28, onLeave: 2, leavePercentage: 7.1, avgLeaveDays: 19.8 },
      { department: 'Marketing', totalEmployees: 18, onLeave: 1, leavePercentage: 5.6, avgLeaveDays: 16.9 },
      { department: 'Finance', totalEmployees: 15, onLeave: 1, leavePercentage: 6.7, avgLeaveDays: 20.3 },
      { department: 'Operations', totalEmployees: 22, onLeave: 2, leavePercentage: 9.1, avgLeaveDays: 23.7 }
    ],
    leaveTypeDistribution: [
      { type: 'Casual Leave', count: 156, percentage: 35.2, color: '#2196F3' },
      { type: 'Sick Leave', count: 134, percentage: 30.3, color: '#FF5722' },
      { type: 'Earned Leave', count: 98, percentage: 22.1, color: '#4CAF50' },
      { type: 'Compensatory Off', count: 32, percentage: 7.2, color: '#FF9800' },
      { type: 'Maternity Leave', count: 15, percentage: 3.4, color: '#E91E63' },
      { type: 'Other', count: 8, percentage: 1.8, color: '#9C27B0' }
    ],
    topInsights: [
      {
        type: 'trend',
        title: 'Leave Usage Increase',
        description: 'July saw 18% more leave applications compared to previous month',
        value: '+18%',
        change: 18
      },
      {
        type: 'warning',
        title: 'High Sick Leave Rate',
        description: 'Engineering department has 25% higher sick leave rate than average',
        value: '25%',
        change: 25
      },
      {
        type: 'info',
        title: 'Balanced Leave Distribution',
        description: 'Leave requests are evenly distributed across quarters',
        value: '±2%'
      },
      {
        type: 'trend',
        title: 'Approval Rate Improved',
        description: 'Leave approval rate increased to 92% this quarter',
        value: '92%',
        change: 5
      }
    ],
    teamPerformance: [
      { team: 'Frontend Team', productivity: 85, leaveBalance: 78, attendance: 94 },
      { team: 'Backend Team', productivity: 90, leaveBalance: 82, attendance: 96 },
      { team: 'DevOps Team', productivity: 88, leaveBalance: 75, attendance: 93 },
      { team: 'QA Team', productivity: 87, leaveBalance: 80, attendance: 95 },
      { team: 'Design Team', productivity: 83, leaveBalance: 85, attendance: 92 },
      { team: 'Product Team', productivity: 89, leaveBalance: 77, attendance: 97 }
    ],
    seasonalAnalysis: [
      { quarter: 'Q1 2024', leaves: 135, trend: 'stable' },
      { quarter: 'Q2 2024', leaves: 145, trend: 'up' },
      { quarter: 'Q3 2024', leaves: 153, trend: 'up' },
      { quarter: 'Q4 2024', leaves: 136, trend: 'down' }
    ]
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod, selectedDepartment, refreshTrigger]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      // Try to fetch real data, fallback to mock data
      try {
        const response = await api.get('/reports/analytics', {
          params: { period: selectedPeriod, department: selectedDepartment }
        });
        setAnalyticsData(response.data.data);
      } catch (error) {
        console.warn('Using mock analytics data');
        setAnalyticsData(mockAnalyticsData);
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setAnalyticsData(mockAnalyticsData);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'pdf' | 'excel') => {
    try {
      // Mock export functionality
      const blob = new Blob([JSON.stringify(analyticsData, null, 2)], {
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${dayjs().format('YYYY-MM-DD')}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const MetricCard: React.FC<{
    title: string;
    value: string;
    change?: number;
    icon: React.ReactElement;
    color: string;
  }> = ({ title, value, change, icon, color }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {value}
            </Typography>
            {change !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {change > 0 ? (
                  <TrendingUp sx={{ color: 'success.main', fontSize: 16, mr: 0.5 }} />
                ) : (
                  <TrendingDown sx={{ color: 'error.main', fontSize: 16, mr: 0.5 }} />
                )}
                <Typography
                  variant="caption"
                  color={change > 0 ? 'success.main' : 'error.main'}
                  fontWeight="medium"
                >
                  {Math.abs(change)}%
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!analyticsData) {
    return (
      <Alert severity="error">
        Failed to load analytics data. Please try refreshing.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Controls */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Time Period</InputLabel>
          <Select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            label="Time Period"
          >
            <MenuItem value="3months">Last 3 Months</MenuItem>
            <MenuItem value="6months">Last 6 Months</MenuItem>
            <MenuItem value="12months">Last 12 Months</MenuItem>
            <MenuItem value="custom">Custom Range</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Department</InputLabel>
          <Select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            label="Department"
          >
            <MenuItem value="all">All Departments</MenuItem>
            <MenuItem value="engineering">Engineering</MenuItem>
            <MenuItem value="hr">HR</MenuItem>
            <MenuItem value="sales">Sales</MenuItem>
            <MenuItem value="marketing">Marketing</MenuItem>
            <MenuItem value="finance">Finance</MenuItem>
            <MenuItem value="operations">Operations</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => exportReport('excel')}
            size="small"
          >
            Export Excel
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => exportReport('pdf')}
            size="small"
          >
            Export PDF
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => fetchAnalyticsData()}
            size="small"
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Overview" />
          <Tab label="Trends" />
          <Tab label="Departments" />
          <Tab label="Team Performance" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Key Insights */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Assessment />
              Key Insights
            </Typography>
          </Grid>

          {analyticsData.topInsights.map((insight, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <MetricCard
                title={insight.title}
                value={insight.value || ''}
                change={insight.change}
                icon={insight.type === 'trend' ? <TrendingUp /> : insight.type === 'warning' ? <Schedule /> : <Assessment />}
                color={insight.type === 'trend' ? '#4CAF50' : insight.type === 'warning' ? '#FF9800' : '#2196F3'}
              />
            </Grid>
          ))}

          {/* Leave Type Distribution */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Leave Type Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.leaveTypeDistribution}
                      dataKey="count"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ type, percentage }) => `${type}: ${percentage}%`}
                    >
                      {analyticsData.leaveTypeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Seasonal Analysis */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quarterly Leave Trends
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.seasonalAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="quarter" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="leaves" fill="#2196F3" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Monthly Leave Usage Trends
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={analyticsData.leaveUsageTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="approvedLeaves" fill="#4CAF50" name="Approved" />
                    <Bar dataKey="rejectedLeaves" fill="#FF5722" name="Rejected" />
                    <Line type="monotone" dataKey="totalLeaves" stroke="#2196F3" strokeWidth={3} name="Total" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Leave Type Trends
                </Typography>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={analyticsData.leaveUsageTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="sickLeaves" stackId="1" stroke="#FF5722" fill="#FF5722" />
                    <Area type="monotone" dataKey="casualLeaves" stackId="1" stroke="#2196F3" fill="#2196F3" />
                    <Area type="monotone" dataKey="earnedLeaves" stackId="1" stroke="#4CAF50" fill="#4CAF50" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Department-wise Leave Statistics
                </Typography>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={analyticsData.departmentStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalEmployees" fill="#2196F3" name="Total Employees" />
                    <Bar dataKey="onLeave" fill="#FF9800" name="Currently on Leave" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Department Performance Metrics
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {analyticsData.departmentStats.map((dept, index) => (
                    <Box key={dept.department} sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {dept.department}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Chip
                            label={`${dept.leavePercentage.toFixed(1)}% on leave`}
                            size="small"
                            color={dept.leavePercentage > 8 ? 'error' : dept.leavePercentage > 6 ? 'warning' : 'success'}
                          />
                          <Chip
                            label={`${dept.avgLeaveDays.toFixed(1)} avg days`}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={dept.leavePercentage}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: dept.leavePercentage > 8 ? 'error.main' : dept.leavePercentage > 6 ? 'warning.main' : 'success.main'
                          }
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Team Performance Overview
                </Typography>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={analyticsData.teamPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="team" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="productivity" fill="#4CAF50" name="Productivity %" />
                    <Bar dataKey="attendance" fill="#2196F3" name="Attendance %" />
                    <Bar dataKey="leaveBalance" fill="#FF9800" name="Leave Balance %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Team Detailed Metrics
                </Typography>
                <Grid container spacing={2}>
                  {analyticsData.teamPerformance.map((team, index) => (
                    <Grid item xs={12} sm={6} md={4} key={team.team}>
                      <Paper sx={{ p: 2, border: 1, borderColor: 'grey.200' }}>
                        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                          {team.team}
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">Productivity</Typography>
                            <Typography variant="body2" fontWeight="medium">{team.productivity}%</Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={team.productivity} sx={{ mb: 1 }} />

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">Attendance</Typography>
                            <Typography variant="body2" fontWeight="medium">{team.attendance}%</Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={team.attendance} color="info" sx={{ mb: 1 }} />

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">Leave Balance</Typography>
                            <Typography variant="body2" fontWeight="medium">{team.leaveBalance}%</Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={team.leaveBalance} color="warning" />
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default AdvancedAnalytics;