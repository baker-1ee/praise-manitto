import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ManitoCard } from '@/components/manito-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, PartyPopper, ChevronRight, Sparkles } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { PraiseNudgeButton } from '@/components/praise-nudge-button'

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { avatarUrl: true },
  })

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

  const activePairsWithStats = await Promise.all(
    activePairs.map(async (pair) => {
      const [sentCount, receivedCount] = await Promise.all([
        prisma.praise.count({ where: { sprintId: pair.sprintId, fromUserId: session.user.id } }),
        prisma.praise.count({ where: { sprintId: pair.sprintId, toUserId: session.user.id } }),
      ])
      return { ...pair, sentCount, receivedCount }
    })
  )

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
    <div className="space-y-5">
      {/* 인사 헤더 */}
      <div className="flex items-center gap-3.5 pt-1">
        <Avatar className="h-12 w-12 shrink-0 ring-2 ring-[rgba(124,58,237,0.15)] ring-offset-2 ring-offset-background">
          {me?.avatarUrl && <AvatarImage src={me.avatarUrl} />}
          <AvatarFallback className="bg-[#f0ebff] text-[#7c3aed] font-semibold text-sm">
            {getInitials(session.user.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.5px] leading-tight">
            안녕하세요, {session.user.name}님 👋
          </h1>
          <p className="text-[#5b5080] mt-0.5 text-sm">오늘도 팀원을 칭찬해보세요!</p>
        </div>
      </div>

      {activePairsWithStats.length > 0 ? (
        <div className="space-y-5">
          {activePairsWithStats.map(({ sprint, target, sentCount, receivedCount }) => (
            <div key={sprint.id} className="space-y-3">
              {/* 스프린트 헤더 */}
              <div className="px-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#7c3aed]" />
                    <span className="text-sm font-semibold text-foreground tracking-[-0.25px]">
                      {sprint.name}
                    </span>
                  </div>
                  <Badge variant="default" className="text-[11px]">진행 중</Badge>
                </div>
                <p className="text-xs text-[#9c95b8] pl-6">
                  {formatDate(sprint.startDate)} ~ {formatDate(sprint.endDate)}
                </p>
              </div>

              {/* 마니또 카드 */}
              <Card className="bg-white border-[rgba(124,58,237,0.1)] overflow-hidden" style={{ boxShadow: 'rgba(124,58,237,0.04) 0px 4px 18px, rgba(124,58,237,0.03) 0px 2px 8px, rgba(0,0,0,0.02) 0px 1px 3px' }}>
                <CardHeader className="pb-0 pt-4 px-4">
                  <CardTitle className="text-sm font-semibold text-[#5b5080]">
                    이번 스프린트 내 마니또
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3 pb-4 px-4">
                  <ManitoCard target={target} sprintName={sprint.name} />
                </CardContent>
              </Card>

              {/* 칭찬 통계 */}
              <div className="grid grid-cols-2 gap-3">
                <Link href={`/praises/sent?sprintId=${sprint.id}`} className="block group">
                  <Card className="text-center h-full transition-all group-hover:shadow-notion-card group-hover:-translate-y-0.5 cursor-pointer bg-white border-[rgba(124,58,237,0.1)]" style={{ boxShadow: 'rgba(124,58,237,0.03) 0px 2px 10px, rgba(0,0,0,0.02) 0px 1px 3px' }}>
                    <CardContent className="pt-5 pb-4">
                      <div className="flex items-end justify-center gap-1">
                        <div className="text-4xl font-bold text-[#7c3aed] tracking-[-1.5px] leading-none">
                          {sentCount}
                        </div>
                        <ChevronRight className="h-4 w-4 text-[#9c95b8] mb-0.5" />
                      </div>
                      <div className="text-xs text-[#5b5080] mt-2 font-medium">내가 보낸 칭찬</div>
                    </CardContent>
                  </Card>
                </Link>
                <Link href={`/praises/received?sprintId=${sprint.id}`} className="block group">
                  <Card className="text-center h-full transition-all group-hover:shadow-notion-card group-hover:-translate-y-0.5 cursor-pointer bg-white border-[rgba(124,58,237,0.1)]" style={{ boxShadow: 'rgba(124,58,237,0.03) 0px 2px 10px, rgba(0,0,0,0.02) 0px 1px 3px' }}>
                    <CardContent className="pt-5 pb-4">
                      <div className="flex items-end justify-center gap-1">
                        <div className="text-4xl font-bold text-[#7c3aed] tracking-[-1.5px] leading-none">
                          {receivedCount}
                        </div>
                        <ChevronRight className="h-4 w-4 text-[#9c95b8] mb-0.5" />
                      </div>
                      <div className="text-xs text-[#5b5080] mt-2 font-medium">내가 받은 칭찬</div>
                    </CardContent>
                  </Card>
                </Link>
              </div>

              {/* CTA 버튼 */}
              <div className="space-y-2 pt-1">
                <Link href={`/praise/write?sprintId=${sprint.id}`} className="block">
                  <Button size="default" className="w-full gap-2 h-11 text-[15px] shadow-sm">
                    <Sparkles className="h-4 w-4" /> 칭찬 쓰기
                  </Button>
                </Link>
                <PraiseNudgeButton sprintId={sprint.id} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {revealedSprint ? (
            <Link href={`/reveal/${revealedSprint.id}`}>
              <Card className="bg-white hover:shadow-notion-card hover:-translate-y-0.5 transition-all cursor-pointer border-[rgba(124,58,237,0.1)]" style={{ boxShadow: 'rgba(124,58,237,0.04) 0px 4px 18px, rgba(0,0,0,0.02) 0px 1px 3px' }}>
                <CardContent className="pt-5 pb-5 flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f0ebff] border border-[rgba(124,58,237,0.12)]">
                    <PartyPopper className="h-6 w-6 text-[#7c3aed]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base tracking-[-0.25px]">마니또가 공개됐어요! 🎊</p>
                    <p className="text-sm text-[#5b5080] mt-0.5">{revealedSprint.name} 결과 보러가기 →</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ) : (
            <Card className="text-center py-14 bg-white border-[rgba(124,58,237,0.1)]" style={{ boxShadow: 'rgba(124,58,237,0.04) 0px 4px 18px, rgba(0,0,0,0.02) 0px 1px 3px' }}>
              <CardContent>
                <div className="flex items-center justify-center mb-4">
                  <div className="h-16 w-16 rounded-2xl bg-[#f5f3ff] flex items-center justify-center">
                    <span className="text-3xl">😴</span>
                  </div>
                </div>
                <p className="text-base font-semibold tracking-[-0.25px]">현재 진행 중인 스프린트가 없어요</p>
                <p className="text-[#5b5080] text-sm mt-2">팀장님이 새 스프린트를 시작하면 알려드릴게요!</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
