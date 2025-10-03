import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  Paper,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  GetApp,
  Visibility,
  FilterList,
  DateRange,
  People,
  Business,
  Schedule,
  PieChart,
  BarChart as BarChartIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ComposedChart,
  Area,
  AreaChart
} from 'recharts';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import toast from 'react-hot-toast';

import api from '@/config/api';
import { useAuth } from '@/hooks/useAuth';

interface LeaveReport {
  period: string;
  totalApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  pendingApplications: number;
  totalDaysRequested: number;
  totalDaysApproved: number;
  averageProcessingTime: number;
  utilizationRate: number;
}

interface TrendData {
  month: string;
  year: number;
  totalLeaves: number;
  sickLeaves: number;
  casualLeaves: number;
  earnedLeaves: number;
  compOffLeaves: number;
  maternityLeaves: number;
  utilizationPercentage: number;
  approvalRate: number;
}

interface DepartmentStats {
  department: string;
  employeeCount: number;
  totalApplications: number;
  avgDaysPerEmployee: number;
  utilizationRate: number;
  topLeaveType: string;
  pendingApplications: number;
}

interface LeaveTypeBreakdown {
  leaveType: string;
  count: number;
  percentage: number;
  avgDuration: number;
  color: string;
}

const LeaveReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(dayjs().subtract(6, 'month'));
  const [dateTo, setDateTo] = useState<Dayjs | null>(dayjs());
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Mock data - in real implementation, fetch from API
  const [reports, setReports] = useState<LeaveReport[]>([
    {
      period: '2024-09',
      totalApplications: 45,
      approvedApplications: 38,
      rejectedApplications: 4,
      pendingApplications: 3,
      totalDaysRequested: 180,
      totalDaysApproved: 152,
      averageProcessingTime: 2.3,
      utilizationRate: 78.5
    },
    {
      period: '2024-08',
      totalApplications: 52,
      approvedApplications: 45,
      rejectedApplications: 5,
      pendingApplications: 2,
      totalDaysRequested: 208,
      totalDaysApproved: 180,
      averageProcessingTime: 1.8,
      utilizationRate: 82.1
    }
  ]);

  const [trendData, setTrendData] = useState<TrendData[]>([
    { month: 'Jan', year: 2024, totalLeaves: 32, sickLeaves: 8, casualLeaves: 12, earnedLeaves: 10, compOffLeaves: 2, maternityLeaves: 0, utilizationPercentage: 65, approvalRate: 85 },
    { month: 'Feb', year: 2024, totalLeaves: 28, sickLeaves: 6, casualLeaves: 10, earnedLeaves: 8, compOffLeaves: 3, maternityLeaves: 1, utilizationPercentage: 58, approvalRate: 92 },
    { month: 'Mar', year: 2024, totalLeaves: 38, sickLeaves: 9, casualLeaves: 15, earnedLeaves: 12, compOffLeaves: 2, maternityLeaves: 0, utilizationPercentage: 78, approvalRate: 88 },
    { month: 'Apr', year: 2024, totalLeaves: 35, sickLeaves: 7, casualLeaves: 13, earnedLeaves: 11, compOffLeaves: 3, maternityLeaves: 1, utilizationPercentage: 72, approvalRate: 90 },
    { month: 'May', year: 2024, totalLeaves: 42, sickLeaves: 10, casualLeaves: 16, earnedLeaves: 14, compOffLeaves: 2, maternityLeaves: 0, utilizationPercentage: 86, approvalRate: 87 },
    { month: 'Jun', year: 2024, totalLeaves: 45, sickLeaves: 11, casualLeaves: 18, earnedLeaves: 13, compOffLeaves: 3, maternityLeaves: 0, utilizationPercentage: 92, approvalRate: 91 }
  ]);

  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([
    { department: 'Engineering', employeeCount: 45, totalApplications: 128, avgDaysPerEmployee: 12.5, utilizationRate: 78.3, topLeaveType: 'Earned Leave', pendingApplications: 5 },
    { department: 'Marketing', employeeCount: 20, totalApplications: 58, avgDaysPerEmployee: 11.8, utilizationRate: 72.5, topLeaveType: 'Casual Leave', pendingApplications: 2 },
    { department: 'Sales', employeeCount: 30, totalApplications: 85, avgDaysPerEmployee: 13.2, utilizationRate: 81.7, topLeaveType: 'Earned Leave', pendingApplications: 3 },
    { department: 'HR', employeeCount: 8, totalApplications: 22, avgDaysPerEmployee: 10.9, utilizationRate: 68.9, topLeaveType: 'Casual Leave', pendingApplications: 1 },
    { department: 'Finance', employeeCount: 12, totalApplications: 35, avgDaysPerEmployee: 11.5, utilizationRate: 75.2, topLeaveType: 'Sick Leave', pendingApplications: 0 }
  ]);

  const [leaveTypeBreakdown, setLeaveTypeBreakdown] = useState<LeaveTypeBreakdown[]>([
    { leaveType: 'Earned Leave', count: 78, percentage: 35.5, avgDuration: 3.2, color: '#4caf50' },
    { leaveType: 'Casual Leave', count: 65, percentage: 29.5, avgDuration: 1.8, color: '#2196f3' },
    { leaveType: 'Sick Leave', count: 45, percentage: 20.5, avgDuration: 2.1, color: '#ff9800' },
    { leaveType: 'Comp Off', count: 20, percentage: 9.1, avgDuration: 1.0, color: '#9c27b0' },
    { leaveType: 'Maternity', count: 12, percentage: 5.4, avgDuration: 45.0, color: '#e91e63' }
  ]);

  const periodOptions = [
    { value: 'week', label: 'Weekly' },
    { value: 'month', label: 'Monthly' },
    { value: 'quarter', label: 'Quarterly' },
    { value: 'year', label: 'Yearly' }
  ];

  const departmentOptions = [
    { value: '', label: 'All Departments' },
    { value: 'Engineering', label: 'Engineering' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Sales', label: 'Sales' },
    { value: 'HR', label: 'Human Resources' },
    { value: 'Finance', label: 'Finance' }
  ];

  const yearOptions = [2022, 2023, 2024, 2025];

  useEffect(() => {
    if (user?.role === 'HR_ADMIN') {
      fetchReportsData();
    }
  }, [selectedPeriod, selectedYear, selectedDepartment, dateFrom, dateTo, user]);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      // In real implementation, make API calls to fetch report data
      // await api.get('/reports/leave-analytics', { params: { period: selectedPeriod, year: selectedYear, department: selectedDepartment } });
    } catch (error: any) {
      toast.error('Failed to fetch reports data');
      console.error('Reports fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      exportToCSV();
    } else {
      // Implement PDF export
      toast.info('PDF export will be implemented');
    }
  };

  const exportToCSV = () => {
    const csvData = reports.map(report => ({
      'Period': report.period,
      'Total Applications': report.totalApplications,
      'Approved': report.approvedApplications,
      'Rejected': report.rejectedApplications,
      'Pending': report.pendingApplications,
      'Days Requested': report.totalDaysRequested,
      'Days Approved': report.totalDaysApproved,
      'Avg Processing Time (days)': report.averageProcessingTime,
      'Utilization Rate (%)': report.utilizationRate
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leave-reports-${dayjs().format('YYYY-MM-DD')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const calculateOverallStats = () => {
    const total = reports.reduce((acc, report) => ({
      applications: acc.applications + report.totalApplications,
      approved: acc.approved + report.approvedApplications,
      rejected: acc.rejected + report.rejectedApplications,
      pending: acc.pending + report.pendingApplications,
      daysRequested: acc.daysRequested + report.totalDaysRequested,
      daysApproved: acc.daysApproved + report.totalDaysApproved
    }), {
      applications: 0,
      approved: 0,
      rejected: 0,
      pending: 0,
      daysRequested: 0,
      daysApproved: 0
    });

    return {
      ...total,
      approvalRate: total.applications > 0 ? ((total.approved / total.applications) * 100).toFixed(1) : '0',
      utilizationRate: total.daysRequested > 0 ? ((total.daysApproved / total.daysRequested) * 100).toFixed(1) : '0'
    };
  };

  const overallStats = calculateOverallStats();

  // Check if user has access to reports
  if (!user || user.role !== 'HR_ADMIN') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Alert severity="warning">
          <Typography>
            Access Denied. This page is only available to HR Administrators.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" gutterBottom>
            <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
            Leave Reports & Analytics
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<GetApp />}
              onClick={() => exportReport('csv')}
            >
              Export CSV
            </Button>
            <Button
              variant="outlined"
              startIcon={<GetApp />}
              onClick={() => exportReport('pdf')}
            >
              Export PDF
            </Button>
          </Box>
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <FilterList sx={{ mr: 1, verticalAlign: 'middle' }} />
              Report Filters
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Period</InputLabel>
                  <Select
                    value={selectedPeriod}
                    label="Period"
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                  >
                    {periodOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Year</InputLabel>
                  <Select
                    value={selectedYear}
                    label="Year"
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                  >
                    {yearOptions.map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={selectedDepartment}
                    label="Department"
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                  >
                    {departmentOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={fetchReportsData}
                  disabled={loading}
                >
                  Generate Report
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Overview Cards */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <People color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h5" color="primary">
                    {overallStats.applications}
                  </Typography>
                </Box>
                <Typography variant="body2" color="textSecondary">
                  Total Applications
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <TrendingUp color="success" sx={{ mr: 1 }} />
                  <Typography variant="h5" color="success.main">
                    {overallStats.approvalRate}%
                  </Typography>
                </Box>
                <Typography variant="body2" color="textSecondary">
                  Approval Rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <Schedule color="info" sx={{ mr: 1 }} />
                  <Typography variant="h5" color="info.main">
                    {overallStats.daysApproved}
                  </Typography>
                </Box>
                <Typography variant="body2" color="textSecondary">
                  Days Approved
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <BarChartIcon color="warning" sx={{ mr: 1 }} />
                  <Typography variant="h5" color="warning.main">
                    {overallStats.utilizationRate}%
                  </Typography>
                </Box>
                <Typography variant="body2" color="textSecondary">
                  Utilization Rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs for different views */}
        <Card sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            variant="fullWidth"
          >
            <Tab label="Trend Analysis" />
            <Tab label="Department Stats" />
            <Tab label="Leave Type Breakdown" />
            <Tab label="Detailed Reports" />
          </Tabs>
        </Card>

        {/* Tab Content */}
        {tabValue === 0 && (
          <Grid container spacing={3}>
            {/* Monthly Trend Chart */}
            <Grid item xs={12} lg={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Leave Applications Trend
                  </Typography>
                  <Box height={400}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <RechartsTooltip />
                        <Area yAxisId="left" type="monotone" dataKey="totalLeaves" fill="#8884d8" stroke="#8884d8" fillOpacity={0.3} />
                        <Bar yAxisId="left" dataKey="sickLeaves" stackId="a" fill="#ff9800" />
                        <Bar yAxisId="left" dataKey="casualLeaves" stackId="a" fill="#2196f3" />
                        <Bar yAxisId="left" dataKey="earnedLeaves" stackId="a" fill="#4caf50" />
                        <Bar yAxisId="left" dataKey="compOffLeaves" stackId="a" fill="#9c27b0" />
                        <Line yAxisId="right" type="monotone" dataKey="approvalRate" stroke="#f44336" strokeWidth={2} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Utilization Rate Chart */}
            <Grid item xs={12} lg={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Monthly Utilization
                  </Typography>
                  <Box height={400}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <RechartsTooltip formatter={(value) => `${value}%`} />
                        <Area type="monotone" dataKey="utilizationPercentage" stroke="#4caf50" fill="#4caf50" fillOpacity={0.6} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {tabValue === 1 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Department-wise Statistics
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Department</TableCell>
                      <TableCell align="center">Employees</TableCell>
                      <TableCell align="center">Applications</TableCell>
                      <TableCell align="center">Avg Days/Employee</TableCell>
                      <TableCell align="center">Utilization Rate</TableCell>
                      <TableCell align="center">Top Leave Type</TableCell>
                      <TableCell align="center">Pending</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {departmentStats.map((dept) => (
                      <TableRow key={dept.department}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {dept.department}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">{dept.employeeCount}</TableCell>
                        <TableCell align="center">{dept.totalApplications}</TableCell>
                        <TableCell align="center">{dept.avgDaysPerEmployee}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${dept.utilizationRate}%`}
                            color={dept.utilizationRate > 80 ? 'success' : dept.utilizationRate > 60 ? 'warning' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">{dept.topLeaveType}</TableCell>
                        <TableCell align="center">
                          {dept.pendingApplications > 0 ? (
                            <Chip label={dept.pendingApplications} color="warning" size="small" />
                          ) : (
                            <Typography variant="body2" color="textSecondary">0</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {tabValue === 2 && (
          <Grid container spacing={3}>
            {/* Leave Type Pie Chart */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Leave Type Distribution
                  </Typography>
                  <Box height={400}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={leaveTypeBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ leaveType, percentage }) => `${leaveType}: ${percentage}%`}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {leaveTypeBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Leave Type Details */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Leave Type Breakdown
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Leave Type</TableCell>
                          <TableCell align="center">Count</TableCell>
                          <TableCell align="center">Percentage</TableCell>
                          <TableCell align="center">Avg Duration</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {leaveTypeBreakdown.map((type) => (
                          <TableRow key={type.leaveType}>
                            <TableCell>
                              <Box display="flex" alignItems="center">
                                <Box
                                  width={12}
                                  height={12}
                                  bgcolor={type.color}
                                  mr={1}
                                  borderRadius="50%"
                                />
                                {type.leaveType}
                              </Box>
                            </TableCell>
                            <TableCell align="center">{type.count}</TableCell>
                            <TableCell align="center">{type.percentage}%</TableCell>
                            <TableCell align="center">{type.avgDuration} days</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {tabValue === 3 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Detailed Report Data
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Period</TableCell>
                      <TableCell align="center">Applications</TableCell>
                      <TableCell align="center">Approved</TableCell>
                      <TableCell align="center">Rejected</TableCell>
                      <TableCell align="center">Pending</TableCell>
                      <TableCell align="center">Days Requested</TableCell>
                      <TableCell align="center">Days Approved</TableCell>
                      <TableCell align="center">Avg Processing</TableCell>
                      <TableCell align="center">Utilization</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.period}>
                        <TableCell>{dayjs(report.period).format('MMM YYYY')}</TableCell>
                        <TableCell align="center">{report.totalApplications}</TableCell>
                        <TableCell align="center">
                          <Chip label={report.approvedApplications} color="success" size="small" />
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={report.rejectedApplications} color="error" size="small" />
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={report.pendingApplications} color="warning" size="small" />
                        </TableCell>
                        <TableCell align="center">{report.totalDaysRequested}</TableCell>
                        <TableCell align="center">{report.totalDaysApproved}</TableCell>
                        <TableCell align="center">{report.averageProcessingTime} days</TableCell>
                        <TableCell align="center">{report.utilizationRate}%</TableCell>
                        <TableCell align="center">
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => setDetailDialogOpen(true)}>
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default LeaveReportsPage;