const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addLWPPolicies() {
  console.log('🌱 Adding LWP policies...');

  try {
    // Check if LWP policies already exist
    const existingPolicies = await prisma.leavePolicy.findMany({
      where: {
        leaveType: 'LEAVE_WITHOUT_PAY'
      }
    });

    if (existingPolicies.length > 0) {
      console.log('✅ LWP policies already exist');
      return;
    }

    // Add LWP policies
    const lwpPolicies = [
      {
        name: 'India Leave Without Pay Policy',
        leaveType: 'LEAVE_WITHOUT_PAY',
        entitlementDays: 365, // No fixed limit, but max 1 year continuous
        accrualRate: 0,
        maxCarryForward: 0,
        requiresDocumentation: true,
        documentationThreshold: 1, // Always requires documentation
        maxConsecutiveDays: 365,
        location: 'Bengaluru',
        region: 'INDIA',
        effectiveFrom: new Date('2024-01-01')
      },
      {
        name: 'USA Leave Without Pay Policy',
        leaveType: 'LEAVE_WITHOUT_PAY',
        entitlementDays: 365, // No fixed limit, but max 1 year continuous
        accrualRate: 0,
        maxCarryForward: 0,
        requiresDocumentation: true,
        documentationThreshold: 1, // Always requires documentation
        maxConsecutiveDays: 365,
        location: 'Chicago',
        region: 'USA',
        effectiveFrom: new Date('2024-01-01')
      },
      {
        name: 'USA PTO Policy (PTO)',
        leaveType: 'PTO',
        entitlementDays: 20, // Base PTO for AVP and below
        accrualRate: 1.67,
        maxCarryForward: 5,
        requiresDocumentation: false,
        location: 'Chicago',
        region: 'USA',
        effectiveFrom: new Date('2024-01-01')
      }
    ];

    for (const policy of lwpPolicies) {
      await prisma.leavePolicy.create({ data: policy });
    }

    console.log('✅ LWP policies added successfully');
  } catch (error) {
    console.error('❌ Error adding LWP policies:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addLWPPolicies();