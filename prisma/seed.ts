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

  // 테스트 팀원 생성
  const members = [
    { name: '김민준', email: 'minjun@example.com' },
    { name: '이서연', email: 'seoyeon@example.com' },
    { name: '박지호', email: 'jiho@example.com' },
    { name: '최유나', email: 'yuna@example.com' },
  ]

  for (const m of members) {
    const pw = await bcrypt.hash('member123!', 10)
    await prisma.user.upsert({
      where: { email: m.email },
      update: {},
      create: { ...m, password: pw, role: Role.MEMBER },
    })
  }

  console.log('Seed completed!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
