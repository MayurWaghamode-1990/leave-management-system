import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultConfigurations = [
  // Departments
  { category: 'DEPARTMENT', value: 'Engineering', displayName: 'Engineering', sortOrder: 1 },
  { category: 'DEPARTMENT', value: 'HR', displayName: 'HR', sortOrder: 2 },
  { category: 'DEPARTMENT', value: 'Finance', displayName: 'Finance', sortOrder: 3 },
  { category: 'DEPARTMENT', value: 'Marketing', displayName: 'Marketing', sortOrder: 4 },
  { category: 'DEPARTMENT', value: 'Operations', displayName: 'Operations', sortOrder: 5 },
  { category: 'DEPARTMENT', value: 'Sales', displayName: 'Sales', sortOrder: 6 },

  // Locations
  { category: 'LOCATION', value: 'New York', displayName: 'New York', sortOrder: 1 },
  { category: 'LOCATION', value: 'London', displayName: 'London', sortOrder: 2 },
  { category: 'LOCATION', value: 'Mumbai', displayName: 'Mumbai', sortOrder: 3 },
  { category: 'LOCATION', value: 'Singapore', displayName: 'Singapore', sortOrder: 4 },
  { category: 'LOCATION', value: 'Toronto', displayName: 'Toronto', sortOrder: 5 },
  { category: 'LOCATION', value: 'Sydney', displayName: 'Sydney', sortOrder: 6 },

  // Gender
  { category: 'GENDER', value: 'MALE', displayName: 'Male', sortOrder: 1 },
  { category: 'GENDER', value: 'FEMALE', displayName: 'Female', sortOrder: 2 },
  { category: 'GENDER', value: 'OTHER', displayName: 'Other', sortOrder: 3 },

  // Marital Status
  { category: 'MARITAL_STATUS', value: 'SINGLE', displayName: 'Single', sortOrder: 1 },
  { category: 'MARITAL_STATUS', value: 'MARRIED', displayName: 'Married', sortOrder: 2 },
  { category: 'MARITAL_STATUS', value: 'DIVORCED', displayName: 'Divorced', sortOrder: 3 },
  { category: 'MARITAL_STATUS', value: 'WIDOWED', displayName: 'Widowed', sortOrder: 4 },

  // Designations
  { category: 'DESIGNATION', value: 'INTERN', displayName: 'Intern', sortOrder: 1 },
  { category: 'DESIGNATION', value: 'ASSOCIATE', displayName: 'Associate', sortOrder: 2 },
  { category: 'DESIGNATION', value: 'SENIOR_ASSOCIATE', displayName: 'Senior Associate', sortOrder: 3 },
  { category: 'DESIGNATION', value: 'MANAGER', displayName: 'Manager', sortOrder: 4 },
  { category: 'DESIGNATION', value: 'SENIOR_MANAGER', displayName: 'Senior Manager', sortOrder: 5 },
  { category: 'DESIGNATION', value: 'AVP', displayName: 'Assistant Vice President', sortOrder: 6 },
  { category: 'DESIGNATION', value: 'VP', displayName: 'Vice President', sortOrder: 7 },
  { category: 'DESIGNATION', value: 'SVP', displayName: 'Senior Vice President', sortOrder: 8 },
  { category: 'DESIGNATION', value: 'DIRECTOR', displayName: 'Director', sortOrder: 9 },
  { category: 'DESIGNATION', value: 'SENIOR_DIRECTOR', displayName: 'Senior Director', sortOrder: 10 },

  // Countries
  { category: 'COUNTRY', value: 'USA', displayName: 'United States', sortOrder: 1 },
  { category: 'COUNTRY', value: 'INDIA', displayName: 'India', sortOrder: 2 },
  { category: 'COUNTRY', value: 'UK', displayName: 'United Kingdom', sortOrder: 3 },
  { category: 'COUNTRY', value: 'CANADA', displayName: 'Canada', sortOrder: 4 },
  { category: 'COUNTRY', value: 'AUSTRALIA', displayName: 'Australia', sortOrder: 5 },
  { category: 'COUNTRY', value: 'SINGAPORE', displayName: 'Singapore', sortOrder: 6 },
];

async function seedConfigurations() {
  console.log('🌱 Starting configuration seeding...');

  try {
    // Check if configurations already exist
    const existingCount = await prisma.systemConfiguration.count();

    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing configurations. Skipping seed to avoid duplicates.`);
      console.log('💡 If you want to re-seed, first delete existing configurations or modify this script.');
      return;
    }

    // Create all configurations
    const created = await prisma.systemConfiguration.createMany({
      data: defaultConfigurations,
      skipDuplicates: true,
    });

    console.log(`✅ Successfully seeded ${created.count} configurations!`);

    // Display summary by category
    const categories = ['DEPARTMENT', 'LOCATION', 'GENDER', 'MARITAL_STATUS', 'DESIGNATION', 'COUNTRY'];
    console.log('\n📊 Configuration Summary:');
    for (const category of categories) {
      const count = await prisma.systemConfiguration.count({
        where: { category }
      });
      console.log(`   - ${category}: ${count} options`);
    }

  } catch (error) {
    console.error('❌ Error seeding configurations:', error);
    throw error;
  }
}

// Run the seed function
seedConfigurations()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
