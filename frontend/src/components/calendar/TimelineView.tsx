import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Tooltip,
  Chip,
  Button,
  ButtonGroup,
  Grid,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  Today,
  Warning,
  Person
} from '@mui/icons-material';
import { format, addDays, eachDayOfInterval, startOfWeek, endOfWeek, differenceInDays, startOfMonth, endOfMonth } from 'date-fns';

interface LeaveEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  type: 'CASUAL_LEAVE' | 'SICK_LEAVE' | 'EARNED_LEAVE' | 'MATERNITY_LEAVE' | 'PATERNITY_LEAVE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  employeeName?: string;
  employeeId: string;
}

interface TimelineViewProps {
  leaves: LeaveEvent[];
  onLeaveClick?: (leave: LeaveEvent) => void;
}

type ViewMode = 'week' | 'month' | 'quarter';

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

const TimelineView: React.FC<TimelineViewProps> = ({ leaves, onLeaveClick }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  // Get unique employees
  const employees = useMemo(() => {
    const employeeMap = new Map();
    leaves.forEach(leave => {
      if (leave.employeeName && leave.employeeId) {
        employeeMap.set(leave.employeeId, {
          id: leave.employeeId,
          name: leave.employeeName,
          avatar: leave.employeeName.split(' ').map(n => n[0]).join('').toUpperCase()
        });
      }
    });
    return Array.from(employeeMap.values());
  }, [leaves]);

  // Get date range based on view mode
  const dateRange = useMemo(() => {
    let start: Date, end: Date;

    switch (viewMode) {
      case 'week':
        start = startOfWeek(currentDate);
        end = endOfWeek(currentDate);
        break;
      case 'month':
        start = startOfMonth(currentDate);
        end = endOfMonth(currentDate);
        break;
      case 'quarter':
        const quarterStart = new Date(currentDate.getFullYear(), Math.floor(currentDate.getMonth() / 3) * 3, 1);
        start = quarterStart;
        end = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 0);
        break;
    }

    return { start, end };
  }, [currentDate, viewMode]);

  // Get days in the current view
  const days = useMemo(() => {
    return eachDayOfInterval(dateRange);
  }, [dateRange]);

  // Calculate grid dimensions
  const dayWidth = isMobile ? 40 : 50;
  const rowHeight = 60;

  // Get leaves for an employee in the current view
  const getLeavesForEmployee = (employeeId: string) => {
    return leaves.filter(leave =>
      leave.employeeId === employeeId &&
      leave.startDate <= dateRange.end &&
      leave.endDate >= dateRange.start &&
      leave.status !== 'REJECTED'
    );
  };

  // Detect conflicts (overlapping leaves)
  const detectConflicts = (employeeId: string) => {
    const employeeLeaves = getLeavesForEmployee(employeeId)
      .filter(leave => leave.status === 'APPROVED');

    const conflicts: string[] = [];

    for (let i = 0; i < employeeLeaves.length; i++) {
      for (let j = i + 1; j < employeeLeaves.length; j++) {
        const leave1 = employeeLeaves[i];
        const leave2 = employeeLeaves[j];

        if (leave1.startDate <= leave2.endDate && leave1.endDate >= leave2.startDate) {
          conflicts.push(leave1.id, leave2.id);
        }
      }
    }

    return [...new Set(conflicts)];
  };

  // Calculate leave bar position and width
  const getLeaveBarStyle = (leave: LeaveEvent) => {
    const startIndex = Math.max(0, differenceInDays(leave.startDate, dateRange.start));
    const endIndex = Math.min(days.length - 1, differenceInDays(leave.endDate, dateRange.start));
    const duration = endIndex - startIndex + 1;

    return {
      left: startIndex * dayWidth,
      width: duration * dayWidth - 2, // -2 for spacing
      backgroundColor: leaveTypeColors[leave.type],
      opacity: leave.status === 'PENDING' ? 0.7 : 1,
      border: leave.status === 'PENDING' ? `2px solid ${statusColors.PENDING}` : 'none'
    };
  };

  // Navigation functions
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'quarter':
        newDate.setMonth(newDate.getMonth() - 3);
        break;
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'quarter':
        newDate.setMonth(newDate.getMonth() + 3);
        break;
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Check if there are any conflicts
  const hasConflicts = employees.some(emp => detectConflicts(emp.id).length > 0);

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              📊 Timeline View
              {hasConflicts && (
                <Tooltip title="Leave conflicts detected">
                  <Warning color="warning" fontSize="small" />
                </Tooltip>
              )}
            </Typography>

            <ButtonGroup size="small">
              <Button
                variant={viewMode === 'week' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('week')}
              >
                Week
              </Button>
              <Button
                variant={viewMode === 'month' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('month')}
              >
                Month
              </Button>
              <Button
                variant={viewMode === 'quarter' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('quarter')}
              >
                Quarter
              </Button>
            </ButtonGroup>
          </Box>

          {/* Navigation */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button onClick={goToPrevious} size="small">←</Button>
              <Typography variant="subtitle1" sx={{ minWidth: 200, textAlign: 'center' }}>
                {viewMode === 'week' && format(dateRange.start, 'MMM dd')} - {format(dateRange.end, 'MMM dd, yyyy')}
                {viewMode === 'month' && format(currentDate, 'MMMM yyyy')}
                {viewMode === 'quarter' && `Q${Math.floor(currentDate.getMonth() / 3) + 1} ${currentDate.getFullYear()}`}
              </Typography>
              <Button onClick={goToNext} size="small">→</Button>
            </Box>
            <Button startIcon={<Today />} onClick={goToToday} size="small">
              Today
            </Button>
          </Box>
        </Box>

        {/* Conflict Alert */}
        {hasConflicts && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <strong>⚠️ Leave Conflicts Detected!</strong> Some employees have overlapping approved leaves.
            Review the timeline below to identify and resolve conflicts.
          </Alert>
        )}

        {/* Legend */}
        <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            Legend:
          </Typography>
          {Object.entries(leaveTypeColors).map(([type, color]) => (
            <Box key={type} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  backgroundColor: color,
                  borderRadius: 0.5
                }}
              />
              <Typography variant="caption">
                {type.replace('_', ' ')}
              </Typography>
            </Box>
          ))}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                backgroundColor: statusColors.PENDING,
                borderRadius: 0.5,
                opacity: 0.7,
                border: `2px solid ${statusColors.PENDING}`
              }}
            />
            <Typography variant="caption">Pending</Typography>
          </Box>
        </Box>

        {/* Timeline Grid */}
        <Box sx={{ overflowX: 'auto', minHeight: employees.length * rowHeight + 100 }}>
          {/* Date Headers */}
          <Box sx={{ display: 'flex', mb: 1, position: 'sticky', top: 0, backgroundColor: 'background.paper', zIndex: 1 }}>
            <Box sx={{ width: 150, flexShrink: 0 }} /> {/* Employee name column */}
            {days.map((day, index) => (
              <Box
                key={day.toISOString()}
                sx={{
                  width: dayWidth,
                  textAlign: 'center',
                  borderLeft: index === 0 ? 'none' : '1px solid',
                  borderColor: 'divider',
                  py: 1
                }}
              >
                <Typography variant="caption" display="block">
                  {format(day, isMobile ? 'dd' : 'EEE')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {format(day, 'dd')}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Employee Rows */}
          {employees.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Person sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body1" color="text.secondary">
                No employee data available for timeline view
              </Typography>
            </Box>
          ) : (
            employees.map((employee) => {
              const employeeLeaves = getLeavesForEmployee(employee.id);
              const conflicts = detectConflicts(employee.id);

              return (
                <Box key={employee.id} sx={{ display: 'flex', mb: 1, position: 'relative' }}>
                  {/* Employee Info */}
                  <Box
                    sx={{
                      width: 150,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      py: 1,
                      pr: 2,
                      borderRight: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        fontSize: '0.875rem',
                        bgcolor: conflicts.length > 0 ? 'warning.main' : 'primary.main'
                      }}
                    >
                      {employee.avatar}
                    </Avatar>
                    <Box sx={{ overflow: 'hidden' }}>
                      <Typography variant="body2" noWrap>
                        {employee.name}
                      </Typography>
                      {conflicts.length > 0 && (
                        <Typography variant="caption" color="warning.main">
                          {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Timeline Bar */}
                  <Box
                    sx={{
                      position: 'relative',
                      height: rowHeight - 8,
                      flex: 1,
                      borderBottom: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    {/* Grid lines */}
                    {days.map((_, index) => (
                      <Box
                        key={index}
                        sx={{
                          position: 'absolute',
                          left: index * dayWidth,
                          top: 0,
                          bottom: 0,
                          width: 1,
                          backgroundColor: 'divider',
                          opacity: 0.3
                        }}
                      />
                    ))}

                    {/* Leave Bars */}
                    {employeeLeaves.map((leave) => {
                      const isConflict = conflicts.includes(leave.id);
                      const barStyle = getLeaveBarStyle(leave);

                      return (
                        <Tooltip
                          key={leave.id}
                          title={`${leave.type.replace('_', ' ')} - ${format(leave.startDate, 'MMM dd')} to ${format(leave.endDate, 'MMM dd')} (${leave.status})`}
                          placement="top"
                        >
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 8,
                              height: 32,
                              borderRadius: 1,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              px: 1,
                              color: 'white',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              boxShadow: isConflict ? `0 0 0 2px ${theme.palette.warning.main}` : 'none',
                              ...barStyle,
                              '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: theme.shadows[4],
                                zIndex: 2
                              }
                            }}
                            onClick={() => onLeaveClick && onLeaveClick(leave)}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                color: 'white',
                                fontWeight: 'bold',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {leave.type.split('_')[0]} {isConflict && '⚠️'}
                            </Typography>
                          </Box>
                        </Tooltip>
                      );
                    })}
                  </Box>
                </Box>
              );
            })
          )}
        </Box>

        {/* Summary Stats */}
        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Typography variant="h6" color="primary">
                {employees.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Team Members
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="h6" color="success.main">
                {leaves.filter(l => l.status === 'APPROVED').length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Approved Leaves
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="h6" color="warning.main">
                {leaves.filter(l => l.status === 'PENDING').length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Pending Approval
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="h6" color="error.main">
                {employees.reduce((total, emp) => total + detectConflicts(emp.id).length, 0) / 2}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Conflicts
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TimelineView;