import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  Avatar
} from '@mui/material'
import {
  CalendarMonth,
  TrendingUp,
  TrendingDown,
  AccountBalance,
  History,
  Download,
  Refresh,
  ExpandMore,
  CheckCircle,
  Schedule,
  Warning,
  Info,
  AttachMoney,
  Event,
  AccessTime,
  Timeline as TimelineIcon
} from '@mui/icons-material'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts'
import { format, startOfYear, endOfYear, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import api from '@/config/api'
import { LeaveType } from '@/types'
import { useAuth } from '@/hooks/useAuth'

interface LeaveBalance {
  id: string
  leaveType: LeaveType
  year: number
  totalEntitlement: number
  used: number
  available: number
  carryForward: number
  pending: number
  accrued: number
  expired: number
  encashed: number
  lastUpdated: string
}

interface LeaveTransaction {
  id: string
  leaveType: LeaveType
  transactionType: 'ACCRUAL' | 'USAGE' | 'CARRY_FORWARD' | 'EXPIRY' | 'ENCASHMENT' | 'ADJUSTMENT'
  amount: number
  date: string
  description: string
  referenceId?: string
  approvedBy?: string
}

interface YearwiseBalance {
  year: number
  balances: LeaveBalance[]
  transactions: LeaveTransaction[]
  summary: {
    totalEntitled: number
    totalUsed: number
    totalAvailable: number
    totalCarriedForward: number
    totalExpired: number
    totalEncashed: number
  }
}

const COLORS = {
  [LeaveType.SICK_LEAVE]: '#f44336',
  [LeaveType.CASUAL_LEAVE]: '#2196f3',
  [LeaveType.EARNED_LEAVE]: '#4caf50',
  [LeaveType.MATERNITY_LEAVE]: '#e91e63',
  [LeaveType.PATERNITY_LEAVE]: '#9c27b0',
  [LeaveType.COMPENSATORY_OFF]: '#ff9800',
  [LeaveType.BEREAVEMENT_LEAVE]: '#795548',
  [LeaveType.MARRIAGE_LEAVE]: '#ff5722'
}

const LeaveBalancePage: React.FC = () => {
  const { user } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [yearwiseBalances, setYearwiseBalances] = useState<YearwiseBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedTab, setSelectedTab] = useState(0)
  const [expandedAccordion, setExpandedAccordion] = useState<string | false>('balance-overview')

  useEffect(() => {
    fetchLeaveBalances()
  }, [])

  const fetchLeaveBalances = async () => {
    try {
      setLoading(true)
      const response = await api.get('/leaves/yearwise-balances')
      setYearwiseBalances(response.data.data)
    } catch (error) {
      console.error('Error fetching leave balances:', error)
      toast.error('Failed to load leave balances')
    } finally {
      setLoading(false)
    }
  }

  const getLeaveTypeLabel = (type: LeaveType) => {
    const labels: Record<LeaveType, string> = {
      [LeaveType.SICK_LEAVE]: 'Sick Leave',
      [LeaveType.CASUAL_LEAVE]: 'Casual Leave',
      [LeaveType.EARNED_LEAVE]: 'Earned Leave',
      [LeaveType.MATERNITY_LEAVE]: 'Maternity Leave',
      [LeaveType.PATERNITY_LEAVE]: 'Paternity Leave',
      [LeaveType.COMPENSATORY_OFF]: 'Comp Off',
      [LeaveType.BEREAVEMENT_LEAVE]: 'Bereavement',
      [LeaveType.MARRIAGE_LEAVE]: 'Marriage Leave'
    }
    return labels[type] || type.replace('_', ' ')
  }

  const getUtilizationPercentage = (used: number, total: number) => {
    return total > 0 ? Math.round((used / total) * 100) : 0
  }

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 80) return 'error'
    if (percentage >= 60) return 'warning'
    if (percentage >= 40) return 'info'
    return 'success'
  }

  const currentYearData = yearwiseBalances.find(yb => yb.year === selectedYear)
  const availableYears = yearwiseBalances.map(yb => yb.year).sort((a, b) => b - a)

  // Prepare chart data
  const pieChartData = currentYearData?.balances.map(balance => ({
    name: getLeaveTypeLabel(balance.leaveType),
    value: balance.available,
    color: COLORS[balance.leaveType]
  })) || []

  const utilizationChartData = currentYearData?.balances.map(balance => ({
    name: getLeaveTypeLabel(balance.leaveType),
    entitled: balance.totalEntitlement,
    used: balance.used,
    available: balance.available,
    utilization: getUtilizationPercentage(balance.used, balance.totalEntitlement)
  })) || []

  const yearlyTrendData = yearwiseBalances.map(yb => ({
    year: yb.year.toString(),
    totalEntitled: yb.summary.totalEntitled,
    totalUsed: yb.summary.totalUsed,
    totalAvailable: yb.summary.totalAvailable,
    utilizationRate: yb.summary.totalEntitled > 0 ?
      Math.round((yb.summary.totalUsed / yb.summary.totalEntitled) * 100) : 0
  })).sort((a, b) => parseInt(a.year) - parseInt(b.year))

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Leave Balance Overview
        </Typography>
        <LinearProgress />
      </Box>
    )
  }

  if (yearwiseBalances.length === 0) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Leave Balance Overview
        </Typography>
        <Alert severity="info">
          No leave balance data available. Please contact HR to set up your leave entitlements.
        </Alert>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Leave Balance Overview
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Comprehensive view of your leave balances across multiple years
          </Typography>
        </Box>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Year</InputLabel>
            <Select
              value={selectedYear}
              label="Year"
              onChange={(e) => setSelectedYear(e.target.value as number)}
            >
              {availableYears.map(year => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchLeaveBalances}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Current Year Summary Cards */}
      {currentYearData && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <AccountBalance color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {currentYearData.summary.totalEntitled}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Entitled
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Schedule color="warning" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {currentYearData.summary.totalUsed}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Days Used
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <CheckCircle color="success" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {currentYearData.summary.totalAvailable}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Available
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <TrendingUp color="info" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {Math.round((currentYearData.summary.totalUsed / currentYearData.summary.totalEntitled) * 100)}%
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Utilization
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs for different views */}
      <Card sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={selectedTab}
            onChange={(_, newValue) => setSelectedTab(newValue)}
            variant={isMobile ? "scrollable" : "fullWidth"}
            scrollButtons="auto"
          >
            <Tab label="Balance Overview" icon={<AccountBalance />} />
            <Tab label="Analytics" icon={<TrendingUp />} />
            <Tab label="Transaction History" icon={<History />} />
            <Tab label="Year-wise Comparison" icon={<TimelineIcon />} />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <CardContent>
          {/* Balance Overview Tab */}
          {selectedTab === 0 && currentYearData && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedYear} Leave Balance Details
              </Typography>

              {currentYearData.balances.map((balance, index) => (
                <Accordion
                  key={balance.id}
                  expanded={expandedAccordion === `balance-${index}`}
                  onChange={(_, isExpanded) => setExpandedAccordion(isExpanded ? `balance-${index}` : false)}
                  sx={{ mb: 1 }}
                >
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box display="flex" alignItems="center" gap={2} width="100%">
                      <Avatar sx={{ bgcolor: COLORS[balance.leaveType], width: 32, height: 32 }}>
                        {getLeaveTypeLabel(balance.leaveType).charAt(0)}
                      </Avatar>
                      <Box flex={1}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {getLeaveTypeLabel(balance.leaveType)}
                        </Typography>
                        <Box display="flex" gap={2} mt={0.5}>
                          <Chip label={`${balance.available} available`} size="small" color="success" />
                          <Chip label={`${balance.used} used`} size="small" color="warning" />
                          <Chip
                            label={`${getUtilizationPercentage(balance.used, balance.totalEntitlement)}% utilized`}
                            size="small"
                            color={getUtilizationColor(getUtilizationPercentage(balance.used, balance.totalEntitlement))}
                          />
                        </Box>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={8}>
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableBody>
                              <TableRow>
                                <TableCell><strong>Total Entitlement</strong></TableCell>
                                <TableCell>{balance.totalEntitlement} days</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell><strong>Accrued</strong></TableCell>
                                <TableCell>{balance.accrued} days</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell><strong>Used</strong></TableCell>
                                <TableCell>{balance.used} days</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell><strong>Available</strong></TableCell>
                                <TableCell>{balance.available} days</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell><strong>Pending Approval</strong></TableCell>
                                <TableCell>{balance.pending} days</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell><strong>Carry Forward</strong></TableCell>
                                <TableCell>{balance.carryForward} days</TableCell>
                              </TableRow>
                              {balance.expired > 0 && (
                                <TableRow>
                                  <TableCell><strong>Expired</strong></TableCell>
                                  <TableCell>{balance.expired} days</TableCell>
                                </TableRow>
                              )}
                              {balance.encashed > 0 && (
                                <TableRow>
                                  <TableCell><strong>Encashed</strong></TableCell>
                                  <TableCell>{balance.encashed} days</TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Box textAlign="center">
                          <Typography variant="subtitle2" gutterBottom>
                            Utilization Progress
                          </Typography>
                          <Box position="relative" display="inline-flex">
                            <CircularProgress
                              variant="determinate"
                              value={getUtilizationPercentage(balance.used, balance.totalEntitlement)}
                              size={100}
                              thickness={4}
                              color={getUtilizationColor(getUtilizationPercentage(balance.used, balance.totalEntitlement))}
                            />
                            <Box
                              position="absolute"
                              top={0}
                              left={0}
                              bottom={0}
                              right={0}
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              <Typography variant="h6" component="div">
                                {getUtilizationPercentage(balance.used, balance.totalEntitlement)}%
                              </Typography>
                            </Box>
                          </Box>
                          <Typography variant="caption" display="block" color="textSecondary" sx={{ mt: 1 }}>
                            Last updated: {format(parseISO(balance.lastUpdated), 'MMM dd, yyyy')}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}

          {/* Analytics Tab */}
          {selectedTab === 1 && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Available Leave Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Leave Utilization by Type
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={utilizationChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="entitled" fill="#e3f2fd" name="Entitled" />
                      <Bar dataKey="used" fill="#2196f3" name="Used" />
                      <Bar dataKey="available" fill="#4caf50" name="Available" />
                    </BarChart>
                  </ResponsiveContainer>
                </Grid>

                {yearlyTrendData.length > 1 && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Yearly Utilization Trend
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={yearlyTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Line type="monotone" dataKey="utilizationRate" stroke="#ff9800" strokeWidth={3} name="Utilization Rate %" />
                        <Line type="monotone" dataKey="totalUsed" stroke="#2196f3" strokeWidth={2} name="Days Used" />
                      </LineChart>
                    </ResponsiveContainer>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}

          {/* Transaction History Tab */}
          {selectedTab === 2 && currentYearData && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedYear} Transaction History
              </Typography>

              {currentYearData.transactions.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <History sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    No transactions found
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Leave transactions will appear here as they occur
                  </Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Leave Type</TableCell>
                        <TableCell>Transaction Type</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Description</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {currentYearData.transactions
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>
                              {format(parseISO(transaction.date), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={getLeaveTypeLabel(transaction.leaveType)}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={transaction.transactionType}
                                size="small"
                                color={
                                  transaction.transactionType === 'ACCRUAL' ? 'success' :
                                  transaction.transactionType === 'USAGE' ? 'warning' :
                                  transaction.transactionType === 'EXPIRY' ? 'error' :
                                  'info'
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Typography
                                color={transaction.amount > 0 ? 'success.main' : 'error.main'}
                                fontWeight="medium"
                              >
                                {transaction.amount > 0 ? '+' : ''}{transaction.amount} days
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {transaction.description}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* Year-wise Comparison Tab */}
          {selectedTab === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Year-wise Balance Comparison
              </Typography>

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Year</TableCell>
                      <TableCell>Total Entitled</TableCell>
                      <TableCell>Total Used</TableCell>
                      <TableCell>Total Available</TableCell>
                      <TableCell>Carried Forward</TableCell>
                      <TableCell>Expired</TableCell>
                      <TableCell>Encashed</TableCell>
                      <TableCell>Utilization %</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {yearwiseBalances
                      .sort((a, b) => b.year - a.year)
                      .map((yearData) => {
                        const utilizationRate = yearData.summary.totalEntitled > 0 ?
                          Math.round((yearData.summary.totalUsed / yearData.summary.totalEntitled) * 100) : 0

                        return (
                          <TableRow key={yearData.year} selected={yearData.year === selectedYear}>
                            <TableCell>
                              <Typography fontWeight={yearData.year === selectedYear ? 'bold' : 'normal'}>
                                {yearData.year}
                              </Typography>
                            </TableCell>
                            <TableCell>{yearData.summary.totalEntitled}</TableCell>
                            <TableCell>{yearData.summary.totalUsed}</TableCell>
                            <TableCell>{yearData.summary.totalAvailable}</TableCell>
                            <TableCell>{yearData.summary.totalCarriedForward}</TableCell>
                            <TableCell>{yearData.summary.totalExpired}</TableCell>
                            <TableCell>{yearData.summary.totalEncashed}</TableCell>
                            <TableCell>
                              <Chip
                                label={`${utilizationRate}%`}
                                size="small"
                                color={getUtilizationColor(utilizationRate)}
                              />
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
              </TableContainer>

              {yearlyTrendData.length > 1 && (
                <Box mt={4}>
                  <Typography variant="h6" gutterBottom>
                    Multi-Year Trends
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={yearlyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Line type="monotone" dataKey="totalEntitled" stroke="#4caf50" strokeWidth={2} name="Total Entitled" />
                      <Line type="monotone" dataKey="totalUsed" stroke="#2196f3" strokeWidth={2} name="Total Used" />
                      <Line type="monotone" dataKey="totalAvailable" stroke="#ff9800" strokeWidth={2} name="Total Available" />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default LeaveBalancePage