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

const bottomMainNavItems = [
  { href: '/', label: '홈', icon: Home, exact: true },
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

  const allBottomNavItems = [
    ...bottomMainNavItems,
    ...(session?.user.role === 'LEADER' ? adminNavItems : []),
    ...(session?.user.role === 'ADMIN' ? adminNavItems : []),
  ]

  return (
    <>
      {/* Top header */}
      <header className="sticky top-0 z-40 border-b border-[rgba(160,100,80,0.15)] bg-background">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 max-w-5xl">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="h-5 w-5 fill-[#c27b8c] text-[#c27b8c]" />
            <span className="text-sm font-semibold text-foreground">칭찬 마니또</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {allNavItems.map(({ href, label, icon: Icon, exact }) => {
              const active = isActive(href, exact)
              return (
                <Link key={href} href={href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'gap-2 text-[#7a6050] font-medium',
                      active && 'text-[#c27b8c] bg-[rgba(194,123,140,0.08)]',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Button>
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs bg-[#fdf0f2] text-[#c27b8c] font-semibold">
                {getInitials(session?.user.name)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:block text-sm font-medium text-foreground">{session?.user.name}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[#615d59]"
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-[rgba(160,100,80,0.15)]" style={{ willChange: 'transform', transform: 'translateZ(0)' }}>
        <div className="flex items-stretch justify-around h-16">
          {allBottomNavItems.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors',
                  active ? 'text-[#c27b8c]' : 'text-[#b09880] hover:text-[#7a6050]',
                )}
              >
                <Icon className={cn('h-5 w-5', active && 'stroke-[2.5px]')} />
                <span className="text-[10px] font-semibold leading-tight">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
