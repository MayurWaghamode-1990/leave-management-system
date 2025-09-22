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
  Switch,
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
  Avatar
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  PlayArrow,
  Pause,
  AutoMode,
  Rule,
  Timeline,
  CheckCircle,
  Cancel,
  Schedule,
  Person,
  Email,
  Notifications,
  Warning
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import RuleBuilder from './RuleBuilder';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: 'LEAVE_REQUEST' | 'APPROVAL_PENDING' | 'LEAVE_TYPE' | 'DURATION' | 'USER_ROLE';
    conditions: Record<string, any>;
  };
  actions: Array<{
    type: 'AUTO_APPROVE' | 'AUTO_REJECT' | 'NOTIFY_MANAGER' | 'ESCALATE' | 'SEND_EMAIL';
    parameters: Record<string, any>;
  }>;
  enabled: boolean;
  priority: number;
  createdBy: string;
  createdAt: string;
  lastExecuted?: string;
  executionCount: number;
}

interface WorkflowStep {
  id: string;
  name: string;
  type: 'APPROVAL' | 'NOTIFICATION' | 'VALIDATION' | 'ACTION';
  assignee?: string;
  timeLimit?: number;
  conditions?: Record<string, any>;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
}

const AutomationRulesManager: React.FC = () => {
  const { user } = useAuth();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [ruleBuilderOpen, setRuleBuilderOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Mock automation rules
  const mockRules: AutomationRule[] = [
    {
      id: '1',
      name: 'Auto-approve Sick Leave (≤2 days)',
      description: 'Automatically approve sick leave requests for 2 days or less',
      trigger: {
        type: 'LEAVE_REQUEST',
        conditions: {
          leaveType: 'SICK_LEAVE',
          maxDuration: 2
        }
      },
      actions: [
        {
          type: 'AUTO_APPROVE',
          parameters: {}
        },
        {
          type: 'NOTIFY_MANAGER',
          parameters: {
            template: 'AUTO_APPROVAL_NOTIFICATION'
          }
        }
      ],
      enabled: true,
      priority: 1,
      createdBy: 'HR Admin',
      createdAt: '2024-01-15T10:30:00',
      lastExecuted: '2024-02-15T14:22:00',
      executionCount: 45
    },
    {
      id: '2',
      name: 'Escalate Long Pending Approvals',
      description: 'Escalate to HR if manager doesn\'t approve within 3 days',
      trigger: {
        type: 'APPROVAL_PENDING',
        conditions: {
          pendingDays: 3
        }
      },
      actions: [
        {
          type: 'ESCALATE',
          parameters: {
            escalateTo: 'HR_ADMIN'
          }
        },
        {
          type: 'SEND_EMAIL',
          parameters: {
            template: 'ESCALATION_NOTICE',
            recipients: ['hr@company.com']
          }
        }
      ],
      enabled: true,
      priority: 2,
      createdBy: 'HR Admin',
      createdAt: '2024-01-10T09:15:00',
      lastExecuted: '2024-02-14T11:30:00',
      executionCount: 12
    },
    {
      id: '3',
      name: 'Reject Overlapping Leave Requests',
      description: 'Automatically reject requests that overlap with existing approved leaves',
      trigger: {
        type: 'LEAVE_REQUEST',
        conditions: {
          checkOverlap: true
        }
      },
      actions: [
        {
          type: 'AUTO_REJECT',
          parameters: {
            reason: 'Overlapping leave period detected'
          }
        }
      ],
      enabled: false,
      priority: 3,
      createdBy: 'IT Admin',
      createdAt: '2024-01-20T16:45:00',
      executionCount: 0
    }
  ];

  const workflowSteps: WorkflowStep[] = [
    {
      id: '1',
      name: 'Submit Leave Request',
      type: 'ACTION',
      status: 'COMPLETED'
    },
    {
      id: '2',
      name: 'Validation Check',
      type: 'VALIDATION',
      status: 'COMPLETED',
      conditions: {
        checkBalance: true,
        checkOverlap: true
      }
    },
    {
      id: '3',
      name: 'Manager Approval',
      type: 'APPROVAL',
      assignee: 'Manager',
      timeLimit: 72,
      status: 'PENDING'
    },
    {
      id: '4',
      name: 'HR Notification',
      type: 'NOTIFICATION',
      assignee: 'HR Team',
      status: 'PENDING'
    },
    {
      id: '5',
      name: 'Calendar Update',
      type: 'ACTION',
      status: 'PENDING'
    }
  ];

  useEffect(() => {
    setRules(mockRules);
  }, []);

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      setLoading(true);
      setRules(prev =>
        prev.map(rule =>
          rule.id === ruleId ? { ...rule, enabled } : rule
        )
      );
      toast.success(`Rule ${enabled ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      toast.error('Failed to update rule');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      setLoading(true);
      setRules(prev => prev.filter(rule => rule.id !== ruleId));
      toast.success('Rule deleted successfully');
    } catch (error) {
      toast.error('Failed to delete rule');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRule = async (rule: AutomationRule) => {
    try {
      setLoading(true);

      if (selectedRule) {
        // Update existing rule
        setRules(prev => prev.map(r => r.id === rule.id ? rule : r));
        toast.success('Rule updated successfully');
      } else {
        // Add new rule
        setRules(prev => [...prev, rule]);
        toast.success('Rule created successfully');
      }

      setRuleBuilderOpen(false);
      setSelectedRule(null);
    } catch (error) {
      toast.error('Failed to save rule');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRuleBuilder = () => {
    setRuleBuilderOpen(false);
    setSelectedRule(null);
  };

  const openRuleBuilder = (rule?: AutomationRule) => {
    setSelectedRule(rule || null);
    setRuleBuilderOpen(true);
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'AUTO_APPROVE': return <CheckCircle color="success" />;
      case 'AUTO_REJECT': return <Cancel color="error" />;
      case 'NOTIFY_MANAGER': return <Notifications color="info" />;
      case 'ESCALATE': return <Warning color="warning" />;
      case 'SEND_EMAIL': return <Email color="primary" />;
      default: return <AutoMode />;
    }
  };

  const getStepIcon = (step: WorkflowStep) => {
    switch (step.type) {
      case 'APPROVAL': return <Person />;
      case 'NOTIFICATION': return <Email />;
      case 'VALIDATION': return <Rule />;
      case 'ACTION': return <PlayArrow />;
      default: return <Schedule />;
    }
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'PENDING': return 'warning';
      case 'FAILED': return 'error';
      case 'SKIPPED': return 'default';
      default: return 'default';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Workflow Automation & Rules
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Configure automated workflows and approval chains for leave requests
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <AutoMode />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {rules.filter(r => r.enabled).length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Active Rules
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
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {rules.reduce((sum, rule) => sum + rule.executionCount, 0)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Executions
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
                  <Timeline />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    5
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Workflow Steps
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
                  <Schedule />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    2
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Pending Approvals
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Automation Rules */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Automation Rules
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => openRuleBuilder()}
                >
                  Add Rule
                </Button>
              </Box>

              <List>
                {rules.map((rule, index) => (
                  <React.Fragment key={rule.id}>
                    <ListItem>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: rule.enabled ? 'success.main' : 'grey.400' }}>
                          <AutoMode />
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {rule.name}
                            </Typography>
                            <Chip
                              label={rule.enabled ? 'Active' : 'Inactive'}
                              size="small"
                              color={rule.enabled ? 'success' : 'default'}
                            />
                            <Chip
                              label={`Priority ${rule.priority}`}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                              {rule.description}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {rule.actions.map((action, actionIndex) => (
                                <Chip
                                  key={actionIndex}
                                  icon={getActionIcon(action.type)}
                                  label={action.type.replace('_', ' ').toLowerCase()}
                                  size="small"
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                              Executed {rule.executionCount} times • Last: {rule.lastExecuted ? new Date(rule.lastExecuted).toLocaleDateString() : 'Never'}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Switch
                            checked={rule.enabled}
                            onChange={(e) => handleToggleRule(rule.id, e.target.checked)}
                            disabled={loading}
                          />
                          <IconButton
                            onClick={() => openRuleBuilder(rule)}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            onClick={() => handleDeleteRule(rule.id)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < rules.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>

              {rules.length === 0 && (
                <Alert severity="info">
                  No automation rules configured. Create your first rule to get started with workflow automation.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Workflow Visualization */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Standard Workflow
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Current leave approval process
              </Typography>

              <Stepper orientation="vertical">
                {workflowSteps.map((step, index) => (
                  <Step key={step.id} active={step.status === 'PENDING'} completed={step.status === 'COMPLETED'}>
                    <StepLabel
                      StepIconComponent={() => (
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: `${getStepColor(step.status)}.main`
                          }}
                        >
                          {getStepIcon(step)}
                        </Avatar>
                      )}
                    >
                      <Typography variant="body2" fontWeight="medium">
                        {step.name}
                      </Typography>
                    </StepLabel>
                    <StepContent>
                      <Box sx={{ pb: 2 }}>
                        {step.assignee && (
                          <Typography variant="caption" display="block">
                            Assignee: {step.assignee}
                          </Typography>
                        )}
                        {step.timeLimit && (
                          <Typography variant="caption" display="block">
                            Time limit: {step.timeLimit} hours
                          </Typography>
                        )}
                        <Chip
                          label={step.status}
                          size="small"
                          color={getStepColor(step.status) as any}
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Rule Builder Dialog */}
      <Dialog
        open={ruleBuilderOpen}
        onClose={handleCancelRuleBuilder}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogContent sx={{ p: 0, height: '100%' }}>
          <RuleBuilder
            rule={selectedRule || undefined}
            onSave={handleSaveRule}
            onCancel={handleCancelRuleBuilder}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default AutomationRulesManager;