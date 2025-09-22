import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Stack,
  Alert
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Today,
  ViewWeek,
  ViewModule,
  People,
  Warning,
  Event,
  FilterList
} from '@mui/icons-material';
import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import dayjs from 'dayjs';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import api from '@/config/api';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: {
    'en-US': enUS,
  },
});

interface LeaveEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    employeeId: string;
    employeeName: string;
    employeeAvatar?: string;
    leaveType: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    isHalfDay: boolean;
    halfDayPeriod?: 'MORNING' | 'AFTERNOON';
    reason: string;
    urgency?: 'low' | 'medium' | 'high' | 'urgent';
  };
}

interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  isActive: boolean;
}

interface CalendarStats {
  totalOnLeave: number;
  pendingApprovals: number;
  upcomingLeaves: number;
  conflictingRequests: number;
}

const TeamCalendarView: React.FC = () => {
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState<LeaveEvent[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<LeaveEvent | null>(null);
  const [eventDialog, setEventDialog] = useState(false);
  const [stats, setStats] = useState<CalendarStats>({
    totalOnLeave: 0,
    pendingApprovals: 0,
    upcomingLeaves: 0,
    conflictingRequests: 0
  });

  useEffect(() => {
    fetchCalendarData();
  }, [date, view, selectedEmployee, statusFilter]);

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const startDate = getViewStartDate();
      const endDate = getViewEndDate();

      const [eventsRes, teamRes, statsRes] = await Promise.all([
        api.get('/leaves/calendar', {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            employeeId: selectedEmployee !== 'all' ? selectedEmployee : undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined
          }
        }),
        api.get('/users/team'),
        api.get('/reports/calendar-stats', {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          }
        })
      ]);

      const formattedEvents = eventsRes.data.data.map((event: any) => ({
        id: event.id,
        title: `${event.employeeName} - ${event.leaveType}`,
        start: new Date(event.startDate),
        end: new Date(event.endDate),
        resource: {
          employeeId: event.employeeId,
          employeeName: event.employeeName,
          employeeAvatar: event.employeeAvatar,
          leaveType: event.leaveType,
          status: event.status,
          isHalfDay: event.isHalfDay,
          halfDayPeriod: event.halfDayPeriod,
          reason: event.reason,
          urgency: event.urgency
        }
      }));

      setEvents(formattedEvents);
      setTeamMembers(teamRes.data.data || []);
      setStats(statsRes.data.data || stats);
    } catch (error) {
      console.error('Failed to fetch calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getViewStartDate = () => {
    switch (view) {
      case Views.MONTH:
        return dayjs(date).startOf('month').subtract(7, 'day').toDate();
      case Views.WEEK:
        return dayjs(date).startOf('week').toDate();
      case Views.DAY:
        return dayjs(date).startOf('day').toDate();
      default:
        return dayjs(date).startOf('month').toDate();
    }
  };

  const getViewEndDate = () => {
    switch (view) {
      case Views.MONTH:
        return dayjs(date).endOf('month').add(7, 'day').toDate();
      case Views.WEEK:
        return dayjs(date).endOf('week').toDate();
      case Views.DAY:
        return dayjs(date).endOf('day').toDate();
      default:
        return dayjs(date).endOf('month').toDate();
    }
  };

  const eventStyleGetter = (event: LeaveEvent) => {
    const { status, urgency, isHalfDay } = event.resource;

    let backgroundColor = '#3174ad';
    let borderColor = '#3174ad';
    let opacity = 1;

    switch (status) {
      case 'PENDING':
        backgroundColor = '#ff9800';
        borderColor = '#ff9800';
        break;
      case 'APPROVED':
        backgroundColor = '#4caf50';
        borderColor = '#4caf50';
        break;
      case 'REJECTED':
        backgroundColor = '#f44336';
        borderColor = '#f44336';
        opacity = 0.6;
        break;
    }

    if (urgency === 'urgent') {
      borderColor = '#d32f2f';
      borderWidth = '3px';
    }

    if (isHalfDay) {
      opacity = 0.7;
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        borderWidth: urgency === 'urgent' ? '3px' : '1px',
        opacity,
        color: 'white',
        borderRadius: '4px',
        fontSize: '12px'
      }
    };
  };

  const handleSelectEvent = (event: LeaveEvent) => {
    setSelectedEvent(event);
    setEventDialog(true);
  };

  const handleNavigate = (newDate: Date) => {
    setDate(newDate);
  };

  const handleViewChange = (newView: View) => {
    setView(newView);
  };

  const getConflicts = (targetDate: Date) => {
    const dayEvents = events.filter(event =>
      dayjs(event.start).isSame(targetDate, 'day') &&
      event.resource.status === 'APPROVED'
    );
    return dayEvents.length;
  };

  const CustomToolbar = ({ label, onNavigate, onView }: any) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h6">{label}</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={() => onNavigate('PREV')}>
            <ChevronLeft />
          </IconButton>
          <Button
            variant="outlined"
            size="small"
            onClick={() => onNavigate('TODAY')}
            startIcon={<Today />}
          >
            Today
          </Button>
          <IconButton onClick={() => onNavigate('NEXT')}>
            <ChevronRight />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant={view === Views.MONTH ? 'contained' : 'outlined'}
          size="small"
          onClick={() => onView(Views.MONTH)}
          startIcon={<ViewModule />}
        >
          Month
        </Button>
        <Button
          variant={view === Views.WEEK ? 'contained' : 'outlined'}
          size="small"
          onClick={() => onView(Views.WEEK)}
          startIcon={<ViewWeek />}
        >
          Week
        </Button>
        <Button
          variant={view === Views.DAY ? 'contained' : 'outlined'}
          size="small"
          onClick={() => onView(Views.DAY)}
          startIcon={<Event />}
        >
          Day
        </Button>
      </Box>
    </Box>
  );

  const dayPropGetter = (date: Date) => {
    const conflicts = getConflicts(date);
    if (conflicts > 3) {
      return {
        style: {
          backgroundColor: '#ffebee',
          border: '1px solid #f44336'
        }
      };
    }
    return {};
  };

  return (
    <Box>
      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'success.main' }}>
                <People />
              </Avatar>
              <Box>
                <Typography variant="h6">{stats.totalOnLeave}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Currently on Leave
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'warning.main' }}>
                <Warning />
              </Avatar>
              <Box>
                <Typography variant="h6">{stats.pendingApprovals}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending Approvals
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'info.main' }}>
                <Event />
              </Avatar>
              <Box>
                <Typography variant="h6">{stats.upcomingLeaves}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Upcoming Leaves
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'error.main' }}>
                <Warning />
              </Avatar>
              <Box>
                <Typography variant="h6">{stats.conflictingRequests}</Typography>
                <Typography variant="body2" color="text.secondary">
                  High Coverage Days
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FilterList />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Employee</InputLabel>
              <Select
                value={selectedEmployee}
                label="Employee"
                onChange={(e) => setSelectedEmployee(e.target.value)}
              >
                <MenuItem value="all">All Employees</MenuItem>
                {teamMembers.map((member) => (
                  <MenuItem key={member.id} value={member.id}>
                    {member.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="APPROVED">Approved</MenuItem>
                <MenuItem value="REJECTED">Rejected</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
              <Chip label="🟢 Approved" size="small" />
              <Chip label="🟡 Pending" size="small" />
              <Chip label="🔴 Rejected" size="small" />
              <Chip label="🔵 Half Day" size="small" />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardContent>
          <Box sx={{ height: 600 }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              view={view}
              date={date}
              onNavigate={handleNavigate}
              onView={handleViewChange}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              dayPropGetter={dayPropGetter}
              components={{
                toolbar: CustomToolbar
              }}
              popup
              selectable
              views={[Views.MONTH, Views.WEEK, Views.DAY]}
              step={60}
              showMultiDayTimes
            />
          </Box>
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      <Dialog
        open={eventDialog}
        onClose={() => setEventDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Leave Request Details
        </DialogTitle>
        <DialogContent>
          {selectedEvent && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar src={selectedEvent.resource.employeeAvatar}>
                  {selectedEvent.resource.employeeName.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedEvent.resource.employeeName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedEvent.resource.leaveType}
                    {selectedEvent.resource.isHalfDay && ` (${selectedEvent.resource.halfDayPeriod?.toLowerCase()} half-day)`}
                  </Typography>
                </Box>
                <Box sx={{ ml: 'auto' }}>
                  <Chip
                    label={selectedEvent.resource.status}
                    color={
                      selectedEvent.resource.status === 'APPROVED' ? 'success' :
                      selectedEvent.resource.status === 'PENDING' ? 'warning' : 'error'
                    }
                  />
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Start Date</Typography>
                  <Typography>{dayjs(selectedEvent.start).format('MMMM DD, YYYY')}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">End Date</Typography>
                  <Typography>{dayjs(selectedEvent.end).format('MMMM DD, YYYY')}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Reason</Typography>
                  <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                    <Typography>{selectedEvent.resource.reason}</Typography>
                  </Paper>
                </Grid>
              </Grid>

              {selectedEvent.resource.urgency === 'urgent' && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  This is an urgent leave request requiring immediate attention.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default TeamCalendarView;