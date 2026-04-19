import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { addDays } from '@/lib/utils'

// 초대 토큰 재생성
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const { userId } = await req.json()

  const token = await prisma.inviteToken.upsert({
    where: { userId },
    update: {
      token: crypto.randomUUID(),
      expiresAt: addDays(new Date(), 7),
      usedAt: null,
    },
    create: {
      userId,
      expiresAt: addDays(new Date(), 7),
    },
  })

  return NextResponse.json({ token: token.token })
}
