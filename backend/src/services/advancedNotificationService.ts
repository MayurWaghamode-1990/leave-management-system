import { io } from '../index';
import { logger } from '../utils/logger';
import { emailService } from './emailService';

// Enhanced notification types
export interface NotificationPayload {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  metadata?: Record<string, any>;
  expiresAt?: Date;
  actionRequired?: boolean;
  actions?: NotificationAction[];
}

export enum NotificationType {
  LEAVE_REQUEST_SUBMITTED = 'LEAVE_REQUEST_SUBMITTED',
  LEAVE_REQUEST_APPROVED = 'LEAVE_REQUEST_APPROVED',
  LEAVE_REQUEST_REJECTED = 'LEAVE_REQUEST_REJECTED',
  LEAVE_REQUEST_CANCELLED = 'LEAVE_REQUEST_CANCELLED',
  LEAVE_REQUEST_MODIFIED = 'LEAVE_REQUEST_MODIFIED',
  LEAVE_BALANCE_LOW = 'LEAVE_BALANCE_LOW',
  LEAVE_REMINDER = 'LEAVE_REMINDER',
  DELEGATION_ASSIGNED = 'DELEGATION_ASSIGNED',
  DELEGATION_EXPIRED = 'DELEGATION_EXPIRED',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
  POLICY_UPDATED = 'POLICY_UPDATED',
  TEAM_UPDATE = 'TEAM_UPDATE',
  HOLIDAY_ANNOUNCEMENT = 'HOLIDAY_ANNOUNCEMENT'
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
  CRITICAL = 'CRITICAL'
}

export enum NotificationChannel {
  WEBSOCKET = 'WEBSOCKET',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
  SLACK = 'SLACK',
  TEAMS = 'TEAMS'
}

export interface NotificationAction {
  id: string;
  label: string;
  type: 'link' | 'button' | 'api_call';
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  payload?: Record<string, any>;
  style?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}

export interface NotificationTemplate {
  type: NotificationType;
  title: string;
  message: string;
  channels: NotificationChannel[];
  priority: NotificationPriority;
  emailTemplate?: string;
  smsTemplate?: string;
  pushTemplate?: string;
  actions?: NotificationAction[];
}

// Notification delivery status tracking
interface DeliveryStatus {
  channel: NotificationChannel;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  timestamp: Date;
  error?: string;
  attempts: number;
}

interface NotificationRecord {
  id: string;
  payload: NotificationPayload;
  deliveryStatus: Map<NotificationChannel, DeliveryStatus>;
  createdAt: Date;
  updatedAt: Date;
}

class AdvancedNotificationService {
  private notifications = new Map<string, NotificationRecord>();
  private userPreferences = new Map<string, NotificationPreferences>();
  private templates = new Map<NotificationType, NotificationTemplate>();
  private retryQueue: Array<{ notificationId: string; channel: NotificationChannel }> = [];

  constructor() {
    this.initializeTemplates();
    this.startRetryProcessor();
    this.startCleanupProcessor();
  }

