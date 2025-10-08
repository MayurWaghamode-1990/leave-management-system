import React, { ReactNode } from 'react'
import { Box } from '@mui/material'
import { fadeInUp } from '@/theme/animations'

interface PageTransitionProps {
  children: ReactNode
  delay?: number
}

const PageTransition: React.FC<PageTransitionProps> = ({ children, delay = 0 }) => {
  return (
    <Box
      sx={{
        animation: `${fadeInUp} 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms both`,
      }}
    >
      {children}
    </Box>
  )
}

export default PageTransition
