'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { RelationGraph, type GraphPair } from '@/components/relation-graph'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Trophy, Heart, Send } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface RevealData {
  sprint: { id: string; name: string; startDate: string; endDate: string }
  members: Array<{ id: string; name: string | null }>
  pairs: Array<{
    manitoId: string
    targetId: string
    manitoName: string | null
    targetName: string | null
    praiseCount: number
    praises: Array<{ content: string; categories: string[]; createdAt: string }>
  }>
  stats: {
    totalPraises: number
    topSender: { name: string | null; count: number } | null
    topReceiver: { name: string | null; count: number } | null
    topCategory: string | null
  }
}

export default function RevealPage() {
  const { sprintId } = useParams<{ sprintId: string }>()
  const [data, setData] = useState<RevealData | null>(null)
  const [selectedPair, setSelectedPair] = useState<GraphPair | null>(null)
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">{data.sprint.name}</h1>
        <p className="text-muted-foreground">
          {formatDate(data.sprint.startDate)} ~ {formatDate(data.sprint.endDate)}
        </p>
        <Badge className="text-base px-4 py-1">🎊 마니또 공개!</Badge>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <CardContent className="pt-6">
            <Heart className="h-6 w-6 text-pink-500 mx-auto mb-2" />
            <div className="text-3xl font-bold text-pink-500">{data.stats.totalPraises}</div>
            <div className="text-xs text-muted-foreground mt-1">총 칭찬 수</div>
          </CardContent>
        </Card>
        <Card className="text-center border-yellow-300 bg-yellow-50">
          <CardContent className="pt-6">
            <Trophy className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
            <div className="text-sm font-bold truncate">{data.stats.topSender?.name ?? '-'}</div>
            <div className="text-xs text-muted-foreground mt-1">칭찬왕 👑</div>
            {data.stats.topSender && (
              <Badge variant="secondary" className="mt-1 text-xs">{data.stats.topSender.count}개</Badge>
            )}
          </CardContent>
        </Card>
        <Card className="text-center border-pink-300 bg-pink-50">
          <CardContent className="pt-6">
            <Heart className="h-6 w-6 text-pink-500 mx-auto mb-2 fill-pink-500" />
            <div className="text-sm font-bold truncate">{data.stats.topReceiver?.name ?? '-'}</div>
            <div className="text-xs text-muted-foreground mt-1">인기왕 ❤️</div>
            {data.stats.topReceiver && (
              <Badge variant="secondary" className="mt-1 text-xs">{data.stats.topReceiver.count}개</Badge>
            )}
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <Send className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <div className="text-sm font-bold">{data.stats.topCategory ?? '-'}</div>
            <div className="text-xs text-muted-foreground mt-1">인기 카테고리</div>
          </CardContent>
        </Card>
      </div>

      {/* 관계도 */}
      <div>
        <h2 className="text-xl font-semibold mb-4">마니또 관계도</h2>
        <RelationGraph
          members={data.members}
          pairs={data.pairs}
          onEdgeClick={(pair) => setSelectedPair(pair)}
        />
      </div>

      {/* 선택된 칭찬 패널 */}
      {selectedPair && (
        <Card className="border-primary/30 animate-slide-in">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              💌 칭찬 내용
              <Badge variant="outline">
                {data.pairs.find(p => p.manitoId === selectedPair.manitoId)?.manitoName} →{' '}
                {data.pairs.find(p => p.manitoId === selectedPair.manitoId)?.targetName}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedPair.praises.length === 0 ? (
              <p className="text-muted-foreground text-sm">작성된 칭찬이 없어요</p>
            ) : (
              selectedPair.praises.map((praise, i) => (
                <div key={i}>
                  {i > 0 && <Separator className="my-3" />}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1 flex-wrap">
                        {praise.categories.map((cat) => (
                          <Badge key={cat} variant="secondary" className="text-xs">{cat}</Badge>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDate(praise.createdAt)}</span>
                    </div>
                    <p className="text-sm leading-relaxed">{praise.content}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
