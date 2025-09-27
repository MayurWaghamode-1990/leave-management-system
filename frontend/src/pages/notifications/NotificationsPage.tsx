import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Divider,
  Button,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Notifications,
  CheckCircle,
  Cancel,
  Schedule,
  Info,
  MoreVert,
  FilterList,
  MarkAsUnread,
  Delete
} from '@mui/icons-material';
import { useNotifications, Notification } from '@/contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`notifications-tabpanel-${index}`}
      aria-labelledby={`notifications-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification
  } = useNotifications();
  const [currentTab, setCurrentTab] = useState(0);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [menuAnchor, setMenuAnchor] = useState<{ [key: string]: HTMLElement | null }>({});

  // Filter notifications whenever notifications or filters change

  useEffect(() => {
    filterNotifications();
  }, [notifications, currentTab, filterType]);

  const filterNotifications = () => {
    let filtered = [...notifications];

    // Filter by tab
    if (currentTab === 1) {
      filtered = filtered.filter(n => !n.read);
    } else if (currentTab === 2) {
      filtered = filtered.filter(n => n.read);
    }

    // Filter by type
    if (filterType !== 'ALL') {
      filtered = filtered.filter(n => n.type === filterType);
    }

    setFilteredNotifications(filtered);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate to relevant page
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      toast.success(`Opening ${notification.actionUrl === '/leaves' ? 'Leave Requests' :
                    notification.actionUrl === '/approvals' ? 'Approvals' : 'Dashboard'}`);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'LEAVE_APPROVED':
        return <CheckCircle color="success" />;
      case 'LEAVE_REJECTED':
        return <Cancel color="error" />;
      case 'LEAVE_PENDING':
        return <Schedule color="warning" />;
      case 'INFO':
      default:
        return <Info color="info" />;
    }
  };

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'LEAVE_APPROVED': return 'success';
      case 'LEAVE_REJECTED': return 'error';
      case 'LEAVE_PENDING': return 'warning';
      case 'INFO': return 'info';
      default: return 'default';
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

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, notificationId: string) => {
    event.stopPropagation();
    setMenuAnchor({ ...menuAnchor, [notificationId]: event.currentTarget });
  };

  const handleMenuClose = (notificationId: string) => {
    setMenuAnchor({ ...menuAnchor, [notificationId]: null });
  };


  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Notifications />
            All Notifications
          </Typography>
          <Typography variant="body1" color="textSecondary">
            View and manage all your notifications
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Filter</InputLabel>
            <Select
              value={filterType}
              label="Filter"
              onChange={(e) => setFilterType(e.target.value)}
            >
              <MenuItem value="ALL">All Types</MenuItem>
              <MenuItem value="LEAVE_APPROVED">Approved</MenuItem>
              <MenuItem value="LEAVE_REJECTED">Rejected</MenuItem>
              <MenuItem value="LEAVE_PENDING">Pending</MenuItem>
              <MenuItem value="INFO">Info</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
            Mark All Read ({unreadCount})
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label={`All (${notifications.length})`} />
          <Tab label={`Unread (${unreadCount})`} />
          <Tab label={`Read (${notifications.length - unreadCount})`} />
        </Tabs>
      </Paper>

      {/* Notifications List */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {filteredNotifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Notifications sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No notifications found
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {currentTab === 1 ? 'All caught up! No unread notifications.' :
                 currentTab === 2 ? 'No read notifications yet.' :
                 'No notifications match your current filter.'}
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {filteredNotifications.map((notification, index) => (
                <React.Fragment key={`${notification.id}-${index}`}>
                  <ListItem
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      py: 2,
                      px: 3,
                      backgroundColor: notification.read ? 'transparent' : 'action.hover',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'action.selected',
                      },
                      alignItems: 'flex-start'
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'transparent' }}>
                        {getNotificationIcon(notification.type)}
                      </Avatar>
                    </ListItemAvatar>

                    <ListItemText
                      primary={
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <Typography variant="body1" component="span" fontWeight={notification.read ? 'normal' : 'medium'}>
                            {notification.title}
                          </Typography>
                          <Chip
                            label={notification.type.replace('_', ' ')}
                            size="small"
                            color={getStatusColor(notification.type) as any}
                          />
                          {!notification.read && (
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                backgroundColor: 'var(--mui-palette-primary-main)',
                                borderRadius: '50%',
                                marginLeft: 'auto',
                                display: 'inline-block'
                              }}
                            />
                          )}
                        </span>
                      }
                      secondary={
                        <span>
                          <Typography variant="body2" component="span" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" component="span" color="textSecondary">
                            {formatTimestamp(notification.timestamp)}
                          </Typography>
                        </span>
                      }
                    />

                    <IconButton
                      onClick={(e) => handleMenuOpen(e, notification.id)}
                      size="small"
                    >
                      <MoreVert />
                    </IconButton>

                    <Menu
                      anchorEl={menuAnchor[notification.id]}
                      open={Boolean(menuAnchor[notification.id])}
                      onClose={() => handleMenuClose(notification.id)}
                    >
                      <MenuItem
                        onClick={() => {
                          notification.read ? markAsUnread(notification.id) : markAsRead(notification.id);
                          handleMenuClose(notification.id);
                        }}
                      >
                        <MarkAsUnread fontSize="small" sx={{ mr: 1 }} />
                        Mark as {notification.read ? 'unread' : 'read'}
                      </MenuItem>
                      <MenuItem
                        onClick={() => {
                          deleteNotification(notification.id);
                          handleMenuClose(notification.id);
                        }}
                      >
                        <Delete fontSize="small" sx={{ mr: 1 }} />
                        Delete
                      </MenuItem>
                    </Menu>
                  </ListItem>

                  {index < filteredNotifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default NotificationsPage;