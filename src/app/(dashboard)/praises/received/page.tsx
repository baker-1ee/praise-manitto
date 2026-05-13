import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Inbox } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { PraiseSwipeViewer } from '@/components/praise-swipe-viewer'

export default async function ReceivedPraisesPage({
  searchParams,
}: {
  searchParams: { sprintId?: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const sprint = searchParams.sprintId
    ? await prisma.sprint.findUnique({ where: { id: searchParams.sprintId } })
    : null

  const praises = await prisma.praise.findMany({
    where: {
      toUserId: session.user.id,
      ...(sprint ? { sprintId: sprint.id } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      sprint: { select: { name: true, status: true } },
    },
  })

  const isFiltered = !!sprint

  const cards = praises.map((praise) => ({
    id: praise.id,
    content: praise.content,
    headerLabel: 'From.',
    headerName: praise.sprint.status === 'REVEALED' ? '마니또 공개됨' : '익명의 마니또',
    footerLeftText: formatDate(praise.createdAt),
    footerRightText: '',
    footerBadge: isFiltered ? undefined : praise.sprint.name,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.625px] flex items-center gap-2">
          <Inbox className="h-6 w-6 text-[#7c3aed]" />
          받은 칭찬
        </h1>
        {isFiltered ? (
          <p className="text-[hsl(265_18%_45%)] mt-1 text-sm">
            {sprint!.name} · 받은 칭찬 {praises.length}개
          </p>
        ) : (
          <p className="text-[hsl(265_18%_45%)] mt-1 text-sm">총 {praises.length}개의 칭찬을 받았어요</p>
        )}
      </div>

      {praises.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[hsl(263_50%_90%)] shadow-[0_4px_18px_rgba(124,58,237,0.04)] text-center py-16">
          <div className="h-12 w-12 rounded-full bg-[#f0ebff] flex items-center justify-center mx-auto mb-4">
            <Inbox className="h-6 w-6 text-[#7c3aed]" />
          </div>
          <p className="text-base font-semibold tracking-[-0.25px] text-[hsl(267_50%_10%)]">
            아직 받은 칭찬이 없어요
          </p>
          <p className="text-sm mt-2 text-[hsl(265_18%_45%)]">
            팀원이 곧 칭찬을 보내줄 거예요!
          </p>
        </div>
      ) : (
        <PraiseSwipeViewer cards={cards} />
      )}
    </div>
  )
}
