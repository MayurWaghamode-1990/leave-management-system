import { ValidationSchema, commonValidations } from '../middleware/validation';

// Auth validation schemas
export const authSchemas = {
  login: {
    body: {
      email: commonValidations.email,
      password: {
        type: 'string' as const,
        required: true,
        minLength: 1
      }
    }
  } as ValidationSchema,

  register: {
    body: {
      email: commonValidations.email,
      password: commonValidations.password,
      firstName: {
        type: 'string' as const,
        required: true,
        minLength: 2,
        maxLength: 50,
        pattern: /^[a-zA-Z\s'-]+$/
      },
      lastName: {
        type: 'string' as const,
        required: true,
        minLength: 2,
        maxLength: 50,
        pattern: /^[a-zA-Z\s'-]+$/
      },
      role: {
        type: 'string' as const,
        enum: ['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN']
      },
      departmentId: {
        type: 'string' as const,
        required: true
      }
    }
  } as ValidationSchema,

  changePassword: {
    body: {
      currentPassword: {
        type: 'string' as const,
        required: true
      },
      newPassword: commonValidations.password,
      confirmPassword: {
        type: 'string' as const,
        required: true,
        custom: (value: any, context: any) => {
          if (context && context.newPassword && value !== context.newPassword) {
            return 'confirmPassword must match newPassword';
          }
          return true;
        }
      }
    }
  } as ValidationSchema,

  resetPassword: {
    body: {
      email: commonValidations.email
    }
  } as ValidationSchema,

  confirmResetPassword: {
    body: {
      token: {
        type: 'string' as const,
        required: true,
        minLength: 32
      },
      newPassword: commonValidations.password
    }
  } as ValidationSchema
};

// User validation schemas
export const userSchemas = {
  getUser: {
    params: {
      id: commonValidations.id
    }
  } as ValidationSchema,

  updateUser: {
    params: {
      id: commonValidations.id
    },
    body: {
      firstName: {
        type: 'string' as const,
        minLength: 2,
        maxLength: 50,
        pattern: /^[a-zA-Z\s'-]+$/
      },
      lastName: {
        type: 'string' as const,
        minLength: 2,
        maxLength: 50,
        pattern: /^[a-zA-Z\s'-]+$/
      },
      email: {
        type: 'email' as const,
        maxLength: 255
      },
      phone: {
        type: 'string' as const,
        pattern: /^[+]?[\d\s\-()]+$/,
        minLength: 10,
        maxLength: 20
      },
      departmentId: {
        type: 'string' as const
      },
      managerId: {
        type: 'string' as const
      },
      role: {
        type: 'string' as const,
        enum: ['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN']
      },
      isActive: {
        type: 'boolean' as const
      }
    }
  } as ValidationSchema,

  getUsersList: {
    query: {
      ...commonValidations.pagination,
      search: {
        type: 'string' as const,
        maxLength: 100
      },
      department: {
        type: 'string' as const
      },
      role: {
        type: 'string' as const,
        enum: ['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN']
      },
      isActive: {
        type: 'boolean' as const
      },
      sortBy: {
        type: 'string' as const,
        enum: ['firstName', 'lastName', 'email', 'createdAt', 'department']
      },
      sortOrder: {
        type: 'string' as const,
        enum: ['asc', 'desc']
      }
    }
  } as ValidationSchema
};

// Leave validation schemas
export const leaveSchemas = {
  createLeave: {
    body: {
      type: {
        type: 'string' as const,
        required: true,
        enum: ['SICK_LEAVE', 'CASUAL_LEAVE', 'EARNED_LEAVE', 'MATERNITY_LEAVE', 'PATERNITY_LEAVE', 'COMPENSATORY_OFF', 'BEREAVEMENT_LEAVE', 'MARRIAGE_LEAVE']
      },
      startDate: {
        type: 'date' as const,
        required: true
      },
      endDate: {
        type: 'date' as const,
        required: true,
        custom: (value: any, context: any) => {
          if (context && context.startDate && new Date(value) < new Date(context.startDate)) {
            return 'endDate must be after or equal to startDate';
          }
          return true;
        }
      },
      reason: {
        type: 'string' as const,
        required: true,
        minLength: 10,
        maxLength: 500
      },
      isHalfDay: {
        type: 'boolean' as const
      },
      halfDayPeriod: {
        type: 'string' as const,
        enum: ['MORNING', 'AFTERNOON']
      },
      emergencyContact: {
        type: 'string' as const,
        maxLength: 100
      },
      attachments: {
        type: 'array' as const,
        arrayOf: {
          type: 'string' as const
        }
      }
    }
  } as ValidationSchema,

  updateLeave: {
    params: {
      id: commonValidations.id
    },
    body: {
      type: {
        type: 'string' as const,
        enum: ['ANNUAL', 'SICK', 'PERSONAL', 'MATERNITY', 'PATERNITY', 'EMERGENCY', 'UNPAID']
      },
      startDate: {
        type: 'date' as const
      },
      endDate: {
        type: 'date' as const,
        custom: (value: any, context: any) => {
          if (context && context.startDate && new Date(value) < new Date(context.startDate)) {
            return 'endDate must be after or equal to startDate';
          }
          return true;
        }
      },
      reason: {
        type: 'string' as const,
        minLength: 10,
        maxLength: 500
      },
      isHalfDay: {
        type: 'boolean' as const
      },
      halfDayPeriod: {
        type: 'string' as const,
        enum: ['MORNING', 'AFTERNOON']
      },
      emergencyContact: {
        type: 'string' as const,
        maxLength: 100
      }
    }
  } as ValidationSchema,

  approveLeave: {
    params: {
      id: commonValidations.id
    },
    body: {
      action: {
        type: 'string' as const,
        required: true,
        enum: ['APPROVE', 'REJECT']
      },
      comments: {
        type: 'string' as const,
        maxLength: 500
      }
    }
  } as ValidationSchema,

  getLeavesList: {
    query: {
      ...commonValidations.pagination,
      userId: {
        type: 'string' as const
      },
      status: {
        type: 'string' as const,
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']
      },
      type: {
        type: 'string' as const,
        enum: ['ANNUAL', 'SICK', 'PERSONAL', 'MATERNITY', 'PATERNITY', 'EMERGENCY', 'UNPAID']
      },
      startDate: {
        type: 'date' as const
      },
      endDate: {
        type: 'date' as const
      },
      sortBy: {
        type: 'string' as const,
        enum: ['startDate', 'endDate', 'createdAt', 'status', 'type']
      },
      sortOrder: {
        type: 'string' as const,
        enum: ['asc', 'desc']
      }
    }
  } as ValidationSchema,

  createTemplate: {
    body: {
      name: {
        type: 'string' as const,
        required: true,
        minLength: 3,
        maxLength: 100
      },
      type: {
        type: 'string' as const,
        required: true,
        enum: ['ANNUAL', 'SICK', 'PERSONAL', 'MATERNITY', 'PATERNITY', 'EMERGENCY', 'UNPAID']
      },
      reason: {
        type: 'string' as const,
        required: true,
        minLength: 10,
        maxLength: 500
      },
      isRecurring: {
        type: 'boolean' as const
      },
      recurringPattern: {
        type: 'object' as const,
        properties: {
          frequency: {
            type: 'string' as const,
            enum: ['WEEKLY', 'MONTHLY', 'YEARLY']
          },
          interval: {
            type: 'number' as const,
            min: 1,
            max: 12
          },
          endDate: {
            type: 'date' as const
          }
        }
      }
    }
  } as ValidationSchema,

  createDraft: {
    body: {
      name: {
        type: 'string' as const,
        required: true,
        minLength: 3,
        maxLength: 100
      },
      type: {
        type: 'string' as const,
        required: true,
        enum: ['ANNUAL', 'SICK', 'PERSONAL', 'MATERNITY', 'PATERNITY', 'EMERGENCY', 'UNPAID']
      },
      startDate: {
        type: 'date' as const
      },
      endDate: {
        type: 'date' as const
      },
      reason: {
        type: 'string' as const,
        maxLength: 500
      },
      isHalfDay: {
        type: 'boolean' as const
      },
      halfDayPeriod: {
        type: 'string' as const,
        enum: ['MORNING', 'AFTERNOON']
      }
    }
  } as ValidationSchema,

  createDelegation: {
    body: {
      delegateToId: {
        type: 'string' as const,
        required: true
      },
      startDate: {
        type: 'date' as const,
        required: true
      },
      endDate: {
        type: 'date' as const,
        required: true,
        custom: (value: any, context: any) => {
          if (context && context.startDate && new Date(value) < new Date(context.startDate)) {
            return 'endDate must be after or equal to startDate';
          }
          return true;
        }
      },
      permissions: {
        type: 'array' as const,
        required: true,
        arrayOf: {
          type: 'string' as const,
          enum: ['APPROVE_LEAVES', 'MANAGE_TEAM', 'VIEW_REPORTS']
        }
      },
      reason: {
        type: 'string' as const,
        required: true,
        minLength: 10,
        maxLength: 500
      }
    }
  } as ValidationSchema,

  cancelLeave: {
    params: {
      id: commonValidations.id
    },
    body: {
      reason: {
        type: 'string' as const,
        required: true,
        minLength: 10,
        maxLength: 500
      }
    }
  } as ValidationSchema,

  modifyLeave: {
    params: {
      id: commonValidations.id
    },
    body: {
      changes: {
        type: 'object' as const,
        required: true,
        properties: {
          startDate: {
            type: 'date' as const
          },
          endDate: {
            type: 'date' as const
          },
          reason: {
            type: 'string' as const,
            minLength: 10,
            maxLength: 500
          },
          isHalfDay: {
            type: 'boolean' as const
          },
          halfDayPeriod: {
            type: 'string' as const,
            enum: ['MORNING', 'AFTERNOON']
          }
        }
      },
      reason: {
        type: 'string' as const,
        required: true,
        minLength: 10,
        maxLength: 500
      }
    }
  } as ValidationSchema
};

// Holiday validation schemas
export const holidaySchemas = {
  createHoliday: {
    body: {
      name: {
        type: 'string' as const,
        required: true,
        minLength: 3,
        maxLength: 100
      },
      date: {
        type: 'date' as const,
        required: true
      },
      type: {
        type: 'string' as const,
        required: true,
        enum: ['PUBLIC', 'COMPANY', 'OPTIONAL']
      },
      description: {
        type: 'string' as const,
        maxLength: 500
      },
      isRecurring: {
        type: 'boolean' as const
      }
    }
  } as ValidationSchema,

  updateHoliday: {
    params: {
      id: commonValidations.id
    },
    body: {
      name: {
        type: 'string' as const,
        minLength: 3,
        maxLength: 100
      },
      date: {
        type: 'date' as const
      },
      type: {
        type: 'string' as const,
        enum: ['PUBLIC', 'COMPANY', 'OPTIONAL']
      },
      description: {
        type: 'string' as const,
        maxLength: 500
      },
      isRecurring: {
        type: 'boolean' as const
      }
    }
  } as ValidationSchema,

  getHolidays: {
    query: {
      year: {
        type: 'number' as const,
        min: 2020,
        max: 2030
      },
      month: {
        type: 'number' as const,
        min: 1,
        max: 12
      },
      type: {
        type: 'string' as const,
        enum: ['PUBLIC', 'COMPANY', 'OPTIONAL']
      }
    }
  } as ValidationSchema
};

// Policy validation schemas
export const policySchemas = {
  createPolicy: {
    body: {
      name: {
        type: 'string' as const,
        required: true,
        minLength: 3,
        maxLength: 100
      },
      description: {
        type: 'string' as const,
        required: true,
        minLength: 10,
        maxLength: 1000
      },
      leaveType: {
        type: 'string' as const,
        required: true,
        enum: ['ANNUAL', 'SICK', 'PERSONAL', 'MATERNITY', 'PATERNITY', 'EMERGENCY', 'UNPAID']
      },
      maxDays: {
        type: 'number' as const,
        required: true,
        min: 0,
        max: 365
      },
      carryOverDays: {
        type: 'number' as const,
        min: 0,
        max: 365
      },
      requiresApproval: {
        type: 'boolean' as const
      },
      minimumNotice: {
        type: 'number' as const,
        min: 0,
        max: 90
      },
      isActive: {
        type: 'boolean' as const
      }
    }
  } as ValidationSchema,

  updatePolicy: {
    params: {
      id: commonValidations.id
    },
    body: {
      name: {
        type: 'string' as const,
        minLength: 3,
        maxLength: 100
      },
      description: {
        type: 'string' as const,
        minLength: 10,
        maxLength: 1000
      },
      maxDays: {
        type: 'number' as const,
        min: 0,
        max: 365
      },
      carryOverDays: {
        type: 'number' as const,
        min: 0,
        max: 365
      },
      requiresApproval: {
        type: 'boolean' as const
      },
      minimumNotice: {
        type: 'number' as const,
        min: 0,
        max: 90
      },
      isActive: {
        type: 'boolean' as const
      }
    }
  } as ValidationSchema
};

// Notification validation schemas
export const notificationSchemas = {
  markAsRead: {
    params: {
      id: commonValidations.id
    }
  } as ValidationSchema,

  getNotifications: {
    query: {
      ...commonValidations.pagination,
      read: {
        type: 'boolean' as const
      },
      type: {
        type: 'string' as const,
        enum: ['LEAVE_REQUEST', 'LEAVE_APPROVED', 'LEAVE_REJECTED', 'LEAVE_CANCELLED', 'SYSTEM_ALERT']
      },
      sortBy: {
        type: 'string' as const,
        enum: ['createdAt', 'type', 'read']
      },
      sortOrder: {
        type: 'string' as const,
        enum: ['asc', 'desc']
      }
    }
  } as ValidationSchema,

  createNotification: {
    body: {
      userId: {
        type: 'string' as const,
        required: true
      },
      type: {
        type: 'string' as const,
        required: true,
        enum: ['LEAVE_REQUEST', 'LEAVE_APPROVED', 'LEAVE_REJECTED', 'LEAVE_CANCELLED', 'SYSTEM_ALERT']
      },
      title: {
        type: 'string' as const,
        required: true,
        minLength: 3,
        maxLength: 100
      },
      message: {
        type: 'string' as const,
        required: true,
        minLength: 10,
        maxLength: 500
      },
      metadata: {
        type: 'object' as const
      }
    }
  } as ValidationSchema
};

// Report validation schemas
export const reportSchemas = {
  getLeaveReport: {
    query: {
      startDate: {
        type: 'date' as const,
        required: true
      },
      endDate: {
        type: 'date' as const,
        required: true,
        custom: (value: any, context: any) => {
          if (context && context.startDate && new Date(value) < new Date(context.startDate)) {
            return 'endDate must be after or equal to startDate';
          }
          return true;
        }
      },
      userId: {
        type: 'string' as const
      },
      departmentId: {
        type: 'string' as const
      },
      leaveType: {
        type: 'string' as const,
        enum: ['ANNUAL', 'SICK', 'PERSONAL', 'MATERNITY', 'PATERNITY', 'EMERGENCY', 'UNPAID']
      },
      format: {
        type: 'string' as const,
        enum: ['json', 'csv', 'xlsx']
      }
    }
  } as ValidationSchema,

  getTeamReport: {
    query: {
      startDate: {
        type: 'date' as const,
        required: true
      },
      endDate: {
        type: 'date' as const,
        required: true
      },
      managerId: {
        type: 'string' as const
      },
      format: {
        type: 'string' as const,
        enum: ['json', 'csv', 'xlsx']
      }
    }
  } as ValidationSchema
};

// Common parameter schemas
export const paramSchemas = {
  idParam: {
    params: {
      id: commonValidations.id
    }
  } as ValidationSchema,

  paginationQuery: {
    query: commonValidations.pagination
  } as ValidationSchema
};