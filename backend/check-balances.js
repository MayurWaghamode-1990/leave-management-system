const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBalances() {
  try {
    const balances = await prisma.leaveBalance.findMany({
      take: 10,
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    console.log('\n📊 Current Leave Balances:\n');
    console.log(JSON.stringify(balances, null, 2));

    console.log('\n📊 Summary:');
    balances.forEach(balance => {
      console.log(`${balance.employee.firstName} ${balance.employee.lastName}: ${balance.leaveType} - Total: ${balance.totalEntitlement}, Used: ${balance.used}, Available: ${balance.available}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBalances();
