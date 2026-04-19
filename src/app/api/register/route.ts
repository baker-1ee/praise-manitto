import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const invite = await prisma.inviteToken.findUnique({
    where: { token: parsed.data.token },
    include: { user: true },
  })

  if (!invite) return NextResponse.json({ error: '유효하지 않은 초대링크입니다' }, { status: 404 })
  if (invite.usedAt) return NextResponse.json({ error: '이미 사용된 초대링크입니다' }, { status: 410 })
  if (invite.expiresAt < new Date()) return NextResponse.json({ error: '만료된 초대링크입니다' }, { status: 410 })
  if (invite.user.password) return NextResponse.json({ error: '이미 가입된 계정입니다' }, { status: 409 })

  const hashed = await bcrypt.hash(parsed.data.password, 10)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: invite.userId },
      data: { password: hashed },
    }),
    prisma.inviteToken.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    }),
  ])

  return NextResponse.json({ ok: true, email: invite.user.email })
}
