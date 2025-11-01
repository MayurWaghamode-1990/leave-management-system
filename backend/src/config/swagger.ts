import swaggerJsdoc from 'swagger-jsdoc';
import { Options } from 'swagger-jsdoc';

const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Leave Management System API',
      version: '1.0.0',
      description: `
        A comprehensive Leave Management System API supporting multiple regions (India & USA) with advanced policy validation,
        approval workflows, and compliance features.

        ## Features
        - 🔐 JWT Authentication & Role-based Authorization
        - 📊 Advanced Policy Engine with Business Rules
        - ⚖️ Multi-level Approval Workflows
        - 🌍 Regional Compliance (India/USA)
        - 📈 Analytics & Reporting
        - 🔔 Notification System
        - 📋 Audit Logging

        ## Test Credentials
        **Note:** Create users via database seed scripts: \`npm run seed\`
        Default test users (after running seed): admin@company.com / user@company.com (passwords set in seed script)
      `,
      contact: {
        name: 'Leave Management System',
        url: 'http://localhost:5178',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001/api/v1',
        description: 'Development server',
      },
      {
        url: 'https://api.lms.company.com/api/v1',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from login endpoint',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'usr_123456789' },
            employeeId: { type: 'string', example: 'EMP001' },
            email: { type: 'string', format: 'email', example: 'admin@company.com' },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            role: {
              type: 'string',
              enum: ['EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'PAYROLL_OFFICER', 'IT_ADMIN'],
              example: 'EMPLOYEE'
            },
            department: { type: 'string', example: 'Engineering' },
            location: { type: 'string', example: 'Bengaluru' },
            joiningDate: { type: 'string', format: 'date-time' },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
              example: 'ACTIVE'
            },
            reportingManagerId: { type: 'string', nullable: true },
            lastLogin: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        LeaveRequest: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'req_123456789' },
            employeeId: { type: 'string', example: 'usr_123456789' },
            leaveType: {
              type: 'string',
              enum: ['SICK_LEAVE', 'CASUAL_LEAVE', 'EARNED_LEAVE', 'MATERNITY_LEAVE', 'PATERNITY_LEAVE', 'COMPENSATORY_OFF', 'BEREAVEMENT_LEAVE', 'MARRIAGE_LEAVE'],
              example: 'CASUAL_LEAVE'
            },
            startDate: { type: 'string', format: 'date', example: '2024-12-25' },
            endDate: { type: 'string', format: 'date', example: '2024-12-27' },
            totalDays: { type: 'number', format: 'decimal', example: 3.0 },
            isHalfDay: { type: 'boolean', example: false },
            reason: { type: 'string', example: 'Family vacation' },
            status: {
              type: 'string',
              enum: ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
              example: 'PENDING'
            },
            appliedDate: { type: 'string', format: 'date-time' },
            attachments: {
              type: 'array',
              items: { type: 'string' },
              example: ['doc1.pdf', 'doc2.jpg']
            },
          },
        },
        LeaveBalance: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'bal_123456789' },
            employeeId: { type: 'string', example: 'usr_123456789' },
            leaveType: {
              type: 'string',
              enum: ['SICK_LEAVE', 'CASUAL_LEAVE', 'EARNED_LEAVE', 'MATERNITY_LEAVE', 'PATERNITY_LEAVE', 'COMPENSATORY_OFF', 'BEREAVEMENT_LEAVE', 'MARRIAGE_LEAVE'],
              example: 'CASUAL_LEAVE'
            },
            totalEntitlement: { type: 'number', format: 'decimal', example: 12.0 },
            used: { type: 'number', format: 'decimal', example: 5.0 },
            available: { type: 'number', format: 'decimal', example: 7.0 },
            carryForward: { type: 'number', format: 'decimal', example: 0.0 },
            year: { type: 'integer', example: 2024 },
          },
        },
        LeavePolicy: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'pol_123456789' },
            name: { type: 'string', example: 'India Casual Leave Policy' },
            leaveType: {
              type: 'string',
              enum: ['SICK_LEAVE', 'CASUAL_LEAVE', 'EARNED_LEAVE', 'MATERNITY_LEAVE', 'PATERNITY_LEAVE', 'COMPENSATORY_OFF', 'BEREAVEMENT_LEAVE', 'MARRIAGE_LEAVE'],
              example: 'CASUAL_LEAVE'
            },
            entitlementDays: { type: 'number', format: 'decimal', example: 12.0 },
            accrualRate: { type: 'number', format: 'decimal', example: 1.0 },
            maxCarryForward: { type: 'number', format: 'decimal', example: 5.0 },
            maxConsecutiveDays: { type: 'integer', example: 3 },
            requiresDocumentation: { type: 'boolean', example: false },
            documentationThreshold: { type: 'integer', example: 0 },
            location: { type: 'string', example: 'Bengaluru' },
            region: { type: 'string', enum: ['INDIA', 'USA'], example: 'INDIA' },
            effectiveFrom: { type: 'string', format: 'date-time' },
            effectiveTo: { type: 'string', format: 'date-time', nullable: true },
            isActive: { type: 'boolean', example: true },
          },
        },
        Holiday: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'hol_123456789' },
            name: { type: 'string', example: 'Independence Day' },
            date: { type: 'string', format: 'date', example: '2024-08-15' },
            location: { type: 'string', example: 'India' },
            region: { type: 'string', enum: ['INDIA', 'USA'], example: 'INDIA' },
            isOptional: { type: 'boolean', example: false },
            type: {
              type: 'string',
              enum: ['NATIONAL', 'REGIONAL', 'COMPANY'],
              example: 'NATIONAL'
            },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'not_123456789' },
            userId: { type: 'string', example: 'usr_123456789' },
            type: {
              type: 'string',
              enum: ['LEAVE_REQUESTED', 'LEAVE_APPROVED', 'LEAVE_REJECTED', 'LEAVE_CANCELLED', 'APPROVAL_PENDING', 'BALANCE_LOW', 'LEAVE_REMINDER'],
              example: 'LEAVE_APPROVED'
            },
            title: { type: 'string', example: 'Leave Request Approved' },
            message: { type: 'string', example: 'Your leave request for Dec 25-27 has been approved.' },
            isRead: { type: 'boolean', example: false },
            metadata: { type: 'object', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        ValidationResult: {
          type: 'object',
          properties: {
            isValid: { type: 'boolean', example: true },
            errors: {
              type: 'array',
              items: { type: 'string' },
              example: []
            },
            warnings: {
              type: 'array',
              items: { type: 'string' },
              example: ['Leave period includes 1 holiday(s): Christmas']
            },
            requiredDocumentation: { type: 'boolean', example: false },
            autoApprovalEligible: { type: 'boolean', example: true },
            approvalChain: {
              type: 'array',
              items: { type: 'string' },
              example: ['mgr_123456789', 'hr_123456789']
            },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation completed successfully' },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'An error occurred' },
            error: { type: 'string', example: 'Detailed error message' },
            code: { type: 'string', example: 'INVALID_REQUEST' },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                items: { type: 'array', items: { type: 'object' } },
                pagination: {
                  type: 'object',
                  properties: {
                    page: { type: 'integer', example: 1 },
                    limit: { type: 'integer', example: 10 },
                    total: { type: 'integer', example: 50 },
                    totalPages: { type: 'integer', example: 5 },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                message: 'Authentication required',
                error: 'No token provided',
                code: 'UNAUTHORIZED',
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                message: 'Insufficient permissions',
                error: 'Access denied',
                code: 'FORBIDDEN',
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                message: 'Validation failed',
                error: 'All fields are required',
                code: 'VALIDATION_ERROR',
              },
            },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and session management',
      },
      {
        name: 'Leave Requests',
        description: 'Leave request management and approval workflows',
      },
      {
        name: 'Leave Balances',
        description: 'Employee leave balance tracking',
      },
      {
        name: 'Policies',
        description: 'Leave policy management and rules',
      },
      {
        name: 'Holidays',
        description: 'Holiday calendar management',
      },
      {
        name: 'Reports',
        description: 'Analytics and reporting endpoints',
      },
      {
        name: 'Notifications',
        description: 'Notification system management',
      },
      {
        name: 'Users',
        description: 'User management and profiles',
      },
    ],
  },
  apis: [
    './src/routes/*.ts', // Path to the API files
    './src/routes/**/*.ts', // Include subdirectories
  ],
};

const specs = swaggerJsdoc(options);

export default specs;