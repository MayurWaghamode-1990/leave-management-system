import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Fab,
  LinearProgress,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  Visibility,
  CheckCircle,
  Cancel,
  Schedule,
  ExpandMore,
  Policy,
  AccessTime,
  CalendarMonth,
  AttachMoney,
  Work,
  Info,
  Warning,
  Refresh
} from '@mui/icons-material'
import toast from 'react-hot-toast'
import api from '@/config/api'
import { LeaveType } from '@/types'
import { useAuth } from '@/hooks/useAuth'

interface LeaveTypeConfig {
  id: string
  type: LeaveType
  name: string
  description: string
  isActive: boolean
  entitlementDays: number
  maxConsecutiveDays?: number
  maxCarryForward?: number
  carryForwardExpiryMonths?: number
  accrualRate?: number
  requiresDocumentation: boolean
  documentationThreshold?: number
  encashmentAllowed: boolean
  encashmentMaxDays?: number
  probationApplicable: boolean
  minimumServiceMonths?: number
  advanceBookingDays?: number
  maxAdvanceApplicationDays?: number
  applicableGender?: 'MALE' | 'FEMALE' | 'ALL'
  isOptional: boolean
  conditions: string[]
  restrictions: string[]
  createdAt: string
  updatedAt: string
}

interface LeaveTypeForm {
  type: LeaveType | ''
  name: string
  description: string
  isActive: boolean
  entitlementDays: number
  maxConsecutiveDays: number
  maxCarryForward: number
  carryForwardExpiryMonths: number
  accrualRate: number
  requiresDocumentation: boolean
  documentationThreshold: number
  encashmentAllowed: boolean
  encashmentMaxDays: number
  probationApplicable: boolean
  minimumServiceMonths: number
  advanceBookingDays: number
  maxAdvanceApplicationDays: number
  applicableGender: 'MALE' | 'FEMALE' | 'ALL'
  isOptional: boolean
  conditions: string[]
  restrictions: string[]
}

const initialFormState: LeaveTypeForm = {
  type: '',
  name: '',
  description: '',
  isActive: true,
  entitlementDays: 0,
  maxConsecutiveDays: 0,
  maxCarryForward: 0,
  carryForwardExpiryMonths: 12,
  accrualRate: 0,
  requiresDocumentation: false,
  documentationThreshold: 1,
  encashmentAllowed: false,
  encashmentMaxDays: 0,
  probationApplicable: true,
  minimumServiceMonths: 0,
  advanceBookingDays: 0,
  maxAdvanceApplicationDays: 30,
  applicableGender: 'ALL',
  isOptional: false,
  conditions: [],
  restrictions: []
}

