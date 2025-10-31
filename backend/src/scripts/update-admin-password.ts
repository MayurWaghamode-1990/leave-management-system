import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function updatePassword() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 12);

    const user = await prisma.user.update({
      where: { email: 'admin@company.com' },
      data: { password: hashedPassword }
    });

    console.log('Password updated for:', user.email);
    console.log('New password: admin123');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePassword();
