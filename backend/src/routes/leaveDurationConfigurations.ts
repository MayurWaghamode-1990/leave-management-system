import express, { Request, Response } from 'express';
import { prisma } from '../index';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authorize } from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * /leave-duration-configurations:
 *   get:
 *     tags:
 *       - Leave Duration Configurations
 *     summary: Get all leave duration configurations
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: region
 *         schema:
 *           type: string
 *         description: Filter by region
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: Configurations retrieved successfully
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { region, activeOnly = 'true' } = req.query;

  const where: any = {};

  if (region) {
    where.region = region as string;
  }

  if (activeOnly === 'true') {
    where.isActive = true;
  }

  const configurations = await prisma.leaveDurationConfiguration.findMany({
    where,
    orderBy: { region: 'asc' }
  });

  // Parse JSON fields
  const parsedConfigurations = configurations.map(config => ({
    ...config,
    halfDaySlots: config.halfDaySlots ? JSON.parse(config.halfDaySlots) : null,
    quarterDaySlots: config.quarterDaySlots ? JSON.parse(config.quarterDaySlots) : null,
    allowedLeaveTypes: config.allowedLeaveTypes ? JSON.parse(config.allowedLeaveTypes) : null
  }));

  res.json({
    success: true,
    data: parsedConfigurations
  });
}));

/**
 * @swagger
 * /leave-duration-configurations/{id}:
 *   get:
 *     tags:
 *       - Leave Duration Configurations
 *     summary: Get specific leave duration configuration
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Configuration retrieved successfully
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const configuration = await prisma.leaveDurationConfiguration.findUnique({
    where: { id }
  });

  if (!configuration) {
    throw new AppError('Leave duration configuration not found', 404);
  }

  res.json({
    success: true,
    data: {
      ...configuration,
      halfDaySlots: configuration.halfDaySlots ? JSON.parse(configuration.halfDaySlots) : null,
      quarterDaySlots: configuration.quarterDaySlots ? JSON.parse(configuration.quarterDaySlots) : null,
      allowedLeaveTypes: configuration.allowedLeaveTypes ? JSON.parse(configuration.allowedLeaveTypes) : null
    }
  });
}));

/**
 * @swagger
 * /leave-duration-configurations/region/{region}:
 *   get:
 *     tags:
 *       - Leave Duration Configurations
 *     summary: Get configuration by region
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Configuration retrieved successfully
 */
router.get('/region/:region', asyncHandler(async (req: Request, res: Response) => {
  const { region } = req.params;

  const configuration = await prisma.leaveDurationConfiguration.findUnique({
    where: { region: region.toUpperCase() }
  });

  if (!configuration) {
    throw new AppError('Leave duration configuration not found for this region', 404);
  }

  res.json({
    success: true,
    data: {
      ...configuration,
      halfDaySlots: configuration.halfDaySlots ? JSON.parse(configuration.halfDaySlots) : null,
      quarterDaySlots: configuration.quarterDaySlots ? JSON.parse(configuration.quarterDaySlots) : null,
      allowedLeaveTypes: configuration.allowedLeaveTypes ? JSON.parse(configuration.allowedLeaveTypes) : null
    }
  });
}));

/**
 * @swagger
 * /leave-duration-configurations:
 *   post:
 *     tags:
 *       - Leave Duration Configurations
 *     summary: Create a new leave duration configuration
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Configuration created successfully
 */
