import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminPassword = await bcrypt.hash('admin123!', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: '관리자',
      password: adminPassword,
      role: Role.ADMIN,
    },
  })

  console.log('Admin user created:', admin.email)
  console.log('Seed completed!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
