import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
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
  FormControlLabel
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  Save,
  Cancel,
  Settings,
  ArrowUpward,
  ArrowDownward
} from '@mui/icons-material'
import { toast } from 'react-hot-toast'
import api from '@/config/api'
import LeaveTypeConfigurationManager from '@/components/admin/LeaveTypeConfigurationManager'
import DashboardWidgetConfigurationManager from '@/components/admin/DashboardWidgetConfigurationManager'
import BulkActionsConfigurationManager from '@/components/admin/BulkActionsConfigurationManager'
import WorkflowConfigurationManager from '@/components/admin/WorkflowConfigurationManager'
import LeaveDurationConfigurationManager from '@/components/admin/LeaveDurationConfigurationManager'
import TeamCalendarConfigurationManager from '@/components/admin/TeamCalendarConfigurationManager'

interface Configuration {
  id: string
  category: string
  value: string
  displayName: string
  isActive: boolean
  sortOrder: number
  metadata?: any
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`config-tabpanel-${index}`}
      aria-labelledby={`config-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

const CATEGORIES = [
  { key: 'DEPARTMENT', label: 'Departments', icon: '🏢', type: 'basic' },
  { key: 'LOCATION', label: 'Locations', icon: '📍', type: 'basic' },
  { key: 'DESIGNATION', label: 'Designations', icon: '💼', type: 'basic' },
  { key: 'GENDER', label: 'Gender', icon: '👤', type: 'basic' },
  { key: 'MARITAL_STATUS', label: 'Marital Status', icon: '💑', type: 'basic' },
  { key: 'COUNTRY', label: 'Countries', icon: '🌍', type: 'basic' },
  { key: 'LEAVE_TYPES', label: 'Leave Types', icon: '🏖️', type: 'advanced' },
  { key: 'DASHBOARDS', label: 'Dashboard Widgets', icon: '📊', type: 'advanced' },
  { key: 'BULK_ACTIONS', label: 'Bulk Actions', icon: '⚡', type: 'advanced' },
  { key: 'WORKFLOWS', label: 'Workflows', icon: '⚙️', type: 'advanced' },
  { key: 'LEAVE_DURATION', label: 'Leave Duration', icon: '⏱️', type: 'advanced' },
  { key: 'TEAM_CALENDAR', label: 'Team Calendar', icon: '📅', type: 'advanced' }
]

const ConfigurationsPage: React.FC = () => {
  const [tabIndex, setTabIndex] = useState(0)
  const [configurations, setConfigurations] = useState<Record<string, Configuration[]>>({})
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<Configuration | null>(null)
  const [formData, setFormData] = useState({
    value: '',
    displayName: '',
    sortOrder: 0
  })

  useEffect(() => {
    fetchConfigurations()
  }, [])

  const fetchConfigurations = async () => {
    try {
      setLoading(true)
      const response = await api.get('/configurations?activeOnly=false')
      if (response.data.success) {
        setConfigurations(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching configurations:', error)
      toast.error('Failed to fetch configurations')
    } finally {
      setLoading(false)
    }
  }

  const handleAddNew = () => {
    setEditingConfig(null)
    setFormData({
      value: '',
      displayName: '',
      sortOrder: (configurations[CATEGORIES[tabIndex].key]?.length || 0) + 1
    })
    setDialogOpen(true)
  }

  const handleEdit = (config: Configuration) => {
    setEditingConfig(config)
    setFormData({
      value: config.value,
      displayName: config.displayName,
      sortOrder: config.sortOrder
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      const category = CATEGORIES[tabIndex].key

      if (!formData.value || !formData.displayName) {
        toast.error('Value and Display Name are required')
        return
      }

      if (editingConfig) {
        // Update existing
        await api.patch(`/configurations/${editingConfig.id}`, formData)
        toast.success('Configuration updated successfully')
      } else {
        // Create new
        await api.post('/configurations', {
          category,
          ...formData
        })
        toast.success('Configuration created successfully')
      }

      setDialogOpen(false)
      fetchConfigurations()
    } catch (error: any) {
      console.error('Error saving configuration:', error)
      toast.error(error.response?.data?.message || 'Failed to save configuration')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this configuration?')) {
      return
    }

    try {
      await api.delete(`/configurations/${id}`)
      toast.success('Configuration deleted successfully')
      fetchConfigurations()
    } catch (error) {
      console.error('Error deleting configuration:', error)
      toast.error('Failed to delete configuration')
    }
  }

  const handleToggleActive = async (config: Configuration) => {
    try {
      await api.patch(`/configurations/${config.id}`, {
        isActive: !config.isActive
      })
      toast.success(`Configuration ${!config.isActive ? 'activated' : 'deactivated'}`)
      fetchConfigurations()
    } catch (error) {
      console.error('Error toggling configuration:', error)
      toast.error('Failed to update configuration')
    }
  }

  const handleReorder = async (config: Configuration, direction: 'up' | 'down') => {
    const category = CATEGORIES[tabIndex].key
    const items = configurations[category] || []
    const currentIndex = items.findIndex(item => item.id === config.id)

    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === items.length - 1)
    ) {
      return
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    const swapConfig = items[newIndex]

    try {
      // Swap sort orders
      await Promise.all([
        api.patch(`/configurations/${config.id}`, { sortOrder: swapConfig.sortOrder }),
        api.patch(`/configurations/${swapConfig.id}`, { sortOrder: config.sortOrder })
      ])

      fetchConfigurations()
    } catch (error) {
      console.error('Error reordering:', error)
      toast.error('Failed to reorder')
    }
  }

  const currentCategory = CATEGORIES[tabIndex]
  const currentConfigs = configurations[currentCategory.key] || []

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          System Configurations
        </Typography>
        {currentCategory.type === 'basic' && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddNew}
            disabled={loading}
          >
            Add New {currentCategory.label}
          </Button>
        )}
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Manage configurable options for departments, locations, designations, and other system fields.
          These values will be used across all forms and filters in the application.
        </Typography>
      </Alert>

      <Paper>
        <Tabs
          value={tabIndex}
          onChange={(_, newValue) => setTabIndex(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {CATEGORIES.map((category, index) => (
            <Tab
              key={category.key}
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <span>{category.icon}</span>
                  <span>{category.label}</span>
                  {configurations[category.key] && (
                    <Chip
                      label={configurations[category.key].length}
                      size="small"
                      color="primary"
                    />
                  )}
                </Box>
              }
            />
          ))}
        </Tabs>

        {CATEGORIES.map((category, index) => (
          <TabPanel value={tabIndex} index={index} key={category.key}>
            {category.type === 'advanced' ? (
              <>
                {category.key === 'LEAVE_TYPES' && (
                  <LeaveTypeConfigurationManager onRefresh={fetchConfigurations} />
                )}
                {category.key === 'DASHBOARDS' && (
                  <DashboardWidgetConfigurationManager onRefresh={fetchConfigurations} />
                )}
                {category.key === 'BULK_ACTIONS' && (
                  <BulkActionsConfigurationManager onRefresh={fetchConfigurations} />
                )}
                {category.key === 'WORKFLOWS' && (
                  <WorkflowConfigurationManager onRefresh={fetchConfigurations} />
                )}
                {category.key === 'LEAVE_DURATION' && (
                  <LeaveDurationConfigurationManager onRefresh={fetchConfigurations} />
                )}
                {category.key === 'TEAM_CALENDAR' && (
                  <TeamCalendarConfigurationManager onRefresh={fetchConfigurations} />
                )}
              </>
            ) : (
              <>
                {loading ? (
                  <Box>
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} height={60} sx={{ my: 1 }} />
                    ))}
                  </Box>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell width="50px">#</TableCell>
                          <TableCell>Value</TableCell>
                          <TableCell>Display Name</TableCell>
                          <TableCell align="center">Status</TableCell>
                          <TableCell align="center">Order</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {currentConfigs.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} align="center">
                              <Alert severity="info">
                                No {category.label.toLowerCase()} configured yet. Click "Add New" to create one.
                              </Alert>
                            </TableCell>
                          </TableRow>
                        ) : (
                          currentConfigs
                            .sort((a, b) => a.sortOrder - b.sortOrder)
                            .map((config, idx) => (
                              <TableRow key={config.id} hover>
                                <TableCell>{idx + 1}</TableCell>
                                <TableCell>
                                  <Typography variant="body2" fontFamily="monospace">
                                    {config.value}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">{config.displayName}</Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Chip
                                    label={config.isActive ? 'Active' : 'Inactive'}
                                    color={config.isActive ? 'success' : 'default'}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  <Box display="flex" justifyContent="center" gap={0.5}>
                                    <Tooltip title="Move up">
                                      <span>
                                        <IconButton
                                          size="small"
                                          onClick={() => handleReorder(config, 'up')}
                                          disabled={idx === 0}
                                        >
                                          <ArrowUpward fontSize="small" />
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                    <Tooltip title="Move down">
                                      <span>
                                        <IconButton
                                          size="small"
                                          onClick={() => handleReorder(config, 'down')}
                                          disabled={idx === currentConfigs.length - 1}
                                        >
                                          <ArrowDownward fontSize="small" />
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                  </Box>
                                </TableCell>
                                <TableCell align="right">
                                  <Tooltip title={config.isActive ? 'Deactivate' : 'Activate'}>
                                    <Switch
                                      checked={config.isActive}
                                      onChange={() => handleToggleActive(config)}
                                      size="small"
                                    />
                                  </Tooltip>
                                  <Tooltip title="Edit">
                                    <IconButton size="small" onClick={() => handleEdit(config)}>
                                      <Edit fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDelete(config.id)}
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
                )}
              </>
            )}
          </TabPanel>
        ))}
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingConfig ? `Edit ${currentCategory.label}` : `Add New ${currentCategory.label}`}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Value"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                disabled={!!editingConfig}
                helperText="Internal value (usually uppercase, no spaces)"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Display Name"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                helperText="User-friendly name shown in the UI"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Sort Order"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                helperText="Lower numbers appear first"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} startIcon={<Cancel />}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            startIcon={<Save />}
          >
            {editingConfig ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ConfigurationsPage
