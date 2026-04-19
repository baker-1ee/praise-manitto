import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: '토큰이 없습니다' }, { status: 400 })

  const invite = await prisma.inviteToken.findUnique({
    where: { token },
    include: { user: { select: { id: true, name: true, email: true, password: true } } },
  })

  if (!invite) return NextResponse.json({ error: '유효하지 않은 초대링크입니다' }, { status: 404 })
  if (invite.usedAt) return NextResponse.json({ error: '이미 사용된 초대링크입니다' }, { status: 410 })
  if (invite.expiresAt < new Date()) return NextResponse.json({ error: '만료된 초대링크입니다' }, { status: 410 })
  if (invite.user.password) return NextResponse.json({ error: '이미 가입된 계정입니다' }, { status: 409 })

  return NextResponse.json({
    name: invite.user.name,
    email: invite.user.email,
  })
}
