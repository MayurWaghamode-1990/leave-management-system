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
  AccordionDetails
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  Save,
  Cancel,
  AccountTree,
  ExpandMore
} from '@mui/icons-material'
import { toast } from 'react-hot-toast'
import api from '@/config/api'

interface WorkflowStep {
  level: number
  approverRole: string
  executionMode: 'SEQUENTIAL' | 'PARALLEL'
  autoApproveAfterHours?: number
  escalateAfterHours?: number
  escalateTo?: string
  isOptional: boolean
}

interface WorkflowConfiguration {
  id: string
  workflowType: string
  name: string
  description: string
  isDefault: boolean
  priority: number
  conditions: any
  steps: WorkflowStep[]
  autoApprovalRules: any
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Props {
  onRefresh?: () => void
}

const WORKFLOW_TYPES = [
  { value: 'LEAVE_REQUEST', label: 'Leave Request', icon: '🏖️' },
  { value: 'COMP_OFF_REQUEST', label: 'Comp Off Request', icon: '⏰' },
  { value: 'LWP_REQUEST', label: 'LWP Request', icon: '📝' }
]

const APPROVER_ROLES = [
  { value: 'REPORTING_MANAGER', label: 'Reporting Manager' },
  { value: 'SECOND_LEVEL_MANAGER', label: 'Second Level Manager' },
  { value: 'DEPARTMENT_HEAD', label: 'Department Head' },
  { value: 'HR', label: 'HR' },
  { value: 'HR_ADMIN', label: 'HR Admin' },
  { value: 'IT_ADMIN', label: 'IT Admin' }
]

const EXECUTION_MODES = [
  { value: 'SEQUENTIAL', label: 'Sequential (One by One)' },
  { value: 'PARALLEL', label: 'Parallel (All at Once)' }
]

const WorkflowConfigurationManager: React.FC<Props> = ({ onRefresh }) => {
  const [configurations, setConfigurations] = useState<WorkflowConfiguration[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<WorkflowConfiguration | null>(null)
  const [formData, setFormData] = useState<Partial<WorkflowConfiguration>>({
    workflowType: 'LEAVE_REQUEST',
    name: '',
    description: '',
    isDefault: false,
    priority: 0,
    steps: [
      {
        level: 1,
        approverRole: 'REPORTING_MANAGER',
        executionMode: 'SEQUENTIAL',
        isOptional: false
      }
    ],
    isActive: true
  })

  useEffect(() => {
    fetchConfigurations()
  }, [])

  const fetchConfigurations = async () => {
    try {
      setLoading(true)
      const response = await api.get('/workflow-configurations?activeOnly=false')
      if (response.data.success) {
        setConfigurations(response.data.data)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch workflow configurations')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (config?: WorkflowConfiguration) => {
    if (config) {
      setEditingConfig(config)
      setFormData({
        workflowType: config.workflowType,
        name: config.name,
        description: config.description,
        isDefault: config.isDefault,
        priority: config.priority,
        conditions: config.conditions,
        steps: config.steps,
        autoApprovalRules: config.autoApprovalRules,
        isActive: config.isActive
      })
    } else {
      setEditingConfig(null)
      setFormData({
        workflowType: 'LEAVE_REQUEST',
        name: '',
        description: '',
        isDefault: false,
        priority: 0,
        steps: [
          {
            level: 1,
            approverRole: 'REPORTING_MANAGER',
            executionMode: 'SEQUENTIAL',
            isOptional: false
          }
        ],
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
      if (!formData.name || !formData.workflowType) {
        toast.error('Please fill all required fields')
        return
      }

      if (editingConfig) {
        const response = await api.patch(`/workflow-configurations/${editingConfig.id}`, formData)
        if (response.data.success) {
          toast.success('Workflow configuration updated successfully')
          fetchConfigurations()
          handleCloseDialog()
          onRefresh?.()
        }
      } else {
        const response = await api.post('/workflow-configurations', formData)
        if (response.data.success) {
          toast.success('Workflow configuration created successfully')
          fetchConfigurations()
          handleCloseDialog()
          onRefresh?.()
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save workflow configuration')
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this workflow configuration?')) {
      return
    }

    try {
      const response = await api.delete(`/workflow-configurations/${id}`)
      if (response.data.success) {
        toast.success('Workflow configuration deleted successfully')
        fetchConfigurations()
        onRefresh?.()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete workflow configuration')
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await api.patch(`/workflow-configurations/${id}`, { isActive })
      if (response.data.success) {
        toast.success(`Workflow ${isActive ? 'activated' : 'deactivated'} successfully`)
        fetchConfigurations()
        onRefresh?.()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update workflow status')
    }
  }

  const addStep = () => {
    setFormData({
      ...formData,
      steps: [
        ...(formData.steps || []),
        {
          level: (formData.steps?.length || 0) + 1,
          approverRole: 'REPORTING_MANAGER',
          executionMode: 'SEQUENTIAL',
          isOptional: false
        }
      ]
    })
  }

  const removeStep = (index: number) => {
    const newSteps = [...(formData.steps || [])]
    newSteps.splice(index, 1)
    // Renumber levels
    newSteps.forEach((step, idx) => {
      step.level = idx + 1
    })
    setFormData({ ...formData, steps: newSteps })
  }

  const updateStep = (index: number, field: keyof WorkflowStep, value: any) => {
    const newSteps = [...(formData.steps || [])]
    newSteps[index] = { ...newSteps[index], [field]: value }
    setFormData({ ...formData, steps: newSteps })
  }

  const getWorkflowTypeLabel = (type: string) => {
    return WORKFLOW_TYPES.find(t => t.value === type)?.label || type
  }

  const getWorkflowTypeIcon = (type: string) => {
    return WORKFLOW_TYPES.find(t => t.value === type)?.icon || '⚙️'
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
          <AccountTree sx={{ verticalAlign: 'middle', mr: 1 }} />
          Workflow Configurations
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Workflow
        </Button>
      </Box>

      {configurations.length === 0 ? (
        <Alert severity="info">
          No workflow configurations found. Click "Add Workflow" to create one.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="center">Steps</TableCell>
                <TableCell align="center">Default</TableCell>
                <TableCell align="center">Priority</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {configurations.map((config) => (
                <TableRow key={config.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{getWorkflowTypeIcon(config.workflowType)}</span>
                      <Typography variant="body2">
                        {getWorkflowTypeLabel(config.workflowType)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {config.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {config.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${config.steps.length} step${config.steps.length !== 1 ? 's' : ''}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {config.isDefault && (
                      <Chip label="Default" size="small" color="success" />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={config.priority} size="small" variant="outlined" />
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
          {editingConfig ? 'Edit Workflow Configuration' : 'Add Workflow Configuration'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Workflow Type *</InputLabel>
                <Select
                  value={formData.workflowType}
                  label="Workflow Type *"
                  onChange={(e) => setFormData({ ...formData, workflowType: e.target.value })}
                >
                  {WORKFLOW_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Workflow Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Description"
                multiline
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                helperText="Higher priority workflows are checked first"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  />
                }
                label="Default Workflow"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
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

            {/* Workflow Steps */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="medium">
                  Workflow Steps
                </Typography>
                <Button
                  size="small"
                  startIcon={<Add />}
                  onClick={addStep}
                  variant="outlined"
                >
                  Add Step
                </Button>
              </Box>

              {formData.steps?.map((step, index) => (
                <Accordion key={index} sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography>
                      Level {step.level}: {APPROVER_ROLES.find(r => r.value === step.approverRole)?.label}
                      {step.isOptional && ' (Optional)'}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Approver Role</InputLabel>
                          <Select
                            value={step.approverRole}
                            label="Approver Role"
                            onChange={(e) => updateStep(index, 'approverRole', e.target.value)}
                          >
                            {APPROVER_ROLES.map((role) => (
                              <MenuItem key={role.value} value={role.value}>
                                {role.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Execution Mode</InputLabel>
                          <Select
                            value={step.executionMode}
                            label="Execution Mode"
                            onChange={(e) => updateStep(index, 'executionMode', e.target.value)}
                          >
                            {EXECUTION_MODES.map((mode) => (
                              <MenuItem key={mode.value} value={mode.value}>
                                {mode.label}
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
                          label="Auto-approve After (hours)"
                          value={step.autoApproveAfterHours || ''}
                          onChange={(e) => updateStep(index, 'autoApproveAfterHours', e.target.value ? parseInt(e.target.value) : undefined)}
                          helperText="Leave empty for no auto-approval"
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Escalate After (hours)"
                          value={step.escalateAfterHours || ''}
                          onChange={(e) => updateStep(index, 'escalateAfterHours', e.target.value ? parseInt(e.target.value) : undefined)}
                          helperText="Leave empty for no escalation"
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={step.isOptional}
                              onChange={(e) => updateStep(index, 'isOptional', e.target.checked)}
                            />
                          }
                          label="Optional Step"
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Button
                          fullWidth
                          variant="outlined"
                          color="error"
                          onClick={() => removeStep(index)}
                          disabled={(formData.steps?.length || 0) <= 1}
                        >
                          Remove Step
                        </Button>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))}

              {(!formData.steps || formData.steps.length === 0) && (
                <Alert severity="warning">
                  Please add at least one workflow step.
                </Alert>
              )}
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
            disabled={!formData.name || !formData.workflowType || (formData.steps?.length || 0) === 0}
          >
            {editingConfig ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default WorkflowConfigurationManager
