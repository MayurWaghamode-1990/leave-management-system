import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Chip,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Description,
  Search,
  PlayArrow,
  Close,
  TrendingUp
} from '@mui/icons-material';
import { LeaveType } from '@/types';
import api from '@/config/api';

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
  usageCount: number;
  tags: string[];
  owner: {
    firstName: string;
    lastName: string;
  };
}

interface TemplateSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelectTemplate: (template: LeaveTemplate) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  open,
  onClose,
  onSelectTemplate
}) => {
  const [templates, setTemplates] = useState<LeaveTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open, searchTerm]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('includePublic', 'true');
      if (searchTerm) params.append('search', searchTerm);

      const response = await api.get(`/templates?${params.toString()}`);
      setTemplates(response.data.data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = async (template: LeaveTemplate) => {
    try {
      // Increment usage count
      await api.post(`/templates/${template.id}/use`);
      onSelectTemplate(template);
      onClose();
    } catch (error) {
      console.error('Error using template:', error);
    }
  };

  const getLeaveTypeLabel = (leaveType: string) => {
    const labels = {
      [LeaveType.EARNED_LEAVE]: 'Earned Leave',
      [LeaveType.SICK_LEAVE]: 'Sick Leave',
      [LeaveType.CASUAL_LEAVE]: 'Casual Leave',
      [LeaveType.MATERNITY_LEAVE]: 'Maternity Leave',
      [LeaveType.PATERNITY_LEAVE]: 'Paternity Leave',
      [LeaveType.COMPENSATORY_OFF]: 'Compensatory Off',
      [LeaveType.BEREAVEMENT_LEAVE]: 'Bereavement Leave',
      [LeaveType.MARRIAGE_LEAVE]: 'Marriage Leave'
    };
    return labels[leaveType as LeaveType] || leaveType;
  };

  const filteredTemplates = templates.slice(0, 10); // Show top 10 templates

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Description />
            Quick Templates
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 2 }}>
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
              )
            }}
            size="small"
          />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : filteredTemplates.length === 0 ? (
          <Alert severity="info">
            No templates found. Create templates from the Templates page to use them here.
          </Alert>
        ) : (
          <List>
            {filteredTemplates.map((template, index) => (
              <React.Fragment key={template.id}>
                {index > 0 && <Divider />}
                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {template.name}
                        </Typography>
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
                    }
                    secondary={
                      <Box>
                        {template.description && (
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                            {template.description}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5, flexWrap: 'wrap' }}>
                          <Chip
                            label={template.category}
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                          <Chip
                            label={getLeaveTypeLabel(template.leaveType)}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          {template.duration && (
                            <Chip
                              label={`${template.duration} day${template.duration > 1 ? 's' : ''}`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                          {template.isHalfDay && (
                            <Chip
                              label="Half Day"
                              size="small"
                              color="warning"
                              variant="outlined"
                            />
                          )}
                        </Box>
                        <Typography variant="body2" color="textSecondary">
                          <strong>Reason:</strong> {template.reason}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                          Created by: {template.owner.firstName} {template.owner.lastName}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<PlayArrow />}
                      onClick={() => handleSelectTemplate(template)}
                    >
                      Use
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TemplateSelector;