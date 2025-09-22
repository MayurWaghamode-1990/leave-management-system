import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
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
  IconButton,
  Tooltip,
  Alert,
  LinearProgress,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Fab
} from '@mui/material';
import {
  Event,
  Add,
  Edit,
  Delete,
  CalendarMonth,
  LocationOn,
  Public,
  Business,
  Refresh,
  Download,
  FilterList
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import toast from 'react-hot-toast';

import { useAuth } from '@/hooks/useAuth';
import api from '@/config/api';
import HolidayCalendar from '@/components/holidays/HolidayCalendar';

interface Holiday {
  id: string;
  name: string;
  date: string;
  type: 'NATIONAL' | 'REGIONAL' | 'COMPANY' | 'OPTIONAL';
  location: string;
  region: string;
  isOptional: boolean;
  createdBy?: string;
}

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
      id={`holidays-tabpanel-${index}`}
      aria-labelledby={`holidays-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const HolidaysPage: React.FC = () => {
  const { user } = useAuth();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [filterRegion, setFilterRegion] = useState<string>('ALL');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    date: dayjs() as Dayjs,
    type: 'COMPANY' as Holiday['type'],
    location: 'INDIA',
    region: 'INDIA',
    isOptional: false
  });

  const regions = ['INDIA', 'DELHI', 'MUMBAI', 'BANGALORE', 'CHENNAI', 'HYDERABAD', 'PUNE'];
  const holidayTypes = [
    { value: 'NATIONAL', label: 'National Holiday', color: 'error' },
    { value: 'REGIONAL', label: 'Regional Holiday', color: 'warning' },
    { value: 'COMPANY', label: 'Company Holiday', color: 'primary' },
    { value: 'OPTIONAL', label: 'Optional Holiday', color: 'info' }
  ];

  useEffect(() => {
    fetchHolidays();
  }, [selectedYear]);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/holidays?year=${selectedYear}`);
      setHolidays(response.data.data || []);
    } catch (error) {
      console.error('Error fetching holidays:', error);
      // Fallback to mock data
      setHolidays(getMockHolidays());
    } finally {
      setLoading(false);
    }
  };

  const getMockHolidays = (): Holiday[] => [
    {
      id: '1',
      name: 'New Year\'s Day',
      date: `${selectedYear}-01-01`,
      type: 'NATIONAL',
      location: 'INDIA',
      region: 'INDIA',
      isOptional: false
    },
    {
      id: '2',
      name: 'Republic Day',
      date: `${selectedYear}-01-26`,
      type: 'NATIONAL',
      location: 'INDIA',
      region: 'INDIA',
      isOptional: false
    },
    {
      id: '3',
      name: 'Holi',
      date: `${selectedYear}-03-14`,
      type: 'REGIONAL',
      location: 'DELHI',
      region: 'DELHI',
      isOptional: false
    },
    {
      id: '4',
      name: 'Good Friday',
      date: `${selectedYear}-03-29`,
      type: 'OPTIONAL',
      location: 'INDIA',
      region: 'INDIA',
      isOptional: true
    },
    {
      id: '5',
      name: 'Independence Day',
      date: `${selectedYear}-08-15`,
      type: 'NATIONAL',
      location: 'INDIA',
      region: 'INDIA',
      isOptional: false
    },
    {
      id: '6',
      name: 'Gandhi Jayanti',
      date: `${selectedYear}-10-02`,
      type: 'NATIONAL',
      location: 'INDIA',
      region: 'INDIA',
      isOptional: false
    },
    {
      id: '7',
      name: 'Diwali',
      date: `${selectedYear}-11-12`,
      type: 'COMPANY',
      location: 'INDIA',
      region: 'INDIA',
      isOptional: false
    },
    {
      id: '8',
      name: 'Christmas',
      date: `${selectedYear}-12-25`,
      type: 'NATIONAL',
      location: 'INDIA',
      region: 'INDIA',
      isOptional: false
    }
  ];

  const handleAddHoliday = () => {
    setEditingHoliday(null);
    setFormData({
      name: '',
      date: dayjs(),
      type: 'COMPANY',
      location: 'INDIA',
      region: 'INDIA',
      isOptional: false
    });
    setDialogOpen(true);
  };

  const handleEditHoliday = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setFormData({
      name: holiday.name,
      date: dayjs(holiday.date),
      type: holiday.type,
      location: holiday.location,
      region: holiday.region,
      isOptional: holiday.isOptional
    });
    setDialogOpen(true);
  };

  const handleDeleteHoliday = async (holidayId: string) => {
    if (!confirm('Are you sure you want to delete this holiday?')) return;

    try {
      await api.delete(`/holidays/${holidayId}`);
      setHolidays(holidays.filter(h => h.id !== holidayId));
      toast.success('Holiday deleted successfully');
    } catch (error) {
      toast.error('Failed to delete holiday');
    }
  };

  const handleSaveHoliday = async () => {
    try {
      const holidayData = {
        name: formData.name,
        date: formData.date.format('YYYY-MM-DD'),
        type: formData.type,
        location: formData.location,
        region: formData.region,
        isOptional: formData.isOptional
      };

      if (editingHoliday) {
        await api.put(`/holidays/${editingHoliday.id}`, holidayData);
        setHolidays(holidays.map(h =>
          h.id === editingHoliday.id
            ? { ...h, ...holidayData }
            : h
        ));
        toast.success('Holiday updated successfully');
      } else {
        const response = await api.post('/holidays', holidayData);
        setHolidays([...holidays, { id: Date.now().toString(), ...holidayData }]);
        toast.success('Holiday added successfully');
      }

      setDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save holiday');
    }
  };

  const handleExportHolidays = () => {
    const csvData = holidays.map(h => ({
      Name: h.name,
      Date: dayjs(h.date).format('DD/MM/YYYY'),
      Type: h.type,
      Location: h.location,
      Region: h.region,
      'Is Optional': h.isOptional ? 'Yes' : 'No'
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
    toast.success('Holidays exported successfully');
  };

  const getFilteredHolidays = () => {
    let filtered = holidays;

    if (filterRegion !== 'ALL') {
      filtered = filtered.filter(h =>
        h.location === filterRegion || h.region === filterRegion
      );
    }

    switch (currentTab) {
      case 1:
        return filtered.filter(h => h.type === 'NATIONAL');
      case 2:
        return filtered.filter(h => h.type === 'REGIONAL');
      case 3:
        return filtered.filter(h => h.type === 'COMPANY');
      case 4:
        return filtered.filter(h => h.type === 'OPTIONAL');
      default:
        return filtered;
    }
  };

  const getTypeColor = (type: Holiday['type']) => {
    const typeConfig = holidayTypes.find(t => t.value === type);
    return typeConfig?.color || 'default';
  };

  const getUpcomingHolidays = () => {
    const today = dayjs();
    return holidays
      .filter(h => dayjs(h.date).isAfter(today))
      .sort((a, b) => dayjs(a.date).diff(dayjs(b.date)))
      .slice(0, 5);
  };

  const isHRAdmin = user?.role === 'HR_ADMIN' || user?.role === 'IT_ADMIN';

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Holiday Management
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Event />
            Holiday Management {selectedYear}
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Manage company holidays and view upcoming celebrations
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            select
            size="small"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            label="Year"
            sx={{ minWidth: 100 }}
          >
            {[2023, 2024, 2025, 2026].map(year => (
              <MenuItem key={year} value={year}>{year}</MenuItem>
            ))}
          </TextField>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Region</InputLabel>
            <Select
              value={filterRegion}
              label="Region"
              onChange={(e) => setFilterRegion(e.target.value)}
            >
              <MenuItem value="ALL">All Regions</MenuItem>
              {regions.map(region => (
                <MenuItem key={region} value={region}>{region}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExportHolidays}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchHolidays}
          >
            Refresh
          </Button>
          {isHRAdmin && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddHoliday}
            >
              Add Holiday
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Calendar View */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
                  <Tab label={`All (${holidays.length})`} />
                  <Tab label={`National (${holidays.filter(h => h.type === 'NATIONAL').length})`} />
                  <Tab label={`Regional (${holidays.filter(h => h.type === 'REGIONAL').length})`} />
                  <Tab label={`Company (${holidays.filter(h => h.type === 'COMPANY').length})`} />
                  <Tab label={`Optional (${holidays.filter(h => h.type === 'OPTIONAL').length})`} />
                </Tabs>
              </Box>

              <TabPanel value={currentTab} index={0}>
                <HolidayCalendar holidays={getFilteredHolidays()} />
              </TabPanel>
              <TabPanel value={currentTab} index={1}>
                <HolidayCalendar holidays={getFilteredHolidays()} />
              </TabPanel>
              <TabPanel value={currentTab} index={2}>
                <HolidayCalendar holidays={getFilteredHolidays()} />
              </TabPanel>
              <TabPanel value={currentTab} index={3}>
                <HolidayCalendar holidays={getFilteredHolidays()} />
              </TabPanel>
              <TabPanel value={currentTab} index={4}>
                <HolidayCalendar holidays={getFilteredHolidays()} />
              </TabPanel>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Holidays Sidebar */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarMonth />
                Upcoming Holidays
              </Typography>
              <List>
                {getUpcomingHolidays().map((holiday) => (
                  <ListItem key={holiday.id} sx={{ px: 0 }}>
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
                          <Typography variant="caption" display="block">
                            {dayjs(holiday.date).format('MMM DD, YYYY')} • {dayjs(holiday.date).fromNow()}
                          </Typography>
                          <Chip
                            label={holiday.type}
                            size="small"
                            color={getTypeColor(holiday.type) as any}
                            variant="outlined"
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
                {getUpcomingHolidays().length === 0 && (
                  <Typography variant="body2" color="textSecondary" textAlign="center" sx={{ py: 2 }}>
                    No upcoming holidays this year
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>

          {/* Holiday Statistics */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Holiday Statistics
              </Typography>
              <Grid container spacing={2}>
                {holidayTypes.map((type) => {
                  const count = holidays.filter(h => h.type === type.value).length;
                  return (
                    <Grid item xs={6} key={type.value}>
                      <Box textAlign="center">
                        <Typography variant="h4" color={`${type.color}.main`}>
                          {count}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {type.label}
                        </Typography>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add Holiday FAB */}
      {isHRAdmin && (
        <Fab
          color="primary"
          aria-label="add holiday"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={handleAddHoliday}
        >
          <Add />
        </Fab>
      )}

      {/* Add/Edit Holiday Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingHoliday ? 'Edit Holiday' : 'Add Holiday'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Holiday Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Date"
                value={formData.date}
                onChange={(date) => setFormData({ ...formData, date: date || dayjs() })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Type"
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Holiday['type'] })}
                >
                  {holidayTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Location</InputLabel>
                <Select
                  value={formData.location}
                  label="Location"
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                >
                  {regions.map((location) => (
                    <MenuItem key={location} value={location}>
                      {location}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Region</InputLabel>
                <Select
                  value={formData.region}
                  label="Region"
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                >
                  {regions.map((region) => (
                    <MenuItem key={region} value={region}>
                      {region}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveHoliday}
            variant="contained"
            disabled={!formData.name || !formData.date}
          >
            {editingHoliday ? 'Update' : 'Add'} Holiday
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default HolidaysPage;