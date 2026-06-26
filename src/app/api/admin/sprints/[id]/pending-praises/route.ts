import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'LEADER'].includes(session.user.role)) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const sprint = await prisma.sprint.findUnique({
    where: { id: params.id },
    select: { id: true, teamId: true, status: true },
  })
  if (!sprint) return NextResponse.json({ error: '스프린트를 찾을 수 없습니다' }, { status: 404 })

  if (session.user.role === 'LEADER' && sprint.teamId !== session.user.teamId) {
    return NextResponse.json({ error: '자신의 팀 스프린트만 조회할 수 있습니다' }, { status: 403 })
  }

  const pairs = await prisma.manitoPair.findMany({
    where: { sprintId: params.id },
    select: { manitoId: true, manito: { select: { id: true, name: true } } },
  })

  const praises = await prisma.praise.findMany({
    where: { sprintId: params.id },
    select: { fromUserId: true },
  })

  const writtenByIds = new Set(praises.map((p) => p.fromUserId))

  const pending = pairs
    .filter((pair) => !writtenByIds.has(pair.manitoId))
    .map((pair) => ({ id: pair.manito.id, name: pair.manito.name ?? '(이름 없음)' }))

  return NextResponse.json({ pending })
}
