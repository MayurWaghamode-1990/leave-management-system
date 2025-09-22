import express, { Request, Response } from 'express';
import { prisma } from '../index';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authorize, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * /holidays:
 *   get:
 *     tags:
 *       - Holidays
 *     summary: Get holidays
 *     description: Retrieve holidays for a specific year and location
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *           example: 2024
 *         description: Year to filter holidays (defaults to current year)
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter holidays by location
 *         example: "India"
 *     responses:
 *       200:
 *         description: Holidays retrieved successfully
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
 *                     $ref: '#/components/schemas/Holiday'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

// Get holidays
router.get('/', 
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { year = new Date().getFullYear(), location } = req.query;
    
    const startDate = new Date(Number(year), 0, 1);
    const endDate = new Date(Number(year), 11, 31);
    
    const where: any = {
      date: {
        gte: startDate,
        lte: endDate
      }
    };
    
    if (location) where.location = location;

    const holidays = await prisma.holiday.findMany({
      where,
      orderBy: { date: 'asc' }
    });

    res.json({
      success: true,
      data: holidays
    });
  })
);

/**
 * @swagger
 * /holidays:
 *   post:
 *     tags:
 *       - Holidays
 *     summary: Create new holiday
 *     description: Create a new holiday entry for the company calendar (HR Admin only)
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
 *               - date
 *               - location
 *               - region
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Independence Day"
 *                 description: "Name of the holiday"
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-08-15"
 *                 description: "Holiday date"
 *               location:
 *                 type: string
 *                 example: "India"
 *                 description: "Location where holiday applies"
 *               region:
 *                 type: string
 *                 enum: [INDIA, USA]
 *                 example: "INDIA"
 *                 description: "Regional classification"
 *               isOptional:
 *                 type: boolean
 *                 example: false
 *                 description: "Whether the holiday is optional"
 *               type:
 *                 type: string
 *                 enum: [NATIONAL, REGIONAL, COMPANY]
 *                 example: "NATIONAL"
 *                 description: "Type of holiday"
 *     responses:
 *       201:
 *         description: Holiday created successfully
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
 *                   example: "Holiday created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Holiday'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

// Create holiday (HR Admin only)
router.post('/', 
  authorize('HR_ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const holidayData = req.body;
    
    const holiday = await prisma.holiday.create({
      data: {
        ...holidayData,
        date: new Date(holidayData.date)
      }
    });

    res.status(201).json({
      success: true,
      message: 'Holiday created successfully',
      data: holiday
    });
  })
);

export default router;