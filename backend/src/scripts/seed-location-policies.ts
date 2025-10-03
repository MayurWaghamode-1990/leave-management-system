/**
 * Location-based Policy Seeding Script
 * Creates GLF-compliant policies for India and USA locations
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface PolicyData {
  name: string;
  leaveType: string;
  entitlementDays: number;
  accrualRate: number;
  maxCarryForward: number;
  minimumGap: number;
  maxConsecutiveDays: number;
  requiresDocumentation: boolean;
  documentationThreshold: number;
  location: string;
  region: string;
}

const indiaPolicies: PolicyData[] = [
  // India - Casual Leave (CL): 12 days/year
  {
    name: "India Casual Leave Policy",
    leaveType: "CASUAL_LEAVE",
    entitlementDays: 12,
    accrualRate: 1.0, // Monthly accrual
    maxCarryForward: 0, // CL typically doesn't carry forward
    minimumGap: 0,
    maxConsecutiveDays: 3,
    requiresDocumentation: false,
    documentationThreshold: 0,
    location: "Bengaluru",
    region: "INDIA"
  },
  // India - Privilege Leave (PL): 12 days/year
  {
    name: "India Privilege Leave Policy",
    leaveType: "EARNED_LEAVE",
    entitlementDays: 12,
    accrualRate: 1.0, // Monthly accrual
    maxCarryForward: 5, // PL can be carried forward
    minimumGap: 0,
    maxConsecutiveDays: 10,
    requiresDocumentation: false,
    documentationThreshold: 0,
    location: "Bengaluru",
    region: "INDIA"
  },
  // India - Sick Leave: 12 days/year
  {
    name: "India Sick Leave Policy",
    leaveType: "SICK_LEAVE",
    entitlementDays: 12,
    accrualRate: 1.0,
    maxCarryForward: 6,
    minimumGap: 0,
    maxConsecutiveDays: 7,
    requiresDocumentation: true,
    documentationThreshold: 3,
    location: "Bengaluru",
    region: "INDIA"
  },
  // India - Maternity Leave: 26 weeks (182 days)
  {
    name: "India Maternity Leave Policy",
    leaveType: "MATERNITY_LEAVE",
    entitlementDays: 182, // 26 weeks as per Maternity Benefit Act
    accrualRate: 0, // One-time entitlement
    maxCarryForward: 0,
    minimumGap: 0,
    maxConsecutiveDays: 182,
    requiresDocumentation: true,
    documentationThreshold: 1,
    location: "Bengaluru",
    region: "INDIA"
  },
  // India - Paternity Leave: 15 days
  {
    name: "India Paternity Leave Policy",
    leaveType: "PATERNITY_LEAVE",
    entitlementDays: 15,
    accrualRate: 0, // One-time entitlement
    maxCarryForward: 0,
    minimumGap: 0,
    maxConsecutiveDays: 15,
    requiresDocumentation: true,
    documentationThreshold: 1,
    location: "Bengaluru",
    region: "INDIA"
  },
  // India - Compensatory Off
  {
    name: "India Compensatory Off Policy",
    leaveType: "COMPENSATORY_OFF",
    entitlementDays: 0, // Earned through extra work
    accrualRate: 0,
    maxCarryForward: 10, // Max accumulation
    minimumGap: 0,
    maxConsecutiveDays: 3,
    requiresDocumentation: true,
    documentationThreshold: 1,
    location: "Bengaluru",
    region: "INDIA"
  }
];

const usaPolicies: PolicyData[] = [
  // USA - PTO for regular employees: 15 days/year
  {
    name: "USA PTO Policy - Regular Employees",
    leaveType: "EARNED_LEAVE",
    entitlementDays: 15,
    accrualRate: 1.25, // Annual accrual (15/12)
    maxCarryForward: 5,
    minimumGap: 0,
    maxConsecutiveDays: 15,
    requiresDocumentation: false,
    documentationThreshold: 0,
    location: "San Francisco",
    region: "USA"
  },
  // USA - PTO for VP/AVP: 20 days/year
  {
    name: "USA PTO Policy - VP/AVP",
    leaveType: "EARNED_LEAVE",
    entitlementDays: 20,
    accrualRate: 1.67, // Annual accrual (20/12)
    maxCarryForward: 10,
    minimumGap: 0,
    maxConsecutiveDays: 20,
    requiresDocumentation: false,
    documentationThreshold: 0,
    location: "San Francisco",
    region: "USA"
  },
  // USA - Sick Leave: 10 days/year
  {
    name: "USA Sick Leave Policy",
    leaveType: "SICK_LEAVE",
    entitlementDays: 10,
    accrualRate: 0.83, // Annual accrual (10/12)
    maxCarryForward: 5,
    minimumGap: 0,
    maxConsecutiveDays: 10,
    requiresDocumentation: true,
    documentationThreshold: 3,
    location: "San Francisco",
    region: "USA"
  },
  // USA - Maternity Leave: 12 weeks (84 days)
  {
    name: "USA Maternity Leave Policy",
    leaveType: "MATERNITY_LEAVE",
    entitlementDays: 84, // 12 weeks as per FMLA
    accrualRate: 0,
    maxCarryForward: 0,
    minimumGap: 0,
    maxConsecutiveDays: 84,
    requiresDocumentation: true,
    documentationThreshold: 1,
    location: "San Francisco",
    region: "USA"
  },
  // USA - Paternity Leave: 6 weeks (42 days)
  {
    name: "USA Paternity Leave Policy",
    leaveType: "PATERNITY_LEAVE",
    entitlementDays: 42, // 6 weeks
    accrualRate: 0,
    maxCarryForward: 0,
    minimumGap: 0,
    maxConsecutiveDays: 42,
    requiresDocumentation: true,
    documentationThreshold: 1,
    location: "San Francisco",
    region: "USA"
  }
];

async function seedLocationPolicies() {
  console.log('🌍 Starting location-based policy seeding...\n');

  try {
    // Clear existing policies to avoid duplicates
    console.log('Clearing existing policies...');
    await prisma.leavePolicy.deleteMany({
      where: {
        OR: [
          { region: 'INDIA' },
          { region: 'USA' }
        ]
      }
    });

    console.log('✅ Existing policies cleared\n');

    // Seed India policies
    console.log('🇮🇳 Seeding India policies...');
    for (const policy of indiaPolicies) {
      const createdPolicy = await prisma.leavePolicy.create({
        data: {
          ...policy,
          effectiveFrom: new Date('2024-01-01'),
          effectiveTo: null,
          isActive: true
        }
      });
      console.log(`✅ Created: ${createdPolicy.name} (${createdPolicy.entitlementDays} days)`);
    }

    console.log(`\n🇺🇸 Seeding USA policies...`);
    for (const policy of usaPolicies) {
      const createdPolicy = await prisma.leavePolicy.create({
        data: {
          ...policy,
          effectiveFrom: new Date('2024-01-01'),
          effectiveTo: null,
          isActive: true
        }
      });
      console.log(`✅ Created: ${createdPolicy.name} (${createdPolicy.entitlementDays} days)`);
    }

    // Get summary counts
    const indiaPolicyCount = await prisma.leavePolicy.count({
      where: { region: 'INDIA', isActive: true }
    });

    const usaPolicyCount = await prisma.leavePolicy.count({
      where: { region: 'USA', isActive: true }
    });

    console.log('\n📊 Policy Seeding Summary:');
    console.log(`India Policies: ${indiaPolicyCount}`);
    console.log(`USA Policies: ${usaPolicyCount}`);
    console.log(`Total: ${indiaPolicyCount + usaPolicyCount}`);

    console.log('\n🎉 Location-based policy seeding completed successfully!');
    console.log('\n📋 Created Policies:');
    console.log('India (Bengaluru):');
    console.log('  • Casual Leave: 12 days/year');
    console.log('  • Privilege Leave: 12 days/year');
    console.log('  • Sick Leave: 12 days/year');
    console.log('  • Maternity Leave: 182 days (26 weeks)');
    console.log('  • Paternity Leave: 15 days');
    console.log('  • Compensatory Off: Earned basis');

    console.log('\nUSA (San Francisco):');
    console.log('  • PTO (Regular): 15 days/year');
    console.log('  • PTO (VP/AVP): 20 days/year');
    console.log('  • Sick Leave: 10 days/year');
    console.log('  • Maternity Leave: 84 days (12 weeks)');
    console.log('  • Paternity Leave: 42 days (6 weeks)');

    return {
      success: true,
      indiaPolicies: indiaPolicyCount,
      usaPolicies: usaPolicyCount,
      total: indiaPolicyCount + usaPolicyCount
    };

  } catch (error) {
    console.error('❌ Error seeding location policies:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedLocationPolicies();
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

export { seedLocationPolicies };