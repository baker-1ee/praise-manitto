'use client'

import { useState } from 'react'
import { Gift, User } from 'lucide-react'
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
      <div className="flex flex-col items-center justify-center h-36 rounded-xl border border-[rgba(0,0,0,0.1)] text-[#a39e98] gap-3 bg-[#f6f5f4]">
        <User className="h-10 w-10 opacity-40" />
        <p className="text-sm font-medium">아직 마니또가 배정되지 않았어요</p>
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
        <div className="absolute inset-0 backface-hidden rounded-xl border border-[rgba(0,0,0,0.1)] bg-[#f6f5f4] shadow-notion-card flex items-center gap-5 px-6">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white border border-[rgba(0,0,0,0.1)] shadow-notion-card">
            <Gift className="h-7 w-7 text-[#0075de]" />
          </div>
          <div>
            <Badge variant="secondary" className="mb-2">{sprintName}</Badge>
            <p className="font-semibold text-foreground">마니또가 배정되었어요!</p>
            <p className="text-sm text-[#a39e98] mt-0.5">탭해서 확인하세요</p>
          </div>
        </div>

        {/* 뒷면 */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-xl border border-[#0075de]/30 bg-white shadow-notion-card flex items-center gap-5 px-6">
          <Avatar className="h-12 w-12 shrink-0 border-2 border-[rgba(0,0,0,0.1)]">
            {target.avatarUrl && <AvatarImage src={target.avatarUrl} />}
            <AvatarFallback className="text-base bg-[#f2f9ff] text-[#097fe8] font-semibold">
              {getInitials(target.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs text-[#a39e98] mb-0.5">이번 스프린트 마니또 대상</p>
            <p className="font-bold text-xl text-[#0075de] tracking-[-0.25px]">{target.name}</p>
            {target.bio && <p className="text-sm text-[#615d59] mt-1">{target.bio}</p>}
            <Badge className="mt-2">나만 알 수 있어요 🤫</Badge>
          </div>
        </div>
      </div>
    </div>
  )
}
