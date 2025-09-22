import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Button,
  TextField,
  Tab,
  Tabs,
  Paper,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Badge,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  Person,
  Edit,
  Save,
  Cancel,
  PhotoCamera,
  Email,
  Phone,
  LocationOn,
  Business,
  CalendarMonth,
  Security,
  Notifications,
  Language,
  Palette,
  History,
  Visibility,
  VisibilityOff,
  Key,
  Smartphone,
  Computer,
  Schedule,
  CheckCircle,
  Warning,
  Info
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import dayjs from 'dayjs';
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
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  location: string;
  employeeId: string;
  joinDate: string;
  managerId?: string;
  profilePicture?: string;
  bio?: string;
  skills: string[];
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    privacy: {
      profileVisible: boolean;
      showEmail: boolean;
      showPhone: boolean;
    };
  };
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  lastPasswordChange: string;
  activeSessions: Array<{
    id: string;
    device: string;
    location: string;
    lastActive: string;
    current: boolean;
  }>;
  loginHistory: Array<{
    timestamp: string;
    device: string;
    location: string;
    success: boolean;
  }>;
}

const EnhancedProfileManager: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const [profile, setProfile] = useState<UserProfile>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || '',
    location: user?.location || '',
    employeeId: user?.employeeId || '',
    joinDate: user?.joinDate || '',
    managerId: user?.managerId,
    profilePicture: user?.profilePicture,
    bio: '',
    skills: [],
    preferences: {
      theme: 'light',
      language: 'en',
      notifications: {
        email: true,
        push: true,
        sms: false
      },
      privacy: {
        profileVisible: true,
        showEmail: false,
        showPhone: false
      }
    }
  });

  const [originalProfile, setOriginalProfile] = useState<UserProfile>(profile);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    lastPasswordChange: '2024-01-15',
    activeSessions: [
      {
        id: '1',
        device: 'Chrome on Windows',
        location: 'New York, USA',
        lastActive: '2024-01-20T10:30:00',
        current: true
      },
      {
        id: '2',
        device: 'Safari on iPhone',
        location: 'New York, USA',
        lastActive: '2024-01-19T15:45:00',
        current: false
      }
    ],
    loginHistory: [
      {
        timestamp: '2024-01-20T09:00:00',
        device: 'Chrome on Windows',
        location: 'New York, USA',
        success: true
      },
      {
        timestamp: '2024-01-19T08:30:00',
        device: 'Safari on iPhone',
        location: 'New York, USA',
        success: true
      }
    ]
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleEditToggle = () => {
    if (editMode) {
      setProfile(originalProfile);
    } else {
      setOriginalProfile(profile);
    }
    setEditMode(!editMode);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setOriginalProfile(profile);
      setEditMode(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (field: keyof UserProfile, value: any) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePreferenceChange = (category: string, field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [category]: {
          ...prev.preferences[category as keyof typeof prev.preferences],
          [field]: value
        }
      }
    }));
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setPasswordDialogOpen(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully!');
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        handleProfileChange('profilePicture', e.target?.result as string);
        setPhotoDialogOpen(false);
        toast.success('Profile picture updated!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTerminateSession = (sessionId: string) => {
    setSecuritySettings(prev => ({
      ...prev,
      activeSessions: prev.activeSessions.filter(session => session.id !== sessionId)
    }));
    toast.success('Session terminated');
  };

  const getInitials = () => {
    return `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`;
  };

  const getCompletionPercentage = () => {
    const fields = [
      profile.firstName,
      profile.lastName,
      profile.email,
      profile.phone,
      profile.bio,
      profile.skills.length > 0,
      profile.profilePicture
    ];
    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  };

  return (
    <Box>
      {/* Profile Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <IconButton
                    size="small"
                    sx={{
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '&:hover': { backgroundColor: 'primary.dark' }
                    }}
                    onClick={() => setPhotoDialogOpen(true)}
                  >
                    <PhotoCamera fontSize="small" />
                  </IconButton>
                }
              >
                <Avatar
                  src={profile.profilePicture}
                  sx={{ width: 120, height: 120, fontSize: '2rem' }}
                >
                  {getInitials()}
                </Avatar>
              </Badge>
            </Grid>
            <Grid item xs>
              <Typography variant="h4" fontWeight="bold">
                {profile.firstName} {profile.lastName}
              </Typography>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                {profile.department} • {profile.location}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Chip icon={<Business />} label={`ID: ${profile.employeeId}`} variant="outlined" />
                <Chip icon={<CalendarMonth />} label={`Joined: ${dayjs(profile.joinDate).format('MMM YYYY')}`} variant="outlined" />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Profile Completion:
                </Typography>
                <Box sx={{ width: 200 }}>
                  <LinearProgress
                    variant="determinate"
                    value={getCompletionPercentage()}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
                <Typography variant="body2" fontWeight="bold">
                  {getCompletionPercentage()}%
                </Typography>
              </Box>
            </Grid>
            <Grid item>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {editMode ? (
                  <>
                    <Button
                      variant="contained"
                      startIcon={loading ? <CircularProgress size={16} /> : <Save />}
                      onClick={handleSave}
                      disabled={loading}
                    >
                      Save
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Cancel />}
                      onClick={handleEditToggle}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outlined"
                    startIcon={<Edit />}
                    onClick={handleEditToggle}
                  >
                    Edit Profile
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<Person />} label="Personal Info" />
          <Tab icon={<Security />} label="Security" />
          <Tab icon={<Notifications />} label="Preferences" />
          <Tab icon={<History />} label="Activity" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <TabPanel value={currentTab} index={0}>
        {/* Personal Information */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="First Name"
                      value={profile.firstName}
                      onChange={(e) => handleProfileChange('firstName', e.target.value)}
                      disabled={!editMode}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Last Name"
                      value={profile.lastName}
                      onChange={(e) => handleProfileChange('lastName', e.target.value)}
                      disabled={!editMode}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => handleProfileChange('email', e.target.value)}
                      disabled={!editMode}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Phone"
                      value={profile.phone}
                      onChange={(e) => handleProfileChange('phone', e.target.value)}
                      disabled={!editMode}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Bio"
                      multiline
                      rows={3}
                      value={profile.bio}
                      onChange={(e) => handleProfileChange('bio', e.target.value)}
                      disabled={!editMode}
                      fullWidth
                      placeholder="Tell us about yourself..."
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Work Information
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Business />
                    </ListItemIcon>
                    <ListItemText
                      primary="Department"
                      secondary={profile.department}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <LocationOn />
                    </ListItemIcon>
                    <ListItemText
                      primary="Location"
                      secondary={profile.location}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CalendarMonth />
                    </ListItemIcon>
                    <ListItemText
                      primary="Join Date"
                      secondary={dayjs(profile.joinDate).format('MMMM DD, YYYY')}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        {/* Security Settings */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Password & Authentication
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Last password change: {dayjs(securitySettings.lastPasswordChange).format('MMMM DD, YYYY')}
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<Key />}
                  onClick={() => setPasswordDialogOpen(true)}
                  sx={{ mb: 2 }}
                >
                  Change Password
                </Button>
                <Divider sx={{ my: 2 }} />
                <FormControlLabel
                  control={
                    <Switch
                      checked={securitySettings.twoFactorEnabled}
                      onChange={(e) => setSecuritySettings(prev => ({
                        ...prev,
                        twoFactorEnabled: e.target.checked
                      }))}
                    />
                  }
                  label="Two-Factor Authentication"
                />
                <Typography variant="body2" color="textSecondary">
                  Add an extra layer of security to your account
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Active Sessions
                </Typography>
                <List>
                  {securitySettings.activeSessions.map((session) => (
                    <ListItem key={session.id}>
                      <ListItemIcon>
                        {session.device.includes('iPhone') ? <Smartphone /> : <Computer />}
                      </ListItemIcon>
                      <ListItemText
                        primary={session.device}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              {session.location}
                            </Typography>
                            <Typography variant="caption" display="block">
                              Last active: {dayjs(session.lastActive).fromNow()}
                            </Typography>
                            {session.current && (
                              <Chip label="Current" size="small" color="success" sx={{ mt: 0.5 }} />
                            )}
                          </Box>
                        }
                      />
                      {!session.current && (
                        <ListItemSecondaryAction>
                          <Button
                            size="small"
                            onClick={() => handleTerminateSession(session.id)}
                          >
                            Terminate
                          </Button>
                        </ListItemSecondaryAction>
                      )}
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        {/* Preferences */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Appearance & Language
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Theme</InputLabel>
                      <Select
                        value={profile.preferences.theme}
                        label="Theme"
                        onChange={(e) => handlePreferenceChange('preferences', 'theme', e.target.value)}
                      >
                        <MenuItem value="light">Light</MenuItem>
                        <MenuItem value="dark">Dark</MenuItem>
                        <MenuItem value="auto">Auto</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Language</InputLabel>
                      <Select
                        value={profile.preferences.language}
                        label="Language"
                        onChange={(e) => handlePreferenceChange('preferences', 'language', e.target.value)}
                      >
                        <MenuItem value="en">English</MenuItem>
                        <MenuItem value="es">Spanish</MenuItem>
                        <MenuItem value="fr">French</MenuItem>
                        <MenuItem value="de">German</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Privacy Settings
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={profile.preferences.privacy.profileVisible}
                      onChange={(e) => handlePreferenceChange('privacy', 'profileVisible', e.target.checked)}
                    />
                  }
                  label="Make profile visible to other employees"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={profile.preferences.privacy.showEmail}
                      onChange={(e) => handlePreferenceChange('privacy', 'showEmail', e.target.checked)}
                    />
                  }
                  label="Show email address in profile"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={profile.preferences.privacy.showPhone}
                      onChange={(e) => handlePreferenceChange('privacy', 'showPhone', e.target.checked)}
                    />
                  }
                  label="Show phone number in profile"
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Notification Preferences
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={profile.preferences.notifications.email}
                      onChange={(e) => handlePreferenceChange('notifications', 'email', e.target.checked)}
                    />
                  }
                  label="Email notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={profile.preferences.notifications.push}
                      onChange={(e) => handlePreferenceChange('notifications', 'push', e.target.checked)}
                    />
                  }
                  label="Push notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={profile.preferences.notifications.sms}
                      onChange={(e) => handlePreferenceChange('notifications', 'sms', e.target.checked)}
                    />
                  }
                  label="SMS notifications"
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={currentTab} index={3}>
        {/* Activity History */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Login Activity
            </Typography>
            <List>
              {securitySettings.loginHistory.map((login, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    {login.success ? (
                      <CheckCircle color="success" />
                    ) : (
                      <Warning color="error" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={`${login.success ? 'Successful' : 'Failed'} login`}
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          {dayjs(login.timestamp).format('MMMM DD, YYYY HH:mm')}
                        </Typography>
                        <Typography variant="caption" display="block">
                          {login.device} • {login.location}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Photo Upload Dialog */}
      <Dialog open={photoDialogOpen} onClose={() => setPhotoDialogOpen(false)}>
        <DialogTitle>Update Profile Picture</DialogTitle>
        <DialogContent>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="photo-upload"
            type="file"
            onChange={handlePhotoUpload}
          />
          <label htmlFor="photo-upload">
            <Button variant="contained" component="span" fullWidth>
              Choose Photo
            </Button>
          </label>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPhotoDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Current Password"
                type={showPasswords.current ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                fullWidth
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    >
                      {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="New Password"
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                fullWidth
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    >
                      {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Confirm New Password"
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                fullWidth
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    >
                      {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  )
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handlePasswordChange}
            variant="contained"
            disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
          >
            {loading ? <CircularProgress size={16} /> : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnhancedProfileManager;