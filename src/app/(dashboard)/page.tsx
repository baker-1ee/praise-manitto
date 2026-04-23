import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ManitoCard } from '@/components/manito-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Send, Inbox, Calendar, PartyPopper, ExternalLink } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { avatarUrl: true, slackUserId: true },
  })

  // 이 유저가 마니또로 참여 중인 모든 활성 스프린트 조회
  const activePairs = await prisma.manitoPair.findMany({
    where: {
      manitoId: session.user.id,
      sprint: { status: 'ACTIVE' },
    },
    include: {
      sprint: true,
      target: { select: { name: true, bio: true, avatarUrl: true } },
    },
  })

  // 각 스프린트별 칭찬 통계 계산
  const activePairsWithStats = await Promise.all(
    activePairs.map(async (pair) => {
      const [sentCount, receivedCount] = await Promise.all([
        prisma.praise.count({ where: { sprintId: pair.sprintId, fromUserId: session.user.id } }),
        prisma.praise.count({ where: { sprintId: pair.sprintId, toUserId: session.user.id } }),
      ])
      return { ...pair, sentCount, receivedCount }
    })
  )

  // 활성 스프린트 없을 때 가장 최근 공개된 스프린트 조회
  const revealedSprint =
    activePairs.length === 0
      ? await prisma.sprint.findFirst({
          where: {
            pairs: { some: { manitoId: session.user.id } },
            status: { in: ['REVEALED', 'CLOSED'] },
          },
          orderBy: { endDate: 'desc' },
        })
      : null

  return (
    <div className="space-y-4">
      {/* 인사 헤더 */}
      <div className="flex items-center gap-3">
        <Avatar className="h-11 w-11 shrink-0">
          {me?.avatarUrl && <AvatarImage src={me.avatarUrl} />}
          <AvatarFallback className="bg-[#fdf0f2] text-[#c27b8c] font-semibold">
            {getInitials(session.user.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-bold tracking-[-0.25px]">안녕하세요, {session.user.name}님 👋</h1>
          <p className="text-[#615d59] mt-0.5 text-sm">오늘도 팀원을 칭찬해보세요!</p>
          {!me?.slackUserId && process.env.NEXT_PUBLIC_SLACK_INVITE_URL && (
            <a
              href={process.env.NEXT_PUBLIC_SLACK_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#c27b8c] hover:underline mt-0.5"
            >
              <ExternalLink className="h-3 w-3" />
              칭찬 알림 받으려면 Slack 입장하기
            </a>
          )}
        </div>
      </div>

      {activePairsWithStats.length > 0 ? (
        <div className="space-y-6">
          {activePairsWithStats.map(({ sprint, target, sentCount, receivedCount }) => (
            <div key={sprint.id} className="space-y-4">
              {/* 스프린트 카드 */}
              <Card className="bg-[#f4ebe3] border-[rgba(160,100,80,0.15)]" style={{ boxShadow: 'none' }}>
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2 font-semibold">
                      <Calendar className="h-4 w-4 text-[#c27b8c]" />
                      {sprint.name}
                    </CardTitle>
                    <Badge variant="default">진행 중</Badge>
                  </div>
                  <p className="text-xs text-[#a39e98]">
                    {formatDate(sprint.startDate)} ~ {formatDate(sprint.endDate)}
                  </p>
                </CardHeader>
              </Card>

              {/* 마니또 카드 */}
              <div>
                <h2 className="text-base font-semibold mb-2 tracking-[-0.25px]">이번 스프린트 내 마니또</h2>
                <ManitoCard target={target} sprintName={sprint.name} />
              </div>

              {/* 칭찬 통계 */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="text-center">
                  <CardContent className="pt-4 pb-4">
                    <div className="text-3xl font-bold text-[#c27b8c] tracking-[-1px]">{sentCount}</div>
                    <div className="text-xs text-[#615d59] mt-1 font-medium">내가 보낸 칭찬</div>
                    <Link href={`/praise/write?sprintId=${sprint.id}`} className="mt-3 block">
                      <Button size="sm" className="w-full gap-2">
                        <Send className="h-3.5 w-3.5" /> 칭찬 쓰기
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="pt-4 pb-4">
                    <div className="text-3xl font-bold text-[#c27b8c] tracking-[-1px]">{receivedCount}</div>
                    <div className="text-xs text-[#615d59] mt-1 font-medium">내가 받은 칭찬</div>
                    <Link href="/praises/received" className="mt-3 block">
                      <Button size="sm" variant="secondary" className="w-full gap-2">
                        <Inbox className="h-3.5 w-3.5" /> 확인하기
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {revealedSprint ? (
            <Link href={`/reveal/${revealedSprint.id}`}>
              <Card className="bg-[#f4ebe3] hover:shadow-notion-card transition-shadow cursor-pointer border-[rgba(160,100,80,0.15)]">
                <CardContent className="pt-5 pb-5 flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-card border border-[rgba(160,100,80,0.15)]">
                    <PartyPopper className="h-6 w-6 text-[#c27b8c]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base tracking-[-0.25px]">마니또가 공개됐어요! 🎊</p>
                    <p className="text-sm text-[#615d59] mt-0.5">{revealedSprint.name} 결과 보러가기 →</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-4xl mb-4">😴</p>
                <p className="text-base font-semibold tracking-[-0.25px]">현재 진행 중인 스프린트가 없어요</p>
                <p className="text-[#615d59] text-sm mt-2">팀장님이 새 스프린트를 시작하면 알려드릴게요!</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
