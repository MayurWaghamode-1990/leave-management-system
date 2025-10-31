import express, { Request, Response } from 'express';
import { prisma } from '../index';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authorize } from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * /leave-type-configurations:
 *   get:
 *     tags:
 *       - Leave Type Configurations
 *     summary: Get all leave type configurations
 *     description: Retrieve all leave type configurations with optional filters
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: region
 *         schema:
 *           type: string
 *         description: Filter by region (INDIA, USA, GLOBAL)
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Return only active configurations
 *       - in: query
 *         name: leaveTypeCode
 *         schema:
 *           type: string
 *         description: Filter by specific leave type code
 *     responses:
 *       200:
 *         description: Leave type configurations retrieved successfully
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { region, activeOnly = 'true', leaveTypeCode } = req.query;

  const where: any = {};

  if (region) {
    where.region = region as string;
  }

  if (leaveTypeCode) {
    where.leaveTypeCode = leaveTypeCode as string;
  }

  if (activeOnly === 'true') {
    where.isActive = true;
  }

  const configurations = await prisma.leaveTypeConfiguration.findMany({
    where,
    orderBy: [
      { sortOrder: 'asc' },
      { displayName: 'asc' }
    ]
  });

  // Parse JSON fields
  const parsedConfigurations = configurations.map(config => ({
    ...config,
    eligibilityCriteria: config.eligibilityCriteria ? JSON.parse(config.eligibilityCriteria) : null
  }));

  res.json({
    success: true,
    data: parsedConfigurations
  });
}));

/**
 * @swagger
 * /leave-type-configurations/{id}:
 *   get:
 *     tags:
 *       - Leave Type Configurations
 *     summary: Get specific leave type configuration
 *     description: Retrieve a specific leave type configuration by ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Configuration ID
 *     responses:
 *       200:
 *         description: Configuration retrieved successfully
 *       404:
 *         description: Configuration not found
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const configuration = await prisma.leaveTypeConfiguration.findUnique({
    where: { id }
  });

  if (!configuration) {
    throw new AppError('Leave type configuration not found', 404);
  }

  res.json({
    success: true,
    data: {
      ...configuration,
      eligibilityCriteria: configuration.eligibilityCriteria ? JSON.parse(configuration.eligibilityCriteria) : null
    }
  });
}));

/**
 * @swagger
 * /leave-type-configurations/code/{leaveTypeCode}:
 *   get:
 *     tags:
 *       - Leave Type Configurations
 *     summary: Get configuration by leave type code
 *     description: Retrieve configuration for a specific leave type code
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leaveTypeCode
 *         required: true
 *         schema:
 *           type: string
 *         description: Leave type code (e.g., CASUAL_LEAVE, PTO)
 *     responses:
 *       200:
 *         description: Configuration retrieved successfully
 *       404:
 *         description: Configuration not found
 */
router.get('/code/:leaveTypeCode', asyncHandler(async (req: Request, res: Response) => {
  const { leaveTypeCode } = req.params;

  const configuration = await prisma.leaveTypeConfiguration.findUnique({
    where: { leaveTypeCode }
  });

  if (!configuration) {
    throw new AppError('Leave type configuration not found', 404);
  }

  res.json({
    success: true,
    data: {
      ...configuration,
      eligibilityCriteria: configuration.eligibilityCriteria ? JSON.parse(configuration.eligibilityCriteria) : null
    }
  });
}));

/**
 * @swagger
 * /leave-type-configurations:
 *   post:
 *     tags:
 *       - Leave Type Configurations
 *     summary: Create a new leave type configuration
 *     description: Create a new leave type configuration (HR/IT Admin only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - leaveTypeCode
 *               - displayName
 *               - region
 *             properties:
 *               leaveTypeCode:
 *                 type: string
 *               displayName:
 *                 type: string
 *               description:
 *                 type: string
 *               region:
 *                 type: string
 *                 enum: [INDIA, USA, GLOBAL]
 *               defaultEntitlement:
 *                 type: number
 *               allowNegativeBalance:
 *                 type: boolean
 *               negativeBalanceLimit:
 *                 type: number
 *               requiresDocumentation:
 *                 type: boolean
 *               documentationThreshold:
 *                 type: number
 *               eligibilityCriteria:
 *                 type: object
 *               minimumAdvanceNoticeDays:
 *                 type: number
 *               maxFutureBookingDays:
 *                 type: number
 *               minimumGapDays:
 *                 type: number
 *               maxConsecutiveDays:
 *                 type: number
 *               allowBackdatedLeave:
 *                 type: boolean
 *               backdatedLimitDays:
 *                 type: number
 *               allowFullDay:
 *                 type: boolean
 *               allowHalfDay:
 *                 type: boolean
 *               allowQuarterDay:
 *                 type: boolean
 *               allowHourly:
 *                 type: boolean
 *               colorCode:
 *                 type: string
 *               icon:
 *                 type: string
 *               sortOrder:
 *                 type: number
 *     responses:
 *       201:
 *         description: Configuration created successfully
 */
