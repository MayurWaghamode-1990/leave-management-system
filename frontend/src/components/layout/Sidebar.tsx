import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  Chip,
  alpha,
  useTheme,
} from '@mui/material'
import {
  Dashboard,
  EventNote,
  CheckCircle,
  Group,
  Assessment,
  Notifications,
  Business,
  People,
  Policy,
  AdminPanelSettings,
  Event,
  Assignment,
  CalendarMonth,
  ContentCopy,
  Schedule,
  Handshake,
  SupervisorAccount,
  AccessTime,
  Person,
} from '@mui/icons-material'

import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/contexts/NotificationContext'
import { useApprovals } from '@/contexts/ApprovalsContext'
import { UserRole } from '@/types'
import Logo from '@/components/common/Logo'

interface SidebarProps {
  drawerWidth: number
  mobileOpen: boolean
  onDrawerToggle: () => void
  isMobile: boolean
}

interface NavigationItem {
  text: string
  icon: React.ReactElement
  path: string
  roles?: UserRole[]
  badge?: string
}

const getNavigationItems = (unreadCount: number, pendingApprovals: number): NavigationItem[] => [
  {
    text: 'Dashboard',
    icon: <Dashboard />,
    path: '/dashboard',
  },
  {
    text: 'My Profile',
    icon: <Person />,
    path: '/profile',
  },
  {
    text: 'My Leaves',
    icon: <EventNote />,
    path: '/leaves',
  },
  {
    text: 'Notifications',
    icon: <Notifications />,
    path: '/notifications',
    badge: unreadCount > 0 ? unreadCount.toString() : undefined,
  },
  {
    text: 'Holidays',
    icon: <Event />,
    path: '/holidays',
  },
  {
    text: 'Calendar',
    icon: <CalendarMonth />,
    path: '/calendar',
  },
  {
    text: 'Templates',
    icon: <ContentCopy />,
    path: '/templates',
  },
  {
    text: 'Drafts',
    icon: <Schedule />,
    path: '/drafts',
  },
  {
    text: 'Delegations',
    icon: <Handshake />,
    path: '/delegations',
  },
  {
    text: 'Leave Without Pay',
    icon: <Assignment />,
    path: '/lwp',
  },
  {
    text: 'Comp Off',
    icon: <AccessTime />,
    path: '/compoff/apply',
  },
  {
    text: 'Manager Dashboard',
    icon: <SupervisorAccount />,
    path: '/manager/dashboard',
    roles: [UserRole.MANAGER, UserRole.HR, UserRole.HR_ADMIN],
    badge: pendingApprovals > 0 ? pendingApprovals.toString() : undefined,
  },
  {
    text: 'Approvals',
    icon: <CheckCircle />,
    path: '/approvals',
    roles: [UserRole.MANAGER, UserRole.HR, UserRole.HR_ADMIN],
    badge: pendingApprovals > 0 ? pendingApprovals.toString() : undefined,
  },
  {
    text: 'Team',
    icon: <Group />,
    path: '/team',
    roles: [UserRole.MANAGER, UserRole.HR, UserRole.HR_ADMIN],
  },
  {
    text: 'Reports',
    icon: <Assessment />,
    path: '/reports',
    roles: [UserRole.MANAGER, UserRole.HR, UserRole.HR_ADMIN, UserRole.PAYROLL_OFFICER],
  },
  {
    text: 'Advanced Requests',
    icon: <Assignment />,
    path: '/advanced-requests',
    roles: [UserRole.MANAGER, UserRole.HR, UserRole.HR_ADMIN],
  },
]

const hrNavigationItems: NavigationItem[] = [
  {
    text: 'Manage Users',
    icon: <People />,
    path: '/hr/users',
    roles: [UserRole.HR, UserRole.HR_ADMIN, UserRole.IT_ADMIN],
  },
  {
    text: 'Leave Policies',
    icon: <Policy />,
    path: '/hr/policies',
    roles: [UserRole.HR, UserRole.HR_ADMIN],
  },
  {
    text: 'Bulk Operations',
    icon: <Assignment />,
    path: '/admin/bulk-operations',
    roles: [UserRole.HR, UserRole.HR_ADMIN, UserRole.IT_ADMIN],
  },
]

