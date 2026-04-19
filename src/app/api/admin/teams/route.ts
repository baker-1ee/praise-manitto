import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'LEADER'].includes(session.user.role)) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const where = session.user.role === 'LEADER'
    ? { id: session.user.teamId ?? '' }
    : {}

  const teams = await prisma.team.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      members: {
        select: { id: true, name: true, email: true, role: true, avatarUrl: true, slackUserId: true, inviteToken: { select: { token: true, usedAt: true } } },
        orderBy: [{ role: 'asc' }, { name: 'asc' }],
      },
    },
  })

  return NextResponse.json(teams)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: '팀 이름을 입력해주세요' }, { status: 400 })

  const team = await prisma.team.create({ data: { name: parsed.data.name } })
  return NextResponse.json(team, { status: 201 })
}
