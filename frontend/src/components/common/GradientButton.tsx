import React from 'react'
import { Button, ButtonProps } from '@mui/material'
import { styled } from '@mui/material/styles'

interface GradientButtonProps extends ButtonProps {
  gradientType?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'
}

const gradients = {
  primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  success: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  error: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  warning: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  info: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
}

const StyledGradientButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'gradientType',
})<GradientButtonProps>(({ gradientType = 'primary' }) => ({
  background: gradients[gradientType],
  backgroundSize: '200% auto',
  color: '#ffffff',
  border: 'none',
  fontWeight: 600,
  padding: '12px 32px',
  borderRadius: '10px',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',

  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
    transition: 'left 0.5s',
  },

  '&:hover': {
    backgroundPosition: 'right center',
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',

    '&::before': {
      left: '100%',
    },
  },

  '&:active': {
    transform: 'translateY(0)',
  },

  '&.Mui-disabled': {
    background: '#cccccc',
    color: '#666666',
  },
}))

const GradientButton: React.FC<GradientButtonProps> = ({ children, gradientType = 'primary', ...props }) => {
  return (
    <StyledGradientButton gradientType={gradientType} {...props}>
      {children}
    </StyledGradientButton>
  )
}

export default GradientButton
