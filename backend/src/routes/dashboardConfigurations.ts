import express, { Request, Response } from 'express';
import { prisma } from '../index';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authorize } from '../middleware/auth';

const router = express.Router();

// ==================== Dashboard Configurations ====================

/**
 * @swagger
 * /dashboard-configurations:
 *   get:
 *     tags:
 *       - Dashboard Configurations
 *     summary: Get dashboard configurations
 *     description: Retrieve dashboard configurations filtered by user/role
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by role
 *       - in: query
 *         name: isDefault
 *         schema:
 *           type: boolean
 *         description: Filter by default configurations
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Return only active configurations
 *     responses:
 *       200:
 *         description: Dashboard configurations retrieved successfully
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { userId, role, isDefault, activeOnly = 'true' } = req.query;

  const where: any = {};

  if (userId) where.userId = userId as string;
  if (role) where.role = role as string;
  if (isDefault !== undefined) where.isDefault = isDefault === 'true';
  if (activeOnly === 'true') where.isActive = true;

  const configurations = await prisma.dashboardConfiguration.findMany({
    where,
    orderBy: [
      { isDefault: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  // Parse JSON fields
  const parsedConfigurations = configurations.map(config => ({
    ...config,
    layoutConfig: config.layoutConfig ? JSON.parse(config.layoutConfig) : null
  }));

  res.json({
    success: true,
    data: parsedConfigurations
  });
}));

// ==================== Widget Definitions (Must be before /:id route) ====================

/**
 * @swagger
 * /dashboard-configurations/widgets:
 *   get:
 *     tags:
 *       - Dashboard Widgets
 *     summary: Get all widget definitions
 *     description: Retrieve all available widget definitions
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category (PERSONAL, TEAM, ANALYTICS, ADMIN)
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Return only active widgets
 *     responses:
 *       200:
 *         description: Widget definitions retrieved successfully
 */
router.get('/widgets', asyncHandler(async (req: Request, res: Response) => {
  const { category, activeOnly = 'true' } = req.query;

  const where: any = {};

  if (category) where.category = category as string;
  if (activeOnly === 'true') where.isActive = true;

  const widgets = await prisma.widgetDefinition.findMany({
    where,
    orderBy: [
      { category: 'asc' },
      { displayName: 'asc' }
    ]
  });

  // Parse JSON fields
  const parsedWidgets = widgets.map(widget => ({
    ...widget,
    configurableProperties: widget.configurableProperties ? JSON.parse(widget.configurableProperties) : null,
    requiredPermissions: widget.requiredPermissions ? JSON.parse(widget.requiredPermissions) : null,
    allowedRoles: widget.allowedRoles ? JSON.parse(widget.allowedRoles) : null
  }));

  res.json({
    success: true,
    data: parsedWidgets
  });
}));

/**
 * @swagger
 * /dashboard-configurations/widgets/{id}:
 *   get:
 *     tags:
 *       - Dashboard Widgets
 *     summary: Get specific widget definition
 *     description: Retrieve a specific widget definition by ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Widget ID
 *     responses:
 *       200:
 *         description: Widget definition retrieved successfully
 *       404:
 *         description: Widget not found
 */
router.get('/widgets/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const widget = await prisma.widgetDefinition.findUnique({
    where: { id }
  });

  if (!widget) {
    throw new AppError('Widget definition not found', 404);
  }

  res.json({
    success: true,
    data: {
      ...widget,
      configurableProperties: widget.configurableProperties ? JSON.parse(widget.configurableProperties) : null,
      requiredPermissions: widget.requiredPermissions ? JSON.parse(widget.requiredPermissions) : null,
      allowedRoles: widget.allowedRoles ? JSON.parse(widget.allowedRoles) : null
    }
  });
}));

/**
 * @swagger
 * /dashboard-configurations/widgets:
 *   post:
 *     tags:
 *       - Dashboard Widgets
 *     summary: Create a new widget definition
 *     description: Create a new widget definition (HR/IT Admin only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - widgetType
 *               - displayName
 *               - category
 *             properties:
 *               widgetType:
 *                 type: string
 *               displayName:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               icon:
 *                 type: string
 *               defaultWidth:
 *                 type: number
 *               defaultHeight:
 *                 type: number
 *               minWidth:
 *                 type: number
 *               minHeight:
 *                 type: number
 *               maxWidth:
 *                 type: number
 *               maxHeight:
 *                 type: number
 *               configurableProperties:
 *                 type: object
 *               dataSourceEndpoint:
 *                 type: string
 *               refreshIntervalSeconds:
 *                 type: number
 *               requiredPermissions:
 *                 type: array
 *               allowedRoles:
 *                 type: array
 *               isCustom:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Widget definition created successfully
 */
