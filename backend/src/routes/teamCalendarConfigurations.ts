import express, { Request, Response } from 'express';
import { prisma } from '../index';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authorize } from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * /team-calendar-configurations:
 *   get:
 *     tags:
 *       - Team Calendar Configurations
 *     summary: Get all team calendar configurations
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department
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
  const { department, activeOnly = 'true' } = req.query;

  const where: any = {};

  if (department) {
    where.department = department as string;
  }

  if (activeOnly === 'true') {
    where.isActive = true;
  }

  const configurations = await prisma.teamCalendarConfiguration.findMany({
    where,
    orderBy: { department: 'asc' }
  });

  // Parse JSON fields
  const parsedConfigurations = configurations.map(config => ({
    ...config,
    displayConfig: JSON.parse(config.displayConfig),
    excludeLeaveTypes: config.excludeLeaveTypes ? JSON.parse(config.excludeLeaveTypes) : null,
    overlapActions: JSON.parse(config.overlapActions),
    syncProviders: config.syncProviders ? JSON.parse(config.syncProviders) : null
  }));

  res.json({
    success: true,
    data: parsedConfigurations
  });
}));

/**
 * @swagger
 * /team-calendar-configurations/{id}:
 *   get:
 *     tags:
 *       - Team Calendar Configurations
 *     summary: Get specific team calendar configuration
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Configuration retrieved successfully
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const configuration = await prisma.teamCalendarConfiguration.findUnique({
    where: { id }
  });

  if (!configuration) {
    throw new AppError('Team calendar configuration not found', 404);
  }

  res.json({
    success: true,
    data: {
      ...configuration,
      displayConfig: JSON.parse(configuration.displayConfig),
      excludeLeaveTypes: configuration.excludeLeaveTypes ? JSON.parse(configuration.excludeLeaveTypes) : null,
      overlapActions: JSON.parse(configuration.overlapActions),
      syncProviders: configuration.syncProviders ? JSON.parse(configuration.syncProviders) : null
    }
  });
}));

/**
 * @swagger
 * /team-calendar-configurations:
 *   post:
 *     tags:
 *       - Team Calendar Configurations
 *     summary: Create a new team calendar configuration
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Configuration created successfully
 */
router.post('/', authorize('HR_ADMIN', 'IT_ADMIN'), asyncHandler(async (req: Request, res: Response) => {
  const {
    department,
    teamDefinitionType = 'REPORTING_HIERARCHY',
    includeSubordinates = true,
    subordinateDepth = 2,
    displayConfig,
    overlapEnabled = false,
    overlapCalculation = 'PERCENTAGE',
    overlapThreshold = 20.0,
    excludeLeaveTypes,
    minimumTeamSize = 2,
    overlapActions,
    externalCalendarEnabled = false,
    syncProviders,
    syncFrequencyMinutes = 30,
    showEmployeeNames = true,
    showLeaveTypes = true,
    showLeaveDuration = true,
    showLeaveReason = false,
    isActive = true
  } = req.body;

  if (!displayConfig || !overlapActions) {
    throw new AppError('Display config and overlap actions are required', 400);
  }

  // Validate team definition type
  const validTypes = ['REPORTING_HIERARCHY', 'DEPARTMENT', 'CUSTOM_GROUP'];
  if (!validTypes.includes(teamDefinitionType)) {
    throw new AppError(`Invalid team definition type. Must be one of: ${validTypes.join(', ')}`, 400);
  }

  // Validate overlap calculation
  const validCalculations = ['PERCENTAGE', 'ABSOLUTE_COUNT'];
  if (!validCalculations.includes(overlapCalculation)) {
    throw new AppError(`Invalid overlap calculation. Must be one of: ${validCalculations.join(', ')}`, 400);
  }

  const configuration = await prisma.teamCalendarConfiguration.create({
    data: {
      department,
      teamDefinitionType,
      includeSubordinates,
      subordinateDepth,
      displayConfig: JSON.stringify(displayConfig),
      overlapEnabled,
      overlapCalculation,
      overlapThreshold,
      excludeLeaveTypes: excludeLeaveTypes ? JSON.stringify(excludeLeaveTypes) : null,
      minimumTeamSize,
      overlapActions: JSON.stringify(overlapActions),
      externalCalendarEnabled,
      syncProviders: syncProviders ? JSON.stringify(syncProviders) : null,
      syncFrequencyMinutes,
      showEmployeeNames,
      showLeaveTypes,
      showLeaveDuration,
      showLeaveReason,
      isActive
    }
  });

  res.status(201).json({
    success: true,
    data: {
      ...configuration,
      displayConfig: JSON.parse(configuration.displayConfig),
      excludeLeaveTypes: configuration.excludeLeaveTypes ? JSON.parse(configuration.excludeLeaveTypes) : null,
      overlapActions: JSON.parse(configuration.overlapActions),
      syncProviders: configuration.syncProviders ? JSON.parse(configuration.syncProviders) : null
    },
    message: 'Team calendar configuration created successfully'
  });
}));

/**
 * @swagger
 * /team-calendar-configurations/{id}:
 *   patch:
 *     tags:
 *       - Team Calendar Configurations
 *     summary: Update a team calendar configuration
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
    'department', 'teamDefinitionType', 'includeSubordinates', 'subordinateDepth',
    'overlapEnabled', 'overlapCalculation', 'overlapThreshold', 'minimumTeamSize',
    'externalCalendarEnabled', 'syncFrequencyMinutes', 'showEmployeeNames',
    'showLeaveTypes', 'showLeaveDuration', 'showLeaveReason', 'isActive'
  ];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  }

  // Handle JSON fields
  if (req.body.displayConfig !== undefined) {
    updateData.displayConfig = JSON.stringify(req.body.displayConfig);
  }
  if (req.body.excludeLeaveTypes !== undefined) {
    updateData.excludeLeaveTypes = req.body.excludeLeaveTypes ? JSON.stringify(req.body.excludeLeaveTypes) : null;
  }
  if (req.body.overlapActions !== undefined) {
    updateData.overlapActions = JSON.stringify(req.body.overlapActions);
  }
  if (req.body.syncProviders !== undefined) {
    updateData.syncProviders = req.body.syncProviders ? JSON.stringify(req.body.syncProviders) : null;
  }

  if (Object.keys(updateData).length === 0) {
    throw new AppError('No valid fields provided for update', 400);
  }

  const configuration = await prisma.teamCalendarConfiguration.update({
    where: { id },
    data: updateData
  });

  res.json({
    success: true,
    data: {
      ...configuration,
      displayConfig: JSON.parse(configuration.displayConfig),
      excludeLeaveTypes: configuration.excludeLeaveTypes ? JSON.parse(configuration.excludeLeaveTypes) : null,
      overlapActions: JSON.parse(configuration.overlapActions),
      syncProviders: configuration.syncProviders ? JSON.parse(configuration.syncProviders) : null
    },
    message: 'Team calendar configuration updated successfully'
  });
}));

/**
 * @swagger
 * /team-calendar-configurations/{id}:
 *   delete:
 *     tags:
 *       - Team Calendar Configurations
 *     summary: Delete a team calendar configuration
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Configuration deleted successfully
 */
router.delete('/:id', authorize('HR_ADMIN', 'IT_ADMIN'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await prisma.teamCalendarConfiguration.update({
    where: { id },
    data: { isActive: false }
  });

  res.json({
    success: true,
    message: 'Team calendar configuration deleted successfully'
  });
}));

export default router;
