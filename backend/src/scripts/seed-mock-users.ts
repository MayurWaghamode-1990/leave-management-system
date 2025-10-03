/**
 * Mock Users Seeding Script
 * Creates the mock users in the database to satisfy foreign key constraints
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const mockUsers = [
  {
    id: '1',
    employeeId: 'EMP001',
    email: 'admin@company.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'HR_ADMIN',
    department: 'Human Resources',
    location: 'Bengaluru',
    status: 'ACTIVE',
    gender: 'FEMALE',
    maritalStatus: 'MARRIED',
    country: 'INDIA',
    joiningDate: new Date('2020-01-01')
  },
  {
    id: '2',
    employeeId: 'EMP002',
    email: 'user@company.com',
    password: 'user123',
    firstName: 'John',
    lastName: 'Doe',
    role: 'EMPLOYEE',
    department: 'Engineering',
    location: 'Bengaluru',
    status: 'ACTIVE',
    gender: 'MALE',
    maritalStatus: 'MARRIED',
    country: 'INDIA',
    joiningDate: new Date('2021-06-15')
  }
];

async function seedMockUsers() {
  console.log('👥 Starting mock users seeding...\n');

  try {
    for (const userData of mockUsers) {
      // Check if user already exists by email
      const existingUserByEmail = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUserByEmail) {
        // User exists by email, check if we need to update the ID
        if (existingUserByEmail.id !== userData.id) {
          console.log(`🔄 User ${userData.email} exists with ID ${existingUserByEmail.id}, but we need ID ${userData.id}`);
          console.log(`📝 Updating user ID from ${existingUserByEmail.id} to ${userData.id}...`);

          // Update the user with the specific ID we need for tests
          await prisma.user.update({
            where: { email: userData.email },
            data: {
              id: userData.id,
              gender: userData.gender,
              maritalStatus: userData.maritalStatus,
              country: userData.country
            }
          });
          console.log(`✅ Updated user ${userData.email} to ID ${userData.id}`);
        } else {
          console.log(`✅ User ${userData.firstName} ${userData.lastName} already has correct ID (${userData.id})`);
        }
        continue;
      }

      // Check if user already exists by ID
      const existingUserById = await prisma.user.findUnique({
        where: { id: userData.id }
      });

      if (existingUserById) {
        console.log(`✅ User with ID ${userData.id} already exists`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Create user
      const createdUser = await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword
        }
      });

      console.log(`✅ Created user: ${createdUser.firstName} ${createdUser.lastName} (${createdUser.email})`);
    }

    // Verify users exist
    const userCount = await prisma.user.count();
    console.log(`\n📊 Total users in database: ${userCount}`);

    const adminUser = await prisma.user.findUnique({
      where: { id: '1' },
      select: { firstName: true, lastName: true, email: true, role: true }
    });

    const regularUser = await prisma.user.findUnique({
      where: { id: '2' },
      select: { firstName: true, lastName: true, email: true, role: true }
    });

    console.log('\n👥 Mock Users in Database:');
    if (adminUser) {
      console.log(`  Admin: ${adminUser.firstName} ${adminUser.lastName} (${adminUser.email}) - ${adminUser.role}`);
    }
    if (regularUser) {
      console.log(`  User: ${regularUser.firstName} ${regularUser.lastName} (${regularUser.email}) - ${regularUser.role}`);
    }

    console.log('\n🎉 Mock users seeding completed successfully!');
    console.log('\n💡 Benefits:');
    console.log('  • Foreign key constraints will now work');
    console.log('  • Comp off work logs can be created');
    console.log('  • Special leave eligibility checks will work');
    console.log('  • User policy assignments will work');

    return {
      success: true,
      usersCreated: mockUsers.length,
      totalUsers: userCount
    };

  } catch (error) {
    console.error('❌ Error seeding mock users:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedMockUsers();
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { seedMockUsers };