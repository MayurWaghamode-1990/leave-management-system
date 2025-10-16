const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting test data population...\n');

  try {
    // Hash password for all users
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🧹 Cleaning existing data...');
    await prisma.compOffApproval.deleteMany({});
    await prisma.compOffRequest.deleteMany({});
    await prisma.compOffWorkLog.deleteMany({});
    await prisma.compOffBalance.deleteMany({});
    await prisma.approval.deleteMany({});
    await prisma.leaveRequest.deleteMany({});
    await prisma.leaveBalance.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.monthlyAccrual.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.leaveCancellationRequest.deleteMany({});
    await prisma.leaveModificationRequest.deleteMany({});
    await prisma.leaveTemplate.deleteMany({});
    await prisma.calendarIntegration.deleteMany({});
    await prisma.holiday.deleteMany({});
    await prisma.leavePolicy.deleteMany({});
    await prisma.department.deleteMany({});
    await prisma.user.deleteMany({});

    console.log('✅ Existing data cleaned\n');

    // 1. Create Departments
    console.log('📁 Creating departments...');
    const departments = await Promise.all([
      prisma.department.create({
        data: {
          id: 'dept-engineering',
          name: 'Engineering',
          location: 'Bangalore',
        },
      }),
      prisma.department.create({
        data: {
          id: 'dept-hr',
          name: 'Human Resources',
          location: 'Mumbai',
        },
      }),
      prisma.department.create({
        data: {
          id: 'dept-sales',
          name: 'Sales',
          location: 'Delhi',
        },
      }),
      prisma.department.create({
        data: {
          id: 'dept-marketing',
          name: 'Marketing',
          location: 'Pune',
        },
      }),
    ]);
    console.log(`✅ Created ${departments.length} departments\n`);

    // 2. Create Users
    console.log('👥 Creating users...');

    // Admin User
    const admin = await prisma.user.create({
      data: {
        id: 'user-admin-001',
        employeeId: 'EMP001',
        email: 'admin@glf.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        department: 'Human Resources',
        location: 'Mumbai',
        joiningDate: new Date('2020-01-01'),
        status: 'ACTIVE',
        gender: 'MALE',
        maritalStatus: 'SINGLE',
        country: 'INDIA',
        designation: 'VP',
      },
    });

    // Managers
    const manager1 = await prisma.user.create({
      data: {
        id: 'user-mgr-001',
        employeeId: 'EMP002',
        email: 'manager1@glf.com',
        password: hashedPassword,
        firstName: 'Rajesh',
        lastName: 'Kumar',
        role: 'MANAGER',
        department: 'Engineering',
        location: 'Bangalore',
        joiningDate: new Date('2019-06-15'),
        status: 'ACTIVE',
        gender: 'MALE',
        maritalStatus: 'MARRIED',
        country: 'INDIA',
        designation: 'SENIOR_MANAGER',
      },
    });

    const manager2 = await prisma.user.create({
      data: {
        id: 'user-mgr-002',
        employeeId: 'EMP003',
        email: 'manager2@glf.com',
        password: hashedPassword,
        firstName: 'Priya',
        lastName: 'Sharma',
        role: 'MANAGER',
        department: 'Sales',
        location: 'Delhi',
        reportingManagerId: admin.id,
        joiningDate: new Date('2020-03-20'),
        status: 'ACTIVE',
        gender: 'FEMALE',
        maritalStatus: 'SINGLE',
        country: 'INDIA',
        designation: 'MANAGER',
      },
    });

    // Employees under Manager 1
    const employee1 = await prisma.user.create({
      data: {
        id: 'user-emp-001',
        employeeId: 'EMP004',
        email: 'employee1@glf.com',
        password: hashedPassword,
        firstName: 'Amit',
        lastName: 'Patel',
        role: 'EMPLOYEE',
        department: 'Engineering',
        location: 'Bangalore',
        reportingManagerId: manager1.id,
        joiningDate: new Date('2021-08-10'),
        status: 'ACTIVE',
        gender: 'MALE',
        maritalStatus: 'MARRIED',
        country: 'INDIA',
        designation: 'ENGINEER',
      },
    });

    const employee2 = await prisma.user.create({
      data: {
        id: 'user-emp-002',
        employeeId: 'EMP005',
        email: 'employee2@glf.com',
        password: hashedPassword,
        firstName: 'Sneha',
        lastName: 'Desai',
        role: 'EMPLOYEE',
        department: 'Engineering',
        location: 'Bangalore',
        reportingManagerId: manager1.id,
        joiningDate: new Date('2022-01-15'),
        status: 'ACTIVE',
        gender: 'FEMALE',
        maritalStatus: 'SINGLE',
        country: 'INDIA',
        designation: 'ENGINEER',
      },
    });

    // Employees under Manager 2
    const employee3 = await prisma.user.create({
      data: {
        id: 'user-emp-003',
        employeeId: 'EMP006',
        email: 'employee3@glf.com',
        password: hashedPassword,
        firstName: 'Vikram',
        lastName: 'Singh',
        role: 'EMPLOYEE',
        department: 'Sales',
        location: 'Delhi',
        reportingManagerId: manager2.id,
        joiningDate: new Date('2021-11-20'),
        status: 'ACTIVE',
        gender: 'MALE',
        maritalStatus: 'SINGLE',
        country: 'INDIA',
        designation: 'SALES_EXECUTIVE',
      },
    });

    const employee4 = await prisma.user.create({
      data: {
        id: 'user-emp-004',
        employeeId: 'EMP007',
        email: 'employee4@glf.com',
        password: hashedPassword,
        firstName: 'Kavita',
        lastName: 'Nair',
        role: 'EMPLOYEE',
        department: 'Marketing',
        location: 'Pune',
        reportingManagerId: manager1.id,
        joiningDate: new Date('2022-05-01'),
        status: 'ACTIVE',
        gender: 'FEMALE',
        maritalStatus: 'MARRIED',
        country: 'INDIA',
        designation: 'MARKETING_EXEC',
      },
    });

    // Additional employees for testing
    const employee5 = await prisma.user.create({
      data: {
        id: 'user-emp-005',
        employeeId: 'EMP008',
        email: 'employee5@glf.com',
        password: hashedPassword,
        firstName: 'Rahul',
        lastName: 'Mehta',
        role: 'EMPLOYEE',
        department: 'Engineering',
        location: 'Bangalore',
        reportingManagerId: manager1.id,
        joiningDate: new Date('2023-02-10'),
        status: 'ACTIVE',
        gender: 'MALE',
        maritalStatus: 'SINGLE',
        country: 'INDIA',
        designation: 'ENGINEER',
      },
    });

    console.log('✅ Created 8 users (1 Admin, 2 Managers, 5 Employees)\n');

    // 3. Create Leave Policies
    console.log('📋 Creating leave policies...');
    const currentYear = new Date().getFullYear();

    const leavePolicies = await Promise.all([
      // India - Casual Leave
      prisma.leavePolicy.create({
        data: {
          name: 'India Casual Leave',
          leaveType: 'CASUAL',
          entitlementDays: 12,
          accrualRate: 1.0,
          maxCarryForward: 3,
          minimumGap: 0,
          maxConsecutiveDays: 7,
          requiresDocumentation: false,
          location: 'Bangalore',
          region: 'INDIA',
          effectiveFrom: new Date(`${currentYear}-01-01`),
          isActive: true,
        },
      }),
      // India - Privilege Leave
      prisma.leavePolicy.create({
        data: {
          name: 'India Privilege Leave',
          leaveType: 'PRIVILEGE',
          entitlementDays: 15,
          accrualRate: 1.25,
          maxCarryForward: 15,
          minimumGap: 0,
          maxConsecutiveDays: 30,
          requiresDocumentation: false,
          location: 'Bangalore',
          region: 'INDIA',
          effectiveFrom: new Date(`${currentYear}-01-01`),
          isActive: true,
        },
      }),
      // India - Sick Leave
      prisma.leavePolicy.create({
        data: {
          name: 'India Sick Leave',
          leaveType: 'SICK',
          entitlementDays: 12,
          accrualRate: 1.0,
          maxCarryForward: 12,
          minimumGap: 0,
          maxConsecutiveDays: 30,
          requiresDocumentation: true,
          documentationThreshold: 3,
          location: 'Bangalore',
          region: 'INDIA',
          effectiveFrom: new Date(`${currentYear}-01-01`),
          isActive: true,
        },
      }),
      // India - Paternity Leave
      prisma.leavePolicy.create({
        data: {
          name: 'India Paternity Leave',
          leaveType: 'PATERNITY',
          entitlementDays: 15,
          accrualRate: 0,
          maxCarryForward: 0,
          minimumGap: 0,
          maxConsecutiveDays: 15,
          requiresDocumentation: true,
          location: 'Bangalore',
          region: 'INDIA',
          effectiveFrom: new Date(`${currentYear}-01-01`),
          isActive: true,
        },
      }),
      // India - Maternity Leave
      prisma.leavePolicy.create({
        data: {
          name: 'India Maternity Leave',
          leaveType: 'MATERNITY',
          entitlementDays: 182,
          accrualRate: 0,
          maxCarryForward: 0,
          minimumGap: 0,
          maxConsecutiveDays: 182,
          requiresDocumentation: true,
          location: 'Bangalore',
          region: 'INDIA',
          effectiveFrom: new Date(`${currentYear}-01-01`),
          isActive: true,
        },
      }),
      // India - Compensatory Off
      prisma.leavePolicy.create({
        data: {
          name: 'India Compensatory Off',
          leaveType: 'COMP_OFF',
          entitlementDays: 0,
          accrualRate: 0,
          maxCarryForward: 0,
          minimumGap: 0,
          maxConsecutiveDays: 5,
          requiresDocumentation: false,
          location: 'Bangalore',
          region: 'INDIA',
          effectiveFrom: new Date(`${currentYear}-01-01`),
          isActive: true,
        },
      }),
    ]);
    console.log(`✅ Created ${leavePolicies.length} leave policies\n`);

    // 4. Create Leave Balances for all employees
    console.log('💰 Creating leave balances...');
    const employees = [employee1, employee2, employee3, employee4, employee5];
    const leaveTypes = [
      { type: 'CASUAL', total: 12, used: 0 },
      { type: 'PRIVILEGE', total: 15, used: 0 },
      { type: 'SICK', total: 12, used: 0 },
      { type: 'PATERNITY', total: 15, used: 0 },
      { type: 'MATERNITY', total: 182, used: 0 },
      { type: 'COMP_OFF', total: 5, used: 0 },
    ];

    let balanceCount = 0;
    for (const emp of employees) {
      for (const leave of leaveTypes) {
        await prisma.leaveBalance.create({
          data: {
            employeeId: emp.id,
            leaveType: leave.type,
            totalEntitlement: leave.total,
            used: leave.used,
            available: leave.total - leave.used,
            carryForward: 0,
            year: currentYear,
          },
        });
        balanceCount++;
      }
    }
    console.log(`✅ Created ${balanceCount} leave balance records\n`);

    // 5. Create Holidays
    console.log('🎉 Creating holidays...');
    const holidays = await Promise.all([
      prisma.holiday.create({
        data: {
          name: 'Republic Day',
          date: new Date(`${currentYear}-01-26`),
          location: 'Bangalore',
          region: 'INDIA',
          isOptional: false,
          type: 'NATIONAL',
        },
      }),
      prisma.holiday.create({
        data: {
          name: 'Holi',
          date: new Date(`${currentYear}-03-14`),
          location: 'Bangalore',
          region: 'INDIA',
          isOptional: false,
          type: 'NATIONAL',
        },
      }),
      prisma.holiday.create({
        data: {
          name: 'Independence Day',
          date: new Date(`${currentYear}-08-15`),
          location: 'Bangalore',
          region: 'INDIA',
          isOptional: false,
          type: 'NATIONAL',
        },
      }),
      prisma.holiday.create({
        data: {
          name: 'Gandhi Jayanti',
          date: new Date(`${currentYear}-10-02`),
          location: 'Bangalore',
          region: 'INDIA',
          isOptional: false,
          type: 'NATIONAL',
        },
      }),
      prisma.holiday.create({
        data: {
          name: 'Diwali',
          date: new Date(`${currentYear}-11-01`),
          location: 'Bangalore',
          region: 'INDIA',
          isOptional: false,
          type: 'NATIONAL',
        },
      }),
      prisma.holiday.create({
        data: {
          name: 'Christmas',
          date: new Date(`${currentYear}-12-25`),
          location: 'Bangalore',
          region: 'INDIA',
          isOptional: false,
          type: 'NATIONAL',
        },
      }),
    ]);
    console.log(`✅ Created ${holidays.length} holidays\n`);

    // 6. Create Leave Requests with different statuses
    console.log('📝 Creating leave requests...');

    // Employee 1 - Pending leave request
    const leaveReq1 = await prisma.leaveRequest.create({
      data: {
        employeeId: employee1.id,
        leaveType: 'CASUAL',
        startDate: new Date(`${currentYear}-11-20`),
        endDate: new Date(`${currentYear}-11-22`),
        totalDays: 3,
        isHalfDay: false,
        reason: 'Personal work - need to attend family function',
        status: 'PENDING',
        appliedDate: new Date(),
      },
    });

    // Create approval for pending request
    await prisma.approval.create({
      data: {
        leaveRequestId: leaveReq1.id,
        approverId: manager1.id,
        level: 1,
        status: 'PENDING',
      },
    });

    // Employee 1 - Approved leave request
    const leaveReq2 = await prisma.leaveRequest.create({
      data: {
        employeeId: employee1.id,
        leaveType: 'PRIVILEGE',
        startDate: new Date(`${currentYear}-10-10`),
        endDate: new Date(`${currentYear}-10-12`),
        totalDays: 3,
        isHalfDay: false,
        reason: 'Vacation with family',
        status: 'APPROVED',
        appliedDate: new Date(`${currentYear}-09-25`),
      },
    });

    await prisma.approval.create({
      data: {
        leaveRequestId: leaveReq2.id,
        approverId: manager1.id,
        level: 1,
        status: 'APPROVED',
        comments: 'Approved. Enjoy your vacation!',
        approvedAt: new Date(`${currentYear}-09-26`),
      },
    });

    // Employee 2 - Rejected leave request
    const leaveReq3 = await prisma.leaveRequest.create({
      data: {
        employeeId: employee2.id,
        leaveType: 'CASUAL',
        startDate: new Date(`${currentYear}-10-15`),
        endDate: new Date(`${currentYear}-10-16`),
        totalDays: 2,
        isHalfDay: false,
        reason: 'Personal errands',
        status: 'REJECTED',
        appliedDate: new Date(`${currentYear}-10-05`),
      },
    });

    await prisma.approval.create({
      data: {
        leaveRequestId: leaveReq3.id,
        approverId: manager1.id,
        level: 1,
        status: 'REJECTED',
        comments: 'Critical project deadline. Please reschedule.',
        approvedAt: new Date(`${currentYear}-10-06`),
      },
    });

    // Employee 3 - Half-day leave request
    const leaveReq4 = await prisma.leaveRequest.create({
      data: {
        employeeId: employee3.id,
        leaveType: 'CASUAL',
        startDate: new Date(`${currentYear}-11-18`),
        endDate: new Date(`${currentYear}-11-18`),
        totalDays: 0.5,
        isHalfDay: true,
        reason: 'Doctor appointment',
        status: 'PENDING',
        appliedDate: new Date(),
      },
    });

    await prisma.approval.create({
      data: {
        leaveRequestId: leaveReq4.id,
        approverId: manager2.id,
        level: 1,
        status: 'PENDING',
      },
    });

    // Employee 4 - Sick leave request
    const leaveReq5 = await prisma.leaveRequest.create({
      data: {
        employeeId: employee4.id,
        leaveType: 'SICK',
        startDate: new Date(`${currentYear}-10-20`),
        endDate: new Date(`${currentYear}-10-21`),
        totalDays: 2,
        isHalfDay: false,
        reason: 'Fever and cold',
        status: 'APPROVED',
        appliedDate: new Date(`${currentYear}-10-19`),
      },
    });

    await prisma.approval.create({
      data: {
        leaveRequestId: leaveReq5.id,
        approverId: manager1.id,
        level: 1,
        status: 'APPROVED',
        comments: 'Get well soon!',
        approvedAt: new Date(`${currentYear}-10-19`),
      },
    });

    // Employee 5 - Multiple leave requests
    const leaveReq6 = await prisma.leaveRequest.create({
      data: {
        employeeId: employee5.id,
        leaveType: 'PRIVILEGE',
        startDate: new Date(`${currentYear}-12-20`),
        endDate: new Date(`${currentYear}-12-30`),
        totalDays: 11,
        isHalfDay: false,
        reason: 'Year-end vacation',
        status: 'PENDING',
        appliedDate: new Date(),
      },
    });

    await prisma.approval.create({
      data: {
        leaveRequestId: leaveReq6.id,
        approverId: manager1.id,
        level: 1,
        status: 'PENDING',
      },
    });

    console.log('✅ Created 6 leave requests with various statuses\n');

    // 7. Create Comp Off Work Logs
    console.log('⏰ Creating comp off work logs...');

    const compOffLog1 = await prisma.compOffWorkLog.create({
      data: {
        employeeId: employee1.id,
        workDate: new Date(`${currentYear}-10-15`), // Weekend
        hoursWorked: 8,
        workType: 'WEEKEND',
        workDescription: 'Critical production bug fix',
        projectDetails: 'Payment Gateway Integration',
        isVerified: true,
        verifiedBy: manager1.id,
        verifiedAt: new Date(`${currentYear}-10-16`),
        compOffEarned: 1,
        status: 'VERIFIED',
      },
    });

    const compOffLog2 = await prisma.compOffWorkLog.create({
      data: {
        employeeId: employee2.id,
        workDate: new Date(`${currentYear}-10-29`), // Weekend
        hoursWorked: 6,
        workType: 'WEEKEND',
        workDescription: 'Production deployment support',
        projectDetails: 'Version 2.0 Release',
        isVerified: false,
        compOffEarned: 0.75,
        status: 'PENDING',
      },
    });

    console.log('✅ Created 2 comp off work logs\n');

    // 8. Create Comp Off Balance
    console.log('💳 Creating comp off balances...');

    await prisma.compOffBalance.create({
      data: {
        employeeId: employee1.id,
        year: currentYear,
        totalEarned: 2,
        totalUsed: 0,
        available: 2,
        expired: 0,
      },
    });

    await prisma.compOffBalance.create({
      data: {
        employeeId: employee2.id,
        year: currentYear,
        totalEarned: 0.75,
        totalUsed: 0,
        available: 0.75,
        expired: 0,
      },
    });

    console.log('✅ Created comp off balances\n');

    // 9. Create Notifications
    console.log('🔔 Creating notifications...');

    await Promise.all([
      prisma.notification.create({
        data: {
          userId: employee1.id,
          type: 'LEAVE_APPROVED',
          title: 'Leave Request Approved',
          message: 'Your leave request for Oct 10-12 has been approved',
          isRead: false,
        },
      }),
      prisma.notification.create({
        data: {
          userId: employee2.id,
          type: 'LEAVE_REJECTED',
          title: 'Leave Request Rejected',
          message: 'Your leave request for Oct 15-16 has been rejected',
          isRead: false,
        },
      }),
      prisma.notification.create({
        data: {
          userId: manager1.id,
          type: 'LEAVE_PENDING',
          title: 'Pending Leave Approval',
          message: 'You have 3 pending leave requests to review',
          isRead: false,
        },
      }),
      prisma.notification.create({
        data: {
          userId: manager2.id,
          type: 'LEAVE_PENDING',
          title: 'Pending Leave Approval',
          message: 'You have 1 pending leave request to review',
          isRead: false,
        },
      }),
    ]);

    console.log('✅ Created notifications\n');

    // 10. Print Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 TEST DATA POPULATION COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60) + '\n');

    console.log('📊 Summary:');
    console.log('  • Departments: 4');
    console.log('  • Users: 8 (1 Admin, 2 Managers, 5 Employees)');
    console.log('  • Leave Policies: 6');
    console.log('  • Leave Balances: 30 records');
    console.log('  • Holidays: 6');
    console.log('  • Leave Requests: 6 (with various statuses)');
    console.log('  • Comp Off Work Logs: 2');
    console.log('  • Notifications: 4\n');

    console.log('👤 Test User Credentials:');
    console.log('  All users have password: password123\n');
    console.log('  Admin:');
    console.log('    Email: admin@glf.com');
    console.log('    Role: ADMIN\n');
    console.log('  Managers:');
    console.log('    Email: manager1@glf.com (Rajesh Kumar - Engineering)');
    console.log('    Email: manager2@glf.com (Priya Sharma - Sales)\n');
    console.log('  Employees:');
    console.log('    Email: employee1@glf.com (Amit Patel - Has approved & pending leaves)');
    console.log('    Email: employee2@glf.com (Sneha Desai - Has rejected leave)');
    console.log('    Email: employee3@glf.com (Vikram Singh - Has half-day pending)');
    console.log('    Email: employee4@glf.com (Kavita Nair - Has approved sick leave)');
    console.log('    Email: employee5@glf.com (Rahul Mehta - Has long pending leave)\n');

    console.log('✨ You can now test all features of the Leave Management System!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error populating test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
