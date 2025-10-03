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

// Get upcoming holidays for dashboard
router.get('/upcoming',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;

    try {
      // Get user details for location filtering
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { location: true }
      });

      const today = new Date();
      const startOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);

      // Get holidays from database
      const whereClause: any = {
        date: {
          gte: today
        }
      };

      // Filter by location if user has one
      if (user?.location) {
        whereClause.location = user.location;
      }

      const allHolidays = await prisma.holiday.findMany({
        where: whereClause,
        orderBy: { date: 'asc' }
      });

      // Transform holidays and calculate days until
      const transformedHolidays = allHolidays.map(holiday => {
        const holidayDate = new Date(holiday.date);
        const daysUntil = Math.ceil((holidayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        return {
          id: holiday.id,
          name: holiday.name,
          date: holiday.date.toISOString(),
          description: holiday.description,
          type: holiday.type || 'NATIONAL',
          location: holiday.location,
          isOptional: holiday.isOptional || false,
          daysUntil: Math.max(0, daysUntil)
        };
      });

      // Categorize holidays
      const upcoming = transformedHolidays.slice(0, 10); // Limit to next 10 holidays

      const thisMonth = transformedHolidays.filter(holiday => {
        const holidayDate = new Date(holiday.date);
        return holidayDate >= startOfThisMonth && holidayDate < startOfNextMonth;
      });

      const nextMonth = transformedHolidays.filter(holiday => {
        const holidayDate = new Date(holiday.date);
        return holidayDate >= startOfNextMonth && holidayDate <= endOfNextMonth;
      });

      // Find next holiday
      const nextHoliday = transformedHolidays.length > 0 ? transformedHolidays[0] : undefined;

      const summary = {
        totalUpcoming: transformedHolidays.length,
        thisMonthCount: thisMonth.length,
        nextMonthCount: nextMonth.length,
        nextHoliday
      };

      res.json({
        success: true,
        message: 'Upcoming holidays retrieved successfully',
        data: {
          upcoming,
          thisMonth,
          nextMonth,
          summary
        }
      });

    } catch (error) {
      console.error('Error fetching upcoming holidays:', error);
      throw new AppError('Failed to fetch upcoming holidays', 500);
    }
  })
);

/**
 * @swagger
 * /holidays/{id}:
 *   put:
 *     tags:
 *       - Holidays
 *     summary: Update holiday
 *     description: Update an existing holiday entry (HR Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Holiday ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Independence Day"
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-08-15"
 *               location:
 *                 type: string
 *                 example: "India"
 *               region:
 *                 type: string
 *                 enum: [INDIA, USA]
 *                 example: "INDIA"
 *               isOptional:
 *                 type: boolean
 *                 example: false
 *               type:
 *                 type: string
 *                 enum: [NATIONAL, REGIONAL, COMPANY]
 *                 example: "NATIONAL"
 *               description:
 *                 type: string
 *                 example: "National holiday celebrating independence"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Holiday updated successfully
 *       404:
 *         description: Holiday not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

// Update holiday (HR Admin only)
router.put('/:id',
  authorize('HR_ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    // Check if holiday exists
    const existingHoliday = await prisma.holiday.findUnique({
      where: { id }
    });

    if (!existingHoliday) {
      throw new AppError('Holiday not found', 404);
    }

    // Prepare update data
    const updatePayload: any = { ...updateData };
    if (updateData.date) {
      updatePayload.date = new Date(updateData.date);
    }

    const holiday = await prisma.holiday.update({
      where: { id },
      data: updatePayload
    });

    res.json({
      success: true,
      message: 'Holiday updated successfully',
      data: holiday
    });
  })
);

/**
 * @swagger
 * /holidays/{id}:
 *   delete:
 *     tags:
 *       - Holidays
 *     summary: Delete holiday
 *     description: Delete a holiday entry (HR Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Holiday ID
 *     responses:
 *       200:
 *         description: Holiday deleted successfully
 *       404:
 *         description: Holiday not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

// Delete holiday (HR Admin only)
router.delete('/:id',
  authorize('HR_ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // Check if holiday exists
    const existingHoliday = await prisma.holiday.findUnique({
      where: { id }
    });

    if (!existingHoliday) {
      throw new AppError('Holiday not found', 404);
    }

    await prisma.holiday.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Holiday deleted successfully'
    });
  })
);

/**
 * @swagger
 * /holidays/{id}:
 *   get:
 *     tags:
 *       - Holidays
 *     summary: Get holiday by ID
 *     description: Retrieve a specific holiday by its ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Holiday ID
 *     responses:
 *       200:
 *         description: Holiday retrieved successfully
 *       404:
 *         description: Holiday not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

// Get holiday by ID
router.get('/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const holiday = await prisma.holiday.findUnique({
      where: { id }
    });

    if (!holiday) {
      throw new AppError('Holiday not found', 404);
    }

    res.json({
      success: true,
      data: holiday
    });
  })
);

/**
 * @swagger
 * /holidays/sync:
 *   post:
 *     tags:
 *       - Holidays
 *     summary: Sync holidays with external API
 *     description: Synchronize holidays from external holiday API (HR Admin only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               year:
 *                 type: integer
 *                 example: 2024
 *               region:
 *                 type: string
 *                 enum: [INDIA, USA]
 *                 example: "INDIA"
 *     responses:
 *       200:
 *         description: Holidays synced successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

// Sync holidays with external API (HR Admin only)
router.post('/sync',
  authorize('HR_ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { year = new Date().getFullYear(), region } = req.body;

    // This is a placeholder for external API integration
    // In a real implementation, you would integrate with services like:
    // - Calendarific API
    // - Holiday API
    // - Google Calendar API

    let syncedCount = 0;

    // Mock sync logic - replace with actual API calls
    const mockHolidays = [
      {
        name: 'New Year\'s Day',
        date: new Date(`${year}-01-01`),
        location: region === 'INDIA' ? 'India' : 'USA',
        region: region || 'GLOBAL',
        type: 'NATIONAL',
        isOptional: false,
        description: 'New Year celebration'
      }
    ];

    for (const holidayData of mockHolidays) {
      // Check if holiday already exists for this year and location
      const existing = await prisma.holiday.findFirst({
        where: {
          name: holidayData.name,
          date: holidayData.date,
          location: holidayData.location
        }
      });

      if (!existing) {
        await prisma.holiday.create({
          data: holidayData
        });
        syncedCount++;
      }
    }

    res.json({
      success: true,
      message: `Synced ${syncedCount} holidays for ${year}`,
      data: { syncedCount, year, region }
    });
  })
);

export default router;