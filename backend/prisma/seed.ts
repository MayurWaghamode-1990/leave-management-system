import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed...');

  // Clear existing data (in correct order to respect foreign key constraints)
  console.log('🗑️  Clearing existing data...');
  await prisma.compOffApproval.deleteMany();
  await prisma.compOffRequest.deleteMany();
  await prisma.compOffWorkLog.deleteMany();
  await prisma.compOffBalance.deleteMany();
  await prisma.monthlyAccrual.deleteMany();
  await prisma.leaveModificationRequest.deleteMany();
  await prisma.leaveCancellationRequest.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.leaveBalance.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.ruleExecution.deleteMany();
  await prisma.automationRule.deleteMany();
  await prisma.leaveTemplate.deleteMany();
  await prisma.calendarIntegration.deleteMany();
  await prisma.regionalPolicy.deleteMany();
  await prisma.leavePolicy.deleteMany();
  await prisma.leaveAccrualRule.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();

  // Create departments
  const hrDept = await prisma.department.create({
    data: {
      id: 'dept-hr',
      name: 'Human Resources',
      location: 'Bengaluru',
    },
  });

  const itDept = await prisma.department.create({
    data: {
      id: 'dept-it',
      name: 'Information Technology',
      location: 'Bengaluru',
    },
  });

  const salesDept = await prisma.department.create({
    data: {
      id: 'dept-sales',
      name: 'Sales',
      location: 'Mumbai',
    },
  });

  const marketingDept = await prisma.department.create({
    data: {
      id: 'dept-marketing',
      name: 'Marketing',
      location: 'Delhi',
    },
  });

  const financeDept = await prisma.department.create({
    data: {
      id: 'dept-finance',
      name: 'Finance',
      location: 'Bengaluru',
    },
  });

  const operationsDept = await prisma.department.create({
    data: {
      id: 'dept-operations',
      name: 'Operations',
      location: 'Pune',
    },
  });

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // ========== INDIA USERS ==========

  // HR Admin - India
  const hrAdmin = await prisma.user.create({
    data: {
      id: 'user-hr-admin',
      employeeId: 'IND001',
      email: 'admin@company.com',
      password: hashedPassword,
      firstName: 'Maya',
      lastName: 'Sharma',
      role: 'HR',
      department: 'Human Resources',
      location: 'Bengaluru',
      joiningDate: new Date('2020-01-15'),
      status: 'ACTIVE',
      country: 'INDIA',
      gender: 'FEMALE',
      maritalStatus: 'MARRIED',
      designation: 'HR_MANAGER',
    },
  });

  // IT Manager
  const itManager = await prisma.user.create({
    data: {
      id: 'user-it-manager',
      employeeId: 'EMP002',
      email: 'manager@company.com',
      password: hashedPassword,
      firstName: 'Rajesh',
      lastName: 'Kumar',
      role: 'MANAGER',
      department: 'Information Technology',
      location: 'Bengaluru',
      joiningDate: new Date('2019-03-20'),
      status: 'ACTIVE',
    },
  });

  // Sales Manager
  const salesManager = await prisma.user.create({
    data: {
      id: 'user-sales-manager',
      employeeId: 'EMP005',
      email: 'sales.manager@company.com',
      password: hashedPassword,
      firstName: 'Amit',
      lastName: 'Gupta',
      role: 'MANAGER',
      department: 'Sales',
      location: 'Mumbai',
      joiningDate: new Date('2018-07-10'),
      status: 'ACTIVE',
    },
  });

  // Marketing Manager
  const marketingManager = await prisma.user.create({
    data: {
      id: 'user-marketing-manager',
      employeeId: 'EMP006',
      email: 'marketing.manager@company.com',
      password: hashedPassword,
      firstName: 'Sneha',
      lastName: 'Reddy',
      role: 'MANAGER',
      department: 'Marketing',
      location: 'Delhi',
      joiningDate: new Date('2019-11-05'),
      status: 'ACTIVE',
    },
  });

  // IT Employees
  const employee1 = await prisma.user.create({
    data: {
      id: 'user-employee1',
      employeeId: 'EMP003',
      email: 'user@company.com',
      password: hashedPassword,
      firstName: 'Priya',
      lastName: 'Patel',
      role: 'EMPLOYEE',
      department: 'Information Technology',
      location: 'Bengaluru',
      reportingManagerId: itManager.id,
      joiningDate: new Date('2021-06-10'),
      status: 'ACTIVE',
    },
  });

  const employee2 = await prisma.user.create({
    data: {
      id: 'user-employee2',
      employeeId: 'EMP007',
      email: 'arjun@company.com',
      password: hashedPassword,
      firstName: 'Arjun',
      lastName: 'Singh',
      role: 'EMPLOYEE',
      department: 'Information Technology',
      location: 'Bengaluru',
      reportingManagerId: itManager.id,
      joiningDate: new Date('2022-02-14'),
      status: 'ACTIVE',
    },
  });

  const employee3 = await prisma.user.create({
    data: {
      id: 'user-employee3',
      employeeId: 'EMP008',
      email: 'kavya@company.com',
      password: hashedPassword,
      firstName: 'Kavya',
      lastName: 'Menon',
      role: 'EMPLOYEE',
      department: 'Information Technology',
      location: 'Bengaluru',
      reportingManagerId: itManager.id,
      joiningDate: new Date('2023-01-20'),
      status: 'ACTIVE',
    },
  });

  // Sales Employees
  const salesEmployee1 = await prisma.user.create({
    data: {
      id: 'user-sales1',
      employeeId: 'EMP004',
      email: 'john@company.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'EMPLOYEE',
      department: 'Sales',
      location: 'Mumbai',
      reportingManagerId: salesManager.id,
      joiningDate: new Date('2022-01-15'),
      status: 'ACTIVE',
    },
  });

  const salesEmployee2 = await prisma.user.create({
    data: {
      id: 'user-sales2',
      employeeId: 'EMP009',
      email: 'rahul@company.com',
      password: hashedPassword,
      firstName: 'Rahul',
      lastName: 'Verma',
      role: 'EMPLOYEE',
      department: 'Sales',
      location: 'Mumbai',
      reportingManagerId: salesManager.id,
      joiningDate: new Date('2021-09-12'),
      status: 'ACTIVE',
    },
  });

  // Marketing Employees
  const marketingEmployee1 = await prisma.user.create({
    data: {
      id: 'user-marketing1',
      employeeId: 'EMP010',
      email: 'anita@company.com',
      password: hashedPassword,
      firstName: 'Anita',
      lastName: 'Joshi',
      role: 'EMPLOYEE',
      department: 'Marketing',
      location: 'Delhi',
      reportingManagerId: marketingManager.id,
      joiningDate: new Date('2022-05-18'),
      status: 'ACTIVE',
    },
  });

  const marketingEmployee2 = await prisma.user.create({
    data: {
      id: 'user-marketing2',
      employeeId: 'EMP011',
      email: 'deepak@company.com',
      password: hashedPassword,
      firstName: 'Deepak',
      lastName: 'Agarwal',
      role: 'EMPLOYEE',
      department: 'Marketing',
      location: 'Delhi',
      reportingManagerId: marketingManager.id,
      joiningDate: new Date('2023-03-22'),
      status: 'ACTIVE',
    },
  });

  // Finance Employees
  const financeEmployee1 = await prisma.user.create({
    data: {
      id: 'user-finance1',
      employeeId: 'EMP012',
      email: 'suresh@company.com',
      password: hashedPassword,
      firstName: 'Suresh',
      lastName: 'Nair',
      role: 'EMPLOYEE',
      department: 'Finance',
      location: 'Bengaluru',
      joiningDate: new Date('2020-11-30'),
      status: 'ACTIVE',
    },
  });

  const financeEmployee2 = await prisma.user.create({
    data: {
      id: 'user-finance2',
      employeeId: 'EMP013',
      email: 'meera@company.com',
      password: hashedPassword,
      firstName: 'Meera',
      lastName: 'Iyer',
      role: 'EMPLOYEE',
      department: 'Finance',
      location: 'Bengaluru',
      joiningDate: new Date('2021-12-05'),
      status: 'ACTIVE',
    },
  });

  // Operations Employees
  const operationsEmployee1 = await prisma.user.create({
    data: {
      id: 'user-operations1',
      employeeId: 'EMP014',
      email: 'vikram@company.com',
      password: hashedPassword,
      firstName: 'Vikram',
      lastName: 'Yadav',
      role: 'EMPLOYEE',
      department: 'Operations',
      location: 'Pune',
      joiningDate: new Date('2022-08-15'),
      status: 'ACTIVE',
    },
  });

  // Create leave policies
  const currentYear = new Date().getFullYear();

  await prisma.leavePolicy.createMany({
    data: [
      {
        id: 'policy-casual',
        name: 'Casual Leave Policy',
        leaveType: 'CASUAL_LEAVE',
        entitlementDays: 12,
        accrualRate: 1.0,
        maxCarryForward: 5,
        location: 'Bengaluru',
        region: 'INDIA',
        effectiveFrom: new Date(`${currentYear}-01-01`),
        isActive: true,
      },
      {
        id: 'policy-sick',
        name: 'Sick Leave Policy',
        leaveType: 'SICK_LEAVE',
        entitlementDays: 12,
        accrualRate: 1.0,
        maxCarryForward: 0,
        location: 'Bengaluru',
        region: 'INDIA',
        effectiveFrom: new Date(`${currentYear}-01-01`),
        isActive: true,
      },
      {
        id: 'policy-earned',
        name: 'Earned Leave Policy',
        leaveType: 'EARNED_LEAVE',
        entitlementDays: 21,
        accrualRate: 1.75,
        maxCarryForward: 15,
        location: 'Bengaluru',
        region: 'INDIA',
        effectiveFrom: new Date(`${currentYear}-01-01`),
        isActive: true,
      },
    ],
  });

  // Create leave balances for all users
  const allUsers = [
    hrAdmin, itManager, salesManager, marketingManager,
    employee1, employee2, employee3, salesEmployee1, salesEmployee2,
    marketingEmployee1, marketingEmployee2, financeEmployee1, financeEmployee2, operationsEmployee1
  ];
  const leaveTypes = ['CASUAL_LEAVE', 'SICK_LEAVE', 'EARNED_LEAVE', 'MATERNITY_LEAVE', 'PATERNITY_LEAVE'];

  for (const user of allUsers) {
    for (const leaveType of leaveTypes) {
      let entitlement = 12;
      let used = Math.floor(Math.random() * 3); // Random used leaves (0-2)

      if (leaveType === 'EARNED_LEAVE') {
        entitlement = 21;
        used = Math.floor(Math.random() * 5); // 0-4 for earned leave
      } else if (leaveType === 'MATERNITY_LEAVE') {
        entitlement = 180; // 6 months
        used = 0;
      } else if (leaveType === 'PATERNITY_LEAVE') {
        entitlement = 15; // 15 days
        used = 0;
      }

      await prisma.leaveBalance.create({
        data: {
          employeeId: user.id,
          leaveType,
          totalEntitlement: entitlement,
          used: used,
          available: entitlement - used,
          carryForward: leaveType === 'EARNED_LEAVE' ? Math.floor(Math.random() * 5) : 0,
          year: currentYear,
        },
      });
    }
  }

  // Create diverse leave requests with different statuses
  const leaveRequests = [];

  // Pending requests
  const pendingRequest1 = await prisma.leaveRequest.create({
    data: {
      id: 'leave-req-1',
      employeeId: employee1.id,
      leaveType: 'CASUAL_LEAVE',
      startDate: new Date('2024-12-20'),
      endDate: new Date('2024-12-22'),
      totalDays: 3,
      reason: 'Family wedding ceremony',
      status: 'PENDING',
      appliedDate: new Date(),
    },
  });
  leaveRequests.push(pendingRequest1);

  const pendingRequest2 = await prisma.leaveRequest.create({
    data: {
      id: 'leave-req-2',
      employeeId: salesEmployee1.id,
      leaveType: 'EARNED_LEAVE',
      startDate: new Date('2025-01-15'),
      endDate: new Date('2025-01-20'),
      totalDays: 6,
      reason: 'Vacation with family to Goa',
      status: 'PENDING',
      appliedDate: new Date(),
    },
  });
  leaveRequests.push(pendingRequest2);

  const pendingRequest3 = await prisma.leaveRequest.create({
    data: {
      id: 'leave-req-3',
      employeeId: marketingEmployee1.id,
      leaveType: 'SICK_LEAVE',
      startDate: new Date('2024-12-18'),
      endDate: new Date('2024-12-18'),
      totalDays: 1,
      isHalfDay: true,
      reason: 'Medical checkup appointment',
      status: 'PENDING',
      appliedDate: new Date(),
    },
  });
  leaveRequests.push(pendingRequest3);

  // Approved requests
  const approvedRequest1 = await prisma.leaveRequest.create({
    data: {
      id: 'leave-req-4',
      employeeId: employee2.id,
      leaveType: 'SICK_LEAVE',
      startDate: new Date('2024-11-15'),
      endDate: new Date('2024-11-16'),
      totalDays: 2,
      reason: 'Fever and cold symptoms',
      status: 'APPROVED',
      appliedDate: new Date('2024-11-10'),
    },
  });
  leaveRequests.push(approvedRequest1);

  const approvedRequest2 = await prisma.leaveRequest.create({
    data: {
      id: 'leave-req-5',
      employeeId: salesEmployee2.id,
      leaveType: 'CASUAL_LEAVE',
      startDate: new Date('2024-11-25'),
      endDate: new Date('2024-11-25'),
      totalDays: 1,
      reason: 'Personal work',
      status: 'APPROVED',
      appliedDate: new Date('2024-11-20'),
    },
  });
  leaveRequests.push(approvedRequest2);

  const approvedRequest3 = await prisma.leaveRequest.create({
    data: {
      id: 'leave-req-6',
      employeeId: financeEmployee1.id,
      leaveType: 'EARNED_LEAVE',
      startDate: new Date('2024-10-10'),
      endDate: new Date('2024-10-15'),
      totalDays: 6,
      reason: 'Diwali festival celebration with family',
      status: 'APPROVED',
      appliedDate: new Date('2024-09-25'),
    },
  });
  leaveRequests.push(approvedRequest3);

  // Rejected requests
  const rejectedRequest1 = await prisma.leaveRequest.create({
    data: {
      id: 'leave-req-7',
      employeeId: employee3.id,
      leaveType: 'CASUAL_LEAVE',
      startDate: new Date('2024-12-24'),
      endDate: new Date('2024-12-26'),
      totalDays: 3,
      reason: 'Christmas vacation',
      status: 'REJECTED',
      appliedDate: new Date('2024-11-30'),
    },
  });
  leaveRequests.push(rejectedRequest1);

  const rejectedRequest2 = await prisma.leaveRequest.create({
    data: {
      id: 'leave-req-8',
      employeeId: marketingEmployee2.id,
      leaveType: 'EARNED_LEAVE',
      startDate: new Date('2024-12-30'),
      endDate: new Date('2025-01-05'),
      totalDays: 7,
      reason: 'New Year vacation',
      status: 'REJECTED',
      appliedDate: new Date('2024-12-01'),
    },
  });
  leaveRequests.push(rejectedRequest2);

  // Historical approved requests
  const historicalRequest1 = await prisma.leaveRequest.create({
    data: {
      id: 'leave-req-9',
      employeeId: financeEmployee2.id,
      leaveType: 'CASUAL_LEAVE',
      startDate: new Date('2024-09-20'),
      endDate: new Date('2024-09-21'),
      totalDays: 2,
      reason: 'Ganesh Chaturthi celebration',
      status: 'APPROVED',
      appliedDate: new Date('2024-09-10'),
    },
  });
  leaveRequests.push(historicalRequest1);

  const historicalRequest2 = await prisma.leaveRequest.create({
    data: {
      id: 'leave-req-10',
      employeeId: operationsEmployee1.id,
      leaveType: 'SICK_LEAVE',
      startDate: new Date('2024-08-05'),
      endDate: new Date('2024-08-07'),
      totalDays: 3,
      reason: 'Food poisoning recovery',
      status: 'APPROVED',
      appliedDate: new Date('2024-08-04'),
    },
  });
  leaveRequests.push(historicalRequest2);

  // Create approvals for leave requests
  const approvals = [];

  // Pending approvals
  const approval1 = await prisma.approval.create({
    data: {
      leaveRequestId: pendingRequest1.id,
      approverId: itManager.id,
      level: 1,
      status: 'PENDING',
    },
  });

  const approval2 = await prisma.approval.create({
    data: {
      leaveRequestId: pendingRequest2.id,
      approverId: salesManager.id,
      level: 1,
      status: 'PENDING',
    },
  });

  const approval3 = await prisma.approval.create({
    data: {
      leaveRequestId: pendingRequest3.id,
      approverId: marketingManager.id,
      level: 1,
      status: 'PENDING',
    },
  });

  // Approved approvals
  const approval4 = await prisma.approval.create({
    data: {
      leaveRequestId: approvedRequest1.id,
      approverId: itManager.id,
      level: 1,
      status: 'APPROVED',
      approvedAt: new Date('2024-11-12'),
      comments: 'Get well soon! Take proper rest.',
    },
  });

  const approval5 = await prisma.approval.create({
    data: {
      leaveRequestId: approvedRequest2.id,
      approverId: salesManager.id,
      level: 1,
      status: 'APPROVED',
      approvedAt: new Date('2024-11-22'),
      comments: 'Approved for personal work.',
    },
  });

  const approval6 = await prisma.approval.create({
    data: {
      leaveRequestId: approvedRequest3.id,
      approverId: hrAdmin.id,
      level: 1,
      status: 'APPROVED',
      approvedAt: new Date('2024-09-28'),
      comments: 'Enjoy the festival celebrations!',
    },
  });

  // Rejected approvals
  const approval7 = await prisma.approval.create({
    data: {
      leaveRequestId: rejectedRequest1.id,
      approverId: itManager.id,
      level: 1,
      status: 'REJECTED',
      approvedAt: new Date('2024-12-02'),
      comments: 'Too many people on leave during Christmas. Please reschedule.',
    },
  });

  const approval8 = await prisma.approval.create({
    data: {
      leaveRequestId: rejectedRequest2.id,
      approverId: marketingManager.id,
      level: 1,
      status: 'REJECTED',
      approvedAt: new Date('2024-12-03'),
      comments: 'Year-end deadlines require full team presence.',
    },
  });

  // Historical approvals
  const approval9 = await prisma.approval.create({
    data: {
      leaveRequestId: historicalRequest1.id,
      approverId: hrAdmin.id,
      level: 1,
      status: 'APPROVED',
      approvedAt: new Date('2024-09-12'),
      comments: 'Approved for festival celebration.',
    },
  });

  const approval10 = await prisma.approval.create({
    data: {
      leaveRequestId: historicalRequest2.id,
      approverId: hrAdmin.id,
      level: 1,
      status: 'APPROVED',
      approvedAt: new Date('2024-08-05'),
      comments: 'Health recovery approved. Take care.',
    },
  });

  // Create comprehensive holiday calendar
  await prisma.holiday.createMany({
    data: [
      // National Holidays
      {
        name: 'New Year Day',
        date: new Date(`${currentYear + 1}-01-01`),
        location: 'All',
        region: 'INDIA',
        type: 'NATIONAL',
        isOptional: false,
      },
      {
        name: 'Republic Day',
        date: new Date(`${currentYear + 1}-01-26`),
        location: 'All',
        region: 'INDIA',
        type: 'NATIONAL',
        isOptional: false,
      },
      {
        name: 'Holi',
        date: new Date(`${currentYear + 1}-03-14`),
        location: 'All',
        region: 'INDIA',
        type: 'NATIONAL',
        isOptional: false,
      },
      {
        name: 'Good Friday',
        date: new Date(`${currentYear + 1}-04-18`),
        location: 'All',
        region: 'INDIA',
        type: 'NATIONAL',
        isOptional: false,
      },
      {
        name: 'Independence Day',
        date: new Date(`${currentYear + 1}-08-15`),
        location: 'All',
        region: 'INDIA',
        type: 'NATIONAL',
        isOptional: false,
      },
      {
        name: 'Gandhi Jayanti',
        date: new Date(`${currentYear + 1}-10-02`),
        location: 'All',
        region: 'INDIA',
        type: 'NATIONAL',
        isOptional: false,
      },
      {
        name: 'Christmas',
        date: new Date(`${currentYear + 1}-12-25`),
        location: 'All',
        region: 'INDIA',
        type: 'NATIONAL',
        isOptional: false,
      },

      // Regional and Festival Holidays
      {
        name: 'Diwali',
        date: new Date(`${currentYear + 1}-10-31`),
        location: 'All',
        region: 'INDIA',
        type: 'REGIONAL',
        isOptional: false,
      },
      {
        name: 'Dussehra',
        date: new Date(`${currentYear + 1}-10-12`),
        location: 'All',
        region: 'INDIA',
        type: 'REGIONAL',
        isOptional: false,
      },
      {
        name: 'Eid ul-Fitr',
        date: new Date(`${currentYear + 1}-04-10`),
        location: 'All',
        region: 'INDIA',
        type: 'REGIONAL',
        isOptional: false,
      },
      {
        name: 'Eid ul-Adha',
        date: new Date(`${currentYear + 1}-06-17`),
        location: 'All',
        region: 'INDIA',
        type: 'REGIONAL',
        isOptional: false,
      },
      {
        name: 'Raksha Bandhan',
        date: new Date(`${currentYear + 1}-08-19`),
        location: 'All',
        region: 'INDIA',
        type: 'REGIONAL',
        isOptional: true,
      },

      // Location-specific holidays
      {
        name: 'Karnataka Rajyotsava',
        date: new Date(`${currentYear + 1}-11-01`),
        location: 'Bengaluru',
        region: 'INDIA',
        type: 'REGIONAL',
        isOptional: false,
      },
      {
        name: 'Maharashtra Day',
        date: new Date(`${currentYear + 1}-05-01`),
        location: 'Mumbai',
        region: 'INDIA',
        type: 'REGIONAL',
        isOptional: false,
      },
      {
        name: 'Delhi Foundation Day',
        date: new Date(`${currentYear + 1}-04-15`),
        location: 'Delhi',
        region: 'INDIA',
        type: 'REGIONAL',
        isOptional: true,
      },

      // Company Holidays
      {
        name: 'Company Foundation Day',
        date: new Date(`${currentYear + 1}-03-22`),
        location: 'All',
        region: 'INDIA',
        type: 'COMPANY',
        isOptional: false,
      },
      {
        name: 'Annual Team Outing',
        date: new Date(`${currentYear + 1}-09-15`),
        location: 'All',
        region: 'INDIA',
        type: 'COMPANY',
        isOptional: false,
      },
      {
        name: 'Year End Party',
        date: new Date(`${currentYear + 1}-12-31`),
        location: 'All',
        region: 'INDIA',
        type: 'COMPANY',
        isOptional: true,
      },
    ],
  });

  // Create comprehensive notifications
  await prisma.notification.createMany({
    data: [
      // Pending approval notifications for managers
      {
        userId: itManager.id,
        type: 'APPROVAL_PENDING',
        title: 'Leave Approval Required',
        message: `${employee1.firstName} ${employee1.lastName} has submitted a casual leave request for your approval (Dec 20-22, 2024).`,
        isRead: false,
      },
      {
        userId: salesManager.id,
        type: 'APPROVAL_PENDING',
        title: 'Leave Approval Required',
        message: `${salesEmployee1.firstName} ${salesEmployee1.lastName} has submitted an earned leave request for your approval (Jan 15-20, 2025).`,
        isRead: false,
      },
      {
        userId: marketingManager.id,
        type: 'APPROVAL_PENDING',
        title: 'Leave Approval Required',
        message: `${marketingEmployee1.firstName} ${marketingEmployee1.lastName} has submitted a sick leave request for your approval (Dec 18, 2024).`,
        isRead: false,
      },

      // Approved leave notifications for employees
      {
        userId: employee2.id,
        type: 'LEAVE_APPROVED',
        title: 'Leave Request Approved',
        message: 'Your sick leave request for Nov 15-16, 2024 has been approved by your manager.',
        isRead: false,
      },
      {
        userId: salesEmployee2.id,
        type: 'LEAVE_APPROVED',
        title: 'Leave Request Approved',
        message: 'Your casual leave request for Nov 25, 2024 has been approved.',
        isRead: true,
      },
      {
        userId: financeEmployee1.id,
        type: 'LEAVE_APPROVED',
        title: 'Leave Request Approved',
        message: 'Your Diwali vacation leave request (Oct 10-15, 2024) has been approved.',
        isRead: true,
      },

      // Rejected leave notifications
      {
        userId: employee3.id,
        type: 'LEAVE_REJECTED',
        title: 'Leave Request Rejected',
        message: 'Your Christmas leave request has been rejected. Please reschedule as too many team members are on leave.',
        isRead: false,
      },
      {
        userId: marketingEmployee2.id,
        type: 'LEAVE_REJECTED',
        title: 'Leave Request Rejected',
        message: 'Your New Year vacation request has been rejected due to year-end deadlines.',
        isRead: false,
      },

      // HR Admin notifications
      {
        userId: hrAdmin.id,
        type: 'LEAVE_REQUESTED',
        title: 'Multiple Pending Approvals',
        message: 'There are 3 leave requests pending approval across different departments.',
        isRead: false,
      },
      {
        userId: hrAdmin.id,
        type: 'SYSTEM_ALERT',
        title: 'Holiday Calendar Updated',
        message: 'Holiday calendar for 2025 has been updated with 17 holidays.',
        isRead: true,
      },
      {
        userId: hrAdmin.id,
        type: 'LEAVE_BALANCE_ALERT',
        title: 'Leave Balance Alert',
        message: 'Some employees have high unused leave balances that may expire.',
        isRead: true,
      },

      // General notifications
      {
        userId: itManager.id,
        type: 'TEAM_UPDATE',
        title: 'Team Leave Summary',
        message: 'Your team has 2 pending leave requests requiring approval.',
        isRead: false,
      },
      {
        userId: salesManager.id,
        type: 'TEAM_UPDATE',
        title: 'Team Leave Summary',
        message: 'Your team member Rahul Verma has high leave utilization this year.',
        isRead: true,
      },

      // System notifications
      {
        userId: employee1.id,
        type: 'LEAVE_REMINDER',
        title: 'Leave Balance Reminder',
        message: 'You have 9 casual leaves remaining this year. Plan your leaves accordingly.',
        isRead: false,
      },
      {
        userId: marketingEmployee1.id,
        type: 'LEAVE_REMINDER',
        title: 'Leave Balance Reminder',
        message: 'You have 18 earned leaves remaining. Consider taking a vacation!',
        isRead: true,
      },
    ],
  });

  // Create audit logs for tracking system activities
  await prisma.auditLog.createMany({
    data: [
      // User login activities
      {
        userId: hrAdmin.id,
        entity: 'User',
        entityId: hrAdmin.id,
        action: 'LOGIN',
        newValues: JSON.stringify({ loginTime: new Date(), ipAddress: '192.168.1.100' }),
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      {
        userId: itManager.id,
        entity: 'User',
        entityId: itManager.id,
        action: 'LOGIN',
        newValues: JSON.stringify({ loginTime: new Date(), ipAddress: '192.168.1.101' }),
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },

      // Leave request activities
      {
        userId: employee1.id,
        entity: 'LeaveRequest',
        entityId: pendingRequest1.id,
        action: 'CREATE',
        newValues: JSON.stringify({
          leaveType: 'CASUAL_LEAVE',
          startDate: '2024-12-20',
          endDate: '2024-12-22',
          reason: 'Family wedding ceremony'
        }),
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      {
        userId: itManager.id,
        entity: 'LeaveRequest',
        entityId: approvedRequest1.id,
        action: 'APPROVE',
        oldValues: JSON.stringify({ status: 'PENDING' }),
        newValues: JSON.stringify({ status: 'APPROVED', comments: 'Get well soon! Take proper rest.' }),
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      {
        userId: itManager.id,
        entity: 'LeaveRequest',
        entityId: rejectedRequest1.id,
        action: 'REJECT',
        oldValues: JSON.stringify({ status: 'PENDING' }),
        newValues: JSON.stringify({ status: 'REJECTED', comments: 'Too many people on leave during Christmas. Please reschedule.' }),
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },

      // Leave balance updates
      {
        userId: employee2.id,
        entity: 'LeaveBalance',
        entityId: 'balance-sick-emp2',
        action: 'UPDATE',
        oldValues: JSON.stringify({ used: 0, available: 12 }),
        newValues: JSON.stringify({ used: 2, available: 10 }),
        ipAddress: 'system',
        userAgent: 'system-process',
      },

      // Policy changes
      {
        userId: hrAdmin.id,
        entity: 'LeavePolicy',
        entityId: 'policy-casual',
        action: 'UPDATE',
        oldValues: JSON.stringify({ maxCarryForward: 3 }),
        newValues: JSON.stringify({ maxCarryForward: 5 }),
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },

      // Holiday management
      {
        userId: hrAdmin.id,
        entity: 'Holiday',
        entityId: 'holiday-diwali-2025',
        action: 'CREATE',
        newValues: JSON.stringify({
          name: 'Diwali',
          date: '2025-10-31',
          type: 'REGIONAL',
          location: 'All'
        }),
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },

      // System maintenance
      {
        entity: 'System',
        entityId: 'database',
        action: 'BACKUP',
        newValues: JSON.stringify({ backupTime: new Date(), size: '2.5MB' }),
        ipAddress: 'system',
        userAgent: 'backup-service',
      },
      {
        entity: 'System',
        entityId: 'leave-balances',
        action: 'BULK_UPDATE',
        newValues: JSON.stringify({ updatedRecords: 70, operation: 'annual-refresh' }),
        ipAddress: 'system',
        userAgent: 'cron-job',
      },
    ],
  });

  console.log('✅ Comprehensive database seeded successfully!');
  console.log('📊 Created:');
  console.log('  - 6 Departments (HR, IT, Sales, Marketing, Finance, Operations)');
  console.log('  - 14 Users (1 HR Admin, 4 Managers, 9 Employees)');
  console.log('  - 3 Leave Policies (Casual, Sick, Earned Leave)');
  console.log('  - 70 Leave Balances (5 types × 14 users)');
  console.log('  - 10 Leave Requests (3 Pending, 4 Approved, 2 Rejected, 1 Historical)');
  console.log('  - 10 Approvals (with realistic manager assignments)');
  console.log('  - 17 Holidays (National, Regional, Company-specific)');
  console.log('  - 15 Notifications (Approvals, Rejections, Reminders)');
  console.log('  - 10 Audit Logs (Login, Leave actions, System activities)');
  console.log('');
  console.log('🔐 Login Credentials:');
  console.log('  HR Admin: admin@company.com / password123');
  console.log('  IT Manager: manager@company.com / password123');
  console.log('  Sales Manager: sales.manager@company.com / password123');
  console.log('  Marketing Manager: marketing.manager@company.com / password123');
  console.log('  IT Employee: user@company.com / password123');
  console.log('  IT Employee 2: arjun@company.com / password123');
  console.log('  IT Employee 3: kavya@company.com / password123');
  console.log('  Sales Employee: john@company.com / password123');
  console.log('  Sales Employee 2: rahul@company.com / password123');
  console.log('  Marketing Employee: anita@company.com / password123');
  console.log('  Marketing Employee 2: deepak@company.com / password123');
  console.log('  Finance Employee: suresh@company.com / password123');
  console.log('  Finance Employee 2: meera@company.com / password123');
  console.log('  Operations Employee: vikram@company.com / password123');
  console.log('');
  console.log('🏢 Department Structure:');
  console.log('  - Human Resources (Bengaluru) - Maya Sharma');
  console.log('  - Information Technology (Bengaluru) - Rajesh Kumar (3 reports)');
  console.log('  - Sales (Mumbai) - Amit Gupta (2 reports)');
  console.log('  - Marketing (Delhi) - Sneha Reddy (2 reports)');
  console.log('  - Finance (Bengaluru) - 2 employees');
  console.log('  - Operations (Pune) - 1 employee');
  console.log('');
  console.log('📅 Leave Request Scenarios:');
  console.log('  - 3 Pending requests requiring manager approval');
  console.log('  - 4 Approved requests with manager comments');
  console.log('  - 2 Rejected requests with detailed reasons');
  console.log('  - 1 Historical request for reference');
  console.log('');
  console.log('🎉 Ready for comprehensive demo and testing!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });