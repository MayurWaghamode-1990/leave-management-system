import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  ButtonGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Switch,
  FormControlLabel,
  Slider,
  Autocomplete,
  Alert,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  FilterList,
  ExpandMore,
  Clear,
  Search,
  Save,
  Restore,
  Download,
  Refresh
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';

export interface ReportFilters {
  startDate?: Dayjs | null;
  endDate?: Dayjs | null;
  departments?: string[];
  locations?: string[];
  employeeIds?: string[];
  leaveTypes?: string[];
  statuses?: string[];
  managers?: string[];
  regions?: string[];
  minDuration?: number;
  maxDuration?: number;
  includeHalfDays?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface FilterOptions {
  departments: string[];
  locations: string[];
  leaveTypes: string[];
  managers: string[];
  regions: string[];
  employees?: { id: string; name: string; department: string }[];
}

interface AdvancedReportsFilterProps {
  filters: ReportFilters;
  onFiltersChange: (filters: ReportFilters) => void;
  onApplyFilters: () => void;
  onExport: (format: 'csv' | 'excel' | 'pdf') => void;
  loading?: boolean;
  filterOptions?: FilterOptions;
  onLoadFilterOptions?: () => void;
}

const defaultFilters: ReportFilters = {
  startDate: dayjs().subtract(30, 'days'),
  endDate: dayjs(),
  departments: [],
  locations: [],
  employeeIds: [],
  leaveTypes: [],
  statuses: [],
  managers: [],
  regions: [],
  minDuration: 0.5,
  maxDuration: 30,
  includeHalfDays: true,
  sortBy: 'date',
  sortOrder: 'desc',
  limit: 100,
  offset: 0
};

const statusOptions = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED'
];

const leaveTypeOptions = [
  'CASUAL_LEAVE',
  'SICK_LEAVE',
  'EARNED_LEAVE',
  'MATERNITY_LEAVE',
  'PATERNITY_LEAVE',
  'EMERGENCY_LEAVE',
  'LWP'
];

const sortOptions = [
  { value: 'date', label: 'Date Applied' },
  { value: 'duration', label: 'Leave Duration' },
  { value: 'employee', label: 'Employee Name' },
  { value: 'department', label: 'Department' }
];

