import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

// Email configuration interface
export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  tls?: {
    rejectUnauthorized: boolean;
  };
  pool?: boolean;
  maxConnections?: number;
  maxMessages?: number;
  rateDelta?: number;
  rateLimit?: number;
}

// Email provider presets
export const EMAIL_PROVIDERS = {
  GMAIL: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    tls: { rejectUnauthorized: false }
  },
  OUTLOOK: {
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    tls: { rejectUnauthorized: false }
  },
  OFFICE365: {
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    tls: { rejectUnauthorized: false }
  },
  YAHOO: {
    host: 'smtp.mail.yahoo.com',
    port: 587,
    secure: false,
    tls: { rejectUnauthorized: false }
  },
  SENDGRID: {
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    tls: { rejectUnauthorized: false }
  },
  MAILGUN: {
    host: 'smtp.mailgun.org',
    port: 587,
    secure: false,
    tls: { rejectUnauthorized: false }
  },
  SES: {
    host: 'email-smtp.us-west-2.amazonaws.com',
    port: 587,
    secure: false,
    tls: { rejectUnauthorized: false }
  }
};

// Get provider-specific configuration
const getProviderConfig = () => {
  const provider = process.env.EMAIL_PROVIDER?.toUpperCase() as keyof typeof EMAIL_PROVIDERS;
  if (provider && EMAIL_PROVIDERS[provider]) {
    return EMAIL_PROVIDERS[provider];
  }
  return EMAIL_PROVIDERS.GMAIL; // Default to Gmail
};

// Default email configuration (can be overridden by environment variables)
const providerConfig = getProviderConfig();
const defaultConfig: EmailConfig = {
  host: process.env.SMTP_HOST || providerConfig.host,
  port: parseInt(process.env.SMTP_PORT || providerConfig.port.toString()),
  secure: process.env.SMTP_SECURE === 'true' || providerConfig.secure || false,
  auth: {
    user: process.env.SMTP_USER || 'your-email@gmail.com',
    pass: process.env.SMTP_PASS || 'your-app-password'
  },
  tls: providerConfig.tls,
  pool: true,
  maxConnections: parseInt(process.env.SMTP_MAX_CONNECTIONS || '5'),
  maxMessages: parseInt(process.env.SMTP_MAX_MESSAGES || '100'),
  rateDelta: parseInt(process.env.SMTP_RATE_DELTA || '1000'),
  rateLimit: parseInt(process.env.SMTP_RATE_LIMIT || '10')
};

// Create transporter with enhanced error handling
export const createEmailTransporter = () => {
  try {
    const transporter = nodemailer.createTransport(defaultConfig);

    // Add event listeners for better monitoring
    transporter.on('idle', () => {
      logger.debug('Email transporter is idle');
    });

    transporter.on('error', (error) => {
      logger.error('Email transporter error:', error);
    });

    // Verify connection configuration with timeout
    const verifyConnection = () => {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection verification timeout'));
        }, 10000); // 10 second timeout

        transporter.verify((error, success) => {
          clearTimeout(timeout);
          if (error) {
            reject(error);
          } else {
            resolve(success);
          }
        });
      });
    };

    // Attempt connection verification
    verifyConnection()
      .then(() => {
        logger.info('📧 Email server is ready to send messages');
        logger.info(`✉️  Using provider: ${process.env.EMAIL_PROVIDER || 'GMAIL'}`);
        logger.info(`📮 From address: ${emailConfig.from.address}`);
      })
      .catch((error) => {
        logger.warn('Email configuration verification failed:');
        logger.warn(`   Provider: ${process.env.EMAIL_PROVIDER || 'GMAIL'}`);
        logger.warn(`   Host: ${defaultConfig.host}:${defaultConfig.port}`);
        logger.warn(`   User: ${defaultConfig.auth.user}`);
        logger.warn(`   Error: ${error.message}`);
        logger.info('📧 Email notifications will run in DEMO mode (console output only)');
      });

    return transporter;
  } catch (error) {
    logger.error('Failed to create email transporter:', error);
    return null;
  }
};

// Test if we should use demo mode (when email is not properly configured)
export const isEmailDemoMode = (): boolean => {
  return !process.env.SMTP_USER ||
         !process.env.SMTP_PASS ||
         process.env.SMTP_USER === 'your-email@gmail.com';
};

// Test email connection
export const testEmailConnection = async (): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> => {
  try {
    const transporter = createEmailTransporter();
    if (!transporter) {
      return {
        success: false,
        message: 'Failed to create email transporter'
      };
    }

    const info = await transporter.verify();
    return {
      success: true,
      message: 'Email connection successful',
      details: {
        provider: process.env.EMAIL_PROVIDER || 'GMAIL',
        host: defaultConfig.host,
        port: defaultConfig.port,
        secure: defaultConfig.secure,
        user: defaultConfig.auth.user
      }
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Email connection failed',
      details: {
        error: error.message,
        code: error.code,
        provider: process.env.EMAIL_PROVIDER || 'GMAIL',
        host: defaultConfig.host,
        port: defaultConfig.port
      }
    };
  }
};

// Send test email
export const sendTestEmail = async (to: string): Promise<{
  success: boolean;
  message: string;
  messageId?: string;
}> => {
  try {
    const transporter = createEmailTransporter();
    if (!transporter) {
      return {
        success: false,
        message: 'Email transporter not available'
      };
    }

    if (isEmailDemoMode()) {
      logger.info('📧 Demo Mode - Would send test email to:', to);
      return {
        success: true,
        message: 'Test email sent successfully (demo mode)',
        messageId: 'demo-' + Date.now()
      };
    }

    const info = await transporter.sendMail({
      from: `"${emailConfig.from.name}" <${emailConfig.from.address}>`,
      to,
      subject: 'LMS - Test Email Connection',
      html: `
        <h2>Test Email Successful!</h2>
        <p>This is a test email from the Leave Management System to verify email configuration.</p>
        <p><strong>Provider:</strong> ${process.env.EMAIL_PROVIDER || 'GMAIL'}</p>
        <p><strong>Host:</strong> ${defaultConfig.host}:${defaultConfig.port}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <hr>
        <p><em>LMS - Leave Management System</em></p>
      `,
      text: `Test Email Successful! This is a test email from the Leave Management System. Provider: ${process.env.EMAIL_PROVIDER || 'GMAIL'}, Host: ${defaultConfig.host}:${defaultConfig.port}, Time: ${new Date().toLocaleString()}`
    });

    return {
      success: true,
      message: 'Test email sent successfully',
      messageId: info.messageId
    };
  } catch (error: any) {
    logger.error('Failed to send test email:', error);
    return {
      success: false,
      message: `Failed to send test email: ${error.message}`
    };
  }
};

// Email sender configuration
export const emailConfig = {
  from: {
    name: process.env.EMAIL_FROM_NAME || 'LMS - Leave Management System',
    address: process.env.EMAIL_FROM_ADDRESS || defaultConfig.auth.user
  },
  baseUrl: process.env.FRONTEND_URL || 'http://localhost:5174',
  companyName: process.env.COMPANY_NAME || 'Your Company Name',
  supportEmail: process.env.SUPPORT_EMAIL || process.env.SMTP_USER || 'support@company.com',
  maxRetries: parseInt(process.env.EMAIL_MAX_RETRIES || '3'),
  retryDelay: parseInt(process.env.EMAIL_RETRY_DELAY || '5000') // 5 seconds
};