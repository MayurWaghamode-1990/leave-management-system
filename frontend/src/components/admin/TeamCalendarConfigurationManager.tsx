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
  CalendarMonth,
  ExpandMore
} from '@mui/icons-material'
import { toast } from 'react-hot-toast'
import api from '@/config/api'

interface TeamCalendarConfiguration {
  id: string
  department: string
  teamDefinitionType: string
  includeSubordinates: boolean
  subordinateDepth: number
  displayConfig: any
  overlapEnabled: boolean
  overlapCalculation: string
  overlapThreshold: number
  excludeLeaveTypes?: string[]
  minimumTeamSize: number
  overlapActions: any
  externalCalendarEnabled: boolean
  syncProviders?: string[]
  syncFrequencyMinutes: number
  showEmployeeNames: boolean
  showLeaveTypes: boolean
  showLeaveDuration: boolean
  showLeaveReason: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Props {
  onRefresh?: () => void
}

const TEAM_DEFINITION_TYPES = [
  { value: 'REPORTING_HIERARCHY', label: 'Reporting Hierarchy', description: 'Based on manager-employee relationship' },
  { value: 'DEPARTMENT', label: 'Department', description: 'All members of a department' },
  { value: 'CUSTOM_GROUP', label: 'Custom Group', description: 'Manually defined team' }
]

const OVERLAP_CALCULATIONS = [
  { value: 'PERCENTAGE', label: 'Percentage', description: 'Percentage of team on leave' },
  { value: 'ABSOLUTE_COUNT', label: 'Absolute Count', description: 'Number of people on leave' }
]

const CALENDAR_PROVIDERS = [
  { value: 'GOOGLE', label: 'Google Calendar', icon: '📅' },
  { value: 'OUTLOOK', label: 'Outlook', icon: '📆' },
  { value: 'APPLE', label: 'Apple Calendar', icon: '🗓️' }
]

const TeamCalendarConfigurationManager: React.FC<Props> = ({ onRefresh }) => {
  const [configurations, setConfigurations] = useState<TeamCalendarConfiguration[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<TeamCalendarConfiguration | null>(null)
  const [formData, setFormData] = useState<Partial<TeamCalendarConfiguration>>({
    department: '',
    teamDefinitionType: 'REPORTING_HIERARCHY',
    includeSubordinates: true,
    subordinateDepth: 2,
    displayConfig: {
      defaultView: 'MONTH',
      showWeekends: true,
      showHolidays: true,
      colorScheme: 'DEFAULT'
    },
    overlapEnabled: false,
    overlapCalculation: 'PERCENTAGE',
    overlapThreshold: 20.0,
    minimumTeamSize: 2,
    overlapActions: {
      showWarning: true,
      blockApplication: false,
      notifyManager: true
    },
    externalCalendarEnabled: false,
    syncProviders: [],
    syncFrequencyMinutes: 30,
    showEmployeeNames: true,
    showLeaveTypes: true,
    showLeaveDuration: true,
    showLeaveReason: false,
    isActive: true
  })

  useEffect(() => {
    fetchConfigurations()
  }, [])

  const fetchConfigurations = async () => {
    try {
      setLoading(true)
      const response = await api.get('/team-calendar-configurations?activeOnly=false')
      if (response.data.success) {
        setConfigurations(response.data.data)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch team calendar configurations')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (config?: TeamCalendarConfiguration) => {
    if (config) {
      setEditingConfig(config)
      setFormData({
        department: config.department,
        teamDefinitionType: config.teamDefinitionType,
        includeSubordinates: config.includeSubordinates,
        subordinateDepth: config.subordinateDepth,
        displayConfig: config.displayConfig,
        overlapEnabled: config.overlapEnabled,
        overlapCalculation: config.overlapCalculation,
        overlapThreshold: config.overlapThreshold,
        excludeLeaveTypes: config.excludeLeaveTypes,
        minimumTeamSize: config.minimumTeamSize,
        overlapActions: config.overlapActions,
        externalCalendarEnabled: config.externalCalendarEnabled,
        syncProviders: config.syncProviders,
        syncFrequencyMinutes: config.syncFrequencyMinutes,
        showEmployeeNames: config.showEmployeeNames,
        showLeaveTypes: config.showLeaveTypes,
        showLeaveDuration: config.showLeaveDuration,
        showLeaveReason: config.showLeaveReason,
        isActive: config.isActive
      })
    } else {
      setEditingConfig(null)
      setFormData({
        department: '',
        teamDefinitionType: 'REPORTING_HIERARCHY',
        includeSubordinates: true,
        subordinateDepth: 2,
        displayConfig: {
          defaultView: 'MONTH',
          showWeekends: true,
          showHolidays: true,
          colorScheme: 'DEFAULT'
        },
        overlapEnabled: false,
        overlapCalculation: 'PERCENTAGE',
        overlapThreshold: 20.0,
        minimumTeamSize: 2,
        overlapActions: {
          showWarning: true,
          blockApplication: false,
          notifyManager: true
        },
        externalCalendarEnabled: false,
        syncProviders: [],
        syncFrequencyMinutes: 30,
        showEmployeeNames: true,
        showLeaveTypes: true,
        showLeaveDuration: true,
        showLeaveReason: false,
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
      if (editingConfig) {
        const response = await api.patch(`/team-calendar-configurations/${editingConfig.id}`, formData)
        if (response.data.success) {
          toast.success('Team calendar configuration updated successfully')
          fetchConfigurations()
          handleCloseDialog()
          onRefresh?.()
        }
      } else {
        const response = await api.post('/team-calendar-configurations', formData)
        if (response.data.success) {
          toast.success('Team calendar configuration created successfully')
          fetchConfigurations()
          handleCloseDialog()
          onRefresh?.()
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save team calendar configuration')
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this team calendar configuration?')) {
      return
    }

    try {
      const response = await api.delete(`/team-calendar-configurations/${id}`)
      if (response.data.success) {
        toast.success('Team calendar configuration deleted successfully')
        fetchConfigurations()
        onRefresh?.()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete team calendar configuration')
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await api.patch(`/team-calendar-configurations/${id}`, { isActive })
      if (response.data.success) {
        toast.success(`Configuration ${isActive ? 'activated' : 'deactivated'} successfully`)
        fetchConfigurations()
        onRefresh?.()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update configuration status')
    }
  }

  const getTeamTypeLabel = (type: string) => {
    return TEAM_DEFINITION_TYPES.find(t => t.value === type)?.label || type
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
          <CalendarMonth sx={{ verticalAlign: 'middle', mr: 1 }} />
          Team Calendar Configurations
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
          No team calendar configurations found. Click "Add Configuration" to create one.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Department</TableCell>
                <TableCell>Team Type</TableCell>
                <TableCell align="center">Overlap Check</TableCell>
                <TableCell align="center">External Sync</TableCell>
                <TableCell align="center">Privacy</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {configurations.map((config) => (
                <TableRow key={config.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {config.department || 'All Departments'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getTeamTypeLabel(config.teamDefinitionType)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {config.overlapEnabled ? (
                      <Tooltip title={`Max ${config.overlapThreshold}${config.overlapCalculation === 'PERCENTAGE' ? '%' : ' people'}`}>
                        <Chip label="Enabled" size="small" color="primary" />
                      </Tooltip>
                    ) : (
                      <Chip label="Disabled" size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {config.externalCalendarEnabled ? (
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        {config.syncProviders?.map(provider => (
                          <Tooltip key={provider} title={provider}>
                            <span>
                              {CALENDAR_PROVIDERS.find(p => p.value === provider)?.icon || '📅'}
                            </span>
                          </Tooltip>
                        ))}
                      </Box>
                    ) : (
                      <Chip label="Disabled" size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      {config.showEmployeeNames && <Chip label="Names" size="small" />}
                      {config.showLeaveReason && <Chip label="Reasons" size="small" />}
                    </Box>
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
          {editingConfig ? 'Edit Team Calendar Configuration' : 'Add Team Calendar Configuration'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Basic Configuration */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                helperText="Leave empty for all departments"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Team Definition Type</InputLabel>
                <Select
                  value={formData.teamDefinitionType}
                  label="Team Definition Type"
                  onChange={(e) => setFormData({ ...formData, teamDefinitionType: e.target.value })}
                >
                  {TEAM_DEFINITION_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box>
                        <Typography variant="body2">{type.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {type.description}
                        </Typography>
                      </Box>
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
                label="Subordinate Depth"
                value={formData.subordinateDepth}
                onChange={(e) => setFormData({ ...formData, subordinateDepth: parseInt(e.target.value) })}
                disabled={formData.teamDefinitionType !== 'REPORTING_HIERARCHY'}
                inputProps={{ min: 1, max: 10 }}
                helperText="Levels of reporting hierarchy"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.includeSubordinates}
                    onChange={(e) => setFormData({ ...formData, includeSubordinates: e.target.checked })}
                  />
                }
                label="Include Subordinates in Team View"
              />
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* Overlap Detection */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.overlapEnabled}
                        onChange={(e) => setFormData({ ...formData, overlapEnabled: e.target.checked })}
                        onClick={(e) => e.stopPropagation()}
                      />
                    }
                    label={<Typography fontWeight="medium">Overlap Detection</Typography>}
                    onClick={(e) => e.stopPropagation()}
                  />
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Calculation Method</InputLabel>
                        <Select
                          value={formData.overlapCalculation}
                          label="Calculation Method"
                          onChange={(e) => setFormData({ ...formData, overlapCalculation: e.target.value })}
                          disabled={!formData.overlapEnabled}
                        >
                          {OVERLAP_CALCULATIONS.map((calc) => (
                            <MenuItem key={calc.value} value={calc.value}>
                              {calc.label}
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
                        label={`Threshold ${formData.overlapCalculation === 'PERCENTAGE' ? '(%)' : '(People)'}`}
                        value={formData.overlapThreshold}
                        onChange={(e) => setFormData({ ...formData, overlapThreshold: parseFloat(e.target.value) })}
                        disabled={!formData.overlapEnabled}
                        inputProps={{ step: formData.overlapCalculation === 'PERCENTAGE' ? 5 : 1, min: 1 }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Minimum Team Size"
                        value={formData.minimumTeamSize}
                        onChange={(e) => setFormData({ ...formData, minimumTeamSize: parseInt(e.target.value) })}
                        disabled={!formData.overlapEnabled}
                        inputProps={{ min: 2 }}
                        helperText="Overlap check applies only if team size exceeds this"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="body2" fontWeight="medium" gutterBottom>
                        Overlap Actions
                      </Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.overlapActions?.showWarning}
                            onChange={(e) => setFormData({
                              ...formData,
                              overlapActions: { ...formData.overlapActions, showWarning: e.target.checked }
                            })}
                            disabled={!formData.overlapEnabled}
                          />
                        }
                        label="Show Warning"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.overlapActions?.blockApplication}
                            onChange={(e) => setFormData({
                              ...formData,
                              overlapActions: { ...formData.overlapActions, blockApplication: e.target.checked }
                            })}
                            disabled={!formData.overlapEnabled}
                          />
                        }
                        label="Block Application"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.overlapActions?.notifyManager}
                            onChange={(e) => setFormData({
                              ...formData,
                              overlapActions: { ...formData.overlapActions, notifyManager: e.target.checked }
                            })}
                            disabled={!formData.overlapEnabled}
                          />
                        }
                        label="Notify Manager"
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* External Calendar Sync */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.externalCalendarEnabled}
                        onChange={(e) => setFormData({ ...formData, externalCalendarEnabled: e.target.checked })}
                        onClick={(e) => e.stopPropagation()}
                      />
                    }
                    label={<Typography fontWeight="medium">External Calendar Sync</Typography>}
                    onClick={(e) => e.stopPropagation()}
                  />
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="body2" gutterBottom>
                        Select Calendar Providers:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {CALENDAR_PROVIDERS.map((provider) => (
                          <FormControlLabel
                            key={provider.value}
                            control={
                              <Switch
                                checked={formData.syncProviders?.includes(provider.value)}
                                onChange={(e) => {
                                  const providers = formData.syncProviders || []
                                  if (e.target.checked) {
                                    setFormData({ ...formData, syncProviders: [...providers, provider.value] })
                                  } else {
                                    setFormData({ ...formData, syncProviders: providers.filter(p => p !== provider.value) })
                                  }
                                }}
                                disabled={!formData.externalCalendarEnabled}
                              />
                            }
                            label={`${provider.icon} ${provider.label}`}
                          />
                        ))}
                      </Box>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Sync Frequency (minutes)"
                        value={formData.syncFrequencyMinutes}
                        onChange={(e) => setFormData({ ...formData, syncFrequencyMinutes: parseInt(e.target.value) })}
                        disabled={!formData.externalCalendarEnabled}
                        inputProps={{ min: 5, max: 1440, step: 5 }}
                        helperText="How often to sync with external calendars"
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* Privacy Settings */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Privacy Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.showEmployeeNames}
                        onChange={(e) => setFormData({ ...formData, showEmployeeNames: e.target.checked })}
                      />
                    }
                    label="Show Employee Names"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.showLeaveTypes}
                        onChange={(e) => setFormData({ ...formData, showLeaveTypes: e.target.checked })}
                      />
                    }
                    label="Show Leave Types"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.showLeaveDuration}
                        onChange={(e) => setFormData({ ...formData, showLeaveDuration: e.target.checked })}
                      />
                    }
                    label="Show Leave Duration"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.showLeaveReason}
                        onChange={(e) => setFormData({ ...formData, showLeaveReason: e.target.checked })}
                      />
                    }
                    label="Show Leave Reason"
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            <Grid item xs={12}>
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
          >
            {editingConfig ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default TeamCalendarConfigurationManager
