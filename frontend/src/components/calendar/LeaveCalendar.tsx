import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  IconButton,
  Typography,
  Grid,
  Chip,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Today,
  Add,
  Event
} from '@mui/icons-material';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isSameMonth, addMonths, subMonths } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface LeaveEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  type: 'CASUAL_LEAVE' | 'SICK_LEAVE' | 'EARNED_LEAVE' | 'MATERNITY_LEAVE' | 'PATERNITY_LEAVE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  employeeName?: string;
}

interface LeaveCalendarProps {
  leaves: LeaveEvent[];
  onDateClick?: (date: Date) => void;
  onLeaveClick?: (leave: LeaveEvent) => void;
  showTeamLeaves?: boolean;
  className?: string;
}

const leaveTypeColors = {
  CASUAL_LEAVE: '#2196f3',
  SICK_LEAVE: '#f44336',
  EARNED_LEAVE: '#4caf50',
  MATERNITY_LEAVE: '#9c27b0',
  PATERNITY_LEAVE: '#ff9800'
};

const leaveTypeLabels = {
  CASUAL_LEAVE: 'Casual',
  SICK_LEAVE: 'Sick',
  EARNED_LEAVE: 'Earned',
  MATERNITY_LEAVE: 'Maternity',
  PATERNITY_LEAVE: 'Paternity'
};

const statusColors = {
  PENDING: '#ff9800',
  APPROVED: '#4caf50',
  REJECTED: '#f44336'
};

