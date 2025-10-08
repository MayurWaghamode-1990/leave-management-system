import React from 'react'
import { TextField, TextFieldProps, alpha, useTheme } from '@mui/material'
import { DatePicker, DatePickerProps } from '@mui/x-date-pickers/DatePicker'
import { Dayjs } from 'dayjs'
import { CalendarMonth } from '@mui/icons-material'

interface EnhancedDatePickerProps extends Omit<DatePickerProps<Dayjs>, 'renderInput'> {
  error?: boolean
  helperText?: string
  fullWidth?: boolean
}

const EnhancedDatePicker: React.FC<EnhancedDatePickerProps> = ({
  error,
  helperText,
  fullWidth = true,
  ...datePickerProps
}) => {
  const theme = useTheme()

  return (
    <DatePicker
      {...datePickerProps}
      slots={{
        openPickerIcon: CalendarMonth,
      }}
      slotProps={{
          textField: {
            fullWidth,
            error,
            helperText,
            sx: {
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '& fieldset': {
                  borderWidth: 2,
                  borderColor: error ? theme.palette.error.main : theme.palette.divider,
                },
                '&:hover fieldset': {
                  borderColor: error ? theme.palette.error.main : theme.palette.primary.main,
                  boxShadow: `0 0 0 4px ${alpha(
                    error ? theme.palette.error.main : theme.palette.primary.main,
                    0.1
                  )}`,
                },
                '&.Mui-focused fieldset': {
                  borderWidth: 2,
                  borderColor: error ? theme.palette.error.main : theme.palette.primary.main,
                  boxShadow: `0 0 0 4px ${alpha(
                    error ? theme.palette.error.main : theme.palette.primary.main,
                    0.15
                  )}`,
                },
              },
              '& .MuiInputLabel-root': {
                fontWeight: 500,
                '&.Mui-focused': {
                  color: error ? theme.palette.error.main : theme.palette.primary.main,
                  fontWeight: 600,
                },
              },
            },
          } as TextFieldProps,
          openPickerButton: {
            sx: {
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.1)',
              },
            },
          },
          popper: {
            sx: {
              '& .MuiPaper-root': {
                borderRadius: 3,
                boxShadow: `0 12px 40px ${alpha(theme.palette.common.black, 0.15)}`,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                overflow: 'hidden',
              },
              '& .MuiPickersDay-root': {
                borderRadius: 2,
                fontWeight: 500,
                transition: 'all 0.2s',
                '&:hover': {
                  background: alpha(theme.palette.primary.main, 0.1),
                  transform: 'scale(1.05)',
                },
                '&.Mui-selected': {
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  fontWeight: 700,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
                  },
                },
              },
              '& .MuiPickersCalendarHeader-root': {
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.primary.main,
                  0.1
                )} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                paddingTop: 2,
                paddingBottom: 2,
              },
            },
          },
        }}
      />
  )
}

export default EnhancedDatePicker
