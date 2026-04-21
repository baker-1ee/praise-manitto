import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PraiseForm } from '@/components/praise-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { getInitials } from '@/lib/utils'

export default async function PraiseWritePage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const activeSprint = await prisma.sprint.findFirst({ where: { status: 'ACTIVE' } })

  if (!activeSprint) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-4">😴</p>
        <p className="text-base font-semibold tracking-[-0.25px]">진행 중인 스프린트가 없어요</p>
      </div>
    )
  }

  const myPair = await prisma.manitoPair.findUnique({
    where: { sprintId_manitoId: { sprintId: activeSprint.id, manitoId: session.user.id } },
    include: { target: { select: { id: true, name: true, bio: true, avatarUrl: true } } },
  })

  if (!myPair) {
    return (
      <div className="text-center py-16">
        <p className="text-base font-semibold">아직 마니또가 배정되지 않았어요</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-[-0.25px]">칭찬 보내기</h1>
        <p className="text-[#615d59] text-sm mt-0.5">마니또 대상에게 익명으로 전달됩니다</p>
      </div>

      {/* 대상 카드 */}
      <Card className="bg-[#f6f5f4]" style={{ boxShadow: 'none' }}>
        <CardContent className="py-4 flex items-center gap-3">
          <Avatar className="h-11 w-11 shrink-0">
            {myPair.target.avatarUrl && <AvatarImage src={myPair.target.avatarUrl} />}
            <AvatarFallback className="text-base bg-[#f2f9ff] text-[#097fe8] font-semibold">
              {getInitials(myPair.target.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-[#a39e98] font-medium">칭찬 대상</p>
            <p className="font-bold text-base leading-tight tracking-[-0.25px]">{myPair.target.name}</p>
            {myPair.target.bio && <p className="text-xs text-[#615d59] truncate mt-0.5">{myPair.target.bio}</p>}
          </div>
          <Badge variant="default" className="ml-auto shrink-0">익명 전달</Badge>
        </CardContent>
      </Card>

      {/* 작성 폼 */}
      <Card>
        <CardHeader className="pb-2 pt-5 px-5">
          <CardTitle className="text-base">칭찬 작성</CardTitle>
          <CardDescription className="text-xs">
            {myPair.target.name}님에게 전하고 싶은 칭찬을 작성해주세요.
            발신자는 스프린트 공개 전까지 알 수 없어요.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-0">
          <PraiseForm targetName={myPair.target.name} />
        </CardContent>
      </Card>
    </div>
  )
}
