import React, { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  IconButton,
  Tooltip,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Event,
  LocationOn,
  Edit,
  Delete
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { useAuth } from '@/hooks/useAuth';

interface Holiday {
  id: string;
  name: string;
  date: string;
  type: 'NATIONAL' | 'REGIONAL' | 'COMPANY' | 'OPTIONAL';
  region?: string;
  description?: string;
  isOptional: boolean;
  applicableRegions: string[];
}

interface HolidayCalendarProps {
  holidays: Holiday[];
  onEditHoliday?: (holiday: Holiday) => void;
  onDeleteHoliday?: (holidayId: string) => void;
}

const HolidayCalendar: React.FC<HolidayCalendarProps> = ({
  holidays,
  onEditHoliday,
  onDeleteHoliday
}) => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);

  const isHRAdmin = user?.role === 'HR_ADMIN' || user?.role === 'IT_ADMIN';

  const startOfMonth = currentDate.startOf('month');
  const endOfMonth = currentDate.endOf('month');
  const startOfCalendar = startOfMonth.startOf('week');
  const endOfCalendar = endOfMonth.endOf('week');

  const getTypeColor = (type: Holiday['type']) => {
    switch (type) {
      case 'NATIONAL': return 'error';
      case 'REGIONAL': return 'warning';
      case 'COMPANY': return 'primary';
      case 'OPTIONAL': return 'info';
      default: return 'default';
    }
  };

  const getHolidaysForDate = (date: dayjs.Dayjs) => {
    return holidays.filter(holiday =>
      dayjs(holiday.date).isSame(date, 'day')
    );
  };

  const generateCalendarDays = () => {
    const days = [];
    let day = startOfCalendar;

    while (day.isBefore(endOfCalendar) || day.isSame(endOfCalendar, 'day')) {
      days.push(day);
      day = day.add(1, 'day');
    }

    return days;
  };

  const getDayHolidays = selectedDate ? getHolidaysForDate(selectedDate) : [];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev =>
      direction === 'prev' ? prev.subtract(1, 'month') : prev.add(1, 'month')
    );
    setSelectedDate(null);
  };

  const handleDateClick = (date: dayjs.Dayjs) => {
    const dayHolidays = getHolidaysForDate(date);
    if (dayHolidays.length > 0) {
      setSelectedDate(date);
    }
  };

  return (
    <Grid container spacing={3}>
      {/* Calendar */}
      <Grid item xs={12} md={8}>
        <Card sx={{ p: 2 }}>
          {/* Calendar Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <IconButton onClick={() => navigateMonth('prev')}>
              <ChevronLeft />
            </IconButton>
            <Typography variant="h5" fontWeight="bold">
              {currentDate.format('MMMM YYYY')}
            </Typography>
            <IconButton onClick={() => navigateMonth('next')}>
              <ChevronRight />
            </IconButton>
          </Box>

          {/* Days of Week Header */}
          <Grid container sx={{ mb: 1 }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <Grid item xs key={day}>
                <Typography
                  variant="caption"
                  align="center"
                  display="block"
                  fontWeight="bold"
                  color="textSecondary"
                  sx={{ py: 1 }}
                >
                  {day}
                </Typography>
              </Grid>
            ))}
          </Grid>

          {/* Calendar Grid */}
          <Grid container>
            {generateCalendarDays().map((date, index) => {
              const dayHolidays = getHolidaysForDate(date);
              const isCurrentMonth = date.isSame(currentDate, 'month');
              const isToday = date.isSame(dayjs(), 'day');
              const isSelected = selectedDate && date.isSame(selectedDate, 'day');

              return (
                <Grid item xs key={index}>
                  <Box
                    onClick={() => handleDateClick(date)}
                    sx={{
                      minHeight: 80,
                      p: 1,
                      cursor: dayHolidays.length > 0 ? 'pointer' : 'default',
                      backgroundColor: isSelected ? 'primary.light' : 'transparent',
                      border: isToday ? 2 : 1,
                      borderColor: isToday ? 'primary.main' : 'grey.200',
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: dayHolidays.length > 0 ? 'action.hover' : 'transparent'
                      },
                      opacity: isCurrentMonth ? 1 : 0.3
                    }}
                  >
                    <Typography
                      variant="body2"
                      fontWeight={isToday ? 'bold' : 'normal'}
                      color={isToday ? 'primary.main' : 'text.primary'}
                    >
                      {date.format('D')}
                    </Typography>

                    {/* Holiday indicators */}
                    <Box sx={{ mt: 0.5 }}>
                      {dayHolidays.slice(0, 2).map((holiday, idx) => (
                        <Chip
                          key={holiday.id}
                          label={holiday.name.length > 15 ? holiday.name.substring(0, 15) + '...' : holiday.name}
                          size="small"
                          color={getTypeColor(holiday.type) as any}
                          variant="filled"
                          sx={{
                            fontSize: '0.65rem',
                            height: 16,
                            mb: 0.25,
                            display: 'block',
                            '& .MuiChip-label': {
                              px: 0.5
                            }
                          }}
                        />
                      ))}
                      {dayHolidays.length > 2 && (
                        <Typography variant="caption" color="textSecondary">
                          +{dayHolidays.length - 2} more
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Card>
      </Grid>

      {/* Holiday Details Sidebar */}
      <Grid item xs={12} md={4}>
        <Card sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            {selectedDate ? `Holidays on ${selectedDate.format('MMM DD, YYYY')}` : 'Select a date to view holidays'}
          </Typography>

          {getDayHolidays.length > 0 ? (
            <List>
              {getDayHolidays.map((holiday) => (
                <ListItem
                  key={holiday.id}
                  sx={{
                    border: 1,
                    borderColor: 'grey.200',
                    borderRadius: 1,
                    mb: 1,
                    px: 2
                  }}
                >
                  <ListItemIcon>
                    <Avatar
                      sx={{
                        bgcolor: `${getTypeColor(holiday.type)}.main`,
                        width: 32,
                        height: 32
                      }}
                    >
                      <Event fontSize="small" />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={holiday.name}
                    secondary={
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Chip
                            label={holiday.type}
                            size="small"
                            color={getTypeColor(holiday.type) as any}
                            variant="outlined"
                          />
                          {holiday.isOptional && (
                            <Chip
                              label="Optional"
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                        {holiday.region && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                            <LocationOn fontSize="small" color="action" />
                            <Typography variant="caption" color="textSecondary">
                              {holiday.region}
                            </Typography>
                          </Box>
                        )}
                        {holiday.description && (
                          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                            {holiday.description}
                          </Typography>
                        )}
                        {isHRAdmin && (
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => onEditHoliday?.(holiday)}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => onDeleteHoliday?.(holiday.id)}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : selectedDate ? (
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
              <Typography variant="body2" color="textSecondary">
                No holidays on this date
              </Typography>
            </Paper>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
              <Typography variant="body2" color="textSecondary">
                Click on a date with holidays to view details
              </Typography>
            </Paper>
          )}

          {/* Legend */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Holiday Types
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[
                { type: 'NATIONAL', label: 'National Holiday', color: 'error' },
                { type: 'REGIONAL', label: 'Regional Holiday', color: 'warning' },
                { type: 'COMPANY', label: 'Company Holiday', color: 'primary' },
                { type: 'OPTIONAL', label: 'Optional Holiday', color: 'info' }
              ].map((item) => (
                <Box key={item.type} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    size="small"
                    color={item.color as any}
                    variant="filled"
                    sx={{ minWidth: 16, height: 16, '& .MuiChip-label': { display: 'none' } }}
                  />
                  <Typography variant="caption" color="textSecondary">
                    {item.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Card>
      </Grid>
    </Grid>
  );
};

export default HolidayCalendar;