const LeaveTypesPage: React.FC = () => {
  const { user } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<LeaveTypeConfig | null>(null)
  const [formData, setFormData] = useState<LeaveTypeForm>(initialFormState)
  const [conditionInput, setConditionInput] = useState('')
  const [restrictionInput, setRestrictionInput] = useState('')

  useEffect(() => {
    fetchLeaveTypes()
  }, [])

  const fetchLeaveTypes = async () => {
    try {
      setLoading(true)
      const response = await api.get('/policies/leave-types')
      setLeaveTypes(response.data.data)
    } catch (error) {
      console.error('Error fetching leave types:', error)
      toast.error('Failed to load leave types')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (leaveType?: LeaveTypeConfig) => {
    if (leaveType) {
      setEditingType(leaveType)
      setFormData({
        type: leaveType.type,
        name: leaveType.name,
        description: leaveType.description,
        isActive: leaveType.isActive,
        entitlementDays: leaveType.entitlementDays,
        maxConsecutiveDays: leaveType.maxConsecutiveDays || 0,
        maxCarryForward: leaveType.maxCarryForward || 0,
        carryForwardExpiryMonths: leaveType.carryForwardExpiryMonths || 12,
        accrualRate: leaveType.accrualRate || 0,
        requiresDocumentation: leaveType.requiresDocumentation,
        documentationThreshold: leaveType.documentationThreshold || 1,
        encashmentAllowed: leaveType.encashmentAllowed,
        encashmentMaxDays: leaveType.encashmentMaxDays || 0,
        probationApplicable: leaveType.probationApplicable,
        minimumServiceMonths: leaveType.minimumServiceMonths || 0,
        advanceBookingDays: leaveType.advanceBookingDays || 0,
        maxAdvanceApplicationDays: leaveType.maxAdvanceApplicationDays || 30,
        applicableGender: leaveType.applicableGender || 'ALL',
        isOptional: leaveType.isOptional,
        conditions: [...leaveType.conditions],
        restrictions: [...leaveType.restrictions]
      })
    } else {
      setEditingType(null)
      setFormData(initialFormState)
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingType(null)
    setFormData(initialFormState)
    setConditionInput('')
    setRestrictionInput('')
  }

  const handleSubmit = async () => {
    try {
      if (!formData.type || !formData.name) {
        toast.error('Please fill in all required fields')
        return
      }

      const payload = {
        ...formData,
        leaveType: formData.type
      }

      if (editingType) {
        await api.put(`/policies/leave-types/${editingType.id}`, payload)
        toast.success('Leave type updated successfully')
      } else {
        await api.post('/policies/leave-types', payload)
        toast.success('Leave type created successfully')
      }

      fetchLeaveTypes()
      handleCloseDialog()
    } catch (error: any) {
      console.error('Error saving leave type:', error)
      toast.error(error.response?.data?.message || 'Failed to save leave type')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this leave type?')) {
      return
    }

    try {
      await api.delete(`/policies/leave-types/${id}`)
      toast.success('Leave type deleted successfully')
      fetchLeaveTypes()
    } catch (error: any) {
      console.error('Error deleting leave type:', error)
      toast.error(error.response?.data?.message || 'Failed to delete leave type')
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await api.patch(`/policies/leave-types/${id}/toggle`, { isActive })
      toast.success(`Leave type ${isActive ? 'activated' : 'deactivated'} successfully`)
      fetchLeaveTypes()
    } catch (error: any) {
      console.error('Error toggling leave type:', error)
      toast.error(error.response?.data?.message || 'Failed to update leave type')
    }
  }

  const addCondition = () => {
    if (conditionInput.trim()) {
      setFormData(prev => ({
        ...prev,
        conditions: [...prev.conditions, conditionInput.trim()]
      }))
      setConditionInput('')
    }
  }

  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }))
  }

  const addRestriction = () => {
    if (restrictionInput.trim()) {
      setFormData(prev => ({
        ...prev,
        restrictions: [...prev.restrictions, restrictionInput.trim()]
      }))
      setRestrictionInput('')
    }
  }

  const removeRestriction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      restrictions: prev.restrictions.filter((_, i) => i !== index)
    }))
  }

  const getLeaveTypeIcon = (type: LeaveType) => {
    switch (type) {
      case LeaveType.SICK_LEAVE:
        return <Policy color="error" />
      case LeaveType.CASUAL_LEAVE:
        return <Schedule color="info" />
      case LeaveType.EARNED_LEAVE:
        return <CalendarMonth color="success" />
      case LeaveType.MATERNITY_LEAVE:
      case LeaveType.PATERNITY_LEAVE:
        return <Work color="warning" />
      case LeaveType.COMPENSATORY_OFF:
        return <AccessTime color="secondary" />
      default:
        return <Policy color="primary" />
    }
  }

  const availableLeaveTypes = Object.values(LeaveType).filter(type =>
    !leaveTypes.some(lt => lt.type === type)
  )

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Leave Types Management
        </Typography>
        <LinearProgress />
      </Box>
    )
  }

  // Check if user has permission to manage leave types
  const canManage = user?.role === 'HR_ADMIN' || user?.role === 'ADMIN'

  if (!canManage) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Leave Types Management
        </Typography>
        <Alert severity="warning">
          You don't have permission to manage leave types. Contact your HR administrator.
        </Alert>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Leave Types Management
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Configure and manage different types of leaves in your organization
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchLeaveTypes}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            disabled={availableLeaveTypes.length === 0}
          >
            Add Leave Type
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Policy color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {leaveTypes.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Types
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <CheckCircle color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {leaveTypes.filter(lt => lt.isActive).length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Active Types
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <AttachMoney color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {leaveTypes.filter(lt => lt.encashmentAllowed).length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Encashable
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Info color="info" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {availableLeaveTypes.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Available to Add
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Leave Types List */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Configured Leave Types
          </Typography>

          {leaveTypes.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Policy sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No leave types configured
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Start by adding your first leave type to the system
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenDialog()}
              >
                Add First Leave Type
              </Button>
            </Box>
          ) : (
            <Box>
              {leaveTypes.map((leaveType) => (
                <Accordion key={leaveType.id} sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box display="flex" alignItems="center" gap={2} width="100%">
                      {getLeaveTypeIcon(leaveType.type)}
                      <Box flex={1}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {leaveType.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {leaveType.entitlementDays} days/year • {leaveType.type.replace('_', ' ')}
                        </Typography>
                      </Box>
                      <Box display="flex" gap={1} alignItems="center">
                        <Chip
                          label={leaveType.isActive ? 'Active' : 'Inactive'}
                          color={leaveType.isActive ? 'success' : 'default'}
                          size="small"
                        />
                        {leaveType.encashmentAllowed && (
                          <Chip
                            label="Encashable"
                            color="warning"
                            size="small"
                            variant="outlined"
                          />
                        )}
                        {leaveType.isOptional && (
                          <Chip
                            label="Optional"
                            color="info"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>
                          Basic Information
                        </Typography>
                        <List dense>
                          <ListItem>
                            <ListItemText
                              primary="Description"
                              secondary={leaveType.description || 'No description provided'}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText
                              primary="Annual Entitlement"
                              secondary={`${leaveType.entitlementDays} days`}
                            />
                          </ListItem>
                          {leaveType.maxConsecutiveDays && (
                            <ListItem>
                              <ListItemText
                                primary="Max Consecutive Days"
                                secondary={`${leaveType.maxConsecutiveDays} days`}
                              />
                            </ListItem>
                          )}
                          {leaveType.maxCarryForward && (
                            <ListItem>
                              <ListItemText
                                primary="Carry Forward Limit"
                                secondary={`${leaveType.maxCarryForward} days`}
                              />
                            </ListItem>
                          )}
                        </List>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>
                          Policies & Rules
                        </Typography>
                        <List dense>
                          <ListItem>
                            <ListItemText
                              primary="Documentation Required"
                              secondary={leaveType.requiresDocumentation ?
                                `Yes (for ${leaveType.documentationThreshold}+ days)` : 'No'}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText
                              primary="Probation Applicable"
                              secondary={leaveType.probationApplicable ? 'Yes' : 'No'}
                            />
                          </ListItem>
                          {leaveType.minimumServiceMonths && (
                            <ListItem>
                              <ListItemText
                                primary="Minimum Service"
                                secondary={`${leaveType.minimumServiceMonths} months`}
                              />
                            </ListItem>
                          )}
                          {leaveType.advanceBookingDays && (
                            <ListItem>
                              <ListItemText
                                primary="Advance Booking"
                                secondary={`${leaveType.advanceBookingDays} days notice`}
                              />
                            </ListItem>
                          )}
                        </List>
                      </Grid>

                      {(leaveType.conditions.length > 0 || leaveType.restrictions.length > 0) && (
                        <Grid item xs={12}>
                          <Divider sx={{ my: 2 }} />
                          {leaveType.conditions.length > 0 && (
                            <Box mb={2}>
                              <Typography variant="subtitle2" gutterBottom>
                                Conditions
                              </Typography>
                              {leaveType.conditions.map((condition, index) => (
                                <Chip
                                  key={index}
                                  label={condition}
                                  size="small"
                                  color="info"
                                  variant="outlined"
                                  sx={{ mr: 1, mb: 1 }}
                                />
                              ))}
                            </Box>
                          )}
                          {leaveType.restrictions.length > 0 && (
                            <Box>
                              <Typography variant="subtitle2" gutterBottom>
                                Restrictions
                              </Typography>
                              {leaveType.restrictions.map((restriction, index) => (
                                <Chip
                                  key={index}
                                  label={restriction}
                                  size="small"
                                  color="warning"
                                  variant="outlined"
                                  sx={{ mr: 1, mb: 1 }}
                                />
                              ))}
                            </Box>
                          )}
                        </Grid>
                      )}

                      <Grid item xs={12}>
                        <Divider sx={{ my: 2 }} />
                        <Box display="flex" gap={1} justifyContent="flex-end">
                          <FormControlLabel
                            control={
                              <Switch
                                checked={leaveType.isActive}
                                onChange={(e) => handleToggleActive(leaveType.id, e.target.checked)}
                              />
                            }
                            label={leaveType.isActive ? 'Active' : 'Inactive'}
                          />
                          <Button
                            startIcon={<Edit />}
                            onClick={() => handleOpenDialog(leaveType)}
                          >
                            Edit
                          </Button>
                          <Button
                            startIcon={<Delete />}
                            color="error"
                            onClick={() => handleDelete(leaveType.id)}
                          >
                            Delete
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          {editingType ? 'Edit Leave Type' : 'Add New Leave Type'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Leave Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Leave Type"
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as LeaveType }))}
                  disabled={!!editingType}
                >
                  {editingType ? (
                    <MenuItem value={editingType.type}>
                      {editingType.type.replace('_', ' ')}
                    </MenuItem>
                  ) : (
                    availableLeaveTypes.map(type => (
                      <MenuItem key={type} value={type}>
                        {type.replace('_', ' ')}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Display Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                multiline
                rows={2}
              />
            </Grid>

            {/* Entitlement & Limits */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Entitlement & Limits
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Annual Entitlement (days)"
                type="number"
                value={formData.entitlementDays}
                onChange={(e) => setFormData(prev => ({ ...prev, entitlementDays: Number(e.target.value) }))}
                required
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Max Consecutive Days"
                type="number"
                value={formData.maxConsecutiveDays}
                onChange={(e) => setFormData(prev => ({ ...prev, maxConsecutiveDays: Number(e.target.value) }))}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Max Carry Forward"
                type="number"
                value={formData.maxCarryForward}
                onChange={(e) => setFormData(prev => ({ ...prev, maxCarryForward: Number(e.target.value) }))}
              />
            </Grid>

            {/* Policies */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Policies & Rules
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.requiresDocumentation}
                    onChange={(e) => setFormData(prev => ({ ...prev, requiresDocumentation: e.target.checked }))}
                  />
                }
                label="Requires Documentation"
              />
              {formData.requiresDocumentation && (
                <TextField
                  fullWidth
                  label="Documentation Threshold (days)"
                  type="number"
                  value={formData.documentationThreshold}
                  onChange={(e) => setFormData(prev => ({ ...prev, documentationThreshold: Number(e.target.value) }))}
                  sx={{ mt: 1 }}
                />
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.encashmentAllowed}
                    onChange={(e) => setFormData(prev => ({ ...prev, encashmentAllowed: e.target.checked }))}
                  />
                }
                label="Encashment Allowed"
              />
              {formData.encashmentAllowed && (
                <TextField
                  fullWidth
                  label="Max Encashment Days"
                  type="number"
                  value={formData.encashmentMaxDays}
                  onChange={(e) => setFormData(prev => ({ ...prev, encashmentMaxDays: Number(e.target.value) }))}
                  sx={{ mt: 1 }}
                />
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.probationApplicable}
                    onChange={(e) => setFormData(prev => ({ ...prev, probationApplicable: e.target.checked }))}
                  />
                }
                label="Applicable During Probation"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isOptional}
                    onChange={(e) => setFormData(prev => ({ ...prev, isOptional: e.target.checked }))}
                  />
                }
                label="Optional Holiday"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Minimum Service (months)"
                type="number"
                value={formData.minimumServiceMonths}
                onChange={(e) => setFormData(prev => ({ ...prev, minimumServiceMonths: Number(e.target.value) }))}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Advance Booking (days)"
                type="number"
                value={formData.advanceBookingDays}
                onChange={(e) => setFormData(prev => ({ ...prev, advanceBookingDays: Number(e.target.value) }))}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Applicable Gender</InputLabel>
                <Select
                  value={formData.applicableGender}
                  label="Applicable Gender"
                  onChange={(e) => setFormData(prev => ({ ...prev, applicableGender: e.target.value as 'MALE' | 'FEMALE' | 'ALL' }))}
                >
                  <MenuItem value="ALL">All</MenuItem>
                  <MenuItem value="MALE">Male Only</MenuItem>
                  <MenuItem value="FEMALE">Female Only</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Conditions & Restrictions */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Conditions & Restrictions
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Conditions
              </Typography>
              <Box display="flex" gap={1} mb={2}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Add condition..."
                  value={conditionInput}
                  onChange={(e) => setConditionInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCondition()}
                />
                <Button variant="outlined" onClick={addCondition}>
                  Add
                </Button>
              </Box>
              <Box>
                {formData.conditions.map((condition, index) => (
                  <Chip
                    key={index}
                    label={condition}
                    onDelete={() => removeCondition(index)}
                    color="info"
                    variant="outlined"
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Restrictions
              </Typography>
              <Box display="flex" gap={1} mb={2}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Add restriction..."
                  value={restrictionInput}
                  onChange={(e) => setRestrictionInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addRestriction()}
                />
                <Button variant="outlined" onClick={addRestriction}>
                  Add
                </Button>
              </Box>
              <Box>
                {formData.restrictions.map((restriction, index) => (
                  <Chip
                    key={index}
                    label={restriction}
                    onDelete={() => removeRestriction(index)}
                    color="warning"
                    variant="outlined"
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingType ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default LeaveTypesPage