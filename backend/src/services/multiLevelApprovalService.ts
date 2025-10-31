import { PrismaClient } from '@prisma/client'
import { emailService, ApprovalEmailData } from './emailService'
import { calendarIntegrationService } from './calendarIntegrationService'
import { logger } from '../utils/logger'

const prisma = new PrismaClient()

interface ApprovalLevel {
  level: number
  approverId: string
  approverName: string
  approverRole: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  comments?: string
  approvedAt?: Date
}

interface ApprovalChain {
  leaveRequestId: string
  leaveType: string
  employeeId: string
  employeeName: string
  levels: ApprovalLevel[]
  currentLevel: number
  overallStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: Date
}

interface ApprovalWorkflowConfig {
  leaveType: string
  requiredLevels: {
    level: number
    roleRequirement: string
    description: string
  }[]
}

export class MultiLevelApprovalService {

  // GLF-specific approval workflow configurations
  private readonly approvalConfigs: ApprovalWorkflowConfig[] = [
    {
      leaveType: 'COMPENSATORY_OFF',
      requiredLevels: [
        {
          level: 1,
          roleRequirement: 'L1_MANAGER',
          description: 'Level 1 Manager (Direct Reporting Manager)'
        },
        {
          level: 2,
          roleRequirement: 'L2_MANAGER',
          description: 'Level 2 Manager (Senior Manager)'
        },
        {
          level: 3,
          roleRequirement: 'HR_ADMIN',
          description: 'HR Administrator'
        }
      ]
    },
    {
      leaveType: 'DEFAULT',
      requiredLevels: [
        {
          level: 1,
          roleRequirement: 'L1_MANAGER',
          description: 'Direct Reporting Manager'
        },
        {
          level: 2,
          roleRequirement: 'HR_ADMIN',
          description: 'HR Administrator'
        }
      ]
    }
  ]

  // Get approval workflow configuration for a leave type
  private getApprovalConfig(leaveType: string): ApprovalWorkflowConfig {
    return this.approvalConfigs.find(config => config.leaveType === leaveType)
           || this.approvalConfigs.find(config => config.leaveType === 'DEFAULT')!
  }

