import React, { useState } from 'react'
import { Box, Grid, Typography, Alert } from '@mui/material'
import {
  EventNote,
  CalendarToday,
  Description,
  PersonOutline,
} from '@mui/icons-material'
import dayjs, { Dayjs } from 'dayjs'

import EnhancedTextField from './EnhancedTextField'
import EnhancedDatePicker from './EnhancedDatePicker'
import EnhancedSelect from './EnhancedSelect'
import EnhancedFileUpload from './EnhancedFileUpload'
import GradientButton from '@/components/common/GradientButton'
import GlassCard from '@/components/common/GlassCard'

interface LeaveFormData {
  leaveType: string
  startDate: Dayjs | null
  endDate: Dayjs | null
  reason: string
  contactNumber: string
  attachments: File[]
}

const leaveTypes = [
  { value: 'SICK_LEAVE', label: 'Sick Leave', icon: <EventNote /> },
  { value: 'CASUAL_LEAVE', label: 'Casual Leave', icon: <EventNote /> },
  { value: 'EARNED_LEAVE', label: 'Earned Leave', icon: <EventNote /> },
  { value: 'MATERNITY_LEAVE', label: 'Maternity Leave', icon: <PersonOutline /> },
  { value: 'PATERNITY_LEAVE', label: 'Paternity Leave', icon: <PersonOutline /> },
]

const EnhancedLeaveApplicationForm: React.FC = () => {
  const [formData, setFormData] = useState<LeaveFormData>({
    leaveType: '',
    startDate: null,
    endDate: null,
    reason: '',
    contactNumber: '',
    attachments: [],
  })

  const [errors, setErrors] = useState<Partial<Record<keyof LeaveFormData, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof LeaveFormData, boolean>>>({})

  const handleChange = (field: keyof LeaveFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setTouched((prev) => ({ ...prev, [field]: true }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof LeaveFormData, string>> = {}

    if (!formData.leaveType) {
      newErrors.leaveType = 'Please select a leave type'
    }
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required'
    }
    if (!formData.endDate) {
      newErrors.endDate = 'End date is required'
    }
    if (formData.startDate && formData.endDate && formData.endDate.isBefore(formData.startDate)) {
      newErrors.endDate = 'End date must be after start date'
    }
    if (!formData.reason || formData.reason.trim().length < 10) {
      newErrors.reason = 'Please provide a reason (min 10 characters)'
    }
    if (!formData.contactNumber || !/^\d{10}$/.test(formData.contactNumber)) {
      newErrors.contactNumber = 'Please provide a valid 10-digit contact number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Mark all fields as touched
    setTouched({
      leaveType: true,
      startDate: true,
      endDate: true,
      reason: true,
      contactNumber: true,
      attachments: true,
    })

    if (validateForm()) {
      console.log('Form submitted:', formData)
      // Handle form submission
    }
  }

  const calculateDays = () => {
    if (formData.startDate && formData.endDate) {
      return formData.endDate.diff(formData.startDate, 'day') + 1
    }
    return 0
  }

  return (
    <GlassCard gradient sx={{ p: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Apply for Leave
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Fill in the details below to submit your leave request
        </Typography>
      </Box>

      {calculateDays() > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You are applying for <strong>{calculateDays()} day(s)</strong> of leave
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Leave Type */}
          <Grid item xs={12}>
            <EnhancedSelect
              label="Leave Type"
              value={formData.leaveType}
              onChange={(e) => handleChange('leaveType', e.target.value)}
              options={leaveTypes}
              error={touched.leaveType && !!errors.leaveType}
              helperText={touched.leaveType ? errors.leaveType : ''}
              required
            />
          </Grid>

          {/* Start Date */}
          <Grid item xs={12} sm={6}>
            <EnhancedDatePicker
              label="Start Date"
              value={formData.startDate}
              onChange={(newValue) => handleChange('startDate', newValue)}
              minDate={dayjs()}
              error={touched.startDate && !!errors.startDate}
              helperText={touched.startDate ? errors.startDate : ''}
            />
          </Grid>

          {/* End Date */}
          <Grid item xs={12} sm={6}>
            <EnhancedDatePicker
              label="End Date"
              value={formData.endDate}
              onChange={(newValue) => handleChange('endDate', newValue)}
              minDate={formData.startDate || dayjs()}
              error={touched.endDate && !!errors.endDate}
              helperText={touched.endDate ? errors.endDate : ''}
            />
          </Grid>

          {/* Contact Number */}
          <Grid item xs={12} sm={6}>
            <EnhancedTextField
              label="Emergency Contact Number"
              value={formData.contactNumber}
              onChange={(e) => handleChange('contactNumber', e.target.value)}
              error={touched.contactNumber && !!errors.contactNumber}
              helperText={touched.contactNumber ? errors.contactNumber : 'Enter 10-digit mobile number'}
              showValidation={touched.contactNumber}
              validationSuccess={touched.contactNumber && !errors.contactNumber && formData.contactNumber.length === 10}
              placeholder="9876543210"
              fullWidth
              required
            />
          </Grid>

          {/* Reason */}
          <Grid item xs={12}>
            <EnhancedTextField
              label="Reason for Leave"
              value={formData.reason}
              onChange={(e) => handleChange('reason', e.target.value)}
              error={touched.reason && !!errors.reason}
              helperText={
                touched.reason
                  ? errors.reason || `${formData.reason.length}/500 characters`
                  : 'Minimum 10 characters required'
              }
              showValidation={touched.reason}
              validationSuccess={touched.reason && !errors.reason && formData.reason.length >= 10}
              multiline
              rows={4}
              fullWidth
              required
              inputProps={{ maxLength: 500 }}
            />
          </Grid>

          {/* File Upload */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Supporting Documents (Optional)
            </Typography>
            <EnhancedFileUpload
              accept="image/*,.pdf,.doc,.docx"
              multiple
              maxSize={5}
              onFilesChange={(files) => handleChange('attachments', files)}
              helperText="Accepted formats: Images, PDF, DOC (Max 5MB each)"
            />
          </Grid>

          {/* Submit Button */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
              <GradientButton
                type="button"
                gradientType="secondary"
                onClick={() => {
                  setFormData({
                    leaveType: '',
                    startDate: null,
                    endDate: null,
                    reason: '',
                    contactNumber: '',
                    attachments: [],
                  })
                  setErrors({})
                  setTouched({})
                }}
              >
                Reset
              </GradientButton>
              <GradientButton type="submit" gradientType="primary">
                Submit Application
              </GradientButton>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </GlassCard>
  )
}

export default EnhancedLeaveApplicationForm