router.post('/', authorize(['HR_ADMIN', 'IT_ADMIN']), asyncHandler(async (req: Request, res: Response) => {
  const {
    leaveTypeCode,
    displayName,
    description,
    region,
    defaultEntitlement = 0,
    allowNegativeBalance = false,
    negativeBalanceLimit = 0,
    requiresDocumentation = false,
    documentationThreshold = 0,
    eligibilityCriteria,
    minimumAdvanceNoticeDays = 0,
    maxFutureBookingDays = 365,
    minimumGapDays = 0,
    maxConsecutiveDays = 365,
    allowBackdatedLeave = false,
    backdatedLimitDays = 0,
    allowFullDay = true,
    allowHalfDay = true,
    allowQuarterDay = false,
    allowHourly = false,
    colorCode = '#3B82F6',
    icon,
    sortOrder = 0
  } = req.body;

  if (!leaveTypeCode || !displayName || !region) {
    throw new AppError('Leave type code, display name, and region are required', 400);
  }

  // Validate region
  const validRegions = ['INDIA', 'USA', 'GLOBAL'];
  if (!validRegions.includes(region)) {
    throw new AppError(`Invalid region. Must be one of: ${validRegions.join(', ')}`, 400);
  }

  // Check for duplicates
  const existing = await prisma.leaveTypeConfiguration.findUnique({
    where: { leaveTypeCode }
  });

  if (existing) {
    throw new AppError('Leave type configuration with this code already exists', 400);
  }

  const configuration = await prisma.leaveTypeConfiguration.create({
    data: {
      leaveTypeCode,
      displayName,
      description,
      region,
      defaultEntitlement,
      allowNegativeBalance,
      negativeBalanceLimit,
      requiresDocumentation,
      documentationThreshold,
      eligibilityCriteria: eligibilityCriteria ? JSON.stringify(eligibilityCriteria) : null,
      minimumAdvanceNoticeDays,
      maxFutureBookingDays,
      minimumGapDays,
      maxConsecutiveDays,
      allowBackdatedLeave,
      backdatedLimitDays,
      allowFullDay,
      allowHalfDay,
      allowQuarterDay,
      allowHourly,
      colorCode,
      icon,
      sortOrder
    }
  });

  res.status(201).json({
    success: true,
    data: {
      ...configuration,
      eligibilityCriteria: configuration.eligibilityCriteria ? JSON.parse(configuration.eligibilityCriteria) : null
    },
    message: 'Leave type configuration created successfully'
  });
}));

/**
 * @swagger
 * /leave-type-configurations/{id}:
 *   patch:
 *     tags:
 *       - Leave Type Configurations
 *     summary: Update a leave type configuration
 *     description: Update an existing leave type configuration (HR/IT Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Configuration ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               defaultEntitlement:
 *                 type: number
 *               allowNegativeBalance:
 *                 type: boolean
 *               negativeBalanceLimit:
 *                 type: number
 *               requiresDocumentation:
 *                 type: boolean
 *               documentationThreshold:
 *                 type: number
 *               eligibilityCriteria:
 *                 type: object
 *               minimumAdvanceNoticeDays:
 *                 type: number
 *               maxFutureBookingDays:
 *                 type: number
 *               minimumGapDays:
 *                 type: number
 *               maxConsecutiveDays:
 *                 type: number
 *               allowBackdatedLeave:
 *                 type: boolean
 *               backdatedLimitDays:
 *                 type: number
 *               allowFullDay:
 *                 type: boolean
 *               allowHalfDay:
 *                 type: boolean
 *               allowQuarterDay:
 *                 type: boolean
 *               allowHourly:
 *                 type: boolean
 *               colorCode:
 *                 type: string
 *               icon:
 *                 type: string
 *               sortOrder:
 *                 type: number
 *     responses:
 *       200:
 *         description: Configuration updated successfully
 */
