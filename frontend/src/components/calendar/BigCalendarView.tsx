import React, { useMemo, useState } from 'react';
import { Calendar, momentLocalizer, View, Views } from 'react-big-calendar';
import moment from 'moment';
import {
  Box,
  Paper,
  Toolbar,
  Button,
  ButtonGroup,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Today,
  NavigateBefore,
  NavigateNext,
  ViewWeek,
  ViewModule,
  ViewDay,
  Event as EventIcon
} from '@mui/icons-material';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Configure moment localizer
const localizer = momentLocalizer(moment);

interface LeaveEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  type: 'CASUAL_LEAVE' | 'SICK_LEAVE' | 'EARNED_LEAVE' | 'MATERNITY_LEAVE' | 'PATERNITY_LEAVE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  employeeName?: string;
  employeeId: string;
  reason?: string;
}

interface BigCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: LeaveEvent;
}

interface BigCalendarViewProps {
  leaves: LeaveEvent[];
  onLeaveClick?: (leave: LeaveEvent) => void;
  showTeamLeaves?: boolean;
  height?: number;
}

const leaveTypeColors = {
  CASUAL_LEAVE: '#2196f3',
  SICK_LEAVE: '#f44336',
  EARNED_LEAVE: '#4caf50',
  MATERNITY_LEAVE: '#9c27b0',
  PATERNITY_LEAVE: '#ff9800'
};

const statusColors = {
  PENDING: '#ff9800',
  APPROVED: '#4caf50',
  REJECTED: '#f44336'
};

