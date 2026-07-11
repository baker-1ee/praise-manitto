import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { assignManito, computePairWeights, recentSprintLookback } from '@/lib/manito'
import { sendSprintStartEmail } from '@/lib/email'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
  teamId: z.string().min(1, '팀을 선택해주세요'),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'LEADER'].includes(session.user.role)) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const where = session.user.role === 'LEADER'
    ? { teamId: session.user.teamId ?? '' }
    : {}

  const sprints = await prisma.sprint.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { pairs: true, praises: true } } },
  })

  return NextResponse.json(sprints)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'LEADER'].includes(session.user.role)) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: '입력값이 올바르지 않습니다' }, { status: 400 })

  const activeExists = await prisma.sprint.findFirst({ where: { status: 'ACTIVE', teamId: parsed.data.teamId } })
  if (activeExists) {
    return NextResponse.json({ error: '이미 진행 중인 스프린트가 있습니다. 먼저 공개하거나 종료해주세요.' }, { status: 400 })
  }

  const members = await prisma.user.findMany({
    where: { teamId: parsed.data.teamId },
    select: { id: true, name: true, email: true },
  })

  if (members.length < 2) {
    return NextResponse.json({ error: '해당 팀에 팀원이 최소 2명 필요합니다' }, { status: 400 })
  }

  const lookback = recentSprintLookback(members.length)

  const recentSprints = await prisma.sprint.findMany({
    where: { teamId: parsed.data.teamId },
    orderBy: { createdAt: 'desc' },
    take: lookback,
    include: { pairs: true },
  })

  const pairWeights = computePairWeights(
    recentSprints,
    members.map((m) => m.id)
  )

  const pairs = assignManito(members.map((m) => m.id), pairWeights)

  const sprint = await prisma.sprint.create({
    data: {
      name: parsed.data.name,
      teamId: parsed.data.teamId,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      status: 'ACTIVE',
      pairs: {
        createMany: {
          data: pairs.map((p) => ({ manitoId: p.manitoId, targetId: p.targetId })),
        },
      },
    },
  })

  await Promise.allSettled(
    members
      .filter((m) => m.email)
      .map((m) =>
        sendSprintStartEmail({
          toEmail: m.email!,
          toName: m.name ?? '팀원',
          sprintName: sprint.name,
        })
      )
  )

  return NextResponse.json(sprint, { status: 201 })
}
