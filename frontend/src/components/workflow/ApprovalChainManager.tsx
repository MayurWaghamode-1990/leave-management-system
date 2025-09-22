import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Divider,
  Avatar,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  Tooltip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  AccountTree,
  Person,
  Group,
  Business,
  Settings,
  Timeline,
  CheckCircle,
  Schedule,
  Warning,
  ExpandMore,
  DragIndicator,
  PlayArrow,
  Pause,
  RestartAlt,
  Visibility,
  Assignment,
  AccessTime,
  HowToReg,
  People,
  AdminPanelSettings
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

interface ApprovalStep {
  id: string;
  name: string;
  type: 'INDIVIDUAL' | 'ROLE' | 'DEPARTMENT' | 'ANY_OF' | 'ALL_OF';
  approvers: string[];
  timeLimit?: number;
  skipConditions?: string[];
  escalationRules?: {
    enabled: boolean;
    escalateAfter: number;
    escalateTo: string[];
  };
  order: number;
}

interface ApprovalChain {
  id: string;
  name: string;
  description: string;
  leaveTypes: string[];
  conditions: {
    minDuration?: number;
    maxDuration?: number;
    departments?: string[];
    roles?: string[];
    customRules?: string[];
  };
  steps: ApprovalStep[];
  isDefault: boolean;
  enabled: boolean;
  createdBy: string;
  createdAt: string;
  lastModified: string;
  usageCount: number;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'STANDARD' | 'EMERGENCY' | 'BULK' | 'CUSTOM';
  steps: ApprovalStep[];
  isBuiltIn: boolean;
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
      id={`approval-tabpanel-${index}`}
      aria-labelledby={`approval-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const ApprovalChainManager: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [approvalChains, setApprovalChains] = useState<ApprovalChain[]>([]);
  const [workflowTemplates, setWorkflowTemplates] = useState<WorkflowTemplate[]>([]);
  const [selectedChain, setSelectedChain] = useState<ApprovalChain | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mock data for approval chains
  const mockApprovalChains: ApprovalChain[] = [
    {
      id: '1',
      name: 'Standard Leave Approval',
      description: 'Default approval chain for regular leave requests',
      leaveTypes: ['ANNUAL', 'CASUAL', 'SICK'],
      conditions: {
        maxDuration: 5
      },
      steps: [
        {
          id: 'step1',
          name: 'Direct Manager',
          type: 'ROLE',
          approvers: ['MANAGER'],
          timeLimit: 48,
          order: 1,
          escalationRules: {
            enabled: true,
            escalateAfter: 72,
            escalateTo: ['HR_ADMIN']
          }
        }
      ],
      isDefault: true,
      enabled: true,
      createdBy: 'System',
      createdAt: '2024-01-01T00:00:00',
      lastModified: '2024-02-15T10:30:00',
      usageCount: 345
    },
    {
      id: '2',
      name: 'Extended Leave Approval',
      description: 'Multi-level approval for extended leave requests',
      leaveTypes: ['ANNUAL', 'MATERNITY', 'PATERNITY'],
      conditions: {
        minDuration: 6
      },
      steps: [
        {
          id: 'step1',
          name: 'Direct Manager',
          type: 'ROLE',
          approvers: ['MANAGER'],
          timeLimit: 24,
          order: 1,
          escalationRules: {
            enabled: true,
            escalateAfter: 48,
            escalateTo: ['HR_ADMIN']
          }
        },
        {
          id: 'step2',
          name: 'HR Review',
          type: 'ROLE',
          approvers: ['HR_ADMIN'],
          timeLimit: 48,
          order: 2,
          escalationRules: {
            enabled: true,
            escalateAfter: 72,
            escalateTo: ['IT_ADMIN']
          }
        },
        {
          id: 'step3',
          name: 'Department Head',
          type: 'DEPARTMENT',
          approvers: ['DEPT_HEAD'],
          timeLimit: 24,
          order: 3
        }
      ],
      isDefault: false,
      enabled: true,
      createdBy: 'HR Admin',
      createdAt: '2024-01-10T00:00:00',
      lastModified: '2024-02-12T14:20:00',
      usageCount: 87
    },
    {
      id: '3',
      name: 'Emergency Leave Fast Track',
      description: 'Expedited approval for emergency situations',
      leaveTypes: ['EMERGENCY', 'SICK'],
      conditions: {
        maxDuration: 3,
        customRules: ['EMERGENCY_DECLARED']
      },
      steps: [
        {
          id: 'step1',
          name: 'Any Senior Manager',
          type: 'ANY_OF',
          approvers: ['MANAGER', 'HR_ADMIN', 'IT_ADMIN'],
          timeLimit: 4,
          order: 1
        }
      ],
      isDefault: false,
      enabled: true,
      createdBy: 'HR Admin',
      createdAt: '2024-01-15T00:00:00',
      lastModified: '2024-02-10T09:15:00',
      usageCount: 23
    }
  ];

  // Mock workflow templates
  const mockWorkflowTemplates: WorkflowTemplate[] = [
    {
      id: 'template1',
      name: 'Simple Manager Approval',
      description: 'Single-step approval by direct manager',
      category: 'STANDARD',
      isBuiltIn: true,
      steps: [
        {
          id: 'step1',
          name: 'Manager Approval',
          type: 'ROLE',
          approvers: ['MANAGER'],
          timeLimit: 48,
          order: 1
        }
      ]
    },
    {
      id: 'template2',
      name: 'Two-Level Approval',
      description: 'Manager + HR approval chain',
      category: 'STANDARD',
      isBuiltIn: true,
      steps: [
        {
          id: 'step1',
          name: 'Manager Approval',
          type: 'ROLE',
          approvers: ['MANAGER'],
          timeLimit: 24,
          order: 1
        },
        {
          id: 'step2',
          name: 'HR Approval',
          type: 'ROLE',
          approvers: ['HR_ADMIN'],
          timeLimit: 48,
          order: 2
        }
      ]
    },
    {
      id: 'template3',
      name: 'Emergency Approval',
      description: 'Fast-track approval for emergencies',
      category: 'EMERGENCY',
      isBuiltIn: true,
      steps: [
        {
          id: 'step1',
          name: 'Any Available Manager',
          type: 'ANY_OF',
          approvers: ['MANAGER', 'HR_ADMIN'],
          timeLimit: 2,
          order: 1
        }
      ]
    }
  ];

  useEffect(() => {
    setApprovalChains(mockApprovalChains);
    setWorkflowTemplates(mockWorkflowTemplates);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleToggleChain = async (chainId: string, enabled: boolean) => {
    try {
      setLoading(true);
      setApprovalChains(prev =>
        prev.map(chain =>
          chain.id === chainId ? { ...chain, enabled } : chain
        )
      );
      toast.success(`Approval chain ${enabled ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      toast.error('Failed to update approval chain');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChain = async (chainId: string) => {
    try {
      setLoading(true);
      setApprovalChains(prev => prev.filter(chain => chain.id !== chainId));
      toast.success('Approval chain deleted successfully');
    } catch (error) {
      toast.error('Failed to delete approval chain');
    } finally {
      setLoading(false);
    }
  };

  const getStepTypeIcon = (type: string) => {
    switch (type) {
      case 'INDIVIDUAL': return <Person />;
      case 'ROLE': return <AdminPanelSettings />;
      case 'DEPARTMENT': return <Business />;
      case 'ANY_OF': return <People />;
      case 'ALL_OF': return <Group />;
      default: return <HowToReg />;
    }
  };

  const getStepTypeColor = (type: string) => {
    switch (type) {
      case 'INDIVIDUAL': return 'primary';
      case 'ROLE': return 'secondary';
      case 'DEPARTMENT': return 'info';
      case 'ANY_OF': return 'warning';
      case 'ALL_OF': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountTree />
          Approval Chain Management
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Configure and manage approval workflows and chains for different leave types and conditions
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <AccountTree />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {approvalChains.filter(c => c.enabled).length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Active Chains
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <Assignment />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {workflowTemplates.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Templates
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {approvalChains.reduce((sum, chain) => sum + chain.usageCount, 0)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Approvals
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <AccessTime />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    24h
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Avg Response Time
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Approval Chains" icon={<AccountTree />} />
          <Tab label="Workflow Templates" icon={<Assignment />} />
          <Tab label="Chain Analytics" icon={<Timeline />} />
        </Tabs>
      </Paper>

      {/* Approval Chains Tab */}
      <TabPanel value={currentTab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Approval Chains</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<Assignment />}
                      onClick={() => setTemplateDialogOpen(true)}
                    >
                      From Template
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => {
                        setSelectedChain(null);
                        setEditDialogOpen(true);
                      }}
                    >
                      Create Chain
                    </Button>
                  </Box>
                </Box>

                <List>
                  {approvalChains.map((chain, index) => (
                    <React.Fragment key={chain.id}>
                      <ListItem sx={{ alignItems: 'flex-start' }}>
                        <ListItemIcon sx={{ mt: 1 }}>
                          <Avatar sx={{ bgcolor: chain.enabled ? 'success.main' : 'grey.400' }}>
                            <AccountTree />
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography variant="subtitle1" fontWeight="medium">
                                {chain.name}
                              </Typography>
                              {chain.isDefault && (
                                <Chip label="Default" size="small" color="primary" />
                              )}
                              <Chip
                                label={chain.enabled ? 'Active' : 'Inactive'}
                                size="small"
                                color={chain.enabled ? 'success' : 'default'}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                                {chain.description}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                                <Typography variant="caption" color="textSecondary">
                                  Leave Types:
                                </Typography>
                                {chain.leaveTypes.map(type => (
                                  <Chip key={type} label={type} size="small" variant="outlined" />
                                ))}
                              </Box>
                              <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                                <Typography variant="caption" color="textSecondary">
                                  Steps: {chain.steps.length}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  Used: {chain.usageCount} times
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  Last modified: {new Date(chain.lastModified).toLocaleDateString()}
                                </Typography>
                              </Box>
                              {/* Step visualization */}
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                {chain.steps.map((step, stepIndex) => (
                                  <React.Fragment key={step.id}>
                                    <Tooltip title={`${step.name} (${step.timeLimit}h limit)`}>
                                      <Chip
                                        icon={getStepTypeIcon(step.type)}
                                        label={step.name}
                                        size="small"
                                        color={getStepTypeColor(step.type) as any}
                                        variant="outlined"
                                      />
                                    </Tooltip>
                                    {stepIndex < chain.steps.length - 1 && (
                                      <PlayArrow sx={{ fontSize: 16, color: 'text.secondary' }} />
                                    )}
                                  </React.Fragment>
                                ))}
                              </Box>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Switch
                              checked={chain.enabled}
                              onChange={(e) => handleToggleChain(chain.id, e.target.checked)}
                              disabled={loading || chain.isDefault}
                            />
                            <IconButton
                              onClick={() => {
                                setSelectedChain(chain);
                                setEditDialogOpen(true);
                              }}
                            >
                              <Edit />
                            </IconButton>
                            {!chain.isDefault && (
                              <IconButton
                                onClick={() => handleDeleteChain(chain.id)}
                                color="error"
                              >
                                <Delete />
                              </IconButton>
                            )}
                            <IconButton>
                              <Visibility />
                            </IconButton>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < approvalChains.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Workflow Templates Tab */}
      <TabPanel value={currentTab} index={1}>
        <Grid container spacing={3}>
          {workflowTemplates.map((template) => (
            <Grid item xs={12} md={6} key={template.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {template.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        {template.description}
                      </Typography>
                      <Chip
                        label={template.category}
                        size="small"
                        color={template.category === 'EMERGENCY' ? 'error' : 'primary'}
                        sx={{ mb: 2 }}
                      />
                    </Box>
                    <Box>
                      {template.isBuiltIn && (
                        <Chip label="Built-in" size="small" variant="outlined" />
                      )}
                    </Box>
                  </Box>

                  <Typography variant="subtitle2" gutterBottom>
                    Workflow Steps:
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    {template.steps.map((step, index) => (
                      <Box
                        key={step.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 1,
                          p: 1,
                          bgcolor: 'action.hover',
                          borderRadius: 1
                        }}
                      >
                        {getStepTypeIcon(step.type)}
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight="medium">
                            {step.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {step.type} • {step.timeLimit}h limit
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Add />}
                      onClick={() => {
                        // Create new chain from template
                        toast.success('Creating chain from template...');
                        setEditDialogOpen(true);
                      }}
                    >
                      Use Template
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Visibility />}
                    >
                      Preview
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Chain Analytics Tab */}
      <TabPanel value={currentTab} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Approval Chain Performance
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Chain Name</TableCell>
                        <TableCell align="right">Usage Count</TableCell>
                        <TableCell align="right">Avg Time (hours)</TableCell>
                        <TableCell align="right">Success Rate</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {approvalChains.map((chain) => (
                        <TableRow key={chain.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {chain.name}
                              {chain.isDefault && (
                                <Chip label="Default" size="small" color="primary" />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="right">{chain.usageCount}</TableCell>
                          <TableCell align="right">
                            {Math.floor(Math.random() * 48) + 12}
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                              {Math.floor(Math.random() * 20) + 80}%
                              <LinearProgress
                                variant="determinate"
                                value={Math.floor(Math.random() * 20) + 80}
                                sx={{ width: 60, height: 6, borderRadius: 3 }}
                              />
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Chain Health Monitor
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="All chains operational"
                      secondary="No issues detected"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Warning color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Extended Leave chain slow"
                      secondary="Avg response: 48h"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Schedule color="info" />
                    </ListItemIcon>
                    <ListItemText
                      primary="3 pending escalations"
                      secondary="Requires attention"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Edit Chain Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedChain ? 'Edit Approval Chain' : 'Create New Approval Chain'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Chain Name"
                defaultValue={selectedChain?.name || ''}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                defaultValue={selectedChain?.description || ''}
                multiline
                rows={2}
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Leave Types</InputLabel>
                <Select
                  multiple
                  defaultValue={selectedChain?.leaveTypes || []}
                  label="Leave Types"
                >
                  <MenuItem value="ANNUAL">Annual Leave</MenuItem>
                  <MenuItem value="SICK">Sick Leave</MenuItem>
                  <MenuItem value="CASUAL">Casual Leave</MenuItem>
                  <MenuItem value="MATERNITY">Maternity Leave</MenuItem>
                  <MenuItem value="PATERNITY">Paternity Leave</MenuItem>
                  <MenuItem value="EMERGENCY">Emergency Leave</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={<Switch defaultChecked={selectedChain?.enabled ?? true} />}
                label="Enable Chain"
              />
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info">
                Use the step builder below to configure approval steps, conditions, and escalation rules.
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              setEditDialogOpen(false);
              toast.success(selectedChain ? 'Chain updated' : 'Chain created');
            }}
          >
            {selectedChain ? 'Update Chain' : 'Create Chain'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Template Selection Dialog */}
      <Dialog
        open={templateDialogOpen}
        onClose={() => setTemplateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Select Workflow Template</DialogTitle>
        <DialogContent>
          <List>
            {workflowTemplates.map((template) => (
              <ListItem
                key={template.id}
                button
                onClick={() => {
                  setTemplateDialogOpen(false);
                  setEditDialogOpen(true);
                  toast.success(`Using ${template.name} template`);
                }}
              >
                <ListItemText
                  primary={template.name}
                  secondary={`${template.description} • ${template.steps.length} steps`}
                />
                <Chip label={template.category} size="small" />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApprovalChainManager;