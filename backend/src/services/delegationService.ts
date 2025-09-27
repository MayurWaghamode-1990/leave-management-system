import { prisma } from '../index';
import { logger } from '../utils/logger';
import { io } from '../index';

export interface DelegationRequest {
  id?: string;
  delegatorId: string;
  delegateId: string;
  reason: string;
  startDate: Date;
  endDate: Date;
  permissions: DelegationPermission[];
  status: 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'REVOKED';
  autoActivate?: boolean;
  notifyDelegator?: boolean;
  notifyDelegate?: boolean;
}

export interface DelegationPermission {
  resource: string; // 'leave_approvals', 'team_management', 'reporting', 'policy_management'
  actions: string[]; // ['view', 'approve', 'reject', 'modify']
  scope: string; // 'department', 'direct_reports', 'all'
}

export interface DelegationRule {
  id?: string;
  managerId: string;
  triggerCondition: 'leave_duration' | 'manual' | 'scheduled';
  triggerValue?: number; // days for leave_duration
  defaultDelegateId?: string;
  defaultPermissions: DelegationPermission[];
  autoApprove: boolean;
  notificationSettings: {
    notifyDelegator: boolean;
    notifyDelegate: boolean;
    notifyTeam: boolean;
    reminderDays: number[];
  };
  isActive: boolean;
}

class DelegationService {

  async createDelegation(delegationData: DelegationRequest): Promise<string> {
    try {
      // Validate delegation data
      await this.validateDelegation(delegationData);

      // Create delegation record
      const delegation = await prisma.delegation.create({
        data: {
          delegatorId: delegationData.delegatorId,
          delegateId: delegationData.delegateId,
          reason: delegationData.reason,
          startDate: delegationData.startDate,
          endDate: delegationData.endDate,
          permissions: JSON.stringify(delegationData.permissions),
          status: delegationData.autoActivate ? 'ACTIVE' : 'PENDING',
          autoActivate: delegationData.autoActivate || false,
          notifyDelegator: delegationData.notifyDelegator || true,
          notifyDelegate: delegationData.notifyDelegate || true
        }
      });

      // Send notifications
      await this.sendDelegationNotifications(delegation.id, 'CREATED');

      // Log delegation creation
      await this.logDelegationActivity(
        delegation.id,
        'CREATED',
        delegationData.delegatorId,
        `Delegation created for ${delegationData.delegateId}`
      );

      logger.info(`Delegation created: ${delegation.id}`);
      return delegation.id;
    } catch (error) {
      logger.error('Error creating delegation:', error);
      throw new Error('Failed to create delegation');
    }
  }

  async activateDelegation(delegationId: string, activatedBy: string): Promise<boolean> {
    try {
      const delegation = await prisma.delegation.findUnique({
        where: { id: delegationId },
        include: {
          delegator: true,
          delegate: true
        }
      });

      if (!delegation) {
        throw new Error('Delegation not found');
      }

      if (delegation.status === 'ACTIVE') {
        throw new Error('Delegation is already active');
      }

      // Check if delegation is still valid
      const now = new Date();
      if (now > delegation.endDate) {
        throw new Error('Delegation has expired');
      }

      // Update delegation status
      await prisma.delegation.update({
        where: { id: delegationId },
        data: {
          status: 'ACTIVE',
          activatedAt: now,
          activatedBy
        }
      });

      // Create delegation permissions
      await this.createDelegationPermissions(delegationId);

      // Send activation notifications
      await this.sendDelegationNotifications(delegationId, 'ACTIVATED');

      // Log activation
      await this.logDelegationActivity(
        delegationId,
        'ACTIVATED',
        activatedBy,
        `Delegation activated by ${activatedBy}`
      );

      logger.info(`Delegation activated: ${delegationId} by ${activatedBy}`);
      return true;
    } catch (error) {
      logger.error('Error activating delegation:', error);
      throw error;
    }
  }

