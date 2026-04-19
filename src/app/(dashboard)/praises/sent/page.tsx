import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SendHorizontal } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function SentPraisesPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const activeSprint = await prisma.sprint.findFirst({
    where: { status: 'ACTIVE' },
  })

  const myPair = activeSprint
    ? await prisma.manitoPair.findUnique({
        where: { sprintId_manitoId: { sprintId: activeSprint.id, manitoId: session.user.id } },
        include: { target: { select: { name: true } } },
      })
    : null

  const where = activeSprint && myPair
    ? { fromUserId: session.user.id, sprintId: activeSprint.id }
    : { fromUserId: session.user.id }

  const praises = await prisma.praise.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      sprint: { select: { name: true, status: true } },
      receiver: { select: { name: true } },
    },
  })

  const isFiltered = !!(activeSprint && myPair)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <SendHorizontal className="h-6 w-6 text-blue-500" />
          보낸 칭찬
        </h1>
        {isFiltered ? (
          <p className="text-muted-foreground mt-1">
            {activeSprint.name} · {myPair!.target.name}님에게 보낸 칭찬 {praises.length}개 💌
          </p>
        ) : (
          <p className="text-muted-foreground mt-1">총 {praises.length}개의 칭찬을 보냈어요 💌</p>
        )}
      </div>

      {praises.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <p className="text-4xl mb-4">✉️</p>
            <p className="text-lg font-semibold">아직 보낸 칭찬이 없어요</p>
            <p className="text-muted-foreground text-sm mt-2">마니또 대상에게 따뜻한 칭찬을 보내보세요!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {praises.map((praise) => (
            <Card key={praise.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-muted-foreground">
                      {praise.receiver.name}님에게
                    </span>
                    <span className="text-muted-foreground text-xs">•</span>
                    <span className="text-xs text-muted-foreground">{formatDate(praise.createdAt)}</span>
                  </div>
                  {!isFiltered && (
                    <Badge variant="outline" className="shrink-0 text-xs">{praise.sprint.name}</Badge>
                  )}
                </div>

                <p className="text-sm leading-relaxed">{praise.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
