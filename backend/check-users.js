const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, firstName: true, lastName: true, role: true }
    });
    console.log('Existing users:');
    users.forEach(user => {
      console.log(`  ID: ${user.id}, Email: ${user.email}, Name: ${user.firstName} ${user.lastName}, Role: ${user.role}`);
    });
    console.log(`Total users: ${users.length}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();