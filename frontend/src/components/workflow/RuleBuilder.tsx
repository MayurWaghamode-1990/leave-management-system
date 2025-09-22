import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Paper,
  Chip,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Avatar
} from '@mui/material';
import {
  Add,
  Remove,
  DragIndicator,
  ExpandMore,
  Rule,
  PlayArrow,
  CheckCircle,
  Cancel,
  Email,
  Notifications,
  Warning,
  Schedule,
  Person,
  Settings,
  Code,
  Timeline,
  FlowChart,
  AutoMode,
  Edit,
  Delete,
  Save,
  Preview
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

export interface RuleCondition {
  id: string;
  type: 'LEAVE_TYPE' | 'DURATION' | 'USER_ROLE' | 'DEPARTMENT' | 'BALANCE' | 'DATE_RANGE' | 'CUSTOM';
  operator: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'CONTAINS' | 'IN_RANGE';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface RuleAction {
  id: string;
  type: 'AUTO_APPROVE' | 'AUTO_REJECT' | 'NOTIFY_MANAGER' | 'ESCALATE' | 'SEND_EMAIL' | 'UPDATE_BALANCE' | 'LOG_EVENT';
  parameters: Record<string, any>;
  delay?: number; // minutes
  conditions?: RuleCondition[];
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  trigger: {
    type: 'LEAVE_REQUEST' | 'APPROVAL_PENDING' | 'LEAVE_APPROVED' | 'LEAVE_REJECTED' | 'SCHEDULE_TRIGGER';
    conditions: RuleCondition[];
  };
  actions: RuleAction[];
  validationRules?: RuleCondition[];
}

interface RuleBuilderProps {
  rule?: AutomationRule;
  onSave: (rule: AutomationRule) => void;
  onCancel: () => void;
}

const RuleBuilder: React.FC<RuleBuilderProps> = ({ rule, onSave, onCancel }) => {
  const [currentRule, setCurrentRule] = useState<AutomationRule>(
    rule || {
      id: `rule_${Date.now()}`,
      name: '',
      description: '',
      enabled: true,
      priority: 1,
      trigger: {
        type: 'LEAVE_REQUEST',
        conditions: []
      },
      actions: [],
      validationRules: []
    }
  );

  const [activeStep, setActiveStep] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  // Condition Types Configuration
  const conditionTypes = {
    LEAVE_TYPE: {
      label: 'Leave Type',
      operators: ['EQUALS', 'NOT_EQUALS', 'CONTAINS'],
      valueType: 'select',
      options: ['ANNUAL', 'SICK', 'PERSONAL', 'MATERNITY', 'PATERNITY', 'BEREAVEMENT', 'UNPAID']
    },
    DURATION: {
      label: 'Duration (Days)',
      operators: ['EQUALS', 'GREATER_THAN', 'LESS_THAN', 'IN_RANGE'],
      valueType: 'number'
    },
    USER_ROLE: {
      label: 'User Role',
      operators: ['EQUALS', 'NOT_EQUALS', 'CONTAINS'],
      valueType: 'select',
      options: ['EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'IT_ADMIN']
    },
    DEPARTMENT: {
      label: 'Department',
      operators: ['EQUALS', 'NOT_EQUALS', 'CONTAINS'],
      valueType: 'select',
      options: ['Engineering', 'HR', 'Finance', 'Marketing', 'Operations']
    },
    BALANCE: {
      label: 'Leave Balance',
      operators: ['GREATER_THAN', 'LESS_THAN', 'EQUALS'],
      valueType: 'number'
    },
    DATE_RANGE: {
      label: 'Date Range',
      operators: ['IN_RANGE', 'NOT_IN_RANGE'],
      valueType: 'date-range'
    },
    CUSTOM: {
      label: 'Custom Condition',
      operators: ['EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'LESS_THAN', 'CONTAINS'],
      valueType: 'text'
    }
  };

  // Action Types Configuration
  const actionTypes = {
    AUTO_APPROVE: {
      label: 'Auto Approve',
      icon: <CheckCircle color="success" />,
      parameters: ['notification', 'updateCalendar'],
      color: 'success'
    },
    AUTO_REJECT: {
      label: 'Auto Reject',
      icon: <Cancel color="error" />,
      parameters: ['reason', 'notification'],
      color: 'error'
    },
    NOTIFY_MANAGER: {
      label: 'Notify Manager',
      icon: <Notifications color="info" />,
      parameters: ['template', 'urgency'],
      color: 'info'
    },
    ESCALATE: {
      label: 'Escalate to HR',
      icon: <Warning color="warning" />,
      parameters: ['escalateTo', 'reason', 'timeLimit'],
      color: 'warning'
    },
    SEND_EMAIL: {
      label: 'Send Email',
      icon: <Email color="primary" />,
      parameters: ['recipients', 'template', 'subject'],
      color: 'primary'
    },
    UPDATE_BALANCE: {
      label: 'Update Balance',
      icon: <Settings />,
      parameters: ['balanceType', 'amount', 'operation'],
      color: 'default'
    },
    LOG_EVENT: {
      label: 'Log Event',
      icon: <Code />,
      parameters: ['level', 'message', 'category'],
      color: 'default'
    }
  };

  const addCondition = (target: 'trigger' | 'validation') => {
    const newCondition: RuleCondition = {
      id: `condition_${Date.now()}`,
      type: 'LEAVE_TYPE',
      operator: 'EQUALS',
      value: '',
      logicalOperator: 'AND'
    };

    if (target === 'trigger') {
      setCurrentRule(prev => ({
        ...prev,
        trigger: {
          ...prev.trigger,
          conditions: [...prev.trigger.conditions, newCondition]
        }
      }));
    } else {
      setCurrentRule(prev => ({
        ...prev,
        validationRules: [...(prev.validationRules || []), newCondition]
      }));
    }
  };

  const updateCondition = (id: string, updates: Partial<RuleCondition>, target: 'trigger' | 'validation') => {
    if (target === 'trigger') {
      setCurrentRule(prev => ({
        ...prev,
        trigger: {
          ...prev.trigger,
          conditions: prev.trigger.conditions.map(c =>
            c.id === id ? { ...c, ...updates } : c
          )
        }
      }));
    } else {
      setCurrentRule(prev => ({
        ...prev,
        validationRules: (prev.validationRules || []).map(c =>
          c.id === id ? { ...c, ...updates } : c
        )
      }));
    }
  };

  const removeCondition = (id: string, target: 'trigger' | 'validation') => {
    if (target === 'trigger') {
      setCurrentRule(prev => ({
        ...prev,
        trigger: {
          ...prev.trigger,
          conditions: prev.trigger.conditions.filter(c => c.id !== id)
        }
      }));
    } else {
      setCurrentRule(prev => ({
        ...prev,
        validationRules: (prev.validationRules || []).filter(c => c.id !== id)
      }));
    }
  };

  const addAction = () => {
    const newAction: RuleAction = {
      id: `action_${Date.now()}`,
      type: 'AUTO_APPROVE',
      parameters: {},
      delay: 0
    };

    setCurrentRule(prev => ({
      ...prev,
      actions: [...prev.actions, newAction]
    }));
  };

  const updateAction = (id: string, updates: Partial<RuleAction>) => {
    setCurrentRule(prev => ({
      ...prev,
      actions: prev.actions.map(a =>
        a.id === id ? { ...a, ...updates } : a
      )
    }));
  };

  const removeAction = (id: string) => {
    setCurrentRule(prev => ({
      ...prev,
      actions: prev.actions.filter(a => a.id !== id)
    }));
  };

  const onDragEnd = useCallback((result: any) => {
    if (!result.destination) return;

    const { source, destination, type } = result;

    if (type === 'actions') {
      const newActions = Array.from(currentRule.actions);
      const [removed] = newActions.splice(source.index, 1);
      newActions.splice(destination.index, 0, removed);

      setCurrentRule(prev => ({ ...prev, actions: newActions }));
    }
  }, [currentRule.actions]);

  const testRule = () => {
    // Mock test execution
    const mockTestData = {
      leaveType: 'SICK',
      duration: 1,
      userRole: 'EMPLOYEE',
      department: 'Engineering',
      balance: 10
    };

    const results = {
      triggerMatched: true,
      actionsExecuted: currentRule.actions.length,
      validationPassed: true,
      mockData: mockTestData,
      executionTime: Math.random() * 100 + 50
    };

    setTestResults(results);
  };

  const renderConditionBuilder = (
    conditions: RuleCondition[],
    target: 'trigger' | 'validation',
    title: string
  ) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">{title}</Typography>
          <Button
            size="small"
            startIcon={<Add />}
            onClick={() => addCondition(target)}
          >
            Add Condition
          </Button>
        </Box>

        {conditions.length === 0 && (
          <Alert severity="info">
            No conditions defined. Add conditions to specify when this rule should trigger.
          </Alert>
        )}

        {conditions.map((condition, index) => (
          <Paper key={condition.id} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
            <Grid container spacing={2} alignItems="center">
              {index > 0 && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Divider sx={{ flex: 1 }} />
                    <FormControl size="small">
                      <Select
                        value={condition.logicalOperator || 'AND'}
                        onChange={(e) => updateCondition(condition.id, { logicalOperator: e.target.value as 'AND' | 'OR' }, target)}
                      >
                        <MenuItem value="AND">AND</MenuItem>
                        <MenuItem value="OR">OR</MenuItem>
                      </Select>
                    </FormControl>
                    <Divider sx={{ flex: 1 }} />
                  </Box>
                </Grid>
              )}

              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Condition Type</InputLabel>
                  <Select
                    value={condition.type}
                    label="Condition Type"
                    onChange={(e) => updateCondition(condition.id, {
                      type: e.target.value as any,
                      operator: conditionTypes[e.target.value as keyof typeof conditionTypes].operators[0] as any,
                      value: ''
                    }, target)}
                  >
                    {Object.entries(conditionTypes).map(([key, config]) => (
                      <MenuItem key={key} value={key}>{config.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Operator</InputLabel>
                  <Select
                    value={condition.operator}
                    label="Operator"
                    onChange={(e) => updateCondition(condition.id, { operator: e.target.value as any }, target)}
                  >
                    {conditionTypes[condition.type].operators.map(op => (
                      <MenuItem key={op} value={op}>
                        {op.replace('_', ' ').toLowerCase()}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                {conditionTypes[condition.type].valueType === 'select' ? (
                  <FormControl fullWidth size="small">
                    <InputLabel>Value</InputLabel>
                    <Select
                      value={condition.value}
                      label="Value"
                      onChange={(e) => updateCondition(condition.id, { value: e.target.value }, target)}
                    >
                      {conditionTypes[condition.type].options?.map(option => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : conditionTypes[condition.type].valueType === 'number' ? (
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Value"
                    value={condition.value}
                    onChange={(e) => updateCondition(condition.id, { value: e.target.value }, target)}
                  />
                ) : (
                  <TextField
                    fullWidth
                    size="small"
                    label="Value"
                    value={condition.value}
                    onChange={(e) => updateCondition(condition.id, { value: e.target.value }, target)}
                  />
                )}
              </Grid>

              <Grid item xs={12} sm={2}>
                <IconButton
                  color="error"
                  onClick={() => removeCondition(condition.id, target)}
                >
                  <Delete />
                </IconButton>
              </Grid>
            </Grid>
          </Paper>
        ))}
      </CardContent>
    </Card>
  );

  const renderActionBuilder = () => (
    <DragDropContext onDragEnd={onDragEnd}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Actions</Typography>
            <Button
              startIcon={<Add />}
              onClick={addAction}
            >
              Add Action
            </Button>
          </Box>

          {currentRule.actions.length === 0 && (
            <Alert severity="info">
              No actions defined. Add actions to specify what should happen when conditions are met.
            </Alert>
          )}

          <Droppable droppableId="actions" type="actions">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {currentRule.actions.map((action, index) => (
                  <Draggable key={action.id} draggableId={action.id} index={index}>
                    {(provided, snapshot) => (
                      <Paper
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        sx={{
                          p: 2,
                          mb: 2,
                          border: '1px solid',
                          borderColor: snapshot.isDragging ? 'primary.main' : 'divider',
                          backgroundColor: snapshot.isDragging ? 'action.hover' : 'background.paper'
                        }}
                      >
                        <Grid container spacing={2} alignItems="center">
                          <Grid item>
                            <Box {...provided.dragHandleProps}>
                              <DragIndicator />
                            </Box>
                          </Grid>

                          <Grid item>
                            <Avatar
                              sx={{
                                bgcolor: `${actionTypes[action.type].color}.main`,
                                width: 32,
                                height: 32
                              }}
                            >
                              {actionTypes[action.type].icon}
                            </Avatar>
                          </Grid>

                          <Grid item xs>
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                              <InputLabel>Action Type</InputLabel>
                              <Select
                                value={action.type}
                                label="Action Type"
                                onChange={(e) => updateAction(action.id, { type: e.target.value as any, parameters: {} })}
                              >
                                {Object.entries(actionTypes).map(([key, config]) => (
                                  <MenuItem key={key} value={key}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      {config.icon}
                                      {config.label}
                                    </Box>
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>

                          <Grid item>
                            <TextField
                              size="small"
                              type="number"
                              label="Delay (min)"
                              value={action.delay || 0}
                              onChange={(e) => updateAction(action.id, { delay: parseInt(e.target.value) || 0 })}
                              sx={{ width: 120 }}
                            />
                          </Grid>

                          <Grid item>
                            <IconButton
                              color="error"
                              onClick={() => removeAction(action.id)}
                            >
                              <Delete />
                            </IconButton>
                          </Grid>
                        </Grid>

                        {/* Action Parameters */}
                        <Accordion sx={{ mt: 2 }}>
                          <AccordionSummary expandIcon={<ExpandMore />}>
                            <Typography variant="body2">Configure Parameters</Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Grid container spacing={2}>
                              {actionTypes[action.type].parameters.map(param => (
                                <Grid item xs={12} sm={6} key={param}>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    label={param.charAt(0).toUpperCase() + param.slice(1)}
                                    value={action.parameters[param] || ''}
                                    onChange={(e) => updateAction(action.id, {
                                      parameters: { ...action.parameters, [param]: e.target.value }
                                    })}
                                  />
                                </Grid>
                              ))}
                            </Grid>
                          </AccordionDetails>
                        </Accordion>
                      </Paper>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </CardContent>
      </Card>
    </DragDropContext>
  );

  const renderPreview = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Rule Preview</Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>Rule Summary</Typography>
          <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
            <Typography variant="body2">
              <strong>Name:</strong> {currentRule.name || 'Untitled Rule'}
            </Typography>
            <Typography variant="body2">
              <strong>Description:</strong> {currentRule.description || 'No description provided'}
            </Typography>
            <Typography variant="body2">
              <strong>Priority:</strong> {currentRule.priority}
            </Typography>
            <Typography variant="body2">
              <strong>Status:</strong> {currentRule.enabled ? 'Enabled' : 'Disabled'}
            </Typography>
          </Paper>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>Trigger Conditions ({currentRule.trigger.conditions.length})</Typography>
          {currentRule.trigger.conditions.map((condition, index) => (
            <Chip
              key={condition.id}
              label={`${condition.type} ${condition.operator} ${condition.value}`}
              size="small"
              sx={{ mr: 1, mb: 1 }}
            />
          ))}
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>Actions ({currentRule.actions.length})</Typography>
          {currentRule.actions.map((action, index) => (
            <Box key={action.id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" sx={{ mr: 2 }}>
                {index + 1}.
              </Typography>
              {actionTypes[action.type].icon}
              <Typography variant="body2" sx={{ ml: 1 }}>
                {actionTypes[action.type].label}
                {action.delay && action.delay > 0 && (
                  <span style={{ color: 'text.secondary' }}> (after {action.delay} minutes)</span>
                )}
              </Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ mb: 3 }}>
          <Button
            variant="outlined"
            startIcon={<PlayArrow />}
            onClick={testRule}
            sx={{ mr: 2 }}
          >
            Test Rule
          </Button>

          {testResults && (
            <Alert severity={testResults.triggerMatched ? 'success' : 'warning'} sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Test Results:</strong><br />
                Trigger Matched: {testResults.triggerMatched ? 'Yes' : 'No'}<br />
                Actions Executed: {testResults.actionsExecuted}<br />
                Validation Passed: {testResults.validationPassed ? 'Yes' : 'No'}<br />
                Execution Time: {testResults.executionTime.toFixed(2)}ms
              </Typography>
            </Alert>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  const steps = [
    'Basic Info',
    'Trigger Conditions',
    'Validation Rules',
    'Actions',
    'Preview & Test'
  ];

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          {rule ? 'Edit Automation Rule' : 'Create New Automation Rule'}
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Build sophisticated automation rules with visual drag-and-drop interface
        </Typography>

        {/* Step Navigation */}
        <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap' }}>
          {steps.map((step, index) => (
            <Chip
              key={index}
              label={step}
              onClick={() => setActiveStep(index)}
              color={activeStep === index ? 'primary' : 'default'}
              variant={activeStep === index ? 'filled' : 'outlined'}
              clickable
            />
          ))}
        </Box>
      </Paper>

      {/* Step Content */}
      <Box sx={{ mb: 3 }}>
        {activeStep === 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Basic Information</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Rule Name"
                    value={currentRule.name}
                    onChange={(e) => setCurrentRule(prev => ({ ...prev, name: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Priority"
                    value={currentRule.priority}
                    onChange={(e) => setCurrentRule(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={currentRule.enabled}
                        onChange={(e) => setCurrentRule(prev => ({ ...prev, enabled: e.target.checked }))}
                      />
                    }
                    label="Enabled"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Description"
                    value={currentRule.description}
                    onChange={(e) => setCurrentRule(prev => ({ ...prev, description: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Trigger Type</InputLabel>
                    <Select
                      value={currentRule.trigger.type}
                      label="Trigger Type"
                      onChange={(e) => setCurrentRule(prev => ({
                        ...prev,
                        trigger: { ...prev.trigger, type: e.target.value as any }
                      }))}
                    >
                      <MenuItem value="LEAVE_REQUEST">Leave Request Submitted</MenuItem>
                      <MenuItem value="APPROVAL_PENDING">Approval Pending</MenuItem>
                      <MenuItem value="LEAVE_APPROVED">Leave Approved</MenuItem>
                      <MenuItem value="LEAVE_REJECTED">Leave Rejected</MenuItem>
                      <MenuItem value="SCHEDULE_TRIGGER">Scheduled Trigger</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {activeStep === 1 && renderConditionBuilder(
          currentRule.trigger.conditions,
          'trigger',
          'Trigger Conditions'
        )}

        {activeStep === 2 && renderConditionBuilder(
          currentRule.validationRules || [],
          'validation',
          'Validation Rules'
        )}

        {activeStep === 3 && renderActionBuilder()}

        {activeStep === 4 && renderPreview()}
      </Box>

      {/* Footer Actions */}
      <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Button
            disabled={activeStep === 0}
            onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
            sx={{ mr: 1 }}
          >
            Previous
          </Button>
          <Button
            disabled={activeStep === steps.length - 1}
            onClick={() => setActiveStep(prev => Math.min(steps.length - 1, prev + 1))}
          >
            Next
          </Button>
        </Box>

        <Box>
          <Button onClick={onCancel} sx={{ mr: 2 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={() => onSave(currentRule)}
            disabled={!currentRule.name || currentRule.actions.length === 0}
          >
            Save Rule
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default RuleBuilder;