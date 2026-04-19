import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'LEADER'].includes(session.user.role)) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const sprint = await prisma.sprint.findUnique({ where: { id: params.id } })
  if (!sprint) return NextResponse.json({ error: '스프린트를 찾을 수 없습니다' }, { status: 404 })

  if (session.user.role === 'LEADER' && sprint.teamId !== session.user.teamId) {
    return NextResponse.json({ error: '자신의 팀 스프린트만 삭제할 수 있습니다' }, { status: 403 })
  }

  await prisma.$transaction([
    prisma.praise.deleteMany({ where: { sprintId: params.id } }),
    prisma.manitoPair.deleteMany({ where: { sprintId: params.id } }),
    prisma.sprint.delete({ where: { id: params.id } }),
  ])

  return NextResponse.json({ ok: true })
}
