import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PraiseForm } from '@/components/praise-form'

export default async function PraiseWritePage({
  searchParams,
}: {
  searchParams: { sprintId?: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  // sprintId 지정 시 해당 스프린트, 없으면 유저의 첫 번째 활성 ManitoPair 사용
  const myPair = searchParams.sprintId
    ? await prisma.manitoPair.findUnique({
        where: {
          sprintId_manitoId: {
            sprintId: searchParams.sprintId,
            manitoId: session.user.id,
          },
        },
        include: {
          sprint: { select: { id: true, status: true } },
          target: { select: { id: true, name: true, bio: true, avatarUrl: true } },
        },
      })
    : await prisma.manitoPair.findFirst({
        where: { manitoId: session.user.id, sprint: { status: 'ACTIVE' } },
        include: {
          sprint: { select: { id: true, status: true } },
          target: { select: { id: true, name: true, bio: true, avatarUrl: true } },
        },
      })

  if (!myPair || myPair.sprint.status !== 'ACTIVE') {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-4">😴</p>
        <p className="text-base font-semibold tracking-[-0.25px]">진행 중인 스프린트가 없어요</p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-2">
      <div className="mb-4">
        <h1 className="text-xl font-bold tracking-[-0.25px]">✉️ 손편지 쓰기</h1>
        <p className="text-[#7a6050] text-sm mt-0.5">마니또에게 마음을 담아 익명으로 전달돼요</p>
      </div>
      <PraiseForm
        targetName={myPair.target.name}
        targetBio={myPair.target.bio}
        targetAvatarUrl={myPair.target.avatarUrl}
        sprintId={myPair.sprint.id}
      />
    </div>
  )
}
