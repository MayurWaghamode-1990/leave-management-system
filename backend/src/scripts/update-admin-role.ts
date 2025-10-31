import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateAdminRole() {
  try {
    const user = await prisma.user.update({
      where: { email: 'admin@company.com' },
      data: { role: 'HR_ADMIN' }
    });

    console.log('Updated user:', {
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminRole();
