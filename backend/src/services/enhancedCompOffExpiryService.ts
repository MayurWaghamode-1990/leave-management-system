import { PrismaClient } from '@prisma/client';
import { addDays, subDays, startOfDay, endOfDay, differenceInDays, format } from 'date-fns';
import { logger } from '../utils/logger';
import { emailService } from './emailService';

const prisma = new PrismaClient();

export interface CompOffExpiryConfig {
  reminderDaysBefore: number[];
  enableReminders: boolean;
  includeWorkLogDetails: boolean;
  portalUrl: string;
}

export interface CompOffExpiryResult {
  success: boolean;
  remindersSent: number;
  errors: string[];
  employeesProcessed: {
    employeeId: string;
    employeeName: string;
    compOffHours: number;
    expiryDate: Date;
    daysUntilExpiry: number;
    reminderSent: boolean;
  }[];
}

export interface CompOffExpiryDetails {
  compOffHours: number;
  expiryDate: Date;
  daysUntilExpiry: number;
  workLogDetails: {
    workDate: Date;
    hoursWorked: number;
    workType: string;
    workDescription: string;
  }[];
}

export class EnhancedCompOffExpiryService {
  // Default configuration for comp off expiry reminders
  private static readonly DEFAULT_CONFIG: CompOffExpiryConfig = {
    reminderDaysBefore: [30, 14, 7, 3, 1], // Send reminders at various intervals
    enableReminders: true,
    includeWorkLogDetails: true,
    portalUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
  };

