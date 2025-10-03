import express from 'express';
import { enhancedLwpService, GLFLWPApplicationData } from '../services/enhancedLwpService';
import { authenticate } from '../middleware/auth';
import { body, param, validationResult } from 'express-validator';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     GLFLWPApplication:
 *       type: object
 *       required:
 *         - startDate
 *         - endDate
 *         - reason
 *         - lwpType
 *         - urgencyLevel
 *         - businessJustification
 *         - contactDuringLeave
 *         - financialImpactAcknowledged
 *         - handoverDetails
 *       properties:
 *         startDate:
 *           type: string
 *           format: date
 *         endDate:
 *           type: string
 *           format: date
 *         reason:
 *           type: string
 *           minLength: 20
 *           maxLength: 1000
 *         lwpType:
 *           type: string
 *           enum: [MEDICAL, PERSONAL, STUDY, EMERGENCY, EXTENDED_PERSONAL, SABBATICAL]
 *         urgencyLevel:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *         businessJustification:
 *           type: string
 *           minLength: 50
 *           maxLength: 2000
 *         contactDuringLeave:
 *           type: string
 *         emergencyContactName:
 *           type: string
 *         emergencyContactPhone:
 *           type: string
 *         expectedReturnDate:
 *           type: string
 *           format: date
 *         handoverDetails:
 *           type: string
 *           minLength: 100
 *         replacementArrangements:
 *           type: string
 *         financialImpactAcknowledged:
 *           type: boolean
 *         medicalCertificate:
 *           type: string
 *         studyDocuments:
 *           type: array
 *           items:
 *             type: string
 *         attachments:
 *           type: array
 *           items:
 *             type: string
 */

// Enhanced validation schemas
const enhancedLWPApplicationSchema = [
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid ISO date')
    .custom((value) => {
      const startDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (startDate < today) {
        throw new Error('Start date cannot be in the past');
      }
      return true;
    }),
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid ISO date')
    .custom((value, { req }) => {
      const endDate = new Date(value);
      const startDate = new Date(req.body.startDate);

      if (endDate <= startDate) {
        throw new Error('End date must be after start date');
      }

      // Check maximum duration based on LWP type
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const lwpType = req.body.lwpType;

      const maxDurations: Record<string, number> = {
        'MEDICAL': 365,
        'PERSONAL': 90,
        'STUDY': 730,
        'EMERGENCY': 30,
        'EXTENDED_PERSONAL': 180,
        'SABBATICAL': 365
      };

      if (maxDurations[lwpType] && daysDiff > maxDurations[lwpType]) {
        throw new Error(`Maximum ${maxDurations[lwpType]} days allowed for ${lwpType} LWP`);
      }

      return true;
    }),
  body('reason')
    .trim()
    .isLength({ min: 20, max: 1000 })
    .withMessage('Reason must be between 20 and 1000 characters'),
  body('lwpType')
    .isIn(['MEDICAL', 'PERSONAL', 'STUDY', 'EMERGENCY', 'EXTENDED_PERSONAL', 'SABBATICAL'])
    .withMessage('Invalid LWP type'),
  body('urgencyLevel')
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    .withMessage('Invalid urgency level'),
  body('businessJustification')
    .trim()
    .isLength({ min: 50, max: 2000 })
    .withMessage('Business justification must be between 50 and 2000 characters'),
  body('contactDuringLeave')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Contact information during leave must be between 10 and 500 characters'),
  body('handoverDetails')
    .trim()
    .isLength({ min: 100, max: 3000 })
    .withMessage('Handover details must be between 100 and 3000 characters'),
  body('financialImpactAcknowledged')
    .isBoolean()
    .withMessage('Financial impact acknowledgment is required'),
  body('expectedReturnDate')
    .optional()
    .isISO8601()
    .withMessage('Expected return date must be a valid ISO date'),
  body('emergencyContactName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Emergency contact name cannot exceed 100 characters'),
  body('emergencyContactPhone')
    .optional()
    .trim()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Invalid emergency contact phone number'),
  body('replacementArrangements')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Replacement arrangements cannot exceed 1000 characters'),
  body('medicalCertificate')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Medical certificate reference cannot exceed 500 characters'),
  body('studyDocuments')
    .optional()
    .isArray()
    .withMessage('Study documents must be an array'),
  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array')
];

/**
 * @swagger
 * /api/v1/enhanced-lwp/policies:
 *   get:
 *     summary: Get all available LWP policies
 *     tags: [Enhanced LWP]
 *     responses:
 *       200:
 *         description: LWP policies retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/policies', authenticate, async (req, res) => {
  try {
    const policies = enhancedLwpService.getAllLWPPolicies();

    res.status(200).json({
      success: true,
      data: {
        policies,
        count: policies.length
      },
      message: 'LWP policies retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting LWP policies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve LWP policies',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/v1/enhanced-lwp/policies/{lwpType}:
 *   get:
 *     summary: Get specific LWP policy
 *     tags: [Enhanced LWP]
 *     parameters:
 *       - in: path
 *         name: lwpType
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: LWP policy retrieved successfully
 *       404:
 *         description: LWP policy not found
 *       500:
 *         description: Internal server error
 */
