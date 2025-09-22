import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Edit,
  Delete,
  Send,
  Schedule,
  Save
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import toast from 'react-hot-toast';

import api from '@/config/api';

interface LeaveDraft {
  id: string;
  employeeId: string;
  leaveType?: string;
  startDate?: string;
  endDate?: string;
  isHalfDay?: boolean;
  reason?: string;
  templateId?: string;
  createdAt: string;
  updatedAt: string;
}

const leaveTypes = [
  { value: 'CASUAL_LEAVE', label: 'Casual Leave' },
  { value: 'SICK_LEAVE', label: 'Sick Leave' },
  { value: 'EARNED_LEAVE', label: 'Earned Leave' },
  { value: 'MATERNITY_LEAVE', label: 'Maternity Leave' },
  { value: 'PATERNITY_LEAVE', label: 'Paternity Leave' }
];

const DraftsPage: React.FC = () => {
  const [drafts, setDrafts] = useState<LeaveDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDraft, setEditingDraft] = useState<LeaveDraft | null>(null);

  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: null as Dayjs | null,
    endDate: null as Dayjs | null,
    isHalfDay: false,
    reason: ''
  });

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/leaves/drafts');
      if (response.data.success) {
        setDrafts(response.data.data);
      }
    } catch (error: any) {
      toast.error('Failed to fetch drafts');
      console.error('Error fetching drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      const draftData = {
        id: editingDraft?.id,
        leaveType: formData.leaveType || undefined,
        startDate: formData.startDate?.toISOString().split('T')[0],
        endDate: formData.endDate?.toISOString().split('T')[0],
        isHalfDay: formData.isHalfDay,
        reason: formData.reason || undefined
      };

      const response = await api.post('/leaves/drafts', draftData);

      if (response.data.success) {
        toast.success('Draft saved successfully');
        setEditDialogOpen(false);
        resetForm();
        fetchDrafts();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save draft');
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    if (!confirm('Are you sure you want to delete this draft?')) return;

    try {
      const response = await api.delete(`/leaves/drafts/${draftId}`);
      if (response.data.success) {
        toast.success('Draft deleted successfully');
        fetchDrafts();
      }
    } catch (error: any) {
      toast.error('Failed to delete draft');
    }
  };

  const handleSubmitDraft = async (draftId: string) => {
    if (!confirm('Are you sure you want to submit this draft as a leave request?')) return;

    try {
      const response = await api.post(`/leaves/drafts/${draftId}/submit`);
      if (response.data.success) {
        toast.success('Draft submitted as leave request successfully');
        fetchDrafts();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit draft');
    }
  };

  const resetForm = () => {
    setFormData({
      leaveType: '',
      startDate: null,
      endDate: null,
      isHalfDay: false,
      reason: ''
    });
    setEditingDraft(null);
  };

  const openEditDialog = (draft: LeaveDraft) => {
    setEditingDraft(draft);
    setFormData({
      leaveType: draft.leaveType || '',
      startDate: draft.startDate ? dayjs(draft.startDate) : null,
      endDate: draft.endDate ? dayjs(draft.endDate) : null,
      isHalfDay: draft.isHalfDay || false,
      reason: draft.reason || ''
    });
    setEditDialogOpen(true);
  };

  const getLeaveTypeLabel = (leaveType?: string) => {
    if (!leaveType) return 'Not specified';
    return leaveTypes.find(type => type.value === leaveType)?.label || leaveType;
  };

  const getDraftCompleteness = (draft: LeaveDraft) => {
    const fields = [draft.leaveType, draft.startDate, draft.reason];
    const completedFields = fields.filter(field => field).length;
    return {
      percentage: Math.round((completedFields / fields.length) * 100),
      isComplete: completedFields === fields.length
    };
  };

  const createNewDraft = async () => {
    try {
      const draftData = {
        leaveType: undefined,
        startDate: undefined,
        endDate: undefined,
        isHalfDay: false,
        reason: undefined
      };

      const response = await api.post('/leaves/drafts', draftData);

      if (response.data.success) {
        toast.success('New draft created');
        fetchDrafts();
      }
    } catch (error: any) {
      toast.error('Failed to create new draft');
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Schedule />
              Leave Drafts
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Save incomplete leave requests as drafts and submit them when ready
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={createNewDraft}
          >
            New Draft
          </Button>
        </Box>

        {/* Drafts Grid */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : drafts.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            No drafts found. Create a new draft to get started!
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {drafts.map((draft) => {
              const completeness = getDraftCompleteness(draft);

              return (
                <Grid item xs={12} md={6} lg={4} key={draft.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" gutterBottom>
                          Draft #{draft.id}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Edit Draft">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => openEditDialog(draft)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          {completeness.isComplete && (
                            <Tooltip title="Submit as Leave Request">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleSubmitDraft(draft.id)}
                              >
                                <Send />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Delete Draft">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteDraft(draft.id)}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>

                      {/* Completeness indicator */}
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="caption" color="textSecondary">
                            Completion
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {completeness.percentage}%
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            width: '100%',
                            height: 4,
                            backgroundColor: 'grey.300',
                            borderRadius: 2,
                            overflow: 'hidden'
                          }}
                        >
                          <Box
                            sx={{
                              width: `${completeness.percentage}%`,
                              height: '100%',
                              backgroundColor: completeness.isComplete ? 'success.main' : 'warning.main',
                              transition: 'width 0.3s ease'
                            }}
                          />
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        <Chip
                          label={getLeaveTypeLabel(draft.leaveType)}
                          size="small"
                          color={draft.leaveType ? 'primary' : 'default'}
                          variant="outlined"
                        />
                        {draft.isHalfDay && (
                          <Chip label="Half Day" size="small" variant="outlined" />
                        )}
                        {completeness.isComplete && (
                          <Chip label="Ready to Submit" size="small" color="success" />
                        )}
                      </Box>

                      {draft.startDate && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Start:</strong> {dayjs(draft.startDate).format('MMM DD, YYYY')}
                        </Typography>
                      )}

                      {draft.endDate && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>End:</strong> {dayjs(draft.endDate).format('MMM DD, YYYY')}
                        </Typography>
                      )}

                      {draft.reason && (
                        <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
                          "{draft.reason}"
                        </Typography>
                      )}

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                        <Typography variant="caption" color="textSecondary">
                          Created: {dayjs(draft.createdAt).format('MMM DD, YYYY')}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Updated: {dayjs(draft.updatedAt).format('MMM DD, YYYY')}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* Edit Draft Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            Edit Draft #{editingDraft?.id}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                select
                label="Leave Type"
                value={formData.leaveType}
                onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                fullWidth
              >
                <MenuItem value="">
                  <em>Not specified</em>
                </MenuItem>
                {leaveTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </TextField>

              <DatePicker
                label="Start Date"
                value={formData.startDate}
                onChange={(date) => setFormData({ ...formData, startDate: date })}
                slotProps={{ textField: { fullWidth: true } }}
              />

              <DatePicker
                label="End Date (Optional)"
                value={formData.endDate}
                onChange={(date) => setFormData({ ...formData, endDate: date })}
                slotProps={{ textField: { fullWidth: true } }}
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
                label="Reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                multiline
                rows={3}
                fullWidth
              />

              <Alert severity="info">
                You can save the draft with partial information and complete it later. All fields are optional.
              </Alert>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveDraft} variant="contained">
              Save Draft
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default DraftsPage;