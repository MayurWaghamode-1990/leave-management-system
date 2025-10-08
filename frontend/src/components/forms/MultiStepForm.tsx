import React, { useState } from 'react'
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Paper,
  Typography,
  StepConnector,
  stepConnectorClasses,
  StepIconProps,
  alpha,
  useTheme,
} from '@mui/material'
import { styled } from '@mui/material/styles'
import { Check } from '@mui/icons-material'
import GradientButton from '@/components/common/GradientButton'
import GlassCard from '@/components/common/GlassCard'
import { fadeInUp } from '@/theme/animations'

interface MultiStepFormProps {
  steps: Array<{
    label: string
    description?: string
    icon?: React.ReactElement
    component: React.ReactNode
  }>
  onComplete: (data: any) => void
  onCancel?: () => void
}

const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: theme.palette.divider,
    borderRadius: 1,
  },
}))

const ColorlibStepIconRoot = styled('div')<{
  ownerState: { completed?: boolean; active?: boolean }
}>(({ theme, ownerState }) => ({
  backgroundColor: theme.palette.divider,
  zIndex: 1,
  color: '#fff',
  width: 50,
  height: 50,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  ...(ownerState.active && {
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
    transform: 'scale(1.1)',
  }),
  ...(ownerState.completed && {
    background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
  }),
}))

function ColorlibStepIcon(props: StepIconProps) {
  const { active, completed, className, icon } = props

  return (
    <ColorlibStepIconRoot ownerState={{ completed, active }} className={className}>
      {completed ? <Check /> : icon}
    </ColorlibStepIconRoot>
  )
}

const MultiStepForm: React.FC<MultiStepFormProps> = ({ steps, onComplete, onCancel }) => {
  const [activeStep, setActiveStep] = useState(0)
  const [formData, setFormData] = useState<any>({})
  const theme = useTheme()

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      onComplete(formData)
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1)
    }
  }

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1)
  }

  const handleReset = () => {
    setActiveStep(0)
    setFormData({})
  }

  return (
    <GlassCard gradient sx={{ p: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Multi-Step Form
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Complete all steps to submit your request
        </Typography>
      </Box>

      <Stepper activeStep={activeStep} connector={<ColorlibConnector />} sx={{ mb: 4 }}>
        {steps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel
              StepIconComponent={ColorlibStepIcon}
              sx={{
                '& .MuiStepLabel-label': {
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  '&.Mui-active': {
                    fontWeight: 700,
                    color: theme.palette.primary.main,
                  },
                  '&.Mui-completed': {
                    fontWeight: 600,
                    color: theme.palette.success.main,
                  },
                },
              }}
            >
              {step.label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box
        sx={{
          minHeight: 300,
          mb: 3,
          animation: `${fadeInUp} 0.4s cubic-bezier(0.4, 0, 0.2, 1)`,
        }}
      >
        {steps[activeStep].description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {steps[activeStep].description}
          </Typography>
        )}
        {steps[activeStep].component}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, pt: 3, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
        <Box>
          {onCancel && (
            <Button onClick={onCancel} sx={{ mr: 1 }}>
              Cancel
            </Button>
          )}
          <Button disabled={activeStep === 0} onClick={handleBack}>
            Back
          </Button>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {activeStep === steps.length - 1 ? (
            <GradientButton gradientType="success" onClick={handleNext}>
              Submit
            </GradientButton>
          ) : (
            <GradientButton gradientType="primary" onClick={handleNext}>
              Next
            </GradientButton>
          )}
        </Box>
      </Box>
    </GlassCard>
  )
}

export default MultiStepForm
