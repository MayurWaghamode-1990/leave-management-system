import express, { Request, Response } from 'express';
import { prisma } from '../index';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authorize } from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * /bulk-action-configurations:
 *   get:
 *     tags:
 *       - Bulk Action Configurations
 *     summary: Get all bulk action configurations
 *     description: Retrieve all bulk action configurations with optional filters
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: actionType
 *         schema:
 *           type: string
 *         description: Filter by action type (APPROVE, REJECT, CANCEL, EXPORT, EMAIL, STATUS_UPDATE)
 *       - in: query
 *         name: enabled
 *         schema:
 *           type: boolean
 *         description: Filter by enabled status
 *     responses:
 *       200:
 *         description: Bulk action configurations retrieved successfully
 */
router.get('/', authorize('HR_ADMIN', 'IT_ADMIN'), asyncHandler(async (req: Request, res: Response) => {
  const { actionType, enabled } = req.query;

  const where: any = {};

  if (actionType) where.actionType = actionType as string;
  if (enabled !== undefined) where.enabled = enabled === 'true';

  const configurations = await prisma.bulkActionConfiguration.findMany({
    where,
    orderBy: [
      { actionType: 'asc' }
    ]
  });

  // Parse JSON fields
  const parsedConfigurations = configurations.map(config => ({
    ...config,
    allowedRoles: config.allowedRoles ? JSON.parse(config.allowedRoles) : null,
    validationRules: config.validationRules ? JSON.parse(config.validationRules) : null,
    confirmationConfig: config.confirmationConfig ? JSON.parse(config.confirmationConfig) : null,
    auditConfig: config.auditConfig ? JSON.parse(config.auditConfig) : null
  }));

  res.json({
    success: true,
    data: parsedConfigurations
  });
}));

/**
 * @swagger
 * /bulk-action-configurations/{id}:
 *   get:
 *     tags:
 *       - Bulk Action Configurations
 *     summary: Get specific bulk action configuration
 *     description: Retrieve a specific bulk action configuration by ID
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
router.get('/:id', authorize('HR_ADMIN', 'IT_ADMIN'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const configuration = await prisma.bulkActionConfiguration.findUnique({
    where: { id }
  });

  if (!configuration) {
    throw new AppError('Bulk action configuration not found', 404);
  }

  res.json({
    success: true,
    data: {
      ...configuration,
      allowedRoles: configuration.allowedRoles ? JSON.parse(configuration.allowedRoles) : null,
      validationRules: configuration.validationRules ? JSON.parse(configuration.validationRules) : null,
      confirmationConfig: configuration.confirmationConfig ? JSON.parse(configuration.confirmationConfig) : null,
      auditConfig: configuration.auditConfig ? JSON.parse(configuration.auditConfig) : null
    }
  });
}));

/**
 * @swagger
 * /bulk-action-configurations/action/{actionType}:
 *   get:
 *     tags:
 *       - Bulk Action Configurations
 *     summary: Get configuration by action type
 *     description: Retrieve configuration for a specific action type
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: actionType
 *         required: true
 *         schema:
 *           type: string
 *         description: Action type (APPROVE, REJECT, CANCEL, EXPORT, EMAIL, STATUS_UPDATE)
 *     responses:
 *       200:
 *         description: Configuration retrieved successfully
 *       404:
 *         description: Configuration not found
 */
router.get('/action/:actionType', authorize('HR_ADMIN', 'IT_ADMIN'), asyncHandler(async (req: Request, res: Response) => {
  const { actionType } = req.params;

  const configuration = await prisma.bulkActionConfiguration.findUnique({
    where: { actionType: actionType.toUpperCase() }
  });

  if (!configuration) {
    throw new AppError('Bulk action configuration not found', 404);
  }

  res.json({
    success: true,
    data: {
      ...configuration,
      allowedRoles: configuration.allowedRoles ? JSON.parse(configuration.allowedRoles) : null,
      validationRules: configuration.validationRules ? JSON.parse(configuration.validationRules) : null,
      confirmationConfig: configuration.confirmationConfig ? JSON.parse(configuration.confirmationConfig) : null,
      auditConfig: configuration.auditConfig ? JSON.parse(configuration.auditConfig) : null
    }
  });
}));

/**
 * @swagger
 * /bulk-action-configurations:
 *   post:
 *     tags:
 *       - Bulk Action Configurations
 *     summary: Create a new bulk action configuration
 *     description: Create a new bulk action configuration (HR/IT Admin only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - actionType
 *               - allowedRoles
 *               - auditConfig
 *             properties:
 *               actionType:
 *                 type: string
 *                 enum: [APPROVE, REJECT, CANCEL, EXPORT, EMAIL, STATUS_UPDATE]
 *               enabled:
 *                 type: boolean
 *               allowedRoles:
 *                 type: array
 *               maxItemsPerAction:
 *                 type: number
 *               requiresConfirmation:
 *                 type: boolean
 *               requiresReason:
 *                 type: boolean
 *               validationRules:
 *                 type: object
 *               confirmationConfig:
 *                 type: object
 *               auditConfig:
 *                 type: object
 *               executionMode:
 *                 type: string
 *                 enum: [SYNCHRONOUS, ASYNCHRONOUS, BATCHED]
 *               batchSize:
 *                 type: number
 *               timeoutSeconds:
 *                 type: number
 *               allowRollback:
 *                 type: boolean
 *               rollbackWindowMinutes:
 *                 type: number
 *     responses:
 *       201:
 *         description: Configuration created successfully
 */