router.post('/widgets', authorize(['HR_ADMIN', 'IT_ADMIN']), asyncHandler(async (req: Request, res: Response) => {
  const {
    widgetType,
    displayName,
    description,
    category,
    icon,
    defaultWidth = 4,
    defaultHeight = 3,
    minWidth = 2,
    minHeight = 2,
    maxWidth = 12,
    maxHeight = 8,
    configurableProperties,
    dataSourceEndpoint,
    refreshIntervalSeconds = 0,
    requiredPermissions,
    allowedRoles,
    isCustom = false
  } = req.body;

  if (!widgetType || !displayName || !category) {
    throw new AppError('Widget type, display name, and category are required', 400);
  }

  // Check for duplicates
  const existing = await prisma.widgetDefinition.findUnique({
    where: { widgetType }
  });

  if (existing) {
    throw new AppError('Widget type already exists', 400);
  }

  const widget = await prisma.widgetDefinition.create({
    data: {
      widgetType,
      displayName,
      description,
      category,
      icon,
      defaultWidth,
      defaultHeight,
      minWidth,
      minHeight,
      maxWidth,
      maxHeight,
      configurableProperties: configurableProperties ? JSON.stringify(configurableProperties) : null,
      dataSourceEndpoint,
      refreshIntervalSeconds,
      requiredPermissions: requiredPermissions ? JSON.stringify(requiredPermissions) : null,
      allowedRoles: allowedRoles ? JSON.stringify(allowedRoles) : null,
      isCustom
    }
  });

  res.status(201).json({
    success: true,
    data: {
      ...widget,
      configurableProperties: widget.configurableProperties ? JSON.parse(widget.configurableProperties) : null,
      requiredPermissions: widget.requiredPermissions ? JSON.parse(widget.requiredPermissions) : null,
      allowedRoles: widget.allowedRoles ? JSON.parse(widget.allowedRoles) : null
    },
    message: 'Widget definition created successfully'
  });
}));

/**
 * @swagger
 * /dashboard-configurations/widgets/{id}:
 *   patch:
 *     tags:
 *       - Dashboard Widgets
 *     summary: Update a widget definition
 *     description: Update an existing widget definition (HR/IT Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Widget ID
 *     responses:
 *       200:
 *         description: Widget definition updated successfully
 */
router.patch('/widgets/:id', authorize(['HR_ADMIN', 'IT_ADMIN']), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData: any = {};

  const allowedFields = [
    'displayName', 'description', 'icon', 'defaultWidth', 'defaultHeight',
    'minWidth', 'minHeight', 'maxWidth', 'maxHeight', 'dataSourceEndpoint',
    'refreshIntervalSeconds', 'isCustom', 'isActive'
  ];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  }

  // Handle JSON fields
  if (req.body.configurableProperties !== undefined) {
    updateData.configurableProperties = JSON.stringify(req.body.configurableProperties);
  }
  if (req.body.requiredPermissions !== undefined) {
    updateData.requiredPermissions = JSON.stringify(req.body.requiredPermissions);
  }
  if (req.body.allowedRoles !== undefined) {
    updateData.allowedRoles = JSON.stringify(req.body.allowedRoles);
  }

  if (Object.keys(updateData).length === 0) {
    throw new AppError('No valid fields provided for update', 400);
  }

  const widget = await prisma.widgetDefinition.update({
    where: { id },
    data: updateData
  });

  res.json({
    success: true,
    data: {
      ...widget,
      configurableProperties: widget.configurableProperties ? JSON.parse(widget.configurableProperties) : null,
      requiredPermissions: widget.requiredPermissions ? JSON.parse(widget.requiredPermissions) : null,
      allowedRoles: widget.allowedRoles ? JSON.parse(widget.allowedRoles) : null
    },
    message: 'Widget definition updated successfully'
  });
}));

/**
 * @swagger
 * /dashboard-configurations/widgets/{id}:
 *   delete:
 *     tags:
 *       - Dashboard Widgets
 *     summary: Delete a widget definition
 *     description: Delete a widget definition (HR/IT Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Widget ID
 *     responses:
 *       200:
 *         description: Widget definition deleted successfully
 */
router.delete('/widgets/:id', authorize(['HR_ADMIN', 'IT_ADMIN']), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await prisma.widgetDefinition.update({
    where: { id },
    data: { isActive: false }
  });

  res.json({
    success: true,
    message: 'Widget definition deleted successfully'
  });
}));

// ==================== Dashboard Configuration ID Routes ====================

