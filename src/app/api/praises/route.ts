import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  content: z.string().min(10).max(500),
  categories: z.array(z.string()).optional().default([]),
  sprintId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: '입력값이 올바르지 않습니다' }, { status: 400 })

  // sprintId 지정 시 해당 스프린트, 없으면 유저의 첫 번째 활성 ManitoPair 사용
  const myPair = parsed.data.sprintId
    ? await prisma.manitoPair.findUnique({
        where: {
          sprintId_manitoId: {
            sprintId: parsed.data.sprintId,
            manitoId: session.user.id,
          },
        },
        include: {
          sprint: { select: { status: true } },
        },
      })
    : await prisma.manitoPair.findFirst({
        where: { manitoId: session.user.id, sprint: { status: 'ACTIVE' } },
        include: {
          sprint: { select: { status: true } },
        },
      })

  if (!myPair) return NextResponse.json({ error: '마니또 배정 정보가 없습니다' }, { status: 400 })
  if (myPair.sprint.status !== 'ACTIVE') return NextResponse.json({ error: '진행 중인 스프린트가 없습니다' }, { status: 400 })

  const praise = await prisma.praise.create({
    data: {
      sprintId: myPair.sprintId,
      fromUserId: session.user.id,
      toUserId: myPair.targetId,
      content: parsed.data.content,
      categories: parsed.data.categories,
    },
  })

  return NextResponse.json(praise, { status: 201 })
}
