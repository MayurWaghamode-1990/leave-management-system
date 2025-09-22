import { prisma } from './databaseService';
import { logger } from '../utils/logger';
import { leaveService } from './leaveService';
import { userService } from './userService';
import { emailService } from './emailService';

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

export interface AutomationRuleData {
  id?: string;
  name: string;
  description?: string;
  enabled?: boolean;
  priority?: number;
  triggerType: string;
  triggerConditions: RuleCondition[];
  actions: RuleAction[];
  validationRules?: RuleCondition[];
  createdBy: string;
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
    scheduleFor: Date;
  }>;
}

class AutomationRuleServiceDB {
  // Create a new automation rule
  async createRule(data: AutomationRuleData) {
    try {
      const rule = await prisma.automationRule.create({
        data: {
          name: data.name,
          description: data.description || '',
          enabled: data.enabled ?? true,
          priority: data.priority ?? 1,
          triggerType: data.triggerType,
          triggerConditions: JSON.stringify(data.triggerConditions),
          actions: JSON.stringify(data.actions),
          validationRules: data.validationRules ? JSON.stringify(data.validationRules) : null,
          createdBy: data.createdBy,
        },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      logger.info('Automation rule created:', { ruleId: rule.id, name: rule.name });
      return this.formatRule(rule);
    } catch (error) {
      logger.error('Error creating automation rule:', error);
      throw error;
    }
  }

  // Get all automation rules
  async getRules(filters: { enabled?: boolean; triggerType?: string } = {}) {
    try {
      const where: any = {};

      if (filters.enabled !== undefined) where.enabled = filters.enabled;
      if (filters.triggerType) where.triggerType = filters.triggerType;

      const rules = await prisma.automationRule.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          executions: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { priority: 'asc' },
      });

      return rules.map(rule => this.formatRule(rule));
    } catch (error) {
      logger.error('Error fetching automation rules:', error);
      throw error;
    }
  }

