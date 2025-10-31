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
  FlashOn
} from '@mui/icons-material'
import { toast } from 'react-hot-toast'
import api from '@/config/api'

interface BulkActionConfiguration {
  id: string
  actionType: string
  enabled: boolean
  allowedRoles: string[]
  maxItemsPerAction: number
  requiresConfirmation: boolean
  requiresReason: boolean
  validationRules: any
  confirmationConfig: any
  auditConfig: any
  executionMode: string
  batchSize: number
  timeoutSeconds: number
  allowRollback: boolean
  rollbackWindowMinutes: number
  createdAt: string
  updatedAt: string
}

interface Props {
  onRefresh?: () => void
}

const ACTION_TYPES = [
  { value: 'APPROVE', label: 'Approve', color: 'success' },
  { value: 'REJECT', label: 'Reject', color: 'error' },
  { value: 'CANCEL', label: 'Cancel', color: 'warning' },
  { value: 'EXPORT', label: 'Export', color: 'info' },
  { value: 'EMAIL', label: 'Email', color: 'secondary' },
  { value: 'STATUS_UPDATE', label: 'Status Update', color: 'primary' }
]

const EXECUTION_MODES = [
  { value: 'SYNCHRONOUS', label: 'Synchronous' },
  { value: 'ASYNCHRONOUS', label: 'Asynchronous' },
  { value: 'BATCHED', label: 'Batched' }
]

