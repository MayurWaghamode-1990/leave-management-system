import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  Grid,
  Chip,
  Paper,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  DatePicker,
  LocalizationProvider
} from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Upload as UploadIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { api } from '../../config/api';

// Form validation schema
const lwpSchema = yup.object({
  startDate: yup.date()
    .min(new Date(), 'Start date cannot be in the past')
    .required('Start date is required'),
  endDate: yup.date()
    .min(yup.ref('startDate'), 'End date must be after start date')
    .required('End date is required'),
  reason: yup.string()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason cannot exceed 500 characters')
    .required('Reason is required'),
  urgencyLevel: yup.string()
    .oneOf(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    .required('Urgency level is required'),
  additionalDetails: yup.string()
    .max(1000, 'Additional details cannot exceed 1000 characters'),
  expectedReturnDate: yup.date()
    .min(yup.ref('endDate'), 'Expected return date should be after end date'),
  contactInformation: yup.string()
    .max(200, 'Contact information cannot exceed 200 characters'),
  emergencyContactName: yup.string()
    .max(100, 'Emergency contact name cannot exceed 100 characters'),
  emergencyContactPhone: yup.string()
    .matches(/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number')
});

interface LWPFormData {
  startDate: Date | null;
  endDate: Date | null;
  reason: string;
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  additionalDetails?: string;
  expectedReturnDate?: Date | null;
  contactInformation?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  attachments?: File[];
}

interface LWPApplicationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const urgencyColors = {
  LOW: '#4caf50',
  MEDIUM: '#ff9800',
  HIGH: '#f44336',
  CRITICAL: '#9c27b0'
};

const urgencyDescriptions = {
  LOW: 'Standard processing (7-10 business days)',
  MEDIUM: 'Expedited processing (3-5 business days)',
  HIGH: 'Priority processing (1-2 business days)',
  CRITICAL: 'Immediate processing (same day)'
};

export const LWPApplicationForm: React.FC<LWPApplicationFormProps> = ({
  onSuccess,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formData, setFormData] = useState<LWPFormData | null>(null);
  const [workingDays, setWorkingDays] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    reset,
    getValues
  } = useForm<LWPFormData>({
    resolver: yupResolver(lwpSchema),
    defaultValues: {
      startDate: null,
      endDate: null,
      reason: '',
      urgencyLevel: 'LOW',
      additionalDetails: '',
      expectedReturnDate: null,
      contactInformation: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      attachments: []
    }
  });

  const watchedStartDate = watch('startDate');
  const watchedEndDate = watch('endDate');
  const watchedUrgencyLevel = watch('urgencyLevel');

  // Calculate working days when dates change
  useEffect(() => {
    if (watchedStartDate && watchedEndDate) {
      const days = calculateWorkingDays(watchedStartDate, watchedEndDate);
      setWorkingDays(days);
    }
  }, [watchedStartDate, watchedEndDate]);

  const calculateWorkingDays = (startDate: Date, endDate: Date): number => {
    let count = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  };

  const onSubmit = (data: LWPFormData) => {
    setFormData(data);
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    if (!formData) return;

    setLoading(true);
    try {
      const response = await api.post('/lwp/apply', {
        startDate: formData.startDate?.toISOString(),
        endDate: formData.endDate?.toISOString(),
        reason: formData.reason,
        urgencyLevel: formData.urgencyLevel,
        additionalDetails: formData.additionalDetails,
        expectedReturnDate: formData.expectedReturnDate?.toISOString(),
        contactInformation: formData.contactInformation,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
        attachments: [] // TODO: Handle file uploads
      });

      if (response.data.success) {
        toast.success('LWP application submitted successfully!');
        reset();
        onSuccess?.();
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to submit LWP application';
      toast.error(message);
    } finally {
      setLoading(false);
      setShowConfirmDialog(false);
    }
  };

  const steps = [
    {
      label: 'Basic Information',
      description: 'Dates and reason for leave',
      content: (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Controller
              name="startDate"
              control={control}
              render={({ field }) => (
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={field.value}
                    onChange={field.onChange}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.startDate,
                        helperText: errors.startDate?.message
                      }
                    }}
                  />
                </LocalizationProvider>
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="endDate"
              control={control}
              render={({ field }) => (
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="End Date"
                    value={field.value}
                    onChange={field.onChange}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.endDate,
                        helperText: errors.endDate?.message
                      }
                    }}
                  />
                </LocalizationProvider>
              )}
            />
          </Grid>

          {workingDays > 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <ScheduleIcon />
                  <Typography variant="body2">
                    Duration: {workingDays} working days
                    {workingDays > 90 && (
                      <Chip
                        label="Requires additional approval"
                        color="warning"
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          )}

          <Grid item xs={12}>
            <Controller
              name="urgencyLevel"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.urgencyLevel}>
                  <InputLabel>Urgency Level</InputLabel>
                  <Select {...field} label="Urgency Level">
                    {Object.entries(urgencyDescriptions).map(([level, description]) => (
                      <MenuItem key={level} value={level}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box
                            width={12}
                            height={12}
                            borderRadius="50%"
                            bgcolor={urgencyColors[level as keyof typeof urgencyColors]}
                          />
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {level}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {description}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{errors.urgencyLevel?.message}</FormHelperText>
                </FormControl>
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Controller
              name="reason"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  rows={4}
                  label="Reason for Leave Without Pay"
                  placeholder="Please provide a detailed explanation for your LWP request..."
                  error={!!errors.reason}
                  helperText={errors.reason?.message}
                />
              )}
            />
          </Grid>
        </Grid>
      )
    },
    {
      label: 'Additional Details',
      description: 'Optional information',
      content: (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Controller
              name="additionalDetails"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  rows={3}
                  label="Additional Details"
                  placeholder="Any additional information that might be relevant..."
                  error={!!errors.additionalDetails}
                  helperText={errors.additionalDetails?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="expectedReturnDate"
              control={control}
              render={({ field }) => (
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Expected Return Date (Optional)"
                    value={field.value}
                    onChange={field.onChange}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.expectedReturnDate,
                        helperText: errors.expectedReturnDate?.message
                      }
                    }}
                  />
                </LocalizationProvider>
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="contactInformation"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Contact Information"
                  placeholder="Phone, email, or address where you can be reached"
                  error={!!errors.contactInformation}
                  helperText={errors.contactInformation?.message}
                />
              )}
            />
          </Grid>
        </Grid>
      )
    },
    {
      label: 'Emergency Contact',
      description: 'Emergency contact details',
      content: (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Controller
              name="emergencyContactName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Emergency Contact Name"
                  placeholder="Full name of emergency contact"
                  InputProps={{
                    startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                  error={!!errors.emergencyContactName}
                  helperText={errors.emergencyContactName?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="emergencyContactPhone"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Emergency Contact Phone"
                  placeholder="+1 234 567 8900"
                  InputProps={{
                    startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                  error={!!errors.emergencyContactPhone}
                  helperText={errors.emergencyContactPhone?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Alert severity="info" icon={<InfoIcon />}>
              Emergency contact information is recommended for extended leaves (>30 days)
              and required for critical urgency applications.
            </Alert>
          </Grid>
        </Grid>
      )
    }
  ];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  return (
    <Box>
      <Card>
        <CardHeader
          title="Leave Without Pay Application"
          subheader="Please fill out all required information carefully"
          action={
            <Chip
              label="Special Approval Required"
              color="warning"
              variant="outlined"
            />
          }
        />
        <CardContent>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Important Notes:
            </Typography>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>LWP applications require enhanced approval process</li>
              <li>Minimum 3 months employment required</li>
              <li>Maximum duration: 1 year</li>
              <li>Documentation required for all LWP requests</li>
              <li>Long-term LWP (&gt;30 days) requires 30-day advance notice</li>
            </ul>
          </Alert>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Stepper activeStep={activeStep} orientation="vertical">
              {steps.map((step, index) => (
                <Step key={step.label}>
                  <StepLabel>
                    <Typography variant="h6">{step.label}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {step.description}
                    </Typography>
                  </StepLabel>
                  <StepContent>
                    <Box sx={{ my: 2 }}>
                      {step.content}
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <div>
                        <Button
                          variant="contained"
                          onClick={index === steps.length - 1 ? handleSubmit(onSubmit) : handleNext}
                          sx={{ mt: 1, mr: 1 }}
                          disabled={!isValid && index === steps.length - 1}
                        >
                          {index === steps.length - 1 ? 'Submit Application' : 'Continue'}
                        </Button>
                        <Button
                          disabled={index === 0}
                          onClick={handleBack}
                          sx={{ mt: 1, mr: 1 }}
                        >
                          Back
                        </Button>
                        {onCancel && (
                          <Button
                            onClick={onCancel}
                            sx={{ mt: 1 }}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </Box>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </form>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <WarningIcon color="warning" />
            Confirm LWP Application
          </Box>
        </DialogTitle>
        <DialogContent>
          {formData && (
            <Box>
              <Typography variant="body1" paragraph>
                Please review your Leave Without Pay application:
              </Typography>

              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Start Date:</Typography>
                    <Typography variant="body1">{formData.startDate?.toLocaleDateString()}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">End Date:</Typography>
                    <Typography variant="body1">{formData.endDate?.toLocaleDateString()}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Duration:</Typography>
                    <Typography variant="body1">{workingDays} working days</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Urgency:</Typography>
                    <Chip
                      label={formData.urgencyLevel}
                      sx={{
                        bgcolor: urgencyColors[formData.urgencyLevel],
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Reason:</Typography>
                    <Typography variant="body1">{formData.reason}</Typography>
                  </Grid>
                </Grid>
              </Paper>

              <Alert severity="info" sx={{ mt: 2 }}>
                Once submitted, this application will go through the enhanced approval process.
                You will receive notifications about the status updates.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowConfirmDialog(false)}
            disabled={loading}
          >
            Review Again
          </Button>
          <Button
            onClick={handleConfirmSubmit}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <CheckCircleIcon />}
          >
            {loading ? 'Submitting...' : 'Confirm & Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};