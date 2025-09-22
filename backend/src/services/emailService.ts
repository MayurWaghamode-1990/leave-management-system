import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import { createEmailTransporter, isEmailDemoMode, emailConfig } from '../config/email';
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
        'leave-request-submitted.hbs'
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

      return await this.sendEmail(to, subject, html, html);
    } catch (error) {
      logger.error('Failed to send test email:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
export type { LeaveEmailData };