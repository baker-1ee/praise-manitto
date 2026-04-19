'use client'

import { useState } from 'react'
import { Heart, User } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn, getInitials } from '@/lib/utils'

interface ManitoTarget {
  name: string | null
  bio: string | null
  avatarUrl: string | null
}

interface ManitoCardProps {
  target: ManitoTarget | null
  sprintName: string
}

export function ManitoCard({ target, sprintName }: ManitoCardProps) {
  const [flipped, setFlipped] = useState(false)

  if (!target) {
    return (
      <div className="flex flex-col items-center justify-center h-36 rounded-xl border-2 border-dashed text-muted-foreground gap-3">
        <User className="h-12 w-12 opacity-30" />
        <p className="text-sm">아직 마니또가 배정되지 않았어요</p>
      </div>
    )
  }

  return (
    <div
      className="perspective-1000 cursor-pointer w-full max-w-sm mx-auto"
      onClick={() => setFlipped((f) => !f)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && setFlipped((f) => !f)}
    >
      <div
        className={cn(
          'relative h-36 transform-style-3d transition-transform duration-700',
          flipped && 'rotate-y-180',
        )}
      >
        {/* 앞면 */}
        <div className="absolute inset-0 backface-hidden rounded-xl border-2 border-primary/30 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center gap-5 px-6">
          <div className="relative shrink-0">
            <Heart className="h-12 w-12 text-primary/20" />
            <span className="absolute inset-0 flex items-center justify-center text-xl">🎁</span>
          </div>
          <div>
            <Badge variant="secondary" className="mb-1.5">{sprintName}</Badge>
            <p className="font-semibold">마니또가 배정되었어요!</p>
            <p className="text-sm text-muted-foreground mt-0.5">탭해서 확인하세요</p>
          </div>
        </div>

        {/* 뒷면 */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-xl border-2 border-primary bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center gap-5 px-6">
          <Avatar className="h-12 w-12 shrink-0 border-4 border-primary/30">
            {target.avatarUrl && <AvatarImage src={target.avatarUrl} />}
            <AvatarFallback className="text-lg bg-primary/10 text-primary">
              {getInitials(target.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">이번 스프린트 마니또 대상</p>
            <p className="font-bold text-xl text-primary">{target.name}</p>
            {target.bio && <p className="text-sm text-muted-foreground mt-1">{target.bio}</p>}
            <Badge className="mt-2">나만 알 수 있어요 🤫</Badge>
          </div>
        </div>
      </div>
    </div>
  )
}
