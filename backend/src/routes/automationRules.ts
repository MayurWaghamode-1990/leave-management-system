import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate as authMiddleware, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { automationRuleServiceDB } from '../services/automationRuleServiceDB';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /api/v1/automation-rules:
 *   get:
 *     summary: Get all automation rules
 *     description: Retrieve automation rules with optional filtering
 *     tags: [Automation Rules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: enabled
 *         schema:
 *           type: boolean
 *         description: Filter by enabled status
 *       - in: query
 *         name: triggerType
 *         schema:
 *           type: string
 *         description: Filter by trigger type
 *     responses:
 *       200:
 *         description: List of automation rules retrieved successfully
 *       403:
 *         description: Insufficient permissions
 */
router.get('/',
  authMiddleware,
  authorize(['HR_ADMIN', 'IT_ADMIN']),
  query('enabled').optional().isBoolean(),
  query('triggerType').optional().isString(),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { enabled, triggerType } = req.query;
      const user = (req as any).user;

      const filters: any = {};
      if (enabled !== undefined) filters.enabled = enabled === 'true';
      if (triggerType) filters.triggerType = triggerType;

      const rules = await automationRuleServiceDB.getRules(filters);

      res.json({
        success: true,
        message: 'Automation rules retrieved successfully',
        data: {
          rules,
          total: rules.length
        }
      });

    } catch (error) {
      logger.error('Error retrieving automation rules:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve automation rules'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/automation-rules/{id}:
 *   get:
 *     summary: Get automation rule by ID
 *     description: Retrieve a specific automation rule
 *     tags: [Automation Rules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Automation rule retrieved successfully
 *       404:
 *         description: Rule not found
 */
router.get('/:id',
  authMiddleware,
  authorize(['HR_ADMIN', 'IT_ADMIN']),
  param('id').isString().notEmpty(),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const rule = await automationRuleServiceDB.getRuleById(id);

      if (!rule) {
        return res.status(404).json({
          success: false,
          message: 'Automation rule not found'
        });
      }

      res.json({
        success: true,
        message: 'Automation rule retrieved successfully',
        data: { rule }
      });

    } catch (error) {
      logger.error('Error retrieving automation rule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve automation rule'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/automation-rules:
 *   post:
 *     summary: Create automation rule
 *     description: Create a new automation rule
 *     tags: [Automation Rules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - trigger
 *               - actions
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               enabled:
 *                 type: boolean
 *               priority:
 *                 type: number
 *               trigger:
 *                 type: object
 *               actions:
 *                 type: array
 *               validationRules:
 *                 type: array
 *     responses:
 *       201:
 *         description: Automation rule created successfully
 *       400:
 *         description: Invalid input data
 */
router.post('/',
  authMiddleware,
  authorize(['HR_ADMIN', 'IT_ADMIN']),
  body('name').isString().isLength({ min: 1, max: 255 }),
  body('description').optional().isString().isLength({ max: 1000 }),
  body('enabled').optional().isBoolean(),
  body('priority').optional().isInt({ min: 1, max: 100 }),
  body('trigger').isObject(),
  body('trigger.type').isIn(['LEAVE_REQUEST', 'APPROVAL_PENDING', 'LEAVE_APPROVED', 'LEAVE_REJECTED', 'SCHEDULE_TRIGGER']),
  body('trigger.conditions').isArray(),
  body('actions').isArray({ min: 1 }),
  body('validationRules').optional().isArray(),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const user = (req as any).user;
      const ruleData = {
        ...req.body,
        createdBy: user.id
      };

      const rule = await automationRuleServiceDB.createRule(ruleData);

      res.status(201).json({
        success: true,
        message: 'Automation rule created successfully',
        data: { rule }
      });

    } catch (error) {
      logger.error('Error creating automation rule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create automation rule'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/automation-rules/{id}:
 *   put:
 *     summary: Update automation rule
 *     description: Update an existing automation rule
 *     tags: [Automation Rules]
 *     security:
 *       - bearerAuth: []
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
 *               enabled:
 *                 type: boolean
 *               priority:
 *                 type: number
 *               trigger:
 *                 type: object
 *               actions:
 *                 type: array
 *               validationRules:
 *                 type: array
 *     responses:
 *       200:
 *         description: Automation rule updated successfully
 *       404:
 *         description: Rule not found
 */
router.put('/:id',
  authMiddleware,
  authorize(['HR_ADMIN', 'IT_ADMIN']),
  param('id').isString().notEmpty(),
  body('name').optional().isString().isLength({ min: 1, max: 255 }),
  body('description').optional().isString().isLength({ max: 1000 }),
  body('enabled').optional().isBoolean(),
  body('priority').optional().isInt({ min: 1, max: 100 }),
  body('trigger').optional().isObject(),
  body('actions').optional().isArray(),
  body('validationRules').optional().isArray(),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const updates = req.body;

      const rule = await automationRuleServiceDB.updateRule(id, updates);

      if (!rule) {
        return res.status(404).json({
          success: false,
          message: 'Automation rule not found'
        });
      }

      res.json({
        success: true,
        message: 'Automation rule updated successfully',
        data: { rule }
      });

    } catch (error) {
      logger.error('Error updating automation rule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update automation rule'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/automation-rules/{id}:
 *   delete:
 *     summary: Delete automation rule
 *     description: Delete an automation rule
 *     tags: [Automation Rules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Automation rule deleted successfully
 *       404:
 *         description: Rule not found
 */
router.delete('/:id',
  authMiddleware,
  authorize(['HR_ADMIN', 'IT_ADMIN']),
  param('id').isString().notEmpty(),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const deleted = await automationRuleServiceDB.deleteRule(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Automation rule not found'
        });
      }

      res.json({
        success: true,
        message: 'Automation rule deleted successfully'
      });

    } catch (error) {
      logger.error('Error deleting automation rule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete automation rule'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/automation-rules/{id}/test:
 *   post:
 *     summary: Test automation rule
 *     description: Test an automation rule with mock data
 *     tags: [Automation Rules]
 *     security:
 *       - bearerAuth: []
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
 *               testData:
 *                 type: object
 *                 description: Mock data for testing
 *     responses:
 *       200:
 *         description: Rule test completed successfully
 *       404:
 *         description: Rule not found
 */
router.post('/:id/test',
  authMiddleware,
  authorize(['HR_ADMIN', 'IT_ADMIN']),
  param('id').isString().notEmpty(),
  body('testData').optional().isObject(),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { testData = {} } = req.body;

      const rule = await automationRuleServiceDB.getRuleById(id);
      if (!rule) {
        return res.status(404).json({
          success: false,
          message: 'Automation rule not found'
        });
      }

      const testResult = await automationRuleServiceDB.testRule(rule, testData);

      res.json({
        success: true,
        message: 'Rule test completed successfully',
        data: {
          testResult,
          rule: {
            id: rule.id,
            name: rule.name,
            enabled: rule.enabled
          }
        }
      });

    } catch (error) {
      logger.error('Error testing automation rule:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to test automation rule'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/automation-rules/execute:
 *   post:
 *     summary: Execute automation rules
 *     description: Execute automation rules for a specific trigger
 *     tags: [Automation Rules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - triggerType
 *               - context
 *             properties:
 *               triggerType:
 *                 type: string
 *               context:
 *                 type: object
 *     responses:
 *       200:
 *         description: Rules executed successfully
 *       400:
 *         description: Invalid input data
 */
router.post('/execute',
  authMiddleware,
  authorize(['HR_ADMIN', 'IT_ADMIN', 'MANAGER']),
  body('triggerType').isString().isIn(['LEAVE_REQUEST', 'APPROVAL_PENDING', 'LEAVE_APPROVED', 'LEAVE_REJECTED', 'SCHEDULE_TRIGGER']),
  body('context').isObject(),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { triggerType, context } = req.body;

      const results = await automationRuleServiceDB.executeRules(triggerType, {
        ...context,
        currentDate: new Date()
      });

      res.json({
        success: true,
        message: 'Automation rules executed successfully',
        data: {
          results,
          executedRules: results.length,
          successfulRules: results.filter(r => r.success).length,
          failedRules: results.filter(r => !r.success).length
        }
      });

    } catch (error) {
      logger.error('Error executing automation rules:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to execute automation rules'
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/automation-rules/stats:
 *   get:
 *     summary: Get automation rule statistics
 *     description: Get statistics about automation rule usage and performance
 *     tags: [Automation Rules]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get('/stats/overview',
  authMiddleware,
  authorize(['HR_ADMIN', 'IT_ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const stats = await automationRuleServiceDB.getRuleStats();

      res.json({
        success: true,
        message: 'Automation rule statistics retrieved successfully',
        data: stats
      });

    } catch (error) {
      logger.error('Error retrieving automation rule statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve automation rule statistics'
      });
    }
  }
);

export default router;