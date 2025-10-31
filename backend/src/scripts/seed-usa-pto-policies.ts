import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed USA PTO Policies
 * Based on GLF requirements for USA employees
 */
async function seedUsaPtoPolicies() {
  console.log('🌱 Seeding USA PTO Policies...');

  const policies = [
    {
      designation: 'VP',
      annualPtoDays: 25,
      accrualFrequency: 'YEARLY',
      accrualRate: 25,
      maxCarryForward: 5,
      carryForwardExpiry: 90, // Q1 end (March 31st)
      proRataCalculation: true,
      minimumServiceMonths: 0,
      isActive: true
    },
    {
      designation: 'AVP',
      annualPtoDays: 20,
      accrualFrequency: 'YEARLY',
      accrualRate: 20,
      maxCarryForward: 5,
      carryForwardExpiry: 90,
      proRataCalculation: true,
      minimumServiceMonths: 0,
      isActive: true
    },
    {
      designation: 'SENIOR_MANAGER',
      annualPtoDays: 18,
      accrualFrequency: 'YEARLY',
      accrualRate: 18,
      maxCarryForward: 5,
      carryForwardExpiry: 90,
      proRataCalculation: true,
      minimumServiceMonths: 0,
      isActive: true
    },
    {
      designation: 'MANAGER',
      annualPtoDays: 15,
      accrualFrequency: 'YEARLY',
      accrualRate: 15,
      maxCarryForward: 5,
      carryForwardExpiry: 90,
      proRataCalculation: true,
      minimumServiceMonths: 0,
      isActive: true
    },
    {
      designation: 'SENIOR_DEVELOPER',
      annualPtoDays: 15,
      accrualFrequency: 'YEARLY',
      accrualRate: 15,
      maxCarryForward: 5,
      carryForwardExpiry: 90,
      proRataCalculation: true,
      minimumServiceMonths: 0,
      isActive: true
    },
    {
      designation: 'DEVELOPER',
      annualPtoDays: 12,
      accrualFrequency: 'YEARLY',
      accrualRate: 12,
      maxCarryForward: 5,
      carryForwardExpiry: 90,
      proRataCalculation: true,
      minimumServiceMonths: 0,
      isActive: true
    },
    {
      designation: 'JUNIOR_DEVELOPER',
      annualPtoDays: 10,
      accrualFrequency: 'YEARLY',
      accrualRate: 10,
      maxCarryForward: 3,
      carryForwardExpiry: 90,
      proRataCalculation: true,
      minimumServiceMonths: 0,
      isActive: true
    }
  ];

  for (const policy of policies) {
    const result = await prisma.usaPtoPolicy.upsert({
      where: { designation: policy.designation },
      update: policy,
      create: policy
    });

    console.log(`✅ Created/Updated PTO policy for ${policy.designation}: ${policy.annualPtoDays} days`);
  }

  console.log('\n📊 USA PTO Policy Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Designation          | Annual PTO | Max Carry-Forward');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  for (const policy of policies) {
    const designation = policy.designation.padEnd(20, ' ');
    const annualDays = policy.annualPtoDays.toString().padStart(10, ' ');
    const carryForward = policy.maxCarryForward.toString().padStart(17, ' ');
    console.log(`  ${designation} | ${annualDays} | ${carryForward}`);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('🎉 USA PTO policies seeded successfully!');
  console.log('\nKey Features:');
  console.log('  ✓ Designation-based PTO allocation');
  console.log('  ✓ Pro-rata calculation for mid-year joiners');
  console.log('  ✓ Carry-forward up to 5 days (3 for junior roles)');
  console.log('  ✓ Q1 expiry (March 31st) for carried-forward days');
  console.log('\nScheduled Jobs:');
  console.log('  • Annual Accrual: January 1st at 12:00 AM');
  console.log('  • Year-End Carry-Forward: December 31st at 11:59 PM');
  console.log('  • Q1 Expiry Check: April 1st at 12:00 AM');
}

seedUsaPtoPolicies()
  .catch((error) => {
    console.error('❌ Error seeding USA PTO policies:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
