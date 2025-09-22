import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  Tooltip,
  useMediaQuery,
  useTheme,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Badge,
  Fab,
  Drawer,
  Alert
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Add,
  Edit,
  Delete,
  Person,
  Event,
  Today,
  CalendarMonth,
  FilterList,
  ViewModule,
  ViewWeek,
  ViewDay,
  Refresh,
  Close,
  DragIndicator
} from '@mui/icons-material';
import dayjs, { Dayjs } from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { useAuth } from '@/hooks/useAuth';
import { LeaveType, LeaveStatus } from '@/types';
import toast from 'react-hot-toast';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

interface LeaveEvent {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: LeaveType;
  status: LeaveStatus;
  startDate: string;
  endDate: string;
  reason: string;
  totalDays: number;
  color: string;
  avatar?: string;
}

interface CalendarProps {
  events?: LeaveEvent[];
  editable?: boolean;
  showTeamLeaves?: boolean;
}

type ViewMode = 'month' | 'week' | 'day';

const InteractiveLeaveCalendar: React.FC<CalendarProps> = ({
  events: initialEvents = [],
  editable = true,
  showTeamLeaves = true
}) => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [viewMode, setViewMode] = useState<ViewMode>(isMobile ? 'day' : 'month');
  const [events, setEvents] = useState<LeaveEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<LeaveEvent | null>(null);
  const [draggedEvent, setDraggedEvent] = useState<LeaveEvent | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    department: 'all',
    leaveType: 'all',
    status: 'all',
    showOwnOnly: false
  });

  // Mock events data
  const mockEvents: LeaveEvent[] = [
    {
      id: '1',
      employeeId: 'EMP001',
      employeeName: 'John Doe',
      department: 'Engineering',
      leaveType: LeaveType.SICK_LEAVE,
      status: LeaveStatus.APPROVED,
      startDate: dayjs().add(2, 'day').format('YYYY-MM-DD'),
      endDate: dayjs().add(3, 'day').format('YYYY-MM-DD'),
      reason: 'Medical appointment',
      totalDays: 2,
      color: '#FF5722',
      avatar: '/avatars/john.jpg'
    },
    {
      id: '2',
      employeeId: 'EMP002',
      employeeName: 'Jane Smith',
      department: 'Marketing',
      leaveType: LeaveType.CASUAL_LEAVE,
      status: LeaveStatus.PENDING,
      startDate: dayjs().add(5, 'day').format('YYYY-MM-DD'),
      endDate: dayjs().add(7, 'day').format('YYYY-MM-DD'),
      reason: 'Family vacation',
      totalDays: 3,
      color: '#2196F3',
      avatar: '/avatars/jane.jpg'
    },
    {
      id: '3',
      employeeId: 'EMP003',
      employeeName: 'Mike Johnson',
      department: 'Sales',
      leaveType: LeaveType.EARNED_LEAVE,
      status: LeaveStatus.APPROVED,
      startDate: dayjs().add(10, 'day').format('YYYY-MM-DD'),
      endDate: dayjs().add(14, 'day').format('YYYY-MM-DD'),
      reason: 'Annual vacation',
      totalDays: 5,
      color: '#4CAF50',
      avatar: '/avatars/mike.jpg'
    }
  ];

  useEffect(() => {
    setEvents([...initialEvents, ...mockEvents]);
  }, [initialEvents]);

  const getCalendarDays = useCallback(() => {
    const startOfMonth = currentDate.startOf('month');
    const endOfMonth = currentDate.endOf('month');
    const startOfCalendar = startOfMonth.startOf('week');
    const endOfCalendar = endOfMonth.endOf('week');

    const days = [];
    let day = startOfCalendar;

    while (day.isSameOrBefore(endOfCalendar)) {
      days.push(day);
      day = day.add(1, 'day');
    }

    return days;
  }, [currentDate]);

  const getWeekDays = useCallback(() => {
    const startOfWeek = currentDate.startOf('week');
    const days = [];

    for (let i = 0; i < 7; i++) {
      days.push(startOfWeek.add(i, 'day'));
    }

    return days;
  }, [currentDate]);

  const getEventsForDay = useCallback((date: Dayjs) => {
    return events.filter(event => {
      const startDate = dayjs(event.startDate);
      const endDate = dayjs(event.endDate);
      return date.isSameOrAfter(startDate, 'day') && date.isSameOrBefore(endDate, 'day');
    });
  }, [events]);

  const handleDragStart = (e: React.DragEvent, event: LeaveEvent) => {
    if (!editable) return;
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!editable || !draggedEvent) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetDate: Dayjs) => {
    if (!editable || !draggedEvent) return;
    e.preventDefault();

    try {
      setLoading(true);

      const originalStartDate = dayjs(draggedEvent.startDate);
      const originalEndDate = dayjs(draggedEvent.endDate);
      const duration = originalEndDate.diff(originalStartDate, 'days');

      const newStartDate = targetDate;
      const newEndDate = newStartDate.add(duration, 'days');

      // Update event
      const updatedEvent = {
        ...draggedEvent,
        startDate: newStartDate.format('YYYY-MM-DD'),
        endDate: newEndDate.format('YYYY-MM-DD')
      };

      setEvents(prev =>
        prev.map(event =>
          event.id === draggedEvent.id ? updatedEvent : event
        )
      );

      toast.success(`Leave moved to ${newStartDate.format('MMM DD, YYYY')}`);

    } catch (error) {
      toast.error('Failed to move leave');
    } finally {
      setLoading(false);
      setDraggedEvent(null);
    }
  };

  const navigateCalendar = (direction: 'prev' | 'next') => {
    const unit = viewMode === 'month' ? 'month' : viewMode === 'week' ? 'week' : 'day';
    setCurrentDate(prev =>
      direction === 'prev' ? prev.subtract(1, unit) : prev.add(1, unit)
    );
  };

  const handleEventClick = (event: LeaveEvent) => {
    setSelectedEvent(event);
    setEditDialogOpen(true);
  };

  const handleEventEdit = async (updatedEvent: Partial<LeaveEvent>) => {
    try {
      setLoading(true);

      setEvents(prev =>
        prev.map(event =>
          event.id === selectedEvent?.id ? { ...event, ...updatedEvent } : event
        )
      );

      setEditDialogOpen(false);
      setSelectedEvent(null);
      toast.success('Leave updated successfully');

    } catch (error) {
      toast.error('Failed to update leave');
    } finally {
      setLoading(false);
    }
  };

  const handleEventDelete = async () => {
    if (!selectedEvent) return;

    try {
      setLoading(true);

      setEvents(prev => prev.filter(event => event.id !== selectedEvent.id));

      setEditDialogOpen(false);
      setSelectedEvent(null);
      toast.success('Leave deleted successfully');

    } catch (error) {
      toast.error('Failed to delete leave');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: LeaveStatus) => {
    switch (status) {
      case LeaveStatus.APPROVED: return 'success';
      case LeaveStatus.PENDING: return 'warning';
      case LeaveStatus.REJECTED: return 'error';
      case LeaveStatus.CANCELLED: return 'default';
      default: return 'default';
    }
  };

  const renderMonthView = () => {
    const calendarDays = getCalendarDays();
    const weeks = [];

    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7));
    }

    return (
      <Card>
        <CardContent sx={{ p: 0 }}>
          {/* Days of week header */}
          <Grid container sx={{ bgcolor: 'grey.100' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <Grid item xs key={day}>
                <Typography
                  variant="caption"
                  align="center"
                  display="block"
                  fontWeight="bold"
                  sx={{ py: 1 }}
                >
                  {day}
                </Typography>
              </Grid>
            ))}
          </Grid>

          {/* Calendar grid */}
          {weeks.map((week, weekIndex) => (
            <Grid container key={weekIndex}>
              {week.map((day) => {
                const dayEvents = getEventsForDay(day);
                const isCurrentMonth = day.isSame(currentDate, 'month');
                const isToday = day.isSame(dayjs(), 'day');

                return (
                  <Grid item xs key={day.toString()}>
                    <Box
                      sx={{
                        minHeight: isMobile ? 80 : 120,
                        p: 1,
                        borderRight: 1,
                        borderBottom: 1,
                        borderColor: 'grey.200',
                        bgcolor: isToday ? 'primary.light' : 'transparent',
                        opacity: isCurrentMonth ? 1 : 0.3,
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, day)}
                    >
                      <Typography
                        variant="body2"
                        fontWeight={isToday ? 'bold' : 'normal'}
                        color={isToday ? 'primary.main' : 'text.primary'}
                      >
                        {day.format('D')}
                      </Typography>

                      {/* Events */}
                      <Box sx={{ mt: 0.5 }}>
                        {dayEvents.slice(0, isMobile ? 1 : 3).map((event, index) => (
                          <Box
                            key={event.id}
                            draggable={editable}
                            onDragStart={(e) => handleDragStart(e, event)}
                            onClick={() => handleEventClick(event)}
                            sx={{
                              mb: 0.25,
                              p: 0.25,
                              borderRadius: 0.5,
                              backgroundColor: event.color,
                              color: 'white',
                              cursor: editable ? 'move' : 'pointer',
                              fontSize: '0.7rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              '&:hover': {
                                opacity: 0.8,
                                transform: 'scale(1.02)'
                              },
                              transition: 'all 0.2s'
                            }}
                          >
                            {editable && <DragIndicator sx={{ fontSize: 8, mr: 0.5 }} />}
                            {isMobile ? event.employeeName.split(' ')[0] : event.employeeName}
                          </Box>
                        ))}
                        {dayEvents.length > (isMobile ? 1 : 3) && (
                          <Typography variant="caption" color="textSecondary">
                            +{dayEvents.length - (isMobile ? 1 : 3)} more
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          ))}
        </CardContent>
      </Card>
    );
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays();

    return (
      <Card>
        <CardContent>
          <Grid container spacing={1}>
            {weekDays.map((day) => {
              const dayEvents = getEventsForDay(day);
              const isToday = day.isSame(dayjs(), 'day');

              return (
                <Grid item xs key={day.toString()}>
                  <Paper
                    sx={{
                      p: 2,
                      minHeight: 300,
                      bgcolor: isToday ? 'primary.light' : 'background.paper',
                      border: isToday ? 2 : 1,
                      borderColor: isToday ? 'primary.main' : 'grey.200'
                    }}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, day)}
                  >
                    <Typography
                      variant="h6"
                      align="center"
                      fontWeight={isToday ? 'bold' : 'normal'}
                      color={isToday ? 'primary.main' : 'text.primary'}
                      gutterBottom
                    >
                      {day.format('ddd DD')}
                    </Typography>

                    <List dense>
                      {dayEvents.map((event) => (
                        <ListItem
                          key={event.id}
                          draggable={editable}
                          onDragStart={(e) => handleDragStart(e, event)}
                          onClick={() => handleEventClick(event)}
                          sx={{
                            mb: 1,
                            bgcolor: event.color,
                            color: 'white',
                            borderRadius: 1,
                            cursor: editable ? 'move' : 'pointer',
                            '&:hover': { opacity: 0.8 }
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar src={event.avatar} sx={{ width: 24, height: 24 }}>
                              {event.employeeName.charAt(0)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={event.employeeName}
                            secondary={event.leaveType.replace('_', ' ')}
                            secondaryTypographyProps={{ color: 'inherit' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDay(currentDate);
    const isToday = currentDate.isSame(dayjs(), 'day');

    return (
      <Card>
        <CardContent>
          <Typography variant="h5" align="center" gutterBottom>
            {currentDate.format('dddd, MMMM DD, YYYY')}
          </Typography>

          {dayEvents.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              No leaves scheduled for this day
            </Alert>
          ) : (
            <List>
              {dayEvents.map((event) => (
                <ListItem
                  key={event.id}
                  draggable={editable}
                  onDragStart={(e) => handleDragStart(e, event)}
                  onClick={() => handleEventClick(event)}
                  sx={{
                    mb: 2,
                    border: 1,
                    borderColor: 'grey.200',
                    borderRadius: 1,
                    cursor: editable ? 'move' : 'pointer',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar src={event.avatar}>
                      {event.employeeName.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6">{event.employeeName}</Typography>
                        <Chip
                          label={event.status}
                          size="small"
                          color={getStatusColor(event.status) as any}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          {event.leaveType.replace('_', ' ')} • {event.totalDays} days
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {event.reason}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {event.startDate} to {event.endDate}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderCalendarView = () => {
    switch (viewMode) {
      case 'month':
        return renderMonthView();
      case 'week':
        return renderWeekView();
      case 'day':
        return renderDayView();
      default:
        return renderMonthView();
    }
  };

  return (
    <Box>
      {/* Header Controls */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            {/* Navigation */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={() => navigateCalendar('prev')}>
                <ChevronLeft />
              </IconButton>
              <Typography variant="h6" sx={{ minWidth: 200, textAlign: 'center' }}>
                {viewMode === 'month' ? currentDate.format('MMMM YYYY') :
                 viewMode === 'week' ? `Week of ${currentDate.startOf('week').format('MMM DD, YYYY')}` :
                 currentDate.format('MMMM DD, YYYY')}
              </Typography>
              <IconButton onClick={() => navigateCalendar('next')}>
                <ChevronRight />
              </IconButton>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Today />}
                onClick={() => setCurrentDate(dayjs())}
              >
                Today
              </Button>
            </Box>

            {/* View Mode Toggles */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant={viewMode === 'month' ? 'contained' : 'outlined'}
                size="small"
                startIcon={<ViewModule />}
                onClick={() => setViewMode('month')}
              >
                Month
              </Button>
              <Button
                variant={viewMode === 'week' ? 'contained' : 'outlined'}
                size="small"
                startIcon={<ViewWeek />}
                onClick={() => setViewMode('week')}
              >
                Week
              </Button>
              <Button
                variant={viewMode === 'day' ? 'contained' : 'outlined'}
                size="small"
                startIcon={<ViewDay />}
                onClick={() => setViewMode('day')}
              >
                Day
              </Button>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton onClick={() => setFilterDrawerOpen(true)}>
                <FilterList />
              </IconButton>
              <IconButton onClick={() => window.location.reload()}>
                <Refresh />
              </IconButton>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Calendar */}
      {renderCalendarView()}

      {/* Add Leave FAB (Mobile) */}
      {isMobile && editable && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => {/* Navigate to add leave */}}
        >
          <Add />
        </Fab>
      )}

      {/* Event Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        {selectedEvent && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar src={selectedEvent.avatar}>
                  {selectedEvent.employeeName.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedEvent.employeeName}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {selectedEvent.department}
                  </Typography>
                </Box>
                {isMobile && (
                  <IconButton
                    sx={{ ml: 'auto' }}
                    onClick={() => setEditDialogOpen(false)}
                  >
                    <Close />
                  </IconButton>
                )}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    label="Leave Type"
                    value={selectedEvent.leaveType.replace('_', ' ')}
                    fullWidth
                    disabled={!editable}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Start Date"
                    value={selectedEvent.startDate}
                    type="date"
                    fullWidth
                    disabled={!editable}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="End Date"
                    value={selectedEvent.endDate}
                    type="date"
                    fullWidth
                    disabled={!editable}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Reason"
                    value={selectedEvent.reason}
                    multiline
                    rows={3}
                    fullWidth
                    disabled={!editable}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Typography variant="body2">Status:</Typography>
                    <Chip
                      label={selectedEvent.status}
                      color={getStatusColor(selectedEvent.status) as any}
                      size="small"
                    />
                    <Typography variant="body2">•</Typography>
                    <Typography variant="body2">{selectedEvent.totalDays} days</Typography>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditDialogOpen(false)}>Close</Button>
              {editable && (
                <>
                  <Button onClick={handleEventDelete} color="error">
                    Delete
                  </Button>
                  <Button onClick={() => handleEventEdit({})} variant="contained">
                    Save Changes
                  </Button>
                </>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Filter Drawer */}
      <Drawer
        anchor="right"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
      >
        <Box sx={{ width: 300, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Calendar Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Department</InputLabel>
                <Select
                  value={filters.department}
                  label="Department"
                  onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                >
                  <MenuItem value="all">All Departments</MenuItem>
                  <MenuItem value="Engineering">Engineering</MenuItem>
                  <MenuItem value="Marketing">Marketing</MenuItem>
                  <MenuItem value="Sales">Sales</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Leave Type</InputLabel>
                <Select
                  value={filters.leaveType}
                  label="Leave Type"
                  onChange={(e) => setFilters(prev => ({ ...prev, leaveType: e.target.value }))}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="SICK_LEAVE">Sick Leave</MenuItem>
                  <MenuItem value="CASUAL_LEAVE">Casual Leave</MenuItem>
                  <MenuItem value="EARNED_LEAVE">Earned Leave</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="APPROVED">Approved</MenuItem>
                  <MenuItem value="REJECTED">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </Drawer>
    </Box>
  );
};

export default InteractiveLeaveCalendar;