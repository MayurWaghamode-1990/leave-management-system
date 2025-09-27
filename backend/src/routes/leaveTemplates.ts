import express, { Request, Response } from 'express';
import { prisma } from '../index';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authorize, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * /templates:
 *   get:
 *     tags:
 *       - Leave Templates
 *     summary: Get leave templates
 *     description: Retrieve leave templates for the authenticated user
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: includePublic
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include public templates
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or description
 *     responses:
 *       200:
 *         description: Templates retrieved successfully
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
 *                     $ref: '#/components/schemas/LeaveTemplate'
 */

// Get templates
router.get('/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { category, includePublic = 'true', search } = req.query;
    const userId = req.user!.id;

    const where: any = {
      OR: [
        { createdBy: userId }, // User's own templates
        ...(includePublic === 'true' ? [{ isPublic: true, isActive: true, createdBy: { not: userId } }] : [])
      ],
      isActive: true
    };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search as string, mode: 'insensitive' } },
            { description: { contains: search as string, mode: 'insensitive' } }
          ]
        }
      ];
    }

    const templates = await prisma.leaveTemplate.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: [
        { usageCount: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Debug logging
    console.log(`Templates query for user ${userId}:`, {
      includePublic,
      totalFound: templates.length,
      ownTemplates: templates.filter(t => t.createdBy === userId).length,
      publicFromOthers: templates.filter(t => t.createdBy !== userId && t.isPublic).length,
      query: where
    });

    res.json({
      success: true,
      data: templates
    });
  })
);

/**
 * @swagger
 * /templates:
 *   post:
 *     tags:
 *       - Leave Templates
 *     summary: Create leave template
 *     description: Create a new leave template
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
 *               - reason
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Annual Vacation"
 *               description:
 *                 type: string
 *                 example: "Template for annual vacation leave"
 *               category:
 *                 type: string
 *                 example: "VACATION"
 *               leaveType:
 *                 type: string
 *                 example: "EARNED_LEAVE"
 *               duration:
 *                 type: integer
 *                 example: 5
 *               reason:
 *                 type: string
 *                 example: "Annual vacation with family"
 *               isHalfDay:
 *                 type: boolean
 *                 example: false
 *               isPublic:
 *                 type: boolean
 *                 example: false
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["vacation", "family", "annual"]
 *     responses:
 *       201:
 *         description: Template created successfully
 */

// Create template
router.post('/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const {
      name,
      description,
      category = 'PERSONAL',
      leaveType,
      duration,
      reason,
      isHalfDay = false,
      isPublic = false,
      tags = []
    } = req.body;

    // Validate required fields
    if (!name || !leaveType || !reason) {
      throw new AppError('Name, leave type, and reason are required', 400);
    }

    const template = await prisma.leaveTemplate.create({
      data: {
        name,
        description,
        category,
        leaveType,
        duration,
        reason,
        isHalfDay,
        isPublic,
        tags: JSON.stringify(tags),
        createdBy: userId
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: template
    });
  })
);

/**
 * @swagger
 * /templates/{id}:
 *   put:
 *     tags:
 *       - Leave Templates
 *     summary: Update leave template
 *     description: Update an existing leave template (only owner can update)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               leaveType:
 *                 type: string
 *               duration:
 *                 type: integer
 *               reason:
 *                 type: string
 *               isHalfDay:
 *                 type: boolean
 *               isPublic:
 *                 type: boolean
 *               isActive:
 *                 type: boolean
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Template updated successfully
 *       403:
 *         description: Not authorized to update this template
 *       404:
 *         description: Template not found
 */

// Update template
router.put('/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const updateData = req.body;

    // Check if template exists and user owns it
    const existingTemplate = await prisma.leaveTemplate.findUnique({
      where: { id }
    });

    if (!existingTemplate) {
      throw new AppError('Template not found', 404);
    }

    if (existingTemplate.createdBy !== userId) {
      throw new AppError('Not authorized to update this template', 403);
    }

    // Convert tags array to JSON string if provided
    if (updateData.tags && Array.isArray(updateData.tags)) {
      updateData.tags = JSON.stringify(updateData.tags);
    }

    const template = await prisma.leaveTemplate.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Template updated successfully',
      data: template
    });
  })
);

/**
 * @swagger
 * /templates/{id}:
 *   delete:
 *     tags:
 *       - Leave Templates
 *     summary: Delete leave template
 *     description: Delete a leave template (only owner can delete)
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
 *         description: Template deleted successfully
 *       403:
 *         description: Not authorized to delete this template
 *       404:
 *         description: Template not found
 */

// Delete template
router.delete('/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;

    // Check if template exists and user owns it
    const existingTemplate = await prisma.leaveTemplate.findUnique({
      where: { id }
    });

    if (!existingTemplate) {
      throw new AppError('Template not found', 404);
    }

    if (existingTemplate.createdBy !== userId) {
      throw new AppError('Not authorized to delete this template', 403);
    }

    await prisma.leaveTemplate.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  })
);

/**
 * @swagger
 * /templates/{id}/use:
 *   post:
 *     tags:
 *       - Leave Templates
 *     summary: Use leave template
 *     description: Increment usage count and get template data for leave application
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
 *         description: Template data retrieved for use
 *       404:
 *         description: Template not found or not accessible
 */

// Use template (increment usage count and return template data)
router.post('/:id/use',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;

    // Find template that user can access (own or public)
    const template = await prisma.leaveTemplate.findFirst({
      where: {
        id,
        OR: [
          { createdBy: userId },
          { isPublic: true, isActive: true }
        ],
        isActive: true
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!template) {
      throw new AppError('Template not found or not accessible', 404);
    }

    // Increment usage count
    await prisma.leaveTemplate.update({
      where: { id },
      data: {
        usageCount: {
          increment: 1
        }
      }
    });

    // Parse tags if they exist
    const templateData = {
      ...template,
      tags: template.tags ? JSON.parse(template.tags) : []
    };

    res.json({
      success: true,
      data: templateData
    });
  })
);

/**
 * @swagger
 * /templates/categories:
 *   get:
 *     tags:
 *       - Leave Templates
 *     summary: Get template categories
 *     description: Get list of all template categories with counts
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 */

// Get categories
router.get('/categories',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;

    const categories = await prisma.leaveTemplate.groupBy({
      by: ['category'],
      where: {
        OR: [
          { createdBy: userId },
          { isPublic: true }
        ],
        isActive: true
      },
      _count: {
        category: true
      }
    });

    const formattedCategories = categories.map(cat => ({
      name: cat.category,
      count: cat._count.category
    }));

    res.json({
      success: true,
      data: formattedCategories
    });
  })
);

export default router;