  /**
   * Initialize notification templates
   */
  private initializeTemplates() {
    // Leave request templates
    this.templates.set(NotificationType.LEAVE_REQUEST_SUBMITTED, {
      type: NotificationType.LEAVE_REQUEST_SUBMITTED,
      title: 'Leave Request Submitted',
      message: 'Your leave request for {startDate} to {endDate} has been submitted for approval.',
      channels: [NotificationChannel.WEBSOCKET, NotificationChannel.EMAIL, NotificationChannel.IN_APP],
      priority: NotificationPriority.NORMAL,
      emailTemplate: 'leave-request-submitted',
      actions: [
        {
          id: 'view-request',
          label: 'View Request',
          type: 'link',
          url: '/leaves/{leaveId}',
          style: 'primary'
        }
      ]
    });

    this.templates.set(NotificationType.LEAVE_REQUEST_APPROVED, {
      type: NotificationType.LEAVE_REQUEST_APPROVED,
      title: 'Leave Request Approved',
      message: 'Your leave request for {startDate} to {endDate} has been approved by {approverName}.',
      channels: [NotificationChannel.WEBSOCKET, NotificationChannel.EMAIL, NotificationChannel.IN_APP, NotificationChannel.PUSH],
      priority: NotificationPriority.HIGH,
      emailTemplate: 'leave-request-approved',
      pushTemplate: 'Your leave request has been approved!',
      actions: [
        {
          id: 'view-calendar',
          label: 'View Calendar',
          type: 'link',
          url: '/calendar',
          style: 'success'
        }
      ]
    });

    this.templates.set(NotificationType.LEAVE_REQUEST_REJECTED, {
      type: NotificationType.LEAVE_REQUEST_REJECTED,
      title: 'Leave Request Rejected',
      message: 'Your leave request for {startDate} to {endDate} has been rejected. Reason: {rejectionReason}',
      channels: [NotificationChannel.WEBSOCKET, NotificationChannel.EMAIL, NotificationChannel.IN_APP, NotificationChannel.PUSH],
      priority: NotificationPriority.HIGH,
      emailTemplate: 'leave-request-rejected',
      actions: [
        {
          id: 'resubmit-request',
          label: 'Submit New Request',
          type: 'link',
          url: '/leaves/new',
          style: 'primary'
        },
        {
          id: 'contact-manager',
          label: 'Contact Manager',
          type: 'link',
          url: '/messages/new',
          style: 'secondary'
        }
      ]
    });

    this.templates.set(NotificationType.LEAVE_BALANCE_LOW, {
      type: NotificationType.LEAVE_BALANCE_LOW,
      title: 'Leave Balance Running Low',
      message: 'Your {leaveType} balance is running low. Current balance: {currentBalance} days.',
      channels: [NotificationChannel.WEBSOCKET, NotificationChannel.EMAIL, NotificationChannel.IN_APP],
      priority: NotificationPriority.NORMAL,
      emailTemplate: 'leave-balance-low',
      actions: [
        {
          id: 'view-balance',
          label: 'View Balance',
          type: 'link',
          url: '/dashboard',
          style: 'primary'
        }
      ]
    });

    this.templates.set(NotificationType.DELEGATION_ASSIGNED, {
      type: NotificationType.DELEGATION_ASSIGNED,
      title: 'Management Duties Delegated',
      message: 'You have been assigned temporary management duties from {delegatorName} from {startDate} to {endDate}.',
      channels: [NotificationChannel.WEBSOCKET, NotificationChannel.EMAIL, NotificationChannel.IN_APP],
      priority: NotificationPriority.HIGH,
      emailTemplate: 'delegation-assigned',
      actions: [
        {
          id: 'view-duties',
          label: 'View Duties',
          type: 'link',
          url: '/delegations',
          style: 'primary'
        }
      ]
    });

    // System notifications
    this.templates.set(NotificationType.SYSTEM_MAINTENANCE, {
      type: NotificationType.SYSTEM_MAINTENANCE,
      title: 'Scheduled Maintenance',
      message: 'System maintenance is scheduled for {maintenanceDate} from {startTime} to {endTime}. Please save your work.',
      channels: [NotificationChannel.WEBSOCKET, NotificationChannel.EMAIL, NotificationChannel.IN_APP, NotificationChannel.PUSH],
      priority: NotificationPriority.URGENT,
      emailTemplate: 'system-maintenance'
    });
  }

