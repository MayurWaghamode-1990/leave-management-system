import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  Tooltip,
  Fab,
  Divider
} from '@mui/material';
import {
  Event,
  Add,
  Edit,
  Delete,
  Visibility,
  CloudUpload,
  GetApp,
  Sync,
  Public,
  LocationOn,
  CalendarToday,
  Notifications
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import toast from 'react-hot-toast';

import api from '@/config/api';
import { useAuth } from '@/hooks/useAuth';

interface Holiday {
  id: string;
  name: string;
  date: string;
  location: 'India' | 'USA' | 'Global';
  isOptional: boolean;
  description?: string;
  category: 'Public' | 'Religious' | 'National' | 'Regional';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface HolidayForm {
  name: string;
  date: Dayjs | null;
  location: 'India' | 'USA' | 'Global';
  isOptional: boolean;
  description: string;
  category: 'Public' | 'Religious' | 'National' | 'Regional';
  isActive: boolean;
}

const HolidayManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [filteredHolidays, setFilteredHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedLocation, setSelectedLocation] = useState<string>('');

  const [holidayForm, setHolidayForm] = useState<HolidayForm>({
    name: '',
    date: null,
    location: 'Global',
    isOptional: false,
    description: '',
    category: 'Public',
    isActive: true
  });

  const locationOptions = [
    { value: '', label: 'All Locations' },
    { value: 'India', label: 'India' },
    { value: 'USA', label: 'United States' },
    { value: 'Global', label: 'Global' }
  ];

  const categoryOptions = [
    { value: 'Public', label: 'Public Holiday' },
    { value: 'Religious', label: 'Religious Holiday' },
    { value: 'National', label: 'National Holiday' },
    { value: 'Regional', label: 'Regional Holiday' }
  ];

  const yearOptions = [2023, 2024, 2025, 2026];

  useEffect(() => {
    if (user?.role === 'HR_ADMIN') {
      fetchHolidays();
    }
  }, [selectedYear, user]);

  useEffect(() => {
    applyFilters();
  }, [holidays, selectedLocation, tabValue]);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/holidays?year=${selectedYear}`);

      if (response.data.success) {
        // Transform the API response to match the frontend interface
        const transformedHolidays = response.data.data.map((holiday: any) => ({
          id: holiday.id,
          name: holiday.name,
          date: holiday.date.split('T')[0], // Convert to YYYY-MM-DD format
          location: holiday.location || 'Global',
          isOptional: holiday.isOptional || false,
          description: holiday.description || '',
          category: holiday.type || 'Public',
          isActive: true, // API doesn't return isActive, default to true
          createdAt: holiday.createdAt,
          updatedAt: holiday.updatedAt
        }));
        setHolidays(transformedHolidays);
      } else {
        throw new Error('Failed to fetch holidays');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch holidays';
      toast.error(errorMessage);
      console.error('Holidays fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = holidays;

    // Location filter
    if (selectedLocation) {
      filtered = filtered.filter(holiday => holiday.location === selectedLocation);
    }

    // Tab filter
    switch (tabValue) {
      case 1:
        filtered = filtered.filter(holiday => holiday.location === 'India');
        break;
      case 2:
        filtered = filtered.filter(holiday => holiday.location === 'USA');
        break;
      case 3:
        filtered = filtered.filter(holiday => holiday.location === 'Global');
        break;
      case 4:
        filtered = filtered.filter(holiday => holiday.isOptional);
        break;
    }

    setFilteredHolidays(filtered);
  };

  const handleAddHoliday = () => {
    setEditingHoliday(null);
    setHolidayForm({
      name: '',
      date: null,
      location: 'Global',
      isOptional: false,
      description: '',
      category: 'Public',
      isActive: true
    });
    setDialogOpen(true);
  };

  const handleEditHoliday = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setHolidayForm({
      name: holiday.name,
      date: dayjs(holiday.date),
      location: holiday.location,
      isOptional: holiday.isOptional,
      description: holiday.description || '',
      category: holiday.category,
      isActive: holiday.isActive
    });
    setDialogOpen(true);
  };

  const handleSaveHoliday = async () => {
    if (!holidayForm.name || !holidayForm.date) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      const holidayData = {
        name: holidayForm.name,
        date: holidayForm.date.format('YYYY-MM-DD'),
        location: holidayForm.location,
        region: holidayForm.location === 'India' ? 'INDIA' : holidayForm.location === 'USA' ? 'USA' : 'GLOBAL',
        isOptional: holidayForm.isOptional,
        description: holidayForm.description,
        type: holidayForm.category.toUpperCase()
      };

      if (editingHoliday) {
        // Update existing holiday
        const response = await api.put(`/holidays/${editingHoliday.id}`, holidayData);
        if (response.data.success) {
          toast.success('Holiday updated successfully');
        }
      } else {
        // Create new holiday
        const response = await api.post('/holidays', holidayData);
        if (response.data.success) {
          toast.success('Holiday created successfully');
        }
      }

      setDialogOpen(false);
      fetchHolidays();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to save holiday';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHoliday = async (holidayId: string) => {
    if (!confirm('Are you sure you want to delete this holiday?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.delete(`/holidays/${holidayId}`);
      if (response.data.success) {
        toast.success('Holiday deleted successfully');
        fetchHolidays();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete holiday';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncWithExternalAPI = async () => {
    try {
      setLoading(true);
      const response = await api.post('/holidays/sync', {
        year: selectedYear,
        region: selectedLocation === 'India' ? 'INDIA' : selectedLocation === 'USA' ? 'USA' : undefined
      });

      if (response.data.success) {
        toast.success(response.data.message || 'Holidays synced successfully');
        fetchHolidays();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to sync holidays';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSendHolidayReminders = async () => {
    try {
      setLoading(true);
      // Use the enhanced holiday reminder service
      const response = await api.post('/enhanced-features/holiday-reminders/send', {
        reminderDaysBefore: [7, 3, 1],
        enableReminders: true,
        includeOptionalHolidays: true,
        regions: selectedLocation ? [selectedLocation.toUpperCase()] : ['INDIA', 'USA']
      });

      if (response.data.success) {
        toast.success(`Holiday reminders sent successfully. ${response.data.data.remindersSent} reminders sent.`);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to send holiday reminders';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const exportHolidays = () => {
    const csvData = filteredHolidays.map(holiday => ({
      'Holiday Name': holiday.name,
      'Date': dayjs(holiday.date).format('YYYY-MM-DD'),
      'Location': holiday.location,
      'Category': holiday.category,
      'Type': holiday.isOptional ? 'Optional' : 'Mandatory',
      'Status': holiday.isActive ? 'Active' : 'Inactive',
      'Description': holiday.description || ''
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `holidays-${selectedYear}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getLocationIcon = (location: string) => {
    switch (location) {
      case 'India':
        return '🇮🇳';
      case 'USA':
        return '🇺🇸';
      case 'Global':
        return '🌍';
      default:
        return '📍';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'National':
        return 'primary';
      case 'Religious':
        return 'secondary';
      case 'Public':
        return 'success';
      case 'Regional':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Check if user has access to holiday management
  if (!user || user.role !== 'HR_ADMIN') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Alert severity="warning">
          <Typography>
            Access Denied. This page is only available to HR Administrators.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" gutterBottom>
            <Event sx={{ mr: 1, verticalAlign: 'middle' }} />
            Holiday Management
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<Sync />}
              onClick={handleSyncWithExternalAPI}
              disabled={loading}
            >
              Sync Holidays
            </Button>
            <Button
              variant="outlined"
              startIcon={<Notifications />}
              onClick={handleSendHolidayReminders}
              disabled={loading}
            >
              Send Reminders
            </Button>
            <Button
              variant="outlined"
              startIcon={<GetApp />}
              onClick={exportHolidays}
              disabled={filteredHolidays.length === 0}
            >
              Export
            </Button>
          </Box>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Manage holidays for different locations, send notifications to employees, and integrate with leave calculations.
          </Typography>
        </Alert>

        {/* Filters */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Year</InputLabel>
              <Select
                value={selectedYear}
                label="Year"
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {yearOptions.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Location</InputLabel>
              <Select
                value={selectedLocation}
                label="Location"
                onChange={(e) => setSelectedLocation(e.target.value)}
              >
                {locationOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Statistics Cards */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <CalendarToday color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h5" color="primary">
                    {holidays.length}
                  </Typography>
                </Box>
                <Typography variant="body2" color="textSecondary">
                  Total Holidays
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <LocationOn color="success" sx={{ mr: 1 }} />
                  <Typography variant="h5" color="success.main">
                    {holidays.filter(h => h.location === 'India').length}
                  </Typography>
                </Box>
                <Typography variant="body2" color="textSecondary">
                  India Holidays
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <LocationOn color="info" sx={{ mr: 1 }} />
                  <Typography variant="h5" color="info.main">
                    {holidays.filter(h => h.location === 'USA').length}
                  </Typography>
                </Box>
                <Typography variant="body2" color="textSecondary">
                  USA Holidays
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <Public color="warning" sx={{ mr: 1 }} />
                  <Typography variant="h5" color="warning.main">
                    {holidays.filter(h => h.isOptional).length}
                  </Typography>
                </Box>
                <Typography variant="body2" color="textSecondary">
                  Optional Holidays
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Tabs */}
        <Card sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            variant="fullWidth"
          >
            <Tab label={`All (${holidays.length})`} />
            <Tab label={`India (${holidays.filter(h => h.location === 'India').length})`} />
            <Tab label={`USA (${holidays.filter(h => h.location === 'USA').length})`} />
            <Tab label={`Global (${holidays.filter(h => h.location === 'Global').length})`} />
            <Tab label={`Optional (${holidays.filter(h => h.isOptional).length})`} />
          </Tabs>
        </Card>

        {/* Holidays Table */}
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Holiday List ({filteredHolidays.length})
              </Typography>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Holiday Name</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredHolidays.map((holiday) => (
                    <TableRow key={holiday.id}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {holiday.name}
                          </Typography>
                          {holiday.description && (
                            <Typography variant="caption" color="textSecondary">
                              {holiday.description}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {dayjs(holiday.date).format('MMM DD, YYYY')}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <span style={{ marginRight: 8 }}>{getLocationIcon(holiday.location)}</span>
                          {holiday.location}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={holiday.category}
                          color={getCategoryColor(holiday.category) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={holiday.isOptional ? 'Optional' : 'Mandatory'}
                          color={holiday.isOptional ? 'warning' : 'success'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={holiday.isActive ? 'Active' : 'Inactive'}
                          color={holiday.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="Edit Holiday">
                            <IconButton
                              size="small"
                              onClick={() => handleEditHoliday(holiday)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Holiday">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteHoliday(holiday.id)}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredHolidays.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="textSecondary">
                          No holidays found for the selected filters.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Floating Action Button */}
        <Fab
          color="primary"
          onClick={handleAddHoliday}
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
        >
          <Add />
        </Fab>

        {/* Holiday Form Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {editingHoliday ? 'Edit Holiday' : 'Add New Holiday'}
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Holiday Name"
                  value={holidayForm.name}
                  onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Holiday Date"
                  value={holidayForm.date}
                  onChange={(newValue) => setHolidayForm({ ...holidayForm, date: newValue })}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Location</InputLabel>
                  <Select
                    value={holidayForm.location}
                    label="Location"
                    onChange={(e) => setHolidayForm({ ...holidayForm, location: e.target.value as any })}
                  >
                    <MenuItem value="India">India 🇮🇳</MenuItem>
                    <MenuItem value="USA">United States 🇺🇸</MenuItem>
                    <MenuItem value="Global">Global 🌍</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={holidayForm.category}
                    label="Category"
                    onChange={(e) => setHolidayForm({ ...holidayForm, category: e.target.value as any })}
                  >
                    {categoryOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={holidayForm.isOptional}
                      onChange={(e) => setHolidayForm({ ...holidayForm, isOptional: e.target.checked })}
                    />
                  }
                  label="Optional Holiday"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={holidayForm.description}
                  onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })}
                  placeholder="Brief description of the holiday"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={holidayForm.isActive}
                      onChange={(e) => setHolidayForm({ ...holidayForm, isActive: e.target.checked })}
                    />
                  }
                  label="Active Holiday"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveHoliday}
              disabled={loading}
            >
              {editingHoliday ? 'Update' : 'Create'} Holiday
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default HolidayManagementPage;