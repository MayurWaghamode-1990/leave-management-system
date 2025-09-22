import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Tab,
  Tabs,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  LinearProgress,
  Alert,
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
  Line
} from 'recharts';
import {
  Assessment,
  TrendingUp,
  GetApp,
  FilterList,
  Business,
  Schedule,
  PieChart as PieChartIcon
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import api from '@/config/api';
import toast from 'react-hot-toast';
import AdvancedAnalytics from '@/components/reports/AdvancedAnalytics';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`reports-tabpanel-${index}`}
      aria-labelledby={`reports-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    department: '',
    leaveType: '',
    status: ''
  });

  // Data states
  const [leaveReports, setLeaveReports] = useState<any[]>([]);
  const [departmentSummary, setDepartmentSummary] = useState<any[]>([]);
  const [leaveTypeAnalytics, setLeaveTypeAnalytics] = useState<any[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0
  });

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

  useEffect(() => {
    fetchKPIs();
  }, []);

  useEffect(() => {
    if (currentTab === 0) fetchLeaveReports();
    if (currentTab === 1) fetchDepartmentSummary();
    if (currentTab === 2) fetchLeaveTypeAnalytics();
    if (currentTab === 3) fetchMonthlyTrends();
    // Tab 4 is handled by AdvancedAnalytics component internally
  }, [currentTab, filters]);

  const fetchKPIs = async () => {
    try {
      const response = await api.get('/reports/kpis');
      setKpis(response.data.data);
    } catch (error) {
      console.error('Error fetching KPIs:', error);
    }
  };

  const fetchLeaveReports = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      });

      const response = await api.get(`/reports/leave-reports?${params}`);
      setLeaveReports(response.data.data.reports);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Error fetching leave reports:', error);
      toast.error('Failed to fetch leave reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentSummary = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reports/department-summary');
      setDepartmentSummary(response.data.data);
    } catch (error) {
      console.error('Error fetching department summary:', error);
      toast.error('Failed to fetch department summary');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveTypeAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reports/leave-type-analytics');
      setLeaveTypeAnalytics(response.data.data);
    } catch (error) {
      console.error('Error fetching leave type analytics:', error);
      toast.error('Failed to fetch leave type analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyTrends = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reports/monthly-trends');
      setMonthlyTrends(response.data.data);
    } catch (error) {
      console.error('Error fetching monthly trends:', error);
      toast.error('Failed to fetch monthly trends');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      department: '',
      leaveType: '',
      status: ''
    });
  };

  const handleExport = async (type: string) => {
    try {
      const response = await api.get(`/reports/export/csv?type=${type}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    return type.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'PENDING': return 'warning';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

  if (!user || (user.role !== 'HR_ADMIN' && user.role !== 'MANAGER')) {
    return (
      <Alert severity="error">
        You don't have permission to access reports and analytics.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Assessment />
            Reports & Analytics
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Comprehensive leave management insights and data analysis
          </Typography>
        </Box>
      </Box>

      {/* KPIs Overview */}
      {kpis && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{
                    bgcolor: 'primary.main',
                    borderRadius: '50%',
                    width: 48,
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <Assessment />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {kpis.overview.totalRequests}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Requests
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{
                    bgcolor: 'success.main',
                    borderRadius: '50%',
                    width: 48,
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <TrendingUp />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {kpis.overview.approvalRate}%
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Approval Rate
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{
                    bgcolor: 'warning.main',
                    borderRadius: '50%',
                    width: 48,
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <Schedule />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {kpis.overview.pendingRequests}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Pending Requests
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{
                    bgcolor: 'info.main',
                    borderRadius: '50%',
                    width: 48,
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <Business />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {kpis.overview.averageLeaveDuration}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Avg Duration (days)
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Leave Reports" />
          <Tab label="Department Analysis" />
          <Tab label="Leave Type Analytics" />
          <Tab label="Monthly Trends" />
          <Tab label="Advanced Analytics" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <TabPanel value={currentTab} index={0}>
        {/* Leave Reports */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">Leave Reports</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<FilterList />}
                  onClick={handleClearFilters}
                  size="small"
                >
                  Clear Filters
                </Button>
                <Button
                  variant="contained"
                  startIcon={<GetApp />}
                  onClick={() => handleExport('leave-reports')}
                  size="small"
                >
                  Export CSV
                </Button>
              </Box>
            </Box>

            {/* Filters */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  label="Start Date"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  label="End Date"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={filters.department}
                    label="Department"
                    onChange={(e) => handleFilterChange('department', e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="Engineering">Engineering</MenuItem>
                    <MenuItem value="Marketing">Marketing</MenuItem>
                    <MenuItem value="Sales">Sales</MenuItem>
                    <MenuItem value="HR">HR</MenuItem>
                    <MenuItem value="Finance">Finance</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Leave Type</InputLabel>
                  <Select
                    value={filters.leaveType}
                    label="Leave Type"
                    onChange={(e) => handleFilterChange('leaveType', e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="SICK_LEAVE">Sick Leave</MenuItem>
                    <MenuItem value="CASUAL_LEAVE">Casual Leave</MenuItem>
                    <MenuItem value="EARNED_LEAVE">Earned Leave</MenuItem>
                    <MenuItem value="MATERNITY_LEAVE">Maternity Leave</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    label="Status"
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="PENDING">Pending</MenuItem>
                    <MenuItem value="APPROVED">Approved</MenuItem>
                    <MenuItem value="REJECTED">Rejected</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {loading && <LinearProgress />}

            {/* Reports Table */}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Leave Type</TableCell>
                    <TableCell>Dates</TableCell>
                    <TableCell>Days</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Applied Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaveReports.map((report) => (
                    <TableRow key={`${report.employeeId}-${report.appliedDate}`}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {report.employeeName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {report.employeeId}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{report.department}</TableCell>
                      <TableCell>{getLeaveTypeLabel(report.leaveType)}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {report.startDate} to {report.endDate}
                        </Typography>
                      </TableCell>
                      <TableCell>{report.totalDays}</TableCell>
                      <TableCell>
                        <Chip
                          label={report.status}
                          size="small"
                          color={getStatusColor(report.status) as any}
                        />
                      </TableCell>
                      <TableCell>{report.appliedDate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Button
                disabled={pagination.currentPage <= 1}
                onClick={() => fetchLeaveReports(pagination.currentPage - 1)}
              >
                Previous
              </Button>
              <Typography sx={{ mx: 2, alignSelf: 'center' }}>
                Page {pagination.currentPage} of {pagination.totalPages}
              </Typography>
              <Button
                disabled={pagination.currentPage >= pagination.totalPages}
                onClick={() => fetchLeaveReports(pagination.currentPage + 1)}
              >
                Next
              </Button>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        {/* Department Analysis */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Department Leave Statistics
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={departmentSummary}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="approvedRequests" fill="#82ca9d" name="Approved" />
                    <Bar dataKey="pendingRequests" fill="#ffc658" name="Pending" />
                    <Bar dataKey="rejectedRequests" fill="#ff7c7c" name="Rejected" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Department Summary
                </Typography>
                {departmentSummary.map((dept) => (
                  <Box key={dept.department} sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight="medium">
                      {dept.department}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {dept.totalEmployees} employees • {dept.averageLeaveDays} avg days
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(dept.approvedRequests / (dept.approvedRequests + dept.pendingRequests + dept.rejectedRequests)) * 100}
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        {/* Leave Type Analytics */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Leave Type Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={leaveTypeAnalytics}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ leaveType, totalRequests }) => `${getLeaveTypeLabel(leaveType)}: ${totalRequests}`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="totalRequests"
                    >
                      {leaveTypeAnalytics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Leave Type Metrics
                </Typography>
                {leaveTypeAnalytics.map((type) => (
                  <Box key={type.leaveType} sx={{ mb: 3 }}>
                    <Typography variant="body2" fontWeight="medium">
                      {getLeaveTypeLabel(type.leaveType)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {type.totalRequests} requests • {type.approvalRate}% approval rate
                    </Typography>
                    <Typography variant="caption" display="block" color="textSecondary">
                      Avg {type.averageDuration} days
                    </Typography>
                    <Divider sx={{ mt: 1 }} />
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={currentTab} index={3}>
        {/* Monthly Trends */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Monthly Leave Trends
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="totalRequests" stroke="#8884d8" name="Total Requests" />
                <Line type="monotone" dataKey="approvalRate" stroke="#82ca9d" name="Approval Rate %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={currentTab} index={4}>
        {/* Advanced Analytics */}
        <AdvancedAnalytics refreshTrigger={currentTab === 4 ? Date.now() : 0} />
      </TabPanel>
    </Box>
  );
};

export default ReportsPage