  /**
   * Send notification using multiple channels
   */
  async sendNotification(payload: NotificationPayload): Promise<NotificationRecord> {
    const notificationId = payload.id || this.generateNotificationId();
    const now = new Date();

    // Create notification record
    const record: NotificationRecord = {
      id: notificationId,
      payload: { ...payload, id: notificationId },
      deliveryStatus: new Map(),
      createdAt: now,
      updatedAt: now
    };

    // Get user preferences
    const preferences = this.getUserPreferences(payload.userId);

    // Filter channels based on user preferences and notification priority
    const enabledChannels = payload.channels.filter(channel =>
      this.isChannelEnabled(channel, payload.priority, preferences)
    );

    // Initialize delivery status for each channel
    enabledChannels.forEach(channel => {
      record.deliveryStatus.set(channel, {
        channel,
        status: 'pending',
        timestamp: now,
        attempts: 0
      });
    });

    // Store notification record
    this.notifications.set(notificationId, record);

    // Send notification through each channel
    const deliveryPromises = enabledChannels.map(channel =>
      this.sendToChannel(record, channel)
    );

    // Wait for all deliveries (don't fail if some channels fail)
    await Promise.allSettled(deliveryPromises);

    logger.info('Notification sent', {
      notificationId,
      userId: payload.userId,
      type: payload.type,
      channels: enabledChannels,
      priority: payload.priority
    });

    return record;
  }

  /**
   * Send notification using a template
   */
  async sendTemplatedNotification(
    type: NotificationType,
    userId: string,
    data: Record<string, any>
  ): Promise<NotificationRecord | null> {
    const template = this.templates.get(type);
    if (!template) {
      logger.error('Notification template not found', { type, userId });
      return null;
    }

    // Interpolate template variables
    const title = this.interpolateString(template.title, data);
    const message = this.interpolateString(template.message, data);

    const payload: NotificationPayload = {
      id: this.generateNotificationId(),
      userId,
      type,
      title,
      message,
      priority: template.priority,
      channels: template.channels,
      metadata: data,
      actions: template.actions
    };

    return this.sendNotification(payload);
  }

  /**
   * Send to specific channel
   */
  private async sendToChannel(record: NotificationRecord, channel: NotificationChannel): Promise<void> {
    const status = record.deliveryStatus.get(channel)!;
    status.attempts++;
    status.timestamp = new Date();

    try {
      switch (channel) {
        case NotificationChannel.WEBSOCKET:
          await this.sendWebSocketNotification(record.payload);
          break;
        case NotificationChannel.EMAIL:
          await this.sendEmailNotification(record.payload);
          break;
        case NotificationChannel.SMS:
          await this.sendSMSNotification(record.payload);
          break;
        case NotificationChannel.PUSH:
          await this.sendPushNotification(record.payload);
          break;
        case NotificationChannel.IN_APP:
          await this.sendInAppNotification(record.payload);
          break;
        case NotificationChannel.SLACK:
          await this.sendSlackNotification(record.payload);
          break;
        case NotificationChannel.TEAMS:
          await this.sendTeamsNotification(record.payload);
          break;
        default:
          throw new Error(`Unsupported channel: ${channel}`);
      }

      status.status = 'sent';
      logger.debug('Notification sent via channel', {
        notificationId: record.id,
        channel,
        attempts: status.attempts
      });

    } catch (error) {
      status.status = 'failed';
      status.error = error.message;

      logger.error('Failed to send notification via channel', {
        notificationId: record.id,
        channel,
        error: error.message,
        attempts: status.attempts
      });

      // Add to retry queue if attempts < 3
      if (status.attempts < 3 && this.shouldRetry(channel, record.payload.priority)) {
        this.retryQueue.push({ notificationId: record.id, channel });
      }
    }

    record.updatedAt = new Date();
  }

