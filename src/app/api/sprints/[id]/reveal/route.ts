import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 마니또 배정(순열)의 사이클을 따라 targetId 순서를 구성한다.
 * 예: A→B, B→C, C→A 인 경우 [B, C, A] 순서로 반환 —
 * 이 순서대로 카드를 배치하면 "A가 B를 칭찬 → B가 C를 칭찬 → ..." 로 꼬리를 문다.
 */
function buildManitoChainOrder(pairs: { manitoId: string; targetId: string }[]): string[] {
  const byManito = new Map(pairs.map((p) => [p.manitoId, p]))
  const visited = new Set<string>()
  const orderedTargetIds: string[] = []

  for (const pair of pairs) {
    if (visited.has(pair.manitoId)) continue
    let current: { manitoId: string; targetId: string } | undefined = pair
    while (current && !visited.has(current.manitoId)) {
      visited.add(current.manitoId)
      orderedTargetIds.push(current.targetId)
      current = byManito.get(current.targetId)
    }
  }

  return orderedTargetIds
}

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
      where: { role: { not: 'ADMIN' }, teamId: sprint.teamId },
      select: { id: true, name: true, avatarUrl: true },
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

  // 카드 목록을 마니또 체인 순서(A가 B를 칭찬 → B가 C를 칭찬 → ...)로 정렬한다.
  // 체인에 속하지 않은 멤버(스프린트 시작 후 합류 등)는 뒤쪽에 원래 순서대로 붙인다.
  const chainOrder = buildManitoChainOrder(pairsWithPraises)
  const chainIndex = new Map(chainOrder.map((id, idx) => [id, idx]))
  const orderedMembers = [...members].sort((a, b) => {
    const ai = chainIndex.get(a.id) ?? Number.MAX_SAFE_INTEGER
    const bi = chainIndex.get(b.id) ?? Number.MAX_SAFE_INTEGER
    return ai - bi
  })

  return NextResponse.json({
    sprint: {
      id: sprint.id,
      name: sprint.name,
      startDate: sprint.startDate.toISOString(),
      endDate: sprint.endDate.toISOString(),
    },
    members: orderedMembers,
    pairs: pairsWithPraises,
    stats: {
      totalPraises: allPraises.length,
      topSender: topSenderId ? { name: memberMap.get(topSenderId[0]) ?? null, count: topSenderId[1] } : null,
      topReceiver: topReceiverId ? { name: memberMap.get(topReceiverId[0]) ?? null, count: topReceiverId[1] } : null,
      topCategory: topCategoryEntry?.[0] ?? null,
    },
  })
}