/**
 * @swagger
 * /dashboard-configurations/{id}:
 *   get:
 *     tags:
 *       - Dashboard Configurations
 *     summary: Get specific dashboard configuration
 *     description: Retrieve a specific dashboard configuration by ID
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

  const configuration = await prisma.dashboardConfiguration.findUnique({
    where: { id }
  });

  if (!configuration) {
    throw new AppError('Dashboard configuration not found', 404);
  }

  res.json({
    success: true,
    data: {
      ...configuration,
      layoutConfig: configuration.layoutConfig ? JSON.parse(configuration.layoutConfig) : null
    }
  });
}));

/**
 * @swagger
 * /dashboard-configurations:
 *   post:
 *     tags:
 *       - Dashboard Configurations
 *     summary: Create a new dashboard configuration
 *     description: Create a new dashboard configuration (HR/IT Admin only)
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
 *               - layoutConfig
 *             properties:
 *               userId:
 *                 type: string
 *               role:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               layoutConfig:
 *                 type: object
 *               colorScheme:
 *                 type: string
 *                 enum: [LIGHT, DARK, AUTO]
 *               primaryColor:
 *                 type: string
 *               accentColor:
 *                 type: string
 *               defaultView:
 *                 type: string
 *                 enum: [GRID, LIST]
 *               compactMode:
 *                 type: boolean
 *               showAnimations:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Configuration created successfully
 */
router.post('/', authorize(['HR_ADMIN', 'IT_ADMIN']), asyncHandler(async (req: Request, res: Response) => {
  const {
    userId,
    role,
    isDefault = false,
    name,
    description,
    layoutConfig,
    colorScheme = 'LIGHT',
    primaryColor = '#3B82F6',
    accentColor = '#10B981',
    defaultView = 'GRID',
    compactMode = false,
    showAnimations = true
  } = req.body;

  if (!name || !layoutConfig) {
    throw new AppError('Name and layout configuration are required', 400);
  }

  // If setting as default, unset other defaults for the same role/user
  if (isDefault) {
    const updateWhere: any = { isDefault: true };
    if (userId) updateWhere.userId = userId;
    if (role) updateWhere.role = role;

    await prisma.dashboardConfiguration.updateMany({
      where: updateWhere,
      data: { isDefault: false }
    });
  }

  const configuration = await prisma.dashboardConfiguration.create({
    data: {
      userId,
      role,
      isDefault,
      name,
      description,
      layoutConfig: JSON.stringify(layoutConfig),
      colorScheme,
      primaryColor,
      accentColor,
      defaultView,
      compactMode,
      showAnimations
    }
  });

  res.status(201).json({
    success: true,
    data: {
      ...configuration,
      layoutConfig: JSON.parse(configuration.layoutConfig)
    },
    message: 'Dashboard configuration created successfully'
  });
}));

/**
 * @swagger
 * /dashboard-configurations/{id}:
 *   patch:
 *     tags:
 *       - Dashboard Configurations
 *     summary: Update a dashboard configuration
 *     description: Update an existing dashboard configuration (HR/IT Admin only)
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
router.patch('/:id', authorize(['HR_ADMIN', 'IT_ADMIN']), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData: any = {};

  const allowedFields = [
    'isDefault', 'name', 'description', 'colorScheme', 'primaryColor',
    'accentColor', 'defaultView', 'compactMode', 'showAnimations', 'isActive'
  ];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  }

  if (req.body.layoutConfig !== undefined) {
    updateData.layoutConfig = JSON.stringify(req.body.layoutConfig);
  }

  if (Object.keys(updateData).length === 0) {
    throw new AppError('No valid fields provided for update', 400);
  }

  // If setting as default, unset other defaults
  if (updateData.isDefault) {
    const existingConfig = await prisma.dashboardConfiguration.findUnique({
      where: { id }
    });

    if (existingConfig) {
      const updateWhere: any = { isDefault: true, id: { not: id } };
      if (existingConfig.userId) updateWhere.userId = existingConfig.userId;
      if (existingConfig.role) updateWhere.role = existingConfig.role;

      await prisma.dashboardConfiguration.updateMany({
        where: updateWhere,
        data: { isDefault: false }
      });
    }
  }

  const configuration = await prisma.dashboardConfiguration.update({
    where: { id },
    data: updateData
  });

  res.json({
    success: true,
    data: {
      ...configuration,
      layoutConfig: configuration.layoutConfig ? JSON.parse(configuration.layoutConfig) : null
    },
    message: 'Dashboard configuration updated successfully'
  });
}));

/**
 * @swagger
 * /dashboard-configurations/{id}:
 *   delete:
 *     tags:
 *       - Dashboard Configurations
 *     summary: Delete a dashboard configuration
 *     description: Delete a dashboard configuration (HR/IT Admin only)
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

  await prisma.dashboardConfiguration.update({
    where: { id },
    data: { isActive: false }
  });

  res.json({
    success: true,
    message: 'Dashboard configuration deleted successfully'
  });
}));

export default router;
