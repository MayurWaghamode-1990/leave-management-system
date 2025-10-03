import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Avatar,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Grid,
  IconButton,
  Tooltip,
  Paper
} from '@mui/material'
import {
  Event,
  EventAvailable,
  Today,
  CalendarMonth,
  LocationOn,
  Refresh,
  Weekend,
  Public,
  Flag
} from '@mui/icons-material'
import { format, parseISO, differenceInDays, isWeekend } from 'date-fns'
import toast from 'react-hot-toast'
import api from '@/config/api'

interface Holiday {
  id: string
  name: string
  date: string
  description?: string
  type: 'NATIONAL' | 'REGIONAL' | 'RELIGIOUS' | 'CULTURAL'
  location?: string
  isOptional: boolean
  daysUntil: number
}

interface UpcomingHolidaysData {
  upcoming: Holiday[]
  thisMonth: Holiday[]
  nextMonth: Holiday[]
  summary: {
    totalUpcoming: number
    thisMonthCount: number
    nextMonthCount: number
    nextHoliday?: Holiday
  }
}

const UpcomingHolidaysDisplay: React.FC = () => {
  const [holidaysData, setHolidaysData] = useState<UpcomingHolidaysData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'upcoming' | 'thisMonth' | 'nextMonth'>('upcoming')

  useEffect(() => {
    fetchHolidaysData()
  }, [])

  const fetchHolidaysData = async () => {
    try {
      setLoading(true)
      const response = await api.get('/holidays/upcoming')
      setHolidaysData(response.data.data)
    } catch (error) {
      console.error('Error fetching holidays data:', error)
      toast.error('Failed to load holidays information')
    } finally {
      setLoading(false)
    }
  }

  const getHolidayTypeIcon = (type: Holiday['type']) => {
    switch (type) {
      case 'NATIONAL':
        return <Flag color="error" />
      case 'REGIONAL':
        return <LocationOn color="warning" />
      case 'RELIGIOUS':
        return <Public color="info" />
      case 'CULTURAL':
        return <Event color="success" />
      default:
        return <Event color="primary" />
    }
  }

  const getHolidayTypeColor = (type: Holiday['type']) => {
    switch (type) {
      case 'NATIONAL':
        return '#f44336'
      case 'REGIONAL':
        return '#ff9800'
      case 'RELIGIOUS':
        return '#2196f3'
      case 'CULTURAL':
        return '#4caf50'
      default:
        return '#9c27b0'
    }
  }

  const getHolidayTypeLabel = (type: Holiday['type']) => {
    switch (type) {
      case 'NATIONAL':
        return 'National'
      case 'REGIONAL':
        return 'Regional'
      case 'RELIGIOUS':
        return 'Religious'
      case 'CULTURAL':
        return 'Cultural'
      default:
        return type
    }
  }

  const getDaysUntilText = (daysUntil: number) => {
    if (daysUntil === 0) {
      return 'Today'
    } else if (daysUntil === 1) {
      return 'Tomorrow'
    } else if (daysUntil <= 7) {
      return `In ${daysUntil} days`
    } else if (daysUntil <= 30) {
      return `In ${Math.floor(daysUntil / 7)} weeks`
    } else {
      return `In ${Math.floor(daysUntil / 30)} months`
    }
  }

  const getDaysUntilColor = (daysUntil: number) => {
    if (daysUntil <= 3) {
      return 'error' as const
    } else if (daysUntil <= 7) {
      return 'warning' as const
    } else if (daysUntil <= 30) {
      return 'info' as const
    } else {
      return 'success' as const
    }
  }

  const renderHolidayItem = (holiday: Holiday, index: number, holidays: Holiday[]) => {
    const holidayDate = parseISO(holiday.date)
    const isWeekendHoliday = isWeekend(holidayDate)

    return (
      <React.Fragment key={holiday.id}>
        <ListItem
          alignItems="flex-start"
          sx={{
            px: 0,
            py: 2,
            '&:hover': {
              bgcolor: 'action.hover',
              borderRadius: 1
            }
          }}
        >
          <ListItemIcon sx={{ mt: 1 }}>
            <Avatar
              sx={{
                bgcolor: getHolidayTypeColor(holiday.type),
                width: 40,
                height: 40
              }}
            >
              {getHolidayTypeIcon(holiday.type)}
            </Avatar>
          </ListItemIcon>
          <ListItemText
            primary={
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <Typography variant="subtitle2" fontWeight="medium">
                  {holiday.name}
                </Typography>
                <Chip
                  label={getHolidayTypeLabel(holiday.type)}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
                {holiday.isOptional && (
                  <Chip
                    label="Optional"
                    size="small"
                    variant="outlined"
                    color="warning"
                  />
                )}
                {isWeekendHoliday && (
                  <Chip
                    icon={<Weekend fontSize="small" />}
                    label="Weekend"
                    size="small"
                    variant="outlined"
                    color="info"
                  />
                )}
              </Box>
            }
            secondary={
              <Box>
                <Typography variant="body2" color="textPrimary" gutterBottom>
                  {format(holidayDate, 'EEEE, MMMM dd, yyyy')}
                </Typography>
                {holiday.description && (
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    {holiday.description}
                  </Typography>
                )}
                {holiday.location && (
                  <Typography variant="caption" color="textSecondary" display="block">
                    📍 {holiday.location}
                  </Typography>
                )}
                <Box display="flex" alignItems="center" gap={1} mt={1}>
                  <Chip
                    label={getDaysUntilText(holiday.daysUntil)}
                    size="small"
                    color={getDaysUntilColor(holiday.daysUntil)}
                    variant="filled"
                  />
                  <Typography variant="caption" color="textSecondary">
                    {format(holidayDate, 'MMM dd')}
                  </Typography>
                </Box>
              </Box>
            }
          />
        </ListItem>
        {index < holidays.length - 1 && <Divider />}
      </React.Fragment>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Event color="primary" />
            <Typography variant="h6">Upcoming Holidays</Typography>
          </Box>
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    )
  }

  if (!holidaysData) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            Failed to load holidays data. Please try refreshing.
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const currentData = holidaysData[activeTab] || []

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <Event color="primary" />
            <Typography variant="h6">Upcoming Holidays</Typography>
          </Box>
          <Tooltip title="Refresh Holidays">
            <IconButton onClick={fetchHolidaysData} size="small">
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Next Holiday Highlight */}
        {holidaysData.summary.nextHoliday && (
          <Paper
            sx={{
              p: 2,
              mb: 3,
              bgcolor: 'primary.light',
              color: 'primary.contrastText',
              textAlign: 'center'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Next Holiday
            </Typography>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {holidaysData.summary.nextHoliday.name}
            </Typography>
            <Typography variant="body1" gutterBottom>
              {format(parseISO(holidaysData.summary.nextHoliday.date), 'EEEE, MMMM dd, yyyy')}
            </Typography>
            <Typography variant="body2">
              {getDaysUntilText(holidaysData.summary.nextHoliday.daysUntil)}
            </Typography>
          </Paper>
        )}

        {/* Summary Cards */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={4}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'info.contrastText' }}>
              <Typography variant="h4" fontWeight="bold">
                {holidaysData.summary.totalUpcoming}
              </Typography>
              <Typography variant="caption">
                Total Upcoming
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={4}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'warning.contrastText' }}>
              <Typography variant="h4" fontWeight="bold">
                {holidaysData.summary.thisMonthCount}
              </Typography>
              <Typography variant="caption">
                This Month
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={4}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
              <Typography variant="h4" fontWeight="bold">
                {holidaysData.summary.nextMonthCount}
              </Typography>
              <Typography variant="caption">
                Next Month
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Tab Navigation */}
        <Box display="flex" gap={1} mb={3}>
          <Button
            variant={activeTab === 'upcoming' ? 'contained' : 'outlined'}
            size="small"
            startIcon={<EventAvailable />}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming ({holidaysData.upcoming.length})
          </Button>
          <Button
            variant={activeTab === 'thisMonth' ? 'contained' : 'outlined'}
            size="small"
            startIcon={<Today />}
            onClick={() => setActiveTab('thisMonth')}
          >
            This Month ({holidaysData.thisMonth.length})
          </Button>
          <Button
            variant={activeTab === 'nextMonth' ? 'contained' : 'outlined'}
            size="small"
            startIcon={<CalendarMonth />}
            onClick={() => setActiveTab('nextMonth')}
          >
            Next Month ({holidaysData.nextMonth.length})
          </Button>
        </Box>

        {/* Holidays List */}
        {currentData.length > 0 ? (
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {currentData.map((holiday, index) => renderHolidayItem(holiday, index, currentData))}
          </List>
        ) : (
          <Box textAlign="center" py={4}>
            <Event sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No holidays {activeTab === 'upcoming' ? 'coming up' : `in ${activeTab === 'thisMonth' ? 'this' : 'next'} month`}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {activeTab === 'upcoming' && 'Enjoy uninterrupted work days ahead!'}
              {activeTab === 'thisMonth' && 'No holidays this month - perfect for productivity'}
              {activeTab === 'nextMonth' && 'Next month is holiday-free'}
            </Typography>
          </Box>
        )}

        {/* Holiday Planning Tip */}
        {holidaysData.summary.totalUpcoming > 0 && (
          <Box mt={3} p={2} bgcolor="background.default" borderRadius={1}>
            <Typography variant="caption" color="textSecondary">
              💡 Holiday Planning Tip:
            </Typography>
            <Typography variant="caption" display="block" color="textSecondary">
              Plan your leaves around holidays to maximize your time off. Consider applying for leaves before or after holidays to create longer breaks!
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default UpcomingHolidaysDisplay