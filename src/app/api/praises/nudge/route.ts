import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendPraiseNudgeEmail } from '@/lib/email'
import { z } from 'zod'

const schema = z.object({
  sprintId: z.string(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: '입력값이 올바르지 않습니다' }, { status: 400 })

  // 나를 대상으로 하는 마니또 쌍 조회 (= 나에게 칭찬을 보내야 하는 사람)
  const pair = await prisma.manitoPair.findUnique({
    where: {
      sprintId_targetId: {
        sprintId: parsed.data.sprintId,
        targetId: session.user.id,
      },
    },
    include: {
      sprint: { select: { status: true, name: true } },
      manito: { select: { name: true, email: true } },
    },
  })

  if (!pair) return NextResponse.json({ error: '마니또 배정 정보가 없습니다' }, { status: 400 })
  if (pair.sprint.status !== 'ACTIVE') return NextResponse.json({ error: '진행 중인 스프린트가 없습니다' }, { status: 400 })
  if (!pair.manito.email) return NextResponse.json({ error: '마니또 이메일 정보가 없습니다' }, { status: 400 })

  await sendPraiseNudgeEmail({
    toEmail: pair.manito.email,
    toName: pair.manito.name ?? '마니또',
    targetName: session.user.name ?? '팀원',
    sprintName: pair.sprint.name,
  })

  return NextResponse.json({ ok: true })
}