  // Build approval chain for a leave request
  async buildApprovalChain(leaveRequestId: string, employeeId: string, leaveType: string): Promise<ApprovalChain> {
    // Get employee details
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        reportingManagerId: true,
        department: true
      }
    })

    if (!employee) {
      throw new Error(`Employee not found: ${employeeId}`)
    }

    const config = this.getApprovalConfig(leaveType)
    const levels: ApprovalLevel[] = []

    // Level 1: Direct Reporting Manager (L1)
    if (employee.reportingManagerId) {
      const l1Manager = await prisma.user.findUnique({
        where: { id: employee.reportingManagerId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          reportingManagerId: true
        }
      })

      if (l1Manager) {
        levels.push({
          level: 1,
          approverId: l1Manager.id,
          approverName: `${l1Manager.firstName} ${l1Manager.lastName}`,
          approverRole: l1Manager.role,
          status: 'PENDING'
        })

        // Level 2: L1 Manager's Manager (L2) - for Comp Off only
        if (leaveType === 'COMPENSATORY_OFF' && l1Manager.reportingManagerId) {
          const l2Manager = await prisma.user.findUnique({
            where: { id: l1Manager.reportingManagerId },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true
            }
          })

          if (l2Manager) {
            levels.push({
              level: 2,
              approverId: l2Manager.id,
              approverName: `${l2Manager.firstName} ${l2Manager.lastName}`,
              approverRole: l2Manager.role,
              status: 'PENDING'
            })
          }
        }
      }
    }

    // Final Level: HR Admin
    const hrAdmin = await prisma.user.findFirst({
      where: {
        role: 'HR_ADMIN',
        status: 'ACTIVE'
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true
      }
    })

    if (hrAdmin) {
      const hrLevel = leaveType === 'COMPENSATORY_OFF' ? 3 : 2
      levels.push({
        level: hrLevel,
        approverId: hrAdmin.id,
        approverName: `${hrAdmin.firstName} ${hrAdmin.lastName}`,
        approverRole: hrAdmin.role,
        status: 'PENDING'
      })
    }

    return {
      leaveRequestId,
      leaveType,
      employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      levels,
      currentLevel: 1,
      overallStatus: 'PENDING',
      createdAt: new Date()
    }
  }

  // Create approval records in database
  async createApprovalRecords(approvalChain: ApprovalChain): Promise<void> {
    for (const level of approvalChain.levels) {
      await prisma.approval.create({
        data: {
          leaveRequestId: approvalChain.leaveRequestId,
          approverId: level.approverId,
          level: level.level,
          status: level.status,
          comments: level.comments
        }
      })
    }

    // Send email notification to the first approver
    await this.sendApprovalNotification(approvalChain, 1)
  }

  // Send email notification to approver
  private async sendApprovalNotification(approvalChain: ApprovalChain, level: number): Promise<void> {
    try {
      const currentLevel = approvalChain.levels.find(l => l.level === level)
      if (!currentLevel) {
        logger.warn(`No approver found for level ${level}`)
        return
      }

      // Get detailed information for email
      const leaveRequest = await prisma.leaveRequest.findUnique({
        where: { id: approvalChain.leaveRequestId },
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              employeeId: true,
              department: true
            }
          }
        }
      })

      const approver = await prisma.user.findUnique({
        where: { id: currentLevel.approverId },
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      })

      if (!leaveRequest || !approver) {
        logger.error('Missing leave request or approver data for email notification')
        return
      }

      // Get previous approvals for context
      const previousApprovals = await prisma.approval.findMany({
        where: {
          leaveRequestId: approvalChain.leaveRequestId,
          level: { lt: level },
          status: 'APPROVED'
        },
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
      })

      // Prepare email data
      const emailData: ApprovalEmailData = {
        employeeName: `${leaveRequest.employee.firstName} ${leaveRequest.employee.lastName}`,
        employeeEmail: leaveRequest.employee.email,
        employeeId: leaveRequest.employee.employeeId,
        department: leaveRequest.employee.department || 'Not specified',
        approverName: `${approver.firstName} ${approver.lastName}`,
        approverEmail: approver.email,
        approverId: currentLevel.approverId,
        leaveType: leaveRequest.leaveType,
        startDate: leaveRequest.startDate.toISOString().split('T')[0],
        endDate: leaveRequest.endDate.toISOString().split('T')[0],
        totalDays: leaveRequest.totalDays,
        reason: leaveRequest.reason,
        appliedDate: leaveRequest.appliedDate.toISOString().split('T')[0],
        leaveRequestId: approvalChain.leaveRequestId,
        currentLevel: level,
        totalLevels: approvalChain.levels.length,
        isCompOffRequest: leaveRequest.leaveType === 'COMPENSATORY_OFF',
        previousApprovals: previousApprovals.map(approval => ({
          level: approval.level,
          approverName: `${approval.approver.firstName} ${approval.approver.lastName}`,
          approverRole: approval.approver.role,
          comments: approval.comments || undefined,
          approvedAt: approval.approvedAt!
        }))
      }

      // Send the approval email
      const emailSent = await emailService.sendApprovalRequestEmail(emailData)

      if (emailSent) {
        logger.info(`📧 Approval notification sent to ${approver.email} for level ${level}`)
      } else {
        logger.error(`❌ Failed to send approval notification to ${approver.email} for level ${level}`)
      }

    } catch (error) {
      logger.error('Failed to send approval notification:', error)
      // Don't throw - email failure shouldn't break the approval process
    }
  }

  // Process approval for a specific level
  async processApproval(
    leaveRequestId: string,
    approverId: string,
    action: 'APPROVE' | 'REJECT',
    comments?: string
  ): Promise<{ success: boolean; nextLevel?: number; completed: boolean; message: string }> {

    // Get current approval record
    const currentApproval = await prisma.approval.findFirst({
      where: {
        leaveRequestId,
        approverId,
        status: 'PENDING'
      }
    })

    if (!currentApproval) {
      throw new Error('Approval record not found or already processed')
    }

    // Update current approval
    const updatedApproval = await prisma.approval.update({
      where: { id: currentApproval.id },
      data: {
        status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        comments,
        approvedAt: new Date()
      }
    })

    // If rejected, reject the entire leave request
    if (action === 'REJECT') {
      await prisma.leaveRequest.update({
        where: { id: leaveRequestId },
        data: { status: 'REJECTED' }
      })

      return {
        success: true,
        completed: true,
        message: `Leave request rejected at Level ${currentApproval.level}`
      }
    }

    // If approved, check if this is the final level
    const allApprovals = await prisma.approval.findMany({
      where: { leaveRequestId },
      orderBy: { level: 'asc' }
    })

    const nextPendingApproval = allApprovals.find(approval => approval.status === 'PENDING')

    if (!nextPendingApproval) {
      // All levels approved - approve the leave request
      await prisma.leaveRequest.update({
        where: { id: leaveRequestId },
        data: { status: 'APPROVED' }
      })

      // Sync approved leave to connected calendars
      try {
        await calendarIntegrationService.syncLeaveWithCalendar(leaveRequestId, 'create')
        logger.info(`📅 Leave synced to calendar for request ${leaveRequestId}`)
      } catch (error) {
        logger.error(`❌ Failed to sync leave to calendar:`, error)
        // Don't block approval if calendar sync fails
      }

      return {
        success: true,
        completed: true,
        message: 'Leave request fully approved - all levels completed'
      }
    }

    // Send email notification to the next approver
    const approvalChain = await this.getApprovalChainForNotification(leaveRequestId)
    if (approvalChain) {
      await this.sendApprovalNotification(approvalChain, nextPendingApproval.level)
    }

    return {
      success: true,
      nextLevel: nextPendingApproval.level,
      completed: false,
      message: `Level ${currentApproval.level} approved. Pending approval at Level ${nextPendingApproval.level}`
    }
  }

  // Helper method to get approval chain for notifications
  private async getApprovalChainForNotification(leaveRequestId: string): Promise<ApprovalChain | null> {
    try {
      const leaveRequest = await prisma.leaveRequest.findUnique({
        where: { id: leaveRequestId },
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true,
              id: true
            }
          }
        }
      })

      if (!leaveRequest) return null

      const approvals = await prisma.approval.findMany({
        where: { leaveRequestId },
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
      })

      const levels: ApprovalLevel[] = approvals.map(approval => ({
        level: approval.level,
        approverId: approval.approverId,
        approverName: `${approval.approver.firstName} ${approval.approver.lastName}`,
        approverRole: approval.approver.role,
        status: approval.status as 'PENDING' | 'APPROVED' | 'REJECTED',
        comments: approval.comments || undefined,
        approvedAt: approval.approvedAt || undefined
      }))

      return {
        leaveRequestId,
        leaveType: leaveRequest.leaveType,
        employeeId: leaveRequest.employeeId,
        employeeName: `${leaveRequest.employee.firstName} ${leaveRequest.employee.lastName}`,
        levels,
        currentLevel: levels.find(l => l.status === 'PENDING')?.level || levels.length + 1,
        overallStatus: leaveRequest.status as 'PENDING' | 'APPROVED' | 'REJECTED',
        createdAt: leaveRequest.appliedDate
      }

    } catch (error) {
      logger.error('Failed to get approval chain for notification:', error)
      return null
    }
  }

  // Get approval status for a leave request
  async getApprovalStatus(leaveRequestId: string): Promise<{
    leaveRequest: any
    approvalChain: ApprovalLevel[]
    currentLevel: number
    overallStatus: string
  }> {
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: leaveRequestId },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true
          }
        }
      }
    })

    if (!leaveRequest) {
      throw new Error('Leave request not found')
    }

    const approvals = await prisma.approval.findMany({
      where: { leaveRequestId },
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
    })

    const approvalChain: ApprovalLevel[] = approvals.map(approval => ({
      level: approval.level,
      approverId: approval.approverId,
      approverName: `${approval.approver.firstName} ${approval.approver.lastName}`,
      approverRole: approval.approver.role,
      status: approval.status as 'PENDING' | 'APPROVED' | 'REJECTED',
      comments: approval.comments || undefined,
      approvedAt: approval.approvedAt || undefined
    }))

    const currentLevel = approvals.find(a => a.status === 'PENDING')?.level || approvals.length + 1

    return {
      leaveRequest,
      approvalChain,
      currentLevel,
      overallStatus: leaveRequest.status
    }
  }

  // Get pending approvals for a specific approver
  async getPendingApprovalsForUser(approverId: string): Promise<any[]> {
    const pendingApprovals = await prisma.approval.findMany({
      where: {
        approverId,
        status: 'PENDING'
      },
      include: {
        leaveRequest: {
          include: {
            employee: {
              select: {
                firstName: true,
                lastName: true,
                employeeId: true,
                department: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return pendingApprovals.map(approval => ({
      approvalId: approval.id,
      leaveRequestId: approval.leaveRequestId,
      level: approval.level,
      employee: approval.leaveRequest.employee,
      leaveType: approval.leaveRequest.leaveType,
      startDate: approval.leaveRequest.startDate,
      endDate: approval.leaveRequest.endDate,
      totalDays: approval.leaveRequest.totalDays,
      reason: approval.leaveRequest.reason,
      appliedDate: approval.leaveRequest.appliedDate,
      isCompOffRequest: approval.leaveRequest.leaveType === 'COMPENSATORY_OFF'
    }))
  }

  // Get approval workflow summary for different leave types
  getApprovalWorkflowSummary(): any {
    return {
      workflowTypes: {
        'COMPENSATORY_OFF': {
          description: 'Multi-level approval for Comp Off (GLF requirement)',
          levels: [
            'Level 1: Direct Reporting Manager (L1)',
            'Level 2: Senior Manager (L2)',
            'Level 3: HR Administrator'
          ],
          totalLevels: 3
        },
        'DEFAULT': {
          description: 'Standard two-level approval for other leave types',
          levels: [
            'Level 1: Direct Reporting Manager',
            'Level 2: HR Administrator'
          ],
          totalLevels: 2
        }
      },
      features: [
        'Sequential approval (cannot skip levels)',
        'Rejection at any level rejects entire request',
        'Automatic progression to next level on approval',
        'Email notifications to approvers',
        'Audit trail for all approval actions'
      ]
    }
  }
}

export const multiLevelApprovalService = new MultiLevelApprovalService()