const Sidebar: React.FC<SidebarProps> = ({
  drawerWidth,
  mobileOpen,
  onDrawerToggle,
  isMobile,
}) => {
  const { user } = useAuth()
  const { notifications, unreadCount } = useNotifications()
  const { pendingCount } = useApprovals()
  const location = useLocation()
  const navigate = useNavigate()
  const theme = useTheme()

  // Use real API data for pending approvals
  const pendingApprovals = pendingCount

  // Get navigation items with dynamic badges
  const navigationItems = getNavigationItems(unreadCount, pendingApprovals)

  const canAccessItem = (item: NavigationItem) => {
    if (!item.roles) return true
    return user && item.roles.includes(user.role)
  }

  const isActiveRoute = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const handleNavigation = (path: string) => {
    navigate(path)
    if (isMobile) {
      onDrawerToggle()
    }
  }

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 1)} 0%, ${alpha(
          theme.palette.background.paper,
          0.98
        )} 100%)`,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 3,
          textAlign: 'center',
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          mb: 2,
          boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
        }}
      >
        <Logo variant="full" size="small" />
        <Typography
          variant="caption"
          sx={{
            mt: 1,
            display: 'block',
            color: alpha('#ffffff', 0.9),
            fontWeight: 600,
            letterSpacing: '0.5px',
          }}
        >
          Leave Management System
        </Typography>
      </Box>

      {/* Main Navigation */}
      <List sx={{ px: 2, py: 1 }}>
        {navigationItems
          .filter(canAccessItem)
          .map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={isActiveRoute(item.path)}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&.Mui-selected': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    color: 'white',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                    transform: 'translateX(4px)',
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
                      transform: 'translateX(6px)',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                  },
                  '&:hover': {
                    background: alpha(theme.palette.primary.main, 0.08),
                    transform: 'translateX(4px)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isActiveRoute(item.path) ? 'inherit' : 'action.active',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActiveRoute(item.path) ? 600 : 500,
                  }}
                />
                {item.badge && (
                  <Chip
                    label={item.badge}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      background: isActiveRoute(item.path)
                        ? alpha('#ffffff', 0.2)
                        : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      color: 'white',
                      border: isActiveRoute(item.path) ? `1px solid ${alpha('#ffffff', 0.3)}` : 'none',
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          ))}
      </List>

      {/* HR Admin Section */}
      {user && [UserRole.HR, UserRole.HR_ADMIN, UserRole.IT_ADMIN].includes(user.role) && (
        <>
          <Divider sx={{ mx: 2, my: 1 }} />
          <Box sx={{ px: 3, py: 1 }}>
            <Typography
              variant="overline"
              color="textSecondary"
              sx={{
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <AdminPanelSettings fontSize="small" />
              Administration
            </Typography>
          </Box>
          <List sx={{ px: 2 }}>
            {hrNavigationItems
              .filter(canAccessItem)
              .map((item) => (
                <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    selected={isActiveRoute(item.path)}
                    onClick={() => handleNavigation(item.path)}
                    sx={{
                      borderRadius: 2,
                      '&.Mui-selected': {
                        backgroundColor: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': {
                          backgroundColor: 'primary.dark',
                        },
                        '& .MuiListItemIcon-root': {
                          color: 'inherit',
                        },
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 40,
                        color: isActiveRoute(item.path) ? 'inherit' : 'action.active',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontSize: '0.875rem',
                        fontWeight: isActiveRoute(item.path) ? 600 : 400,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
          </List>
        </>
      )}

      {/* Footer */}
      <Box sx={{ mt: 'auto', p: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="textSecondary">
          Version 1.0.0
        </Typography>
      </Box>
    </Box>
  )

  return (
    <Box
      component="nav"
      sx={{ width: { lg: drawerWidth }, flexShrink: { lg: 0 } }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            borderRight: 'none',
            boxShadow: (theme) => theme.shadows[8],
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', lg: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            borderRight: 1,
            borderColor: 'divider',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  )
}

export default Sidebar