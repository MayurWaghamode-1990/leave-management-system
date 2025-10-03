import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import { createEmailTransporter, isEmailDemoMode, emailConfig } from '../config/email';
import { emailActionTokenService } from './emailActionTokenService';
import { logger } from '../utils/logger';

interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

interface LeaveEmailData {
  employeeName: string;
  employeeEmail: string;
  managerName?: string;
  managerEmail?: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string;
  comments?: string;
  approvedBy?: string;
  rejectedBy?: string;
  submittedDate?: string;
  leaveRequestId: string;
}

interface ApprovalEmailData extends LeaveEmailData {
  approverName: string;
  approverEmail: string;
  approverId: string;
  currentLevel: number;
  totalLevels: number;
  isCompOffRequest: boolean;
  department: string;
  employeeId: string;
  appliedDate: string;
  previousApprovals?: Array<{
    level: number;
    approverName: string;
    approverRole: string;
    comments?: string;
    approvedAt: Date;
  }>;
}

interface EmailQueueItem {
  id: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  priority: 'high' | 'normal' | 'low';
  attempts: number;
  maxAttempts: number;
  scheduledFor: Date;
  createdAt: Date;
  lastAttempt?: Date;
  error?: string;
}

class EmailService {
  private transporter: any;
  private templates: Map<string, handlebars.TemplateDelegate> = new Map();
  private demoMode: boolean;
  private emailQueue: EmailQueueItem[] = [];
  private processingQueue = false;

  constructor() {
    this.transporter = createEmailTransporter();
    this.demoMode = isEmailDemoMode();
    this.loadTemplates();
    this.startQueueProcessor();
  }

  private loadTemplates() {
    try {
      const templateDir = path.join(__dirname, '../templates/email');

      // Load base template
      const baseTemplate = fs.readFileSync(path.join(templateDir, 'base.hbs'), 'utf-8');
      this.templates.set('base', handlebars.compile(baseTemplate));

      // Load specific templates
      const templateFiles = [
        'leave-approved.hbs',
        'leave-rejected.hbs',
        'leave-request-submitted.hbs',
        'approval-request.hbs'
      ];

      templateFiles.forEach(file => {
        const templateName = file.replace('.hbs', '');
        const templateContent = fs.readFileSync(path.join(templateDir, file), 'utf-8');
        this.templates.set(templateName, handlebars.compile(templateContent));
      });

      logger.info('📧 Email templates loaded successfully');
    } catch (error) {
      logger.error('Failed to load email templates:', error);
    }
  }

  private generateEmail(templateName: string, data: any): EmailTemplate {
    try {
      const template = this.templates.get(templateName);
      const baseTemplate = this.templates.get('base');

      if (!template || !baseTemplate) {
        throw new Error(`Template ${templateName} not found`);
      }

      // Generate the email body
      const body = template(data);

      // Generate the full email with base template
      const html = baseTemplate({
        ...data,
        body,
        companyName: emailConfig.companyName,
        baseUrl: emailConfig.baseUrl,
        currentYear: new Date().getFullYear()
      });

      // Generate text version (simple fallback)
      const text = this.htmlToText(html);

      return {
        subject: data.subject,
        html,
        text
      };
    } catch (error) {
      logger.error(`Failed to generate email template ${templateName}:`, error);
      throw error;
    }
  }

  private htmlToText(html: string): string {
    // Simple HTML to text conversion
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private async sendEmailWithRetry(to: string, subject: string, html: string, text: string, retries: number = 0): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      const result = await this.sendEmail(to, subject, html, text);
      return result;
    } catch (error: any) {
      if (retries < emailConfig.maxRetries) {
        logger.warn(`Email send failed, retrying (${retries + 1}/${emailConfig.maxRetries}):`, error.message);
        await new Promise(resolve => setTimeout(resolve, emailConfig.retryDelay));
        return this.sendEmailWithRetry(to, subject, html, text, retries + 1);
      }

      logger.error('Email send failed after all retries:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async sendEmail(to: string, subject: string, html: string, text: string): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    if (this.demoMode) {
      // Demo mode - log email instead of sending
      logger.info('📧 [DEMO MODE] Email would be sent:');
      logger.info(`   To: ${to}`);
      logger.info(`   Subject: ${subject}`);
      logger.info(`   Content: ${text.substring(0, 200)}...`);
      return {
        success: true,
        messageId: `demo-${Date.now()}`
      };
    }

    if (!this.transporter) {
      const error = 'Email transporter not available';
      logger.error(error);
      return {
        success: false,
        error
      };
    }

    try {
      const mailOptions = {
        from: {
          name: emailConfig.from.name,
          address: emailConfig.from.address
        },
        to,
        subject,
        html,
        text
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`📧 Email sent successfully to ${to}: ${result.messageId}`);
      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error: any) {
      logger.error(`Failed to send email to ${to}:`, error);
      throw error; // Throw to trigger retry logic
    }
  }

