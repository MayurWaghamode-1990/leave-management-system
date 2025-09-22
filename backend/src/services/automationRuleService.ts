import { logger } from '../utils/logger';

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
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastExecuted?: Date;
  executionCount: number;
}

export interface RuleExecutionContext {
  leaveRequest?: any;
  user?: any;
  currentDate: Date;
  systemState: Record<string, any>;
}

export interface RuleExecutionResult {
  success: boolean;
  actionsExecuted: string[];
  errors: string[];
  executionTime: number;
  nextActions?: Array<{
    actionId: string;
    executeAt: Date;
  }>;
}

export class AutomationRuleService {
  /**
   * Create a new automation rule
   */
  static async createRule(ruleData: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt' | 'executionCount'>): Promise<AutomationRule> {
    try {
      const rule: AutomationRule = {
        ...ruleData,
        id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        executionCount: 0
      };

      // In production, save to database
      // await prisma.automationRule.create({ data: rule });

      logger.info('Automation rule created:', {
        ruleId: rule.id,
        name: rule.name,
        createdBy: rule.createdBy
      });

      return rule;
    } catch (error) {
      logger.error('Error creating automation rule:', error);
      throw new Error('Failed to create automation rule');
    }
  }

  /**
   * Update an existing automation rule
   */
  static async updateRule(ruleId: string, updates: Partial<AutomationRule>): Promise<AutomationRule | null> {
    try {
      // In production, update in database
      // const updatedRule = await prisma.automationRule.update({
      //   where: { id: ruleId },
      //   data: { ...updates, updatedAt: new Date() }
      // });

      logger.info('Automation rule updated:', { ruleId, updates: Object.keys(updates) });

      // Mock return for now
      return {
        id: ruleId,
        name: updates.name || 'Updated Rule',
        description: updates.description || '',
        enabled: updates.enabled ?? true,
        priority: updates.priority || 1,
        trigger: updates.trigger || { type: 'LEAVE_REQUEST', conditions: [] },
        actions: updates.actions || [],
        validationRules: updates.validationRules,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        executionCount: 0
      };
    } catch (error) {
      logger.error('Error updating automation rule:', error);
      throw new Error('Failed to update automation rule');
    }
  }

  /**
   * Delete an automation rule
   */
  static async deleteRule(ruleId: string): Promise<boolean> {
    try {
      // In production, delete from database
      // await prisma.automationRule.delete({ where: { id: ruleId } });

      logger.info('Automation rule deleted:', { ruleId });
      return true;
    } catch (error) {
      logger.error('Error deleting automation rule:', error);
      throw new Error('Failed to delete automation rule');
    }
  }

  /**
   * Get all automation rules
   */
  static async getRules(filters?: {
    enabled?: boolean;
    triggerType?: string;
    createdBy?: string;
  }): Promise<AutomationRule[]> {
    try {
      // In production, fetch from database with filters
      // const rules = await prisma.automationRule.findMany({
      //   where: filters,
      //   orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }]
      // });

      // Mock data for now
      const mockRules: AutomationRule[] = [];
      return mockRules;
    } catch (error) {
      logger.error('Error fetching automation rules:', error);
      throw new Error('Failed to fetch automation rules');
    }
  }

  /**
   * Get a specific automation rule by ID
   */
  static async getRuleById(ruleId: string): Promise<AutomationRule | null> {
    try {
      // In production, fetch from database
      // const rule = await prisma.automationRule.findUnique({ where: { id: ruleId } });

      logger.info('Fetched automation rule:', { ruleId });
      return null; // Mock return
    } catch (error) {
      logger.error('Error fetching automation rule:', error);
      throw new Error('Failed to fetch automation rule');
    }
  }

  /**
   * Evaluate if conditions are met
   */
  static evaluateConditions(conditions: RuleCondition[], context: RuleExecutionContext): boolean {
    if (conditions.length === 0) return true;

    let result = true;
    let currentLogicalOperator: 'AND' | 'OR' | null = null;

    for (let i = 0; i < conditions.length; i++) {
      const condition = conditions[i];
      const conditionResult = this.evaluateCondition(condition, context);

      if (i === 0) {
        result = conditionResult;
      } else {
        const logicalOp = conditions[i - 1].logicalOperator || 'AND';
        if (logicalOp === 'AND') {
          result = result && conditionResult;
        } else if (logicalOp === 'OR') {
          result = result || conditionResult;
        }
      }
    }

    return result;
  }

