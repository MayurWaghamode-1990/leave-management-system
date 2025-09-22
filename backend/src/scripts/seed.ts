import { PrismaClient, UserRole, LeaveType, Region } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create sample users
  const hashedPassword = await bcrypt.hash('password123', 12);
  const adminPassword = await bcrypt.hash('admin123', 12);
  const userPassword = await bcrypt.hash('user123', 12);

  // HR Admin (Demo credentials expected by frontend)
  const hrAdmin = await prisma.user.create({
    data: {
      employeeId: 'EMP001',
      email: 'admin@company.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.HR_ADMIN,
      department: 'Human Resources',
      location: 'Bengaluru',
      joiningDate: new Date('2020-01-15')
    }
  });

  // Additional HR Admin
  const hrAdmin2 = await prisma.user.create({
    data: {
      employeeId: 'EMP002',
      email: 'hr.admin@company.com',
      password: hashedPassword,
      firstName: 'Priya',
      lastName: 'Sharma',
      role: UserRole.HR_ADMIN,
      department: 'Human Resources',
      location: 'Bengaluru',
      joiningDate: new Date('2020-01-15')
    }
  });

  // Manager
  const manager = await prisma.user.create({
    data: {
      employeeId: 'EMP003',
      email: 'alex.johnson@company.com',
      password: hashedPassword,
      firstName: 'Alex',
      lastName: 'Johnson',
      role: UserRole.MANAGER,
      department: 'Engineering',
      location: 'Chicago',
      joiningDate: new Date('2019-03-10')
    }
  });

  // Employee under manager (Demo credentials expected by frontend)
  const employee1 = await prisma.user.create({
    data: {
      employeeId: 'EMP004',
      email: 'user@company.com',
      password: userPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.EMPLOYEE,
      department: 'Engineering',
      location: 'Bengaluru',
      reportingManagerId: manager.id,
      joiningDate: new Date('2021-06-01')
    }
  });

  // Another employee
  const employee2 = await prisma.user.create({
    data: {
      employeeId: 'EMP005',
      email: 'ananya.patel@company.com',
      password: hashedPassword,
      firstName: 'Ananya',
      lastName: 'Patel',
      role: UserRole.EMPLOYEE,
      department: 'Engineering',
      location: 'Chicago',
      reportingManagerId: manager.id,
      joiningDate: new Date('2022-01-15')
    }
  });

  // Payroll Officer
  const payrollOfficer = await prisma.user.create({
    data: {
      employeeId: 'EMP006',
      email: 'michelle.lee@company.com',
      password: hashedPassword,
      firstName: 'Michelle',
      lastName: 'Lee',
      role: UserRole.PAYROLL_OFFICER,
      department: 'Finance',
      location: 'New York',
      joiningDate: new Date('2020-09-01')
    }
  });

  console.log('✅ Users created');

  // Create leave policies
  const policies = [
    {
      name: 'India Sick Leave Policy',
      leaveType: LeaveType.SICK_LEAVE,
      entitlementDays: 12,
      accrualRate: 1.0,
      maxCarryForward: 0,
      requiresDocumentation: true,
      documentationThreshold: 2,
      location: 'Bengaluru',
      region: Region.INDIA,
      effectiveFrom: new Date('2024-04-01')
    },
    {
      name: 'India Casual Leave Policy',
      leaveType: LeaveType.CASUAL_LEAVE,
      entitlementDays: 12,
      accrualRate: 1.0,
      maxCarryForward: 0,
      requiresDocumentation: false,
      location: 'Bengaluru',
      region: Region.INDIA,
      effectiveFrom: new Date('2024-04-01')
    },
    {
      name: 'India Earned Leave Policy',
      leaveType: LeaveType.EARNED_LEAVE,
      entitlementDays: 21,
      accrualRate: 1.75,
      maxCarryForward: 15,
      requiresDocumentation: false,
      location: 'Bengaluru',
      region: Region.INDIA,
      effectiveFrom: new Date('2024-04-01')
    },
    {
      name: 'USA PTO Policy',
      leaveType: LeaveType.EARNED_LEAVE,
      entitlementDays: 20,
      accrualRate: 1.67,
      maxCarryForward: 5,
      requiresDocumentation: false,
      location: 'Chicago',
      region: Region.USA,
      effectiveFrom: new Date('2024-01-01')
    },
    {
      name: 'USA Sick Leave Policy',
      leaveType: LeaveType.SICK_LEAVE,
      entitlementDays: 10,
      accrualRate: 0.83,
      maxCarryForward: 40,
      requiresDocumentation: true,
      documentationThreshold: 3,
      location: 'Chicago',
      region: Region.USA,
      effectiveFrom: new Date('2024-01-01')
    }
  ];

  for (const policy of policies) {
    await prisma.leavePolicy.create({ data: policy });
  }

  console.log('✅ Leave policies created');

  // Create leave balances for the current year
  const currentYear = new Date().getFullYear();
  const balances = [
    // Ananya's balances (India)
    {
      employeeId: employee1.id,
      leaveType: LeaveType.SICK_LEAVE,
      totalEntitlement: 12,
      used: 2,
      available: 10,
      carryForward: 0,
      year: currentYear
    },
    {
      employeeId: employee1.id,
      leaveType: LeaveType.CASUAL_LEAVE,
      totalEntitlement: 12,
      used: 5,
      available: 7,
      carryForward: 0,
      year: currentYear
    },
    {
      employeeId: employee1.id,
      leaveType: LeaveType.EARNED_LEAVE,
      totalEntitlement: 21,
      used: 8,
      available: 13,
      carryForward: 3,
      year: currentYear
    },
    // John's balances (USA)
    {
      employeeId: employee2.id,
      leaveType: LeaveType.EARNED_LEAVE,
      totalEntitlement: 20,
      used: 5,
      available: 15,
      carryForward: 2,
      year: currentYear
    },
    {
      employeeId: employee2.id,
      leaveType: LeaveType.SICK_LEAVE,
      totalEntitlement: 10,
      used: 3,
      available: 7,
      carryForward: 0,
      year: currentYear
    }
  ];

  for (const balance of balances) {
    await prisma.leaveBalance.create({ data: balance });
  }

  console.log('✅ Leave balances created');

  // Create sample holidays
  const holidays = [
    // India holidays
    {
      name: 'Republic Day',
      date: new Date(`${currentYear}-01-26`),
      location: 'Bengaluru',
      region: Region.INDIA,
      type: 'NATIONAL' as const,
      isOptional: false
    },
    {
      name: 'Independence Day',
      date: new Date(`${currentYear}-08-15`),
      location: 'Bengaluru',
      region: Region.INDIA,
      type: 'NATIONAL' as const,
      isOptional: false
    },
    {
      name: 'Gandhi Jayanti',
      date: new Date(`${currentYear}-10-02`),
      location: 'Bengaluru',
      region: Region.INDIA,
      type: 'NATIONAL' as const,
      isOptional: false
    },
    // USA holidays
    {
      name: 'Independence Day',
      date: new Date(`${currentYear}-07-04`),
      location: 'Chicago',
      region: Region.USA,
      type: 'NATIONAL' as const,
      isOptional: false
    },
    {
      name: 'Christmas Day',
      date: new Date(`${currentYear}-12-25`),
      location: 'Chicago',
      region: Region.USA,
      type: 'NATIONAL' as const,
      isOptional: false
    },
    {
      name: 'New Year Day',
      date: new Date(`${currentYear}-01-01`),
      location: 'Chicago',
      region: Region.USA,
      type: 'NATIONAL' as const,
      isOptional: false
    }
  ];

  for (const holiday of holidays) {
    await prisma.holiday.create({ data: holiday });
  }

  console.log('✅ Holidays created');

  // Create a sample leave request
  const leaveRequest = await prisma.leaveRequest.create({
    data: {
      employeeId: employee1.id,
      leaveType: LeaveType.CASUAL_LEAVE,
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), // 9 days from now
      totalDays: 3,
      reason: 'Family function',
      status: 'PENDING'
    }
  });

  // Create approval record
  await prisma.approval.create({
    data: {
      leaveRequestId: leaveRequest.id,
      approverId: manager.id,
      level: 1,
      status: 'PENDING'
    }
  });

  console.log('✅ Sample leave request and approval created');

  console.log('🎉 Database seeded successfully!');
  console.log('\n📝 Demo Login Credentials (for frontend):');
  console.log('HR Admin: admin@company.com / admin123');
  console.log('Employee: user@company.com / user123');
  console.log('\n📝 Additional Sample Credentials:');
  console.log('HR Admin 2: hr.admin@company.com / password123');
  console.log('Manager: alex.johnson@company.com / password123');
  console.log('Employee 2: ananya.patel@company.com / password123');
  console.log('Payroll: michelle.lee@company.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });