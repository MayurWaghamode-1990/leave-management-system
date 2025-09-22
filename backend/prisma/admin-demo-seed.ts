import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting COMPREHENSIVE ADMIN DEMO seed...');

  // Clear all existing data
  console.log('🧹 Clearing existing data...');
  await prisma.notification.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.leaveBalance.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.leavePolicy.deleteMany();
  await prisma.auditLog.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 10);
  const currentYear = new Date().getFullYear();

  // 1. CREATE COMPREHENSIVE DEPARTMENT STRUCTURE
  console.log('🏢 Creating departments...');

  const departments = await Promise.all([
    prisma.department.create({
      data: {
        id: 'dept-hr',
        name: 'Human Resources',
        location: 'Bengaluru',
      },
    }),
    prisma.department.create({
      data: {
        id: 'dept-engineering',
        name: 'Engineering',
        location: 'Bengaluru',
      },
    }),
    prisma.department.create({
      data: {
        id: 'dept-sales',
        name: 'Sales & Marketing',
        location: 'Mumbai',
      },
    }),
    prisma.department.create({
      data: {
        id: 'dept-finance',
        name: 'Finance & Operations',
        location: 'Delhi',
      },
    }),
    prisma.department.create({
      data: {
        id: 'dept-product',
        name: 'Product Management',
        location: 'Pune',
      },
    }),
    prisma.department.create({
      data: {
        id: 'dept-support',
        name: 'Customer Support',
        location: 'Hyderabad',
      },
    }),
  ]);

  // 2. CREATE 1 HR ADMIN (Main Admin)
  console.log('👑 Creating HR Admin...');

  const hrAdmin = await prisma.user.create({
    data: {
      id: 'user-hr-admin',
      employeeId: 'EMP001',
      email: 'admin@company.com',
      password: hashedPassword,
      firstName: 'Maya',
      lastName: 'Sharma',
      role: 'HR_ADMIN',
      department: 'Human Resources',
      location: 'Bengaluru',
      joiningDate: new Date('2020-01-15'),
      status: 'ACTIVE',
    },
  });

  // 3. CREATE 5 MANAGERS
  console.log('👥 Creating 5 managers...');

  const managers = await Promise.all([
    // Engineering Manager
    prisma.user.create({
      data: {
        id: 'mgr-engineering',
        employeeId: 'MGR001',
        email: 'engineering.manager@company.com',
        password: hashedPassword,
        firstName: 'Rajesh',
        lastName: 'Kumar',
        role: 'MANAGER',
        department: 'Engineering',
        location: 'Bengaluru',
        joiningDate: new Date('2019-03-20'),
        status: 'ACTIVE',
      },
    }),
    // Sales Manager
    prisma.user.create({
      data: {
        id: 'mgr-sales',
        employeeId: 'MGR002',
        email: 'sales.manager@company.com',
        password: hashedPassword,
        firstName: 'Amit',
        lastName: 'Gupta',
        role: 'MANAGER',
        department: 'Sales & Marketing',
        location: 'Mumbai',
        joiningDate: new Date('2018-07-10'),
        status: 'ACTIVE',
      },
    }),
    // Finance Manager
    prisma.user.create({
      data: {
        id: 'mgr-finance',
        employeeId: 'MGR003',
        email: 'finance.manager@company.com',
        password: hashedPassword,
        firstName: 'Sneha',
        lastName: 'Reddy',
        role: 'MANAGER',
        department: 'Finance & Operations',
        location: 'Delhi',
        joiningDate: new Date('2019-11-05'),
        status: 'ACTIVE',
      },
    }),
    // Product Manager
    prisma.user.create({
      data: {
        id: 'mgr-product',
        employeeId: 'MGR004',
        email: 'product.manager@company.com',
        password: hashedPassword,
        firstName: 'Vikram',
        lastName: 'Agarwal',
        role: 'MANAGER',
        department: 'Product Management',
        location: 'Pune',
        joiningDate: new Date('2020-02-18'),
        status: 'ACTIVE',
      },
    }),
    // Support Manager
    prisma.user.create({
      data: {
        id: 'mgr-support',
        employeeId: 'MGR005',
        email: 'support.manager@company.com',
        password: hashedPassword,
        firstName: 'Priya',
        lastName: 'Nair',
        role: 'MANAGER',
        department: 'Customer Support',
        location: 'Hyderabad',
        joiningDate: new Date('2020-08-12'),
        status: 'ACTIVE',
      },
    }),
  ]);

  // 4. CREATE 12 EMPLOYEES (2-3 under each manager)
  console.log('🧑‍💼 Creating 12 employees...');

  const employees = await Promise.all([
    // Engineering Team (3 employees)
    prisma.user.create({
      data: {
        id: 'emp-eng-001',
        employeeId: 'ENG001',
        email: 'arjun.singh@company.com',
        password: hashedPassword,
        firstName: 'Arjun',
        lastName: 'Singh',
        role: 'EMPLOYEE',
        department: 'Engineering',
        location: 'Bengaluru',
        reportingManagerId: managers[0].id,
        joiningDate: new Date('2022-02-14'),
        status: 'ACTIVE',
      },
    }),
    prisma.user.create({
      data: {
        id: 'emp-eng-002',
        employeeId: 'ENG002',
        email: 'kavya.menon@company.com',
        password: hashedPassword,
        firstName: 'Kavya',
        lastName: 'Menon',
        role: 'EMPLOYEE',
        department: 'Engineering',
        location: 'Bengaluru',
        reportingManagerId: managers[0].id,
        joiningDate: new Date('2023-01-20'),
        status: 'ACTIVE',
      },
    }),
    prisma.user.create({
      data: {
        id: 'emp-eng-003',
        employeeId: 'ENG003',
        email: 'rohit.sharma@company.com',
        password: hashedPassword,
        firstName: 'Rohit',
        lastName: 'Sharma',
        role: 'EMPLOYEE',
        department: 'Engineering',
        location: 'Bengaluru',
        reportingManagerId: managers[0].id,
        joiningDate: new Date('2021-08-10'),
        status: 'ACTIVE',
      },
    }),

    // Sales Team (3 employees)
    prisma.user.create({
      data: {
        id: 'emp-sales-001',
        employeeId: 'SAL001',
        email: 'rahul.verma@company.com',
        password: hashedPassword,
        firstName: 'Rahul',
        lastName: 'Verma',
        role: 'EMPLOYEE',
        department: 'Sales & Marketing',
        location: 'Mumbai',
        reportingManagerId: managers[1].id,
        joiningDate: new Date('2021-09-12'),
        status: 'ACTIVE',
      },
    }),
    prisma.user.create({
      data: {
        id: 'emp-sales-002',
        employeeId: 'SAL002',
        email: 'anita.joshi@company.com',
        password: hashedPassword,
        firstName: 'Anita',
        lastName: 'Joshi',
        role: 'EMPLOYEE',
        department: 'Sales & Marketing',
        location: 'Mumbai',
        reportingManagerId: managers[1].id,
        joiningDate: new Date('2022-05-18'),
        status: 'ACTIVE',
      },
    }),
    prisma.user.create({
      data: {
        id: 'emp-sales-003',
        employeeId: 'SAL003',
        email: 'deepak.mishra@company.com',
        password: hashedPassword,
        firstName: 'Deepak',
        lastName: 'Mishra',
        role: 'EMPLOYEE',
        department: 'Sales & Marketing',
        location: 'Mumbai',
        reportingManagerId: managers[1].id,
        joiningDate: new Date('2023-03-22'),
        status: 'ACTIVE',
      },
    }),

    // Finance Team (2 employees)
    prisma.user.create({
      data: {
        id: 'emp-fin-001',
        employeeId: 'FIN001',
        email: 'suresh.nair@company.com',
        password: hashedPassword,
        firstName: 'Suresh',
        lastName: 'Nair',
        role: 'EMPLOYEE',
        department: 'Finance & Operations',
        location: 'Delhi',
        reportingManagerId: managers[2].id,
        joiningDate: new Date('2020-11-30'),
        status: 'ACTIVE',
      },
    }),
    prisma.user.create({
      data: {
        id: 'emp-fin-002',
        employeeId: 'FIN002',
        email: 'meera.iyer@company.com',
        password: hashedPassword,
        firstName: 'Meera',
        lastName: 'Iyer',
        role: 'EMPLOYEE',
        department: 'Finance & Operations',
        location: 'Delhi',
        reportingManagerId: managers[2].id,
        joiningDate: new Date('2021-12-05'),
        status: 'ACTIVE',
      },
    }),

    // Product Team (2 employees)
    prisma.user.create({
      data: {
        id: 'emp-prod-001',
        employeeId: 'PRD001',
        email: 'nikhil.patil@company.com',
        password: hashedPassword,
        firstName: 'Nikhil',
        lastName: 'Patil',
        role: 'EMPLOYEE',
        department: 'Product Management',
        location: 'Pune',
        reportingManagerId: managers[3].id,
        joiningDate: new Date('2022-04-10'),
        status: 'ACTIVE',
      },
    }),
    prisma.user.create({
      data: {
        id: 'emp-prod-002',
        employeeId: 'PRD002',
        email: 'divya.rao@company.com',
        password: hashedPassword,
        firstName: 'Divya',
        lastName: 'Rao',
        role: 'EMPLOYEE',
        department: 'Product Management',
        location: 'Pune',
        reportingManagerId: managers[3].id,
        joiningDate: new Date('2023-06-15'),
        status: 'ACTIVE',
      },
    }),

    // Support Team (2 employees)
    prisma.user.create({
      data: {
        id: 'emp-sup-001',
        employeeId: 'SUP001',
        email: 'karan.kapoor@company.com',
        password: hashedPassword,
        firstName: 'Karan',
        lastName: 'Kapoor',
        role: 'EMPLOYEE',
        department: 'Customer Support',
        location: 'Hyderabad',
        reportingManagerId: managers[4].id,
        joiningDate: new Date('2022-08-15'),
        status: 'ACTIVE',
      },
    }),
    prisma.user.create({
      data: {
        id: 'emp-sup-002',
        employeeId: 'SUP002',
        email: 'pooja.goel@company.com',
        password: hashedPassword,
        firstName: 'Pooja',
        lastName: 'Goel',
        role: 'EMPLOYEE',
        department: 'Customer Support',
        location: 'Hyderabad',
        reportingManagerId: managers[4].id,
        joiningDate: new Date('2023-01-25'),
        status: 'ACTIVE',
      },
    }),
  ]);

  // 5. CREATE COMPREHENSIVE LEAVE POLICIES
  console.log('📋 Creating comprehensive leave policies...');

  const policies = await Promise.all([
    // Basic Leave Types
    prisma.leavePolicy.create({
      data: {
        id: 'policy-casual',
        name: 'Casual Leave Policy',
        leaveType: 'CASUAL_LEAVE',
        entitlementDays: 12,
        accrualRate: 1.0,
        maxCarryForward: 5,
        minimumGap: 0,
        maxConsecutiveDays: 7,
        requiresDocumentation: false,
        documentationThreshold: 3,
        location: 'All',
        region: 'INDIA',
        effectiveFrom: new Date(`${currentYear}-01-01`),
        isActive: true,
      },
    }),
    prisma.leavePolicy.create({
      data: {
        id: 'policy-sick',
        name: 'Sick Leave Policy',
        leaveType: 'SICK_LEAVE',
        entitlementDays: 12,
        accrualRate: 1.0,
        maxCarryForward: 0,
        minimumGap: 0,
        maxConsecutiveDays: 30,
        requiresDocumentation: true,
        documentationThreshold: 3,
        location: 'All',
        region: 'INDIA',
        effectiveFrom: new Date(`${currentYear}-01-01`),
        isActive: true,
      },
    }),
    prisma.leavePolicy.create({
      data: {
        id: 'policy-earned',
        name: 'Earned Leave Policy',
        leaveType: 'EARNED_LEAVE',
        entitlementDays: 21,
        accrualRate: 1.75,
        maxCarryForward: 15,
        minimumGap: 1,
        maxConsecutiveDays: 21,
        requiresDocumentation: false,
        documentationThreshold: 10,
        location: 'All',
        region: 'INDIA',
        effectiveFrom: new Date(`${currentYear}-01-01`),
        isActive: true,
      },
    }),
    // Special Leave Types
    prisma.leavePolicy.create({
      data: {
        id: 'policy-maternity',
        name: 'Maternity Leave Policy',
        leaveType: 'MATERNITY_LEAVE',
        entitlementDays: 180,
        accrualRate: 0,
        maxCarryForward: 0,
        minimumGap: 0,
        maxConsecutiveDays: 180,
        requiresDocumentation: true,
        documentationThreshold: 1,
        location: 'All',
        region: 'INDIA',
        effectiveFrom: new Date(`${currentYear}-01-01`),
        isActive: true,
      },
    }),
    prisma.leavePolicy.create({
      data: {
        id: 'policy-paternity',
        name: 'Paternity Leave Policy',
        leaveType: 'PATERNITY_LEAVE',
        entitlementDays: 15,
        accrualRate: 0,
        maxCarryForward: 0,
        minimumGap: 0,
        maxConsecutiveDays: 15,
        requiresDocumentation: true,
        documentationThreshold: 1,
        location: 'All',
        region: 'INDIA',
        effectiveFrom: new Date(`${currentYear}-01-01`),
        isActive: true,
      },
    }),
    // Location-specific policies
    prisma.leavePolicy.create({
      data: {
        id: 'policy-compensatory',
        name: 'Compensatory Off Policy',
        leaveType: 'COMPENSATORY_OFF',
        entitlementDays: 24,
        accrualRate: 0,
        maxCarryForward: 12,
        minimumGap: 0,
        maxConsecutiveDays: 5,
        requiresDocumentation: false,
        documentationThreshold: 0,
        location: 'All',
        region: 'INDIA',
        effectiveFrom: new Date(`${currentYear}-01-01`),
        isActive: true,
      },
    }),
    prisma.leavePolicy.create({
      data: {
        id: 'policy-bereavement',
        name: 'Bereavement Leave Policy',
        leaveType: 'BEREAVEMENT_LEAVE',
        entitlementDays: 5,
        accrualRate: 0,
        maxCarryForward: 0,
        minimumGap: 0,
        maxConsecutiveDays: 5,
        requiresDocumentation: true,
        documentationThreshold: 1,
        location: 'All',
        region: 'INDIA',
        effectiveFrom: new Date(`${currentYear}-01-01`),
        isActive: true,
      },
    }),
  ]);

  // 6. CREATE LEAVE BALANCES FOR ALL USERS
  console.log('💰 Creating leave balances...');

  const allUsers = [hrAdmin, ...managers, ...employees];
  const leaveTypes = ['CASUAL_LEAVE', 'SICK_LEAVE', 'EARNED_LEAVE', 'MATERNITY_LEAVE', 'PATERNITY_LEAVE', 'COMPENSATORY_OFF', 'BEREAVEMENT_LEAVE'];

  for (const user of allUsers) {
    for (const leaveType of leaveTypes) {
      let entitlement = 12;
      let used = Math.floor(Math.random() * 3);

      switch (leaveType) {
        case 'EARNED_LEAVE':
          entitlement = 21;
          used = Math.floor(Math.random() * 6);
          break;
        case 'MATERNITY_LEAVE':
          entitlement = 180;
          used = 0;
          break;
        case 'PATERNITY_LEAVE':
          entitlement = 15;
          used = 0;
          break;
        case 'COMPENSATORY_OFF':
          entitlement = 24;
          used = Math.floor(Math.random() * 4);
          break;
        case 'BEREAVEMENT_LEAVE':
          entitlement = 5;
          used = 0;
          break;
      }

      await prisma.leaveBalance.create({
        data: {
          employeeId: user.id,
          leaveType,
          totalEntitlement: entitlement,
          used: used,
          available: entitlement - used,
          carryForward: leaveType === 'EARNED_LEAVE' ? Math.floor(Math.random() * 8) : 0,
          year: currentYear,
        },
      });
    }
  }

  // 7. CREATE DIVERSE LEAVE REQUESTS (20+ scenarios)
  console.log('📝 Creating diverse leave requests...');

  const leaveRequests = [];

  // Pending requests (for managers to approve)
  for (let i = 0; i < 6; i++) {
    const employee = employees[i];
    const manager = managers[Math.floor(i / 2)];
    const leaveTypes = ['CASUAL_LEAVE', 'SICK_LEAVE', 'EARNED_LEAVE'];
    const leaveType = leaveTypes[i % 3];

    const request = await prisma.leaveRequest.create({
      data: {
        id: `pending-req-${i + 1}`,
        employeeId: employee.id,
        leaveType,
        startDate: new Date(2024, 11, 20 + i * 2), // Dec 2024
        endDate: new Date(2024, 11, 21 + i * 2),
        totalDays: 2,
        reason: `${leaveType.replace('_', ' ').toLowerCase()} for personal reasons`,
        status: 'PENDING',
        appliedDate: new Date(),
      },
    });
    leaveRequests.push(request);

    // Create approval record
    await prisma.approval.create({
      data: {
        leaveRequestId: request.id,
        approverId: manager.id,
        level: 1,
        status: 'PENDING',
      },
    });
  }

  // Approved requests (recent history)
  for (let i = 6; i < 12; i++) {
    const employee = employees[i];
    const manager = managers[Math.floor((i - 6) / 2)]; // Fix manager assignment
    const leaveTypes = ['CASUAL_LEAVE', 'SICK_LEAVE', 'EARNED_LEAVE'];
    const leaveType = leaveTypes[i % 3];

    const request = await prisma.leaveRequest.create({
      data: {
        id: `approved-req-${i + 1}`,
        employeeId: employee.id,
        leaveType,
        startDate: new Date(2024, 10, 15 + i), // Nov 2024
        endDate: new Date(2024, 10, 16 + i),
        totalDays: 2,
        reason: `${leaveType.replace('_', ' ').toLowerCase()} - approved request`,
        status: 'APPROVED',
        appliedDate: new Date(2024, 10, 10 + i),
      },
    });
    leaveRequests.push(request);

    await prisma.approval.create({
      data: {
        leaveRequestId: request.id,
        approverId: manager.id,
        level: 1,
        status: 'APPROVED',
        approvedAt: new Date(2024, 10, 12 + i),
        comments: 'Approved as per team schedule',
      },
    });
  }

  // Rejected requests (for analytics)
  for (let i = 0; i < 3; i++) {
    const employee = employees[i];
    const manager = managers[0];

    const request = await prisma.leaveRequest.create({
      data: {
        id: `rejected-req-${i + 1}`,
        employeeId: employee.id,
        leaveType: 'EARNED_LEAVE',
        startDate: new Date(2024, 11, 24 + i), // Christmas period
        endDate: new Date(2024, 11, 28 + i),
        totalDays: 5,
        reason: 'Year-end vacation',
        status: 'REJECTED',
        appliedDate: new Date(2024, 11, 1),
      },
    });
    leaveRequests.push(request);

    await prisma.approval.create({
      data: {
        leaveRequestId: request.id,
        approverId: manager.id,
        level: 1,
        status: 'REJECTED',
        approvedAt: new Date(2024, 11, 3),
        comments: 'Too many requests during year-end. Please reschedule.',
      },
    });
  }

  // Long-term leaves (Maternity/Paternity examples)
  const longTermRequest = await prisma.leaveRequest.create({
    data: {
      id: 'maternity-req-1',
      employeeId: employees[4].id, // Anita Joshi
      leaveType: 'MATERNITY_LEAVE',
      startDate: new Date(2025, 2, 1), // March 2025
      endDate: new Date(2025, 8, 1), // September 2025
      totalDays: 180,
      reason: 'Maternity leave as per company policy',
      status: 'APPROVED',
      appliedDate: new Date(2024, 11, 15),
    },
  });

  await prisma.approval.create({
    data: {
      leaveRequestId: longTermRequest.id,
      approverId: hrAdmin.id,
      level: 1,
      status: 'APPROVED',
      approvedAt: new Date(2024, 11, 16),
      comments: 'Maternity leave approved. Congratulations!',
    },
  });

  // 8. CREATE COMPREHENSIVE HOLIDAY CALENDAR
  console.log('🎉 Creating comprehensive holiday calendar...');

  await prisma.holiday.createMany({
    data: [
      // National Holidays
      { name: 'New Year Day', date: new Date(`${currentYear + 1}-01-01`), location: 'All', region: 'INDIA', type: 'NATIONAL', isOptional: false },
      { name: 'Republic Day', date: new Date(`${currentYear + 1}-01-26`), location: 'All', region: 'INDIA', type: 'NATIONAL', isOptional: false },
      { name: 'Holi', date: new Date(`${currentYear + 1}-03-14`), location: 'All', region: 'INDIA', type: 'NATIONAL', isOptional: false },
      { name: 'Good Friday', date: new Date(`${currentYear + 1}-04-18`), location: 'All', region: 'INDIA', type: 'NATIONAL', isOptional: false },
      { name: 'Independence Day', date: new Date(`${currentYear + 1}-08-15`), location: 'All', region: 'INDIA', type: 'NATIONAL', isOptional: false },
      { name: 'Gandhi Jayanti', date: new Date(`${currentYear + 1}-10-02`), location: 'All', region: 'INDIA', type: 'NATIONAL', isOptional: false },
      { name: 'Christmas', date: new Date(`${currentYear + 1}-12-25`), location: 'All', region: 'INDIA', type: 'NATIONAL', isOptional: false },

      // Regional Holidays
      { name: 'Diwali', date: new Date(`${currentYear + 1}-10-31`), location: 'All', region: 'INDIA', type: 'REGIONAL', isOptional: false },
      { name: 'Dussehra', date: new Date(`${currentYear + 1}-10-12`), location: 'All', region: 'INDIA', type: 'REGIONAL', isOptional: false },
      { name: 'Eid ul-Fitr', date: new Date(`${currentYear + 1}-04-10`), location: 'All', region: 'INDIA', type: 'REGIONAL', isOptional: false },
      { name: 'Eid ul-Adha', date: new Date(`${currentYear + 1}-06-17`), location: 'All', region: 'INDIA', type: 'REGIONAL', isOptional: false },

      // Location-specific holidays
      { name: 'Karnataka Rajyotsava', date: new Date(`${currentYear + 1}-11-01`), location: 'Bengaluru', region: 'INDIA', type: 'REGIONAL', isOptional: false },
      { name: 'Maharashtra Day', date: new Date(`${currentYear + 1}-05-01`), location: 'Mumbai', region: 'INDIA', type: 'REGIONAL', isOptional: false },
      { name: 'Telangana Day', date: new Date(`${currentYear + 1}-06-02`), location: 'Hyderabad', region: 'INDIA', type: 'REGIONAL', isOptional: false },
      { name: 'Maharashtra Gudi Padwa', date: new Date(`${currentYear + 1}-03-30`), location: 'Pune', region: 'INDIA', type: 'REGIONAL', isOptional: true },

      // Company Holidays
      { name: 'Company Foundation Day', date: new Date(`${currentYear + 1}-03-22`), location: 'All', region: 'INDIA', type: 'COMPANY', isOptional: false },
      { name: 'Annual Team Outing', date: new Date(`${currentYear + 1}-09-15`), location: 'All', region: 'INDIA', type: 'COMPANY', isOptional: false },
      { name: 'Year End Celebration', date: new Date(`${currentYear + 1}-12-31`), location: 'All', region: 'INDIA', type: 'COMPANY', isOptional: true },
    ],
  });

  // 9. CREATE COMPREHENSIVE NOTIFICATIONS
  console.log('🔔 Creating notifications...');

  await prisma.notification.createMany({
    data: [
      // For HR Admin
      { userId: hrAdmin.id, type: 'SYSTEM_ALERT', title: 'Multiple Pending Approvals', message: 'There are 6 leave requests pending approval across departments.', isRead: false },
      { userId: hrAdmin.id, type: 'LEAVE_BALANCE_ALERT', title: 'Year-end Leave Balance Alert', message: '5 employees have high unused leave balances that may expire.', isRead: false },
      { userId: hrAdmin.id, type: 'POLICY_UPDATE', title: 'Leave Policy Updated', message: 'Casual leave policy has been updated with new carry-forward rules.', isRead: true },
      { userId: hrAdmin.id, type: 'BULK_OPERATION', title: 'Bulk Leave Balance Update', message: 'Successfully updated leave balances for 18 employees.', isRead: true },

      // For Managers (Approval requests)
      { userId: managers[0].id, type: 'APPROVAL_PENDING', title: 'Leave Approval Required', message: '2 team members have submitted leave requests for your approval.', isRead: false },
      { userId: managers[1].id, type: 'APPROVAL_PENDING', title: 'Leave Approval Required', message: '2 team members have submitted leave requests for your approval.', isRead: false },
      { userId: managers[2].id, type: 'TEAM_UPDATE', title: 'Team Leave Summary', message: 'Your team has utilized 65% of allocated leave balance this year.', isRead: false },

      // For Employees (Various scenarios)
      { userId: employees[0].id, type: 'LEAVE_APPROVED', title: 'Leave Request Approved', message: 'Your sick leave request for Nov 16-17 has been approved.', isRead: false },
      { userId: employees[1].id, type: 'LEAVE_REJECTED', title: 'Leave Request Rejected', message: 'Your year-end vacation request has been rejected. Please reschedule.', isRead: false },
      { userId: employees[4].id, type: 'LEAVE_APPROVED', title: 'Maternity Leave Approved', message: 'Your maternity leave application has been approved. Congratulations!', isRead: false },
      { userId: employees[5].id, type: 'LEAVE_REMINDER', title: 'Leave Balance Reminder', message: 'You have 18 earned leaves remaining. Consider planning a vacation!', isRead: true },
      { userId: employees[6].id, type: 'POLICY_NOTIFICATION', title: 'New Leave Policy', message: 'Bereavement leave policy has been added. Check the policies section.', isRead: true },
    ],
  });

  // 10. CREATE COMPREHENSIVE AUDIT LOGS
  console.log('📊 Creating audit logs...');

  await prisma.auditLog.createMany({
    data: [
      // Admin activities
      { userId: hrAdmin.id, entity: 'LeavePolicy', entityId: 'policy-casual', action: 'UPDATE', oldValues: JSON.stringify({ maxCarryForward: 3 }), newValues: JSON.stringify({ maxCarryForward: 5 }), ipAddress: '192.168.1.100' },
      { userId: hrAdmin.id, entity: 'User', entityId: employees[0].id, action: 'CREATE', newValues: JSON.stringify({ role: 'EMPLOYEE', department: 'Engineering' }), ipAddress: '192.168.1.100' },
      { userId: hrAdmin.id, entity: 'LeaveBalance', entityId: 'bulk-update-2024', action: 'BULK_UPDATE', newValues: JSON.stringify({ updatedRecords: 18, operation: 'annual-refresh' }), ipAddress: '192.168.1.100' },

      // Manager activities
      { userId: managers[0].id, entity: 'LeaveRequest', entityId: 'approved-req-7', action: 'APPROVE', oldValues: JSON.stringify({ status: 'PENDING' }), newValues: JSON.stringify({ status: 'APPROVED' }), ipAddress: '192.168.1.101' },
      { userId: managers[1].id, entity: 'LeaveRequest', entityId: 'rejected-req-1', action: 'REJECT', oldValues: JSON.stringify({ status: 'PENDING' }), newValues: JSON.stringify({ status: 'REJECTED' }), ipAddress: '192.168.1.102' },

      // Employee activities
      { userId: employees[0].id, entity: 'LeaveRequest', entityId: 'pending-req-1', action: 'CREATE', newValues: JSON.stringify({ leaveType: 'CASUAL_LEAVE', totalDays: 2 }), ipAddress: '192.168.1.103' },
      { userId: employees[4].id, entity: 'LeaveRequest', entityId: 'maternity-req-1', action: 'CREATE', newValues: JSON.stringify({ leaveType: 'MATERNITY_LEAVE', totalDays: 180 }), ipAddress: '192.168.1.104' },

      // System activities
      { entity: 'System', entityId: 'database', action: 'BACKUP', newValues: JSON.stringify({ backupTime: new Date(), size: '15.2MB' }), ipAddress: 'system' },
      { entity: 'System', entityId: 'leave-balances', action: 'ANNUAL_RESET', newValues: JSON.stringify({ resetUsers: 18, newYear: currentYear + 1 }), ipAddress: 'system' },
    ],
  });

  console.log('✅ COMPREHENSIVE ADMIN DEMO DATA CREATED!');
  console.log('');
  console.log('📊 SUMMARY:');
  console.log('  👑 1 HR Admin (Maya Sharma)');
  console.log('  👥 5 Managers across different departments');
  console.log('  🧑‍💼 12 Employees with realistic hierarchies');
  console.log('  🏢 6 Departments (HR, Engineering, Sales, Finance, Product, Support)');
  console.log('  📋 7 Leave Policies (including Maternity, Paternity, Bereavement)');
  console.log('  💰 133 Leave Balance records (7 types × 18 users)');
  console.log('  📝 16 Leave Requests (6 Pending, 6 Approved, 3 Rejected, 1 Long-term)');
  console.log('  ✅ 16 Approval records with realistic workflows');
  console.log('  🎉 18 Holidays (National, Regional, Company-specific)');
  console.log('  🔔 12 Notifications (Admin alerts, Approvals, Employee updates)');
  console.log('  📊 9 Audit Logs (Admin, Manager, Employee, System activities)');
  console.log('');
  console.log('🔐 LOGIN CREDENTIALS (password: password123):');
  console.log('');
  console.log('👑 ADMIN:');
  console.log('  • HR Admin: admin@company.com');
  console.log('');
  console.log('👥 MANAGERS:');
  console.log('  • Engineering: engineering.manager@company.com (Rajesh Kumar)');
  console.log('  • Sales: sales.manager@company.com (Amit Gupta)');
  console.log('  • Finance: finance.manager@company.com (Sneha Reddy)');
  console.log('  • Product: product.manager@company.com (Vikram Agarwal)');
  console.log('  • Support: support.manager@company.com (Priya Nair)');
  console.log('');
  console.log('🧑‍💼 EMPLOYEES:');
  console.log('  Engineering Team:');
  console.log('    • arjun.singh@company.com (Arjun Singh)');
  console.log('    • kavya.menon@company.com (Kavya Menon)');
  console.log('    • rohit.sharma@company.com (Rohit Sharma)');
  console.log('  Sales Team:');
  console.log('    • rahul.verma@company.com (Rahul Verma)');
  console.log('    • anita.joshi@company.com (Anita Joshi)');
  console.log('    • deepak.mishra@company.com (Deepak Mishra)');
  console.log('  Finance Team:');
  console.log('    • suresh.nair@company.com (Suresh Nair)');
  console.log('    • meera.iyer@company.com (Meera Iyer)');
  console.log('  Product Team:');
  console.log('    • nikhil.patil@company.com (Nikhil Patil)');
  console.log('    • divya.rao@company.com (Divya Rao)');
  console.log('  Support Team:');
  console.log('    • karan.kapoor@company.com (Karan Kapoor)');
  console.log('    • pooja.goel@company.com (Pooja Goel)');
  console.log('');
  console.log('🎯 ADMIN DEMO SCENARIOS:');
  console.log('  ✅ User Management: 18 users across 6 departments');
  console.log('  ✅ Policy Management: 7 different leave policies');
  console.log('  ✅ Bulk Operations: Leave balance updates, user imports');
  console.log('  ✅ Reports & Analytics: Comprehensive data across all metrics');
  console.log('  ✅ Approval Workflows: Multi-level approval scenarios');
  console.log('  ✅ Holiday Management: Location-specific calendar');
  console.log('  ✅ Audit Trail: Complete activity tracking');
  console.log('  ✅ Notifications: System alerts and user communications');
  console.log('');
  console.log('🚀 READY FOR COMPREHENSIVE ADMIN DEMO!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });