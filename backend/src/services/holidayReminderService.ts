import { PrismaClient } from '@prisma/client';
import { addDays, subDays, startOfDay, endOfDay, format } from 'date-fns';
import { logger } from '../utils/logger';
import { emailService } from './emailService';

const prisma = new PrismaClient();

export interface HolidayReminderConfig {
  reminderDaysBefore: number[];
  enableReminders: boolean;
  includeOptionalHolidays: boolean;
  regions: string[];
}

export interface HolidayReminderResult {
  success: boolean;
  remindersSent: number;
  errors: string[];
  holidaysProcessed: {
    id: string;
    name: string;
    date: Date;
    recipientCount: number;
  }[];
}

export class HolidayReminderService {
  // Default configuration for holiday reminders
  private static readonly DEFAULT_CONFIG: HolidayReminderConfig = {
    reminderDaysBefore: [7, 3, 1], // Send reminders 7, 3, and 1 days before
    enableReminders: true,
    includeOptionalHolidays: true,
    regions: ['INDIA', 'USA']
  };

  /**
   * Process holiday reminders for upcoming holidays
   */
  static async processHolidayReminders(
    config: Partial<HolidayReminderConfig> = {}
  ): Promise<HolidayReminderResult> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };

    try {
      const today = startOfDay(new Date());
      const result: HolidayReminderResult = {
        success: true,
        remindersSent: 0,
        errors: [],
        holidaysProcessed: []
      };

      // Check each reminder day configuration
      for (const daysBefore of finalConfig.reminderDaysBefore) {
        const targetDate = addDays(today, daysBefore);

        await this.processReminderForDate(targetDate, daysBefore, finalConfig, result);
      }

      logger.info('Holiday reminder processing completed', {
        remindersSent: result.remindersSent,
        holidaysProcessed: result.holidaysProcessed.length,
        errors: result.errors.length
      });

      return result;

    } catch (error) {
      logger.error('Error processing holiday reminders', error);
      return {
        success: false,
        remindersSent: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        holidaysProcessed: []
      };
    }
  }

  /**
   * Process reminders for a specific date
   */
  private static async processReminderForDate(
    holidayDate: Date,
    daysBefore: number,
    config: HolidayReminderConfig,
    result: HolidayReminderResult
  ): Promise<void> {
    try {
      // Find holidays for the target date
      const holidays = await prisma.holiday.findMany({
        where: {
          date: {
            gte: startOfDay(holidayDate),
            lte: endOfDay(holidayDate)
          },
          region: {
            in: config.regions
          },
          ...(config.includeOptionalHolidays ? {} : { isOptional: false })
        }
      });

      for (const holiday of holidays) {
        await this.sendHolidayReminder(holiday, daysBefore, result);
      }

    } catch (error) {
      logger.error(`Error processing reminders for date ${holidayDate.toISOString()}`, error);
      result.errors.push(`Date ${holidayDate.toISOString()}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send holiday reminder emails
   */
  private static async sendHolidayReminder(
    holiday: any,
    daysBefore: number,
    result: HolidayReminderResult
  ): Promise<void> {
    try {
      // Get employees in the same region/location as the holiday
      const employees = await prisma.user.findMany({
        where: {
          status: 'ACTIVE',
          ...(holiday.location === 'ALL' ? {} : { location: holiday.location }),
          ...(holiday.region !== 'ALL' ? { country: holiday.region } : {})
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          location: true,
          country: true
        }
      });

      let emailsSent = 0;
      const errors: string[] = [];

      for (const employee of employees) {
        try {
          await this.sendHolidayReminderEmail(employee, holiday, daysBefore);
          emailsSent++;
        } catch (emailError) {
          errors.push(`Failed to send to ${employee.email}: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`);
        }
      }

      // Record the holiday reminder in database for tracking
      await this.recordHolidayReminder(holiday.id, daysBefore, emailsSent);

      result.remindersSent += emailsSent;
      result.errors.push(...errors);
      result.holidaysProcessed.push({
        id: holiday.id,
        name: holiday.name,
        date: holiday.date,
        recipientCount: emailsSent
      });

      logger.info('Holiday reminder sent', {
        holidayId: holiday.id,
        holidayName: holiday.name,
        holidayDate: holiday.date.toISOString(),
        daysBefore,
        emailsSent,
        errors: errors.length
      });

    } catch (error) {
      logger.error('Error sending holiday reminder', error);
      result.errors.push(`Holiday ${holiday.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send individual holiday reminder email
   */
  private static async sendHolidayReminderEmail(
    employee: any,
    holiday: any,
    daysBefore: number
  ): Promise<void> {
    const reminderType = daysBefore === 1 ? 'tomorrow' : `in ${daysBefore} days`;
    const formattedDate = format(holiday.date, 'EEEE, MMMM do, yyyy');

    const emailData = {
      to: employee.email,
      subject: `🎉 Holiday Reminder: ${holiday.name} - ${reminderType}`,
      template: 'holiday-reminder',
      data: {
        employeeName: `${employee.firstName} ${employee.lastName}`,
        holidayName: holiday.name,
        holidayDate: formattedDate,
        daysBefore,
        reminderType,
        isOptional: holiday.isOptional,
        description: holiday.description || `${holiday.name} holiday`,
        location: holiday.location,
        region: holiday.region
      }
    };

    await emailService.sendEmail(emailData);

    // Create notification in the system
    await prisma.notification.create({
      data: {
        userId: employee.id,
        type: 'HOLIDAY_REMINDER',
        title: `Holiday Reminder: ${holiday.name}`,
        message: `${holiday.name} is coming up ${reminderType} (${formattedDate})`,
        metadata: JSON.stringify({
          holidayId: holiday.id,
          daysBefore,
          holidayDate: holiday.date.toISOString()
        })
      }
    });
  }

  /**
   * Record holiday reminder in database for tracking
   */
  private static async recordHolidayReminder(
    holidayId: string,
    daysBefore: number,
    emailsSent: number
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          entity: 'HOLIDAY_REMINDER',
          entityId: holidayId,
          action: 'REMINDER_SENT',
          newValues: JSON.stringify({
            daysBefore,
            emailsSent,
            timestamp: new Date().toISOString()
          })
        }
      });
    } catch (error) {
      logger.error('Error recording holiday reminder audit log', error);
    }
  }

  /**
   * Get upcoming holidays for a specific region/location
   */
  static async getUpcomingHolidays(
    region?: string,
    location?: string,
    daysAhead: number = 30
  ) {
    try {
      const today = startOfDay(new Date());
      const endDate = addDays(today, daysAhead);

      const holidays = await prisma.holiday.findMany({
        where: {
          date: {
            gte: today,
            lte: endDate
          },
          ...(region ? { region } : {}),
          ...(location && location !== 'ALL' ? { location } : {})
        },
        orderBy: {
          date: 'asc'
        }
      });

      return holidays;
    } catch (error) {
      logger.error('Error fetching upcoming holidays', error);
      throw error;
    }
  }

  /**
   * Schedule daily holiday reminder job
   */
  static async scheduleDailyReminders(): Promise<void> {
    try {
      logger.info('Starting daily holiday reminder job');

      const result = await this.processHolidayReminders();

      logger.info('Daily holiday reminder job completed', {
        success: result.success,
        remindersSent: result.remindersSent,
        errors: result.errors.length
      });

      if (result.errors.length > 0) {
        logger.warn('Holiday reminder errors', { errors: result.errors });
      }

    } catch (error) {
      logger.error('Error in daily holiday reminder job', error);
      throw error;
    }
  }

  /**
   * Create or update holiday reminder configuration
   */
  static async updateReminderConfig(
    config: Partial<HolidayReminderConfig>
  ): Promise<void> {
    try {
      // Store configuration in database or configuration service
      // For now, we'll log the configuration update
      logger.info('Holiday reminder configuration updated', config);

      // In a real implementation, you might store this in a settings table
      // or configuration management system
    } catch (error) {
      logger.error('Error updating holiday reminder configuration', error);
      throw error;
    }
  }

  /**
   * Get holiday reminder statistics
   */
  static async getReminderStatistics(startDate: Date, endDate: Date) {
    try {
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          entity: 'HOLIDAY_REMINDER',
          action: 'REMINDER_SENT',
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const totalReminders = auditLogs.length;
      const totalEmailsSent = auditLogs.reduce((sum, log) => {
        const data = JSON.parse(log.newValues || '{}');
        return sum + (data.emailsSent || 0);
      }, 0);

      return {
        totalReminders,
        totalEmailsSent,
        averageEmailsPerReminder: totalReminders > 0 ? totalEmailsSent / totalReminders : 0,
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      };
    } catch (error) {
      logger.error('Error getting holiday reminder statistics', error);
      throw error;
    }
  }
}

export const holidayReminderService = HolidayReminderService;