  // Get rule by ID
  async getRuleById(id: string) {
    try {
      const rule = await prisma.automationRule.findUnique({
        where: { id },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          executions: {
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!rule) return null;

      return this.formatRule(rule);
    } catch (error) {
      logger.error('Error fetching automation rule:', error);
      throw error;
    }
  }

  // Update automation rule
  async updateRule(id: string, updates: Partial<AutomationRuleData>) {
    try {
      const updateData: any = {};

      if (updates.name) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.enabled !== undefined) updateData.enabled = updates.enabled;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.triggerType) updateData.triggerType = updates.triggerType;
      if (updates.triggerConditions) updateData.triggerConditions = JSON.stringify(updates.triggerConditions);
      if (updates.actions) updateData.actions = JSON.stringify(updates.actions);
      if (updates.validationRules) updateData.validationRules = JSON.stringify(updates.validationRules);

      const rule = await prisma.automationRule.update({
        where: { id },
        data: updateData,
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      logger.info('Automation rule updated:', { ruleId: id });
      return this.formatRule(rule);
    } catch (error) {
      logger.error('Error updating automation rule:', error);
      throw error;
    }
  }

  // Delete automation rule
  async deleteRule(id: string) {
    try {
      // Delete related executions first
      await prisma.ruleExecution.deleteMany({
        where: { ruleId: id },
      });

      // Delete the rule
      await prisma.automationRule.delete({
        where: { id },
      });

      logger.info('Automation rule deleted:', { ruleId: id });
      return true;
    } catch (error) {
      logger.error('Error deleting automation rule:', error);
      throw error;
    }
  }

  // Execute rules for a specific trigger
  async executeRules(triggerType: string, context: RuleExecutionContext) {
    try {
      // Get enabled rules for this trigger type
      const rules = await prisma.automationRule.findMany({
        where: {
          enabled: true,
          triggerType,
        },
        orderBy: { priority: 'asc' },
      });

      const results: RuleExecutionResult[] = [];

      for (const rule of rules) {
        try {
          const formattedRule = this.formatRule(rule);
          const result = await this.executeRule(formattedRule, context);
          results.push(result);

          // Log execution
          await this.logExecution(rule.id, context, result);

          // Update rule execution stats
          await prisma.automationRule.update({
            where: { id: rule.id },
            data: {
              lastExecuted: new Date(),
              executionCount: { increment: 1 },
            },
          });
        } catch (error) {
          logger.error('Error executing rule:', { ruleId: rule.id, error });
          results.push({
            success: false,
            actionsExecuted: [],
            errors: [error instanceof Error ? error.message : 'Unknown error'],
            executionTime: 0,
          });
        }
      }

      return results;
    } catch (error) {
      logger.error('Error executing automation rules:', error);
      throw error;
    }
  }

  // Execute a single rule
  private async executeRule(rule: any, context: RuleExecutionContext): Promise<RuleExecutionResult> {
    const startTime = Date.now();
    const result: RuleExecutionResult = {
      success: true,
      actionsExecuted: [],
      errors: [],
      executionTime: 0,
    };

    try {
      // Check trigger conditions
      const triggerMatches = this.evaluateConditions(rule.trigger.conditions, context);

      if (!triggerMatches) {
        result.success = false;
        result.errors.push('Trigger conditions not met');
        return result;
      }

      // Check validation rules if any
      if (rule.validationRules && rule.validationRules.length > 0) {
        const validationPasses = this.evaluateConditions(rule.validationRules, context);
        if (!validationPasses) {
          result.success = false;
          result.errors.push('Validation rules failed');
          return result;
        }
      }

      // Execute actions
      for (const action of rule.actions) {
        try {
          await this.executeAction(action, context);
          result.actionsExecuted.push(action.type);
        } catch (actionError: any) {
          result.errors.push(`Action ${action.type} failed: ${actionError.message}`);
          logger.error('Action execution failed:', {
            ruleId: rule.id,
            actionType: action.type,
            error: actionError,
          });
        }
      }

      result.success = result.errors.length === 0;
    } catch (error: any) {
      result.success = false;
      result.errors.push(error.message);
      logger.error('Rule execution failed:', { ruleId: rule.id, error });
    } finally {
      result.executionTime = Date.now() - startTime;
    }

    return result;
  }

  // Execute a specific action
  private async executeAction(action: RuleAction, context: RuleExecutionContext): Promise<void> {
    logger.info('Executing action:', {
      actionType: action.type,
      parameters: action.parameters,
    });

    switch (action.type) {
      case 'AUTO_APPROVE':
        if (context.leaveRequest) {
          await leaveService.approveLeaveRequest(
            context.leaveRequest.id,
            'automation-system',
            'Auto-approved by automation rule'
          );
        }
        break;

      case 'AUTO_REJECT':
        if (context.leaveRequest) {
          await leaveService.rejectLeaveRequest(
            context.leaveRequest.id,
            'automation-system',
            action.parameters.reason || 'Auto-rejected by automation rule'
          );
        }
        break;

      case 'NOTIFY_MANAGER':
        if (context.user && context.leaveRequest) {
          // Send notification to manager
          await prisma.notification.create({
            data: {
              userId: context.user.reportingManagerId || context.user.id,
              type: 'APPROVAL_PENDING',
              title: 'Leave Approval Required (Automated)',
              message: `Leave request from ${context.user.firstName} ${context.user.lastName} requires your attention.`,
              metadata: JSON.stringify({
                leaveRequestId: context.leaveRequest.id,
                automated: true,
                template: action.parameters.template,
              }),
            },
          });
        }
        break;

      case 'ESCALATE':
        if (context.leaveRequest) {
          // Find HR admin to escalate to
          const hrAdmin = await prisma.user.findFirst({
            where: { role: 'HR_ADMIN', status: 'ACTIVE' },
          });

          if (hrAdmin) {
            await prisma.notification.create({
              data: {
                userId: hrAdmin.id,
                type: 'APPROVAL_PENDING',
                title: 'Escalated Leave Request',
                message: `Leave request has been escalated for review: ${action.parameters.reason || 'Automated escalation'}`,
                metadata: JSON.stringify({
                  leaveRequestId: context.leaveRequest.id,
                  escalated: true,
                  originalManager: context.user?.reportingManagerId,
                }),
              },
            });
          }
        }
        break;

      case 'SEND_EMAIL':
        // Send email using email service
        if (action.parameters.recipients && action.parameters.template) {
          await emailService.sendTestEmail(action.parameters.recipients[0]);
        }
        break;

      case 'UPDATE_BALANCE':
        if (context.user && action.parameters.balanceType) {
          const currentYear = new Date().getFullYear();
          const operation = action.parameters.operation || 'add';
          const amount = action.parameters.amount || 0;

          await prisma.leaveBalance.updateMany({
            where: {
              employeeId: context.user.id,
              leaveType: action.parameters.balanceType,
              year: currentYear,
            },
            data: {
              available: operation === 'add' ? { increment: amount } : { decrement: amount },
            },
          });
        }
        break;

      case 'LOG_EVENT':
        logger.log(action.parameters.level || 'info', 'Custom rule event:', {
          message: action.parameters.message,
          category: action.parameters.category,
          context,
        });
        break;

      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  // Evaluate conditions
  private evaluateConditions(conditions: RuleCondition[], context: RuleExecutionContext): boolean {
    if (!conditions || conditions.length === 0) return true;

    let result = true;
    let currentLogicalOperator = 'AND';

    for (const condition of conditions) {
      const conditionResult = this.evaluateCondition(condition, context);

      if (currentLogicalOperator === 'AND') {
        result = result && conditionResult;
      } else {
        result = result || conditionResult;
      }

      currentLogicalOperator = condition.logicalOperator || 'AND';
    }

    return result;
  }

  // Evaluate a single condition
  private evaluateCondition(condition: RuleCondition, context: RuleExecutionContext): boolean {
    let contextValue: any;

    // Get value from context based on condition type
    switch (condition.type) {
      case 'LEAVE_TYPE':
        contextValue = context.leaveRequest?.leaveType;
        break;
      case 'DURATION':
        contextValue = context.leaveRequest?.totalDays;
        break;
      case 'USER_ROLE':
        contextValue = context.user?.role;
        break;
      case 'DEPARTMENT':
        contextValue = context.user?.department;
        break;
      case 'BALANCE':
        // This would need to be passed in context or fetched
        contextValue = context.leaveRequest?.userBalance;
        break;
      case 'DATE_RANGE':
        contextValue = context.currentDate;
        break;
      default:
        return true;
    }

    // Apply operator
    switch (condition.operator) {
      case 'EQUALS':
        return contextValue === condition.value;
      case 'NOT_EQUALS':
        return contextValue !== condition.value;
      case 'GREATER_THAN':
        return Number(contextValue) > Number(condition.value);
      case 'LESS_THAN':
        return Number(contextValue) < Number(condition.value);
      case 'CONTAINS':
        return String(contextValue).includes(String(condition.value));
      case 'IN_RANGE':
        if (Array.isArray(condition.value) && condition.value.length === 2) {
          const numValue = Number(contextValue);
          return numValue >= condition.value[0] && numValue <= condition.value[1];
        }
        return false;
      default:
        return true;
    }
  }

  // Log rule execution
  private async logExecution(ruleId: string, context: RuleExecutionContext, result: RuleExecutionResult) {
    try {
      await prisma.ruleExecution.create({
        data: {
          ruleId,
          triggerContext: JSON.stringify(context),
          result: JSON.stringify(result),
          success: result.success,
          executionTime: result.executionTime,
          actionsExecuted: JSON.stringify(result.actionsExecuted),
          errors: result.errors.length > 0 ? JSON.stringify(result.errors) : null,
        },
      });
    } catch (error) {
      logger.error('Error logging rule execution:', error);
    }
  }

  // Test a rule with mock data
  async testRule(rule: any, testData: any): Promise<RuleExecutionResult> {
    try {
      const mockContext: RuleExecutionContext = {
        leaveRequest: testData.leaveRequest || {
          id: 'test_request',
          leaveType: testData.leaveType || 'SICK_LEAVE',
          totalDays: testData.duration || 1,
          startDate: new Date(),
          userBalance: testData.balance || 10,
        },
        user: testData.user || {
          id: 'test_user',
          role: testData.userRole || 'EMPLOYEE',
          department: testData.department || 'Engineering',
          reportingManagerId: 'test_manager',
        },
        currentDate: new Date(),
        systemState: testData.systemState || {},
      };

      const result = await this.executeRule(rule, mockContext);

      logger.info('Rule test completed:', {
        ruleId: rule.id,
        result: result.success,
        actionsExecuted: result.actionsExecuted.length,
        executionTime: result.executionTime,
      });

      return result;
    } catch (error) {
      logger.error('Error testing rule:', error);
      throw new Error('Failed to test rule');
    }
  }

  // Get rule statistics
  async getRuleStats() {
    try {
      const [totalRules, activeRules, totalExecutions, recentExecutions] = await Promise.all([
        prisma.automationRule.count(),
        prisma.automationRule.count({ where: { enabled: true } }),
        prisma.ruleExecution.count(),
        prisma.ruleExecution.findMany({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
          select: {
            executionTime: true,
            ruleId: true,
            rule: {
              select: {
                name: true,
              },
            },
          },
        }),
      ]);

      const averageExecutionTime = recentExecutions.length > 0
        ? recentExecutions.reduce((sum, exec) => sum + exec.executionTime, 0) / recentExecutions.length
        : 0;

      // Group executions by rule for top executed rules
      const ruleExecutionCounts = recentExecutions.reduce((acc, exec) => {
        const ruleId = exec.ruleId;
        if (!acc[ruleId]) {
          acc[ruleId] = {
            ruleId,
            name: exec.rule.name,
            executions: 0,
          };
        }
        acc[ruleId].executions++;
        return acc;
      }, {} as Record<string, any>);

      const topExecutedRules = Object.values(ruleExecutionCounts)
        .sort((a: any, b: any) => b.executions - a.executions)
        .slice(0, 5);

      return {
        totalRules,
        activeRules,
        totalExecutions,
        averageExecutionTime,
        topExecutedRules,
      };
    } catch (error) {
      logger.error('Error retrieving rule statistics:', error);
      throw error;
    }
  }

  // Format rule from database
  private formatRule(rule: any) {
    return {
      id: rule.id,
      name: rule.name,
      description: rule.description,
      enabled: rule.enabled,
      priority: rule.priority,
      trigger: {
        type: rule.triggerType,
        conditions: JSON.parse(rule.triggerConditions || '[]'),
      },
      actions: JSON.parse(rule.actions || '[]'),
      validationRules: rule.validationRules ? JSON.parse(rule.validationRules) : [],
      createdBy: rule.createdBy,
      creator: rule.creator,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
      lastExecuted: rule.lastExecuted,
      executionCount: rule.executionCount,
      recentExecutions: rule.executions || [],
    };
  }
}

export const automationRuleServiceDB = new AutomationRuleServiceDB();