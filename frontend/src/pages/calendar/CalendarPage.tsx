import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Alert,
  Tab,
  Tabs,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  CalendarMonth,
  Event,
  People,
  Timeline,
  Refresh
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import LeaveCalendar from '@/components/calendar/LeaveCalendar';
import BigCalendarView from '@/components/calendar/BigCalendarView';
import TimelineView from '@/components/calendar/TimelineView';
import { useCalendarData } from '@/hooks/useCalendarData';

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
      id={`calendar-tabpanel-${index}`}
      aria-labelledby={`calendar-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);

  const isManager = user?.role === 'MANAGER' || user?.role === 'HR_ADMIN' || user?.role === 'IT_ADMIN';

  // Get calendar data for personal view
  const {
    events: personalEvents,
    loading: personalLoading,
    error: personalError,
    refreshData: refreshPersonal,
    statistics: personalStats
  } = useCalendarData(false);

  // Get calendar data for team view (only for managers)
  const {
    events: teamEvents,
    loading: teamLoading,
    error: teamError,
    refreshData: refreshTeam,
    statistics: teamStats
  } = useCalendarData(isManager);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  // Determine which data to show based on current tab and user role
  const currentEvents = currentTab === 0 ? personalEvents : teamEvents;
  const currentLoading = currentTab === 0 ? personalLoading : teamLoading;
  const currentError = currentTab === 0 ? personalError : teamError;
  const currentStats = currentTab === 0 ? personalStats : teamStats;
  const refreshCurrent = currentTab === 0 ? refreshPersonal : refreshTeam;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarMonth />
            Leave Calendar
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Interactive calendar view for managing and visualizing leave schedules
          </Typography>
        </Box>
        <Button
          startIcon={currentLoading ? <CircularProgress size={20} /> : <Refresh />}
          onClick={refreshCurrent}
          disabled={currentLoading}
          variant="outlined"
        >
          Refresh
        </Button>
      </Box>

      {/* Error Alert */}
      {currentError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {currentError}
        </Alert>
      )}

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Event color="primary" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {currentLoading ? <CircularProgress size={24} /> : currentStats.upcomingEvents}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Upcoming Leaves
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
                <People color="info" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {currentLoading ? <CircularProgress size={24} /> : currentStats.thisMonthEvents}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    This Month
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
                <Timeline color="warning" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {currentLoading ? <CircularProgress size={24} /> : currentStats.pendingThisMonth}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Pending Approval
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
                <CalendarMonth color="success" />
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {currentLoading ? <CircularProgress size={24} /> : currentStats.approvedThisMonth}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Approved This Month
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Legend */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Calendar Legend
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: 0.5,
                  backgroundColor: '#4CAF50'
                }}
              />
              <Typography variant="body2">Approved</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: 0.5,
                  backgroundColor: '#FF9800'
                }}
              />
              <Typography variant="body2">Pending</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: 0.5,
                  backgroundColor: '#F44336'
                }}
              />
              <Typography variant="body2">Rejected</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: 0.5,
                  backgroundColor: '#2196F3'
                }}
              />
              <Typography variant="body2">Casual Leave</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: 0.5,
                  backgroundColor: '#FF5722'
                }}
              />
              <Typography variant="body2">Sick Leave</Typography>
            </Box>
          </Box>
          {isManager && (
            <Alert severity="info" sx={{ mt: 2 }}>
              💡 <strong>Tip:</strong> As a manager, you can drag and drop leave events to reschedule them.
              Click on any leave event to view details or make changes.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Tabs for different calendar views */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            label="Grid View"
            icon={<CalendarMonth />}
          />
          <Tab
            label="Calendar View"
            icon={<Event />}
          />
          {isManager && (
            <>
              <Tab label="Team View" icon={<People />} />
              <Tab label="Timeline View" icon={<Timeline />} />
            </>
          )}
        </Tabs>
      </Paper>

      {/* Calendar Views */}
      {/* Grid View */}
      <TabPanel value={currentTab} index={0}>
        {currentLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <LeaveCalendar
            leaves={personalEvents}
            showTeamLeaves={false}
          />
        )}
      </TabPanel>

      {/* Big Calendar View */}
      <TabPanel value={currentTab} index={1}>
        {currentLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <BigCalendarView
            leaves={personalEvents}
            showTeamLeaves={false}
            height={700}
          />
        )}
      </TabPanel>

      {isManager && (
        <>
          {/* Team View */}
          <TabPanel value={currentTab} index={2}>
            {teamLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <BigCalendarView
                leaves={teamEvents}
                showTeamLeaves={true}
                height={700}
              />
            )}
          </TabPanel>

          {/* Timeline View */}
          <TabPanel value={currentTab} index={3}>
            {teamLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TimelineView
                leaves={teamEvents}
                onLeaveClick={(leave) => {
                  // Navigate to leave details or approval page
                  console.log('Leave clicked:', leave);
                }}
              />
            )}
          </TabPanel>
        </>
      )}
    </Box>
  );
};

export default CalendarPage;