  // Send leave approved email
  async sendLeaveApprovedEmail(data: LeaveEmailData): Promise<boolean> {
    try {
      const emailData = {
        ...data,
        subject: `Leave Request Approved - ${data.leaveType} (${data.startDate} to ${data.endDate})`
      };

      const email = this.generateEmail('leave-approved', emailData);
      const result = await this.sendEmailWithRetry(data.employeeEmail, email.subject, email.html, email.text);
      return result.success;
    } catch (error) {
      logger.error('Failed to send leave approved email:', error);
      return false;
    }
  }

  // Send leave rejected email
  async sendLeaveRejectedEmail(data: LeaveEmailData): Promise<boolean> {
    try {
      const emailData = {
        ...data,
        subject: `Leave Request Rejected - ${data.leaveType} (${data.startDate} to ${data.endDate})`
      };

      const email = this.generateEmail('leave-rejected', emailData);
      return await this.sendEmail(data.employeeEmail, email.subject, email.html, email.text);
    } catch (error) {
      logger.error('Failed to send leave rejected email:', error);
      return false;
    }
  }

  // Send leave request submitted email (to manager/HR)
  async sendLeaveRequestSubmittedEmail(data: LeaveEmailData): Promise<boolean> {
    try {
      if (!data.managerEmail) {
        logger.warn('No manager email provided for leave request notification');
        return false;
      }

      const emailData = {
        ...data,
        subject: `New Leave Request - ${data.employeeName} (${data.leaveType})`
      };

      const email = this.generateEmail('leave-request-submitted', emailData);
      return await this.sendEmail(data.managerEmail, email.subject, email.html, email.text);
    } catch (error) {
      logger.error('Failed to send leave request submitted email:', error);
      return false;
    }
  }

  // Send reminder email
  async sendLeaveReminderEmail(data: LeaveEmailData): Promise<boolean> {
    try {
      const subject = `Reminder: Your leave starts on ${data.startDate}`;
      const html = `
        <p>Hello ${data.employeeName},</p>
        <p>This is a friendly reminder that your ${data.leaveType} starts on ${data.startDate}.</p>
        <p>Have a great time off!</p>
      `;

      return await this.sendEmail(data.employeeEmail, subject, html, html);
    } catch (error) {
      logger.error('Failed to send leave reminder email:', error);
      return false;
    }
  }

  // Queue processor for handling emails
  private startQueueProcessor() {
    if (this.processingQueue) return;

    this.processingQueue = true;

    // Process queue every 5 seconds
    setInterval(async () => {
      await this.processEmailQueue();
    }, 5000);
  }

  private async processEmailQueue() {
    if (this.emailQueue.length === 0) return;

    const now = new Date();
    const pendingEmails = this.emailQueue.filter(
      email => email.scheduledFor <= now && email.attempts < email.maxAttempts
    );

    for (const email of pendingEmails) {
      try {
        await this.sendEmail(email.to, email.subject, email.html, email.text);

        // Remove from queue on success
        const index = this.emailQueue.indexOf(email);
        if (index > -1) {
          this.emailQueue.splice(index, 1);
        }
      } catch (error) {
        email.attempts++;
        email.lastAttempt = now;
        email.error = error instanceof Error ? error.message : 'Unknown error';

        // Remove from queue if max attempts reached
        if (email.attempts >= email.maxAttempts) {
          const index = this.emailQueue.indexOf(email);
          if (index > -1) {
            this.emailQueue.splice(index, 1);
          }
          logger.error(`Email failed after ${email.maxAttempts} attempts:`, email.error);
        }
      }
    }
  }

  // Add email to queue
  private queueEmail(to: string, subject: string, html: string, text: string, priority: 'high' | 'normal' | 'low' = 'normal') {
    const emailItem: EmailQueueItem = {
      id: Math.random().toString(36).substr(2, 9),
      to,
      subject,
      html,
      text,
      priority,
      attempts: 0,
      maxAttempts: 3,
      scheduledFor: new Date(),
      createdAt: new Date()
    };

    this.emailQueue.push(emailItem);
  }

