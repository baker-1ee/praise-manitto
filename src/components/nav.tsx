'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { Heart, Home, Send, Inbox, Settings, LogOut, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn, getInitials } from '@/lib/utils'

const navItems = [
  { href: '/', label: '홈', icon: Home },
  { href: '/praise/write', label: '칭찬 쓰기', icon: Send },
  { href: '/praises/received', label: '받은 칭찬', icon: Inbox },
]

export function Nav() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-primary">
          <Heart className="h-5 w-5 fill-primary" />
          <span>칭찬 마니또</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <Button
                variant="ghost"
                size="sm"
                className={cn('gap-2', pathname === href && 'bg-accent text-accent-foreground')}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            </Link>
          ))}
          {session?.user.role === 'ADMIN' && (
            <>
              <Link href="/admin/teams">
                <Button variant="ghost" size="sm" className={cn('gap-2', pathname.startsWith('/admin/teams') && 'bg-accent text-accent-foreground')}>
                  <Users className="h-4 w-4" />
                  팀 관리
                </Button>
              </Link>
              <Link href="/admin/sprints">
                <Button variant="ghost" size="sm" className={cn('gap-2', pathname.startsWith('/admin/sprints') && 'bg-accent text-accent-foreground')}>
                  <Settings className="h-4 w-4" />
                  스프린트
                </Button>
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{getInitials(session?.user.name)}</AvatarFallback>
          </Avatar>
          <span className="hidden sm:block text-sm text-muted-foreground">{session?.user.name}</span>
          <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: '/login' })}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
