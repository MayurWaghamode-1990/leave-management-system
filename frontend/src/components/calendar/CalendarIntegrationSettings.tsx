import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Switch,
  Button,
  IconButton,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  CircularProgress,
  Tooltip,
  Link
} from '@mui/material';
import {
  Google,
  Microsoft,
  CalendarMonth,
  Launch,
  Refresh,
  Delete,
  Download,
  Info,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import api from '@/config/api';
import toast from 'react-hot-toast';

interface CalendarIntegration {
  provider: 'google' | 'outlook';
  enabled: boolean;
  calendarId?: string;
  createdAt: string;
  updatedAt: string;
}

const CalendarIntegrationSettings: React.FC = () => {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState<{
    open: boolean;
    provider?: 'google' | 'outlook';
  }>({ open: false });

  // Fetch current integrations
  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/calendar/integrations');
      if (response.data.success) {
        setIntegrations(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching calendar integrations:', error);
      toast.error('Failed to load calendar integrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  // Get integration status
  const getIntegrationStatus = (provider: 'google' | 'outlook') => {
    return integrations.find(int => int.provider === provider);
  };

  // Connect Google Calendar
  const connectGoogleCalendar = async () => {
    try {
      setActionLoading('google');

      // Get authorization URL
      const response = await api.get('/calendar/google/auth-url');
      if (response.data.success) {
        const authUrl = response.data.data.authUrl;

        // Open popup window for OAuth
        const popup = window.open(
          authUrl,
          'google-auth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        // Listen for popup completion
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            // Check if authentication was successful
            setTimeout(() => {
              fetchIntegrations();
              setActionLoading(null);
            }, 1000);
          }
        }, 1000);

        // Handle message from popup
        const handleMessage = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;

          if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
            popup?.close();
            toast.success('Google Calendar connected successfully!');
            fetchIntegrations();
          } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
            popup?.close();
            toast.error('Failed to connect Google Calendar');
          }

          window.removeEventListener('message', handleMessage);
          setActionLoading(null);
        };

        window.addEventListener('message', handleMessage);

        // Timeout after 5 minutes
        setTimeout(() => {
          if (!popup?.closed) {
            popup?.close();
            clearInterval(checkClosed);
            window.removeEventListener('message', handleMessage);
            setActionLoading(null);
            toast.error('Authentication timed out');
          }
        }, 300000);

      }
    } catch (error: any) {
      console.error('Error connecting Google Calendar:', error);
      toast.error('Failed to connect Google Calendar');
      setActionLoading(null);
    }
  };

  // Connect Outlook Calendar
  const connectOutlookCalendar = async () => {
    try {
      setActionLoading('outlook');

      // Get authorization URL
      const response = await api.get('/calendar/outlook/auth-url');
      if (response.data.success) {
        const authUrl = response.data.data.authUrl;

        // Open popup window for OAuth
        const popup = window.open(
          authUrl,
          'outlook-auth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        // Listen for popup completion
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            // Check if authentication was successful
            setTimeout(() => {
              fetchIntegrations();
              setActionLoading(null);
            }, 1000);
          }
        }, 1000);

        // Handle message from popup
        const handleMessage = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;

          if (event.data.type === 'OUTLOOK_AUTH_SUCCESS') {
            popup?.close();
            toast.success('Outlook Calendar connected successfully!');
            fetchIntegrations();
          } else if (event.data.type === 'OUTLOOK_AUTH_ERROR') {
            popup?.close();
            toast.error('Failed to connect Outlook Calendar');
          }

          window.removeEventListener('message', handleMessage);
          setActionLoading(null);
        };

        window.addEventListener('message', handleMessage);

        // Timeout after 5 minutes
        setTimeout(() => {
          if (!popup?.closed) {
            popup?.close();
            clearInterval(checkClosed);
            window.removeEventListener('message', handleMessage);
            setActionLoading(null);
            toast.error('Authentication timed out');
          }
        }, 300000);

      }
    } catch (error: any) {
      console.error('Error connecting Outlook Calendar:', error);
      toast.error('Failed to connect Outlook Calendar');
      setActionLoading(null);
    }
  };

  // Disconnect calendar
  const disconnectCalendar = async (provider: 'google' | 'outlook') => {
    try {
      setActionLoading(provider);
      const response = await api.delete(`/calendar/disconnect/${provider}`);

      if (response.data.success) {
        toast.success(`${provider === 'google' ? 'Google' : 'Outlook'} Calendar disconnected`);
        fetchIntegrations();
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error(`Error disconnecting ${provider} calendar:`, error);
      toast.error(`Failed to disconnect ${provider === 'google' ? 'Google' : 'Outlook'} Calendar`);
    } finally {
      setActionLoading(null);
      setShowDisconnectDialog({ open: false });
    }
  };

  // Download iCal feed
  const downloadICalFeed = () => {
    if (user?.id) {
      const url = `${api.defaults.baseURL}/calendar/ical/${user.id}`;
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Card>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarMonth />
              <Typography variant="h6">Calendar Integration</Typography>
            </Box>
          }
          subheader="Connect your external calendars to automatically sync leave requests"
          action={
            <Button
              startIcon={<Refresh />}
              onClick={fetchIntegrations}
              disabled={!!actionLoading}
            >
              Refresh
            </Button>
          }
        />
        <CardContent>
          {/* Information Alert */}
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>How it works:</strong> When you connect your calendar, approved leave requests will
              automatically appear as events in your external calendar. You can also export your leave
              calendar as an iCal feed to import into any calendar application.
            </Typography>
          </Alert>

          <List>
            {/* Google Calendar Integration */}
            <ListItem>
              <ListItemIcon>
                <Google sx={{ color: '#4285f4' }} />
              </ListItemIcon>
              <ListItemText
                primary="Google Calendar"
                secondary={
                  getIntegrationStatus('google')?.enabled
                    ? `Connected on ${new Date(getIntegrationStatus('google')!.createdAt).toLocaleDateString()}`
                    : 'Connect your Google Calendar to sync leave events'
                }
              />
              <ListItemSecondaryAction>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getIntegrationStatus('google')?.enabled ? (
                    <>
                      <Chip
                        icon={<CheckCircle />}
                        label="Connected"
                        color="success"
                        size="small"
                      />
                      <IconButton
                        onClick={() => setShowDisconnectDialog({ open: true, provider: 'google' })}
                        disabled={actionLoading === 'google'}
                        color="error"
                      >
                        {actionLoading === 'google' ? <CircularProgress size={20} /> : <Delete />}
                      </IconButton>
                    </>
                  ) : (
                    <Button
                      variant="outlined"
                      onClick={connectGoogleCalendar}
                      disabled={actionLoading === 'google'}
                      startIcon={actionLoading === 'google' ? <CircularProgress size={16} /> : <Launch />}
                    >
                      Connect
                    </Button>
                  )}
                </Box>
              </ListItemSecondaryAction>
            </ListItem>

            <Divider component="li" />

            {/* Outlook Calendar Integration */}
            <ListItem>
              <ListItemIcon>
                <Microsoft sx={{ color: '#0078d4' }} />
              </ListItemIcon>
              <ListItemText
                primary="Outlook Calendar"
                secondary={
                  getIntegrationStatus('outlook')?.enabled
                    ? `Connected on ${new Date(getIntegrationStatus('outlook')!.createdAt).toLocaleDateString()}`
                    : 'Connect your Outlook Calendar to sync leave events'
                }
              />
              <ListItemSecondaryAction>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getIntegrationStatus('outlook')?.enabled ? (
                    <>
                      <Chip
                        icon={<CheckCircle />}
                        label="Connected"
                        color="success"
                        size="small"
                      />
                      <IconButton
                        onClick={() => setShowDisconnectDialog({ open: true, provider: 'outlook' })}
                        disabled={actionLoading === 'outlook'}
                        color="error"
                      >
                        {actionLoading === 'outlook' ? <CircularProgress size={20} /> : <Delete />}
                      </IconButton>
                    </>
                  ) : (
                    <Button
                      variant="outlined"
                      onClick={connectOutlookCalendar}
                      disabled={actionLoading === 'outlook'}
                      startIcon={actionLoading === 'outlook' ? <CircularProgress size={16} /> : <Launch />}
                    >
                      Connect
                    </Button>
                  )}
                </Box>
              </ListItemSecondaryAction>
            </ListItem>

            <Divider component="li" />

            {/* iCal Feed Export */}
            <ListItem>
              <ListItemIcon>
                <Download />
              </ListItemIcon>
              <ListItemText
                primary="iCal Feed"
                secondary="Download or subscribe to your personal leave calendar feed"
              />
              <ListItemSecondaryAction>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Tooltip title="Copy feed URL to clipboard or download .ics file">
                    <IconButton>
                      <Info />
                    </IconButton>
                  </Tooltip>
                  <Button
                    variant="outlined"
                    onClick={downloadICalFeed}
                    startIcon={<Download />}
                  >
                    Download
                  </Button>
                </Box>
              </ListItemSecondaryAction>
            </ListItem>
          </List>

          {/* Additional Information */}
          <Alert severity="warning" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>Privacy Note:</strong> Calendar integration requires access to your calendar data.
              We only sync approved leave requests and do not access any other calendar events.
              You can disconnect at any time.
            </Typography>
          </Alert>

          {/* Calendar Feed URL */}
          {user?.id && (
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Calendar Feed URL (for manual import):
              </Typography>
              <Link
                href={`${api.defaults.baseURL}/calendar/ical/${user.id}`}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ fontSize: '0.875rem', wordBreak: 'break-all' }}
              >
                {`${api.defaults.baseURL}/calendar/ical/${user.id}`}
              </Link>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Disconnect Confirmation Dialog */}
      <Dialog
        open={showDisconnectDialog.open}
        onClose={() => setShowDisconnectDialog({ open: false })}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ErrorIcon color="warning" />
            Disconnect Calendar
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to disconnect your{' '}
            {showDisconnectDialog.provider === 'google' ? 'Google' : 'Outlook'} Calendar?
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            This will stop syncing new leave events to your calendar, but existing events will remain.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowDisconnectDialog({ open: false })}
            disabled={!!actionLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={() => showDisconnectDialog.provider && disconnectCalendar(showDisconnectDialog.provider)}
            color="error"
            variant="contained"
            disabled={!!actionLoading}
          >
            Disconnect
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CalendarIntegrationSettings;