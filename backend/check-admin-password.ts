import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function checkAdminPassword() {
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@company.com' }
  })

  if (!admin) {
    console.log('❌ Admin user not found')
    return
  }

  console.log('\n📋 Admin User Details:')
  console.log(`   Email: ${admin.email}`)
  console.log(`   Name: ${admin.firstName} ${admin.lastName}`)
  console.log(`   Role: ${admin.role}`)
  console.log(`   Password Hash: ${admin.password.substring(0, 30)}...`)

  // Test multiple possible passwords
  const testPasswords = ['admin123', 'Admin@123', 'password', 'Admin123', 'password123']

  console.log('\n🔐 Testing Passwords:')
  for (const pwd of testPasswords) {
    const isMatch = await bcrypt.compare(pwd, admin.password)
    console.log(`   ${pwd}: ${isMatch ? '✅ MATCH' : '❌ No match'}`)
  }

  await prisma.$disconnect()
}

checkAdminPassword()
