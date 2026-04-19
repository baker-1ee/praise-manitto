import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { addDays, getRandomAvatarUrl } from '@/lib/utils'

const addSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
  role: z.enum(['LEADER', 'MEMBER']).default('MEMBER'),
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

  // 팀원 추가 (이름 + 역할만, 이메일 자동 생성)
  const parsed = addSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  // 초대 전용 임시 이메일 (온보딩 시 실제 이메일로 교체됨)
  const placeholderEmail = `invite.${Date.now()}.${Math.random().toString(36).slice(2)}@manitto.invited`

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: placeholderEmail,
      avatarUrl: getRandomAvatarUrl(),
      role: parsed.data.role,
      teamId: params.id,
      inviteToken: {
        create: { expiresAt: addDays(new Date(), 30) },
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
  await prisma.user.update({ where: { id: userId }, data: { teamId: null } })
  return NextResponse.json({ ok: true })
}
