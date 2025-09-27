import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Breadcrumbs,
  Link,
  Tab,
  Tabs,
  Paper,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Divider,
  Button,
  ButtonGroup
} from '@mui/material';
import {
  Home,
  Assessment,
  TableChart,
  Analytics,
  Download,
  Refresh
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import api from '@/config/api';
import toast from 'react-hot-toast';
import AdvancedReportsFilter, { ReportFilters, FilterOptions } from '@/components/reports/AdvancedReportsFilter';
import AdvancedAnalyticsDashboard from '@/components/reports/AdvancedAnalyticsDashboard';
import ResponsiveTable from '@/components/common/ResponsiveTable';
import dayjs from 'dayjs';

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

interface LeaveReportRow {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  department: string;
  location: string;
  manager: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  isHalfDay: boolean;
  status: string;
  appliedDate: Date;
  approvedBy?: string;
  approvedAt?: Date;
  reason: string;
}

const AdvancedReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Data states
  const [reportData, setReportData] = useState<LeaveReportRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [analytics, setAnalytics] = useState<any>(null);
  const [utilization, setUtilization] = useState<any[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    departments: [],
    locations: [],
    leaveTypes: [],
    managers: [],
    regions: []
  });

  // Filter state
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: dayjs().subtract(30, 'days'),
    endDate: dayjs(),
    departments: [],
    locations: [],
    employeeIds: [],
    leaveTypes: [],
    statuses: [],
    managers: [],
    regions: [],
    minDuration: 0.5,
    maxDuration: 30,
    includeHalfDays: true,
    sortBy: 'date',
    sortOrder: 'desc',
    limit: 100,
    offset: 0
  });

  // Load filter options
  const loadFilterOptions = useCallback(async () => {
    try {
      const response = await api.get('/advanced-reports/filter-options');
      if (response.data.success) {
        setFilterOptions(response.data.data);
      }
    } catch (error: any) {
      console.error('Error loading filter options:', error);
      toast.error('Failed to load filter options');
    }
  }, []);

  // Apply filters and fetch report data
  const applyFilters = useCallback(async () => {
    try {
      setLoading(true);

      const filterPayload = {
        ...filters,
        startDate: filters.startDate?.toISOString(),
        endDate: filters.endDate?.toISOString()
      };

      const response = await api.post('/advanced-reports/filtered-reports', filterPayload);

      if (response.data.success) {
        setReportData(response.data.data);
        setTotalCount(response.data.totalCount);
        setAnalytics(response.data.summary);
        toast.success(`Generated report with ${response.data.totalCount} records`);
      } else {
        throw new Error(response.data.message || 'Failed to generate report');
      }
    } catch (error: any) {
      console.error('Error applying filters:', error);
      toast.error(error.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Load utilization data
  const loadUtilizationData = useCallback(async () => {
    try {
      setAnalyticsLoading(true);
      const response = await api.get('/advanced-reports/utilization');
      if (response.data.success) {
        setUtilization(response.data.data);
      }
    } catch (error: any) {
      console.error('Error loading utilization data:', error);
      toast.error('Failed to load utilization data');
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  // Export report data
  const handleExport = useCallback(async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      setExportLoading(true);

      const filterPayload = {
        ...filters,
        startDate: filters.startDate?.toISOString(),
        endDate: filters.endDate?.toISOString()
      };

      const response = await api.post('/advanced-reports/export', {
        format,
        filters: filterPayload
      }, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const timestamp = dayjs().format('YYYY-MM-DD');
      link.setAttribute('download', `leave-report-${timestamp}.${format}`);

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error: any) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    } finally {
      setExportLoading(false);
    }
  }, [filters]);

  // Initial load
  useEffect(() => {
    loadFilterOptions();
    loadUtilizationData();
    // Apply default filters on load
    applyFilters();
  }, [loadFilterOptions, loadUtilizationData, applyFilters]);

  // Table columns configuration
  const tableColumns = [
    {
      field: 'employeeName',
      headerName: 'Employee',
      minWidth: 150,
      hideOnMobile: false
    },
    {
      field: 'department',
      headerName: 'Department',
      minWidth: 120,
      hideOnMobile: true
    },
    {
      field: 'leaveType',
      headerName: 'Leave Type',
      minWidth: 120,
      hideOnMobile: false,
      renderCell: (value: string) => (
        <span>{value.replace('_', ' ')}</span>
      )
    },
    {
      field: 'startDate',
      headerName: 'Start Date',
      minWidth: 100,
      hideOnMobile: false,
      renderCell: (value: Date) => dayjs(value).format('MMM DD, YYYY')
    },
    {
      field: 'endDate',
      headerName: 'End Date',
      minWidth: 100,
      hideOnMobile: true,
      renderCell: (value: Date) => dayjs(value).format('MMM DD, YYYY')
    },
    {
      field: 'totalDays',
      headerName: 'Days',
      minWidth: 80,
      hideOnMobile: false
    },
    {
      field: 'status',
      headerName: 'Status',
      minWidth: 100,
      hideOnMobile: false,
      renderCell: (value: string) => (
        <span style={{
          color: value === 'APPROVED' ? 'green' :
                 value === 'REJECTED' ? 'red' :
                 value === 'PENDING' ? 'orange' : 'gray'
        }}>
          {value}
        </span>
      )
    },
    {
      field: 'appliedDate',
      headerName: 'Applied',
      minWidth: 100,
      hideOnMobile: true,
      renderCell: (value: Date) => dayjs(value).format('MMM DD, YYYY')
    }
  ];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  // Check if user has access to advanced reports
  if (!user || !['HR_ADMIN', 'MANAGER'].includes(user.role)) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 3 }}>
          <Alert severity="error">
            You don't have permission to access advanced reports.
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link
            underline="hover"
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            color="inherit"
            onClick={() => navigate('/')}
          >
            <Home sx={{ mr: 0.5 }} fontSize="inherit" />
            Dashboard
          </Link>
          <Link
            underline="hover"
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            color="inherit"
            onClick={() => navigate('/reports')}
          >
            <Assessment sx={{ mr: 0.5 }} fontSize="inherit" />
            Reports
          </Link>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Analytics sx={{ mr: 0.5 }} fontSize="inherit" />
            Advanced Reports
          </Box>
        </Breadcrumbs>

        {/* Page Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Analytics />
              Advanced Reports & Analytics
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Comprehensive leave analytics with advanced filtering and insights
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              startIcon={<Refresh />}
              onClick={() => {
                loadFilterOptions();
                loadUtilizationData();
                applyFilters();
              }}
              disabled={loading || analyticsLoading}
            >
              Refresh
            </Button>
            <ButtonGroup variant="outlined" size="small">
              <Button
                onClick={() => handleExport('csv')}
                disabled={exportLoading || !reportData.length}
                startIcon={<Download />}
              >
                CSV
              </Button>
              <Button
                onClick={() => handleExport('excel')}
                disabled={exportLoading || !reportData.length}
                startIcon={<Download />}
              >
                Excel
              </Button>
              <Button
                onClick={() => handleExport('pdf')}
                disabled={exportLoading || !reportData.length}
                startIcon={<Download />}
              >
                PDF
              </Button>
            </ButtonGroup>
          </Box>
        </Box>

        {/* Filters */}
        <Box sx={{ mb: 3 }}>
          <AdvancedReportsFilter
            filters={filters}
            onFiltersChange={setFilters}
            onApplyFilters={applyFilters}
            onExport={handleExport}
            loading={loading}
            filterOptions={filterOptions}
            onLoadFilterOptions={loadFilterOptions}
          />
        </Box>

        {/* Report Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Analytics Dashboard" icon={<Analytics />} />
            <Tab label="Detailed Report" icon={<TableChart />} />
          </Tabs>
        </Paper>

        {/* Tab Panels */}
        <TabPanel value={currentTab} index={0}>
          {analytics && (
            <AdvancedAnalyticsDashboard
              analytics={analytics}
              utilization={utilization}
              loading={analyticsLoading}
            />
          )}
          {!analytics && !analyticsLoading && (
            <Alert severity="info">
              Apply filters to generate analytics dashboard.
            </Alert>
          )}
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Leave Reports ({totalCount.toLocaleString()} records)
                </Typography>
                {loading && <CircularProgress size={24} />}
              </Box>

              {reportData.length > 0 ? (
                <ResponsiveTable
                  columns={tableColumns}
                  rows={reportData}
                  loading={loading}
                  getRowId={(row) => row.id}
                  emptyMessage="No leave requests found for the selected filters"
                />
              ) : !loading ? (
                <Alert severity="info">
                  No data found for the selected filters. Try adjusting your filter criteria.
                </Alert>
              ) : null}

              {reportData.length > 0 && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2" color="textSecondary">
                    Showing {reportData.length} of {totalCount.toLocaleString()} records.
                    Use pagination controls to view more data.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </TabPanel>
      </Box>
    </Container>
  );
};

export default AdvancedReportsPage;