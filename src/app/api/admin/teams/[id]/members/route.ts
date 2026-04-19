import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { addDays } from '@/lib/utils'

const addSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['LEADER', 'MEMBER']).default('MEMBER'),
  slackUserId: z.string().optional(),
})

const updateSlackSchema = z.object({
  userId: z.string(),
  slackUserId: z.string(),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const body = await req.json()

  // Slack ID 매핑 업데이트
  if (body.action === 'updateSlack') {
    const parsed = updateSlackSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: '잘못된 요청입니다' }, { status: 400 })

    const user = await prisma.user.update({
      where: { id: parsed.data.userId },
      data: { slackUserId: parsed.data.slackUserId },
      select: { id: true, name: true, slackUserId: true },
    })
    return NextResponse.json(user)
  }

  // 팀원 추가
  const parsed = addSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: '입력값을 확인해주세요' }, { status: 400 })

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (exists) return NextResponse.json({ error: '이미 등록된 이메일입니다' }, { status: 409 })

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      slackUserId: parsed.data.slackUserId,
      teamId: params.id,
      inviteToken: {
        create: {
          expiresAt: addDays(new Date(), 7),
        },
      },
    },
    include: { inviteToken: true },
  })

  return NextResponse.json(user, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const { userId } = await req.json()
  await prisma.user.update({
    where: { id: userId },
    data: { teamId: null },
  })

  return NextResponse.json({ ok: true })
}
