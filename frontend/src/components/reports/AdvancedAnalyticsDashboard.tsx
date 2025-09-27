import React from 'react';
import {
  Grid,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider
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
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Assessment,
  People,
  Warning,
  CheckCircle
} from '@mui/icons-material';

interface AnalyticsMetrics {
  totalRequests: number;
  totalDays: number;
  averageDuration: number;
  approvalRate: number;
  rejectionRate: number;
  pendingRate: number;
  leaveTypeBreakdown: { type: string; count: number; percentage: number }[];
  departmentBreakdown: { department: string; count: number; days: number; percentage: number }[];
  monthlyTrends: { month: string; requests: number; days: number; approvalRate: number }[];
  topEmployees: { employeeId: string; name: string; totalDays: number; requestCount: number }[];
  peakPeriods: { period: string; intensity: number; description: string }[];
}

interface UtilizationData {
  department: string;
  totalEmployees: number;
  employeesOnLeave: number;
  utilizationRate: number;
  averageLeaveDays: number;
  forecastedUtilization: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface AdvancedAnalyticsDashboardProps {
  analytics: AnalyticsMetrics;
  utilization: UtilizationData[];
  loading?: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const getRiskColor = (riskLevel: string) => {
  switch (riskLevel) {
    case 'HIGH': return '#f44336';
    case 'MEDIUM': return '#ff9800';
    case 'LOW': return '#4caf50';
    default: return '#757575';
  }
};

const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsDashboardProps> = ({
  analytics,
  utilization,
  loading = false
}) => {
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  const formatNumber = (value: number) => value.toLocaleString();

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: 'center' }}>
          Generating analytics...
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {/* Key Metrics Cards */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Assessment color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" color="primary">
                {formatNumber(analytics.totalRequests)}
              </Typography>
            </Box>
            <Typography variant="body2" color="textSecondary">
              Total Requests
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {formatNumber(analytics.totalDays)} days total
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              {analytics.approvalRate > 80 ? (
                <TrendingUp color="success" sx={{ mr: 1 }} />
              ) : (
                <TrendingDown color="error" sx={{ mr: 1 }} />
              )}
              <Typography variant="h6" color={analytics.approvalRate > 80 ? 'success.main' : 'error.main'}>
                {formatPercentage(analytics.approvalRate)}
              </Typography>
            </Box>
            <Typography variant="body2" color="textSecondary">
              Approval Rate
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {formatPercentage(analytics.rejectionRate)} rejected
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <People color="info" sx={{ mr: 1 }} />
              <Typography variant="h6" color="info.main">
                {analytics.averageDuration.toFixed(1)}
              </Typography>
            </Box>
            <Typography variant="body2" color="textSecondary">
              Avg Duration (days)
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Per request
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              {analytics.pendingRate < 10 ? (
                <CheckCircle color="success" sx={{ mr: 1 }} />
              ) : (
                <Warning color="warning" sx={{ mr: 1 }} />
              )}
              <Typography variant="h6" color={analytics.pendingRate < 10 ? 'success.main' : 'warning.main'}>
                {formatPercentage(analytics.pendingRate)}
              </Typography>
            </Box>
            <Typography variant="body2" color="textSecondary">
              Pending Requests
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Awaiting approval
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Leave Type Breakdown */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Leave Type Distribution" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.leaveTypeBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, percentage }) => `${type.replace('_', ' ')}: ${percentage.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.leaveTypeBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Monthly Trends */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Monthly Trends" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="requests"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  name="Requests"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="approvalRate"
                  stroke="#ff7300"
                  name="Approval Rate %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Department Analysis */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardHeader title="Department Analysis" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.departmentBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="count" fill="#8884d8" name="Request Count" />
                <Bar yAxisId="right" dataKey="days" fill="#82ca9d" name="Total Days" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Utilization Risk Assessment */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardHeader title="Utilization Risk" />
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {utilization.map((dept, index) => (
                <Box key={index}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                      {dept.department}
                    </Typography>
                    <Chip
                      label={dept.riskLevel}
                      size="small"
                      sx={{
                        backgroundColor: getRiskColor(dept.riskLevel),
                        color: 'white',
                        fontSize: '0.7rem'
                      }}
                    />
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={dept.utilizationRate}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getRiskColor(dept.riskLevel)
                      }
                    }}
                  />
                  <Typography variant="caption" color="textSecondary">
                    {formatPercentage(dept.utilizationRate)} utilization
                    ({dept.employeesOnLeave}/{dept.totalEmployees} employees)
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Top Employees by Leave Days */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Top Employees by Leave Days" />
          <CardContent>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell align="right">Total Days</TableCell>
                    <TableCell align="right">Requests</TableCell>
                    <TableCell align="right">Avg Duration</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analytics.topEmployees.slice(0, 8).map((employee, index) => (
                    <TableRow key={employee.employeeId}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={index + 1}
                            size="small"
                            color={index < 3 ? 'primary' : 'default'}
                            sx={{ minWidth: 24, height: 20 }}
                          />
                          {employee.name}
                        </Box>
                      </TableCell>
                      <TableCell align="right">{employee.totalDays}</TableCell>
                      <TableCell align="right">{employee.requestCount}</TableCell>
                      <TableCell align="right">
                        {(employee.totalDays / employee.requestCount).toFixed(1)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Peak Periods Analysis */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Peak Periods Analysis" />
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {analytics.peakPeriods.map((period, index) => (
                <Box key={index}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                      {period.period}
                    </Typography>
                    <Typography variant="body2" color="primary">
                      {period.intensity}% intensity
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={period.intensity}
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="caption" color="textSecondary">
                    {period.description}
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Alerts and Recommendations */}
      <Grid item xs={12}>
        <Card>
          <CardHeader title="Insights & Recommendations" />
          <CardContent>
            <Grid container spacing={2}>
              {analytics.approvalRate < 80 && (
                <Grid item xs={12} md={6}>
                  <Alert severity="warning">
                    <Typography variant="body2">
                      <strong>Low Approval Rate:</strong> Current approval rate of {formatPercentage(analytics.approvalRate)}
                      is below optimal range. Consider reviewing approval processes.
                    </Typography>
                  </Alert>
                </Grid>
              )}

              {analytics.pendingRate > 15 && (
                <Grid item xs={12} md={6}>
                  <Alert severity="error">
                    <Typography variant="body2">
                      <strong>High Pending Rate:</strong> {formatPercentage(analytics.pendingRate)}
                      of requests are pending approval. Consider expediting review process.
                    </Typography>
                  </Alert>
                </Grid>
              )}

              {utilization.filter(d => d.riskLevel === 'HIGH').length > 0 && (
                <Grid item xs={12} md={6}>
                  <Alert severity="warning">
                    <Typography variant="body2">
                      <strong>High Utilization Risk:</strong> {utilization.filter(d => d.riskLevel === 'HIGH').length}
                      department(s) have high utilization rates that may impact operations.
                    </Typography>
                  </Alert>
                </Grid>
              )}

              {analytics.averageDuration > 7 && (
                <Grid item xs={12} md={6}>
                  <Alert severity="info">
                    <Typography variant="body2">
                      <strong>Long Average Duration:</strong> Average leave duration of {analytics.averageDuration.toFixed(1)}
                      days suggests preference for longer breaks. Consider wellness programs.
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default AdvancedAnalyticsDashboard;