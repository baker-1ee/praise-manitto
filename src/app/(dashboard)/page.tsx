import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ManitoCard } from '@/components/manito-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Send, Inbox, Calendar, PartyPopper } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const activeSprint = await prisma.sprint.findFirst({
    where: { status: 'ACTIVE' },
  })

  const myPair = activeSprint
    ? await prisma.manitoPair.findUnique({
        where: { sprintId_manitoId: { sprintId: activeSprint.id, manitoId: session.user.id } },
        include: { target: { select: { name: true, bio: true, avatarUrl: true } } },
      })
    : null

  const [sentCount, receivedCount] = await Promise.all([
    activeSprint
      ? prisma.praise.count({ where: { sprintId: activeSprint.id, fromUserId: session.user.id } })
      : 0,
    activeSprint
      ? prisma.praise.count({ where: { sprintId: activeSprint.id, toUserId: session.user.id } })
      : 0,
  ])

  const revealedSprint = !activeSprint && session.user.teamId
    ? await prisma.sprint.findFirst({
        where: {
          teamId: session.user.teamId,
          status: { in: ['REVEALED', 'CLOSED'] },
        },
        orderBy: { endDate: 'desc' },
      })
    : null

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-2xl font-bold">안녕하세요, {session.user.name}님 👋</h1>
        <p className="text-muted-foreground mt-1 text-sm">오늘도 팀원을 칭찬해보세요!</p>
      </div>

      {activeSprint ? (
        <>
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  {activeSprint.name}
                </CardTitle>
                <Badge variant="secondary">진행 중</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDate(activeSprint.startDate)} ~ {formatDate(activeSprint.endDate)}
              </p>
            </CardHeader>
          </Card>

          <div>
            <h2 className="text-xl font-semibold mb-2">이번 스프린트 내 마니또</h2>
            <ManitoCard
              target={myPair?.target ?? null}
              sprintName={activeSprint.name}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-primary">{sentCount}</div>
                <div className="text-sm text-muted-foreground mt-1">내가 보낸 칭찬</div>
                <Link href="/praise/write" className="mt-4 block">
                  <Button size="sm" className="w-full gap-2">
                    <Send className="h-4 w-4" /> 칭찬 쓰기
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-pink-500">{receivedCount}</div>
                <div className="text-sm text-muted-foreground mt-1">내가 받은 칭찬</div>
                <Link href="/praises/received" className="mt-4 block">
                  <Button size="sm" variant="outline" className="w-full gap-2">
                    <Inbox className="h-4 w-4" /> 확인하기
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-4xl mb-4">😴</p>
              <p className="text-lg font-semibold">현재 진행 중인 스프린트가 없어요</p>
              <p className="text-muted-foreground text-sm mt-2">팀장님이 새 스프린트를 시작하면 알려드릴게요!</p>
            </CardContent>
          </Card>

          {revealedSprint && (
            <Link href={`/reveal/${revealedSprint.id}`}>
              <Card className="border-yellow-300 bg-yellow-50 hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6 flex items-center gap-4">
                  <PartyPopper className="h-8 w-8 text-yellow-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base">🎊 마니또가 공개됐어요!</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{revealedSprint.name} 결과 보러가기 →</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
