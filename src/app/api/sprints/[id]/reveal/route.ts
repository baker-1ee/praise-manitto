import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const sprint = await prisma.sprint.findUnique({ where: { id: params.id } })
  if (!sprint) return NextResponse.json({ error: '스프린트를 찾을 수 없습니다' }, { status: 404 })
  if (sprint.status !== 'REVEALED' && sprint.status !== 'CLOSED') {
    return NextResponse.json({ error: '아직 공개되지 않은 스프린트입니다' }, { status: 403 })
  }

  const [pairs, allPraises, members] = await Promise.all([
    prisma.manitoPair.findMany({
      where: { sprintId: params.id },
      include: {
        manito: { select: { id: true, name: true } },
        target: { select: { id: true, name: true } },
      },
    }),
    prisma.praise.findMany({
      where: { sprintId: params.id },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.user.findMany({
      where: { role: { not: 'ADMIN' } },
      select: { id: true, name: true },
    }),
  ])

  const pairsWithPraises = pairs.map((pair) => {
    const praises = allPraises.filter((p) => p.fromUserId === pair.manitoId && p.toUserId === pair.targetId)
    return {
      manitoId: pair.manitoId,
      targetId: pair.targetId,
      manitoName: pair.manito.name,
      targetName: pair.target.name,
      praiseCount: praises.length,
      praises: praises.map((p) => ({
        content: p.content,
        categories: p.categories,
        createdAt: p.createdAt.toISOString(),
      })),
    }
  })

  // 통계 계산
  const senderCounts = new Map<string, number>()
  const receiverCounts = new Map<string, number>()
  const categoryCounts = new Map<string, number>()

  for (const p of allPraises) {
    senderCounts.set(p.fromUserId, (senderCounts.get(p.fromUserId) ?? 0) + 1)
    receiverCounts.set(p.toUserId, (receiverCounts.get(p.toUserId) ?? 0) + 1)
    for (const cat of p.categories) {
      categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1)
    }
  }

  const memberMap = new Map(members.map((m) => [m.id, m.name]))

  const topSenderId = [...senderCounts.entries()].sort((a, b) => b[1] - a[1])[0]
  const topReceiverId = [...receiverCounts.entries()].sort((a, b) => b[1] - a[1])[0]
  const topCategoryEntry = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0]

  return NextResponse.json({
    sprint: {
      id: sprint.id,
      name: sprint.name,
      startDate: sprint.startDate.toISOString(),
      endDate: sprint.endDate.toISOString(),
    },
    members,
    pairs: pairsWithPraises,
    stats: {
      totalPraises: allPraises.length,
      topSender: topSenderId ? { name: memberMap.get(topSenderId[0]) ?? null, count: topSenderId[1] } : null,
      topReceiver: topReceiverId ? { name: memberMap.get(topReceiverId[0]) ?? null, count: topReceiverId[1] } : null,
      topCategory: topCategoryEntry?.[0] ?? null,
    },
  })
}
