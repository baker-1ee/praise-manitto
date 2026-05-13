import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, ChevronRight, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const statusLabel: Record<string, string> = {
  PENDING: '대기 중',
  ACTIVE: '진행 중',
  REVEALED: '공개됨',
  CLOSED: '종료',
}

const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  PENDING: 'outline',
  ACTIVE: 'default',
  REVEALED: 'secondary',
  CLOSED: 'outline',
}

export default async function SprintsPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const sprints = await prisma.sprint.findMany({
    where: {
      pairs: { some: { manitoId: session.user.id } },
    },
    orderBy: { startDate: 'desc' },
    include: {
      _count: { select: { praises: true } },
      pairs: {
        where: { manitoId: session.user.id },
        select: { targetId: true, target: { select: { name: true } } },
      },
    },
  })

  const receivedCountMap = await Promise.all(
    sprints.map(async (sprint) => {
      const count = await prisma.praise.count({
        where: { sprintId: sprint.id, toUserId: session.user.id },
      })
      return { sprintId: sprint.id, count }
    })
  )
  const receivedBySprintId = Object.fromEntries(receivedCountMap.map((r) => [r.sprintId, r.count]))

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.625px] flex items-center gap-2">
          <Clock className="h-6 w-6 text-[#c27b8c]" />
          스프린트
        </h1>
        <p className="text-[#615d59] mt-1 text-sm">참여한 스프린트 목록이에요</p>
      </div>

      {sprints.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-4xl mb-4">📋</p>
            <p className="text-base font-semibold tracking-[-0.25px]">참여한 스프린트가 없어요</p>
            <p className="text-[#615d59] text-sm mt-2">팀장님이 스프린트를 시작하면 여기에 표시돼요!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sprints.map((sprint) => {
            const myTarget = sprint.pairs[0]
            const isEnded = sprint.status === 'REVEALED' || sprint.status === 'CLOSED'
            const receivedCount = receivedBySprintId[sprint.id] ?? 0

            const inner = (
              <Card
                className={`border-[rgba(160,100,80,0.15)] transition-shadow ${isEnded ? 'hover:shadow-notion-card cursor-pointer' : ''}`}
                style={{ boxShadow: 'none' }}
              >
                <CardContent className="py-4 px-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fdf0f2] border border-[rgba(194,123,140,0.2)]">
                    <Calendar className="h-5 w-5 text-[#c27b8c]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm tracking-[-0.25px] truncate">{sprint.name}</span>
                      <Badge variant={statusVariant[sprint.status]}>{statusLabel[sprint.status]}</Badge>
                    </div>
                    <p className="text-xs text-[#a39e98] mt-0.5">
                      {formatDate(sprint.startDate)} ~ {formatDate(sprint.endDate)}
                    </p>
                    {isEnded && (
                      <p className="text-xs text-[#c27b8c] mt-1 font-medium">
                        받은 칭찬 {receivedCount}개 · 마니또: {myTarget?.target.name ?? '?'}님
                      </p>
                    )}
                  </div>
                  {isEnded && <ChevronRight className="h-4 w-4 text-[#a39e98] shrink-0" />}
                </CardContent>
              </Card>
            )

            return isEnded ? (
              <Link key={sprint.id} href={`/reveal/${sprint.id}`}>
                {inner}
              </Link>
            ) : (
              <div key={sprint.id}>{inner}</div>
            )
          })}
        </div>
      )}
    </div>
  )
}
