import express, { Request, Response } from 'express';
import { prisma } from '../config/database';
import { LeavePolicyService } from '../services/leavePolicyService';
import { compOffService } from '../services/compOffService';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authorize, AuthenticatedRequest } from '../middleware/auth';
import { LeaveType, Region } from '@prisma/client';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * @swagger
 * /policies:
 *   get:
 *     tags:
 *       - Policies
 *     summary: Get active leave policies
 *     description: Retrieve all active leave policies with optional location filtering
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter policies by location
 *         example: "Bengaluru"
 *     responses:
 *       200:
 *         description: Active policies retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LeavePolicy'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

// Get active policies
router.get('/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { location, leaveType, region, isActive } = req.query;

    const filters = {
      ...(leaveType && { leaveType: leaveType as LeaveType }),
      ...(region && { region: region as Region }),
      ...(location && { location: location as string }),
      ...(isActive !== undefined ? { isActive: isActive === 'true' } : { isActive: true }),
    };

    const policies = await LeavePolicyService.getAllPolicies(filters);

    res.json({
      success: true,
      message: 'Leave policies retrieved successfully',
      data: policies
    });
  })
);

/**
 * @swagger
 * /policies:
 *   post:
 *     tags:
 *       - Policies
 *     summary: Create new leave policy
 *     description: Create a new leave policy with specified rules and entitlements (HR Admin only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - leaveType
 *               - entitlementDays
 *               - location
 *               - region
 *               - effectiveFrom
 *             properties:
 *               name:
 *                 type: string
 *                 example: "India Casual Leave Policy"
 *                 description: "Human-readable name for the policy"
 *               leaveType:
 *                 type: string
 *                 enum: [SICK_LEAVE, CASUAL_LEAVE, EARNED_LEAVE, MATERNITY_LEAVE, PATERNITY_LEAVE, COMPENSATORY_OFF, BEREAVEMENT_LEAVE, MARRIAGE_LEAVE]
 *                 example: "CASUAL_LEAVE"
 *               entitlementDays:
 *                 type: number
 *                 format: decimal
 *                 example: 12.0
 *                 description: "Total annual entitlement in days"
 *               accrualRate:
 *                 type: number
 *                 format: decimal
 *                 example: 1.0
 *                 description: "Monthly accrual rate"
 *               maxCarryForward:
 *                 type: number
 *                 format: decimal
 *                 example: 5.0
 *                 description: "Maximum days that can be carried forward"
 *               maxConsecutiveDays:
 *                 type: integer
 *                 example: 3
 *                 description: "Maximum consecutive days allowed"
 *               requiresDocumentation:
 *                 type: boolean
 *                 example: false
 *               documentationThreshold:
 *                 type: integer
 *                 example: 0
 *                 description: "Minimum days requiring documentation"
 *               location:
 *                 type: string
 *                 example: "Bengaluru"
 *               region:
 *                 type: string
 *                 enum: [INDIA, USA]
 *                 example: "INDIA"
 *               effectiveFrom:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-01T00:00:00Z"
 *               effectiveTo:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 example: null
 *     responses:
 *       201:
 *         description: Policy created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Policy created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/LeavePolicy'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

// Create/Update policy (HR Admin only)
router.post('/',
  authorize('HR_ADMIN', 'HR'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const policyData = req.body;
    
    const policy = await prisma.leavePolicy.create({
      data: {
        ...policyData,
        effectiveFrom: new Date(policyData.effectiveFrom),
        effectiveTo: policyData.effectiveTo ? new Date(policyData.effectiveTo) : null
      }
    });

    res.status(201).json({
      success: true,
      message: 'Policy created successfully',
      data: policy
    });
  })
);

/**
 * @swagger
 * /policies/user-policies:
 *   get:
 *     tags:
 *       - Policies
 *     summary: Get user-specific policy information
 *     description: Retrieve all policy information applicable to the current user including leave policies, comp off rules, and working hours
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User policies retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     leavePolicies:
 *                       type: array
 *                       items:
 *                         type: object
 *                     compOffPolicy:
 *                       type: object
 *                     workingHours:
 *                       type: object
 *                     holidays:
 *                       type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

// Get user-specific policy information
router.get('/user-policies',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;

    try {
      // Get user details to determine location
      let user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          location: true,
          department: true,
          joiningDate: true,
          country: true
        }
      });

      // Fallback to mock user data if user not found in database
      if (!user) {
        const mockUsers = [
          {
            id: 'admin-001',
            location: 'Bengaluru',
            country: 'INDIA',
            department: 'Human Resources',
            joiningDate: new Date('2020-01-01')
          },
          {
            id: 'emp-eng-001',
            location: 'Bengaluru',
            country: 'INDIA',
            department: 'Engineering',
            joiningDate: new Date('2021-06-15')
          }
        ];

        const mockUser = mockUsers.find(u => u.id === userId);
        if (mockUser) {
          user = mockUser;
        } else {
          throw new AppError('User not found', 404);
        }
      }

      // Get applicable leave policies based on user's location and region
      const leavePolicies = await LeavePolicyService.getAllPolicies({
        location: user.location || undefined,
        region: user.country === 'USA' ? 'USA' : 'INDIA',
        isActive: true
      });

      // Transform policies for frontend display
      const transformedPolicies = leavePolicies.map(policy => ({
        type: policy.leaveType,
        label: getLeaveTypeLabel(policy.leaveType),
        description: policy.name || getLeaveTypeDescription(policy.leaveType),
        entitlementDays: Number(policy.entitlementDays),
        maxConsecutiveDays: policy.maxConsecutiveDays,
        carryForwardDays: Number(policy.maxCarryForward),
        encashmentAllowed: false, // Default value - not in current schema
        probationApplicable: false, // Default value - not in current schema
        minimumServiceMonths: 0, // Default value - not in current schema
        advanceBookingDays: 0, // Default value - not in current schema
        maxAdvanceApplicationDays: 0, // Default value - not in current schema
        requiresDocumentation: policy.requiresDocumentation,
        documentationThreshold: policy.documentationThreshold,
        minimumGap: policy.minimumGap,
        accrualRate: Number(policy.accrualRate),
        conditions: generatePolicyConditions(policy)
      }));

      // Get comp off policy configuration
      const compOffPolicyConfig = {
        minimumHoursForHalfDay: 5,
        minimumHoursForFullDay: 8,
        expiryMonths: 3,
        maxAccumulationDays: 10,
        weekendWorkMultiplier: 1.0,
        holidayWorkMultiplier: 1.5,
        managerVerificationRequired: true,
        allowedWorkTypes: ['WEEKEND', 'HOLIDAY', 'EXTENDED_HOURS'],
        restrictions: [
          'Manager approval required for work log verification',
          'Must submit work log within 7 days of extra work',
          'Comp off expires 3 months from approval date',
          'Maximum 10 days can be accumulated at any time'
        ]
      };

      // Get working hours configuration
      const workingHours = {
        standardHours: 8,
        weeklyWorkingDays: 5,
        flexibleHoursAllowed: true
      };

      // Get holiday information
      const currentYear = new Date().getFullYear();
      const holidays = await prisma.holiday.findMany({
        where: {
          date: {
            gte: new Date(`${currentYear}-01-01`),
            lte: new Date(`${currentYear}-12-31`)
          }
        },
        orderBy: { date: 'asc' }
      });

      const today = new Date();
      const remainingHolidays = holidays.filter(h => new Date(h.date) > today);
      const nextHoliday = remainingHolidays.length > 0 ? remainingHolidays[0] : null;

      const holidayInfo = {
        total: holidays.length,
        remaining: remainingHolidays.length,
        nextHoliday: nextHoliday ? {
          name: nextHoliday.name,
          date: nextHoliday.date.toISOString().split('T')[0]
        } : undefined
      };

      res.json({
        success: true,
        message: 'User policies retrieved successfully',
        data: {
          leavePolicies: transformedPolicies,
          compOffPolicy: compOffPolicyConfig,
          workingHours,
          holidays: holidayInfo
        }
      });

    } catch (error) {
      logger.error('Error fetching user policies:', error);
      throw new AppError('Failed to fetch user policies', 500);
    }
  })
);

// Helper functions
function getLeaveTypeLabel(leaveType: LeaveType): string {
  const labels: Record<LeaveType, string> = {
    SICK_LEAVE: 'Sick Leave',
    CASUAL_LEAVE: 'Casual Leave',
    EARNED_LEAVE: 'Earned Leave / Privilege Leave',
    MATERNITY_LEAVE: 'Maternity Leave',
    PATERNITY_LEAVE: 'Paternity Leave',
    COMPENSATORY_OFF: 'Compensatory Off',
    BEREAVEMENT_LEAVE: 'Bereavement Leave',
    MARRIAGE_LEAVE: 'Marriage Leave'
  };
  return labels[leaveType] || leaveType.replace('_', ' ');
}

function getLeaveTypeDescription(leaveType: LeaveType): string {
  const descriptions: Record<LeaveType, string> = {
    SICK_LEAVE: 'For medical emergencies and health-related issues',
    CASUAL_LEAVE: 'For personal work and short-term absences',
    EARNED_LEAVE: 'Annual vacation days earned through service',
    MATERNITY_LEAVE: 'For female employees during childbirth and post-delivery',
    PATERNITY_LEAVE: 'For male employees during childbirth of spouse',
    COMPENSATORY_OFF: 'Time off in lieu of overtime or holiday work',
    BEREAVEMENT_LEAVE: 'For mourning and funeral arrangements of family members',
    MARRIAGE_LEAVE: 'For wedding ceremonies and related events'
  };
  return descriptions[leaveType] || 'Standard leave type';
}

function generatePolicyConditions(policy: any): string[] {
  const conditions: string[] = [];

  if (policy.requiresDocumentation) {
    conditions.push(`Medical certificate required for ${policy.documentationThreshold || 1}+ days`);
  }

  if (policy.probationApplicable === false) {
    conditions.push('Not available during probation period');
  }

  if (policy.advanceBookingDays) {
    conditions.push(`Must be applied ${policy.advanceBookingDays} days in advance`);
  }

  if (policy.encashmentAllowed) {
    conditions.push('Unused balance can be encashed at year-end');
  }

  if (policy.maxCarryForward) {
    conditions.push(`Maximum ${policy.maxCarryForward} days can be carried forward`);
  }

  return conditions;
}

// Get all leave types configurations
router.get('/leave-types',
  authorize('HR_ADMIN', 'HR'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      // For now, return mock data based on existing policies
      const policies = await LeavePolicyService.getAllPolicies({ isActive: true });

      const leaveTypes = policies.map(policy => ({
        id: policy.id,
        type: policy.leaveType,
        name: policy.name,
        description: policy.description || `Standard ${policy.leaveType.replace('_', ' ').toLowerCase()} policy`,
        isActive: policy.isActive,
        entitlementDays: policy.entitlementDays,
        maxConsecutiveDays: policy.maxConsecutiveDays,
        maxCarryForward: policy.maxCarryForward,
        carryForwardExpiryMonths: 12,
        accrualRate: policy.accrualRate || 0,
        requiresDocumentation: policy.requiresDocumentation || false,
        documentationThreshold: policy.documentationThreshold || 1,
        encashmentAllowed: policy.encashmentAllowed || false,
        encashmentMaxDays: policy.encashmentMaxDays || 0,
        probationApplicable: policy.probationApplicable !== false,
        minimumServiceMonths: policy.minimumServiceMonths || 0,
        advanceBookingDays: policy.advanceBookingDays || 0,
        maxAdvanceApplicationDays: policy.maxAdvanceApplicationDays || 30,
        applicableGender: 'ALL',
        isOptional: false,
        conditions: generatePolicyConditions(policy),
        restrictions: [],
        createdAt: policy.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: policy.updatedAt?.toISOString() || new Date().toISOString()
      }));

      res.json({
        success: true,
        message: 'Leave types retrieved successfully',
        data: leaveTypes
      });

    } catch (error) {
      logger.error('Error fetching leave types:', error);
      throw new AppError('Failed to fetch leave types', 500);
    }
  })
);

// Create new leave type configuration
router.post('/leave-types',
  authorize('HR_ADMIN', 'HR'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        leaveType,
        name,
        description,
        isActive,
        entitlementDays,
        maxConsecutiveDays,
        maxCarryForward,
        accrualRate,
        requiresDocumentation,
        documentationThreshold,
        encashmentAllowed,
        encashmentMaxDays,
        probationApplicable,
        minimumServiceMonths,
        advanceBookingDays,
        maxAdvanceApplicationDays,
        applicableGender,
        isOptional,
        conditions,
        restrictions
      } = req.body;

      // Create policy using existing service
      const policyData = {
        name,
        leaveType,
        entitlementDays,
        accrualRate: accrualRate || 1.0,
        maxCarryForward: maxCarryForward || 0,
        maxConsecutiveDays: maxConsecutiveDays || null,
        requiresDocumentation: requiresDocumentation || false,
        documentationThreshold: documentationThreshold || 1,
        location: 'Default',
        region: 'INDIA',
        effectiveFrom: new Date(),
        effectiveTo: null,
        isActive: isActive !== false,
        encashmentAllowed: encashmentAllowed || false,
        encashmentMaxDays: encashmentMaxDays || 0,
        probationApplicable: probationApplicable !== false,
        minimumServiceMonths: minimumServiceMonths || 0,
        advanceBookingDays: advanceBookingDays || 0,
        maxAdvanceApplicationDays: maxAdvanceApplicationDays || 30,
        description
      };

      const policy = await prisma.leavePolicy.create({
        data: {
          ...policyData,
          effectiveFrom: new Date(policyData.effectiveFrom),
          effectiveTo: policyData.effectiveTo ? new Date(policyData.effectiveTo) : null
        }
      });

      const leaveTypeConfig = {
        id: policy.id,
        type: policy.leaveType,
        name: policy.name,
        description: policy.description,
        isActive: policy.isActive,
        entitlementDays: policy.entitlementDays,
        maxConsecutiveDays: policy.maxConsecutiveDays,
        maxCarryForward: policy.maxCarryForward,
        carryForwardExpiryMonths: 12,
        accrualRate: policy.accrualRate,
        requiresDocumentation: requiresDocumentation || false,
        documentationThreshold: documentationThreshold || 1,
        encashmentAllowed: encashmentAllowed || false,
        encashmentMaxDays: encashmentMaxDays || 0,
        probationApplicable: probationApplicable !== false,
        minimumServiceMonths: minimumServiceMonths || 0,
        advanceBookingDays: advanceBookingDays || 0,
        maxAdvanceApplicationDays: maxAdvanceApplicationDays || 30,
        applicableGender: applicableGender || 'ALL',
        isOptional: isOptional || false,
        conditions: conditions || [],
        restrictions: restrictions || [],
        createdAt: policy.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: policy.updatedAt?.toISOString() || new Date().toISOString()
      };

      res.status(201).json({
        success: true,
        message: 'Leave type created successfully',
        data: leaveTypeConfig
      });

    } catch (error) {
      logger.error('Error creating leave type:', error);
      throw new AppError('Failed to create leave type', 500);
    }
  })
);

// Update leave type configuration
router.put('/leave-types/:id',
  authorize('HR_ADMIN', 'HR'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const policy = await prisma.leavePolicy.update({
        where: { id },
        data: {
          name: updateData.name,
          entitlementDays: updateData.entitlementDays,
          maxConsecutiveDays: updateData.maxConsecutiveDays,
          maxCarryForward: updateData.maxCarryForward,
          accrualRate: updateData.accrualRate,
          isActive: updateData.isActive,
          description: updateData.description,
          updatedAt: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Leave type updated successfully',
        data: policy
      });

    } catch (error) {
      logger.error('Error updating leave type:', error);
      throw new AppError('Failed to update leave type', 500);
    }
  })
);

// Delete leave type configuration
router.delete('/leave-types/:id',
  authorize('HR_ADMIN', 'HR'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      await prisma.leavePolicy.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Leave type deleted successfully'
      });

    } catch (error) {
      logger.error('Error deleting leave type:', error);
      throw new AppError('Failed to delete leave type', 500);
    }
  })
);

// Toggle leave type active status
router.patch('/leave-types/:id/toggle',
  authorize('HR_ADMIN', 'HR'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const policy = await prisma.leavePolicy.update({
        where: { id },
        data: {
          isActive: isActive,
          updatedAt: new Date()
        }
      });

      res.json({
        success: true,
        message: `Leave type ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: policy
      });

    } catch (error) {
      logger.error('Error toggling leave type:', error);
      throw new AppError('Failed to toggle leave type', 500);
    }
  })
);

export default router;