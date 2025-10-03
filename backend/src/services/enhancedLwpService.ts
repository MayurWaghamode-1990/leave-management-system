import { PrismaClient } from '@prisma/client';
import { multiLevelApprovalService } from './multiLevelApprovalService';
import { emailService } from './emailService';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// GLF-specific LWP types and categories
export interface GLFLWPApplicationData {
  employeeId: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  lwpType: 'MEDICAL' | 'PERSONAL' | 'STUDY' | 'EMERGENCY' | 'EXTENDED_PERSONAL' | 'SABBATICAL';
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  businessJustification: string;
  expectedReturnDate?: Date;
  contactDuringLeave: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalCertificate?: string; // For medical LWP
  studyDocuments?: string[]; // For study LWP
  financialImpactAcknowledged: boolean;
  handoverDetails: string;
  replacementArrangements?: string;
  attachments?: string[];
}

export interface LWPPolicyRules {
  category: string;
  minServiceMonthsRequired: number;
  maxDurationDays: number;
  requiresMedicalCertificate: boolean;
  requiresStudyDocuments: boolean;
  advanceNoticeDays: number;
  approvalLevels: number;
  allowMultiplePerYear: boolean;
  salaryDeduction: 'FULL' | 'PARTIAL' | 'NONE';
  benefitsContinuation: boolean;
}

export interface LWPValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  recommendedActions: string[];
}

export interface LWPImpactAnalysis {
  salaryImpact: {
    totalDeduction: number;
    monthlyDeduction: number;
    benefitsAffected: string[];
  };
  workImpact: {
    projectsAffected: string[];
    handoverRequired: boolean;
    replacementNeeded: boolean;
  };
  compliance: {
    policyViolations: string[];
    documentationRequired: string[];
  };
}

export class EnhancedLWPService {

  // GLF LWP Policy Configuration
  private readonly lwpPolicies: LWPPolicyRules[] = [
    {
      category: 'MEDICAL',
      minServiceMonthsRequired: 6,
      maxDurationDays: 365,
      requiresMedicalCertificate: true,
      requiresStudyDocuments: false,
      advanceNoticeDays: 7, // Can be emergency
      approvalLevels: 3, // Manager -> HR -> Medical Review
      allowMultiplePerYear: true,
      salaryDeduction: 'FULL',
      benefitsContinuation: true
    },
    {
      category: 'PERSONAL',
      minServiceMonthsRequired: 12,
      maxDurationDays: 90,
      requiresMedicalCertificate: false,
      requiresStudyDocuments: false,
      advanceNoticeDays: 30,
      approvalLevels: 2, // Manager -> HR
      allowMultiplePerYear: false,
      salaryDeduction: 'FULL',
      benefitsContinuation: false
    },
    {
      category: 'STUDY',
      minServiceMonthsRequired: 24,
      maxDurationDays: 730, // 2 years max
      requiresMedicalCertificate: false,
      requiresStudyDocuments: true,
      advanceNoticeDays: 60,
      approvalLevels: 4, // Manager -> HR -> Department Head -> CEO
      allowMultiplePerYear: false,
      salaryDeduction: 'PARTIAL', // Company may support education
      benefitsContinuation: true
    },
    {
      category: 'EMERGENCY',
      minServiceMonthsRequired: 3,
      maxDurationDays: 30,
      requiresMedicalCertificate: false,
      requiresStudyDocuments: false,
      advanceNoticeDays: 0, // Emergency
      approvalLevels: 2, // Manager -> HR
      allowMultiplePerYear: true,
      salaryDeduction: 'FULL',
      benefitsContinuation: true
    },
    {
      category: 'EXTENDED_PERSONAL',
      minServiceMonthsRequired: 36,
      maxDurationDays: 180,
      requiresMedicalCertificate: false,
      requiresStudyDocuments: false,
      advanceNoticeDays: 90,
      approvalLevels: 3, // Manager -> HR -> Department Head
      allowMultiplePerYear: false,
      salaryDeduction: 'FULL',
      benefitsContinuation: false
    },
    {
      category: 'SABBATICAL',
      minServiceMonthsRequired: 60, // 5 years
      maxDurationDays: 365,
      requiresMedicalCertificate: false,
      requiresStudyDocuments: false,
      advanceNoticeDays: 120, // 4 months
      approvalLevels: 4, // Manager -> HR -> Department Head -> CEO
      allowMultiplePerYear: false,
      salaryDeduction: 'PARTIAL', // Company may provide sabbatical pay
      benefitsContinuation: true
    }
  ];