router.post('/', authorize('HR_ADMIN', 'IT_ADMIN'), asyncHandler(async (req: Request, res: Response) => {
  const {
    actionType,
    enabled = true,
    allowedRoles,
    maxItemsPerAction = 100,
    requiresConfirmation = true,
    requiresReason = false,
    validationRules,
    confirmationConfig,
    auditConfig,
    executionMode = 'SYNCHRONOUS',
    batchSize = 50,
    timeoutSeconds = 300,
    allowRollback = false,
    rollbackWindowMinutes = 60
  } = req.body;

  if (!actionType || !allowedRoles || !auditConfig) {
    throw new AppError('Action type, allowed roles, and audit config are required', 400);
  }

  // Validate action type
  const validActionTypes = ['APPROVE', 'REJECT', 'CANCEL', 'EXPORT', 'EMAIL', 'STATUS_UPDATE'];
  if (!validActionTypes.includes(actionType.toUpperCase())) {
    throw new AppError(`Invalid action type. Must be one of: ${validActionTypes.join(', ')}`, 400);
  }

  // Validate execution mode
  const validExecutionModes = ['SYNCHRONOUS', 'ASYNCHRONOUS', 'BATCHED'];
  if (!validExecutionModes.includes(executionMode)) {
    throw new AppError(`Invalid execution mode. Must be one of: ${validExecutionModes.join(', ')}`, 400);
  }

  // Check for duplicates
  const existing = await prisma.bulkActionConfiguration.findUnique({
    where: { actionType: actionType.toUpperCase() }
  });

  if (existing) {
    throw new AppError('Bulk action configuration for this action type already exists', 400);
  }

  const configuration = await prisma.bulkActionConfiguration.create({
    data: {
      actionType: actionType.toUpperCase(),
      enabled,
      allowedRoles: JSON.stringify(allowedRoles),
      maxItemsPerAction,
      requiresConfirmation,
      requiresReason,
      validationRules: validationRules ? JSON.stringify(validationRules) : null,
      confirmationConfig: confirmationConfig ? JSON.stringify(confirmationConfig) : null,
      auditConfig: JSON.stringify(auditConfig),
      executionMode,
      batchSize,
      timeoutSeconds,
      allowRollback,
      rollbackWindowMinutes
    }
  });

  res.status(201).json({
    success: true,
    data: {
      ...configuration,
      allowedRoles: JSON.parse(configuration.allowedRoles),
      validationRules: configuration.validationRules ? JSON.parse(configuration.validationRules) : null,
      confirmationConfig: configuration.confirmationConfig ? JSON.parse(configuration.confirmationConfig) : null,
      auditConfig: JSON.parse(configuration.auditConfig)
    },
    message: 'Bulk action configuration created successfully'
  });
}));

/**
 * @swagger
 * /bulk-action-configurations/{id}:
 *   patch:
 *     tags:
 *       - Bulk Action Configurations
 *     summary: Update a bulk action configuration
 *     description: Update an existing bulk action configuration (HR/IT Admin only)
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
 *     responses:
 *       200:
 *         description: Configuration updated successfully
 */
router.patch('/:id', authorize('HR_ADMIN', 'IT_ADMIN'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData: any = {};

  const allowedFields = [
    'enabled', 'maxItemsPerAction', 'requiresConfirmation', 'requiresReason',
    'executionMode', 'batchSize', 'timeoutSeconds', 'allowRollback', 'rollbackWindowMinutes'
  ];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  }

  // Handle JSON fields
  if (req.body.allowedRoles !== undefined) {
    updateData.allowedRoles = JSON.stringify(req.body.allowedRoles);
  }
  if (req.body.validationRules !== undefined) {
    updateData.validationRules = JSON.stringify(req.body.validationRules);
  }
  if (req.body.confirmationConfig !== undefined) {
    updateData.confirmationConfig = JSON.stringify(req.body.confirmationConfig);
  }
  if (req.body.auditConfig !== undefined) {
    updateData.auditConfig = JSON.stringify(req.body.auditConfig);
  }

  if (Object.keys(updateData).length === 0) {
    throw new AppError('No valid fields provided for update', 400);
  }

  const configuration = await prisma.bulkActionConfiguration.update({
    where: { id },
    data: updateData
  });

  res.json({
    success: true,
    data: {
      ...configuration,
      allowedRoles: configuration.allowedRoles ? JSON.parse(configuration.allowedRoles) : null,
      validationRules: configuration.validationRules ? JSON.parse(configuration.validationRules) : null,
      confirmationConfig: configuration.confirmationConfig ? JSON.parse(configuration.confirmationConfig) : null,
      auditConfig: configuration.auditConfig ? JSON.parse(configuration.auditConfig) : null
    },
    message: 'Bulk action configuration updated successfully'
  });
}));