const LeaveCalendar: React.FC<LeaveCalendarProps> = ({
  leaves,
  onDateClick,
  onLeaveClick,
  showTeamLeaves = false,
  className
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedLeave, setSelectedLeave] = useState<LeaveEvent | null>(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  // Get all days in the current month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get days to fill the calendar grid (6 weeks)
  const calendarDays = React.useMemo(() => {
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - monthStart.getDay()); // Start from Sunday

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 41); // 6 weeks = 42 days

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [monthStart]);

  // Get leaves for a specific date
  const getLeavesForDate = (date: Date): LeaveEvent[] => {
    return leaves.filter(leave =>
      date >= leave.startDate && date <= leave.endDate
    );
  };

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    if (onDateClick) {
      onDateClick(date);
    } else {
      // Default behavior: navigate to create leave request
      navigate(`/leaves/new?date=${format(date, 'yyyy-MM-dd')}`);
    }
  };

  // Handle leave click
  const handleLeaveClick = (leave: LeaveEvent) => {
    if (onLeaveClick) {
      onLeaveClick(leave);
    } else {
      setSelectedLeave(leave);
      setShowLeaveDialog(true);
    }
  };

  // Render calendar day
  const renderDay = (date: Date) => {
    const dayLeaves = getLeavesForDate(date);
    const isCurrentMonth = isSameMonth(date, currentDate);
    const isCurrentDay = isToday(date);
    const dateNumber = format(date, 'd');

    return (
      <Box
        key={date.toISOString()}
        sx={{
          minHeight: isMobile ? 80 : 120,
          border: 1,
          borderColor: 'divider',
          backgroundColor: isCurrentMonth ? 'background.paper' : 'action.hover',
          cursor: 'pointer',
          position: 'relative',
          p: 0.5,
          '&:hover': {
            backgroundColor: 'action.hover',
          }
        }}
        onClick={() => handleDateClick(date)}
      >
        {/* Date number */}
        <Typography
          variant="body2"
          sx={{
            fontWeight: isCurrentDay ? 'bold' : 'normal',
            color: isCurrentMonth
              ? isCurrentDay
                ? 'primary.main'
                : 'text.primary'
              : 'text.disabled',
            mb: 0.5
          }}
        >
          {dateNumber}
        </Typography>

        {/* Leave indicators */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          {dayLeaves.slice(0, isMobile ? 2 : 3).map((leave, index) => (
            <Tooltip
              key={`${leave.id}-${index}`}
              title={`${leaveTypeLabels[leave.type]}${showTeamLeaves ? ` - ${leave.employeeName}` : ''} (${leave.status})`}
              placement="top"
            >
              <Chip
                size="small"
                label={showTeamLeaves ? leave.employeeName?.split(' ')[0] : leaveTypeLabels[leave.type]}
                sx={{
                  height: 16,
                  fontSize: '0.7rem',
                  backgroundColor: leaveTypeColors[leave.type],
                  color: 'white',
                  opacity: leave.status === 'REJECTED' ? 0.5 : 1,
                  border: leave.status === 'PENDING' ? `2px solid ${statusColors.PENDING}` : 'none',
                  '& .MuiChip-label': {
                    px: 0.5
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleLeaveClick(leave);
                }}
              />
            </Tooltip>
          ))}
          {dayLeaves.length > (isMobile ? 2 : 3) && (
            <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
              +{dayLeaves.length - (isMobile ? 2 : 3)} more
            </Typography>
          )}
        </Box>
      </Box>
    );
  };

  return (
    <Card className={className} sx={{ height: '100%' }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h5" component="h2">
              📅 {showTeamLeaves ? 'Team Calendar' : 'My Calendar'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                startIcon={<Add />}
                variant="contained"
                size="small"
                onClick={() => navigate('/leaves/new')}
                sx={{ display: { xs: 'none', sm: 'flex' } }}
              >
                New Leave
              </Button>
              <IconButton onClick={() => navigate('/leaves/new')} sx={{ display: { xs: 'block', sm: 'none' } }}>
                <Add />
              </IconButton>
            </Box>
          </Box>
        }
        subheader={
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={goToPreviousMonth} size="small">
                <ChevronLeft />
              </IconButton>
              <Typography variant="h6" sx={{ minWidth: 200, textAlign: 'center' }}>
                {format(currentDate, 'MMMM yyyy')}
              </Typography>
              <IconButton onClick={goToNextMonth} size="small">
                <ChevronRight />
              </IconButton>
            </Box>
            <Button startIcon={<Today />} onClick={goToToday} size="small">
              Today
            </Button>
          </Box>
        }
      />

      <CardContent sx={{ p: 1 }}>
        {/* Calendar Grid */}
        <Box>
          {/* Day headers */}
          <Grid container>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <Grid item xs key={day} sx={{ textAlign: 'center', py: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  {day}
                </Typography>
              </Grid>
            ))}
          </Grid>

          {/* Calendar days */}
          <Grid container>
            {calendarDays.map((date) => (
              <Grid item xs key={date.toISOString()}>
                {renderDay(date)}
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Leave type legend */}
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold', mr: 1 }}>
            Legend:
          </Typography>
          {Object.entries(leaveTypeColors).map(([type, color]) => (
            <Chip
              key={type}
              size="small"
              label={leaveTypeLabels[type as keyof typeof leaveTypeLabels]}
              sx={{
                backgroundColor: color,
                color: 'white',
                height: 20,
                '& .MuiChip-label': { fontSize: '0.7rem', px: 1 }
              }}
            />
          ))}
        </Box>
      </CardContent>

      {/* Leave Details Dialog */}
      <Dialog open={showLeaveDialog} onClose={() => setShowLeaveDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Event />
            Leave Details
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedLeave && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Leave Type</Typography>
                <Chip
                  label={leaveTypeLabels[selectedLeave.type]}
                  sx={{ backgroundColor: leaveTypeColors[selectedLeave.type], color: 'white' }}
                />
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Duration</Typography>
                <Typography>
                  {format(selectedLeave.startDate, 'MMM dd, yyyy')} - {format(selectedLeave.endDate, 'MMM dd, yyyy')}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Chip
                  label={selectedLeave.status}
                  sx={{ backgroundColor: statusColors[selectedLeave.status], color: 'white' }}
                />
              </Box>
              {showTeamLeaves && selectedLeave.employeeName && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Employee</Typography>
                  <Typography>{selectedLeave.employeeName}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLeaveDialog(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              setShowLeaveDialog(false);
              navigate('/leaves');
            }}
          >
            View All Leaves
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default LeaveCalendar;