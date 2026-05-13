import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { PraiseSwipeViewer } from '@/components/praise-swipe-viewer'
import { Calendar, ChevronLeft, Inbox, SendHorizontal, Gift } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function SprintDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const sprint = await prisma.sprint.findUnique({
    where: { id: params.id },
    include: {
      pairs: {
        where: { manitoId: session.user.id },
        include: {
          target: { select: { name: true } },
        },
      },
    },
  })

  if (!sprint || (sprint.status !== 'REVEALED' && sprint.status !== 'CLOSED')) {
    notFound()
  }

  const myPair = sprint.pairs[0]

  // 내가 받은 칭찬
  const receivedPraises = await prisma.praise.findMany({
    where: { sprintId: sprint.id, toUserId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      sender: { select: { name: true } },
    },
  })

  // 내가 보낸 칭찬
  const sentPraises = await prisma.praise.findMany({
    where: { sprintId: sprint.id, fromUserId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      receiver: { select: { name: true } },
    },
  })

  // 내 마니또가 누구인지 — 나를 target으로 가진 pair
  const manitoPair = await prisma.manitoPair.findUnique({
    where: { sprintId_targetId: { sprintId: sprint.id, targetId: session.user.id } },
    include: { manito: { select: { name: true } } },
  })

  const isRevealed = sprint.status === 'REVEALED' || sprint.status === 'CLOSED'

  const receivedCards = receivedPraises.map((praise) => ({
    id: praise.id,
    content: praise.content,
    headerLabel: 'From.',
    headerName: isRevealed ? `${praise.sender.name}님` : '익명의 마니또',
    footerLeftText: isRevealed ? `— ${praise.sender.name}님의 마니또 ♥` : '— 익명의 마니또로부터 ♥',
    footerRightText: formatDate(praise.createdAt),
  }))

  const sentCards = sentPraises.map((praise) => ({
    id: praise.id,
    content: praise.content,
    headerLabel: 'To.',
    headerName: `${praise.receiver.name}님에게`,
    footerLeftText: '— 익명의 마니또로부터 ♥',
    footerRightText: formatDate(praise.createdAt),
  }))

  return (
    <div className="space-y-6">
      {/* 뒤로가기 */}
      <Link
        href="/sprints"
        className="inline-flex items-center gap-1 text-sm text-[#a39e98] hover:text-[#7a6050] transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        스프린트 목록
      </Link>

      {/* 스프린트 헤더 */}
      <Card className="bg-[#f4ebe3] border-[rgba(160,100,80,0.15)]" style={{ boxShadow: 'none' }}>
        <CardContent className="py-4 px-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#c27b8c]" />
              <span className="font-semibold text-sm tracking-[-0.25px]">{sprint.name}</span>
            </div>
            <Badge variant="secondary">{sprint.status === 'REVEALED' ? '공개됨' : '종료'}</Badge>
          </div>
          <p className="text-xs text-[#a39e98]">
            {formatDate(sprint.startDate)} ~ {formatDate(sprint.endDate)}
          </p>
        </CardContent>
      </Card>

      {/* 마니또 공개 정보 */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-[rgba(160,100,80,0.15)]" style={{ boxShadow: 'none' }}>
          <CardContent className="py-4 px-4 text-center">
            <Gift className="h-5 w-5 text-[#c27b8c] mx-auto mb-2" />
            <p className="text-xs text-[#a39e98] mb-1">내 마니또 대상</p>
            <p className="font-bold text-sm text-[#3d2b10]">{myPair?.target.name ?? '?'}님</p>
          </CardContent>
        </Card>
        <Card className="border-[rgba(160,100,80,0.15)]" style={{ boxShadow: 'none' }}>
          <CardContent className="py-4 px-4 text-center">
            <Gift className="h-5 w-5 text-[#c27b8c] mx-auto mb-2" />
            <p className="text-xs text-[#a39e98] mb-1">나의 마니또</p>
            <p className="font-bold text-sm text-[#3d2b10]">{manitoPair?.manito.name ?? '?'}님</p>
          </CardContent>
        </Card>
      </div>

      {/* 받은 칭찬 */}
      <section className="space-y-3">
        <h2 className="text-base font-bold tracking-[-0.25px] flex items-center gap-2">
          <Inbox className="h-5 w-5 text-[#c27b8c]" />
          받은 칭찬{' '}
          <span className="text-sm font-normal text-[#a39e98]">{receivedPraises.length}개</span>
        </h2>
        {receivedPraises.length === 0 ? (
          <div
            className="rounded-2xl text-center py-10"
            style={{
              background: 'linear-gradient(150deg, #fffef7 0%, #fdf8ec 100%)',
              border: '1px solid #ddd0b0',
            }}
          >
            <p className="text-3xl mb-2">✉️</p>
            <p className="text-sm font-medium" style={{ color: '#3d2b10' }}>
              받은 칭찬이 없어요
            </p>
          </div>
        ) : (
          <PraiseSwipeViewer cards={receivedCards} />
        )}
      </section>

      {/* 보낸 칭찬 */}
      <section className="space-y-3">
        <h2 className="text-base font-bold tracking-[-0.25px] flex items-center gap-2">
          <SendHorizontal className="h-5 w-5 text-[#c27b8c]" />
          보낸 칭찬{' '}
          <span className="text-sm font-normal text-[#a39e98]">{sentPraises.length}개</span>
        </h2>
        {sentPraises.length === 0 ? (
          <div
            className="rounded-2xl text-center py-10"
            style={{
              background: 'linear-gradient(150deg, #fffef7 0%, #fdf8ec 100%)',
              border: '1px solid #ddd0b0',
            }}
          >
            <p className="text-3xl mb-2">✉️</p>
            <p className="text-sm font-medium" style={{ color: '#3d2b10' }}>
              보낸 칭찬이 없어요
            </p>
          </div>
        ) : (
          <PraiseSwipeViewer cards={sentCards} />
        )}
      </section>
    </div>
  )
}