  /**
   * Enhanced LWP Application with GLF Compliance
   */
  async applyForLWP(data: GLFLWPApplicationData): Promise<{
    success: boolean;
    leaveRequestId?: string;
    validationResult: LWPValidationResult;
    impactAnalysis: LWPImpactAnalysis;
    message: string;
  }> {
    try {
      logger.info('Processing enhanced LWP application:', {
        employeeId: data.employeeId,
        lwpType: data.lwpType,
        startDate: data.startDate,
        endDate: data.endDate
      });

      // Step 1: Comprehensive validation
      const validationResult = await this.validateLWPApplication(data);
      if (!validationResult.valid) {
        return {
          success: false,
          validationResult,
          impactAnalysis: await this.analyzeLWPImpact(data),
          message: 'LWP application validation failed'
        };
      }

      // Step 2: Impact analysis
      const impactAnalysis = await this.analyzeLWPImpact(data);

      // Step 3: Create leave request with enhanced data
      const totalDays = this.calculateCalendarDays(data.startDate, data.endDate);

      const leaveRequest = await prisma.leaveRequest.create({
        data: {
          employeeId: data.employeeId,
          leaveType: 'LEAVE_WITHOUT_PAY',
          startDate: data.startDate,
          endDate: data.endDate,
          totalDays,
          isHalfDay: false,
          reason: data.reason,
          attachments: data.attachments ? JSON.stringify(data.attachments) : null,
          status: 'PENDING'
        }
      });

      // Step 4: Store enhanced LWP metadata
      await this.storeLWPMetadata(leaveRequest.id, data, impactAnalysis);

      // Step 5: Create multi-level approval workflow
      await this.createEnhancedApprovalWorkflow(leaveRequest.id, data);

      // Step 6: Send notifications
      await this.sendLWPNotifications(leaveRequest.id, data, 'APPLIED');

      logger.info('Enhanced LWP application created successfully:', {
        leaveRequestId: leaveRequest.id,
        lwpType: data.lwpType
      });

      return {
        success: true,
        leaveRequestId: leaveRequest.id,
        validationResult,
        impactAnalysis,
        message: 'LWP application submitted successfully'
      };

    } catch (error) {
      logger.error('Error processing enhanced LWP application:', error);
      throw error;
    }
  }

  /**
   * Comprehensive LWP validation with GLF rules
   */
  private async validateLWPApplication(data: GLFLWPApplicationData): Promise<LWPValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendedActions: string[] = [];

