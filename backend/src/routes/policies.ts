import express, { Request, Response } from 'express';
import { prisma } from '../config/database';
import { LeavePolicyService } from '../services/leavePolicyService';
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
  authorize('HR_ADMIN'),
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

export default router;