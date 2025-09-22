import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Policy,
  Schedule,
  Group,
  Settings,
  ExpandMore,
  CheckCircle,
  Cancel,
  Info,
  Warning,
  Timeline,
  CalendarMonth,
  BusinessCenter,
  Refresh
} from '@mui/icons-material';

interface LeavePolicy {
  id: string;
  name: string;
  leaveType: string;
  description: string;
  isActive: boolean;
  accrualRate: number;
  accrualFrequency: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  maxBalance: number;
  carryOverLimit: number;
  minimumNotice: number;
  maximumDuration: number;
  allowNegativeBalance: boolean;
  requireApproval: boolean;
  approvalLevels: number;
  applicableRoles: string[];
  probationPeriod: number;
  gender?: 'MALE' | 'FEMALE' | 'ALL';
  region: string[];
  effectiveDate: string;
  expiryDate?: string;
}

interface ApprovalWorkflow {
  id: string;
  name: string;
  leaveTypes: string[];
  rules: ApprovalRule[];
  isActive: boolean;
}

interface ApprovalRule {
  condition: string;
  approvers: string[];
  order: number;
}

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
      id={`policies-tabpanel-${index}`}
      aria-labelledby={`policies-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const PoliciesPage: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [loading, setLoading] = useState(false);

  // Dialog states
  const [policyDialog, setPolicyDialog] = useState(false);
  const [workflowDialog, setWorkflowDialog] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<LeavePolicy | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<ApprovalWorkflow | null>(null);

  // Mock data for demo
  const mockPolicies: LeavePolicy[] = [
    {
      id: '1',
      name: 'Annual Leave - Standard',
      leaveType: 'EARNED_LEAVE',
      description: 'Standard annual leave policy for all employees',
      isActive: true,
      accrualRate: 2.5,
      accrualFrequency: 'MONTHLY',
      maxBalance: 30,
      carryOverLimit: 10,
      minimumNotice: 7,
      maximumDuration: 15,
      allowNegativeBalance: false,
      requireApproval: true,
      approvalLevels: 1,
      applicableRoles: ['EMPLOYEE', 'MANAGER'],
      probationPeriod: 90,
      gender: 'ALL',
      region: ['US', 'INDIA'],
      effectiveDate: '2024-01-01'
    },
    {
      id: '2',
      name: 'Sick Leave Policy',
      leaveType: 'SICK_LEAVE',
      description: 'Medical leave for illness and health appointments',
      isActive: true,
      accrualRate: 1,
      accrualFrequency: 'MONTHLY',
      maxBalance: 12,
      carryOverLimit: 5,
      minimumNotice: 0,
      maximumDuration: 30,
      allowNegativeBalance: true,
      requireApproval: false,
      approvalLevels: 0,
      applicableRoles: ['EMPLOYEE', 'MANAGER', 'HR_ADMIN'],
      probationPeriod: 0,
      gender: 'ALL',
      region: ['US', 'INDIA'],
      effectiveDate: '2024-01-01'
    },
    {
      id: '3',
      name: 'Maternity Leave - India',
      leaveType: 'MATERNITY_LEAVE',
      description: 'Maternity leave as per Indian Maternity Benefit Act',
      isActive: true,
      accrualRate: 0,
      accrualFrequency: 'YEARLY',
      maxBalance: 182,
      carryOverLimit: 0,
      minimumNotice: 30,
      maximumDuration: 182,
      allowNegativeBalance: false,
      requireApproval: true,
      approvalLevels: 2,
      applicableRoles: ['EMPLOYEE'],
      probationPeriod: 180,
      gender: 'FEMALE',
      region: ['INDIA'],
      effectiveDate: '2024-01-01'
    }
  ];

  const mockWorkflows: ApprovalWorkflow[] = [
    {
      id: '1',
      name: 'Standard Approval',
      leaveTypes: ['EARNED_LEAVE', 'CASUAL_LEAVE'],
      rules: [
        {
          condition: 'Duration <= 3 days',
          approvers: ['MANAGER'],
          order: 1
        }
      ],
      isActive: true
    },
    {
      id: '2',
      name: 'Extended Leave Approval',
      leaveTypes: ['EARNED_LEAVE'],
      rules: [
        {
          condition: 'Duration > 3 days',
          approvers: ['MANAGER', 'HR_ADMIN'],
          order: 1
        }
      ],
      isActive: true
    }
  ];

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setPolicies(mockPolicies);
      setWorkflows(mockWorkflows);
      setLoading(false);
    }, 1000);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleCreatePolicy = () => {
    setSelectedPolicy(null);
    setPolicyDialog(true);
  };

  const handleEditPolicy = (policy: LeavePolicy) => {
    setSelectedPolicy(policy);
    setPolicyDialog(true);
  };

  const handleDeletePolicy = (policyId: string) => {
    setPolicies(policies.filter(p => p.id !== policyId));
  };

  const handleTogglePolicy = (policyId: string) => {
    setPolicies(policies.map(p =>
      p.id === policyId ? { ...p, isActive: !p.isActive } : p
    ));
  };

  const getLeaveTypeColor = (leaveType: string) => {
    const colors = {
      EARNED_LEAVE: 'primary',
      SICK_LEAVE: 'error',
      CASUAL_LEAVE: 'info',
      MATERNITY_LEAVE: 'secondary',
      PATERNITY_LEAVE: 'warning'
    } as const;
    return colors[leaveType as keyof typeof colors] || 'default';
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Policy />
            Leave Policies Management
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Configure leave types, accrual rules, and approval workflows
          </Typography>
        </Box>
        <Button
          startIcon={<Refresh />}
          onClick={loadPolicies}
          disabled={loading}
          variant="outlined"
        >
          Refresh
        </Button>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Leave Policies" icon={<Policy />} />
          <Tab label="Approval Workflows" icon={<Timeline />} />
          <Tab label="Regional Settings" icon={<BusinessCenter />} />
          <Tab label="Compliance Rules" icon={<CheckCircle />} />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={currentTab} index={0}>
        {/* Leave Policies */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Leave Policies ({policies.length})</Typography>
          <Button
            startIcon={<Add />}
            variant="contained"
            onClick={handleCreatePolicy}
          >
            Create Policy
          </Button>
        </Box>

        <Grid container spacing={3}>
          {policies.map((policy) => (
            <Grid item xs={12} md={6} lg={4} key={policy.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {policy.name}
                      </Typography>
                      <Chip
                        label={policy.leaveType.replace('_', ' ')}
                        color={getLeaveTypeColor(policy.leaveType)}
                        size="small"
                        sx={{ mb: 1 }}
                      />
                    </Box>
                    <Box>
                      <Switch
                        checked={policy.isActive}
                        onChange={() => handleTogglePolicy(policy.id)}
                        size="small"
                      />
                    </Box>
                  </Box>

                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    {policy.description}
                  </Typography>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Chip
                      icon={<Schedule />}
                      label={`${policy.accrualRate} days/${policy.accrualFrequency.toLowerCase()}`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      icon={<CalendarMonth />}
                      label={`Max: ${policy.maxBalance} days`}
                      size="small"
                      variant="outlined"
                    />
                    {policy.requireApproval && (
                      <Chip
                        icon={<CheckCircle />}
                        label={`${policy.approvalLevels} level approval`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        Regions: {policy.region.join(', ')}
                      </Typography>
                    </Box>
                    <Box>
                      <Tooltip title="Edit Policy">
                        <IconButton
                          size="small"
                          onClick={() => handleEditPolicy(policy)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Policy">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeletePolicy(policy.id)}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {policies.length === 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            No leave policies configured. Create your first policy to get started.
          </Alert>
        )}
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        {/* Approval Workflows */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Approval Workflows</Typography>
          <Button
            startIcon={<Add />}
            variant="contained"
            onClick={() => setWorkflowDialog(true)}
          >
            Create Workflow
          </Button>
        </Box>

        {workflows.map((workflow) => (
          <Accordion key={workflow.id}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Timeline />
                <Typography variant="h6">{workflow.name}</Typography>
                <Chip
                  label={workflow.isActive ? 'Active' : 'Inactive'}
                  color={workflow.isActive ? 'success' : 'default'}
                  size="small"
                />
                <Box sx={{ ml: 'auto' }}>
                  <Chip
                    label={`${workflow.leaveTypes.length} leave types`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Applicable Leave Types
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {workflow.leaveTypes.map((type) => (
                      <Chip
                        key={type}
                        label={type.replace('_', ' ')}
                        size="small"
                        color={getLeaveTypeColor(type)}
                      />
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Approval Rules
                  </Typography>
                  <List dense>
                    {workflow.rules.map((rule, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <CheckCircle color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={rule.condition}
                          secondary={`Approvers: ${rule.approvers.join(', ')}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        {/* Regional Settings */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <strong>Regional Compliance Settings</strong><br />
          Configure region-specific leave policies and compliance requirements.
        </Alert>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  India Compliance
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                    <ListItemText primary="Maternity Benefit Act, 2017" secondary="182 days maternity leave" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                    <ListItemText primary="Factories Act, 1948" secondary="Earned leave: 1 day per 20 days worked" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                    <ListItemText primary="Paternity Benefits" secondary="15 days paternity leave" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  United States Compliance
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                    <ListItemText primary="FMLA (Family and Medical Leave Act)" secondary="12 weeks unpaid leave" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Warning color="warning" /></ListItemIcon>
                    <ListItemText primary="State-specific PTO laws" secondary="Varies by state" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Info color="info" /></ListItemIcon>
                    <ListItemText primary="Federal Holidays" secondary="10 federal holidays" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={currentTab} index={3}>
        {/* Compliance Rules */}
        <Alert severity="warning" sx={{ mb: 3 }}>
          <strong>Compliance Monitoring</strong><br />
          Ensure your leave policies comply with local labor laws and regulations.
        </Alert>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Policy Validation Rules
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Rule</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Action Required</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Minimum Leave Accrual</TableCell>
                        <TableCell>
                          <Chip label="Compliant" color="success" size="small" />
                        </TableCell>
                        <TableCell>All policies meet minimum accrual requirements</TableCell>
                        <TableCell>None</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Maximum Balance Limits</TableCell>
                        <TableCell>
                          <Chip label="Review Required" color="warning" size="small" />
                        </TableCell>
                        <TableCell>Some policies may exceed recommended limits</TableCell>
                        <TableCell>Review policy limits</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Gender-based Policies</TableCell>
                        <TableCell>
                          <Chip label="Compliant" color="success" size="small" />
                        </TableCell>
                        <TableCell>Maternity/Paternity policies align with regulations</TableCell>
                        <TableCell>None</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Policy Dialog would go here - simplified for length */}
      <Dialog open={policyDialog} onClose={() => setPolicyDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedPolicy ? 'Edit Leave Policy' : 'Create New Leave Policy'}
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Policy configuration form would be implemented here with all the fields from the LeavePolicy interface.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPolicyDialog(false)}>Cancel</Button>
          <Button variant="contained">Save Policy</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PoliciesPage;