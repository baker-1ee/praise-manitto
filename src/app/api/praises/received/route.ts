import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const praises = await prisma.praise.findMany({
    where: { toUserId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: { sprint: { select: { name: true, status: true } } },
  })

  return NextResponse.json(praises)
}
