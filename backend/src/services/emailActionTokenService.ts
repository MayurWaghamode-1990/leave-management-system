import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface EmailActionTokenPayload {
  leaveRequestId: string;
  approverId: string;
  action: 'APPROVE' | 'REJECT';
  level: number;
  exp: number;
  iat: number;
}

interface EmailActionTokenData {
  leaveRequestId: string;
  approverId: string;
  action: 'APPROVE' | 'REJECT';
  level: number;
  expiresInHours?: number;
}

interface TokenValidationResult {
  valid: boolean;
  payload?: EmailActionTokenPayload;
  error?: string;
  expired?: boolean;
  alreadyProcessed?: boolean;
}

class EmailActionTokenService {
  private readonly SECRET_KEY: string;
  private readonly DEFAULT_EXPIRY_HOURS = 72; // 3 days

  constructor() {
    this.SECRET_KEY = process.env.EMAIL_ACTION_TOKEN_SECRET;
    if (!this.SECRET_KEY) {
      throw new Error('EMAIL_ACTION_TOKEN_SECRET environment variable is required');
    }
  }

  /**
   * Generate a secure token for email-based approve/reject actions
   */
  generateActionToken(data: EmailActionTokenData): string {
    try {
      const expiryHours = data.expiresInHours || this.DEFAULT_EXPIRY_HOURS;
      const payload: Omit<EmailActionTokenPayload, 'exp' | 'iat'> = {
        leaveRequestId: data.leaveRequestId,
        approverId: data.approverId,
        action: data.action,
        level: data.level
      };

      const token = jwt.sign(payload, this.SECRET_KEY, {
        expiresIn: `${expiryHours}h`,
        issuer: 'lms-email-actions',
        subject: 'approval-action'
      });

      logger.info(`📧 Generated ${data.action} token for approver ${data.approverId}, request ${data.leaveRequestId}`);
      return token;
    } catch (error) {
      logger.error('Failed to generate email action token:', error);
      throw new Error('Token generation failed');
    }
  }

  /**
   * Validate and decode an email action token
   */
  async validateActionToken(token: string): Promise<TokenValidationResult> {
    try {
      // Verify and decode the token
      const decoded = jwt.verify(token, this.SECRET_KEY, {
        issuer: 'lms-email-actions',
        subject: 'approval-action'
      }) as EmailActionTokenPayload;

      // Check if the approval has already been processed
      const existingApproval = await prisma.approval.findFirst({
        where: {
          leaveRequestId: decoded.leaveRequestId,
          approverId: decoded.approverId,
          level: decoded.level,
          status: { not: 'PENDING' }
        }
      });

      if (existingApproval) {
        return {
          valid: false,
          alreadyProcessed: true,
          error: 'This approval has already been processed'
        };
      }

      // Check if the leave request still exists and is in a valid state
      const leaveRequest = await prisma.leaveRequest.findUnique({
        where: { id: decoded.leaveRequestId },
        select: { status: true, id: true }
      });

      if (!leaveRequest) {
        return {
          valid: false,
          error: 'Leave request not found'
        };
      }

      if (leaveRequest.status !== 'PENDING') {
        return {
          valid: false,
          error: 'Leave request is no longer pending approval'
        };
      }

      // Check if this is the current approval level
      const currentApproval = await prisma.approval.findFirst({
        where: {
          leaveRequestId: decoded.leaveRequestId,
          level: decoded.level,
          status: 'PENDING'
        }
      });

      if (!currentApproval || currentApproval.approverId !== decoded.approverId) {
        return {
          valid: false,
          error: 'Invalid approval level or approver'
        };
      }

      return {
        valid: true,
        payload: decoded
      };

    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return {
          valid: false,
          expired: true,
          error: 'Token has expired'
        };
      }

      if (error.name === 'JsonWebTokenError') {
        return {
          valid: false,
          error: 'Invalid token'
        };
      }

      logger.error('Token validation error:', error);
      return {
        valid: false,
        error: 'Token validation failed'
      };
    }
  }

  /**
   * Generate both approve and reject URLs for an approval
   */
  generateApprovalUrls(data: EmailActionTokenData): {
    approveUrl: string;
    rejectUrl: string;
    tokenExpiry: Date;
  } {
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3001';
    const expiryHours = data.expiresInHours || this.DEFAULT_EXPIRY_HOURS;

    const approveToken = this.generateActionToken({ ...data, action: 'APPROVE' });
    const rejectToken = this.generateActionToken({ ...data, action: 'REJECT' });

    const approveUrl = `${baseUrl}/api/v1/email-actions/approve?token=${approveToken}`;
    const rejectUrl = `${baseUrl}/api/v1/email-actions/reject?token=${rejectToken}`;
    const tokenExpiry = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

    return {
      approveUrl,
      rejectUrl,
      tokenExpiry
    };
  }

  /**
   * Generate dashboard URL for manual approval
   */
  generateDashboardUrl(leaveRequestId: string): string {
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:5174';
    return `${baseUrl}/approvals?highlight=${leaveRequestId}`;
  }

  /**
   * Log email action for audit trail
   */
  async logEmailAction(
    leaveRequestId: string,
    approverId: string,
    action: 'TOKEN_GENERATED' | 'TOKEN_USED' | 'TOKEN_EXPIRED',
    details?: string
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: approverId,
          action: `EMAIL_${action}`,
          entity: 'EMAIL_ACTION',
          resourceType: 'LEAVE_REQUEST',
          resourceId: leaveRequestId,
          details: details || `Email action: ${action}`,
          ipAddress: 'email-system',
          userAgent: 'email-action-service'
        }
      });
    } catch (error) {
      logger.error('Failed to log email action:', error);
      // Don't throw - logging failure shouldn't break the main flow
    }
  }

  /**
   * Get token information without validating (for debugging)
   */
  decodeTokenInfo(token: string): any {
    try {
      return jwt.decode(token, { complete: true });
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if a token is expired without full validation
   */
  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) return true;
      return Date.now() >= decoded.exp * 1000;
    } catch {
      return true;
    }
  }

  /**
   * Generate a confirmation page URL after action
   */
  generateConfirmationUrl(action: 'APPROVE' | 'REJECT', success: boolean, message?: string): string {
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:5174';
    const params = new URLSearchParams({
      action: action.toLowerCase(),
      success: success.toString(),
      ...(message && { message })
    });
    return `${baseUrl}/email-action-result?${params.toString()}`;
  }
}

export const emailActionTokenService = new EmailActionTokenService();
export type { EmailActionTokenData, TokenValidationResult, EmailActionTokenPayload };