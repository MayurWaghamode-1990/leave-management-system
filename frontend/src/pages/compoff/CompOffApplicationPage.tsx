import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Tooltip,
  Fab
} from '@mui/material';
import {
  Add,
  Work,
  Schedule,
  CheckCircle,
  Cancel,
  Visibility,
  DateRange,
  AccessTime,
  Save,
  Send
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import toast from 'react-hot-toast';

import api from '@/config/api';

interface WorkLog {
  id: string;
  workDate: string;
  hoursWorked: number;
  workType: 'WEEKEND' | 'HOLIDAY' | 'EXTENDED_HOURS';
  workDescription: string;
  projectDetails?: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'CONSUMED';
  verifiedBy?: string;
  verifiedAt?: string;
  comments?: string;
  availableHours: number;
}

interface CompOffForm {
  workLogId: string;
  hoursToRedeem: number;
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  reason: string;
  isHalfDay: boolean;
}

interface WorkLogForm {
  workDate: Dayjs | null;
  hoursWorked: number;
  workType: 'WEEKEND' | 'HOLIDAY' | 'EXTENDED_HOURS' | '';
  workDescription: string;
  projectDetails: string;
}

const CompOffApplicationPage: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [workLogDialogOpen, setWorkLogDialogOpen] = useState(false);
  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false);
  const [selectedWorkLog, setSelectedWorkLog] = useState<WorkLog | null>(null);

  const [workLogForm, setWorkLogForm] = useState<WorkLogForm>({
    workDate: null,
    hoursWorked: 0,
    workType: '',
    workDescription: '',
    projectDetails: ''
  });

  const [compOffForm, setCompOffForm] = useState<CompOffForm>({
    workLogId: '',
    hoursToRedeem: 0,
    startDate: null,
    endDate: null,
    reason: '',
    isHalfDay: false
  });

  const steps = [
    'Log Work Hours',
    'Select Work Log',
    'Apply for Comp Off'
  ];

  const workTypeOptions = [
    { value: 'WEEKEND', label: 'Weekend Work' },
    { value: 'HOLIDAY', label: 'Holiday Work' },
    { value: 'EXTENDED_HOURS', label: 'Extended Hours' }
  ];

  useEffect(() => {
    fetchWorkLogs();
  }, []);

  const fetchWorkLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/comp-off/work-logs');
      setWorkLogs(response.data.data.workLogs || []);
    } catch (error: any) {
      toast.error('Failed to fetch work logs');
      console.error('Work logs fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkLogSubmit = async () => {
    if (!workLogForm.workDate || !workLogForm.workType || !workLogForm.workDescription.trim()) {
      toast.error('Please fill all required fields');
      return;
    }

    if (workLogForm.hoursWorked < 1 || workLogForm.hoursWorked > 12) {
      toast.error('Hours worked must be between 1 and 12');
      return;
    }

    if (workLogForm.workDescription.length < 20) {
      toast.error('Work description must be at least 20 characters');
      return;
    }

    try {
      setLoading(true);
      await api.post('/comp-off/work-log', {
        workDate: workLogForm.workDate.format('YYYY-MM-DD'),
        hoursWorked: workLogForm.hoursWorked,
        workType: workLogForm.workType,
        workDescription: workLogForm.workDescription,
        projectDetails: workLogForm.projectDetails
      });

      toast.success('Work log submitted successfully');
      setWorkLogDialogOpen(false);
      setWorkLogForm({
        workDate: null,
        hoursWorked: 0,
        workType: '',
        workDescription: '',
        projectDetails: ''
      });
      fetchWorkLogs();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to submit work log';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCompOffSubmit = async () => {
    if (!selectedWorkLog || !compOffForm.startDate || !compOffForm.endDate || !compOffForm.reason.trim()) {
      toast.error('Please fill all required fields');
      return;
    }

    if (compOffForm.hoursToRedeem < 5 || compOffForm.hoursToRedeem > selectedWorkLog.availableHours) {
      toast.error(`Hours to redeem must be between 5 and ${selectedWorkLog.availableHours}`);
      return;
    }

    try {
      setLoading(true);
      await api.post('/comp-off/apply', {
        workLogId: selectedWorkLog.id,
        hoursToRedeem: compOffForm.hoursToRedeem,
        startDate: compOffForm.startDate.format('YYYY-MM-DD'),
        endDate: compOffForm.endDate.format('YYYY-MM-DD'),
        reason: compOffForm.reason,
        isHalfDay: compOffForm.isHalfDay
      });

      toast.success('Comp off application submitted successfully');
      setApplicationDialogOpen(false);
      setCompOffForm({
        workLogId: '',
        hoursToRedeem: 0,
        startDate: null,
        endDate: null,
        reason: '',
        isHalfDay: false
      });
      setSelectedWorkLog(null);
      fetchWorkLogs();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to submit comp off application';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyForCompOff = (workLog: WorkLog) => {
    setSelectedWorkLog(workLog);
    setCompOffForm({
      ...compOffForm,
      workLogId: workLog.id,
      hoursToRedeem: Math.min(8, workLog.availableHours),
      isHalfDay: workLog.availableHours >= 5 && workLog.availableHours < 8
    });
    setApplicationDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'REJECTED':
        return 'error';
      case 'CONSUMED':
        return 'default';
      default:
        return 'default';
    }
  };

  const getWorkTypeLabel = (workType: string) => {
    const option = workTypeOptions.find(opt => opt.value === workType);
    return option ? option.label : workType;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" gutterBottom>
            <Work sx={{ mr: 1, verticalAlign: 'middle' }} />
            Comp Off Application
          </Typography>
          <Fab
            color="primary"
            onClick={() => setWorkLogDialogOpen(true)}
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
          >
            <Add />
          </Fab>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Apply for compensatory off by first logging your extra work hours, then submitting a comp off request once verified by your manager.
          </Typography>
        </Alert>

        {/* Stepper */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stepper activeStep={activeStep} orientation="horizontal">
              {steps.map((label, index) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>

        {/* Work Logs Table */}
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Your Work Logs
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => setWorkLogDialogOpen(true)}
              >
                Log Work Hours
              </Button>
            </Box>

            {loading && <LinearProgress sx={{ mb: 2 }} />}

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Work Date</TableCell>
                    <TableCell>Work Type</TableCell>
                    <TableCell>Hours Worked</TableCell>
                    <TableCell>Available Hours</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Verified By</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {workLogs.map((workLog) => (
                    <TableRow key={workLog.id}>
                      <TableCell>
                        {dayjs(workLog.workDate).format('MMM DD, YYYY')}
                      </TableCell>
                      <TableCell>
                        {getWorkTypeLabel(workLog.workType)}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <AccessTime fontSize="small" sx={{ mr: 1 }} />
                          {workLog.hoursWorked}h
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color={workLog.availableHours > 0 ? 'success.main' : 'text.secondary'}
                          fontWeight="medium"
                        >
                          {workLog.availableHours}h
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={workLog.status}
                          color={getStatusColor(workLog.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {workLog.verifiedBy || '-'}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="View Details">
                            <IconButton size="small">
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          {workLog.status === 'VERIFIED' && workLog.availableHours >= 5 && (
                            <Tooltip title="Apply for Comp Off">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleApplyForCompOff(workLog)}
                              >
                                <DateRange />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {workLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="textSecondary">
                          No work logs found. Start by logging your extra work hours.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Work Log Dialog */}
        <Dialog
          open={workLogDialogOpen}
          onClose={() => setWorkLogDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Schedule sx={{ mr: 1, verticalAlign: 'middle' }} />
            Log Work Hours
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <DatePicker
                  label="Work Date"
                  value={workLogForm.workDate}
                  onChange={(newValue) => setWorkLogForm({ ...workLogForm, workDate: newValue })}
                  maxDate={dayjs()}
                  minDate={dayjs().subtract(30, 'day')}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Hours Worked"
                  type="number"
                  value={workLogForm.hoursWorked}
                  onChange={(e) => setWorkLogForm({ ...workLogForm, hoursWorked: Number(e.target.value) })}
                  inputProps={{ min: 1, max: 12, step: 0.5 }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Work Type</InputLabel>
                  <Select
                    value={workLogForm.workType}
                    label="Work Type"
                    onChange={(e) => setWorkLogForm({ ...workLogForm, workType: e.target.value as any })}
                  >
                    {workTypeOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Work Description"
                  multiline
                  rows={3}
                  value={workLogForm.workDescription}
                  onChange={(e) => setWorkLogForm({ ...workLogForm, workDescription: e.target.value })}
                  placeholder="Describe the work performed (minimum 20 characters)"
                  helperText={`${workLogForm.workDescription.length}/500 characters`}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Project Details (Optional)"
                  value={workLogForm.projectDetails}
                  onChange={(e) => setWorkLogForm({ ...workLogForm, projectDetails: e.target.value })}
                  placeholder="Project name or additional details"
                  helperText="Maximum 200 characters"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setWorkLogDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleWorkLogSubmit}
              disabled={loading}
              startIcon={<Save />}
            >
              Save Work Log
            </Button>
          </DialogActions>
        </Dialog>

        {/* Comp Off Application Dialog */}
        <Dialog
          open={applicationDialogOpen}
          onClose={() => setApplicationDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <DateRange sx={{ mr: 1, verticalAlign: 'middle' }} />
            Apply for Comp Off
          </DialogTitle>
          <DialogContent dividers>
            {selectedWorkLog && (
              <>
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    Work Date: {dayjs(selectedWorkLog.workDate).format('MMM DD, YYYY')} |
                    Available Hours: {selectedWorkLog.availableHours}h |
                    Work Type: {getWorkTypeLabel(selectedWorkLog.workType)}
                  </Typography>
                </Alert>

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Hours to Redeem"
                      type="number"
                      value={compOffForm.hoursToRedeem}
                      onChange={(e) => setCompOffForm({ ...compOffForm, hoursToRedeem: Number(e.target.value) })}
                      inputProps={{ min: 5, max: selectedWorkLog.availableHours, step: 0.5 }}
                      helperText={`Available: ${selectedWorkLog.availableHours}h`}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={compOffForm.isHalfDay}
                          onChange={(e) => setCompOffForm({ ...compOffForm, isHalfDay: e.target.checked })}
                        />
                      }
                      label="Half Day"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="Start Date"
                      value={compOffForm.startDate}
                      onChange={(newValue) => setCompOffForm({ ...compOffForm, startDate: newValue })}
                      minDate={dayjs().add(1, 'day')}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="End Date"
                      value={compOffForm.endDate}
                      onChange={(newValue) => setCompOffForm({ ...compOffForm, endDate: newValue })}
                      minDate={compOffForm.startDate || dayjs().add(1, 'day')}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Reason"
                      multiline
                      rows={3}
                      value={compOffForm.reason}
                      onChange={(e) => setCompOffForm({ ...compOffForm, reason: e.target.value })}
                      placeholder="Reason for taking comp off"
                      helperText={`${compOffForm.reason.length}/200 characters`}
                      required
                    />
                  </Grid>
                </Grid>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setApplicationDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleCompOffSubmit}
              disabled={loading}
              startIcon={<Send />}
            >
              Submit Application
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default CompOffApplicationPage;