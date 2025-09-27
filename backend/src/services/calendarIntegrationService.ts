import { google, calendar_v3 } from 'googleapis';
import ical from 'ical-generator';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { logger } from '../utils/logger';
import { prisma } from '../index';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  attendees?: string[];
  isAllDay?: boolean;
}

export interface CalendarIntegrationConfig {
  userId: string;
  provider: 'google' | 'outlook';
  accessToken: string;
  refreshToken?: string;
  calendarId?: string;
  enabled: boolean;
}

class CalendarIntegrationService {
  private googleAuth: any;
  private msalInstance: ConfidentialClientApplication | null = null;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Initialize Google OAuth2 client
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      this.googleAuth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/v1/calendar/google/callback'
      );
    }

    // Initialize Microsoft MSAL client
    if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
      const msalConfig = {
        auth: {
          clientId: process.env.MICROSOFT_CLIENT_ID,
          clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
          authority: 'https://login.microsoftonline.com/common',
        },
      };
      this.msalInstance = new ConfidentialClientApplication(msalConfig);
    }
  }

  // Google Calendar Integration
  async connectGoogleCalendar(userId: string, authCode: string): Promise<boolean> {
    try {
      if (!this.googleAuth) {
        throw new Error('Google Calendar integration not configured');
      }

      const { tokens } = await this.googleAuth.getToken(authCode);
      this.googleAuth.setCredentials(tokens);

      // Store tokens in database
      await this.saveCalendarConfig({
        userId,
        provider: 'google',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        enabled: true,
      });

      logger.info(`Google Calendar connected for user ${userId}`);
      return true;
    } catch (error) {
      logger.error('Error connecting Google Calendar:', error);
      return false;
    }
  }

  async createGoogleCalendarEvent(userId: string, event: CalendarEvent): Promise<string | null> {
    try {
      const config = await this.getCalendarConfig(userId, 'google');
      if (!config?.enabled) {
        throw new Error('Google Calendar not connected');
      }

      this.googleAuth.setCredentials({
        access_token: config.accessToken,
        refresh_token: config.refreshToken,
      });

      const calendar = google.calendar({ version: 'v3', auth: this.googleAuth });

      const googleEvent: calendar_v3.Schema$Event = {
        summary: event.title,
        description: event.description,
        start: {
          dateTime: event.startDate.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: event.endDate.toISOString(),
          timeZone: 'UTC',
        },
        location: event.location,
        attendees: event.attendees?.map(email => ({ email })),
      };

      if (event.isAllDay) {
        googleEvent.start = {
          date: event.startDate.toISOString().split('T')[0],
          timeZone: 'UTC',
        };
        googleEvent.end = {
          date: event.endDate.toISOString().split('T')[0],
          timeZone: 'UTC',
        };
      }

      const response = await calendar.events.insert({
        calendarId: config.calendarId || 'primary',
        requestBody: googleEvent,
      });

      logger.info(`Google Calendar event created: ${response.data.id}`);
      return response.data.id || null;
    } catch (error) {
      logger.error('Error creating Google Calendar event:', error);
      return null;
    }
  }

  async updateGoogleCalendarEvent(userId: string, eventId: string, event: CalendarEvent): Promise<boolean> {
    try {
      const config = await this.getCalendarConfig(userId, 'google');
      if (!config?.enabled) {
        throw new Error('Google Calendar not connected');
      }

      this.googleAuth.setCredentials({
        access_token: config.accessToken,
        refresh_token: config.refreshToken,
      });

      const calendar = google.calendar({ version: 'v3', auth: this.googleAuth });

      const googleEvent: calendar_v3.Schema$Event = {
        summary: event.title,
        description: event.description,
        start: {
          dateTime: event.startDate.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: event.endDate.toISOString(),
          timeZone: 'UTC',
        },
        location: event.location,
        attendees: event.attendees?.map(email => ({ email })),
      };

      await calendar.events.update({
        calendarId: config.calendarId || 'primary',
        eventId,
        requestBody: googleEvent,
      });

      logger.info(`Google Calendar event updated: ${eventId}`);
      return true;
    } catch (error) {
      logger.error('Error updating Google Calendar event:', error);
      return false;
    }
  }

  async deleteGoogleCalendarEvent(userId: string, eventId: string): Promise<boolean> {
    try {
      const config = await this.getCalendarConfig(userId, 'google');
      if (!config?.enabled) {
        throw new Error('Google Calendar not connected');
      }

      this.googleAuth.setCredentials({
        access_token: config.accessToken,
        refresh_token: config.refreshToken,
      });

      const calendar = google.calendar({ version: 'v3', auth: this.googleAuth });

      await calendar.events.delete({
        calendarId: config.calendarId || 'primary',
        eventId,
      });

      logger.info(`Google Calendar event deleted: ${eventId}`);
      return true;
    } catch (error) {
      logger.error('Error deleting Google Calendar event:', error);
      return false;
    }
  }

  // Outlook Calendar Integration
  async connectOutlookCalendar(userId: string, authCode: string): Promise<boolean> {
    try {
      if (!this.msalInstance) {
        throw new Error('Outlook Calendar integration not configured');
      }

      const tokenRequest = {
        code: authCode,
        scopes: ['https://graph.microsoft.com/calendars.readwrite'],
        redirectUri: process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3001/api/v1/calendar/outlook/callback',
      };

      const response = await this.msalInstance.acquireTokenByCode(tokenRequest);

      await this.saveCalendarConfig({
        userId,
        provider: 'outlook',
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        enabled: true,
      });

      logger.info(`Outlook Calendar connected for user ${userId}`);
      return true;
    } catch (error) {
      logger.error('Error connecting Outlook Calendar:', error);
      return false;
    }
  }

  // iCal Export
  async generateICalFeed(userId: string): Promise<string> {
    try {
      // Fetch user's leave requests
      const leaves = await prisma.leaveRequest.findMany({
        where: {
          employeeId: userId,
          status: { in: ['APPROVED', 'PENDING'] },
        },
        include: {
          employee: {
            select: { name: true, email: true },
          },
        },
      });

      const calendar = ical({
        domain: 'leave-management-system.com',
        name: 'Leave Management System',
        description: 'Employee leave calendar',
        timezone: 'UTC',
      });

      leaves.forEach(leave => {
        calendar.createEvent({
          start: new Date(leave.startDate),
          end: new Date(leave.endDate),
          summary: `${leave.leaveType.replace('_', ' ')} - ${leave.employee.name}`,
          description: leave.reason || 'Leave request',
          location: 'Out of Office',
          uid: `leave-${leave.id}@leave-management-system.com`,
          status: leave.status === 'APPROVED' ? 'CONFIRMED' : 'TENTATIVE',
          busyStatus: 'BUSY',
          allDay: true,
        });
      });

      return calendar.toString();
    } catch (error) {
      logger.error('Error generating iCal feed:', error);
      throw new Error('Failed to generate calendar feed');
    }
  }

  // Database operations
  private async saveCalendarConfig(config: CalendarIntegrationConfig): Promise<void> {
    try {
      await prisma.calendarIntegration.upsert({
        where: {
          userId_provider: {
            userId: config.userId,
            provider: config.provider,
          },
        },
        update: {
          accessToken: config.accessToken,
          refreshToken: config.refreshToken,
          calendarId: config.calendarId,
          enabled: config.enabled,
          updatedAt: new Date(),
        },
        create: {
          userId: config.userId,
          provider: config.provider,
          accessToken: config.accessToken,
          refreshToken: config.refreshToken,
          calendarId: config.calendarId,
          enabled: config.enabled,
        },
      });
    } catch (error) {
      logger.error('Error saving calendar configuration:', error);
      throw error;
    }
  }

  private async getCalendarConfig(userId: string, provider: 'google' | 'outlook'): Promise<CalendarIntegrationConfig | null> {
    try {
      const config = await prisma.calendarIntegration.findUnique({
        where: {
          userId_provider: {
            userId,
            provider,
          },
        },
      });

      if (!config) return null;

      return {
        userId: config.userId,
        provider: config.provider as 'google' | 'outlook',
        accessToken: config.accessToken,
        refreshToken: config.refreshToken,
        calendarId: config.calendarId,
        enabled: config.enabled,
      };
    } catch (error) {
      logger.error('Error getting calendar configuration:', error);
      return null;
    }
  }

  // Sync leave request with calendar
  async syncLeaveWithCalendar(leaveId: string, action: 'create' | 'update' | 'delete'): Promise<void> {
    try {
      const leave = await prisma.leaveRequest.findUnique({
        where: { id: leaveId },
        include: {
          employee: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      if (!leave) {
        throw new Error('Leave request not found');
      }

      // Get user's calendar integrations
      const configs = await prisma.calendarIntegration.findMany({
        where: {
          userId: leave.employeeId,
          enabled: true,
        },
      });

      for (const config of configs) {
        const event: CalendarEvent = {
          id: `leave-${leaveId}`,
          title: `${leave.leaveType.replace('_', ' ')} - ${leave.employee.name}`,
          description: leave.reason || 'Leave request',
          startDate: new Date(leave.startDate),
          endDate: new Date(leave.endDate),
          isAllDay: true,
        };

        if (config.provider === 'google') {
          if (action === 'create' && leave.status === 'APPROVED') {
            const eventId = await this.createGoogleCalendarEvent(leave.employeeId, event);
            if (eventId) {
              await prisma.leaveRequest.update({
                where: { id: leaveId },
                data: { googleCalendarEventId: eventId },
              });
            }
          } else if (action === 'update' && leave.googleCalendarEventId) {
            await this.updateGoogleCalendarEvent(leave.employeeId, leave.googleCalendarEventId, event);
          } else if (action === 'delete' && leave.googleCalendarEventId) {
            await this.deleteGoogleCalendarEvent(leave.employeeId, leave.googleCalendarEventId);
          }
        }
        // Add Outlook integration similarly
      }
    } catch (error) {
      logger.error('Error syncing leave with calendar:', error);
    }
  }

  // Get authorization URLs
  getGoogleAuthUrl(): string {
    if (!this.googleAuth) {
      throw new Error('Google Calendar integration not configured');
    }

    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ];

    return this.googleAuth.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });
  }

  getOutlookAuthUrl(): string {
    if (!this.msalInstance) {
      throw new Error('Outlook Calendar integration not configured');
    }

    const authCodeUrlParameters = {
      scopes: ['https://graph.microsoft.com/calendars.readwrite'],
      redirectUri: process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3001/api/v1/calendar/outlook/callback',
    };

    return this.msalInstance.getAuthCodeUrl(authCodeUrlParameters);
  }

  // Disconnect calendar integrations
  async disconnectCalendar(userId: string, provider: 'google' | 'outlook'): Promise<boolean> {
    try {
      await prisma.calendarIntegration.update({
        where: {
          userId_provider: {
            userId,
            provider,
          },
        },
        data: {
          enabled: false,
          updatedAt: new Date(),
        },
      });

      logger.info(`${provider} Calendar disconnected for user ${userId}`);
      return true;
    } catch (error) {
      logger.error(`Error disconnecting ${provider} Calendar:`, error);
      return false;
    }
  }

  // Get user's calendar integrations
  async getUserCalendarIntegrations(userId: string) {
    try {
      return await prisma.calendarIntegration.findMany({
        where: { userId },
        select: {
          provider: true,
          enabled: true,
          calendarId: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      logger.error('Error getting user calendar integrations:', error);
      return [];
    }
  }
}

export const calendarIntegrationService = new CalendarIntegrationService();