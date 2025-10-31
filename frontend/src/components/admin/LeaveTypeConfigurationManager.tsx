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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  Save,
  Cancel,
  ExpandMore
} from '@mui/icons-material'
import { toast } from 'react-hot-toast'
import api from '@/config/api'

interface LeaveTypeConfiguration {
  id: string
  leaveTypeCode: string
  displayName: string
  description: string
  maxDaysAllowed: number
  minDaysAllowed: number
  requiresApproval: boolean
  allowHalfDay: boolean
  allowQuarterDay: boolean
  prorateAccrual: boolean
  carryForwardAllowed: boolean
  maxCarryForward: number | null
  encashmentAllowed: boolean
  maxEncashmentDays: number | null
  gender: string | null
  region: string | null
  colorCode: string
  icon: string | null
  isActive: boolean
  sortOrder: number
  eligibilityCriteria: any | null
  createdAt: string
  updatedAt: string
}

interface Props {
  onRefresh?: () => void
}

const LeaveTypeConfigurationManager: React.FC<Props> = ({ onRefresh }) => {
  const [configurations, setConfigurations] = useState<LeaveTypeConfiguration[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<LeaveTypeConfiguration | null>(null)
  const [formData, setFormData] = useState<Partial<LeaveTypeConfiguration>>({
    leaveTypeCode: '',
    displayName: '',
    description: '',
    maxDaysAllowed: 20,
    minDaysAllowed: 0.5,
    requiresApproval: true,
    allowHalfDay: true,
    allowQuarterDay: false,
    prorateAccrual: true,
    carryForwardAllowed: false,
    maxCarryForward: null,
    encashmentAllowed: false,
    maxEncashmentDays: null,
    gender: null,
    region: null,
    colorCode: '#1976d2',
    icon: null,
    isActive: true,
    sortOrder: 0
  })

  useEffect(() => {
    fetchConfigurations()
  }, [])

  const fetchConfigurations = async () => {
    try {
      setLoading(true)
      const response = await api.get('/leave-type-configurations?activeOnly=false')
      if (response.data.success) {
        setConfigurations(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching leave type configurations:', error)
      toast.error('Failed to fetch leave type configurations')
    } finally {
      setLoading(false)
    }
  }

  const handleAddNew = () => {
    setEditingConfig(null)
    setFormData({
      leaveTypeCode: '',
      displayName: '',
      description: '',
      maxDaysAllowed: 20,
      minDaysAllowed: 0.5,
      requiresApproval: true,
      allowHalfDay: true,
      allowQuarterDay: false,
      prorateAccrual: true,
      carryForwardAllowed: false,
      maxCarryForward: null,
      encashmentAllowed: false,
      maxEncashmentDays: null,
      gender: null,
      region: null,
      colorCode: '#1976d2',
      icon: null,
      isActive: true,
      sortOrder: configurations.length + 1
    })
    setDialogOpen(true)
  }

  const handleEdit = (config: LeaveTypeConfiguration) => {
    setEditingConfig(config)
    setFormData(config)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      if (!formData.leaveTypeCode || !formData.displayName) {
        toast.error('Leave Type Code and Display Name are required')
        return
      }

      if (editingConfig) {
        await api.patch(`/leave-type-configurations/${editingConfig.id}`, formData)
        toast.success('Leave type configuration updated successfully')
      } else {
        await api.post('/leave-type-configurations', formData)
        toast.success('Leave type configuration created successfully')
      }

      setDialogOpen(false)
      fetchConfigurations()
      onRefresh?.()
    } catch (error: any) {
      console.error('Error saving leave type configuration:', error)
      toast.error(error.response?.data?.message || 'Failed to save configuration')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this leave type configuration?')) {
      return
    }

    try {
      await api.delete(`/leave-type-configurations/${id}`)
      toast.success('Leave type configuration deleted successfully')
      fetchConfigurations()
      onRefresh?.()
    } catch (error) {
      console.error('Error deleting leave type configuration:', error)
      toast.error('Failed to delete configuration')
    }
  }

  const handleToggleActive = async (config: LeaveTypeConfiguration) => {
    try {
      await api.patch(`/leave-type-configurations/${config.id}`, {
        isActive: !config.isActive
      })
      toast.success(`Leave type ${!config.isActive ? 'activated' : 'deactivated'}`)
      fetchConfigurations()
      onRefresh?.()
    } catch (error) {
      console.error('Error toggling leave type:', error)
      toast.error('Failed to update configuration')
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
        <Typography variant="h6">Leave Type Configurations</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleAddNew}>
          Add Leave Type
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        Configure leave types with rules for accrual, carry-forward, encashment, and eligibility.
      </Alert>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell align="center">Max Days</TableCell>
              <TableCell align="center">Half Day</TableCell>
              <TableCell align="center">Carry Forward</TableCell>
              <TableCell align="center">Encashment</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {configurations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Alert severity="info">No leave types configured yet. Click "Add Leave Type" to create one.</Alert>
                </TableCell>
              </TableRow>
            ) : (
              configurations
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((config) => (
                  <TableRow key={config.id} hover>
                    <TableCell>
                      <Chip
                        label={config.leaveTypeCode}
                        size="small"
                        sx={{ bgcolor: config.colorCode, color: 'white' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">{config.displayName}</Typography>
                      <Typography variant="caption" color="text.secondary">{config.description}</Typography>
                    </TableCell>
                    <TableCell align="center">{config.maxDaysAllowed}</TableCell>
                    <TableCell align="center">
                      {config.allowHalfDay ? '✓' : '✗'}
                    </TableCell>
                    <TableCell align="center">
                      {config.carryForwardAllowed ? `✓ (${config.maxCarryForward || 'Unlimited'})` : '✗'}
                    </TableCell>
                    <TableCell align="center">
                      {config.encashmentAllowed ? `✓ (${config.maxEncashmentDays || 'Unlimited'})` : '✗'}
                    </TableCell>
                    <TableCell align="center">
                      <Switch
                        checked={config.isActive}
                        onChange={() => handleToggleActive(config)}
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
          {editingConfig ? 'Edit Leave Type Configuration' : 'Add New Leave Type Configuration'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Basic Information
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Leave Type Code"
                value={formData.leaveTypeCode}
                onChange={(e) => setFormData({ ...formData, leaveTypeCode: e.target.value.toUpperCase() })}
                disabled={!!editingConfig}
                required
                helperText="e.g., CL, PL, SL"
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
              <TextField
                fullWidth
                type="color"
                label="Color Code"
                value={formData.colorCode}
                onChange={(e) => setFormData({ ...formData, colorCode: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Sort Order"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
              />
            </Grid>

            {/* Leave Limits */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom sx={{ mt: 2 }}>
                Leave Limits
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Days Allowed"
                value={formData.maxDaysAllowed}
                onChange={(e) => setFormData({ ...formData, maxDaysAllowed: parseFloat(e.target.value) })}
                inputProps={{ step: 0.5 }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Min Days Allowed"
                value={formData.minDaysAllowed}
                onChange={(e) => setFormData({ ...formData, minDaysAllowed: parseFloat(e.target.value) })}
                inputProps={{ step: 0.25 }}
              />
            </Grid>

            {/* Leave Options */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom sx={{ mt: 2 }}>
                Leave Options
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <label>
                  <Switch
                    checked={formData.requiresApproval || false}
                    onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
                  />
                  Requires Approval
                </label>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <label>
                  <Switch
                    checked={formData.allowHalfDay || false}
                    onChange={(e) => setFormData({ ...formData, allowHalfDay: e.target.checked })}
                  />
                  Allow Half Day
                </label>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <label>
                  <Switch
                    checked={formData.allowQuarterDay || false}
                    onChange={(e) => setFormData({ ...formData, allowQuarterDay: e.target.checked })}
                  />
                  Allow Quarter Day
                </label>
              </FormControl>
            </Grid>

            {/* Carry Forward */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom sx={{ mt: 2 }}>
                Carry Forward & Encashment
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <label>
                  <Switch
                    checked={formData.carryForwardAllowed || false}
                    onChange={(e) => setFormData({ ...formData, carryForwardAllowed: e.target.checked })}
                  />
                  Allow Carry Forward
                </label>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Carry Forward Days"
                value={formData.maxCarryForward || ''}
                onChange={(e) => setFormData({ ...formData, maxCarryForward: e.target.value ? parseInt(e.target.value) : null })}
                disabled={!formData.carryForwardAllowed}
                helperText="Leave empty for unlimited"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <label>
                  <Switch
                    checked={formData.encashmentAllowed || false}
                    onChange={(e) => setFormData({ ...formData, encashmentAllowed: e.target.checked })}
                  />
                  Allow Encashment
                </label>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Encashment Days"
                value={formData.maxEncashmentDays || ''}
                onChange={(e) => setFormData({ ...formData, maxEncashmentDays: e.target.value ? parseInt(e.target.value) : null })}
                disabled={!formData.encashmentAllowed}
                helperText="Leave empty for unlimited"
              />
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

export default LeaveTypeConfigurationManager
