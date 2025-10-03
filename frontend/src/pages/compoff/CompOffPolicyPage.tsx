import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  LinearProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  Policy,
  Schedule,
  AccessTime,
  Event,
  CheckCircle,
  Info,
  Warning,
  Timer,
  CalendarToday,
  BusinessCenter
} from '@mui/icons-material';
import toast from 'react-hot-toast';

import api from '@/config/api';
import { useAuth } from '@/hooks/useAuth';

interface CompOffPolicy {
  minimumHoursForHalfDay: number;
  minimumHoursForFullDay: number;
  maximumHoursPerDay: number;
  expiryMonths: number;
  allowedWorkTypes: string[];
  requiresManagerVerification: boolean;
  maxCompOffDaysPerMonth: number;
  weekendWorkWindow: {
    startDay: number;
    endDay: number;
  };
}

interface PolicyStatistics {
  totalEmployees: number;
  activeCompOffRequests: number;
  pendingVerifications: number;
  expiredCompOffs: number;
  totalHoursLogged: number;
  averageMonthlyUsage: number;
}

const CompOffPolicyPage: React.FC = () => {
  const { user } = useAuth();
  const [policy, setPolicy] = useState<CompOffPolicy | null>(null);
  const [statistics, setStatistics] = useState<PolicyStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolicyData();
    if (user?.role === 'HR_ADMIN') {
      fetchStatistics();
    }
  }, [user]);

  const fetchPolicyData = async () => {
    try {
      const response = await api.get('/comp-off/policy');
      setPolicy(response.data.data.policy);
    } catch (error: any) {
      toast.error('Failed to fetch comp off policy');
      console.error('Policy fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      // Mock statistics data - in real implementation, add API endpoint
      setStatistics({
        totalEmployees: 150,
        activeCompOffRequests: 25,
        pendingVerifications: 8,
        expiredCompOffs: 12,
        totalHoursLogged: 2840,
        averageMonthlyUsage: 3.2
      });
    } catch (error: any) {
      console.error('Statistics fetch error:', error);
    }
  };

  const getWorkTypeLabel = (workType: string) => {
    switch (workType) {
      case 'WEEKEND':
        return 'Weekend Work';
      case 'HOLIDAY':
        return 'Holiday Work';
      case 'EXTENDED_HOURS':
        return 'Extended Hours';
      default:
        return workType;
    }
  };

  const getDayName = (dayNumber: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNumber];
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Comp Off Policy
        </Typography>
        <LinearProgress sx={{ mb: 2 }} />
      </Box>
    );
  }

  if (!policy) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Comp Off Policy
        </Typography>
        <Alert severity="error">
          Failed to load comp off policy configuration.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          <Policy sx={{ mr: 1, verticalAlign: 'middle' }} />
          Comp Off Policy
        </Typography>
        <Chip
          icon={<CheckCircle />}
          label="Active Policy"
          color="success"
          variant="outlined"
        />
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          This page displays the current Compensatory Off (Comp Off) policy configuration.
          Comp Off allows employees to take time off in exchange for extra hours worked during weekends, holidays, or extended hours.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {/* Policy Overview */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Schedule sx={{ mr: 1, verticalAlign: 'middle' }} />
                Policy Configuration
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box mb={2}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      <AccessTime sx={{ mr: 1, fontSize: 16, verticalAlign: 'middle' }} />
                      Hours Calculation
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <Timer fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={`Half Day: ${policy.minimumHoursForHalfDay} hours minimum`}
                          secondary="Equivalent to 0.5 day off"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <Timer fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={`Full Day: ${policy.minimumHoursForFullDay} hours minimum`}
                          secondary="Equivalent to 1 day off"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <Warning fontSize="small" color="warning" />
                        </ListItemIcon>
                        <ListItemText
                          primary={`Maximum: ${policy.maximumHoursPerDay} hours per day`}
                          secondary="Maximum trackable hours in a single day"
                        />
                      </ListItem>
                    </List>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box mb={2}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      <Event sx={{ mr: 1, fontSize: 16, verticalAlign: 'middle' }} />
                      Validity & Limits
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <CalendarToday fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={`Expiry: ${policy.expiryMonths} months`}
                          secondary="Comp off expires after approval"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <BusinessCenter fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={`Monthly Limit: ${policy.maxCompOffDaysPerMonth} days`}
                          secondary="Maximum comp off days per month"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <CheckCircle fontSize="small" color="success" />
                        </ListItemIcon>
                        <ListItemText
                          primary={policy.requiresManagerVerification ? "Manager Verification Required" : "No Verification Required"}
                          secondary="Work log approval process"
                        />
                      </ListItem>
                    </List>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Stats */}
        {user?.role === 'HR_ADMIN' && statistics && (
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Info sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Statistics
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary">
                        {statistics.totalEmployees}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Total Employees
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="warning.main">
                        {statistics.activeCompOffRequests}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Active Requests
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="info.main">
                        {statistics.pendingVerifications}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Pending Verification
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="error.main">
                        {statistics.expiredCompOffs}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Expired This Month
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Total Hours Logged: <strong>{statistics.totalHoursLogged.toLocaleString()}</strong>
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Avg Monthly Usage: <strong>{statistics.averageMonthlyUsage} days</strong>
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Allowed Work Types */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Allowed Work Types
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Work Type</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {policy.allowedWorkTypes.map((workType) => (
                      <TableRow key={workType}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {getWorkTypeLabel(workType)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="textSecondary">
                            {workType === 'WEEKEND' && 'Work performed on weekends'}
                            {workType === 'HOLIDAY' && 'Work performed on public holidays'}
                            {workType === 'EXTENDED_HOURS' && 'Work beyond regular office hours'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label="Allowed"
                            color="success"
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Weekend Work Window */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Weekend Work Window
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box>
                <Typography variant="body1" gutterBottom>
                  Weekend work is allowed between:
                </Typography>
                <Box display="flex" alignItems="center" gap={2} mt={2}>
                  <Chip
                    label={getDayName(policy.weekendWorkWindow.startDay)}
                    color="primary"
                    variant="outlined"
                  />
                  <Typography variant="body2">to</Typography>
                  <Chip
                    label={getDayName(policy.weekendWorkWindow.endDay)}
                    color="primary"
                    variant="outlined"
                  />
                </Box>
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Work performed during these days is eligible for comp off, subject to manager verification and policy limits.
                  </Typography>
                </Alert>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Policy Guidelines */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Policy Guidelines & Rules
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Eligibility Requirements
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle fontSize="small" color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Work must be performed during allowed periods"
                        secondary="Weekend, holidays, or extended hours only"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle fontSize="small" color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Minimum 5 hours for half-day comp off"
                        secondary="8 hours required for full-day comp off"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle fontSize="small" color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Manager verification required"
                        secondary="Work log must be approved by reporting manager"
                      />
                    </ListItem>
                  </List>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="warning.main" gutterBottom>
                    Important Restrictions
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <Warning fontSize="small" color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Comp off expires after 3 months"
                        secondary="Must be utilized within expiry period"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Warning fontSize="small" color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Maximum 4 comp off days per month"
                        secondary="To prevent abuse and ensure work-life balance"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Warning fontSize="small" color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary="No carry-forward to next year"
                        secondary="Unused comp offs expire at year-end"
                      />
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CompOffPolicyPage;