  /**
   * Process comp off expiry reminders for all employees
   */
  static async processCompOffExpiryReminders(
    config: Partial<CompOffExpiryConfig> = {}
  ): Promise<CompOffExpiryResult> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };

    try {
      const today = startOfDay(new Date());
      const result: CompOffExpiryResult = {
        success: true,
        remindersSent: 0,
        errors: [],
        employeesProcessed: []
      };

      // Get all employees with expiring comp off
      const expiringCompOffs = await this.getExpiringCompOffs(finalConfig.reminderDaysBefore);

      for (const compOff of expiringCompOffs) {
        await this.processEmployeeCompOffExpiry(compOff, finalConfig, result);
      }

      logger.info('Comp off expiry reminder processing completed', {
        remindersSent: result.remindersSent,
        employeesProcessed: result.employeesProcessed.length,
        errors: result.errors.length
      });

      return result;

    } catch (error) {
      logger.error('Error processing comp off expiry reminders', error);
      return {
        success: false,
        remindersSent: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        employeesProcessed: []
      };
    }
  }

  /**
   * Get comp offs that are expiring within the reminder period
   */
  private static async getExpiringCompOffs(reminderDaysBefore: number[]) {
    try {
      const today = startOfDay(new Date());
      const maxDaysAhead = Math.max(...reminderDaysBefore);
      const endDate = addDays(today, maxDaysAhead);

      // Get comp off requests that are approved and expiring soon
      const expiringCompOffs = await prisma.compOffRequest.findMany({
        where: {
          status: 'APPROVED',
          isExpired: false,
          expiryDate: {
            gte: today,
            lte: endDate
          }
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              status: true
            }
          },
          workLog: {
            select: {
              workDate: true,
              hoursWorked: true,
              workType: true,
              workDescription: true
            }
          }
        },
        orderBy: {
          expiryDate: 'asc'
        }
      });

      return expiringCompOffs.filter(compOff =>
        compOff.employee.status === 'ACTIVE' && compOff.daysRequested > 0
      );

    } catch (error) {
      logger.error('Error fetching expiring comp offs', error);
      throw error;
    }
  }

  /**
   * Process comp off expiry for a single employee
   */
  private static async processEmployeeCompOffExpiry(
    compOff: any,
    config: CompOffExpiryConfig,
    result: CompOffExpiryResult
  ): Promise<void> {
    try {
      const today = startOfDay(new Date());
      const daysUntilExpiry = differenceInDays(compOff.expiryDate, today);

      // Check if we should send a reminder for this number of days
      const shouldSendReminder = config.reminderDaysBefore.includes(daysUntilExpiry);

      const employeeResult = {
        employeeId: compOff.employee.id,
        employeeName: `${compOff.employee.firstName} ${compOff.employee.lastName}`,
        compOffHours: compOff.hoursToRedeem,
        expiryDate: compOff.expiryDate,
        daysUntilExpiry,
        reminderSent: false
      };

      if (shouldSendReminder && config.enableReminders) {
        // Check if reminder was already sent for this combination
        const alreadySent = await this.checkReminderAlreadySent(
          compOff.id,
          daysUntilExpiry
        );

        if (!alreadySent) {
          try {
            await this.sendCompOffExpiryReminder(compOff, config);
            await this.recordReminderSent(compOff.id, daysUntilExpiry);

            employeeResult.reminderSent = true;
            result.remindersSent++;

            logger.info('Comp off expiry reminder sent', {
              compOffId: compOff.id,
              employeeId: compOff.employee.id,
              daysUntilExpiry,
              expiryDate: compOff.expiryDate.toISOString()
            });

          } catch (emailError) {
            const errorMsg = `Failed to send reminder to ${compOff.employee.email}: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`;
            result.errors.push(errorMsg);
            logger.error('Error sending comp off expiry reminder', emailError);
          }
        } else {
          logger.debug('Reminder already sent', {
            compOffId: compOff.id,
            daysUntilExpiry
          });
        }
      }

      result.employeesProcessed.push(employeeResult);

    } catch (error) {
      const errorMsg = `Error processing comp off for employee ${compOff.employee.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.errors.push(errorMsg);
      logger.error('Error processing employee comp off expiry', error);
    }
  }

  /**
   * Send comp off expiry reminder email
   */
  private static async sendCompOffExpiryReminder(
    compOff: any,
    config: CompOffExpiryConfig
  ): Promise<void> {
    const today = startOfDay(new Date());
    const daysUntilExpiry = differenceInDays(compOff.expiryDate, today);

    const workLogDetails = config.includeWorkLogDetails ? [{
      workDate: compOff.workLog.workDate,
      hoursWorked: compOff.workLog.hoursWorked,
      workType: compOff.workLog.workType,
      workDescription: compOff.workLog.workDescription
    }] : [];

    const emailData = {
      to: compOff.employee.email,
      subject: `⏰ Comp Off Expiring ${daysUntilExpiry === 1 ? 'Tomorrow' : `in ${daysUntilExpiry} days`}`,
      template: 'comp-off-expiration',
      data: {
        employeeName: `${compOff.employee.firstName} ${compOff.employee.lastName}`,
        compOffHours: compOff.hoursToRedeem,
        expiryDate: compOff.expiryDate,
        daysUntilExpiry,
        workLogDetails,
        portalUrl: config.portalUrl,
        companyName: 'Your Company',
        // Helper functions for template
        formatDate: (date: Date) => format(date, 'PPP'),
        lt: (a: number, b: number) => a < b
      }
    };

    await emailService.sendEmail(emailData);

    // Create notification in the system
    await prisma.notification.create({
      data: {
        userId: compOff.employee.id,
        type: 'COMP_OFF_EXPIRY',
        title: `Comp Off Expiring in ${daysUntilExpiry} days`,
        message: `Your comp off (${compOff.hoursToRedeem} hours) expires on ${format(compOff.expiryDate, 'PPP')}`,
        metadata: JSON.stringify({
          compOffRequestId: compOff.id,
          daysUntilExpiry,
          expiryDate: compOff.expiryDate.toISOString(),
          hoursToRedeem: compOff.hoursToRedeem
        })
      }
    });
  }

  /**
   * Check if reminder was already sent for this comp off and days until expiry
   */
  private static async checkReminderAlreadySent(
    compOffRequestId: string,
    daysUntilExpiry: number
  ): Promise<boolean> {
    try {
      const existingLog = await prisma.auditLog.findFirst({
        where: {
          entity: 'COMP_OFF_EXPIRY_REMINDER',
          entityId: compOffRequestId,
          action: 'REMINDER_SENT',
          newValues: {
            contains: `"daysUntilExpiry":${daysUntilExpiry}`
          },
          createdAt: {
            gte: subDays(new Date(), 1) // Check within last 24 hours to avoid duplicates
          }
        }
      });

      return !!existingLog;
    } catch (error) {
      logger.error('Error checking if reminder already sent', error);
      return false; // Default to allowing reminder if we can't check
    }
  }

  /**
   * Record that a reminder was sent
   */
  private static async recordReminderSent(
    compOffRequestId: string,
    daysUntilExpiry: number
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          entity: 'COMP_OFF_EXPIRY_REMINDER',
          entityId: compOffRequestId,
          action: 'REMINDER_SENT',
          newValues: JSON.stringify({
            daysUntilExpiry,
            timestamp: new Date().toISOString()
          })
        }
      });
    } catch (error) {
      logger.error('Error recording comp off expiry reminder', error);
    }
  }

  /**
   * Mark expired comp offs as expired
   */
  static async markExpiredCompOffs(): Promise<number> {
    try {
      const today = startOfDay(new Date());

      const expiredCompOffs = await prisma.compOffRequest.updateMany({
        where: {
          expiryDate: {
            lt: today
          },
          isExpired: false,
          status: 'APPROVED'
        },
        data: {
          isExpired: true
        }
      });

      logger.info('Marked expired comp offs', {
        count: expiredCompOffs.count,
        date: today.toISOString()
      });

      return expiredCompOffs.count;

    } catch (error) {
      logger.error('Error marking expired comp offs', error);
      throw error;
    }
  }

  /**
   * Get comp off expiry summary for an employee
   */
  static async getEmployeeCompOffExpirySummary(
    employeeId: string
  ): Promise<CompOffExpiryDetails[]> {
    try {
      const today = startOfDay(new Date());

      const compOffs = await prisma.compOffRequest.findMany({
        where: {
          employeeId,
          status: 'APPROVED',
          isExpired: false,
          expiryDate: {
            gte: today
          }
        },
        include: {
          workLog: {
            select: {
              workDate: true,
              hoursWorked: true,
              workType: true,
              workDescription: true
            }
          }
        },
        orderBy: {
          expiryDate: 'asc'
        }
      });

      return compOffs.map(compOff => ({
        compOffHours: compOff.hoursToRedeem,
        expiryDate: compOff.expiryDate,
        daysUntilExpiry: differenceInDays(compOff.expiryDate, today),
        workLogDetails: [{
          workDate: compOff.workLog.workDate,
          hoursWorked: compOff.workLog.hoursWorked,
          workType: compOff.workLog.workType,
          workDescription: compOff.workLog.workDescription
        }]
      }));

    } catch (error) {
      logger.error('Error getting employee comp off expiry summary', error);
      throw error;
    }
  }

  /**
   * Schedule daily comp off expiry job
   */
  static async scheduleDailyExpiryJob(): Promise<void> {
    try {
      logger.info('Starting daily comp off expiry job');

      // Process reminders
      const reminderResult = await this.processCompOffExpiryReminders();

      // Mark expired comp offs
      const expiredCount = await this.markExpiredCompOffs();

      logger.info('Daily comp off expiry job completed', {
        remindersSent: reminderResult.remindersSent,
        employeesProcessed: reminderResult.employeesProcessed.length,
        errors: reminderResult.errors.length,
        expiredCount
      });

      if (reminderResult.errors.length > 0) {
        logger.warn('Comp off expiry job errors', { errors: reminderResult.errors });
      }

    } catch (error) {
      logger.error('Error in daily comp off expiry job', error);
      throw error;
    }
  }

  /**
   * Get comp off expiry statistics
   */
  static async getExpiryStatistics(startDate: Date, endDate: Date) {
    try {
      const reminderLogs = await prisma.auditLog.findMany({
        where: {
          entity: 'COMP_OFF_EXPIRY_REMINDER',
          action: 'REMINDER_SENT',
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const expiredCompOffs = await prisma.compOffRequest.findMany({
        where: {
          isExpired: true,
          expiryDate: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      return {
        totalReminders: reminderLogs.length,
        totalExpired: expiredCompOffs.length,
        expiredDetails: expiredCompOffs.map(compOff => ({
          employeeName: `${compOff.employee.firstName} ${compOff.employee.lastName}`,
          hoursLost: compOff.hoursToRedeem,
          expiryDate: compOff.expiryDate
        })),
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      };
    } catch (error) {
      logger.error('Error getting comp off expiry statistics', error);
      throw error;
    }
  }
}

export const enhancedCompOffExpiryService = EnhancedCompOffExpiryService;