  // Send approval request email with action buttons
  async sendApprovalRequestEmail(data: ApprovalEmailData): Promise<boolean> {
    try {
      // Generate secure action URLs
      const tokenData = {
        leaveRequestId: data.leaveRequestId,
        approverId: data.approverId,
        level: data.currentLevel,
        action: 'APPROVE' as const
      };

      const { approveUrl, rejectUrl, tokenExpiry } = emailActionTokenService.generateApprovalUrls(tokenData);
      const dashboardUrl = emailActionTokenService.generateDashboardUrl(data.leaveRequestId);

      // Prepare email data with handlebars helpers
      const emailData = {
        ...data,
        subject: `${data.isCompOffRequest ? 'Comp Off' : 'Leave'} Approval Required - ${data.employeeName} (${data.leaveType})`,
        approveUrl,
        rejectUrl,
        dashboardUrl,
        tokenExpiry: tokenExpiry.toLocaleString(),
        // Helper functions for handlebars
        eq: (a: any, b: any) => a === b,
        gte: (a: any, b: any) => a >= b,
        formatDate: (date: Date) => date ? new Date(date).toLocaleString() : ''
      };

      // Register Handlebars helpers
      handlebars.registerHelper('eq', (a, b) => a === b);
      handlebars.registerHelper('gte', (a, b) => a >= b);
      handlebars.registerHelper('formatDate', (date) => date ? new Date(date).toLocaleString() : '');

      const email = this.generateEmail('approval-request', emailData);
      const result = await this.sendEmailWithRetry(data.approverEmail, email.subject, email.html, email.text);

      // Log the token generation
      if (result.success) {
        await emailActionTokenService.logEmailAction(
          data.leaveRequestId,
          data.approverId,
          'TOKEN_GENERATED',
          `Approval email sent for Level ${data.currentLevel}`
        );
      }

      return result.success;
    } catch (error) {
      logger.error('Failed to send approval request email:', error);
      return false;
    }
  }

  // Test email functionality
  async sendTestEmail(to: string): Promise<boolean> {
    try {
      const subject = 'LMS Email Service Test';
      const html = `
        <h2>Email Service Test</h2>
        <p>This is a test email from the Leave Management System.</p>
        <p>If you receive this, the email service is working correctly!</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `;

      const result = await this.sendEmailWithRetry(to, subject, html, html);
      return result.success;
    } catch (error) {
      logger.error('Failed to send test email:', error);
      return false;
    }
  }

  /**
   * Send leave cancellation notification
   */
  async sendLeaveCancellationNotification(data: LeaveEmailData & {
    cancelledBy: string;
    cancellationReason?: string;
    hrEmail?: string;
  }) {
    try {
      const template = this.getTemplate('leave-cancelled');
      if (!template) {
        throw new Error('Leave cancellation template not found');
      }

      const emailData = {
        ...data,
        formatDate: (date: string) => new Date(date).toLocaleDateString(),
        companyName: emailConfig.companyName
      };

      const emailContent = template(emailData);

      // Send to employee
      await this.addToQueue({
        to: data.employeeEmail,
        subject: `Leave Cancelled - ${data.leaveType} from ${data.startDate} to ${data.endDate}`,
        html: emailContent,
        priority: 'high'
      });

      // CC to Manager and HR
      const ccEmails = [];
      if (data.managerEmail) ccEmails.push(data.managerEmail);
      if (data.hrEmail) ccEmails.push(data.hrEmail);

      for (const email of ccEmails) {
        await this.addToQueue({
          to: email,
          subject: `Leave Cancelled - ${data.employeeName} (${data.leaveType})`,
          html: emailContent,
          priority: 'normal'
        });
      }

      logger.info('Leave cancellation notification sent', {
        employeeEmail: data.employeeEmail,
        leaveRequestId: data.leaveRequestId,
        ccEmails
      });
    } catch (error) {
      logger.error('Failed to send leave cancellation notification:', error);
      throw error;
    }
  }

  /**
   * Send holiday reminder notifications
   */
  async sendHolidayReminder(data: {
    employeeEmail: string;
    employeeName: string;
    holidayName: string;
    holidayDate: string;
    daysUntilHoliday: number;
    location: 'India' | 'USA';
    isOptional?: boolean;
  }) {
    try {
      const template = this.getTemplate('holiday-reminder');
      if (!template) {
        throw new Error('Holiday reminder template not found');
      }

      const emailData = {
        ...data,
        formatDate: (date: string) => new Date(date).toLocaleDateString(),
        companyName: emailConfig.companyName
      };

      const emailContent = template(emailData);

      await this.addToQueue({
        to: data.employeeEmail,
        subject: `Upcoming Holiday: ${data.holidayName} in ${data.daysUntilHoliday} days`,
        html: emailContent,
        priority: 'low'
      });

      logger.info('Holiday reminder sent', {
        employeeEmail: data.employeeEmail,
        holidayName: data.holidayName,
        holidayDate: data.holidayDate
      });
    } catch (error) {
      logger.error('Failed to send holiday reminder:', error);
      throw error;
    }
  }