const AdvancedReportsFilter: React.FC<AdvancedReportsFilterProps> = ({
  filters,
  onFiltersChange,
  onApplyFilters,
  onExport,
  loading = false,
  filterOptions,
  onLoadFilterOptions
}) => {
  const [expanded, setExpanded] = useState<string | false>('basic');
  const [savedFilters, setSavedFilters] = useState<ReportFilters[]>([]);

  useEffect(() => {
    // Load saved filters from localStorage
    const saved = localStorage.getItem('advancedReportFilters');
    if (saved) {
      try {
        setSavedFilters(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading saved filters:', error);
      }
    }

    // Load filter options on component mount
    if (onLoadFilterOptions) {
      onLoadFilterOptions();
    }
  }, [onLoadFilterOptions]);

  const handleFilterChange = (field: keyof ReportFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [field]: value
    });
  };

  const handleMultiSelectChange = (field: keyof ReportFilters, values: string[]) => {
    onFiltersChange({
      ...filters,
      [field]: values
    });
  };

  const handleClearFilters = () => {
    onFiltersChange(defaultFilters);
  };

  const handleSaveFilters = () => {
    const filterName = prompt('Enter a name for this filter set:');
    if (filterName) {
      const newSavedFilters = [
        ...savedFilters,
        { ...filters, name: filterName } as any
      ];
      setSavedFilters(newSavedFilters);
      localStorage.setItem('advancedReportFilters', JSON.stringify(newSavedFilters));
    }
  };

  const handleLoadSavedFilter = (savedFilter: ReportFilters) => {
    const { name, ...filterData } = savedFilter as any;
    onFiltersChange(filterData);
  };

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.departments && filters.departments.length > 0) count++;
    if (filters.locations && filters.locations.length > 0) count++;
    if (filters.employeeIds && filters.employeeIds.length > 0) count++;
    if (filters.leaveTypes && filters.leaveTypes.length > 0) count++;
    if (filters.statuses && filters.statuses.length > 0) count++;
    if (filters.managers && filters.managers.length > 0) count++;
    if (filters.regions && filters.regions.length > 0) count++;
    if (filters.minDuration !== defaultFilters.minDuration || filters.maxDuration !== defaultFilters.maxDuration) count++;
    return count;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Card>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterList />
              <Typography variant="h6">
                Advanced Filters
              </Typography>
              {getActiveFiltersCount() > 0 && (
                <Chip
                  label={`${getActiveFiltersCount()} active`}
                  size="small"
                  color="primary"
                />
              )}
            </Box>
          }
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Clear all filters">
                <IconButton onClick={handleClearFilters} size="small">
                  <Clear />
                </IconButton>
              </Tooltip>
              <Tooltip title="Save current filters">
                <IconButton onClick={handleSaveFilters} size="small">
                  <Save />
                </IconButton>
              </Tooltip>
            </Box>
          }
        />
        <CardContent>
          {/* Quick Actions */}
          <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button
              variant="contained"
              startIcon={<Search />}
              onClick={onApplyFilters}
              disabled={loading}
            >
              Apply Filters
            </Button>

            <ButtonGroup variant="outlined" size="small">
              <Button onClick={() => onExport('csv')} startIcon={<Download />}>
                CSV
              </Button>
              <Button onClick={() => onExport('excel')} startIcon={<Download />}>
                Excel
              </Button>
              <Button onClick={() => onExport('pdf')} startIcon={<Download />}>
                PDF
              </Button>
            </ButtonGroup>

            {savedFilters.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Saved Filters</InputLabel>
                <Select
                  value=""
                  label="Saved Filters"
                  onChange={(e) => {
                    const saved = savedFilters.find((f: any) => f.name === e.target.value);
                    if (saved) handleLoadSavedFilter(saved);
                  }}
                >
                  {savedFilters.map((saved: any, index) => (
                    <MenuItem key={index} value={saved.name}>
                      {saved.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>

          {/* Basic Filters */}
          <Accordion expanded={expanded === 'basic'} onChange={handleAccordionChange('basic')}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle1" fontWeight="medium">
                Basic Filters
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label="Start Date"
                    value={filters.startDate}
                    onChange={(value) => handleFilterChange('startDate', value)}
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label="End Date"
                    value={filters.endDate}
                    onChange={(value) => handleFilterChange('endDate', value)}
                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Leave Types</InputLabel>
                    <Select
                      multiple
                      value={filters.leaveTypes || []}
                      onChange={(e) => handleMultiSelectChange('leaveTypes', e.target.value as string[])}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip key={value} label={value.replace('_', ' ')} size="small" />
                          ))}
                        </Box>
                      )}
                    >
                      {leaveTypeOptions.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type.replace('_', ' ')}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      multiple
                      value={filters.statuses || []}
                      onChange={(e) => handleMultiSelectChange('statuses', e.target.value as string[])}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </Box>
                      )}
                    >
                      {statusOptions.map((status) => (
                        <MenuItem key={status} value={status}>
                          {status}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Organizational Filters */}
          <Accordion expanded={expanded === 'organizational'} onChange={handleAccordionChange('organizational')}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle1" fontWeight="medium">
                Organizational Filters
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={4}>
                  <Autocomplete
                    multiple
                    options={filterOptions?.departments || []}
                    value={filters.departments || []}
                    onChange={(event, newValue) => handleMultiSelectChange('departments', newValue)}
                    renderInput={(params) => (
                      <TextField {...params} label="Departments" size="small" />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          key={option}
                          variant="outlined"
                          label={option}
                          size="small"
                          {...getTagProps({ index })}
                        />
                      ))
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Autocomplete
                    multiple
                    options={filterOptions?.locations || []}
                    value={filters.locations || []}
                    onChange={(event, newValue) => handleMultiSelectChange('locations', newValue)}
                    renderInput={(params) => (
                      <TextField {...params} label="Locations" size="small" />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          key={option}
                          variant="outlined"
                          label={option}
                          size="small"
                          {...getTagProps({ index })}
                        />
                      ))
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Autocomplete
                    multiple
                    options={filterOptions?.managers || []}
                    value={filters.managers || []}
                    onChange={(event, newValue) => handleMultiSelectChange('managers', newValue)}
                    renderInput={(params) => (
                      <TextField {...params} label="Managers" size="small" />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          key={option}
                          variant="outlined"
                          label={option}
                          size="small"
                          {...getTagProps({ index })}
                        />
                      ))
                    }
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Advanced Options */}
          <Accordion expanded={expanded === 'advanced'} onChange={handleAccordionChange('advanced')}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle1" fontWeight="medium">
                Advanced Options
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>Duration Range (days)</Typography>
                  <Slider
                    value={[filters.minDuration || 0.5, filters.maxDuration || 30]}
                    onChange={(event, newValue) => {
                      const [min, max] = newValue as number[];
                      handleFilterChange('minDuration', min);
                      handleFilterChange('maxDuration', max);
                    }}
                    valueLabelDisplay="auto"
                    min={0.5}
                    max={60}
                    step={0.5}
                    marks={[
                      { value: 0.5, label: '0.5' },
                      { value: 15, label: '15' },
                      { value: 30, label: '30' },
                      { value: 60, label: '60' }
                    ]}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={filters.includeHalfDays || false}
                          onChange={(e) => handleFilterChange('includeHalfDays', e.target.checked)}
                        />
                      }
                      label="Include Half Days"
                    />
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                      <InputLabel>Sort By</InputLabel>
                      <Select
                        value={filters.sortBy || 'date'}
                        label="Sort By"
                        onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                      >
                        {sortOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                      <InputLabel>Sort Order</InputLabel>
                      <Select
                        value={filters.sortOrder || 'desc'}
                        label="Sort Order"
                        onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                      >
                        <MenuItem value="asc">Ascending</MenuItem>
                        <MenuItem value="desc">Descending</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Active Filters Summary */}
          {getActiveFiltersCount() > 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>{getActiveFiltersCount()} filter(s) active:</strong>{' '}
                {filters.departments && filters.departments.length > 0 && `Departments (${filters.departments.length}), `}
                {filters.locations && filters.locations.length > 0 && `Locations (${filters.locations.length}), `}
                {filters.leaveTypes && filters.leaveTypes.length > 0 && `Leave Types (${filters.leaveTypes.length}), `}
                {filters.statuses && filters.statuses.length > 0 && `Statuses (${filters.statuses.length}), `}
                {(filters.minDuration !== defaultFilters.minDuration || filters.maxDuration !== defaultFilters.maxDuration) && 'Duration Range, '}
                and more...
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>
    </LocalizationProvider>
  );
};

export default AdvancedReportsFilter;