    try {
      // Get employee details
      const employee = await prisma.user.findUnique({
        where: { id: data.employeeId },
        select: {
          joiningDate: true,
          status: true,
          firstName: true,
          lastName: true,
          department: true
        }
      });

      if (!employee) {
        errors.push('Employee not found');
        return { valid: false, errors, warnings, recommendedActions };
      }

      if (employee.status !== 'ACTIVE') {
        errors.push('Only active employees can apply for LWP');
        return { valid: false, errors, warnings, recommendedActions };
      }

      // Get LWP policy for this type
      const policy = this.lwpPolicies.find(p => p.category === data.lwpType);
      if (!policy) {
        errors.push(`Invalid LWP type: ${data.lwpType}`);
        return { valid: false, errors, warnings, recommendedActions };
      }

      // Validate service duration
      const serviceMonths = this.calculateServiceMonths(employee.joiningDate);
      if (serviceMonths < policy.minServiceMonthsRequired) {
        errors.push(`Minimum ${policy.minServiceMonthsRequired} months of service required for ${data.lwpType} LWP`);
      }

      // Validate duration
      const totalDays = this.calculateCalendarDays(data.startDate, data.endDate);
      if (totalDays > policy.maxDurationDays) {
        errors.push(`Maximum ${policy.maxDurationDays} days allowed for ${data.lwpType} LWP`);
      }

      // Validate advance notice
      const advanceNoticeDays = Math.ceil((data.startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (advanceNoticeDays < policy.advanceNoticeDays && data.urgencyLevel !== 'CRITICAL') {
        errors.push(`Minimum ${policy.advanceNoticeDays} days advance notice required for ${data.lwpType} LWP`);
      }

      // Check for existing LWP applications
      if (!policy.allowMultiplePerYear) {
        const currentYear = new Date().getFullYear();
        const existingLWP = await prisma.leaveRequest.findFirst({
          where: {
            employeeId: data.employeeId,
            leaveType: 'LEAVE_WITHOUT_PAY',
            startDate: {
              gte: new Date(currentYear, 0, 1),
              lt: new Date(currentYear + 1, 0, 1)
            },
            status: { in: ['APPROVED', 'PENDING'] }
          }
        });

        if (existingLWP) {
          errors.push(`Only one ${data.lwpType} LWP allowed per year`);
        }
      }

      // Validate required documents
      if (policy.requiresMedicalCertificate && !data.medicalCertificate) {
        errors.push('Medical certificate required for medical LWP');
      }

      if (policy.requiresStudyDocuments && (!data.studyDocuments || data.studyDocuments.length === 0)) {
        errors.push('Study documents required for study LWP');
      }

      // Check overlapping leaves
      const overlappingLeaves = await prisma.leaveRequest.findMany({
        where: {
          employeeId: data.employeeId,
          status: { in: ['APPROVED', 'PENDING'] },
          OR: [
            {
              startDate: { lte: data.endDate },
              endDate: { gte: data.startDate }
            }
          ]
        }
      });

      if (overlappingLeaves.length > 0) {
        errors.push('LWP dates overlap with existing leave requests');
      }

      // Generate warnings and recommendations
      if (totalDays > 30) {
        warnings.push('Long-term LWP may affect career progression and benefits');
        recommendedActions.push('Consider discussing alternatives with HR before proceeding');
      }

      if (data.lwpType === 'STUDY' && totalDays > 365) {
        warnings.push('Extended study leave may require service commitment upon return');
        recommendedActions.push('Review study leave policy and commitment requirements');
      }

      if (!data.financialImpactAcknowledged) {
        errors.push('Financial impact acknowledgment is required');
      }

      if (!data.handoverDetails.trim()) {
        errors.push('Detailed handover plan is required');
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        recommendedActions
      };

    } catch (error) {
      logger.error('Error validating LWP application:', error);
      return {
        valid: false,
        errors: ['System error during validation'],
        warnings,
        recommendedActions
      };
    }
  }

  /**
   * Analyze impact of LWP on salary, work, and compliance
   */
  private async analyzeLWPImpact(data: GLFLWPApplicationData): Promise<LWPImpactAnalysis> {
    try {
      const policy = this.lwpPolicies.find(p => p.category === data.lwpType);
      const totalDays = this.calculateCalendarDays(data.startDate, data.endDate);

      // Salary impact calculation (simplified - in real scenario would integrate with payroll)
      const monthlySalary = 50000; // This should come from employee data
      const workingDaysPerMonth = 22;
      const dailySalary = monthlySalary / workingDaysPerMonth;

      let totalDeduction = 0;
      let monthlyDeduction = 0;

      if (policy?.salaryDeduction === 'FULL') {
        totalDeduction = dailySalary * totalDays;
        monthlyDeduction = totalDeduction / Math.ceil(totalDays / 30);
      } else if (policy?.salaryDeduction === 'PARTIAL') {
        totalDeduction = dailySalary * totalDays * 0.5; // 50% deduction
        monthlyDeduction = totalDeduction / Math.ceil(totalDays / 30);
      }

      const benefitsAffected: string[] = [];
      if (!policy?.benefitsContinuation) {
        benefitsAffected.push('Health Insurance Premium');
        benefitsAffected.push('Performance Bonus');
        benefitsAffected.push('Variable Pay');
      }

      return {
        salaryImpact: {
          totalDeduction,
          monthlyDeduction,
          benefitsAffected
        },
        workImpact: {
          projectsAffected: ['To be determined during handover'],
          handoverRequired: true,
          replacementNeeded: totalDays > 30
        },
        compliance: {
          policyViolations: [],
          documentationRequired: this.getRequiredDocuments(data.lwpType)
        }
      };

    } catch (error) {
      logger.error('Error analyzing LWP impact:', error);
      throw error;
    }
  }

  /**
   * Store enhanced LWP metadata
   */
  private async storeLWPMetadata(
    leaveRequestId: string,
    data: GLFLWPApplicationData,
    impact: LWPImpactAnalysis
  ): Promise<void> {
    try {
      const metadata = {
        lwpType: data.lwpType,
        urgencyLevel: data.urgencyLevel,
        businessJustification: data.businessJustification,
        expectedReturnDate: data.expectedReturnDate?.toISOString(),
        contactDuringLeave: data.contactDuringLeave,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        handoverDetails: data.handoverDetails,
        replacementArrangements: data.replacementArrangements,
        financialImpactAcknowledged: data.financialImpactAcknowledged,
        impactAnalysis: impact,
        applicationTimestamp: new Date().toISOString()
      };

      await prisma.auditLog.create({
        data: {
          userId: data.employeeId,
          entity: 'ENHANCED_LWP',
          entityId: leaveRequestId,
          action: 'LWP_APPLICATION_SUBMITTED',
          newValues: JSON.stringify(metadata),
          ipAddress: 'system',
          userAgent: 'enhanced-lwp-service'
        }
      });

    } catch (error) {
      logger.error('Error storing LWP metadata:', error);
      throw error;
    }
  }

  /**
   * Create enhanced approval workflow based on LWP type
   */
  private async createEnhancedApprovalWorkflow(
    leaveRequestId: string,
    data: GLFLWPApplicationData
  ): Promise<void> {
    try {
      const policy = this.lwpPolicies.find(p => p.category === data.lwpType);
      if (!policy) return;

      // For now, use the existing multi-level approval service
      // This could be enhanced to support different approval levels based on LWP type
      const employee = await prisma.user.findUnique({
        where: { id: data.employeeId },
        select: { id: true, firstName: true, lastName: true }
      });

      if (employee) {
        const approvalChain = await multiLevelApprovalService.buildApprovalChain(
          leaveRequestId,
          data.employeeId,
          'LEAVE_WITHOUT_PAY' // Custom approval chain for LWP
        );

        await multiLevelApprovalService.createApprovalRecords(approvalChain);
      }

    } catch (error) {
      logger.error('Error creating enhanced approval workflow:', error);
      throw error;
    }
  }

  /**
   * Send enhanced LWP notifications
   */
  private async sendLWPNotifications(
    leaveRequestId: string,
    data: GLFLWPApplicationData,
    action: 'APPLIED' | 'APPROVED' | 'REJECTED'
  ): Promise<void> {
    try {
      // Create high-priority notification for employee
      await prisma.notification.create({
        data: {
          userId: data.employeeId,
          type: 'LWP_APPLICATION',
          title: `Enhanced LWP Application ${action}`,
          message: `Your ${data.lwpType} Leave Without Pay application has been ${action.toLowerCase()}`,
          metadata: JSON.stringify({
            leaveRequestId,
            lwpType: data.lwpType,
            urgency: 'HIGH'
          })
        }
      });

      // Notify HR about LWP application (all LWP requires HR attention)
      const hrAdmins = await prisma.user.findMany({
        where: { role: 'HR_ADMIN', status: 'ACTIVE' },
        select: { id: true }
      });

      for (const hr of hrAdmins) {
        await prisma.notification.create({
          data: {
            userId: hr.id,
            type: 'LWP_HR_NOTIFICATION',
            title: `Enhanced LWP Application - ${data.lwpType}`,
            message: `New ${data.lwpType} LWP application requiring review and impact assessment`,
            metadata: JSON.stringify({
              leaveRequestId,
              employeeId: data.employeeId,
              lwpType: data.lwpType,
              urgency: 'HIGH'
            })
          }
        });
      }

    } catch (error) {
      logger.error('Error sending LWP notifications:', error);
      // Don't throw - notification failure shouldn't break the application process
    }
  }

  /**
   * Get LWP policy for a specific type
   */
  getLWPPolicy(lwpType: string): LWPPolicyRules | null {
    return this.lwpPolicies.find(p => p.category === lwpType) || null;
  }

  /**
   * Get all available LWP types and policies
   */
  getAllLWPPolicies(): LWPPolicyRules[] {
    return this.lwpPolicies;
  }

  /**
   * Get enhanced LWP details with full metadata
   */
  async getEnhancedLWPDetails(leaveRequestId: string): Promise<any> {
    try {
      const leaveRequest = await prisma.leaveRequest.findUnique({
        where: { id: leaveRequestId },
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true,
              employeeId: true,
              department: true,
              email: true
            }
          },
          approvals: {
            include: {
              approver: {
                select: {
                  firstName: true,
                  lastName: true,
                  role: true
                }
              }
            },
            orderBy: { level: 'asc' }
          }
        }
      });

