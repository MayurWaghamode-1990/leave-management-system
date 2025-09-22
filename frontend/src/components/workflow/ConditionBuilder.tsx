import React, { useState } from 'react';
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
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  Paper,
  Divider,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Avatar
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  Code,
  Rule,
  ExpandMore,
  PlayArrow,
  Schedule,
  Person,
  Business,
  Event,
  DateRange,
  AttachMoney,
  Group,
  Warning,
  CheckCircle,
  Cancel,
  FilterList,
  Functions,
  Psychology
} from '@mui/icons-material';
import toast from 'react-hot-toast';

interface Condition {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'between' | 'exists';
  value: any;
  valueType: 'static' | 'dynamic' | 'function';
  logicalOperator?: 'AND' | 'OR';
}

interface ConditionGroup {
  id: string;
  name: string;
  conditions: Condition[];
  logicalOperator: 'AND' | 'OR';
  enabled: boolean;
}

interface ConditionRule {
  id: string;
  name: string;
  description: string;
  conditionGroups: ConditionGroup[];
  priority: number;
  enabled: boolean;
  category: 'VALIDATION' | 'APPROVAL' | 'NOTIFICATION' | 'ESCALATION';
  actions: Array<{
    type: string;
    parameters: Record<string, any>;
  }>;
}

interface ConditionBuilderProps {
  open: boolean;
  onClose: () => void;
  onSave: (rule: ConditionRule) => void;
  initialRule?: ConditionRule;
}

