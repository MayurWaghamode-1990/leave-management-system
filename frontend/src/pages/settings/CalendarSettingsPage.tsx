import React from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  Home,
  Settings,
  CalendarMonth
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import CalendarIntegrationSettings from '@/components/calendar/CalendarIntegrationSettings';

const CalendarSettingsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link
            underline="hover"
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            color="inherit"
            onClick={() => navigate('/')}
          >
            <Home sx={{ mr: 0.5 }} fontSize="inherit" />
            Dashboard
          </Link>
          <Link
            underline="hover"
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            color="inherit"
            onClick={() => navigate('/settings')}
          >
            <Settings sx={{ mr: 0.5 }} fontSize="inherit" />
            Settings
          </Link>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CalendarMonth sx={{ mr: 0.5 }} fontSize="inherit" />
            Calendar Integration
          </Box>
        </Breadcrumbs>

        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarMonth />
            Calendar Integration Settings
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Connect your external calendars to automatically sync your leave requests
          </Typography>
        </Box>

        {/* Calendar Integration Settings */}
        <Paper sx={{ p: 0, overflow: 'hidden' }}>
          <CalendarIntegrationSettings />
        </Paper>

        {/* Help Section */}
        <Paper sx={{ mt: 3, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Need Help?
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Calendar integration allows you to:
          </Typography>
          <Box component="ul" sx={{ pl: 2, mb: 2 }}>
            <Typography component="li" variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
              Automatically sync approved leave requests to your Google Calendar or Outlook Calendar
            </Typography>
            <Typography component="li" variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
              Export your leave calendar as an iCal feed for use with any calendar application
            </Typography>
            <Typography component="li" variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
              Keep your personal and work calendars synchronized with your leave schedule
            </Typography>
            <Typography component="li" variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
              Automatically update calendar events when leave requests are modified or cancelled
            </Typography>
          </Box>
          <Typography variant="body2" color="textSecondary">
            Your calendar data is kept secure and we only sync approved leave requests.
            You can disconnect your calendar at any time without affecting your leave data.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default CalendarSettingsPage;