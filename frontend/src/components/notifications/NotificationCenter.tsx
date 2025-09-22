import React, { useState, useEffect, useRef } from 'react';
import {
  Badge,
  IconButton,
  Popover,
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Chip,
  Button,
  Divider,
  Paper,
  Menu,
  MenuItem,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  Tooltip,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive,
  NotificationsOff,
  Circle,
  CheckCircle,
  Cancel,
  Schedule,
  EventNote,
  Group,
  Settings,
  VolumeUp,
  VolumeOff,
  MarkEmailRead,
  DeleteSweep,
  FilterList,
  Refresh
} from '@mui/icons-material';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/hooks/useAuth';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface NotificationCenterProps {
  enableSound?: boolean;
  enableDesktopNotifications?: boolean;
}

interface NotificationSettings {
  sound: boolean;
  desktop: boolean;
  email: boolean;
  leaveApprovals: boolean;
  leaveRequests: boolean;
  teamUpdates: boolean;
  systemAlerts: boolean;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  enableSound = true,
  enableDesktopNotifications = true
}) => {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [lastNotificationCount, setLastNotificationCount] = useState(unreadCount);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [settings, setSettings] = useState<NotificationSettings>({
    sound: enableSound,
    desktop: enableDesktopNotifications,
    email: true,
    leaveApprovals: true,
    leaveRequests: true,
    teamUpdates: true,
    systemAlerts: true
  });

  const open = Boolean(anchorEl);
  const settingsOpen = Boolean(settingsAnchorEl);

  useEffect(() => {
    // Initialize audio for notification sounds
    audioRef.current = new Audio('/notification-sound.mp3');
    audioRef.current.volume = 0.3;

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    // Check for new notifications
    if (unreadCount > lastNotificationCount && lastNotificationCount > 0) {
      const newNotifications = notifications
        .filter(n => !n.read)
        .slice(0, unreadCount - lastNotificationCount);

      if (newNotifications.length > 0) {
        handleNewNotification(newNotifications[0]);
      }
    }
    setLastNotificationCount(unreadCount);
  }, [unreadCount, lastNotificationCount, notifications]);

  const handleNewNotification = (notification: any) => {
    // Play sound if enabled
    if (settings.sound && audioRef.current) {
      audioRef.current.play().catch(console.error);
    }

    // Show desktop notification if enabled and permitted
    if (settings.desktop && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Leave Management System', {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
        requireInteraction: false
      });
    }

    // Show in-app snackbar
    setSnackbarMessage(`New ${notification.type.toLowerCase().replace('_', ' ')}: ${notification.message}`);
    setShowSnackbar(true);
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSettingsClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setSettingsAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };

  const handleNotificationClick = (notificationId: string) => {
    markAsRead(notificationId);
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
    setSnackbarMessage('All notifications marked as read');
    setShowSnackbar(true);
  };

  const handleSettingChange = (setting: keyof NotificationSettings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'LEAVE_REQUEST':
        return <EventNote color="primary" />;
      case 'LEAVE_APPROVED':
        return <CheckCircle color="success" />;
      case 'LEAVE_REJECTED':
        return <Cancel color="error" />;
      case 'LEAVE_CANCELLED':
        return <Schedule color="warning" />;
      case 'TEAM_UPDATE':
        return <Group color="info" />;
      default:
        return <Circle color="action" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'LEAVE_REQUEST':
        return 'primary';
      case 'LEAVE_APPROVED':
        return 'success';
      case 'LEAVE_REJECTED':
        return 'error';
      case 'LEAVE_CANCELLED':
        return 'warning';
      case 'TEAM_UPDATE':
        return 'info';
      default:
        return 'default';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filterType === 'all') return true;
    if (filterType === 'unread') return !notification.read;
    if (filterType === 'read') return notification.read;
    return notification.type === filterType;
  });

  const hasUnreadNotifications = unreadCount > 0;

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          onClick={handleClick}
          color="inherit"
          sx={{
            '&:hover': {
              backgroundColor: 'action.hover'
            }
          }}
        >
          <Badge
            badgeContent={unreadCount}
            color="error"
            variant={hasUnreadNotifications ? 'standard' : 'dot'}
            invisible={unreadCount === 0}
          >
            {hasUnreadNotifications ? (
              <NotificationsActive
                sx={{
                  color: 'text.primary',
                  animation: unreadCount > lastNotificationCount ? 'pulse 2s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.1)' },
                    '100%': { transform: 'scale(1)' }
                  }
                }}
              />
            ) : (
              <NotificationsIcon sx={{ color: 'text.primary' }} />
            )}
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { width: 400, maxHeight: 600 }
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Notifications
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Refresh">
                <IconButton size="small" onClick={() => window.location.reload()}>
                  <Refresh />
                </IconButton>
              </Tooltip>
              <Tooltip title="Settings">
                <IconButton size="small" onClick={handleSettingsClick}>
                  <Settings />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Filter Chips */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {['all', 'unread', 'LEAVE_REQUEST', 'LEAVE_APPROVED', 'TEAM_UPDATE'].map((filter) => (
              <Chip
                key={filter}
                label={filter === 'all' ? 'All' : filter === 'unread' ? 'Unread' : filter.replace('_', ' ')}
                size="small"
                variant={filterType === filter ? 'filled' : 'outlined'}
                onClick={() => setFilterType(filter)}
                color={filterType === filter ? 'primary' : 'default'}
              />
            ))}
          </Box>

          {/* Action Buttons */}
          {unreadCount > 0 && (
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<MarkEmailRead />}
                onClick={handleMarkAllRead}
                fullWidth
              >
                Mark All Read
              </Button>
            </Box>
          )}
        </Box>

        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {filteredNotifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <NotificationsOff sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2" color="textSecondary">
                {filterType === 'unread' ? 'No unread notifications' : 'No notifications found'}
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {filteredNotifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    button
                    onClick={() => handleNotificationClick(notification.id)}
                    sx={{
                      backgroundColor: notification.read ? 'transparent' : 'action.hover',
                      '&:hover': {
                        backgroundColor: 'action.selected'
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: `${getNotificationColor(notification.type)}.main`,
                          width: 32,
                          height: 32
                        }}
                      >
                        {getNotificationIcon(notification.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="body2"
                            fontWeight={notification.read ? 'normal' : 'bold'}
                            sx={{ flex: 1 }}
                          >
                            {notification.message}
                          </Typography>
                          {!notification.read && (
                            <Circle sx={{ fontSize: 8, color: 'primary.main' }} />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                          <Typography variant="caption" color="textSecondary">
                            {dayjs(notification.createdAt).fromNow()}
                          </Typography>
                          <Chip
                            label={notification.type.replace('_', ' ')}
                            size="small"
                            variant="outlined"
                            color={getNotificationColor(notification.type) as any}
                            sx={{ fontSize: '0.65rem', height: 18 }}
                          />
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                        >
                          <DeleteSweep fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < filteredNotifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      </Popover>

      {/* Settings Menu */}
      <Menu
        anchorEl={settingsAnchorEl}
        open={settingsOpen}
        onClose={handleSettingsClose}
        PaperProps={{
          sx: { width: 280 }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Notification Settings
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={settings.sound}
                onChange={() => handleSettingChange('sound')}
                icon={<VolumeOff />}
                checkedIcon={<VolumeUp />}
              />
            }
            label="Sound Notifications"
          />

          <FormControlLabel
            control={
              <Switch
                checked={settings.desktop}
                onChange={() => handleSettingChange('desktop')}
              />
            }
            label="Desktop Notifications"
          />

          <Divider sx={{ my: 1 }} />

          <Typography variant="body2" color="textSecondary" gutterBottom>
            Notification Types
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={settings.leaveApprovals}
                onChange={() => handleSettingChange('leaveApprovals')}
              />
            }
            label="Leave Approvals"
          />

          <FormControlLabel
            control={
              <Switch
                checked={settings.leaveRequests}
                onChange={() => handleSettingChange('leaveRequests')}
              />
            }
            label="Leave Requests"
          />

          <FormControlLabel
            control={
              <Switch
                checked={settings.teamUpdates}
                onChange={() => handleSettingChange('teamUpdates')}
              />
            }
            label="Team Updates"
          />

          <FormControlLabel
            control={
              <Switch
                checked={settings.systemAlerts}
                onChange={() => handleSettingChange('systemAlerts')}
              />
            }
            label="System Alerts"
          />
        </Box>
      </Menu>

      {/* Snackbar for in-app notifications */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={4000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setShowSnackbar(false)}
          severity="info"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default NotificationCenter;