import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Box,
  Typography,
  Button,
  Chip,
  Avatar
} from '@mui/material';
import {
  CalendarMonth,
  Event,
  ArrowForward
} from '@mui/icons-material';
import { format, addDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useCalendarData } from '@/hooks/useCalendarData';

const CalendarWidget: React.FC = () => {
  const navigate = useNavigate();
  const { events, loading } = useCalendarData(false);

  // Get upcoming events (next 7 days)
  const upcomingEvents = events
    .filter(event => event.startDate >= new Date() && event.startDate <= addDays(new Date(), 7))
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    .slice(0, 3);

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

  return (
    <Card>
      <CardHeader
        avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><CalendarMonth /></Avatar>}
        title="Upcoming Leaves"
        subheader="Next 7 days"
        action={
          <Button
            endIcon={<ArrowForward />}
            size="small"
            onClick={() => navigate('/calendar')}
          >
            View Calendar
          </Button>
        }
      />
      <CardContent>
        {loading ? (
          <Typography variant="body2" color="text.secondary">
            Loading calendar...
          </Typography>
        ) : upcomingEvents.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Event sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No upcoming leaves in the next 7 days
            </Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={() => navigate('/leaves/new')}
              sx={{ mt: 1 }}
            >
              Plan a Leave
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {upcomingEvents.map((event) => (
              <Box
                key={event.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 1.5,
                  backgroundColor: 'action.hover',
                  borderRadius: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'action.selected'
                  }
                }}
                onClick={() => navigate('/leaves')}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: leaveTypeColors[event.type],
                    flexShrink: 0
                  }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" noWrap>
                    {leaveTypeLabels[event.type]}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {format(event.startDate, 'MMM dd')}
                    {event.startDate.getTime() !== event.endDate.getTime() &&
                      ` - ${format(event.endDate, 'MMM dd')}`
                    }
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={event.status}
                  color={
                    event.status === 'APPROVED' ? 'success' :
                    event.status === 'PENDING' ? 'warning' : 'error'
                  }
                />
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default CalendarWidget;