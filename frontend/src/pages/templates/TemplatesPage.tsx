import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Fab
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  PlayArrow,
  ContentCopy,
  Schedule,
  Repeat
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import toast from 'react-hot-toast';

import api from '@/config/api';

interface LeaveTemplate {
  id: string;
  employeeId: string;
  name: string;
  description?: string;
  leaveType: string;
  defaultDuration: number;
  isHalfDay: boolean;
  defaultReason: string;
  isRecurring: boolean;
  recurrencePattern?: string;
  recurrenceEndDate?: string;
  isActive: boolean;
  createdAt: string;
  lastUsed?: string;
}

const leaveTypes = [
  { value: 'CASUAL_LEAVE', label: 'Casual Leave' },
  { value: 'SICK_LEAVE', label: 'Sick Leave' },
  { value: 'EARNED_LEAVE', label: 'Earned Leave' },
  { value: 'MATERNITY_LEAVE', label: 'Maternity Leave' },
  { value: 'PATERNITY_LEAVE', label: 'Paternity Leave' }
];

const recurrencePatterns = [
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'YEARLY', label: 'Yearly' }
];

const TemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<LeaveTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<LeaveTemplate | null>(null);
  const [useFromTemplateDialog, setUseFromTemplateDialog] = useState<{
    open: boolean;
    template: LeaveTemplate | null;
  }>({ open: false, template: null });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    leaveType: '',
    defaultDuration: 1,
    isHalfDay: false,
    defaultReason: '',
    isRecurring: false,
    recurrencePattern: '',
    recurrenceEndDate: null as Dayjs | null
  });

  const [templateUsageData, setTemplateUsageData] = useState({
    startDate: null as Dayjs | null,
    endDate: null as Dayjs | null,
    customReason: ''
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/leaves/templates');
      if (response.data.success) {
        setTemplates(response.data.data);
      }
    } catch (error: any) {
      toast.error('Failed to fetch templates');
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      if (!formData.name || !formData.leaveType || !formData.defaultReason) {
        toast.error('Please fill all required fields');
        return;
      }

      const templateData = {
        ...formData,
        recurrenceEndDate: formData.recurrenceEndDate?.toISOString().split('T')[0]
      };

      const response = editingTemplate
        ? await api.put(`/leaves/templates/${editingTemplate.id}`, templateData)
        : await api.post('/leaves/templates', templateData);

      if (response.data.success) {
        toast.success(editingTemplate ? 'Template updated successfully' : 'Template created successfully');
        setDialogOpen(false);
        resetForm();
        fetchTemplates();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save template');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await api.delete(`/leaves/templates/${templateId}`);
      if (response.data.success) {
        toast.success('Template deleted successfully');
        fetchTemplates();
      }
    } catch (error: any) {
      toast.error('Failed to delete template');
    }
  };

  const handleUseTemplate = async () => {
    if (!useFromTemplateDialog.template || !templateUsageData.startDate) {
      toast.error('Please select a start date');
      return;
    }

    try {
      const requestData = {
        startDate: templateUsageData.startDate.toISOString().split('T')[0],
        endDate: templateUsageData.endDate?.toISOString().split('T')[0],
        customReason: templateUsageData.customReason
      };

      const response = await api.post(`/leaves/from-template/${useFromTemplateDialog.template.id}`, requestData);

      if (response.data.success) {
        toast.success('Leave request created from template successfully');
        setUseFromTemplateDialog({ open: false, template: null });
        resetTemplateUsageData();
        fetchTemplates(); // Refresh to update lastUsed
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create leave request');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      leaveType: '',
      defaultDuration: 1,
      isHalfDay: false,
      defaultReason: '',
      isRecurring: false,
      recurrencePattern: '',
      recurrenceEndDate: null
    });
    setEditingTemplate(null);
  };

  const resetTemplateUsageData = () => {
    setTemplateUsageData({
      startDate: null,
      endDate: null,
      customReason: ''
    });
  };

  const openEditDialog = (template: LeaveTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      leaveType: template.leaveType,
      defaultDuration: template.defaultDuration,
      isHalfDay: template.isHalfDay,
      defaultReason: template.defaultReason,
      isRecurring: template.isRecurring,
      recurrencePattern: template.recurrencePattern || '',
      recurrenceEndDate: template.recurrenceEndDate ? dayjs(template.recurrenceEndDate) : null
    });
    setDialogOpen(true);
  };

  const openUseTemplateDialog = (template: LeaveTemplate) => {
    setUseFromTemplateDialog({ open: true, template });
    setTemplateUsageData({
      startDate: null,
      endDate: null,
      customReason: template.defaultReason
    });
  };

  const getLeaveTypeLabel = (leaveType: string) => {
    return leaveTypes.find(type => type.value === leaveType)?.label || leaveType;
  };

  const getRecurrenceLabel = (pattern?: string) => {
    return recurrencePatterns.find(p => p.value === pattern)?.label || pattern;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ContentCopy />
              Leave Templates
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Create and manage reusable leave request templates for faster application submission
            </Typography>
          </Box>
        </Box>

        {/* Templates Grid */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : templates.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            No templates created yet. Create your first template to get started!
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {templates.map((template) => (
              <Grid item xs={12} md={6} lg={4} key={template.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        {template.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Use Template">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => openUseTemplateDialog(template)}
                          >
                            <PlayArrow />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Template">
                          <IconButton
                            size="small"
                            color="default"
                            onClick={() => openEditDialog(template)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Template">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    {template.description && (
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        {template.description}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      <Chip
                        label={getLeaveTypeLabel(template.leaveType)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        label={`${template.defaultDuration} day${template.defaultDuration !== 1 ? 's' : ''}`}
                        size="small"
                        variant="outlined"
                      />
                      {template.isHalfDay && (
                        <Chip label="Half Day" size="small" variant="outlined" />
                      )}
                      {template.isRecurring && (
                        <Chip
                          icon={<Repeat />}
                          label={getRecurrenceLabel(template.recurrencePattern)}
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                      )}
                    </Box>

                    <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
                      "{template.defaultReason}"
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                      <Typography variant="caption" color="textSecondary">
                        Created: {dayjs(template.createdAt).format('MMM DD, YYYY')}
                      </Typography>
                      {template.lastUsed && (
                        <Typography variant="caption" color="textSecondary">
                          Last used: {dayjs(template.lastUsed).format('MMM DD, YYYY')}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Floating Action Button */}
        <Fab
          color="primary"
          aria-label="add template"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
        >
          <Add />
        </Fab>

        {/* Create/Edit Template Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingTemplate ? 'Edit Template' : 'Create New Template'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Template Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                fullWidth
              />

              <TextField
                label="Description (Optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={2}
                fullWidth
              />

              <TextField
                select
                label="Leave Type"
                value={formData.leaveType}
                onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                required
                fullWidth
              >
                {leaveTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Default Duration (Days)"
                type="number"
                value={formData.defaultDuration}
                onChange={(e) => setFormData({ ...formData, defaultDuration: parseInt(e.target.value) || 1 })}
                required
                fullWidth
                InputProps={{ inputProps: { min: 1, max: 365 } }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isHalfDay}
                    onChange={(e) => setFormData({ ...formData, isHalfDay: e.target.checked })}
                  />
                }
                label="Half Day Leave"
              />

              <TextField
                label="Default Reason"
                value={formData.defaultReason}
                onChange={(e) => setFormData({ ...formData, defaultReason: e.target.value })}
                required
                multiline
                rows={2}
                fullWidth
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isRecurring}
                    onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                  />
                }
                label="Recurring Template"
              />

              {formData.isRecurring && (
                <>
                  <TextField
                    select
                    label="Recurrence Pattern"
                    value={formData.recurrencePattern}
                    onChange={(e) => setFormData({ ...formData, recurrencePattern: e.target.value })}
                    fullWidth
                  >
                    {recurrencePatterns.map((pattern) => (
                      <MenuItem key={pattern.value} value={pattern.value}>
                        {pattern.label}
                      </MenuItem>
                    ))}
                  </TextField>

                  <DatePicker
                    label="Recurrence End Date (Optional)"
                    value={formData.recurrenceEndDate}
                    onChange={(date) => setFormData({ ...formData, recurrenceEndDate: date })}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTemplate} variant="contained">
              {editingTemplate ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Use Template Dialog */}
        <Dialog
          open={useFromTemplateDialog.open}
          onClose={() => setUseFromTemplateDialog({ open: false, template: null })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Use Template: {useFromTemplateDialog.template?.name}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Alert severity="info">
                This will create a new leave request using the template settings. You can customize the dates and reason.
              </Alert>

              <DatePicker
                label="Start Date"
                value={templateUsageData.startDate}
                onChange={(date) => setTemplateUsageData({ ...templateUsageData, startDate: date })}
                slotProps={{ textField: { fullWidth: true, required: true } }}
              />

              <DatePicker
                label="End Date (Optional)"
                value={templateUsageData.endDate}
                onChange={(date) => setTemplateUsageData({ ...templateUsageData, endDate: date })}
                slotProps={{ textField: { fullWidth: true } }}
              />

              <TextField
                label="Custom Reason (Optional)"
                value={templateUsageData.customReason}
                onChange={(e) => setTemplateUsageData({ ...templateUsageData, customReason: e.target.value })}
                placeholder={useFromTemplateDialog.template?.defaultReason}
                multiline
                rows={2}
                fullWidth
                helperText="Leave empty to use template's default reason"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUseFromTemplateDialog({ open: false, template: null })}>
              Cancel
            </Button>
            <Button onClick={handleUseTemplate} variant="contained">
              Create Leave Request
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default TemplatesPage;