  /**
   * Evaluate a single condition
   */
  private static evaluateCondition(condition: RuleCondition, context: RuleExecutionContext): boolean {
    const { type, operator, value } = condition;
    let contextValue: any;

    // Extract context value based on condition type
    switch (type) {
      case 'LEAVE_TYPE':
        contextValue = context.leaveRequest?.leaveType;
        break;
      case 'DURATION':
        contextValue = context.leaveRequest?.duration;
        break;
      case 'USER_ROLE':
        contextValue = context.user?.role;
        break;
      case 'DEPARTMENT':
        contextValue = context.user?.department;
        break;
      case 'BALANCE':
        contextValue = context.leaveRequest?.userBalance;
        break;
      case 'DATE_RANGE':
        contextValue = context.leaveRequest?.startDate;
        break;
      default:
        contextValue = context.systemState[type];
    }

    // Evaluate condition based on operator
    switch (operator) {
      case 'EQUALS':
        return contextValue === value;
      case 'NOT_EQUALS':
        return contextValue !== value;
      case 'GREATER_THAN':
        return parseFloat(contextValue) > parseFloat(value);
      case 'LESS_THAN':
        return parseFloat(contextValue) < parseFloat(value);
      case 'CONTAINS':
        return String(contextValue).toLowerCase().includes(String(value).toLowerCase());
      case 'IN_RANGE':
        // For date ranges or numeric ranges
        if (Array.isArray(value) && value.length === 2) {
          const numValue = parseFloat(contextValue);
          return numValue >= parseFloat(value[0]) && numValue <= parseFloat(value[1]);
        }
        return false;
      default:
        return false;
    }
  }

  /**
   * Execute automation rules for a given context
   */
  static async executeRules(triggerType: string, context: RuleExecutionContext): Promise<RuleExecutionResult[]> {
    try {
      const startTime = Date.now();
      const results: RuleExecutionResult[] = [];

      // Get all enabled rules for this trigger type
      const rules = await this.getRules({ enabled: true });
      const applicableRules = rules.filter(rule => rule.trigger.type === triggerType);

      // Sort by priority
      applicableRules.sort((a, b) => a.priority - b.priority);

      for (const rule of applicableRules) {
        const ruleResult = await this.executeRule(rule, context);
        results.push(ruleResult);

        // Update execution count
        // In production, update database
        // await prisma.automationRule.update({
        //   where: { id: rule.id },
        //   data: {
        //     executionCount: { increment: 1 },
        //     lastExecuted: new Date()
        //   }
        // });
      }

      const totalTime = Date.now() - startTime;
      logger.info('Automation rules executed:', {
        triggerType,
        rulesExecuted: results.length,
        totalExecutionTime: totalTime
      });

      return results;
    } catch (error) {
      logger.error('Error executing automation rules:', error);
      throw new Error('Failed to execute automation rules');
    }
  }

