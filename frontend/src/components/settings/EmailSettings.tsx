import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import {
  Email,
  Send,
  CheckCircle,
  Error,
  Warning,
  Settings,
  ExpandMore,
  Refresh,
  Info,
  Security,
  Speed,
  Timeline
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import api from '@/config/api';
import { toast } from 'react-hot-toast';

interface EmailProvider {
  key: string;
  name: string;
  description: string;
  defaultPort: number;
  defaultHost: string;
  requiresAuth: boolean;
  documentation?: string;
}

interface EmailStatus {
  connected: boolean;
  provider?: string;
  host?: string;
  port?: number;
  user?: string;
  lastTest?: string;
  error?: string;
}

interface EmailTestResult {
  success: boolean;
  message: string;
  messageId?: string;
  error?: string;
}

const EmailSettings: React.FC = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<EmailStatus>({ connected: false });
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testResult, setTestResult] = useState<EmailTestResult | null>(null);
  const [expanded, setExpanded] = useState<string | false>('configuration');

  const emailProviders: EmailProvider[] = [
    {
      key: 'GMAIL',
      name: 'Gmail',
      description: 'Google Gmail with App Passwords',
      defaultPort: 587,
      defaultHost: 'smtp.gmail.com',
      requiresAuth: true,
      documentation: 'Requires 2FA and App Password'
    },
    {
      key: 'OUTLOOK',
      name: 'Outlook/Hotmail',
      description: 'Microsoft Outlook and Hotmail',
      defaultPort: 587,
      defaultHost: 'smtp-mail.outlook.com',
      requiresAuth: true
    },
    {
      key: 'OFFICE365',
      name: 'Office 365',
      description: 'Microsoft Office 365 Business',
      defaultPort: 587,
      defaultHost: 'smtp.office365.com',
      requiresAuth: true
    },
    {
      key: 'SENDGRID',
      name: 'SendGrid',
      description: 'Cloud-based email delivery service',
      defaultPort: 587,
      defaultHost: 'smtp.sendgrid.net',
      requiresAuth: true,
      documentation: 'Use "apikey" as username and API key as password'
    },
    {
      key: 'MAILGUN',
      name: 'Mailgun',
      description: 'Email API service by Rackspace',
      defaultPort: 587,
      defaultHost: 'smtp.mailgun.org',
      requiresAuth: true
    },
    {
      key: 'SES',
      name: 'Amazon SES',
      description: 'Amazon Simple Email Service',
      defaultPort: 587,
      defaultHost: 'email-smtp.us-west-2.amazonaws.com',
      requiresAuth: true,
      documentation: 'Use SMTP credentials from AWS SES Console'
    }
  ];

  useEffect(() => {
    checkEmailStatus();
  }, []);

  const checkEmailStatus = async () => {
    setLoading(true);
    try {
      const response = await api.get('/email/test-connection');
      if (response.data.success) {
        setStatus({
          connected: true,
          ...response.data.data,
          lastTest: new Date().toISOString()
        });
      } else {
        setStatus({
          connected: false,
          error: response.data.message,
          lastTest: new Date().toISOString()
        });
      }
    } catch (error: any) {
      setStatus({
        connected: false,
        error: error.response?.data?.message || 'Failed to test connection',
        lastTest: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast.error('Please enter a test email address');
      return;
    }

    setTestLoading(true);
    try {
      const response = await api.post('/email/test', { to: testEmail });
      setTestResult({
        success: response.data.success,
        message: response.data.message,
        messageId: response.data.messageId
      });

      if (response.data.success) {
        toast.success('Test email sent successfully!');
      } else {
        toast.error('Failed to send test email');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to send test email';
      setTestResult({
        success: false,
        message: errorMessage,
        error: error.response?.data?.error
      });
      toast.error(errorMessage);
    } finally {
      setTestLoading(false);
    }
  };

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const getStatusColor = () => {
    if (loading) return 'info';
    return status.connected ? 'success' : 'error';
  };

  const getStatusIcon = () => {
    if (loading) return <CircularProgress size={20} />;
    return status.connected ? <CheckCircle /> : <Error />;
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Email Configuration
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Configure SMTP settings for email notifications and test connectivity
        </Typography>
      </Box>

      {/* Status Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Connection Status</Typography>
            <Button
              startIcon={<Refresh />}
              onClick={checkEmailStatus}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            {getStatusIcon()}
            <Box>
              <Typography variant="h6" color={getStatusColor()}>
                {status.connected ? 'Connected' : 'Disconnected'}
              </Typography>
              {status.provider && (
                <Typography variant="body2" color="textSecondary">
                  Provider: {status.provider} | Host: {status.host}:{status.port}
                </Typography>
              )}
              {status.user && (
                <Typography variant="body2" color="textSecondary">
                  User: {status.user}
                </Typography>
              )}
              {status.lastTest && (
                <Typography variant="body2" color="textSecondary">
                  Last tested: {new Date(status.lastTest).toLocaleString()}
                </Typography>
              )}
            </Box>
          </Box>

          {status.error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {status.error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button
              variant="contained"
              startIcon={<Send />}
              onClick={() => setTestDialogOpen(true)}
              disabled={!status.connected}
            >
              Send Test Email
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Configuration Sections */}
      <Box>
        {/* Email Provider Setup */}
        <Accordion
          expanded={expanded === 'configuration'}
          onChange={handleAccordionChange('configuration')}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Settings />
              <Typography variant="h6">Email Provider Configuration</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Choose your email provider and configure the connection settings.
                Environment variables need to be set in the backend .env file.
              </Typography>
            </Alert>

            <Grid container spacing={3}>
              {emailProviders.map((provider) => (
                <Grid item xs={12} md={6} key={provider.key}>
                  <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Email color="primary" />
                      <Box>
                        <Typography variant="h6">{provider.name}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {provider.description}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">
                        <strong>Host:</strong> {provider.defaultHost}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        <strong>Port:</strong> {provider.defaultPort}
                      </Typography>
                      {provider.documentation && (
                        <Typography variant="body2" color="info.main">
                          <Info fontSize="small" sx={{ mr: 0.5 }} />
                          {provider.documentation}
                        </Typography>
                      )}
                    </Box>

                    <Typography variant="caption" color="textSecondary">
                      Set EMAIL_PROVIDER={provider.key} in your .env file
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Environment Variables */}
        <Accordion
          expanded={expanded === 'environment'}
          onChange={handleAccordionChange('environment')}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Security />
              <Typography variant="h6">Environment Variables</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Add these variables to your backend .env file. Restart the server after changes.
              </Typography>
            </Alert>

            <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
              <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
{`# Basic Configuration
EMAIL_PROVIDER=GMAIL
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Email Settings
EMAIL_FROM_NAME=LMS - Leave Management System
EMAIL_FROM_ADDRESS=your-email@gmail.com
COMPANY_NAME=Your Company Name
SUPPORT_EMAIL=support@yourcompany.com

# Advanced Settings (Optional)
SMTP_MAX_CONNECTIONS=5
SMTP_MAX_MESSAGES=100
EMAIL_MAX_RETRIES=3
EMAIL_RETRY_DELAY=5000`}
              </Typography>
            </Paper>
          </AccordionDetails>
        </Accordion>

        {/* Performance Settings */}
        <Accordion
          expanded={expanded === 'performance'}
          onChange={handleAccordionChange('performance')}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Speed />
              <Typography variant="h6">Performance & Monitoring</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Connection Pooling</Typography>
                <List>
                  <ListItem>
                    <ListItemIcon><Timeline /></ListItemIcon>
                    <ListItemText
                      primary="Max Connections"
                      secondary="SMTP_MAX_CONNECTIONS=5"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Timeline /></ListItemIcon>
                    <ListItemText
                      primary="Max Messages per Connection"
                      secondary="SMTP_MAX_MESSAGES=100"
                    />
                  </ListItem>
                </List>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Error Handling</Typography>
                <List>
                  <ListItem>
                    <ListItemIcon><Warning /></ListItemIcon>
                    <ListItemText
                      primary="Max Retries"
                      secondary="EMAIL_MAX_RETRIES=3"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Warning /></ListItemIcon>
                    <ListItemText
                      primary="Retry Delay (ms)"
                      secondary="EMAIL_RETRY_DELAY=5000"
                    />
                  </ListItem>
                </List>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* Test Email Dialog */}
      <Dialog
        open={testDialogOpen}
        onClose={() => setTestDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Send Test Email</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Test Email Address"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Enter email address to test"
              helperText="A test email will be sent to verify SMTP configuration"
            />

            {testResult && (
              <Alert
                severity={testResult.success ? 'success' : 'error'}
                sx={{ mt: 2 }}
              >
                <Typography variant="body2">
                  {testResult.message}
                </Typography>
                {testResult.messageId && (
                  <Typography variant="caption" display="block">
                    Message ID: {testResult.messageId}
                  </Typography>
                )}
                {testResult.error && (
                  <Typography variant="caption" display="block" color="error">
                    Error: {testResult.error}
                  </Typography>
                )}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialogOpen(false)}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={sendTestEmail}
            disabled={testLoading || !testEmail}
            startIcon={testLoading ? <CircularProgress size={16} /> : <Send />}
          >
            {testLoading ? 'Sending...' : 'Send Test Email'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmailSettings;