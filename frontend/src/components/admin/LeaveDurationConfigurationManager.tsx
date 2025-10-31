import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  Alert,
  Skeleton,
  Tooltip,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  Save,
  Cancel,
  AccessTime,
  ExpandMore
} from '@mui/icons-material'
import { toast } from 'react-hot-toast'
import api from '@/config/api'

interface TimeSlot {
  code: string
  displayName: string
  startTime: string
  endTime: string
}

interface LeaveDurationConfiguration {
  id: string
  region: string
  fullDayEnabled: boolean
  fullDayHours: number
  halfDayEnabled: boolean
  halfDayHours: number
  halfDaySlots?: TimeSlot[]
  quarterDayEnabled: boolean
  quarterDayHours: number
  quarterDaySlots?: TimeSlot[]
  hourlyEnabled: boolean
  minimumHours: number
  maximumHours: number
  allowedLeaveTypes?: string[]
  allowMixedDuration: boolean
  roundingMethod: string
  roundingPrecision: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Props {
  onRefresh?: () => void
}

const REGIONS = [
  { value: 'INDIA', label: 'India', icon: '🇮🇳' },
  { value: 'USA', label: 'USA', icon: '🇺🇸' },
  { value: 'GLOBAL', label: 'Global', icon: '🌍' }
]

const ROUNDING_METHODS = [
  { value: 'UP', label: 'Round Up' },
  { value: 'DOWN', label: 'Round Down' },
  { value: 'NEAREST', label: 'Round to Nearest' }
]

const DEFAULT_HALF_DAY_SLOTS: TimeSlot[] = [
  { code: 'FIRST_HALF', displayName: 'First Half', startTime: '09:00', endTime: '13:00' },
  { code: 'SECOND_HALF', displayName: 'Second Half', startTime: '13:00', endTime: '18:00' }
]

const DEFAULT_QUARTER_DAY_SLOTS: TimeSlot[] = [
  { code: 'MORNING', displayName: 'Morning (9-11 AM)', startTime: '09:00', endTime: '11:00' },
  { code: 'LATE_MORNING', displayName: 'Late Morning (11 AM-1 PM)', startTime: '11:00', endTime: '13:00' },
  { code: 'AFTERNOON', displayName: 'Afternoon (1-3 PM)', startTime: '13:00', endTime: '15:00' },
  { code: 'LATE_AFTERNOON', displayName: 'Late Afternoon (3-5 PM)', startTime: '15:00', endTime: '17:00' }
]

const LeaveDurationConfigurationManager: React.FC<Props> = ({ onRefresh }) => {
  const [configurations, setConfigurations] = useState<LeaveDurationConfiguration[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<LeaveDurationConfiguration | null>(null)
  const [formData, setFormData] = useState<Partial<LeaveDurationConfiguration>>({
    region: 'INDIA',
    fullDayEnabled: true,
    fullDayHours: 8.0,
    halfDayEnabled: true,
    halfDayHours: 4.0,
    halfDaySlots: DEFAULT_HALF_DAY_SLOTS,
    quarterDayEnabled: false,
    quarterDayHours: 2.0,
    quarterDaySlots: DEFAULT_QUARTER_DAY_SLOTS,
    hourlyEnabled: false,
    minimumHours: 1.0,
    maximumHours: 8.0,
    allowMixedDuration: false,
    roundingMethod: 'NEAREST',
    roundingPrecision: 0.5,
    isActive: true
  })

  useEffect(() => {
    fetchConfigurations()
  }, [])

  const fetchConfigurations = async () => {
    try {
      setLoading(true)
      const response = await api.get('/leave-duration-configurations?activeOnly=false')
      if (response.data.success) {
        setConfigurations(response.data.data)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch leave duration configurations')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (config?: LeaveDurationConfiguration) => {
    if (config) {
      setEditingConfig(config)
      setFormData({
        region: config.region,
        fullDayEnabled: config.fullDayEnabled,
        fullDayHours: config.fullDayHours,
        halfDayEnabled: config.halfDayEnabled,
        halfDayHours: config.halfDayHours,
        halfDaySlots: config.halfDaySlots || DEFAULT_HALF_DAY_SLOTS,
        quarterDayEnabled: config.quarterDayEnabled,
        quarterDayHours: config.quarterDayHours,
        quarterDaySlots: config.quarterDaySlots || DEFAULT_QUARTER_DAY_SLOTS,
        hourlyEnabled: config.hourlyEnabled,
        minimumHours: config.minimumHours,
        maximumHours: config.maximumHours,
        allowedLeaveTypes: config.allowedLeaveTypes,
        allowMixedDuration: config.allowMixedDuration,
        roundingMethod: config.roundingMethod,
        roundingPrecision: config.roundingPrecision,
        isActive: config.isActive
      })
    } else {
      setEditingConfig(null)
      setFormData({
        region: 'INDIA',
        fullDayEnabled: true,
        fullDayHours: 8.0,
        halfDayEnabled: true,
        halfDayHours: 4.0,
        halfDaySlots: DEFAULT_HALF_DAY_SLOTS,
        quarterDayEnabled: false,
        quarterDayHours: 2.0,
        quarterDaySlots: DEFAULT_QUARTER_DAY_SLOTS,
        hourlyEnabled: false,
        minimumHours: 1.0,
        maximumHours: 8.0,
        allowMixedDuration: false,
        roundingMethod: 'NEAREST',
        roundingPrecision: 0.5,
        isActive: true
      })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingConfig(null)
  }

  const handleSubmit = async () => {
    try {
      if (!formData.region) {
        toast.error('Please select a region')
        return
      }

      if (editingConfig) {
        const response = await api.patch(`/leave-duration-configurations/${editingConfig.id}`, formData)
        if (response.data.success) {
          toast.success('Leave duration configuration updated successfully')
          fetchConfigurations()
          handleCloseDialog()
          onRefresh?.()
        }
      } else {
        const response = await api.post('/leave-duration-configurations', formData)
        if (response.data.success) {
          toast.success('Leave duration configuration created successfully')
          fetchConfigurations()
          handleCloseDialog()
          onRefresh?.()
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save leave duration configuration')
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this leave duration configuration?')) {
      return
    }

    try {
      const response = await api.delete(`/leave-duration-configurations/${id}`)
      if (response.data.success) {
        toast.success('Leave duration configuration deleted successfully')
        fetchConfigurations()
        onRefresh?.()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete leave duration configuration')
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await api.patch(`/leave-duration-configurations/${id}`, { isActive })
      if (response.data.success) {
        toast.success(`Configuration ${isActive ? 'activated' : 'deactivated'} successfully`)
        fetchConfigurations()
        onRefresh?.()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update configuration status')
    }
  }

  const getRegionLabel = (region: string) => {
    return REGIONS.find(r => r.value === region)?.label || region
  }

  const getRegionIcon = (region: string) => {
    return REGIONS.find(r => r.value === region)?.icon || '🌍'
  }

  const getDurationOptions = (config: LeaveDurationConfiguration) => {
    const options = []
    if (config.fullDayEnabled) options.push('Full Day')
    if (config.halfDayEnabled) options.push('Half Day')
    if (config.quarterDayEnabled) options.push('Quarter Day')
    if (config.hourlyEnabled) options.push('Hourly')
    return options
  }

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={400} />
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          <AccessTime sx={{ verticalAlign: 'middle', mr: 1 }} />
          Leave Duration Configurations
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Configuration
        </Button>
      </Box>

      {configurations.length === 0 ? (
        <Alert severity="info">
          No leave duration configurations found. Click "Add Configuration" to create one.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Region</TableCell>
                <TableCell>Supported Durations</TableCell>
                <TableCell align="center">Full Day</TableCell>
                <TableCell align="center">Half Day</TableCell>
                <TableCell align="center">Quarter Day</TableCell>
                <TableCell align="center">Hourly</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {configurations.map((config) => (
                <TableRow key={config.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{getRegionIcon(config.region)}</span>
                      <Typography variant="body2" fontWeight="medium">
                        {getRegionLabel(config.region)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {getDurationOptions(config).map(option => (
                        <Chip
                          key={option}
                          label={option}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    {config.fullDayEnabled && (
                      <Chip label={`${config.fullDayHours}h`} size="small" />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {config.halfDayEnabled && (
                      <Chip label={`${config.halfDayHours}h`} size="small" />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {config.quarterDayEnabled && (
                      <Chip label={`${config.quarterDayHours}h`} size="small" />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {config.hourlyEnabled && (
                      <Chip label={`${config.minimumHours}-${config.maximumHours}h`} size="small" />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Switch
                      checked={config.isActive}
                      onChange={(e) => handleToggleActive(config.id, e.target.checked)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(config)}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(config.id)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingConfig ? 'Edit Leave Duration Configuration' : 'Add Leave Duration Configuration'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Region Selection */}
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Region *</InputLabel>
                <Select
                  value={formData.region}
                  label="Region *"
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  disabled={!!editingConfig}
                >
                  {REGIONS.map((region) => (
                    <MenuItem key={region.value} value={region.value}>
                      {region.icon} {region.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {editingConfig && (
                <Typography variant="caption" color="text.secondary">
                  Region cannot be changed after creation
                </Typography>
              )}
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* Full Day Configuration */}
            <Grid item xs={12}>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.fullDayEnabled}
                        onChange={(e) => setFormData({ ...formData, fullDayEnabled: e.target.checked })}
                        onClick={(e) => e.stopPropagation()}
                      />
                    }
                    label={<Typography fontWeight="medium">Full Day Leave</Typography>}
                    onClick={(e) => e.stopPropagation()}
                  />
                </AccordionSummary>
                <AccordionDetails>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Full Day Hours"
                    value={formData.fullDayHours}
                    onChange={(e) => setFormData({ ...formData, fullDayHours: parseFloat(e.target.value) })}
                    disabled={!formData.fullDayEnabled}
                    inputProps={{ step: 0.5, min: 1, max: 24 }}
                  />
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Half Day Configuration */}
            <Grid item xs={12}>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.halfDayEnabled}
                        onChange={(e) => setFormData({ ...formData, halfDayEnabled: e.target.checked })}
                        onClick={(e) => e.stopPropagation()}
                      />
                    }
                    label={<Typography fontWeight="medium">Half Day Leave</Typography>}
                    onClick={(e) => e.stopPropagation()}
                  />
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Half Day Hours"
                        value={formData.halfDayHours}
                        onChange={(e) => setFormData({ ...formData, halfDayHours: parseFloat(e.target.value) })}
                        disabled={!formData.halfDayEnabled}
                        inputProps={{ step: 0.5, min: 1, max: 12 }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Time Slots: {formData.halfDaySlots?.length || 0} slots configured
                      </Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Quarter Day Configuration */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.quarterDayEnabled}
                        onChange={(e) => setFormData({ ...formData, quarterDayEnabled: e.target.checked })}
                        onClick={(e) => e.stopPropagation()}
                      />
                    }
                    label={<Typography fontWeight="medium">Quarter Day Leave</Typography>}
                    onClick={(e) => e.stopPropagation()}
                  />
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Quarter Day Hours"
                        value={formData.quarterDayHours}
                        onChange={(e) => setFormData({ ...formData, quarterDayHours: parseFloat(e.target.value) })}
                        disabled={!formData.quarterDayEnabled}
                        inputProps={{ step: 0.5, min: 0.5, max: 6 }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Time Slots: {formData.quarterDaySlots?.length || 0} slots configured
                      </Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Hourly Leave Configuration */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.hourlyEnabled}
                        onChange={(e) => setFormData({ ...formData, hourlyEnabled: e.target.checked })}
                        onClick={(e) => e.stopPropagation()}
                      />
                    }
                    label={<Typography fontWeight="medium">Hourly Leave</Typography>}
                    onClick={(e) => e.stopPropagation()}
                  />
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Minimum Hours"
                        value={formData.minimumHours}
                        onChange={(e) => setFormData({ ...formData, minimumHours: parseFloat(e.target.value) })}
                        disabled={!formData.hourlyEnabled}
                        inputProps={{ step: 0.5, min: 0.5, max: 8 }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Maximum Hours"
                        value={formData.maximumHours}
                        onChange={(e) => setFormData({ ...formData, maximumHours: parseFloat(e.target.value) })}
                        disabled={!formData.hourlyEnabled}
                        inputProps={{ step: 0.5, min: 1, max: 24 }}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* Additional Settings */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Rounding Method</InputLabel>
                <Select
                  value={formData.roundingMethod}
                  label="Rounding Method"
                  onChange={(e) => setFormData({ ...formData, roundingMethod: e.target.value })}
                >
                  {ROUNDING_METHODS.map((method) => (
                    <MenuItem key={method.value} value={method.value}>
                      {method.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Rounding Precision"
                value={formData.roundingPrecision}
                onChange={(e) => setFormData({ ...formData, roundingPrecision: parseFloat(e.target.value) })}
                inputProps={{ step: 0.25, min: 0.25, max: 1 }}
                helperText="E.g., 0.5 for half-hour precision"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.allowMixedDuration}
                    onChange={(e) => setFormData({ ...formData, allowMixedDuration: e.target.checked })}
                  />
                }
                label="Allow Mixed Duration (multi-day with different durations)"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} startIcon={<Cancel />}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            startIcon={<Save />}
            disabled={!formData.region}
          >
            {editingConfig ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default LeaveDurationConfigurationManager
