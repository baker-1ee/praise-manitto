import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SendHorizontal } from 'lucide-react'
import { formatDate } from '@/lib/utils'

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.625px] flex items-center gap-2">
          <SendHorizontal className="h-6 w-6 text-[#0075de]" />
          보낸 칭찬
        </h1>
        {isFiltered ? (
          <p className="text-[#615d59] mt-1 text-sm">
            {sprint!.name} · {myPair!.target.name}님에게 보낸 칭찬 {praises.length}개 💌
          </p>
        ) : (
          <p className="text-[#615d59] mt-1 text-sm">총 {praises.length}개의 칭찬을 보냈어요 💌</p>
        )}
      </div>

      {praises.length === 0 ? (
        <div
          className="rounded-2xl text-center py-16"
          style={{
            background: 'linear-gradient(150deg, #fffef7 0%, #fdf8ec 100%)',
            border: '1px solid #ddd0b0',
            boxShadow: '0 4px 20px rgba(120,95,50,0.10), 0 1px 0 rgba(255,255,255,0.85) inset',
          }}
        >
          <p className="text-4xl mb-4">✉️</p>
          <p
            className="text-base font-semibold tracking-[-0.25px]"
            style={{ color: '#3d2b10', fontFamily: 'Georgia, serif' }}
          >
            아직 보낸 칭찬이 없어요
          </p>
          <p className="text-sm mt-2" style={{ color: '#a08050' }}>
            마니또 대상에게 따뜻한 칭찬을 보내보세요!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {praises.map((praise) => (
            <div
              key={praise.id}
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(150deg, #fffef7 0%, #fdf8ec 100%)',
                border: '1px solid #ddd0b0',
                boxShadow: '0 4px 20px rgba(120,95,50,0.10), 0 1px 0 rgba(255,255,255,0.85) inset',
              }}
            >
              {/* 편지 헤더 — 수신인 */}
              <div className="px-6 pt-5 pb-4" style={{ borderBottom: '1.5px dashed #ddd0b0' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="text-xs font-medium"
                      style={{ color: '#b89c6a', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                    >
                      To.
                    </p>
                    <p
                      className="text-xl font-bold leading-tight"
                      style={{ color: '#3d2b10', fontFamily: 'Georgia, serif' }}
                    >
                      {praise.receiver.name}님에게
                    </p>
                  </div>
                  <span className="text-2xl select-none">💌</span>
                </div>
              </div>

              {/* 편지 본문 — 줄노트 스타일 */}
              <div className="px-6 py-1">
                <p
                  style={{
                    width: '100%',
                    minHeight: '84px',
                    backgroundImage:
                      'repeating-linear-gradient(to bottom, transparent 0px, transparent 27px, rgba(180,155,100,0.22) 27px, rgba(180,155,100,0.22) 28px)',
                    backgroundPositionY: '10px',
                    fontFamily: 'Georgia, "Nanum Myeongjo", "Malgun Gothic", serif',
                    fontSize: '14.5px',
                    lineHeight: '28px',
                    color: '#2d1e08',
                    paddingTop: '10px',
                    paddingBottom: '8px',
                    whiteSpace: 'pre-wrap',
                    display: 'block',
                  }}
                >
                  {praise.content}
                </p>
              </div>

              {/* 편지 푸터 — 발신인 & 날짜 */}
              <div className="px-6 pt-3 pb-5" style={{ borderTop: '1.5px dashed #ddd0b0' }}>
                <div className="flex items-center justify-between">
                  <p
                    className="text-sm"
                    style={{ color: '#b89c6a', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                  >
                    — 익명의 마니또로부터 ♥
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs"
                      style={{ color: '#b89c6a', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                    >
                      {formatDate(praise.createdAt)}
                    </span>
                    {!isFiltered && (
                      <span
                        className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                        style={{
                          color: '#a08050',
                          background: 'rgba(200,170,100,0.12)',
                          border: '1px dashed #c8a864',
                        }}
                      >
                        {praise.sprint.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
