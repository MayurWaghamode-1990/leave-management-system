import express, { Request, Response } from 'express';
import { prisma } from '../index';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authorize } from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * /workflow-configurations:
 *   get:
 *     tags:
 *       - Workflow Configurations
 *     summary: Get all workflow configurations
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: workflowType
 *         schema:
 *           type: string
 *         description: Filter by workflow type
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: Workflow configurations retrieved successfully
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { workflowType, activeOnly = 'true' } = req.query;

  const where: any = {};

  if (workflowType) {
    where.workflowType = workflowType as string;
  }

  if (activeOnly === 'true') {
    where.isActive = true;
  }

  const configurations = await prisma.workflowConfiguration.findMany({
    where,
    orderBy: [
      { priority: 'desc' },
      { name: 'asc' }
    ]
  });

  // Parse JSON fields
  const parsedConfigurations = configurations.map(config => ({
    ...config,
    conditions: config.conditions ? JSON.parse(config.conditions) : null,
    steps: JSON.parse(config.steps),
    autoApprovalRules: config.autoApprovalRules ? JSON.parse(config.autoApprovalRules) : null
  }));

  res.json({
    success: true,
    data: parsedConfigurations
  });
}));

/**
 * @swagger
 * /workflow-configurations/{id}:
 *   get:
 *     tags:
 *       - Workflow Configurations
 *     summary: Get specific workflow configuration
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Configuration retrieved successfully
 *       404:
 *         description: Configuration not found
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const configuration = await prisma.workflowConfiguration.findUnique({
    where: { id }
  });

  if (!configuration) {
    throw new AppError('Workflow configuration not found', 404);
  }

  res.json({
    success: true,
    data: {
      ...configuration,
      conditions: configuration.conditions ? JSON.parse(configuration.conditions) : null,
      steps: JSON.parse(configuration.steps),
      autoApprovalRules: configuration.autoApprovalRules ? JSON.parse(configuration.autoApprovalRules) : null
    }
  });
}));

/**
 * @swagger
 * /workflow-configurations:
 *   post:
 *     tags:
 *       - Workflow Configurations
 *     summary: Create a new workflow configuration
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Configuration created successfully
 */
router.post('/', authorize('HR_ADMIN', 'IT_ADMIN'), asyncHandler(async (req: Request, res: Response) => {
  const {
    workflowType,
    name,
    description,
    isDefault = false,
    priority = 0,
    conditions,
    steps,
    autoApprovalRules,
    isActive = true
  } = req.body;

  if (!workflowType || !name || !steps) {
    throw new AppError('Workflow type, name, and steps are required', 400);
  }

  // Validate workflow type
  const validTypes = ['LEAVE_REQUEST', 'COMP_OFF_REQUEST', 'LWP_REQUEST'];
  if (!validTypes.includes(workflowType)) {
    throw new AppError(`Invalid workflow type. Must be one of: ${validTypes.join(', ')}`, 400);
  }

  // If setting as default, unset other defaults
  if (isDefault) {
    await prisma.workflowConfiguration.updateMany({
      where: { workflowType, isDefault: true },
      data: { isDefault: false }
    });
  }

  const configuration = await prisma.workflowConfiguration.create({
    data: {
      workflowType,
      name,
      description,
      isDefault,
      priority,
      conditions: conditions ? JSON.stringify(conditions) : null,
      steps: JSON.stringify(steps),
      autoApprovalRules: autoApprovalRules ? JSON.stringify(autoApprovalRules) : null,
      isActive
    }
  });

  res.status(201).json({
    success: true,
    data: {
      ...configuration,
      conditions: configuration.conditions ? JSON.parse(configuration.conditions) : null,
      steps: JSON.parse(configuration.steps),
      autoApprovalRules: configuration.autoApprovalRules ? JSON.parse(configuration.autoApprovalRules) : null
    },
    message: 'Workflow configuration created successfully'
  });
}));

/**
 * @swagger
 * /workflow-configurations/{id}:
 *   patch:
 *     tags:
 *       - Workflow Configurations
 *     summary: Update a workflow configuration
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
    'name', 'description', 'isDefault', 'priority', 'isActive'
  ];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  }

  // Handle JSON fields
  if (req.body.conditions !== undefined) {
    updateData.conditions = req.body.conditions ? JSON.stringify(req.body.conditions) : null;
  }
  if (req.body.steps !== undefined) {
    updateData.steps = JSON.stringify(req.body.steps);
  }
  if (req.body.autoApprovalRules !== undefined) {
    updateData.autoApprovalRules = req.body.autoApprovalRules ? JSON.stringify(req.body.autoApprovalRules) : null;
  }

  // If setting as default, unset other defaults
  if (req.body.isDefault === true) {
    const existing = await prisma.workflowConfiguration.findUnique({ where: { id } });
    if (existing) {
      await prisma.workflowConfiguration.updateMany({
        where: { workflowType: existing.workflowType, isDefault: true, id: { not: id } },
        data: { isDefault: false }
      });
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw new AppError('No valid fields provided for update', 400);
  }

  const configuration = await prisma.workflowConfiguration.update({
    where: { id },
    data: updateData
  });

  res.json({
    success: true,
    data: {
      ...configuration,
      conditions: configuration.conditions ? JSON.parse(configuration.conditions) : null,
      steps: JSON.parse(configuration.steps),
      autoApprovalRules: configuration.autoApprovalRules ? JSON.parse(configuration.autoApprovalRules) : null
    },
    message: 'Workflow configuration updated successfully'
  });
}));

/**
 * @swagger
 * /workflow-configurations/{id}:
 *   delete:
 *     tags:
 *       - Workflow Configurations
 *     summary: Delete a workflow configuration
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Configuration deleted successfully
 */
router.delete('/:id', authorize('HR_ADMIN', 'IT_ADMIN'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await prisma.workflowConfiguration.update({
    where: { id },
    data: { isActive: false }
  });

  res.json({
    success: true,
    message: 'Workflow configuration deleted successfully'
  });
}));

export default router;
