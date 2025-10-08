import React, { useState } from 'react'
import {
  AppBar as MuiAppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Badge,
  Tooltip,
  alpha,
  useTheme,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Notifications,
  AccountCircle,
  Logout,
  Person,
} from '@mui/icons-material'
import { useAuth } from '@/hooks/useAuth'
import NotificationCenter from '../notifications/NotificationCenter'
import Logo from '@/components/common/Logo'

interface AppBarProps {
  onMenuClick: () => void
  drawerWidth: number
}

const AppBar: React.FC<AppBarProps> = ({ onMenuClick, drawerWidth }) => {
  const { user, logout } = useAuth()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const theme = useTheme()

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    handleMenuClose()
    logout()
  }

  const getUserDisplayName = () => {
    if (!user) return ''
    return `${user.firstName} ${user.lastName}`
  }

  const getUserInitials = () => {
    if (!user) return ''
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'HR_ADMIN':
        return 'HR Admin'
      case 'PAYROLL_OFFICER':
        return 'Payroll Officer'
      case 'IT_ADMIN':
        return 'IT Admin'
      default:
        return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
    }
  }

  return (
    <MuiAppBar
      position="fixed"
      sx={{
        width: { lg: `calc(100% - ${drawerWidth}px)` },
        ml: { lg: `${drawerWidth}px` },
        background: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(20px)',
        color: theme.palette.text.primary,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.05)}`,
      }}
    >
      <Toolbar>
        {/* Mobile Menu Button */}
        <IconButton
          edge="start"
          color="inherit"
          aria-label="open drawer"
          onClick={onMenuClick}
          sx={{ mr: 2, display: { lg: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        {/* Title */}
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <Box sx={{ display: { xs: 'block', lg: 'none' }, mr: 2 }}>
            <Logo variant="compact" size="small" />
          </Box>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ display: { xs: 'none', sm: 'block' } }}
          >
            Leave Management System
          </Typography>
        </Box>

        {/* User info and actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Current user info */}
          <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'right', mr: 2 }}>
            <Typography variant="body2" fontWeight="medium">
              {getUserDisplayName()}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {user && getRoleDisplayName(user.role)} • {user?.location}
            </Typography>
          </Box>

          {/* Notifications */}
          <NotificationCenter />

          {/* Profile Menu */}
          <Tooltip title="Account">
            <IconButton
              onClick={handleProfileMenuOpen}
              aria-label="account"
              aria-controls="profile-menu"
              aria-haspopup="true"
              sx={{
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.05)',
                },
              }}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  boxShadow: `0 4px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
                }}
              >
                {getUserInitials()}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>

      {/* Profile Menu */}
      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        sx={{ mt: 1 }}
      >
        <MenuItem>
          <Person fontSize="small" sx={{ mr: 1 }} />
          Profile
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <Logout fontSize="small" sx={{ mr: 1 }} />
          Logout
        </MenuItem>
      </Menu>

    </MuiAppBar>
  )
}

export default AppBar