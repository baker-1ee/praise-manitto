'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { formatDate, formatDateTime, getInitials } from '@/lib/utils'
import { celebrate } from '@/lib/celebration'

interface Praise {
  content: string
  createdAt: string
}

interface Pair {
  manitoId: string
  targetId: string
  manitoName: string | null
  targetName: string | null
  praiseCount: number
  praises: Praise[]
}

interface Member {
  id: string
  name: string | null
  avatarUrl: string | null
}

interface RevealData {
  sprint: { id: string; name: string; startDate: string; endDate: string }
  members: Member[]
  pairs: Pair[]
  stats: { totalPraises: number }
}

export default function RevealPage() {
  const { sprintId } = useParams<{ sprintId: string }>()
  const [data, setData] = useState<RevealData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/sprints/${sprintId}/reveal`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
  }, [sprintId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center space-y-3">
          <div className="text-4xl animate-bounce">🎉</div>
          <p className="text-muted-foreground">마니또 공개 중...</p>
        </div>
      </div>
    )
  }

  if (!data) return <div className="text-center py-16">데이터를 불러올 수 없습니다</div>

  // targetId 기준으로 pair를 빠르게 찾기 위한 맵
  const pairByTarget = new Map(data.pairs.map((p) => [p.targetId, p]))

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">{data.sprint.name}</h1>
        <p className="text-muted-foreground text-sm">
          {formatDate(data.sprint.startDate)} ~ {formatDate(data.sprint.endDate)}
        </p>
        <Badge className="text-sm px-4 py-1">🎊 마니또 공개!</Badge>
        <p className="text-sm text-muted-foreground pt-1">
          이번 스프린트에서 총 <span className="font-bold text-primary">{data.stats.totalPraises}개</span>의 칭찬이 오갔어요 💌
        </p>
      </div>

      <div className="space-y-3">
        {data.members.map((member) => {
          const pair = pairByTarget.get(member.id)
          const isExpanded = expandedId === member.id

          return (
            <Card
              key={member.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                if (!isExpanded) celebrate(member.name)
                setExpandedId(isExpanded ? null : member.id)
              }}
            >
              <CardContent className="pt-4 pb-4">
                {/* 헤더: 아바타 + 이름 + 토글 */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 shrink-0">
                    {member.avatarUrl && <AvatarImage src={member.avatarUrl} />}
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base">{member.name}</p>
                    {pair ? (
                      <p className="text-xs text-muted-foreground">
                        💌 {pair.praiseCount > 0 ? `${pair.praiseCount}개의 칭찬` : '칭찬 없음'}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">마니또 배정 없음</p>
                    )}
                  </div>
                  {pair && (
                    isExpanded
                      ? <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
                      : <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}
                </div>

                {/* 펼쳐진 칭찬 내용 */}
                {isExpanded && pair && (
                  <div className="mt-4 space-y-3">
                    <Separator />
                    <div className="flex items-center gap-2 pt-1">
                      <Avatar className="h-8 w-8 shrink-0">
                        {(() => {
                          const manito = data.members.find(m => m.id === pair.manitoId)
                          return (
                            <>
                              {manito?.avatarUrl && <AvatarImage src={manito.avatarUrl} />}
                              <AvatarFallback className="bg-indigo-100 text-indigo-600 text-xs font-bold">
                                {getInitials(pair.manitoName)}
                              </AvatarFallback>
                            </>
                          )
                        })()}
                      </Avatar>
                      <p className="text-sm font-medium text-indigo-600">
                        {pair.manitoName}
                        <span className="text-muted-foreground font-normal">님이 칭찬했어요</span>
                      </p>
                    </div>

                    {pair.praises.length === 0 ? (
                      <p className="text-sm text-muted-foreground pl-1">작성된 칭찬이 없어요</p>
                    ) : (
                      pair.praises.map((praise, i) => (
                        <div key={i} className="bg-muted/40 rounded-lg px-4 py-3 space-y-1">
                          <p className="text-sm leading-relaxed">&ldquo;{praise.content}&rdquo;</p>
                          <p className="text-xs text-muted-foreground">{formatDateTime(praise.createdAt)}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