  /**
   * Send comp off expiration reminders
   */
  async sendCompOffExpirationReminder(data: {
    employeeEmail: string;
    employeeName: string;
    compOffHours: number;
    expiryDate: string;
    daysUntilExpiry: number;
    workLogDetails: Array<{
      workDate: string;
      hoursWorked: number;
      workType: string;
    }>;
  }) {
    try {
      const template = this.getTemplate('comp-off-expiration');
      if (!template) {
        throw new Error('Comp off expiration template not found');
      }

      const emailData = {
        ...data,
        formatDate: (date: string) => new Date(date).toLocaleDateString(),
        companyName: emailConfig.companyName
      };

      const emailContent = template(emailData);

      await this.addToQueue({
        to: data.employeeEmail,
        subject: `Comp Off Expiring Soon - ${data.compOffHours}h expires in ${data.daysUntilExpiry} days`,
        html: emailContent,
        priority: 'high'
      });

      logger.info('Comp off expiration reminder sent', {
        employeeEmail: data.employeeEmail,
        compOffHours: data.compOffHours,
        expiryDate: data.expiryDate
      });
    } catch (error) {
      logger.error('Failed to send comp off expiration reminder:', error);
      throw error;
    }
  }

  /**
   * Enhanced method to send notifications with CC functionality
   */
  async sendNotificationWithCC(data: {
    to: string;
    cc?: string[];
    bcc?: string[];
    subject: string;
    templateName: string;
    templateData: any;
    priority?: 'high' | 'normal' | 'low';
  }) {
    try {
      const template = this.getTemplate(data.templateName);
      if (!template) {
        throw new Error(`Template '${data.templateName}' not found`);
      }

      const emailData = {
        ...data.templateData,
        formatDate: (date: string) => new Date(date).toLocaleDateString(),
        companyName: emailConfig.companyName
      };

      const emailContent = template(emailData);

      // Send to primary recipient
      await this.addToQueue({
        to: data.to,
        subject: data.subject,
        html: emailContent,
        priority: data.priority || 'normal'
      });

      // Send to CC recipients
      if (data.cc && data.cc.length > 0) {
        for (const ccEmail of data.cc) {
          await this.addToQueue({
            to: ccEmail,
            subject: `CC: ${data.subject}`,
            html: emailContent,
            priority: 'low'
          });
        }
      }

      // Send to BCC recipients
      if (data.bcc && data.bcc.length > 0) {
        for (const bccEmail of data.bcc) {
          await this.addToQueue({
            to: bccEmail,
            subject: `BCC: ${data.subject}`,
            html: emailContent,
            priority: 'low'
          });
        }
      }

      logger.info('Notification with CC sent', {
        to: data.to,
        cc: data.cc,
        bcc: data.bcc,
        templateName: data.templateName
      });
    } catch (error) {
      logger.error('Failed to send notification with CC:', error);
      throw error;
    }
  }

  /**
   * Bulk send holiday notifications to all employees
   */
  async sendBulkHolidayNotifications(data: {
    employees: Array<{
      email: string;
      name: string;
      location: 'India' | 'USA';
    }>;
    holidayName: string;
    holidayDate: string;
    daysUntilHoliday: number;
    isOptional?: boolean;
  }) {
    try {
      const template = this.getTemplate('holiday-reminder');
      if (!template) {
        throw new Error('Holiday reminder template not found');
      }

      let sentCount = 0;
      let failedCount = 0;

      for (const employee of data.employees) {
        try {
          const emailData = {
            employeeEmail: employee.email,
            employeeName: employee.name,
            location: employee.location,
            holidayName: data.holidayName,
            holidayDate: data.holidayDate,
            daysUntilHoliday: data.daysUntilHoliday,
            isOptional: data.isOptional,
            formatDate: (date: string) => new Date(date).toLocaleDateString(),
            companyName: emailConfig.companyName
          };

          const emailContent = template(emailData);

          await this.addToQueue({
            to: employee.email,
            subject: `Upcoming Holiday: ${data.holidayName} in ${data.daysUntilHoliday} days`,
            html: emailContent,
            priority: 'low'
          });

          sentCount++;
        } catch (error) {
          logger.error(`Failed to send holiday reminder to ${employee.email}:`, error);
          failedCount++;
        }
      }

      logger.info('Bulk holiday notifications processed', {
        totalEmployees: data.employees.length,
        sentCount,
        failedCount,
        holidayName: data.holidayName
      });

      return { sentCount, failedCount, totalEmployees: data.employees.length };
    } catch (error) {
      logger.error('Failed to send bulk holiday notifications:', error);
      throw error;
    }
  }
}

export const emailService = new EmailService();
export type { LeaveEmailData, ApprovalEmailData };