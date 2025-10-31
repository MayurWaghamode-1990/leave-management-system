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
  Paper
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  Save,
  Cancel,
  Dashboard as DashboardIcon
} from '@mui/icons-material'
import { toast } from 'react-hot-toast'
import api from '@/config/api'

interface WidgetConfiguration {
  id: string
  widgetCode: string
  displayName: string
  description: string
  widgetType: string
  dataSource: string
  refreshInterval: number
  enabled: boolean
  defaultSize: any
  allowedRoles: string[]
  configOptions: any
  createdAt: string
  updatedAt: string
}

interface Props {
  onRefresh?: () => void
}

const WIDGET_TYPES = [
  { value: 'STAT_CARD', label: 'Stat Card' },
  { value: 'CHART', label: 'Chart' },
  { value: 'TABLE', label: 'Table' },
  { value: 'LIST', label: 'List' },
  { value: 'CALENDAR', label: 'Calendar' }
]

const DATA_SOURCES = [
  { value: 'LEAVE_BALANCE', label: 'Leave Balance' },
  { value: 'PENDING_APPROVALS', label: 'Pending Approvals' },
  { value: 'TEAM_STATUS', label: 'Team Status' },
  { value: 'UPCOMING_LEAVES', label: 'Upcoming Leaves' },
  { value: 'HOLIDAYS', label: 'Holidays' },
  { value: 'ANALYTICS', label: 'Analytics' }
]

const DashboardWidgetConfigurationManager: React.FC<Props> = ({ onRefresh }) => {
  const [widgets, setWidgets] = useState<WidgetConfiguration[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingWidget, setEditingWidget] = useState<WidgetConfiguration | null>(null)
  const [formData, setFormData] = useState<Partial<WidgetConfiguration>>({
    widgetCode: '',
    displayName: '',
    description: '',
    widgetType: 'STAT_CARD',
    dataSource: 'LEAVE_BALANCE',
    refreshInterval: 300,
    enabled: true,
    defaultSize: { width: 4, height: 2 },
    allowedRoles: ['EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'HR']
  })

  useEffect(() => {
    fetchWidgets()
  }, [])

  const fetchWidgets = async () => {
    try {
      setLoading(true)
      const response = await api.get('/dashboard-configurations/widgets?enabledOnly=false')
      if (response.data.success) {
        setWidgets(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching widgets:', error)
      toast.error('Failed to fetch dashboard widgets')
    } finally {
      setLoading(false)
    }
  }

  const handleAddNew = () => {
    setEditingWidget(null)
    setFormData({
      widgetCode: '',
      displayName: '',
      description: '',
      widgetType: 'STAT_CARD',
      dataSource: 'LEAVE_BALANCE',
      refreshInterval: 300,
      enabled: true,
      defaultSize: { width: 4, height: 2 },
      allowedRoles: ['EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'HR']
    })
    setDialogOpen(true)
  }

  const handleEdit = (widget: WidgetConfiguration) => {
    setEditingWidget(widget)
    setFormData(widget)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      if (!formData.widgetCode || !formData.displayName) {
        toast.error('Widget Code and Display Name are required')
        return
      }

      if (editingWidget) {
        await api.patch(`/dashboard-configurations/widgets/${editingWidget.id}`, formData)
        toast.success('Widget updated successfully')
      } else {
        await api.post('/dashboard-configurations/widgets', formData)
        toast.success('Widget created successfully')
      }

      setDialogOpen(false)
      fetchWidgets()
      onRefresh?.()
    } catch (error: any) {
      console.error('Error saving widget:', error)
      toast.error(error.response?.data?.message || 'Failed to save widget')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this widget?')) {
      return
    }

    try {
      await api.delete(`/dashboard-configurations/widgets/${id}`)
      toast.success('Widget deleted successfully')
      fetchWidgets()
      onRefresh?.()
    } catch (error) {
      console.error('Error deleting widget:', error)
      toast.error('Failed to delete widget')
    }
  }

  const handleToggleEnabled = async (widget: WidgetConfiguration) => {
    try {
      await api.patch(`/dashboard-configurations/widgets/${widget.id}`, {
        enabled: !widget.enabled
      })
      toast.success(`Widget ${!widget.enabled ? 'enabled' : 'disabled'}`)
      fetchWidgets()
      onRefresh?.()
    } catch (error) {
      console.error('Error toggling widget:', error)
      toast.error('Failed to update widget')
    }
  }

  if (loading) {
    return (
      <Box>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} height={80} sx={{ my: 1 }} />
        ))}
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Dashboard Widget Configurations</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleAddNew}>
          Add Widget
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        Configure dashboard widgets with data sources, refresh intervals, and role-based visibility.
      </Alert>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Data Source</TableCell>
              <TableCell align="center">Refresh (sec)</TableCell>
              <TableCell align="center">Roles</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {widgets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Alert severity="info">No widgets configured yet. Click "Add Widget" to create one.</Alert>
                </TableCell>
              </TableRow>
            ) : (
              widgets.map((widget) => (
                <TableRow key={widget.id} hover>
                  <TableCell>
                    <Chip label={widget.widgetCode} size="small" color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">{widget.displayName}</Typography>
                    <Typography variant="caption" color="text.secondary">{widget.description}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={widget.widgetType} size="small" />
                  </TableCell>
                  <TableCell>{widget.dataSource}</TableCell>
                  <TableCell align="center">{widget.refreshInterval}s</TableCell>
                  <TableCell align="center">
                    <Chip label={`${widget.allowedRoles?.length || 0} roles`} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                    <Switch
                      checked={widget.enabled}
                      onChange={() => handleToggleEnabled(widget)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleEdit(widget)}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(widget.id)}
                        color="error"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingWidget ? 'Edit Widget Configuration' : 'Add New Widget Configuration'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Widget Code"
                value={formData.widgetCode}
                onChange={(e) => setFormData({ ...formData, widgetCode: e.target.value.toUpperCase() })}
                disabled={!!editingWidget}
                required
                helperText="e.g., LEAVE_BALANCE, TEAM_STATUS"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Display Name"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Widget Type</InputLabel>
                <Select
                  value={formData.widgetType}
                  label="Widget Type"
                  onChange={(e) => setFormData({ ...formData, widgetType: e.target.value })}
                >
                  {WIDGET_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Data Source</InputLabel>
                <Select
                  value={formData.dataSource}
                  label="Data Source"
                  onChange={(e) => setFormData({ ...formData, dataSource: e.target.value })}
                >
                  {DATA_SOURCES.map((source) => (
                    <MenuItem key={source.value} value={source.value}>
                      {source.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Refresh Interval (seconds)"
                value={formData.refreshInterval}
                onChange={(e) => setFormData({ ...formData, refreshInterval: parseInt(e.target.value) })}
                helperText="How often to refresh widget data (in seconds)"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} startIcon={<Cancel />}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} startIcon={<Save />}>
            {editingWidget ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default DashboardWidgetConfigurationManager
