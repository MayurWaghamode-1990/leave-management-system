import React from 'react'
import { Card, CardProps, alpha } from '@mui/material'
import { styled } from '@mui/material/styles'

interface GlassCardProps extends CardProps {
  blur?: number
  gradient?: boolean
  hover?: boolean
}

const StyledGlassCard = styled(Card, {
  shouldForwardProp: (prop) => !['blur', 'gradient', 'hover'].includes(prop as string),
})<GlassCardProps>(({ theme, blur = 10, gradient = false, hover = true }) => ({
  background: gradient
    ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(
        theme.palette.background.paper,
        0.5
      )} 100%)`
    : alpha(theme.palette.background.paper, 0.7),
  backdropFilter: `blur(${blur}px)`,
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: `0 8px 32px 0 ${alpha(theme.palette.common.black, 0.1)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',

  '&::before': gradient ? {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '1px',
    background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.3)}, transparent)`,
  } : {},

  ...(hover && {
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: `0 12px 40px 0 ${alpha(theme.palette.common.black, 0.15)}`,
      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    },
  }),
}))

const GlassCard: React.FC<GlassCardProps> = ({ children, ...props }) => {
  return <StyledGlassCard {...props}>{children}</StyledGlassCard>
}

export default GlassCard
