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

  // 팀원 추가
  const parsed = addSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  // 동일 이름의 기존 유저가 있으면 팀에 편입 (가입완료 상태)
  const existing = await prisma.user.findFirst({ where: { name: parsed.data.name } })

  if (existing) {
    const user = await prisma.user.update({
      where: { id: existing.id },
      data: { teamId: params.id, role: parsed.data.role },
      include: { inviteToken: true },
    })
    return NextResponse.json(user, { status: 201 })
  }

  // 신규 유저 생성 (미가입 상태, 초대링크 발급)
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
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