router.get('/policies/:lwpType', authenticate, async (req, res) => {
  try {
    const { lwpType } = req.params;
    const policy = enhancedLwpService.getLWPPolicy(lwpType);

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'LWP policy not found'
      });
    }

    res.status(200).json({
      success: true,
      data: policy,
      message: 'LWP policy retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting LWP policy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve LWP policy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/v1/enhanced-lwp/apply:
 *   post:
 *     summary: Apply for enhanced Leave Without Pay
 *     tags: [Enhanced LWP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GLFLWPApplication'
 *     responses:
 *       201:
 *         description: LWP application submitted successfully
 *       400:
 *         description: Validation errors
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/apply', authenticate, ...enhancedLWPApplicationSchema, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const employeeId = req.user?.id;
    if (!employeeId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const applicationData: GLFLWPApplicationData = {
      employeeId,
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
      reason: req.body.reason,
      lwpType: req.body.lwpType,
      urgencyLevel: req.body.urgencyLevel,
      businessJustification: req.body.businessJustification,
      contactDuringLeave: req.body.contactDuringLeave,
      handoverDetails: req.body.handoverDetails,
      financialImpactAcknowledged: req.body.financialImpactAcknowledged,
      expectedReturnDate: req.body.expectedReturnDate ? new Date(req.body.expectedReturnDate) : undefined,
      emergencyContactName: req.body.emergencyContactName,
      emergencyContactPhone: req.body.emergencyContactPhone,
      replacementArrangements: req.body.replacementArrangements,
      medicalCertificate: req.body.medicalCertificate,
      studyDocuments: req.body.studyDocuments,
      attachments: req.body.attachments
    };

    const result = await enhancedLwpService.applyForLWP(applicationData);

    if (result.success) {
      res.status(201).json({
        success: true,
        data: {
          leaveRequestId: result.leaveRequestId,
          validationResult: result.validationResult,
          impactAnalysis: result.impactAnalysis
        },
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        data: {
          validationResult: result.validationResult,
          impactAnalysis: result.impactAnalysis
        },
        message: result.message
      });
    }
  } catch (error) {
    logger.error('Error processing enhanced LWP application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process LWP application',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /api/v1/enhanced-lwp/{id}/details:
 *   get:
 *     summary: Get enhanced LWP application details
 *     tags: [Enhanced LWP]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: LWP details retrieved successfully
 *       404:
 *         description: LWP application not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id/details', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Leave request ID is required'
      });
    }

    const lwpDetails = await enhancedLwpService.getEnhancedLWPDetails(id);

    res.status(200).json({
      success: true,
      data: lwpDetails,
      message: 'Enhanced LWP details retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting enhanced LWP details:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        message: 'Enhanced LWP application not found'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve LWP details',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

/**
 * @swagger
 * /api/v1/enhanced-lwp/validate:
 *   post:
 *     summary: Validate LWP application without submitting
 *     tags: [Enhanced LWP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GLFLWPApplication'
 *     responses:
 *       200:
 *         description: Validation completed
 *       400:
 *         description: Validation errors
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/validate', authenticate, ...enhancedLWPApplicationSchema, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const employeeId = req.user?.id;
    if (!employeeId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Create a temporary application data object for validation
    const applicationData: GLFLWPApplicationData = {
      employeeId,
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
      reason: req.body.reason,
      lwpType: req.body.lwpType,
      urgencyLevel: req.body.urgencyLevel,
      businessJustification: req.body.businessJustification,
      contactDuringLeave: req.body.contactDuringLeave,
      handoverDetails: req.body.handoverDetails,
      financialImpactAcknowledged: req.body.financialImpactAcknowledged,
      expectedReturnDate: req.body.expectedReturnDate ? new Date(req.body.expectedReturnDate) : undefined,
      emergencyContactName: req.body.emergencyContactName,
      emergencyContactPhone: req.body.emergencyContactPhone,
      replacementArrangements: req.body.replacementArrangements,
      medicalCertificate: req.body.medicalCertificate,
      studyDocuments: req.body.studyDocuments,
      attachments: req.body.attachments
    };

    // Use private method access through any type (this is a test/validation endpoint)
    const service = enhancedLwpService as any;
    const validationResult = await service.validateLWPApplication(applicationData);
    const impactAnalysis = await service.analyzeLWPImpact(applicationData);

    res.status(200).json({
      success: true,
      data: {
        validationResult,
        impactAnalysis,
        isValid: validationResult.valid
      },
      message: 'LWP validation completed'
    });
  } catch (error) {
    logger.error('Error validating LWP application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate LWP application',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;