  /**
   * Execute a single rule
   */
  private static async executeRule(rule: AutomationRule, context: RuleExecutionContext): Promise<RuleExecutionResult> {
    const startTime = Date.now();
    const result: RuleExecutionResult = {
      success: true,
      actionsExecuted: [],
      errors: [],
      executionTime: 0,
      nextActions: []
    };

    try {
      // Check if trigger conditions are met
      const triggerMet = this.evaluateConditions(rule.trigger.conditions, context);

      if (!triggerMet) {
        result.success = false;
        logger.debug('Rule trigger conditions not met:', { ruleId: rule.id });
        return result;
      }

      // Check validation rules if they exist
      if (rule.validationRules && rule.validationRules.length > 0) {
        const validationPassed = this.evaluateConditions(rule.validationRules, context);
        if (!validationPassed) {
          result.success = false;
          result.errors.push('Validation rules not met');
          return result;
        }
      }

      // Execute actions
      for (const action of rule.actions) {
        try {
          if (action.delay && action.delay > 0) {
            // Schedule delayed action
            const executeAt = new Date(Date.now() + action.delay * 60 * 1000);
            result.nextActions?.push({
              actionId: action.id,
              executeAt
            });
          } else {
            // Execute immediately
            await this.executeAction(action, context);
            result.actionsExecuted.push(action.type);
          }
        } catch (actionError: any) {
          result.errors.push(`Action ${action.type} failed: ${actionError.message}`);
          logger.error('Action execution failed:', {
            ruleId: rule.id,
            actionId: action.id,
            actionType: action.type,
            error: actionError
          });
        }
      }

    } catch (error: any) {
      result.success = false;
      result.errors.push(error.message);
      logger.error('Rule execution failed:', {
        ruleId: rule.id,
        error
      });
    } finally {
      result.executionTime = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Execute a specific action
   */
  private static async executeAction(action: RuleAction, context: RuleExecutionContext): Promise<void> {
    logger.info('Executing action:', {
      actionType: action.type,
      parameters: action.parameters
    });

    switch (action.type) {
      case 'AUTO_APPROVE':
        // In production, update leave request status
        logger.info('Auto-approving leave request:', {
          leaveRequestId: context.leaveRequest?.id
        });
        break;

      case 'AUTO_REJECT':
        // In production, update leave request status
        logger.info('Auto-rejecting leave request:', {
          leaveRequestId: context.leaveRequest?.id,
          reason: action.parameters.reason
        });
        break;

      case 'NOTIFY_MANAGER':
        // In production, send notification
        logger.info('Notifying manager:', {
          managerId: context.user?.managerId,
          template: action.parameters.template
        });
        break;

      case 'ESCALATE':
        // In production, escalate to HR or higher authority
        logger.info('Escalating to HR:', {
          escalateTo: action.parameters.escalateTo,
          reason: action.parameters.reason
        });
        break;

      case 'SEND_EMAIL':
        // In production, send email using email service
        logger.info('Sending email:', {
          recipients: action.parameters.recipients,
          template: action.parameters.template,
          subject: action.parameters.subject
        });
        break;

      case 'UPDATE_BALANCE':
        // In production, update user's leave balance
        logger.info('Updating leave balance:', {
          userId: context.user?.id,
          balanceType: action.parameters.balanceType,
          amount: action.parameters.amount,
          operation: action.parameters.operation
        });
        break;

      case 'LOG_EVENT':
        // Log custom event
        logger.log(action.parameters.level || 'info', 'Custom rule event:', {
          message: action.parameters.message,
          category: action.parameters.category,
          context
        });
        break;

      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Test a rule with mock data
   */
  static async testRule(rule: AutomationRule, testData: any): Promise<RuleExecutionResult> {
    try {
      const mockContext: RuleExecutionContext = {
        leaveRequest: testData.leaveRequest || {
          id: 'test_request',
          leaveType: testData.leaveType || 'SICK',
          duration: testData.duration || 1,
          startDate: new Date(),
          userBalance: testData.balance || 10
        },
        user: testData.user || {
          id: 'test_user',
          role: testData.userRole || 'EMPLOYEE',
          department: testData.department || 'Engineering',
          managerId: 'test_manager'
        },
        currentDate: new Date(),
        systemState: testData.systemState || {}
      };

      const result = await this.executeRule(rule, mockContext);

      logger.info('Rule test completed:', {
        ruleId: rule.id,
        result: result.success,
        actionsExecuted: result.actionsExecuted.length,
        executionTime: result.executionTime
      });

      return result;
    } catch (error) {
      logger.error('Error testing rule:', error);
      throw new Error('Failed to test rule');
    }
  }

  /**
   * Get rule execution statistics
   */
  static async getRuleStats(): Promise<{
    totalRules: number;
    activeRules: number;
    totalExecutions: number;
    averageExecutionTime: number;
    topExecutedRules: Array<{ ruleId: string; name: string; executions: number }>;
  }> {
    try {
      // In production, aggregate from database
      const stats = {
        totalRules: 0,
        activeRules: 0,
        totalExecutions: 0,
        averageExecutionTime: 0,
        topExecutedRules: []
      };

      logger.info('Rule statistics retrieved');
      return stats;
    } catch (error) {
      logger.error('Error retrieving rule statistics:', error);
      throw new Error('Failed to retrieve rule statistics');
    }
  }
}

export default AutomationRuleService;