const ConditionBuilder: React.FC<ConditionBuilderProps> = ({
  open,
  onClose,
  onSave,
  initialRule
}) => {
  const [rule, setRule] = useState<ConditionRule>(
    initialRule || {
      id: '',
      name: '',
      description: '',
      conditionGroups: [],
      priority: 1,
      enabled: true,
      category: 'VALIDATION',
      actions: []
    }
  );

  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [conditionDialog, setConditionDialog] = useState(false);
  const [newCondition, setNewCondition] = useState<Partial<Condition>>({
    field: 'leaveType',
    operator: 'equals',
    value: '',
    valueType: 'static'
  });

  // Available fields for conditions
  const conditionFields = [
    { value: 'leaveType', label: 'Leave Type', type: 'string', icon: <Event /> },
    { value: 'duration', label: 'Duration (days)', type: 'number', icon: <DateRange /> },
    { value: 'startDate', label: 'Start Date', type: 'date', icon: <Schedule /> },
    { value: 'endDate', label: 'End Date', type: 'date', icon: <Schedule /> },
    { value: 'userRole', label: 'User Role', type: 'string', icon: <Person /> },
    { value: 'department', label: 'Department', type: 'string', icon: <Business /> },
    { value: 'salary', label: 'Salary', type: 'number', icon: <AttachMoney /> },
    { value: 'seniority', label: 'Seniority (years)', type: 'number', icon: <Person /> },
    { value: 'leaveBalance', label: 'Leave Balance', type: 'number', icon: <Event /> },
    { value: 'previousRequests', label: 'Previous Requests', type: 'number', icon: <Event /> },
    { value: 'teamSize', label: 'Team Size', type: 'number', icon: <Group /> },
    { value: 'isWeekend', label: 'Is Weekend', type: 'boolean', icon: <DateRange /> },
    { value: 'isHoliday', label: 'Is Holiday', type: 'boolean', icon: <Event /> },
    { value: 'hasOverlap', label: 'Has Overlap', type: 'boolean', icon: <Warning /> }
  ];

  // Available operators
  const operators = [
    { value: 'equals', label: 'Equals (=)' },
    { value: 'not_equals', label: 'Not Equals (≠)' },
    { value: 'greater_than', label: 'Greater Than (>)' },
    { value: 'less_than', label: 'Less Than (<)' },
    { value: 'contains', label: 'Contains' },
    { value: 'in', label: 'In List' },
    { value: 'between', label: 'Between' },
    { value: 'exists', label: 'Exists' }
  ];

  const addConditionGroup = () => {
    const newGroup: ConditionGroup = {
      id: Date.now().toString(),
      name: `Group ${rule.conditionGroups.length + 1}`,
      conditions: [],
      logicalOperator: 'AND',
      enabled: true
    };
    setRule(prev => ({
      ...prev,
      conditionGroups: [...prev.conditionGroups, newGroup]
    }));
  };

  const updateConditionGroup = (groupId: string, updates: Partial<ConditionGroup>) => {
    setRule(prev => ({
      ...prev,
      conditionGroups: prev.conditionGroups.map(group =>
        group.id === groupId ? { ...group, ...updates } : group
      )
    }));
  };

  const deleteConditionGroup = (groupId: string) => {
    setRule(prev => ({
      ...prev,
      conditionGroups: prev.conditionGroups.filter(group => group.id !== groupId)
    }));
  };

  const addCondition = (groupId: string) => {
    setSelectedGroup(groupId);
    setConditionDialog(true);
    setNewCondition({
      field: 'leaveType',
      operator: 'equals',
      value: '',
      valueType: 'static'
    });
  };

  const saveCondition = () => {
    if (!selectedGroup || !newCondition.field || !newCondition.operator) {
      toast.error('Please fill in all required fields');
      return;
    }

    const condition: Condition = {
      id: Date.now().toString(),
      field: newCondition.field!,
      operator: newCondition.operator!,
      value: newCondition.value,
      valueType: newCondition.valueType || 'static',
      logicalOperator: 'AND'
    };

    updateConditionGroup(selectedGroup, {
      conditions: [
        ...rule.conditionGroups.find(g => g.id === selectedGroup)?.conditions || [],
        condition
      ]
    });

    setConditionDialog(false);
    toast.success('Condition added successfully');
  };

  const deleteCondition = (groupId: string, conditionId: string) => {
    updateConditionGroup(groupId, {
      conditions: rule.conditionGroups
        .find(g => g.id === groupId)?.conditions
        .filter(c => c.id !== conditionId) || []
    });
  };

  const getFieldIcon = (fieldName: string) => {
    const field = conditionFields.find(f => f.value === fieldName);
    return field?.icon || <Rule />;
  };

  const getOperatorSymbol = (operator: string) => {
    const op = operators.find(o => o.value === operator);
    return op?.label || operator;
  };

  const renderConditionValue = (condition: Condition) => {
    if (condition.valueType === 'function') {
      return (
        <Chip
          icon={<Functions />}
          label={`Function: ${condition.value}`}
          size="small"
          color="info"
          variant="outlined"
        />
      );
    }
    if (condition.valueType === 'dynamic') {
      return (
        <Chip
          icon={<Psychology />}
          label={`Dynamic: ${condition.value}`}
          size="small"
          color="warning"
          variant="outlined"
        />
      );
    }
    return (
      <Chip
        label={String(condition.value)}
        size="small"
        color="primary"
        variant="outlined"
      />
    );
  };

  const validateRule = () => {
    if (!rule.name.trim()) {
      toast.error('Rule name is required');
      return false;
    }
    if (rule.conditionGroups.length === 0) {
      toast.error('At least one condition group is required');
      return false;
    }
    if (rule.conditionGroups.some(group => group.conditions.length === 0)) {
      toast.error('All condition groups must have at least one condition');
      return false;
    }
    return true;
  };

  const handleSave = () => {
    if (!validateRule()) return;
    onSave(rule);
    onClose();
    toast.success('Rule saved successfully');
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Code />
            {initialRule ? 'Edit Condition Rule' : 'Create Condition Rule'}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Rule Basic Info */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Rule Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Rule Name"
                        value={rule.name}
                        onChange={(e) => setRule(prev => ({ ...prev, name: e.target.value }))}
                        fullWidth
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Category</InputLabel>
                        <Select
                          value={rule.category}
                          onChange={(e) => setRule(prev => ({ ...prev, category: e.target.value as any }))}
                          label="Category"
                        >
                          <MenuItem value="VALIDATION">Validation</MenuItem>
                          <MenuItem value="APPROVAL">Approval</MenuItem>
                          <MenuItem value="NOTIFICATION">Notification</MenuItem>
                          <MenuItem value="ESCALATION">Escalation</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Description"
                        value={rule.description}
                        onChange={(e) => setRule(prev => ({ ...prev, description: e.target.value }))}
                        multiline
                        rows={2}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Priority"
                        type="number"
                        value={rule.priority}
                        onChange={(e) => setRule(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={rule.enabled}
                            onChange={(e) => setRule(prev => ({ ...prev, enabled: e.target.checked }))}
                          />
                        }
                        label="Enable Rule"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Condition Groups */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Condition Groups</Typography>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={addConditionGroup}
                      size="small"
                    >
                      Add Group
                    </Button>
                  </Box>

                  {rule.conditionGroups.length === 0 ? (
                    <Alert severity="info">
                      Create condition groups to define when this rule should trigger.
                    </Alert>
                  ) : (
                    <Box>
                      {rule.conditionGroups.map((group, groupIndex) => (
                        <Box key={group.id}>
                          <Accordion defaultExpanded>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                  <FilterList />
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="subtitle1" fontWeight="medium">
                                    {group.name}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    {group.conditions.length} conditions • {group.logicalOperator} logic
                                  </Typography>
                                </Box>
                                <FormControl size="small" sx={{ minWidth: 100 }}>
                                  <Select
                                    value={group.logicalOperator}
                                    onChange={(e) => updateConditionGroup(group.id, { logicalOperator: e.target.value as 'AND' | 'OR' })}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MenuItem value="AND">AND</MenuItem>
                                    <MenuItem value="OR">OR</MenuItem>
                                  </Select>
                                </FormControl>
                                <Switch
                                  checked={group.enabled}
                                  onChange={(e) => updateConditionGroup(group.id, { enabled: e.target.checked })}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <IconButton
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteConditionGroup(group.id);
                                  }}
                                  color="error"
                                  size="small"
                                >
                                  <Delete />
                                </IconButton>
                              </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                              {/* Conditions List */}
                              <List>
                                {group.conditions.map((condition, conditionIndex) => (
                                  <ListItem key={condition.id} divider>
                                    <ListItemText
                                      primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                          {getFieldIcon(condition.field)}
                                          <Typography variant="body2" fontWeight="medium">
                                            {conditionFields.find(f => f.value === condition.field)?.label || condition.field}
                                          </Typography>
                                          <Typography variant="body2" color="textSecondary">
                                            {getOperatorSymbol(condition.operator)}
                                          </Typography>
                                          {renderConditionValue(condition)}
                                          {conditionIndex > 0 && (
                                            <Chip
                                              label={condition.logicalOperator}
                                              size="small"
                                              variant="outlined"
                                              sx={{ ml: 'auto' }}
                                            />
                                          )}
                                        </Box>
                                      }
                                      secondary={
                                        <Typography variant="caption" color="textSecondary">
                                          {condition.valueType === 'static' ? 'Static value' :
                                           condition.valueType === 'dynamic' ? 'Dynamic value' : 'Function call'}
                                        </Typography>
                                      }
                                    />
                                    <ListItemSecondaryAction>
                                      <IconButton
                                        onClick={() => deleteCondition(group.id, condition.id)}
                                        color="error"
                                        size="small"
                                      >
                                        <Delete />
                                      </IconButton>
                                    </ListItemSecondaryAction>
                                  </ListItem>
                                ))}
                              </List>

                              <Button
                                variant="outlined"
                                startIcon={<Add />}
                                onClick={() => addCondition(group.id)}
                                size="small"
                                sx={{ mt: 1 }}
                              >
                                Add Condition
                              </Button>
                            </AccordionDetails>
                          </Accordion>

                          {/* Logical operator between groups */}
                          {groupIndex < rule.conditionGroups.length - 1 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                              <Chip label="AND" color="primary" variant="outlined" />
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Rule Preview */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Rule Preview
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      IF ({rule.conditionGroups.map((group, index) => (
                        `(${group.conditions.map(c =>
                          `${c.field} ${c.operator} ${c.value}`
                        ).join(` ${group.logicalOperator} `)})`
                      )).join(' AND ')}) THEN execute actions
                    </Typography>
                  </Paper>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            Save Rule
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Condition Dialog */}
      <Dialog open={conditionDialog} onClose={() => setConditionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Condition</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Field</InputLabel>
                <Select
                  value={newCondition.field || ''}
                  onChange={(e) => setNewCondition(prev => ({ ...prev, field: e.target.value }))}
                  label="Field"
                >
                  {conditionFields.map(field => (
                    <MenuItem key={field.value} value={field.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {field.icon}
                        {field.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Operator</InputLabel>
                <Select
                  value={newCondition.operator || ''}
                  onChange={(e) => setNewCondition(prev => ({ ...prev, operator: e.target.value as any }))}
                  label="Operator"
                >
                  {operators.map(op => (
                    <MenuItem key={op.value} value={op.value}>
                      {op.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={8}>
              <TextField
                label="Value"
                value={newCondition.value || ''}
                onChange={(e) => setNewCondition(prev => ({ ...prev, value: e.target.value }))}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={newCondition.valueType || 'static'}
                  onChange={(e) => setNewCondition(prev => ({ ...prev, valueType: e.target.value as any }))}
                  label="Type"
                >
                  <MenuItem value="static">Static</MenuItem>
                  <MenuItem value="dynamic">Dynamic</MenuItem>
                  <MenuItem value="function">Function</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConditionDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveCondition}>
            Add Condition
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ConditionBuilder;