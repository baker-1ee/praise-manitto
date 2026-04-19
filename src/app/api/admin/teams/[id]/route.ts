import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  await prisma.$transaction([
    prisma.user.updateMany({ where: { teamId: params.id }, data: { teamId: null } }),
    prisma.team.delete({ where: { id: params.id } }),
  ])

  return NextResponse.json({ ok: true })
}
