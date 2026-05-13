import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SendHorizontal } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { PraiseSwipeViewer } from '@/components/praise-swipe-viewer'

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

  const cards = praises.map((praise) => ({
    id: praise.id,
    content: praise.content,
    headerLabel: 'To.',
    headerName: `${praise.receiver.name}님에게`,
    footerLeftText: '— 익명의 마니또로부터 ♥',
    footerRightText: formatDate(praise.createdAt),
    footerBadge: isFiltered ? undefined : praise.sprint.name,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.625px] flex items-center gap-2">
          <SendHorizontal className="h-6 w-6 text-[#7c3aed]" />
          보낸 칭찬
        </h1>
        {isFiltered ? (
          <p className="text-[hsl(265_18%_45%)] mt-1 text-sm">
            {sprint!.name} · {myPair!.target.name}님에게 보낸 칭찬 {praises.length}개
          </p>
        ) : (
          <p className="text-[hsl(265_18%_45%)] mt-1 text-sm">총 {praises.length}개의 칭찬을 보냈어요</p>
        )}
      </div>

      {praises.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[hsl(263_50%_90%)] shadow-[0_4px_18px_rgba(124,58,237,0.04)] text-center py-16">
          <div className="h-12 w-12 rounded-full bg-[#f0ebff] flex items-center justify-center mx-auto mb-4">
            <SendHorizontal className="h-6 w-6 text-[#7c3aed]" />
          </div>
          <p className="text-base font-semibold tracking-[-0.25px] text-[hsl(267_50%_10%)]">
            아직 보낸 칭찬이 없어요
          </p>
          <p className="text-sm mt-2 text-[hsl(265_18%_45%)]">
            마니또 대상에게 따뜻한 칭찬을 보내보세요!
          </p>
        </div>
      ) : (
        <PraiseSwipeViewer cards={cards} />
      )}
    </div>
  )
}