router.post('/', authorize('HR_ADMIN', 'IT_ADMIN'), asyncHandler(async (req: Request, res: Response) => {
  const {
    region,
    fullDayEnabled = true,
    fullDayHours = 8.0,
    halfDayEnabled = true,
    halfDayHours = 4.0,
    halfDaySlots,
    quarterDayEnabled = false,
    quarterDayHours = 2.0,
    quarterDaySlots,
    hourlyEnabled = false,
    minimumHours = 1.0,
    maximumHours = 8.0,
    allowedLeaveTypes,
    allowMixedDuration = false,
    roundingMethod = 'NEAREST',
    roundingPrecision = 0.5,
    isActive = true
  } = req.body;

  if (!region) {
    throw new AppError('Region is required', 400);
  }

  // Validate region
  const validRegions = ['INDIA', 'USA', 'GLOBAL'];
  if (!validRegions.includes(region.toUpperCase())) {
    throw new AppError(`Invalid region. Must be one of: ${validRegions.join(', ')}`, 400);
  }

  // Check for duplicate
  const existing = await prisma.leaveDurationConfiguration.findUnique({
    where: { region: region.toUpperCase() }
  });

  if (existing) {
    throw new AppError('Configuration for this region already exists', 400);
  }

  const configuration = await prisma.leaveDurationConfiguration.create({
    data: {
      region: region.toUpperCase(),
      fullDayEnabled,
      fullDayHours,
      halfDayEnabled,
      halfDayHours,
      halfDaySlots: halfDaySlots ? JSON.stringify(halfDaySlots) : null,
      quarterDayEnabled,
      quarterDayHours,
      quarterDaySlots: quarterDaySlots ? JSON.stringify(quarterDaySlots) : null,
      hourlyEnabled,
      minimumHours,
      maximumHours,
      allowedLeaveTypes: allowedLeaveTypes ? JSON.stringify(allowedLeaveTypes) : null,
      allowMixedDuration,
      roundingMethod,
      roundingPrecision,
      isActive
    }
  });

  res.status(201).json({
    success: true,
    data: {
      ...configuration,
      halfDaySlots: configuration.halfDaySlots ? JSON.parse(configuration.halfDaySlots) : null,
      quarterDaySlots: configuration.quarterDaySlots ? JSON.parse(configuration.quarterDaySlots) : null,
      allowedLeaveTypes: configuration.allowedLeaveTypes ? JSON.parse(configuration.allowedLeaveTypes) : null
    },
    message: 'Leave duration configuration created successfully'
  });
}));

/**
 * @swagger
 * /leave-duration-configurations/{id}:
 *   patch:
 *     tags:
 *       - Leave Duration Configurations
 *     summary: Update a leave duration configuration
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Configuration updated successfully
 */
router.patch('/:id', authorize('HR_ADMIN', 'IT_ADMIN'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData: any = {};

  const allowedFields = [
    'fullDayEnabled', 'fullDayHours', 'halfDayEnabled', 'halfDayHours',
    'quarterDayEnabled', 'quarterDayHours', 'hourlyEnabled', 'minimumHours',
    'maximumHours', 'allowMixedDuration', 'roundingMethod', 'roundingPrecision', 'isActive'
  ];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  }

  // Handle JSON fields
  if (req.body.halfDaySlots !== undefined) {
    updateData.halfDaySlots = req.body.halfDaySlots ? JSON.stringify(req.body.halfDaySlots) : null;
  }
  if (req.body.quarterDaySlots !== undefined) {
    updateData.quarterDaySlots = req.body.quarterDaySlots ? JSON.stringify(req.body.quarterDaySlots) : null;
  }
  if (req.body.allowedLeaveTypes !== undefined) {
    updateData.allowedLeaveTypes = req.body.allowedLeaveTypes ? JSON.stringify(req.body.allowedLeaveTypes) : null;
  }

  if (Object.keys(updateData).length === 0) {
    throw new AppError('No valid fields provided for update', 400);
  }

  const configuration = await prisma.leaveDurationConfiguration.update({
    where: { id },
    data: updateData
  });

  res.json({
    success: true,
    data: {
      ...configuration,
      halfDaySlots: configuration.halfDaySlots ? JSON.parse(configuration.halfDaySlots) : null,
      quarterDaySlots: configuration.quarterDaySlots ? JSON.parse(configuration.quarterDaySlots) : null,
      allowedLeaveTypes: configuration.allowedLeaveTypes ? JSON.parse(configuration.allowedLeaveTypes) : null
    },
    message: 'Leave duration configuration updated successfully'
  });
}));

/**
 * @swagger
 * /leave-duration-configurations/{id}:
 *   delete:
 *     tags:
 *       - Leave Duration Configurations
 *     summary: Delete a leave duration configuration
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Configuration deleted successfully
 */
router.delete('/:id', authorize('HR_ADMIN', 'IT_ADMIN'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await prisma.leaveDurationConfiguration.update({
    where: { id },
    data: { isActive: false }
  });

  res.json({
    success: true,
    message: 'Leave duration configuration deleted successfully'
  });
}));

export default router;
