'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { Heart, Home, Send, Inbox, Settings, LogOut, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn, getInitials } from '@/lib/utils'

const mainNavItems = [
  { href: '/', label: '홈', icon: Home, exact: true },
  { href: '/praise/write', label: '칭찬 쓰기', icon: Send, exact: true },
  { href: '/praises/received', label: '받은 칭찬', icon: Inbox, exact: false },
]

const adminNavItems = [
  { href: '/admin/teams', label: '팀 관리', icon: Users, exact: false },
  { href: '/admin/sprints', label: '스프린트', icon: Settings, exact: false },
]

export function Nav() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  const allNavItems = [
    ...mainNavItems,
    ...(session?.user.role === 'LEADER' ? adminNavItems : []),
    ...(session?.user.role === 'ADMIN' ? adminNavItems : []),
  ]

  return (
    <>
      {/* Top header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 max-w-5xl">
          <Link href="/" className="flex items-center gap-2 font-bold text-primary">
            <Heart className="h-5 w-5 fill-primary" />
            <span className="text-sm">칭찬 마니또</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {allNavItems.map(({ href, label, icon: Icon, exact }) => (
              <Link key={href} href={href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn('gap-2', isActive(href, exact) && 'bg-accent text-accent-foreground')}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {getInitials(session?.user.name)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:block text-sm font-medium">{session?.user.name}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                localStorage.removeItem('manitto_autologin')
                signOut({ callbackUrl: '/login' })
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t safe-area-pb">
        <div className="flex items-stretch justify-around h-16">
          {allNavItems.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className={cn('h-5 w-5', active && 'stroke-[2.5px]')} />
                <span className="text-[10px] font-medium leading-tight">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
