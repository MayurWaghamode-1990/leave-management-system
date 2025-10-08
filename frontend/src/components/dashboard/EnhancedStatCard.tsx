import React from 'react'
import { Card, CardContent, Box, Typography, alpha, useTheme } from '@mui/material'
import AnimatedCounter from '@/components/common/AnimatedCounter'
import { fadeInUp } from '@/theme/animations'

interface EnhancedStatCardProps {
  title: string
  value: number
  icon: React.ReactElement
  color?: string
  gradient?: string
  subtitle?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  delay?: number
}

const EnhancedStatCard: React.FC<EnhancedStatCardProps> = ({
  title,
  value,
  icon,
  color,
  gradient,
  subtitle,
  trend,
  delay = 0,
}) => {
  const theme = useTheme()
  const cardColor = color || theme.palette.primary.main
  const cardGradient = gradient || `linear-gradient(135deg, ${cardColor} 0%, ${alpha(cardColor, 0.7)} 100%)`

  return (
    <Card
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(
          theme.palette.background.paper,
          0.95
        )} 100%)`,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        animation: `${fadeInUp} 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms both`,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: cardGradient,
        },
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: `0 12px 40px ${alpha(cardColor, 0.2)}`,
          '& .stat-icon-wrapper': {
            transform: 'scale(1.1) rotate(5deg)',
          },
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontSize: '0.75rem',
                mb: 1,
              }}
            >
              {title}
            </Typography>
            <AnimatedCounter
              value={value}
              variant="h3"
              sx={{
                fontWeight: 800,
                background: cardGradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                mb: 0.5,
              }}
            />
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 0.5 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: trend.isPositive ? theme.palette.success.main : theme.palette.error.main,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  vs last month
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            className="stat-icon-wrapper"
            sx={{
              width: 64,
              height: 64,
              borderRadius: 3,
              background: cardGradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: `0 8px 16px ${alpha(cardColor, 0.3)}`,
            }}
          >
            {React.cloneElement(icon, {
              sx: { fontSize: 32, color: 'white' },
            })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default EnhancedStatCard
