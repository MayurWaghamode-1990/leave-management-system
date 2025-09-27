const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setupTestUser() {
  console.log('🧪 Setting up test user: engineering.manager@company.com');

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'engineering.manager@company.com' }
    });

    if (existingUser) {
      console.log('✅ Test user already exists:', existingUser.email);
      return existingUser;
    }

    // Create the test user
    const hashedPassword = await bcrypt.hash('password123', 12);

    const testUser = await prisma.user.create({
      data: {
        employeeId: 'EMP007',
        email: 'engineering.manager@company.com',
        password: hashedPassword,
        firstName: 'Engineering',
        lastName: 'Manager',
        role: 'MANAGER',
        department: 'Engineering',
        location: 'Bengaluru',
        joiningDate: new Date('2020-03-01')
      }
    });

    // Create leave balances for the test user
    const currentYear = new Date().getFullYear();
    const leaveTypes = ['SICK_LEAVE', 'CASUAL_LEAVE', 'EARNED_LEAVE', 'MATERNITY_LEAVE', 'PATERNITY_LEAVE', 'COMPENSATORY_OFF', 'BEREAVEMENT_LEAVE', 'MARRIAGE_LEAVE'];
    const entitlements = {
      'SICK_LEAVE': 12,
      'CASUAL_LEAVE': 12,
      'EARNED_LEAVE': 21,
      'MATERNITY_LEAVE': 180,
      'PATERNITY_LEAVE': 15,
      'COMPENSATORY_OFF': 10,
      'BEREAVEMENT_LEAVE': 3,
      'MARRIAGE_LEAVE': 5
    };

    for (const leaveType of leaveTypes) {
      await prisma.leaveBalance.create({
        data: {
          employeeId: testUser.id,
          leaveType: leaveType,
          totalEntitlement: entitlements[leaveType],
          used: 0,
          available: entitlements[leaveType],
          carryForward: 0,
          year: currentYear
        }
      });
    }

    console.log('✅ Test user created successfully');
    console.log(`📧 Email: ${testUser.email}`);
    console.log(`🔑 Password: password123`);
    console.log(`👤 Role: ${testUser.role}`);
    console.log(`🏢 Department: ${testUser.department}`);

    return testUser;

  } catch (error) {
    console.error('❌ Error setting up test user:', error);
    throw error;
  }
}

async function main() {
  try {
    await setupTestUser();
    console.log('🎉 Test setup completed successfully!');
  } catch (error) {
    console.error('❌ Test setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();