const BigCalendarView: React.FC<BigCalendarViewProps> = ({
  leaves,
  onLeaveClick,
  showTeamLeaves = false,
  height = 600
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [currentView, setCurrentView] = useState<View>(Views.MONTH);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<LeaveEvent | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);

  // Convert leave events to Big Calendar format
  const calendarEvents: BigCalendarEvent[] = useMemo(() => {
    return leaves.map(leave => ({
      id: leave.id,
      title: showTeamLeaves
        ? `${leave.employeeName} - ${leave.type.replace('_', ' ')}`
        : leave.type.replace('_', ' '),
      start: new Date(leave.startDate),
      end: new Date(leave.endDate),
      allDay: true,
      resource: leave
    }));
  }, [leaves, showTeamLeaves]);

  // Custom event style getter
  const eventStyleGetter = (event: BigCalendarEvent) => {
    const leave = event.resource;
    const backgroundColor = leaveTypeColors[leave.type];
    const opacity = leave.status === 'REJECTED' ? 0.5 : 1;
    const borderColor = leave.status === 'PENDING' ? statusColors.PENDING : backgroundColor;

    return {
      style: {
        backgroundColor,
        borderColor,
        border: `2px solid ${borderColor}`,
        opacity,
        color: 'white',
        fontSize: '12px',
        borderRadius: '4px'
      }
    };
  };

  // Handle event selection
  const handleSelectEvent = (event: BigCalendarEvent) => {
    if (onLeaveClick) {
      onLeaveClick(event.resource);
    } else {
      setSelectedEvent(event.resource);
      setShowEventDialog(true);
    }
  };

  // Custom toolbar
  const CustomToolbar = ({ label, onNavigate, onView }: any) => (
    <Box sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      mb: 2,
      flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? 2 : 0
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button
          startIcon={<NavigateBefore />}
          onClick={() => onNavigate('PREV')}
          variant="outlined"
          size="small"
        >
          {isMobile ? '' : 'Previous'}
        </Button>
        <Button
          startIcon={<Today />}
          onClick={() => onNavigate('TODAY')}
          variant="contained"
          size="small"
        >
          Today
        </Button>
        <Button
          endIcon={<NavigateNext />}
          onClick={() => onNavigate('NEXT')}
          variant="outlined"
          size="small"
        >
          {isMobile ? '' : 'Next'}
        </Button>
      </Box>

      <Typography
        variant={isMobile ? "h6" : "h5"}
        sx={{ fontWeight: 'bold', textAlign: 'center' }}
      >
        {label}
      </Typography>

      <ButtonGroup size="small" variant="outlined">
        <Button
          onClick={() => onView('month')}
          variant={currentView === 'month' ? 'contained' : 'outlined'}
          startIcon={<ViewModule />}
        >
          {isMobile ? '' : 'Month'}
        </Button>
        <Button
          onClick={() => onView('week')}
          variant={currentView === 'week' ? 'contained' : 'outlined'}
          startIcon={<ViewWeek />}
        >
          {isMobile ? '' : 'Week'}
        </Button>
        <Button
          onClick={() => onView('day')}
          variant={currentView === 'day' ? 'contained' : 'outlined'}
          startIcon={<ViewDay />}
        >
          {isMobile ? '' : 'Day'}
        </Button>
      </ButtonGroup>
    </Box>
  );

  // Handle view change
  const handleViewChange = (newView: View) => {
    setCurrentView(newView);
  };

  // Handle date navigation
  const handleNavigate = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  return (
    <Box>
      <Paper sx={{ p: 2 }}>
        {/* Legend */}
        <Alert severity="info" sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
            <Typography variant="body2" sx={{ mr: 1 }}>
              <strong>Legend:</strong>
            </Typography>
            {Object.entries(leaveTypeColors).map(([type, color]) => (
              <Chip
                key={type}
                size="small"
                label={type.replace('_', ' ')}
                sx={{
                  backgroundColor: color,
                  color: 'white',
                  fontSize: '0.75rem'
                }}
              />
            ))}
          </Box>
        </Alert>

        {/* Calendar */}
        <Box sx={{ height: `${height}px` }}>
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            onSelectEvent={handleSelectEvent}
            onView={handleViewChange}
            onNavigate={handleNavigate}
            view={currentView}
            date={currentDate}
            eventPropGetter={eventStyleGetter}
            popup={true}
            popupOffset={30}
            components={{
              toolbar: CustomToolbar
            }}
            formats={{
              eventTimeRangeFormat: () => '',
              agendaTimeRangeFormat: () => '',
              selectRangeFormat: ({ start, end }) =>
                `${moment(start).format('MMM DD')} – ${moment(end).format('MMM DD')}`
            }}
            views={[Views.MONTH, Views.WEEK, Views.DAY]}
            step={60}
            showMultiDayTimes={false}
            messages={{
              allDay: 'All Day',
              previous: 'Previous',
              next: 'Next',
              today: 'Today',
              month: 'Month',
              week: 'Week',
              day: 'Day',
              agenda: 'Agenda',
              date: 'Date',
              time: 'Time',
              event: 'Event',
              noEventsInRange: 'No leave requests in this range.',
              showMore: (total) => `+${total} more`
            }}
          />
        </Box>
      </Paper>

      {/* Event Details Dialog */}
      <Dialog
        open={showEventDialog}
        onClose={() => setShowEventDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EventIcon />
            Leave Request Details
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedEvent && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Leave Type
                </Typography>
                <Chip
                  label={selectedEvent.type.replace('_', ' ')}
                  sx={{
                    backgroundColor: leaveTypeColors[selectedEvent.type],
                    color: 'white'
                  }}
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Duration
                </Typography>
                <Typography>
                  {moment(selectedEvent.startDate).format('MMM DD, YYYY')} -{' '}
                  {moment(selectedEvent.endDate).format('MMM DD, YYYY')}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  label={selectedEvent.status}
                  sx={{
                    backgroundColor: statusColors[selectedEvent.status],
                    color: 'white'
                  }}
                />
              </Box>

              {showTeamLeaves && selectedEvent.employeeName && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Employee
                  </Typography>
                  <Typography>{selectedEvent.employeeName}</Typography>
                </Box>
              )}

              {selectedEvent.reason && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Reason
                  </Typography>
                  <Typography>{selectedEvent.reason}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEventDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BigCalendarView;