/**
 * @swagger
 * /bulk-action-configurations/{id}/toggle:
 *   patch:
 *     tags:
 *       - Bulk Action Configurations
 *     summary: Toggle bulk action configuration enabled status
 *     description: Enable or disable a bulk action configuration (HR/IT Admin only)
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
 *         description: Configuration toggled successfully
 */
router.patch('/:id/toggle', authorize('HR_ADMIN', 'IT_ADMIN'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const existing = await prisma.bulkActionConfiguration.findUnique({
    where: { id }
  });

  if (!existing) {
    throw new AppError('Bulk action configuration not found', 404);
  }

  const configuration = await prisma.bulkActionConfiguration.update({
    where: { id },
    data: { enabled: !existing.enabled }
  });

  res.json({
    success: true,
    data: {
      ...configuration,
      allowedRoles: configuration.allowedRoles ? JSON.parse(configuration.allowedRoles) : null,
      validationRules: configuration.validationRules ? JSON.parse(configuration.validationRules) : null,
      confirmationConfig: configuration.confirmationConfig ? JSON.parse(configuration.confirmationConfig) : null,
      auditConfig: configuration.auditConfig ? JSON.parse(configuration.auditConfig) : null
    },
    message: `Bulk action configuration ${configuration.enabled ? 'enabled' : 'disabled'} successfully`
  });
}));

/**
 * @swagger
 * /bulk-action-configurations/{id}:
 *   delete:
 *     tags:
 *       - Bulk Action Configurations
 *     summary: Delete a bulk action configuration
 *     description: Delete a bulk action configuration (HR/IT Admin only). This is a soft delete (sets enabled to false).
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
router.delete('/:id', authorize('HR_ADMIN', 'IT_ADMIN'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await prisma.bulkActionConfiguration.update({
    where: { id },
    data: { enabled: false }
  });

  res.json({
    success: true,
    message: 'Bulk action configuration deleted successfully'
  });
}));

/**
 * @swagger
 * /bulk-action-configurations/{id}/validate:
 *   post:
 *     tags:
 *       - Bulk Action Configurations
 *     summary: Validate bulk action request
 *     description: Validate if a bulk action request meets the configured rules
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
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 description: Array of items to process
 *               reason:
 *                 type: string
 *                 description: Reason for the bulk action (if required)
 *     responses:
 *       200:
 *         description: Validation completed
 */
router.post('/:id/validate', authorize('HR_ADMIN', 'IT_ADMIN'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { items, reason } = req.body;

  if (!items || !Array.isArray(items)) {
    throw new AppError('Items array is required', 400);
  }

  const configuration = await prisma.bulkActionConfiguration.findUnique({
    where: { id }
  });

  if (!configuration) {
    throw new AppError('Bulk action configuration not found', 404);
  }

  const validationErrors: string[] = [];
  const warnings: string[] = [];

  // Check if enabled
  if (!configuration.enabled) {
    throw new AppError('This bulk action is currently disabled', 403);
  }

  // Check item count
  if (items.length > configuration.maxItemsPerAction) {
    validationErrors.push(`Cannot process more than ${configuration.maxItemsPerAction} items at once. You provided ${items.length} items.`);
  }

  // Check if reason is required
  if (configuration.requiresReason && (!reason || reason.trim() === '')) {
    validationErrors.push('Reason is required for this bulk action');
  }

  // Apply validation rules if configured
  if (configuration.validationRules) {
    const rules = JSON.parse(configuration.validationRules);

    // Example validation: check if all items have the same leave type
    if (rules.sameLeaveType && items.length > 0) {
      const leaveTypes = new Set(items.map((item: any) => item.leaveType));
      if (leaveTypes.size > 1) {
        validationErrors.push('All items must have the same leave type');
      }
    }

    // Example validation: check if all items are from the same department
    if (rules.sameDepartment && items.length > 0) {
      const departments = new Set(items.map((item: any) => item.department));
      if (departments.size > 1) {
        warnings.push('Items are from different departments. This may require additional review.');
      }
    }
  }

  // Check confirmation requirements
  const confirmationConfig = configuration.confirmationConfig ? JSON.parse(configuration.confirmationConfig) : null;
  if (confirmationConfig && confirmationConfig.warningThreshold && items.length >= confirmationConfig.warningThreshold) {
    warnings.push(`You are about to process ${items.length} items. Please review carefully before proceeding.`);
  }

  const isValid = validationErrors.length === 0;

  res.json({
    success: true,
    data: {
      isValid,
      canProceed: isValid,
      errors: validationErrors,
      warnings,
      itemCount: items.length,
      maxItemsAllowed: configuration.maxItemsPerAction,
      requiresConfirmation: configuration.requiresConfirmation,
      estimatedProcessingTime: Math.ceil(items.length / configuration.batchSize) * 5 // rough estimate: 5 seconds per batch
    }
  });
}));

export default router;
