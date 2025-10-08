import React from 'react'
import { TextField, TextFieldProps, alpha, useTheme, InputAdornment, Box } from '@mui/material'
import { CheckCircle, Error as ErrorIcon } from '@mui/icons-material'

interface EnhancedTextFieldProps extends Omit<TextFieldProps, 'variant'> {
  showValidation?: boolean
  validationSuccess?: boolean
}

const EnhancedTextField: React.FC<EnhancedTextFieldProps> = ({
  showValidation = false,
  validationSuccess = false,
  error,
  helperText,
  ...props
}) => {
  const theme = useTheme()

  const getValidationIcon = () => {
    if (!showValidation) return null
    if (error) {
      return (
        <InputAdornment position="end">
          <ErrorIcon sx={{ color: theme.palette.error.main, fontSize: 20 }} />
        </InputAdornment>
      )
    }
    if (validationSuccess) {
      return (
        <InputAdornment position="end">
          <CheckCircle sx={{ color: theme.palette.success.main, fontSize: 20 }} />
        </InputAdornment>
      )
    }
    return null
  }

  return (
    <TextField
      {...props}
      error={error}
      helperText={helperText}
      variant="outlined"
      InputProps={{
        ...props.InputProps,
        endAdornment: getValidationIcon() || props.InputProps?.endAdornment,
      }}
      sx={{
        ...props.sx,
        '& .MuiOutlinedInput-root': {
          borderRadius: 2,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '& fieldset': {
            borderWidth: 2,
            borderColor: error
              ? theme.palette.error.main
              : validationSuccess
                ? theme.palette.success.main
                : theme.palette.divider,
          },
          '&:hover fieldset': {
            borderColor: error
              ? theme.palette.error.main
              : validationSuccess
                ? theme.palette.success.main
                : theme.palette.primary.main,
            boxShadow: `0 0 0 4px ${alpha(
              error
                ? theme.palette.error.main
                : validationSuccess
                  ? theme.palette.success.main
                  : theme.palette.primary.main,
              0.1
            )}`,
          },
          '&.Mui-focused fieldset': {
            borderWidth: 2,
            borderColor: error
              ? theme.palette.error.main
              : validationSuccess
                ? theme.palette.success.main
                : theme.palette.primary.main,
            boxShadow: `0 0 0 4px ${alpha(
              error
                ? theme.palette.error.main
                : validationSuccess
                  ? theme.palette.success.main
                  : theme.palette.primary.main,
              0.15
            )}`,
          },
        },
        '& .MuiInputLabel-root': {
          fontWeight: 500,
          '&.Mui-focused': {
            color: error
              ? theme.palette.error.main
              : validationSuccess
                ? theme.palette.success.main
                : theme.palette.primary.main,
            fontWeight: 600,
          },
        },
        '& .MuiFormHelperText-root': {
          marginLeft: 1,
          marginTop: 1,
          fontWeight: 500,
          fontSize: '0.75rem',
        },
      }}
    />
  )
}

export default EnhancedTextField
