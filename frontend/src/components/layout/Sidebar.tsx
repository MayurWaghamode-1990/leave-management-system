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
    text: 'Manager Dashboard',
    icon: <SupervisorAccount />,
    path: '/manager/dashboard',
    roles: [UserRole.MANAGER, UserRole.HR_ADMIN],
    badge: pendingApprovals > 0 ? pendingApprovals.toString() : undefined,
  },
  {
    text: 'Approvals',
    icon: <CheckCircle />,
    path: '/approvals',
    roles: [UserRole.MANAGER, UserRole.HR_ADMIN],
    badge: pendingApprovals > 0 ? pendingApprovals.toString() : undefined,
  },
  {
    text: 'Team',
    icon: <Group />,
    path: '/team',
    roles: [UserRole.MANAGER, UserRole.HR_ADMIN],
  },
  {
    text: 'Reports',
    icon: <Assessment />,
    path: '/reports',
    roles: [UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.PAYROLL_OFFICER],
  },
  {
    text: 'Advanced Requests',
    icon: <Assignment />,
    path: '/advanced-requests',
    roles: [UserRole.MANAGER, UserRole.HR_ADMIN],
  },
]

const hrNavigationItems: NavigationItem[] = [
  {
    text: 'Manage Users',
    icon: <People />,
    path: '/hr/users',
    roles: [UserRole.HR_ADMIN, UserRole.IT_ADMIN],
  },
  {
    text: 'Leave Policies',
    icon: <Policy />,
    path: '/hr/policies',
    roles: [UserRole.HR_ADMIN],
  },
  {
    text: 'Bulk Operations',
    icon: <Assignment />,
    path: '/admin/bulk-operations',
    roles: [UserRole.HR_ADMIN, UserRole.IT_ADMIN],
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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Logo variant="full" size="small" />
        <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
          Leave Management System
        </Typography>
      </Box>

      <Divider />

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
                {item.badge && (
                  <Chip
                    label={item.badge}
                    size="small"
                    color="error"
                    sx={{
                      height: 20,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          ))}
      </List>

      {/* HR Admin Section */}
      {user && [UserRole.HR_ADMIN, UserRole.IT_ADMIN].includes(user.role) && (
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