router.patch('/:id', authorize(['HR_ADMIN', 'IT_ADMIN']), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData: any = {};

  // List of allowed fields to update
  const allowedFields = [
    'displayName', 'description', 'isActive', 'defaultEntitlement',
    'allowNegativeBalance', 'negativeBalanceLimit', 'requiresDocumentation',
    'documentationThreshold', 'minimumAdvanceNoticeDays', 'maxFutureBookingDays',
    'minimumGapDays', 'maxConsecutiveDays', 'allowBackdatedLeave', 'backdatedLimitDays',
    'allowFullDay', 'allowHalfDay', 'allowQuarterDay', 'allowHourly',
    'colorCode', 'icon', 'sortOrder'
  ];

  // Build update object
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  }

  // Handle JSON fields separately
  if (req.body.eligibilityCriteria !== undefined) {
    updateData.eligibilityCriteria = JSON.stringify(req.body.eligibilityCriteria);
  }

  if (Object.keys(updateData).length === 0) {
    throw new AppError('No valid fields provided for update', 400);
  }

  const configuration = await prisma.leaveTypeConfiguration.update({
    where: { id },
    data: updateData
  });

  res.json({
    success: true,
    data: {
      ...configuration,
      eligibilityCriteria: configuration.eligibilityCriteria ? JSON.parse(configuration.eligibilityCriteria) : null
    },
    message: 'Leave type configuration updated successfully'
  });
}));

/**
 * @swagger
 * /leave-type-configurations/{id}:
 *   delete:
 *     tags:
 *       - Leave Type Configurations
 *     summary: Delete a leave type configuration
 *     description: Delete a leave type configuration (HR/IT Admin only). This is a soft delete (sets isActive to false).
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Configuration ID
 *     responses:
 *       200:
 *         description: Configuration deleted successfully
 */
router.delete('/:id', authorize(['HR_ADMIN', 'IT_ADMIN']), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Soft delete by setting isActive to false
  await prisma.leaveTypeConfiguration.update({
    where: { id },
    data: { isActive: false }
  });

  res.json({
    success: true,
    message: 'Leave type configuration deleted successfully'
  });
}));

/**
 * @swagger
 * /leave-type-configurations/{id}/validate-eligibility:
 *   post:
 *     tags:
 *       - Leave Type Configurations
 *     summary: Validate user eligibility for leave type
 *     description: Check if a user meets the eligibility criteria for a specific leave type
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Configuration ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Eligibility check completed
 */
router.post('/:id/validate-eligibility', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) {
    throw new AppError('User ID is required', 400);
  }

  const configuration = await prisma.leaveTypeConfiguration.findUnique({
    where: { id }
  });

  if (!configuration) {
    throw new AppError('Leave type configuration not found', 404);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      gender: true,
      maritalStatus: true,
      designation: true,
      joiningDate: true,
      country: true
    }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  let isEligible = true;
  const reasons: string[] = [];

  if (configuration.eligibilityCriteria) {
    const criteria = JSON.parse(configuration.eligibilityCriteria);

    // Check gender eligibility
    if (criteria.gender && criteria.gender.length > 0) {
      if (!user.gender || !criteria.gender.includes(user.gender)) {
        isEligible = false;
        reasons.push(`This leave type is only available for: ${criteria.gender.join(', ')}`);
      }
    }

    // Check marital status eligibility
    if (criteria.maritalStatus && criteria.maritalStatus.length > 0) {
      if (!user.maritalStatus || !criteria.maritalStatus.includes(user.maritalStatus)) {
        isEligible = false;
        reasons.push(`This leave type requires marital status: ${criteria.maritalStatus.join(', ')}`);
      }
    }

    // Check tenure eligibility (minimum months of service)
    if (criteria.minimumTenureMonths) {
      const tenureMonths = Math.floor(
        (new Date().getTime() - new Date(user.joiningDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
      );
      if (tenureMonths < criteria.minimumTenureMonths) {
        isEligible = false;
        reasons.push(`Minimum tenure of ${criteria.minimumTenureMonths} months required`);
      }
    }

    // Check designation eligibility
    if (criteria.designation && criteria.designation.length > 0) {
      if (!user.designation || !criteria.designation.includes(user.designation)) {
        isEligible = false;
        reasons.push(`This leave type is only available for: ${criteria.designation.join(', ')}`);
      }
    }
  }

  res.json({
    success: true,
    data: {
      isEligible,
      reasons: reasons.length > 0 ? reasons : ['User meets all eligibility criteria'],
      configuration: {
        id: configuration.id,
        leaveTypeCode: configuration.leaveTypeCode,
        displayName: configuration.displayName
      }
    }
  });
}));

export default router;
