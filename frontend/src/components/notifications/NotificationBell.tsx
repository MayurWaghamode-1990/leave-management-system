import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Chip,
  Divider,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button
} from '@mui/material';
import {
  Notifications,
  NotificationsNone,
  CheckCircle,
  Cancel,
  Schedule,
  Info,
  Clear,
  WifiOff,
  Wifi
} from '@mui/icons-material';
import { useNotifications } from '@/contexts/NotificationContext';
import toast from 'react-hot-toast';

const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, isRealtimeConnected } = useNotifications();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Show only first 5 notifications in dropdown
  const displayNotifications = notifications.slice(0, 5);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(notificationId);
  };

  const handleClearAll = () => {
    markAllAsRead();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'LEAVE_APPROVED':
        return <CheckCircle color="success" fontSize="small" />;
      case 'LEAVE_REJECTED':
        return <Cancel color="error" fontSize="small" />;
      case 'LEAVE_PENDING':
        return <Schedule color="warning" fontSize="small" />;
      case 'INFO':
      default:
        return <Info color="info" fontSize="small" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <Box sx={{ position: 'relative' }}>
        <IconButton
          color="inherit"
          onClick={handleClick}
          sx={{ mr: 1 }}
        >
          <Badge badgeContent={unreadCount} color="error">
            {unreadCount > 0 ? <Notifications /> : <NotificationsNone />}
          </Badge>
        </IconButton>

        {/* Real-time connection indicator */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: isRealtimeConnected ? '#4caf50' : '#f44336',
            border: '1px solid white',
            boxShadow: 1
          }}
          title={isRealtimeConnected ? 'Real-time notifications active' : 'Real-time notifications offline'}
        />
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 380,
            maxWidth: '90vw', // Ensure it doesn't exceed viewport width
            maxHeight: 480,
            overflow: 'auto', // Changed from 'visible' to 'auto' to handle overflow
            '&::before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider', position: 'relative' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">
              Notifications
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {isRealtimeConnected ? (
                <Wifi sx={{ fontSize: 16, color: 'success.main' }} />
              ) : (
                <WifiOff sx={{ fontSize: 16, color: 'error.main' }} />
              )}
              <Typography variant="caption" color={isRealtimeConnected ? 'success.main' : 'error.main'}>
                {isRealtimeConnected ? 'Live' : 'Offline'}
              </Typography>
            </Box>
          </Box>
          {unreadCount > 0 && (
            <Button
              size="small"
              onClick={handleClearAll}
              sx={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '0.75rem'
              }}
            >
              Mark all read
            </Button>
          )}
        </Box>

        {displayNotifications.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
              No notifications
            </Typography>
          </MenuItem>
        ) : (
          displayNotifications.map((notification, index) => (
            <React.Fragment key={notification.id}>
              <MenuItem
                onClick={() => {
                  if (!notification.read) {
                    handleMarkAsRead(notification.id);
                  }
                  handleClose();

                  // Navigate based on notification type
                  if (notification.type === 'LEAVE_PENDING') {
                    navigate('/approvals');
                    toast.success('Opening approvals page');
                  } else if (notification.type === 'LEAVE_APPROVED' || notification.type === 'LEAVE_REJECTED') {
                    navigate('/leaves');
                    toast.success('Opening leave requests');
                  } else {
                    navigate('/dashboard');
                    toast.success('Opening dashboard');
                  }
                }}
                sx={{
                  alignItems: 'flex-start',
                  py: 2,
                  px: 2,
                  width: '100%',
                  maxWidth: '100%',
                  backgroundColor: notification.read ? 'transparent' : 'action.hover',
                  '&:hover': {
                    backgroundColor: 'action.selected',
                  },
                }}
              >
                <ListItemAvatar sx={{ minWidth: 40 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'transparent' }}>
                    {getNotificationIcon(notification.type)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    maxWidth: 'calc(100% - 48px)', // Account for avatar width
                  }}
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                      <Typography variant="body2" fontWeight="medium" noWrap sx={{ flex: 1, minWidth: 0 }}>
                        {notification.title}
                      </Typography>
                      {!notification.read && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            backgroundColor: 'primary.main',
                            borderRadius: '50%',
                            flexShrink: 0
                          }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{
                          mb: 0.5,
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word',
                          whiteSpace: 'normal'
                        }}
                      >
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {formatTimestamp(notification.timestamp)}
                      </Typography>
                    </>
                  }
                />
              </MenuItem>
              {index < displayNotifications.length - 1 && <Divider />}
            </React.Fragment>
          ))
        )}

        {notifications.length > 0 && (
          <>
            <Divider />
            <MenuItem
              onClick={() => {
                handleClose();
                navigate('/notifications');
                toast.success('Opening all notifications');
              }}
              sx={{
                justifyContent: 'center',
                py: 1.5,
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <Typography variant="body2" color="primary" fontWeight="medium">
                View all notifications
              </Typography>
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  );
};

export default NotificationBell;