import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendPraiseNotification } from '@/lib/slack'
import { z } from 'zod'

const schema = z.object({
  content: z.string().min(10).max(500),
  categories: z.array(z.string()).optional().default([]),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: '입력값이 올바르지 않습니다' }, { status: 400 })

  const activeSprint = await prisma.sprint.findFirst({ where: { status: 'ACTIVE' } })
  if (!activeSprint) return NextResponse.json({ error: '진행 중인 스프린트가 없습니다' }, { status: 400 })

  const myPair = await prisma.manitoPair.findUnique({
    where: { sprintId_manitoId: { sprintId: activeSprint.id, manitoId: session.user.id } },
    include: { target: { select: { slackUserId: true } } },
  })
  if (!myPair) return NextResponse.json({ error: '마니또 배정 정보가 없습니다' }, { status: 400 })

  const praise = await prisma.praise.create({
    data: {
      sprintId: activeSprint.id,
      fromUserId: session.user.id,
      toUserId: myPair.targetId,
      content: parsed.data.content,
      categories: parsed.data.categories,
    },
  })

  // Slack 알림 (비동기, 실패해도 응답 영향 없음)
  const appUrl = process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? ''
  sendPraiseNotification(
    myPair.target.slackUserId,
    parsed.data.categories,
    parsed.data.content,
    appUrl,
  ).catch(console.error)

  return NextResponse.json(praise, { status: 201 })
}
