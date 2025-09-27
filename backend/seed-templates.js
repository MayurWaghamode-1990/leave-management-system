const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedTemplates() {
  try {
    console.log('🌱 Seeding template test data...');

    // First, let's create a test user (if not exists) to create public templates
    const testUserEmail = 'manager@company.com';
    let testUser = await prisma.user.findUnique({
      where: { email: testUserEmail }
    });

    if (!testUser) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      testUser = await prisma.user.create({
        data: {
          employeeId: 'EMP002',
          email: testUserEmail,
          password: hashedPassword,
          firstName: 'Test',
          lastName: 'Manager',
          role: 'MANAGER',
          department: 'Engineering',
          location: 'New York',
          status: 'ACTIVE'
        }
      });
      console.log('✅ Created test user:', testUser.email);
    }

    // Create some public templates from the test user
    const publicTemplates = [
      {
        name: 'Team Building Event',
        description: 'Template for team building and company events',
        category: 'VACATION',
        leaveType: 'EARNED_LEAVE',
        duration: 1,
        reason: 'Attending company team building event',
        isHalfDay: false,
        isPublic: true,
        isActive: true,
        tags: JSON.stringify(['team-building', 'company', 'event']),
        createdBy: testUser.id
      },
      {
        name: 'Conference Attendance',
        description: 'Template for attending professional conferences',
        category: 'PROFESSIONAL',
        leaveType: 'EARNED_LEAVE',
        duration: 2,
        reason: 'Attending professional development conference',
        isHalfDay: false,
        isPublic: true,
        isActive: true,
        tags: JSON.stringify(['conference', 'professional', 'development']),
        createdBy: testUser.id
      },
      {
        name: 'Medical Appointment',
        description: 'Standard template for medical appointments',
        category: 'MEDICAL',
        leaveType: 'SICK_LEAVE',
        duration: 0.5,
        reason: 'Routine medical checkup appointment',
        isHalfDay: true,
        isPublic: true,
        isActive: true,
        tags: JSON.stringify(['medical', 'appointment', 'health']),
        createdBy: testUser.id
      }
    ];

    for (const templateData of publicTemplates) {
      // Check if template already exists
      const existing = await prisma.leaveTemplate.findFirst({
        where: {
          name: templateData.name,
          createdBy: testUser.id
        }
      });

      if (!existing) {
        const template = await prisma.leaveTemplate.create({
          data: templateData
        });
        console.log('✅ Created public template:', template.name);
      } else {
        console.log('⏭️  Template already exists:', templateData.name);
      }
    }

    console.log('🎉 Template seeding completed successfully!');
    console.log('\nNow you can test the "Include Public Templates" feature:');
    console.log('1. Log in as admin@company.com');
    console.log('2. Go to Templates page');
    console.log('3. Toggle "Include Public Templates" on/off');
    console.log('4. You should see different results based on the toggle state');

  } catch (error) {
    console.error('❌ Error seeding templates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedTemplates();