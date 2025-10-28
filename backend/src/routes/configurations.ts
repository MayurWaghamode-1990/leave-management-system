import express, { Request, Response } from 'express';
import { prisma } from '../index';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authorize } from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * /configurations:
 *   get:
 *     tags:
 *       - Configurations
 *     summary: Get all system configurations
 *     description: Retrieve all system configurations grouped by category
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category (DEPARTMENT, LOCATION, GENDER, MARITAL_STATUS, DESIGNATION, COUNTRY)
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Return only active configurations
 *     responses:
 *       200:
 *         description: Configurations retrieved successfully
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { category, activeOnly = 'true' } = req.query;

  const where: any = {};

  if (category) {
    where.category = category as string;
  }

  if (activeOnly === 'true') {
    where.isActive = true;
  }

  const configurations = await prisma.systemConfiguration.findMany({
    where,
    orderBy: [
      { category: 'asc' },
      { sortOrder: 'asc' },
      { displayName: 'asc' }
    ]
  });

  // Group by category for easier frontend consumption
  const grouped = configurations.reduce((acc: any, config) => {
    if (!acc[config.category]) {
      acc[config.category] = [];
    }
    acc[config.category].push({
      id: config.id,
      value: config.value,
      displayName: config.displayName,
      isActive: config.isActive,
      sortOrder: config.sortOrder,
      metadata: config.metadata ? JSON.parse(config.metadata) : null
    });
    return acc;
  }, {});

  res.json({
    success: true,
    data: grouped
  });
}));

/**
 * @swagger
 * /configurations/{category}:
 *   get:
 *     tags:
 *       - Configurations
 *     summary: Get configurations by category
 *     description: Retrieve all configurations for a specific category
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         description: Category name
 *     responses:
 *       200:
 *         description: Configurations retrieved successfully
 */
router.get('/:category', asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.params;

  const configurations = await prisma.systemConfiguration.findMany({
    where: {
      category: category.toUpperCase(),
      isActive: true
    },
    orderBy: [
      { sortOrder: 'asc' },
      { displayName: 'asc' }
    ]
  });

  res.json({
    success: true,
    data: configurations.map(config => ({
      id: config.id,
      value: config.value,
      displayName: config.displayName,
      sortOrder: config.sortOrder,
      metadata: config.metadata ? JSON.parse(config.metadata) : null
    }))
  });
}));

/**
 * @swagger
 * /configurations:
 *   post:
 *     tags:
 *       - Configurations
 *     summary: Create a new configuration
 *     description: Create a new system configuration (HR/IT Admin only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category
 *               - value
 *               - displayName
 *             properties:
 *               category:
 *                 type: string
 *               value:
 *                 type: string
 *               displayName:
 *                 type: string
 *               sortOrder:
 *                 type: number
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Configuration created successfully
 */
router.post('/', authorize(['HR_ADMIN', 'IT_ADMIN']), asyncHandler(async (req: Request, res: Response) => {
  const { category, value, displayName, sortOrder = 0, metadata } = req.body;

  if (!category || !value || !displayName) {
    throw new AppError('Category, value, and displayName are required', 400);
  }

  // Validate category
  const validCategories = ['DEPARTMENT', 'LOCATION', 'GENDER', 'MARITAL_STATUS', 'DESIGNATION', 'COUNTRY'];
  if (!validCategories.includes(category.toUpperCase())) {
    throw new AppError(`Invalid category. Must be one of: ${validCategories.join(', ')}`, 400);
  }

  // Check for duplicates
  const existing = await prisma.systemConfiguration.findUnique({
    where: {
      category_value: {
        category: category.toUpperCase(),
        value: value
      }
    }
  });

  if (existing) {
    throw new AppError('Configuration with this category and value already exists', 400);
  }

  const configuration = await prisma.systemConfiguration.create({
    data: {
      category: category.toUpperCase(),
      value,
      displayName,
      sortOrder,
      metadata: metadata ? JSON.stringify(metadata) : null
    }
  });

  res.status(201).json({
    success: true,
    data: configuration,
    message: 'Configuration created successfully'
  });
}));

/**
 * @swagger
 * /configurations/{id}:
 *   patch:
 *     tags:
 *       - Configurations
 *     summary: Update a configuration
 *     description: Update an existing system configuration (HR/IT Admin only)
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
 *               sortOrder:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Configuration updated successfully
 */
router.patch('/:id', authorize(['HR_ADMIN', 'IT_ADMIN']), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { displayName, sortOrder, isActive, metadata } = req.body;

  const updateData: any = {};

  if (displayName !== undefined) updateData.displayName = displayName;
  if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (metadata !== undefined) updateData.metadata = JSON.stringify(metadata);

  const configuration = await prisma.systemConfiguration.update({
    where: { id },
    data: updateData
  });

  res.json({
    success: true,
    data: configuration,
    message: 'Configuration updated successfully'
  });
}));

/**
 * @swagger
 * /configurations/{id}:
 *   delete:
 *     tags:
 *       - Configurations
 *     summary: Delete a configuration
 *     description: Delete a system configuration (HR/IT Admin only)
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

  await prisma.systemConfiguration.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: 'Configuration deleted successfully'
  });
}));

export default router;
