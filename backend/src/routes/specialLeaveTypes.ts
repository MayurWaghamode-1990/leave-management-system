import express from 'express';
import { specialLeaveTypesService } from '../services/specialLeaveTypesService';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     SpecialLeaveType:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           description: Leave type identifier
 *         name:
 *           type: string
 *           description: Display name
 *         description:
 *           type: string
 *           description: Leave type description
 *         eligibilityRequirements:
 *           type: object
 *           description: Requirements for eligibility
 *         allocation:
 *           type: object
 *           description: Allocation rules
 *         restrictions:
 *           type: object
 *           description: Leave restrictions
 */

/**
 * @swagger
 * /api/v1/special-leave-types:
 *   get:
 *     summary: Get all special leave types configuration
 *     tags: [Special Leave Types]
 *     responses:
 *       200:
 *         description: Special leave types retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/', async (req, res) => {
  try {
    const specialLeaveTypes = specialLeaveTypesService.getAllSpecialLeaveTypes();

    res.status(200).json({
      success: true,
      data: {
        specialLeaveTypes,
        count: specialLeaveTypes.length
      },
      message: 'Special leave types retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting special leave types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve special leave types',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/v1/special-leave-types/{leaveType}:
 *   get:
 *     summary: Get specific special leave type information
 *     tags: [Special Leave Types]
 *     parameters:
 *       - in: path
 *         name: leaveType
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Leave type information retrieved
 *       404:
 *         description: Leave type not found
 *       500:
 *         description: Internal server error
 */
router.get('/:leaveType', async (req, res) => {
  try {
    const { leaveType } = req.params;
    const leaveTypeInfo = specialLeaveTypesService.getSpecialLeaveTypeInfo(leaveType);

    if (!leaveTypeInfo) {
      return res.status(404).json({
        success: false,
        message: 'Special leave type not found'
      });
    }

    res.status(200).json({
      success: true,
      data: leaveTypeInfo,
      message: 'Leave type information retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting leave type info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve leave type information',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/v1/special-leave-types/check-eligibility:
 *   post:
 *     summary: Check employee eligibility for special leave type
 *     tags: [Special Leave Types]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - leaveType
 *             properties:
 *               employeeId:
 *                 type: string
 *               leaveType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Eligibility check completed
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Internal server error
 */
router.post('/check-eligibility', async (req, res) => {
  try {
    const { employeeId, leaveType } = req.body;

    if (!employeeId || !leaveType) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID and leave type are required'
      });
    }

    const eligibilityCheck = await specialLeaveTypesService.checkEligibility(employeeId, leaveType);

    res.status(200).json({
      success: true,
      data: eligibilityCheck,
      message: 'Eligibility check completed'
    });
  } catch (error) {
    logger.error('Error checking eligibility:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check eligibility',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/v1/special-leave-types/allocations/{employeeId}:
 *   get:
 *     summary: Get special leave allocations for employee
 *     tags: [Special Leave Types]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Allocations retrieved successfully
 *       400:
 *         description: Invalid employee ID
 *       500:
 *         description: Internal server error
 */
router.get('/allocations/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required'
      });
    }

    const allocations = await specialLeaveTypesService.getSpecialLeaveAllocations(employeeId, year);

    res.status(200).json({
      success: true,
      data: {
        allocations,
        year,
        count: allocations.length
      },
      message: 'Special leave allocations retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting special leave allocations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve special leave allocations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/v1/special-leave-types/initialize-allocations:
 *   post:
 *     summary: Initialize special leave allocations for employee
 *     tags: [Special Leave Types]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *             properties:
 *               employeeId:
 *                 type: string
 *               year:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Allocations initialized successfully
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Internal server error
 */
router.post('/initialize-allocations', async (req, res) => {
  try {
    const { employeeId, year } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required'
      });
    }

    const targetYear = year || new Date().getFullYear();
    await specialLeaveTypesService.initializeSpecialLeaveAllocations(employeeId, targetYear);

    res.status(200).json({
      success: true,
      message: `Special leave allocations initialized for employee ${employeeId} for year ${targetYear}`
    });
  } catch (error) {
    logger.error('Error initializing special leave allocations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize special leave allocations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/v1/special-leave-types/validate-request:
 *   post:
 *     summary: Validate special leave request
 *     tags: [Special Leave Types]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - leaveType
 *               - startDate
 *               - endDate
 *               - totalDays
 *             properties:
 *               employeeId:
 *                 type: string
 *               leaveType:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               totalDays:
 *                 type: number
 *     responses:
 *       200:
 *         description: Validation completed
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Internal server error
 */
router.post('/validate-request', async (req, res) => {
  try {
    const { employeeId, leaveType, startDate, endDate, totalDays } = req.body;

    if (!employeeId || !leaveType || !startDate || !endDate || !totalDays) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: employeeId, leaveType, startDate, endDate, totalDays'
      });
    }

    const validation = await specialLeaveTypesService.validateSpecialLeaveRequest(
      employeeId,
      leaveType,
      new Date(startDate),
      new Date(endDate),
      totalDays
    );

    res.status(200).json({
      success: true,
      data: validation,
      message: 'Leave request validation completed'
    });
  } catch (error) {
    logger.error('Error validating special leave request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate special leave request',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/v1/special-leave-types/update-profile:
 *   put:
 *     summary: Update employee profile for special leave eligibility
 *     tags: [Special Leave Types]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *             properties:
 *               employeeId:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, OTHER]
 *               maritalStatus:
 *                 type: string
 *                 enum: [SINGLE, MARRIED, DIVORCED, WIDOWED]
 *               country:
 *                 type: string
 *                 enum: [USA, INDIA]
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Internal server error
 */
router.put('/update-profile', async (req, res) => {
  try {
    const { employeeId, gender, maritalStatus, country } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required'
      });
    }

    const updates: any = {};
    if (gender) updates.gender = gender;
    if (maritalStatus) updates.maritalStatus = maritalStatus;
    if (country) updates.country = country;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one field to update is required'
      });
    }

    await specialLeaveTypesService.updateEmployeeProfileForSpecialLeaves(employeeId, updates);

    res.status(200).json({
      success: true,
      message: 'Employee profile updated and special leave allocations refreshed'
    });
  } catch (error) {
    logger.error('Error updating employee profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update employee profile',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;