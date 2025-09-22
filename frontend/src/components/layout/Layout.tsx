import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Box, useMediaQuery, useTheme } from '@mui/material'
import AppBar from './AppBar'
import Sidebar from './Sidebar'
import LiveStatusIndicator from '../notifications/LiveStatusIndicator'

const DRAWER_WIDTH = 280

const Layout: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'))
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <AppBar
        onMenuClick={handleDrawerToggle}
        drawerWidth={DRAWER_WIDTH}
      />

      {/* Sidebar */}
      <Sidebar
        drawerWidth={DRAWER_WIDTH}
        mobileOpen={mobileOpen}
        onDrawerToggle={handleDrawerToggle}
        isMobile={isMobile}
      />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { lg: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        {/* Toolbar spacer */}
        <Box sx={{ height: 64 }} />

        {/* Page Content */}
        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            maxWidth: '100%',
            overflow: 'hidden',
          }}
        >
          <Outlet />
        </Box>
      </Box>

      {/* Live Status Indicator */}
      <LiveStatusIndicator
        position="bottom-right"
        variant="minimal"
        showLastActivity={true}
      />
    </Box>
  )
}

export default Layout