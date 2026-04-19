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
        <p className="text-lg font-semibold">진행 중인 스프린트가 없어요</p>
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
        <p className="text-lg font-semibold">아직 마니또가 배정되지 않았어요</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold">칭찬 보내기</h1>
        <p className="text-muted-foreground mt-1">마니또 대상에게 익명으로 전달됩니다</p>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6 flex items-center gap-4">
          <Avatar className="h-14 w-14">
            {myPair.target.avatarUrl && <AvatarImage src={myPair.target.avatarUrl} />}
            <AvatarFallback className="text-lg bg-primary/10 text-primary">
              {getInitials(myPair.target.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs text-muted-foreground mb-1">칭찬 대상</p>
            <p className="font-bold text-xl">{myPair.target.name}</p>
            {myPair.target.bio && <p className="text-sm text-muted-foreground">{myPair.target.bio}</p>}
          </div>
          <Badge className="ml-auto">익명 전달</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>칭찬 작성</CardTitle>
          <CardDescription>
            {myPair.target.name}님에게 전하고 싶은 칭찬을 작성해주세요.
            발신자는 스프린트 공개 전까지 알 수 없어요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PraiseForm targetName={myPair.target.name} />
        </CardContent>
      </Card>
    </div>
  )
}