  /**
   * WebSocket notification delivery
   */
  private async sendWebSocketNotification(payload: NotificationPayload): Promise<void> {
    const userRoom = `user:${payload.userId}`;

    io.to(userRoom).emit('notification', {
      id: payload.id,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      priority: payload.priority,
      metadata: payload.metadata,
      actions: payload.actions,
      timestamp: new Date().toISOString(),
      actionRequired: payload.actionRequired
    });

    // Also emit to role-based rooms if applicable
    if (payload.metadata?.broadcast) {
      const roleRoom = `role:${payload.metadata.role}`;
      io.to(roleRoom).emit('notification', {
        id: payload.id,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        priority: payload.priority,
        metadata: payload.metadata,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Email notification delivery
   */
  private async sendEmailNotification(payload: NotificationPayload): Promise<void> {
    const template = this.templates.get(payload.type);
    const emailTemplate = template?.emailTemplate || 'generic-notification';

    await emailService.sendEmail({
      to: payload.userId, // This should be email address in real implementation
      subject: payload.title,
      template: emailTemplate,
      data: {
        title: payload.title,
        message: payload.message,
        priority: payload.priority,
        actions: payload.actions,
        metadata: payload.metadata,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * SMS notification delivery (placeholder)
   */
  private async sendSMSNotification(payload: NotificationPayload): Promise<void> {
    // Implement SMS service integration (Twilio, AWS SNS, etc.)
    logger.info('SMS notification sent (placeholder)', {
      notificationId: payload.id,
      userId: payload.userId,
      message: payload.message.substring(0, 160) // SMS length limit
    });
  }

  /**
   * Push notification delivery (placeholder)
   */
  private async sendPushNotification(payload: NotificationPayload): Promise<void> {
    // Implement push notification service (Firebase, Apple Push, etc.)
    logger.info('Push notification sent (placeholder)', {
      notificationId: payload.id,
      userId: payload.userId,
      title: payload.title,
      message: payload.message
    });
  }

  /**
   * In-app notification storage
   */
  private async sendInAppNotification(payload: NotificationPayload): Promise<void> {
    // Store in database or memory for in-app notification list
    // This would typically be stored in a database
    logger.info('In-app notification stored', {
      notificationId: payload.id,
      userId: payload.userId
    });
  }

  /**
   * Slack notification delivery (placeholder)
   */
  private async sendSlackNotification(payload: NotificationPayload): Promise<void> {
    // Implement Slack webhook integration
    logger.info('Slack notification sent (placeholder)', {
      notificationId: payload.id,
      userId: payload.userId,
      message: payload.message
    });
  }

  /**
   * Teams notification delivery (placeholder)
   */
  private async sendTeamsNotification(payload: NotificationPayload): Promise<void> {
    // Implement Teams webhook integration
    logger.info('Teams notification sent (placeholder)', {
      notificationId: payload.id,
      userId: payload.userId,
      message: payload.message
    });
  }

  /**
   * Get user notification preferences
   */
  private getUserPreferences(userId: string): NotificationPreferences {
    return this.userPreferences.get(userId) || this.getDefaultPreferences();
  }

  /**
   * Check if channel is enabled for user and priority
   */
  private isChannelEnabled(
    channel: NotificationChannel,
    priority: NotificationPriority,
    preferences: NotificationPreferences
  ): boolean {
    const channelPrefs = preferences.channels[channel];
    if (!channelPrefs || !channelPrefs.enabled) return false;

    // Check if priority meets minimum threshold
    const priorityOrder = {
      [NotificationPriority.LOW]: 0,
      [NotificationPriority.NORMAL]: 1,
      [NotificationPriority.HIGH]: 2,
      [NotificationPriority.URGENT]: 3,
      [NotificationPriority.CRITICAL]: 4
    };

    return priorityOrder[priority] >= priorityOrder[channelPrefs.minimumPriority];
  }

  /**
   * Default notification preferences
   */
  private getDefaultPreferences(): NotificationPreferences {
    return {
      channels: {
        [NotificationChannel.WEBSOCKET]: {
          enabled: true,
          minimumPriority: NotificationPriority.LOW
        },
        [NotificationChannel.EMAIL]: {
          enabled: true,
          minimumPriority: NotificationPriority.NORMAL
        },
        [NotificationChannel.SMS]: {
          enabled: false,
          minimumPriority: NotificationPriority.URGENT
        },
        [NotificationChannel.PUSH]: {
          enabled: true,
          minimumPriority: NotificationPriority.HIGH
        },
        [NotificationChannel.IN_APP]: {
          enabled: true,
          minimumPriority: NotificationPriority.LOW
        },
        [NotificationChannel.SLACK]: {
          enabled: false,
          minimumPriority: NotificationPriority.NORMAL
        },
        [NotificationChannel.TEAMS]: {
          enabled: false,
          minimumPriority: NotificationPriority.NORMAL
        }
      },
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '08:00',
        timezone: 'UTC'
      },
      frequency: {
        maxPerHour: 10,
        maxPerDay: 50
      }
    };
  }

  /**
   * Set user notification preferences
   */
  setUserPreferences(userId: string, preferences: Partial<NotificationPreferences>): void {
    const current = this.getUserPreferences(userId);
    const updated = { ...current, ...preferences };
    this.userPreferences.set(userId, updated);
  }

  /**
   * Interpolate template strings with data
   */
  private interpolateString(template: string, data: Record<string, any>): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return data[key] !== undefined ? String(data[key]) : match;
    });
  }

  /**
   * Generate unique notification ID
   */
  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if notification should be retried
   */
  private shouldRetry(channel: NotificationChannel, priority: NotificationPriority): boolean {
    // Always retry critical and urgent notifications
    if (priority === NotificationPriority.CRITICAL || priority === NotificationPriority.URGENT) {
      return true;
    }

    // Retry email and push notifications for high priority
    if (priority === NotificationPriority.HIGH &&
        (channel === NotificationChannel.EMAIL || channel === NotificationChannel.PUSH)) {
      return true;
    }

    return false;
  }

  /**
   * Retry failed notifications
   */
  private async startRetryProcessor(): Promise<void> {
    setInterval(async () => {
      if (this.retryQueue.length === 0) return;

      const retryBatch = this.retryQueue.splice(0, 10); // Process 10 at a time

      for (const item of retryBatch) {
        const record = this.notifications.get(item.notificationId);
        if (record) {
          await this.sendToChannel(record, item.channel);
        }
      }
    }, 60000); // Retry every minute
  }

  /**
   * Clean up old notifications
   */
  private startCleanupProcessor(): Promise<void> {
    setInterval(() => {
      const cutoff = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)); // 7 days ago

      for (const [id, record] of this.notifications.entries()) {
        if (record.createdAt < cutoff) {
          this.notifications.delete(id);
        }
      }

      logger.debug('Notification cleanup completed', {
        remainingNotifications: this.notifications.size
      });
    }, 24 * 60 * 60 * 1000); // Daily cleanup

    return Promise.resolve();
  }

  /**
   * Get notification statistics
   */
  getStats(): NotificationStats {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentNotifications = Array.from(this.notifications.values())
      .filter(n => n.createdAt >= last24h);

    const stats: NotificationStats = {
      total: this.notifications.size,
      last24Hours: recentNotifications.length,
      byChannel: {} as Record<NotificationChannel, number>,
      byPriority: {} as Record<NotificationPriority, number>,
      byStatus: {
        pending: 0,
        sent: 0,
        delivered: 0,
        failed: 0,
        read: 0
      },
      retryQueueSize: this.retryQueue.length
    };

    // Calculate channel and priority distributions
    recentNotifications.forEach(notification => {
      // By priority
      const priority = notification.payload.priority;
      stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;

      // By channel and status
      notification.deliveryStatus.forEach((status, channel) => {
        stats.byChannel[channel] = (stats.byChannel[channel] || 0) + 1;
        stats.byStatus[status.status] = stats.byStatus[status.status] + 1;
      });
    });

    return stats;
  }
}

// Interfaces
interface NotificationPreferences {
  channels: Record<NotificationChannel, ChannelPreference>;
  quietHours?: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
    timezone: string;
  };
  frequency?: {
    maxPerHour: number;
    maxPerDay: number;
  };
}

interface ChannelPreference {
  enabled: boolean;
  minimumPriority: NotificationPriority;
}

interface NotificationStats {
  total: number;
  last24Hours: number;
  byChannel: Record<NotificationChannel, number>;
  byPriority: Record<NotificationPriority, number>;
  byStatus: Record<string, number>;
  retryQueueSize: number;
}

// Export singleton instance
export const advancedNotificationService = new AdvancedNotificationService();