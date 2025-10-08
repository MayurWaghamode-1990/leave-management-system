import React from 'react'
import {
  FormControl,
  InputLabel,
  Select,
  SelectProps,
  MenuItem,
  FormHelperText,
  alpha,
  useTheme,
  Box,
  Chip,
} from '@mui/material'
import { KeyboardArrowDown } from '@mui/icons-material'

interface EnhancedSelectProps extends SelectProps {
  helperText?: string
  options: Array<{ value: string | number; label: string; icon?: React.ReactElement }>
  showChips?: boolean
}

const EnhancedSelect: React.FC<EnhancedSelectProps> = ({
  label,
  error,
  helperText,
  options,
  showChips = false,
  ...selectProps
}) => {
  const theme = useTheme()

  return (
    <FormControl fullWidth error={error}>
      <InputLabel
        sx={{
          fontWeight: 500,
          '&.Mui-focused': {
            color: error ? theme.palette.error.main : theme.palette.primary.main,
            fontWeight: 600,
          },
        }}
      >
        {label}
      </InputLabel>
      <Select
        {...selectProps}
        label={label}
        IconComponent={KeyboardArrowDown}
        renderValue={
          showChips && selectProps.multiple
            ? (selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((value) => {
                    const option = options.find((opt) => opt.value === value)
                    return (
                      <Chip
                        key={value}
                        label={option?.label || value}
                        size="small"
                        sx={{
                          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                          color: 'white',
                          fontWeight: 600,
                        }}
                      />
                    )
                  })}
                </Box>
              )
            : selectProps.renderValue
        }
        sx={{
          borderRadius: 2,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '& .MuiOutlinedInput-notchedOutline': {
            borderWidth: 2,
            borderColor: error ? theme.palette.error.main : theme.palette.divider,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: error ? theme.palette.error.main : theme.palette.primary.main,
            boxShadow: `0 0 0 4px ${alpha(
              error ? theme.palette.error.main : theme.palette.primary.main,
              0.1
            )}`,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: 2,
            borderColor: error ? theme.palette.error.main : theme.palette.primary.main,
            boxShadow: `0 0 0 4px ${alpha(
              error ? theme.palette.error.main : theme.palette.primary.main,
              0.15
            )}`,
          },
          '& .MuiSelect-icon': {
            transition: 'transform 0.3s',
          },
          '&.Mui-focused .MuiSelect-icon': {
            transform: 'rotate(180deg)',
          },
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              borderRadius: 2,
              boxShadow: `0 12px 40px ${alpha(theme.palette.common.black, 0.15)}`,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              mt: 1,
              '& .MuiMenuItem-root': {
                borderRadius: 1,
                margin: '4px 8px',
                transition: 'all 0.2s',
                '&:hover': {
                  background: alpha(theme.palette.primary.main, 0.1),
                  transform: 'translateX(4px)',
                },
                '&.Mui-selected': {
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.primary.main,
                    0.15
                  )} 0%, ${alpha(theme.palette.secondary.main, 0.15)} 100%)`,
                  fontWeight: 600,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.primary.main,
                      0.2
                    )} 0%, ${alpha(theme.palette.secondary.main, 0.2)} 100%)`,
                  },
                },
              },
            },
          },
        }}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {option.icon && <Box sx={{ display: 'flex', color: theme.palette.primary.main }}>{option.icon}</Box>}
              {option.label}
            </Box>
          </MenuItem>
        ))}
      </Select>
      {helperText && (
        <FormHelperText
          sx={{
            marginLeft: 1,
            marginTop: 1,
            fontWeight: 500,
            fontSize: '0.75rem',
          }}
        >
          {helperText}
        </FormHelperText>
      )}
    </FormControl>
  )
}

export default EnhancedSelect
