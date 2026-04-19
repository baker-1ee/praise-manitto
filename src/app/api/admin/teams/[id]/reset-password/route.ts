import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: '유저 ID가 필요합니다' }, { status: 400 })

  const hashed = await bcrypt.hash('0000', 10)

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed, mustChangePassword: true },
  })

  return NextResponse.json({ ok: true })
}