const BulkActionsConfigurationManager: React.FC<Props> = ({ onRefresh }) => {
  const [configurations, setConfigurations] = useState<BulkActionConfiguration[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<BulkActionConfiguration | null>(null)
  const [formData, setFormData] = useState<Partial<BulkActionConfiguration>>({
    actionType: 'APPROVE',
    enabled: true,
    allowedRoles: ['MANAGER', 'HR_ADMIN', 'HR'],
    maxItemsPerAction: 100,
    requiresConfirmation: true,
    requiresReason: false,
    executionMode: 'SYNCHRONOUS',
    batchSize: 50,
    timeoutSeconds: 300,
    allowRollback: false,
    rollbackWindowMinutes: 60
  })

  useEffect(() => {
    fetchConfigurations()
  }, [])

  const fetchConfigurations = async () => {
    try {
      setLoading(true)
      const response = await api.get('/bulk-action-configurations')
      if (response.data.success) {
        setConfigurations(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching bulk action configurations:', error)
      toast.error('Failed to fetch bulk action configurations')
    } finally {
      setLoading(false)
    }
  }

  const handleAddNew = () => {
    setEditingConfig(null)
    setFormData({
      actionType: 'APPROVE',
      enabled: true,
      allowedRoles: ['MANAGER', 'HR_ADMIN', 'HR'],
      maxItemsPerAction: 100,
      requiresConfirmation: true,
      requiresReason: false,
      executionMode: 'SYNCHRONOUS',
      batchSize: 50,
      timeoutSeconds: 300,
      allowRollback: false,
      rollbackWindowMinutes: 60,
      auditConfig: {
        logLevel: 'DETAILED',
        captureBeforeState: true,
        captureAfterState: true,
        notifyOnCompletion: true
      }
    })
    setDialogOpen(true)
  }

  const handleEdit = (config: BulkActionConfiguration) => {
    setEditingConfig(config)
    setFormData(config)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      if (!formData.actionType) {
        toast.error('Action Type is required')
        return
      }

      if (editingConfig) {
        await api.patch(`/bulk-action-configurations/${editingConfig.id}`, formData)
        toast.success('Bulk action configuration updated successfully')
      } else {
        await api.post('/bulk-action-configurations', formData)
        toast.success('Bulk action configuration created successfully')
      }

      setDialogOpen(false)
      fetchConfigurations()
      onRefresh?.()
    } catch (error: any) {
      console.error('Error saving bulk action configuration:', error)
      toast.error(error.response?.data?.message || 'Failed to save configuration')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bulk action configuration?')) {
      return
    }

    try {
      await api.delete(`/bulk-action-configurations/${id}`)
      toast.success('Bulk action configuration deleted successfully')
      fetchConfigurations()
      onRefresh?.()
    } catch (error) {
      console.error('Error deleting bulk action configuration:', error)
      toast.error('Failed to delete configuration')
    }
  }

  const handleToggleEnabled = async (config: BulkActionConfiguration) => {
    try {
      await api.patch(`/bulk-action-configurations/${config.id}/toggle`)
      toast.success(`Bulk action ${!config.enabled ? 'enabled' : 'disabled'}`)
      fetchConfigurations()
      onRefresh?.()
    } catch (error) {
      console.error('Error toggling bulk action:', error)
      toast.error('Failed to update configuration')
    }
  }

  const getActionTypeColor = (actionType: string) => {
    const action = ACTION_TYPES.find(a => a.value === actionType)
    return action?.color || 'default'
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
        <Typography variant="h6">Bulk Actions Configurations</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleAddNew}>
          Add Bulk Action
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        Configure bulk actions for approving, rejecting, or processing multiple items at once. Set limits, validation rules, and execution modes.
      </Alert>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Action Type</TableCell>
              <TableCell align="center">Max Items</TableCell>
              <TableCell align="center">Confirmation</TableCell>
              <TableCell align="center">Reason Required</TableCell>
              <TableCell>Execution Mode</TableCell>
              <TableCell align="center">Roles</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {configurations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Alert severity="info">No bulk actions configured yet. Click "Add Bulk Action" to create one.</Alert>
                </TableCell>
              </TableRow>
            ) : (
              configurations.map((config) => (
                <TableRow key={config.id} hover>
                  <TableCell>
                    <Chip
                      label={config.actionType}
                      color={getActionTypeColor(config.actionType) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">{config.maxItemsPerAction}</TableCell>
                  <TableCell align="center">
                    {config.requiresConfirmation ? '✓' : '✗'}
                  </TableCell>
                  <TableCell align="center">
                    {config.requiresReason ? '✓' : '✗'}
                  </TableCell>
                  <TableCell>
                    <Chip label={config.executionMode} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={`${config.allowedRoles?.length || 0} roles`} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                    <Switch
                      checked={config.enabled}
                      onChange={() => handleToggleEnabled(config)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingConfig ? 'Edit Bulk Action Configuration' : 'Add New Bulk Action Configuration'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Action Type</InputLabel>
                <Select
                  value={formData.actionType}
                  label="Action Type"
                  onChange={(e) => setFormData({ ...formData, actionType: e.target.value })}
                  disabled={!!editingConfig}
                >
                  {ACTION_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Execution Mode</InputLabel>
                <Select
                  value={formData.executionMode}
                  label="Execution Mode"
                  onChange={(e) => setFormData({ ...formData, executionMode: e.target.value })}
                >
                  {EXECUTION_MODES.map((mode) => (
                    <MenuItem key={mode.value} value={mode.value}>
                      {mode.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Items Per Action"
                value={formData.maxItemsPerAction}
                onChange={(e) => setFormData({ ...formData, maxItemsPerAction: parseInt(e.target.value) })}
                helperText="Maximum items that can be processed at once"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Batch Size"
                value={formData.batchSize}
                onChange={(e) => setFormData({ ...formData, batchSize: parseInt(e.target.value) })}
                helperText="Items per batch (for BATCHED mode)"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Timeout (seconds)"
                value={formData.timeoutSeconds}
                onChange={(e) => setFormData({ ...formData, timeoutSeconds: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Rollback Window (minutes)"
                value={formData.rollbackWindowMinutes}
                onChange={(e) => setFormData({ ...formData, rollbackWindowMinutes: parseInt(e.target.value) })}
                disabled={!formData.allowRollback}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <label>
                  <Switch
                    checked={formData.requiresConfirmation || false}
                    onChange={(e) => setFormData({ ...formData, requiresConfirmation: e.target.checked })}
                  />
                  Requires Confirmation
                </label>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <label>
                  <Switch
                    checked={formData.requiresReason || false}
                    onChange={(e) => setFormData({ ...formData, requiresReason: e.target.checked })}
                  />
                  Requires Reason
                </label>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <label>
                  <Switch
                    checked={formData.allowRollback || false}
                    onChange={(e) => setFormData({ ...formData, allowRollback: e.target.checked })}
                  />
                  Allow Rollback
                </label>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} startIcon={<Cancel />}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} startIcon={<Save />}>
            {editingConfig ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default BulkActionsConfigurationManager