      if (!leaveRequest || leaveRequest.leaveType !== 'LEAVE_WITHOUT_PAY') {
        throw new Error('Enhanced LWP request not found');
      }

      // Get metadata from audit log
      const metadata = await prisma.auditLog.findFirst({
        where: {
          entity: 'ENHANCED_LWP',
          entityId: leaveRequestId,
          action: 'LWP_APPLICATION_SUBMITTED'
        }
      });

      return {
        ...leaveRequest,
        enhancedMetadata: metadata ? JSON.parse(metadata.newValues || '{}') : {},
        approvalProgress: this.calculateApprovalProgress(leaveRequest.approvals)
      };

    } catch (error) {
      logger.error('Error getting enhanced LWP details:', error);
      throw error;
    }
  }

  // Helper methods
  private calculateServiceMonths(joiningDate: Date): number {
    const now = new Date();
    const monthsDiff = (now.getFullYear() - joiningDate.getFullYear()) * 12 +
                      (now.getMonth() - joiningDate.getMonth());
    return monthsDiff;
  }

  private calculateCalendarDays(startDate: Date, endDate: Date): number {
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  private getRequiredDocuments(lwpType: string): string[] {
    const policy = this.lwpPolicies.find(p => p.category === lwpType);
    const documents: string[] = ['Handover Document', 'Contact Information'];

    if (policy?.requiresMedicalCertificate) {
      documents.push('Medical Certificate');
    }
    if (policy?.requiresStudyDocuments) {
      documents.push('Study Documents', 'Course Details', 'Institution Letter');
    }

    return documents;
  }

  private calculateApprovalProgress(approvals: any[]): {
    completed: number;
    total: number;
    percentage: number;
    currentLevel: number;
  } {
    const total = approvals.length;
    const completed = approvals.filter(a => a.status !== 'PENDING').length;
    const currentLevel = approvals.find(a => a.status === 'PENDING')?.level || total + 1;

    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      currentLevel
    };
  }
}

export const enhancedLwpService = new EnhancedLWPService();
export type { GLFLWPApplicationData, LWPPolicyRules, LWPValidationResult, LWPImpactAnalysis };