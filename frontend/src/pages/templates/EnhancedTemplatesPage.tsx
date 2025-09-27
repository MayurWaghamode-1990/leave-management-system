import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
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
  Fab,
  InputAdornment,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Avatar,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  PlayArrow,
  ContentCopy,
  Search,
  BookmarkBorder,
  Bookmark,
  Share,
  Public,
  Lock,
  TrendingUp,
  Category,
  FilterList,
  Clear
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import api from '@/config/api';
import { LeaveType } from '@/types';

interface LeaveTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  leaveType: string;
  duration?: number;
  reason: string;
  isHalfDay: boolean;
  isPublic: boolean;
  isActive: boolean;
  usageCount: number;
  tags: string[];
  createdBy: string;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Category {
  name: string;
  count: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`templates-tabpanel-${index}`}
      aria-labelledby={`templates-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const EnhancedTemplatesPage: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<LeaveTemplate[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<LeaveTemplate | null>(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [includePublic, setIncludePublic] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'PERSONAL',
    leaveType: LeaveType.EARNED_LEAVE,
    duration: 1,
    reason: '',
    isHalfDay: false,
    isPublic: false,
    tags: [] as string[]
  });

  const [tagInput, setTagInput] = useState('');

  const leaveTypes = [
    { value: LeaveType.EARNED_LEAVE, label: 'Earned Leave' },
    { value: LeaveType.SICK_LEAVE, label: 'Sick Leave' },
    { value: LeaveType.CASUAL_LEAVE, label: 'Casual Leave' },
    { value: LeaveType.MATERNITY_LEAVE, label: 'Maternity Leave' },
    { value: LeaveType.PATERNITY_LEAVE, label: 'Paternity Leave' },
    { value: LeaveType.COMPENSATORY_OFF, label: 'Compensatory Off' },
    { value: LeaveType.BEREAVEMENT_LEAVE, label: 'Bereavement Leave' },
    { value: LeaveType.MARRIAGE_LEAVE, label: 'Marriage Leave' }
  ];

  const categoryOptions = [
    'PERSONAL',
    'MEDICAL',
    'VACATION',
    'EMERGENCY',
    'FAMILY',
    'WORK',
    'OTHER'
  ];

  useEffect(() => {
    fetchTemplates();
    fetchCategories();
  }, [selectedCategory, includePublic, searchTerm]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'ALL') params.append('category', selectedCategory);
      params.append('includePublic', includePublic.toString());
      if (searchTerm) params.append('search', searchTerm);

      const response = await api.get(`/templates?${params.toString()}`);
      const templatesData = (response.data.data || []).map((template: any) => ({
        ...template,
        tags: typeof template.tags === 'string' ?
          (template.tags ? JSON.parse(template.tags) : []) :
          (template.tags || [])
      }));
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/templates/categories');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      description: '',
      category: 'PERSONAL',
      leaveType: LeaveType.EARNED_LEAVE,
      duration: 1,
      reason: '',
      isHalfDay: false,
      isPublic: false,
      tags: []
    });
    setTagInput('');
    setDialogOpen(true);
  };

  const handleEditTemplate = (template: LeaveTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      category: template.category,
      leaveType: template.leaveType as LeaveType,
      duration: template.duration || 1,
      reason: template.reason,
      isHalfDay: template.isHalfDay,
      isPublic: template.isPublic,
      tags: template.tags || []
    });
    setTagInput('');
    setDialogOpen(true);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await api.delete(`/templates/${templateId}`);
      setTemplates(templates.filter(t => t.id !== templateId));
      toast.success('Template deleted successfully');
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  const handleSaveTemplate = async () => {
    try {
      const templateData = {
        ...formData,
        tags: formData.tags
      };

      if (editingTemplate) {
        const response = await api.put(`/templates/${editingTemplate.id}`, templateData);
        const updatedTemplate = {
          ...response.data.data,
          tags: typeof response.data.data.tags === 'string' ?
            (response.data.data.tags ? JSON.parse(response.data.data.tags) : []) :
            (response.data.data.tags || [])
        };
        setTemplates(templates.map(t =>
          t.id === editingTemplate.id ? updatedTemplate : t
        ));
        toast.success('Template updated successfully');
      } else {
        const response = await api.post('/templates', templateData);
        const newTemplate = {
          ...response.data.data,
          tags: typeof response.data.data.tags === 'string' ?
            (response.data.data.tags ? JSON.parse(response.data.data.tags) : []) :
            (response.data.data.tags || [])
        };
        setTemplates([newTemplate, ...templates]);
        toast.success('Template created successfully');
      }

      setDialogOpen(false);
      fetchCategories(); // Refresh categories
    } catch (error) {
      toast.error('Failed to save template');
    }
  };

  const handleUseTemplate = async (template: LeaveTemplate) => {
    try {
      await api.post(`/templates/${template.id}/use`);

      // Update usage count locally
      setTemplates(templates.map(t =>
        t.id === template.id ? { ...t, usageCount: t.usageCount + 1 } : t
      ));

      // Navigate to leave application with template data
      const event = new CustomEvent('useLeaveTemplate', {
        detail: {
          leaveType: template.leaveType,
          reason: template.reason,
          isHalfDay: template.isHalfDay,
          duration: template.duration
        }
      });
      window.dispatchEvent(event);

      toast.success('Template applied to leave form');
    } catch (error) {
      toast.error('Failed to use template');
    }
  };

  const handleDuplicateTemplate = (template: LeaveTemplate) => {
    setEditingTemplate(null);
    setFormData({
      name: `${template.name} (Copy)`,
      description: template.description || '',
      category: template.category,
      leaveType: template.leaveType as LeaveType,
      duration: template.duration || 1,
      reason: template.reason,
      isHalfDay: template.isHalfDay,
      isPublic: false, // Always make copies private
      tags: template.tags || []
    });
    setTagInput('');
    setDialogOpen(true);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const getFilteredTemplates = () => {
    let filtered = templates;

    switch (currentTab) {
      case 1: // My Templates
        filtered = templates.filter(t => t.createdBy === user?.id);
        break;
      case 2: // Public Templates
        filtered = templates.filter(t => t.isPublic);
        break;
      case 3: // Popular Templates
        filtered = templates.filter(t => t.usageCount > 0).sort((a, b) => b.usageCount - a.usageCount);
        break;
      default: // All Templates
        break;
    }

    return filtered;
  };

  const renderTemplateCard = (template: LeaveTemplate) => {
    const isOwner = template.createdBy === user?.id;

    return (
      <Card key={template.id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h6" noWrap>
              {template.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {template.isPublic ? <Public fontSize="small" color="primary" /> : <Lock fontSize="small" color="action" />}
              {template.usageCount > 0 && (
                <Chip
                  icon={<TrendingUp />}
                  label={template.usageCount}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>

          {template.description && (
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              {template.description}
            </Typography>
          )}

          <Box sx={{ mb: 2 }}>
            <Chip
              label={template.category}
              size="small"
              color="secondary"
              variant="outlined"
              sx={{ mr: 1, mb: 1 }}
            />
            <Chip
              label={leaveTypes.find(lt => lt.value === template.leaveType)?.label || template.leaveType}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ mr: 1, mb: 1 }}
            />
            {template.duration && (
              <Chip
                label={`${template.duration} day${template.duration > 1 ? 's' : ''}`}
                size="small"
                variant="outlined"
                sx={{ mr: 1, mb: 1 }}
              />
            )}
            {template.isHalfDay && (
              <Chip
                label="Half Day"
                size="small"
                color="warning"
                variant="outlined"
                sx={{ mr: 1, mb: 1 }}
              />
            )}
          </Box>

          {template.tags && Array.isArray(template.tags) && template.tags.length > 0 && (
            <Box sx={{ mb: 2 }}>
              {template.tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  size="small"
                  variant="outlined"
                  sx={{ mr: 0.5, mb: 0.5 }}
                />
              ))}
            </Box>
          )}

          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Reason:</strong> {template.reason}
          </Typography>

          <Typography variant="caption" color="textSecondary">
            Created by: {template.owner.firstName} {template.owner.lastName}
          </Typography>
        </CardContent>

        <CardActions>
          <Button
            size="small"
            startIcon={<PlayArrow />}
            onClick={() => handleUseTemplate(template)}
            color="primary"
          >
            Use Template
          </Button>

          <Button
            size="small"
            startIcon={<ContentCopy />}
            onClick={() => handleDuplicateTemplate(template)}
          >
            Duplicate
          </Button>

          {isOwner && (
            <>
              <IconButton
                size="small"
                onClick={() => handleEditTemplate(template)}
                color="primary"
              >
                <Edit fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleDeleteTemplate(template.id)}
                color="error"
              >
                <Delete fontSize="small" />
              </IconButton>
            </>
          )}
        </CardActions>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Leave Templates
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Create and manage reusable leave request templates for faster submissions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateTemplate}
        >
          Create Template
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setSearchTerm('')} size="small">
                        <Clear />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Category"
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <MenuItem value="ALL">All Categories</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.name} value={category.name}>
                      {category.name} ({category.count})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={includePublic}
                    onChange={(e) => setIncludePublic(e.target.checked)}
                  />
                }
                label="Include Public Templates"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
          <Tab label={`All Templates (${templates.length})`} />
          <Tab label={`My Templates (${templates.filter(t => t.createdBy === user?.id).length})`} />
          <Tab label={`Public Templates (${templates.filter(t => t.isPublic).length})`} />
          <Tab label={`Popular Templates (${templates.filter(t => t.usageCount > 0).length})`} />
        </Tabs>
      </Box>

      {/* Templates Grid */}
      <TabPanel value={currentTab} index={currentTab}>
        {getFilteredTemplates().length === 0 ? (
          <Alert severity="info">
            No templates found. {currentTab === 1 ? 'Create your first template!' : 'Try adjusting your filters.'}
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {getFilteredTemplates().map((template) => (
              <Grid item xs={12} sm={6} md={4} key={template.id}>
                {renderTemplateCard(template)}
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add template"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={handleCreateTemplate}
      >
        <Add />
      </Fab>

      {/* Create/Edit Template Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTemplate ? 'Edit Template' : 'Create Template'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Template Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  label="Category"
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categoryOptions.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Leave Type</InputLabel>
                <Select
                  value={formData.leaveType}
                  label="Leave Type"
                  onChange={(e) => setFormData({ ...formData, leaveType: e.target.value as LeaveType })}
                >
                  {leaveTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Default Duration (days)"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 1 })}
                inputProps={{ min: 1, max: 365 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isHalfDay}
                    onChange={(e) => setFormData({ ...formData, isHalfDay: e.target.checked })}
                  />
                }
                label="Half Day Leave"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Default Reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                multiline
                rows={3}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Add Tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button onClick={handleAddTag} disabled={!tagInput.trim()}>
                        Add
                      </Button>
                    </InputAdornment>
                  )
                }}
                placeholder="Enter tags to help categorize your template"
              />
              {formData.tags.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  {formData.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      onDelete={() => handleRemoveTag(tag)}
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                </Box>
              )}
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  />
                }
                label="Make this template public (other users can see and use it)"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveTemplate}
            variant="contained"
            disabled={!formData.name || !formData.reason}
          >
            {editingTemplate ? 'Update' : 'Create'} Template
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnhancedTemplatesPage;