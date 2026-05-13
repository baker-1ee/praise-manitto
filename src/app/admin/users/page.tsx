import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Mail } from 'lucide-react'
import { getInitials } from '@/lib/utils'

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  const users = await prisma.user.findMany({
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, email: true, role: true, bio: true },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-heading">팀원 관리</h1>
        <p className="text-muted-foreground mt-1">총 {users.length}명</p>
      </div>

      <div className="grid gap-3">
        {users.map((user) => (
          <Card key={user.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="pt-4 pb-4 flex items-center gap-4">
              <Avatar>
                <AvatarFallback className="bg-[#FEF0EA] text-primary">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{user.name}</span>
                  {user.role === 'ADMIN' && <Badge className="text-xs">관리자</Badge>}
                </div>
                {user.email ? (
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Mail className="h-3 w-3 shrink-0" />
                    {user.email}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground/60 mt-0.5">이메일 미등록</p>
                )}
                {user.bio && <p className="text-xs text-muted-foreground mt-0.5">{user.bio}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
