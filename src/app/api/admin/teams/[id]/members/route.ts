import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { addDays, getRandomAvatarUrl } from '@/lib/utils'

const addSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
  email: z.string().email('올바른 이메일 형식이 아닙니다').optional().or(z.literal('')),
  role: z.enum(['LEADER', 'MEMBER']).default('MEMBER'),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'LEADER'].includes(session.user.role)) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const body = await req.json()

  // LEADER는 자신의 팀만 팀원 추가 가능
  if (session.user.role === 'LEADER' && session.user.teamId !== params.id) {
    return NextResponse.json({ error: '자신의 팀만 수정할 수 있습니다' }, { status: 403 })
  }

  const parsed = addSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const { name, email, role } = parsed.data
  const normalizedEmail = email || null

  // 이메일이 있으면 이메일 기준으로 기존 유저 조회, 없으면 이름 기준
  const existing = normalizedEmail
    ? await prisma.user.findFirst({ where: { email: normalizedEmail } })
    : await prisma.user.findFirst({ where: { name } })

  if (existing) {
    const user = await prisma.user.update({
      where: { id: existing.id },
      data: {
        teamId: params.id,
        role,
        ...(normalizedEmail && { email: normalizedEmail }),
      },
      include: { inviteToken: true },
    })
    return NextResponse.json(user, { status: 201 })
  }

  // 신규 유저 생성 (미가입 상태, 초대링크 발급)
  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      avatarUrl: getRandomAvatarUrl(),
      role,
      teamId: params.id,
      inviteToken: {
        create: { expiresAt: addDays(new Date(), 30) },
      },
    },
    include: { inviteToken: true },
  })

  return NextResponse.json(user, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'LEADER'].includes(session.user.role)) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  // LEADER는 자신의 팀만 팀원 삭제 가능
  if (session.user.role === 'LEADER' && session.user.teamId !== params.id) {
    return NextResponse.json({ error: '자신의 팀만 수정할 수 있습니다' }, { status: 403 })
  }

  const { userId } = await req.json()

  const target = await prisma.user.findUnique({ where: { id: userId } })
  if (!target || target.teamId !== params.id) {
    return NextResponse.json({ error: '해당 팀의 팀원이 아닙니다' }, { status: 400 })
  }

  await prisma.user.update({ where: { id: userId }, data: { teamId: null } })
  return NextResponse.json({ ok: true })
}
