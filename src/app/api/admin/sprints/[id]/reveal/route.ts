import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendRevealNotification } from '@/lib/slack'

export async function PUT(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'LEADER'].includes(session.user.role)) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const sprint = await prisma.sprint.findUnique({ where: { id: params.id } })
  if (!sprint) return NextResponse.json({ error: '스프린트를 찾을 수 없습니다' }, { status: 404 })

  if (session.user.role === 'LEADER' && sprint.teamId !== session.user.teamId) {
    return NextResponse.json({ error: '자신의 팀 스프린트만 공개할 수 있습니다' }, { status: 403 })
  }
  if (sprint.status !== 'ACTIVE') {
    return NextResponse.json({ error: '진행 중인 스프린트만 공개할 수 있습니다' }, { status: 400 })
  }

  const updated = await prisma.sprint.update({
    where: { id: params.id },
    data: { status: 'REVEALED' },
  })

  const appUrl = process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? ''
  const webhookUrl = process.env.SLACK_WEBHOOK_URL ?? ''
  sendRevealNotification(webhookUrl, sprint.name, `${appUrl}/reveal/${sprint.id}`).catch(console.error)

  return NextResponse.json(updated)
}