  async revokeDelegation(delegationId: string, revokedBy: string, reason?: string): Promise<boolean> {
    try {
      const delegation = await prisma.delegation.findUnique({
        where: { id: delegationId }
      });

      if (!delegation) {
        throw new Error('Delegation not found');
      }

      if (delegation.status === 'REVOKED') {
        throw new Error('Delegation is already revoked');
      }

      // Update delegation status
      await prisma.delegation.update({
        where: { id: delegationId },
        data: {
          status: 'REVOKED',
          revokedAt: new Date(),
          revokedBy,
          revocationReason: reason
        }
      });

      // Remove delegation permissions
      await this.removeDelegationPermissions(delegationId);

      // Send revocation notifications
      await this.sendDelegationNotifications(delegationId, 'REVOKED');

      // Log revocation
      await this.logDelegationActivity(
        delegationId,
        'REVOKED',
        revokedBy,
        `Delegation revoked by ${revokedBy}${reason ? `: ${reason}` : ''}`
      );

      logger.info(`Delegation revoked: ${delegationId} by ${revokedBy}`);
      return true;
    } catch (error) {
      logger.error('Error revoking delegation:', error);
      throw error;
    }
  }

  async getDelegationsForUser(userId: string, includeExpired: boolean = false): Promise<any[]> {
    try {
      const whereClause: any = {
        OR: [
          { delegatorId: userId },
          { delegateId: userId }
        ]
      };

      if (!includeExpired) {
        whereClause.AND = [
          { status: { in: ['ACTIVE', 'PENDING'] } },
          { endDate: { gte: new Date() } }
        ];
      }

      const delegations = await prisma.delegation.findMany({
        where: whereClause,
        include: {
          delegator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              department: true
            }
          },
          delegate: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              department: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return delegations.map(delegation => ({
        ...delegation,
        permissions: JSON.parse(delegation.permissions as string),
        isDelegator: delegation.delegatorId === userId,
        isDelegate: delegation.delegateId === userId
      }));
    } catch (error) {
      logger.error('Error getting delegations for user:', error);
      throw new Error('Failed to get delegations');
    }
  }

  async getActiveDelegationsForDelegate(delegateId: string): Promise<any[]> {
    try {
      const delegations = await prisma.delegation.findMany({
        where: {
          delegateId,
          status: 'ACTIVE',
          endDate: { gte: new Date() }
        },
        include: {
          delegator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              department: true
            }
          }
        }
      });

      return delegations.map(delegation => ({
        ...delegation,
        permissions: JSON.parse(delegation.permissions as string)
      }));
    } catch (error) {
      logger.error('Error getting active delegations for delegate:', error);
      throw new Error('Failed to get active delegations');
    }
  }

  async createDelegationRule(ruleData: DelegationRule): Promise<string> {
    try {
      const rule = await prisma.delegationRule.create({
        data: {
          managerId: ruleData.managerId,
          triggerCondition: ruleData.triggerCondition,
          triggerValue: ruleData.triggerValue,
          defaultDelegateId: ruleData.defaultDelegateId,
          defaultPermissions: JSON.stringify(ruleData.defaultPermissions),
          autoApprove: ruleData.autoApprove,
          notificationSettings: JSON.stringify(ruleData.notificationSettings),
          isActive: ruleData.isActive
        }
      });

      logger.info(`Delegation rule created: ${rule.id} for manager ${ruleData.managerId}`);
      return rule.id;
    } catch (error) {
      logger.error('Error creating delegation rule:', error);
      throw new Error('Failed to create delegation rule');
    }
  }

  async triggerAutomaticDelegation(managerId: string, leaveRequestId: string, leaveDays: number): Promise<string | null> {
    try {
      // Find applicable delegation rules
      const rules = await prisma.delegationRule.findMany({
        where: {
          managerId,
          isActive: true,
          triggerCondition: 'leave_duration',
          triggerValue: { lte: leaveDays }
        },
        orderBy: { triggerValue: 'desc' }
      });

      if (rules.length === 0) {
        return null;
      }

      const rule = rules[0]; // Use the rule with highest trigger value

      if (!rule.defaultDelegateId) {
        logger.warn(`No default delegate set for rule ${rule.id}`);
        return null;
      }

      // Get leave request details
      const leaveRequest = await prisma.leaveRequest.findUnique({
        where: { id: leaveRequestId }
      });

      if (!leaveRequest) {
        throw new Error('Leave request not found');
      }

      // Create automatic delegation
      const delegationData: DelegationRequest = {
        delegatorId: managerId,
        delegateId: rule.defaultDelegateId,
        reason: `Automatic delegation triggered by ${leaveDays}-day leave request`,
        startDate: leaveRequest.startDate,
        endDate: leaveRequest.endDate,
        permissions: JSON.parse(rule.defaultPermissions as string),
        status: 'ACTIVE',
        autoActivate: rule.autoApprove,
        notifyDelegator: JSON.parse(rule.notificationSettings as string).notifyDelegator,
        notifyDelegate: JSON.parse(rule.notificationSettings as string).notifyDelegate
      };

      const delegationId = await this.createDelegation(delegationData);

      if (rule.autoApprove) {
        await this.activateDelegation(delegationId, 'SYSTEM');
      }

      logger.info(`Automatic delegation created: ${delegationId} for leave request ${leaveRequestId}`);
      return delegationId;
    } catch (error) {
      logger.error('Error triggering automatic delegation:', error);
      return null;
    }
  }

  async checkDelegationPermission(userId: string, resource: string, action: string, targetUserId?: string): Promise<boolean> {
    try {
      // Check if user has direct permission
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return false;
      }

      // Managers and HR admins have default permissions
      if (['MANAGER', 'HR_ADMIN'].includes(user.role)) {
        return true;
      }

      // Check delegation permissions
      const activeDelegations = await this.getActiveDelegationsForDelegate(userId);

      for (const delegation of activeDelegations) {
        const permissions = delegation.permissions as DelegationPermission[];

        for (const permission of permissions) {
          if (permission.resource === resource && permission.actions.includes(action)) {
            // Check scope
            if (permission.scope === 'all') {
              return true;
            }

            if (permission.scope === 'department' && targetUserId) {
              // Check if target user is in same department as delegator
              const [delegator, targetUser] = await Promise.all([
                prisma.user.findUnique({ where: { id: delegation.delegatorId } }),
                prisma.user.findUnique({ where: { id: targetUserId } })
              ]);

              if (delegator && targetUser && delegator.department === targetUser.department) {
                return true;
              }
            }

            if (permission.scope === 'direct_reports' && targetUserId) {
              // Check if target user reports to delegator
              const targetUser = await prisma.user.findUnique({
                where: { id: targetUserId }
              });

              if (targetUser && targetUser.reportingManagerId === delegation.delegatorId) {
                return true;
              }
            }
          }
        }
      }

      return false;
    } catch (error) {
      logger.error('Error checking delegation permission:', error);
      return false;
    }
  }

  private async validateDelegation(delegationData: DelegationRequest): Promise<void> {
    // Check if delegator exists
    const delegator = await prisma.user.findUnique({
      where: { id: delegationData.delegatorId }
    });

    if (!delegator) {
      throw new Error('Delegator not found');
    }

    // Check if delegate exists
    const delegate = await prisma.user.findUnique({
      where: { id: delegationData.delegateId }
    });

    if (!delegate) {
      throw new Error('Delegate not found');
    }

    // Check if delegator has manager or admin role
    if (!['MANAGER', 'HR_ADMIN'].includes(delegator.role)) {
      throw new Error('Only managers and HR admins can create delegations');
    }

    // Check if delegate can receive delegations
    if (!['MANAGER', 'HR_ADMIN', 'EMPLOYEE'].includes(delegate.role)) {
      throw new Error('Invalid delegate role');
    }

    // Check date validity
    if (delegationData.startDate >= delegationData.endDate) {
      throw new Error('End date must be after start date');
    }

    // Check for overlapping delegations
    const existingDelegations = await prisma.delegation.findMany({
      where: {
        delegatorId: delegationData.delegatorId,
        delegateId: delegationData.delegateId,
        status: { in: ['ACTIVE', 'PENDING'] },
        OR: [
          {
            startDate: { lte: delegationData.endDate },
            endDate: { gte: delegationData.startDate }
          }
        ]
      }
    });

    if (existingDelegations.length > 0) {
      throw new Error('Overlapping delegation already exists');
    }
  }

  private async createDelegationPermissions(delegationId: string): Promise<void> {
    // Implementation would create permission records in a permissions table
    // For now, this is a placeholder
    logger.info(`Creating delegation permissions for: ${delegationId}`);
  }

  private async removeDelegationPermissions(delegationId: string): Promise<void> {
    // Implementation would remove permission records
    // For now, this is a placeholder
    logger.info(`Removing delegation permissions for: ${delegationId}`);
  }

  private async sendDelegationNotifications(delegationId: string, action: string): Promise<void> {
    try {
      const delegation = await prisma.delegation.findUnique({
        where: { id: delegationId },
        include: {
          delegator: true,
          delegate: true
        }
      });

      if (!delegation) {
        return;
      }

      const notificationData = {
        delegationId,
        action,
        delegatorName: `${delegation.delegator.firstName} ${delegation.delegator.lastName}`,
        delegateName: `${delegation.delegate.firstName} ${delegation.delegate.lastName}`,
        startDate: delegation.startDate,
        endDate: delegation.endDate,
        reason: delegation.reason
      };

      // Send real-time notifications via WebSocket
      if (delegation.notifyDelegator) {
        io.to(`user:${delegation.delegatorId}`).emit('delegation_notification', {
          type: 'delegator',
          ...notificationData
        });
      }

      if (delegation.notifyDelegate) {
        io.to(`user:${delegation.delegateId}`).emit('delegation_notification', {
          type: 'delegate',
          ...notificationData
        });
      }

      // Create notification records
      if (delegation.notifyDelegator) {
        await prisma.notification.create({
          data: {
            userId: delegation.delegatorId,
            type: 'DELEGATION',
            title: `Delegation ${action.toLowerCase()}`,
            message: `Your delegation to ${delegation.delegate.firstName} ${delegation.delegate.lastName} has been ${action.toLowerCase()}`,
            metadata: JSON.stringify({ delegationId, action })
          }
        });
      }

      if (delegation.notifyDelegate) {
        await prisma.notification.create({
          data: {
            userId: delegation.delegateId,
            type: 'DELEGATION',
            title: `Delegation ${action.toLowerCase()}`,
            message: `You have been ${action.toLowerCase()} as delegate for ${delegation.delegator.firstName} ${delegation.delegator.lastName}`,
            metadata: JSON.stringify({ delegationId, action })
          }
        });
      }
    } catch (error) {
      logger.error('Error sending delegation notifications:', error);
    }
  }

  private async logDelegationActivity(
    delegationId: string,
    action: string,
    userId: string,
    description: string
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          entity: 'DELEGATION',
          entityId: delegationId,
          action,
          oldValues: null,
          newValues: description
        }
      });
    } catch (error) {
      logger.error('Error logging delegation activity:', error);
    }
  }

  async getExpiringDelegations(days: number = 7): Promise<any[]> {
    try {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + days);

      const delegations = await prisma.delegation.findMany({
        where: {
          status: 'ACTIVE',
          endDate: {
            gte: new Date(),
            lte: expirationDate
          }
        },
        include: {
          delegator: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          delegate: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      return delegations;
    } catch (error) {
      logger.error('Error getting expiring delegations:', error);
      throw new Error('Failed to get expiring delegations');
    }
  }
}

export const delegationService = new DelegationService();