import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SendHorizontal } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function SentPraisesPage({
  searchParams,
}: {
  searchParams: { sprintId?: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const sprint = searchParams.sprintId
    ? await prisma.sprint.findUnique({ where: { id: searchParams.sprintId } })
    : await prisma.sprint.findFirst({ where: { status: 'ACTIVE' } })

  const myPair = sprint
    ? await prisma.manitoPair.findUnique({
        where: { sprintId_manitoId: { sprintId: sprint.id, manitoId: session.user.id } },
        include: { target: { select: { name: true } } },
      })
    : null

  const where = sprint && myPair
    ? { fromUserId: session.user.id, sprintId: sprint.id }
    : { fromUserId: session.user.id }

  const praises = await prisma.praise.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      sprint: { select: { name: true, status: true } },
      receiver: { select: { name: true } },
    },
  })

  const isFiltered = !!(sprint && myPair)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.625px] flex items-center gap-2">
          <SendHorizontal className="h-6 w-6 text-[#0075de]" />
          보낸 칭찬
        </h1>
        {isFiltered ? (
          <p className="text-[#615d59] mt-1 text-sm">
            {sprint!.name} · {myPair!.target.name}님에게 보낸 칭찬 {praises.length}개 💌
          </p>
        ) : (
          <p className="text-[#615d59] mt-1 text-sm">총 {praises.length}개의 칭찬을 보냈어요 💌</p>
        )}
      </div>

      {praises.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <p className="text-4xl mb-4">✉️</p>
            <p className="text-base font-semibold tracking-[-0.25px]">아직 보낸 칭찬이 없어요</p>
            <p className="text-[#615d59] text-sm mt-2">마니또 대상에게 따뜻한 칭찬을 보내보세요!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {praises.map((praise) => (
            <Card key={praise.id} className="hover:shadow-notion-card transition-shadow">
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">
                      {praise.receiver.name}님에게
                    </span>
                    <span className="text-[#a39e98] text-xs">·</span>
                    <span className="text-xs text-[#a39e98]">{formatDate(praise.createdAt)}</span>
                  </div>
                  {!isFiltered && (
                    <Badge variant="secondary" className="shrink-0 text-xs">{praise.sprint.name}</Badge>
                  )}
                </div>

                <p className="text-sm leading-relaxed text-foreground">{praise.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
