'use client'

import { useState, useRef } from 'react'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'

export interface PraiseCardData {
  id: string
  content: string
  headerLabel: string
  headerName: string
  footerLeftText: string
  footerRightText: string
  footerBadge?: string
}

export function PraiseSwipeViewer({ cards }: { cards: PraiseCardData[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [slideDir, setSlideDir] = useState<'left' | 'right'>('left')
  const touchStartX = useRef(0)

  const navigate = (newIndex: number, dir: 'left' | 'right') => {
    setSlideDir(dir)
    setCurrentIndex(newIndex)
  }

  const goPrev = () => {
    if (currentIndex > 0) navigate(currentIndex - 1, 'right')
  }

  const goNext = () => {
    if (currentIndex < cards.length - 1) navigate(currentIndex + 1, 'left')
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (diff > 50) goNext()
    else if (diff < -50) goPrev()
  }

  if (cards.length === 0) return null

  const card = cards[currentIndex]
  const animClass = slideDir === 'left' ? 'animate-slide-in' : 'animate-slide-in-from-left'

  return (
    <div className="overflow-hidden">
      {/* 도트 인디케이터 */}
      {cards.length > 1 && (
        <div className="flex justify-center items-center gap-1.5 mb-4">
          {cards.map((_, i) => (
            <button
              key={i}
              onClick={() => navigate(i, i > currentIndex ? 'left' : 'right')}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentIndex ? 'w-6 bg-[#7c3aed]' : 'w-1.5 bg-[hsl(263_50%_90%)] hover:bg-violet-300'
              }`}
            />
          ))}
        </div>
      )}

      {/* 칭찬 카드 */}
      <div
        key={currentIndex}
        className={`bg-white rounded-2xl border border-[hsl(263_50%_90%)] shadow-[0_4px_18px_rgba(124,58,237,0.04),0_2px_8px_rgba(124,58,237,0.03)] overflow-hidden ${animClass}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* 카드 헤더 */}
        <div className="px-5 pt-5 pb-4 border-b border-[hsl(263_50%_90%)] flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[hsl(265_18%_45%)] tracking-wide uppercase">
              {card.headerLabel}
            </p>
            <p className="text-lg font-bold tracking-[-0.5px] text-[hsl(267_50%_10%)] leading-tight">
              {card.headerName}
            </p>
          </div>
          <div className="h-9 w-9 rounded-full bg-[#f0ebff] flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-[#7c3aed]" />
          </div>
        </div>

        {/* 카드 본문 */}
        <div className="px-5 py-5">
          <p
            className="text-[15px] leading-relaxed text-[hsl(267_50%_10%)] whitespace-pre-wrap"
            style={{ minHeight: '80px' }}
          >
            {card.content}
          </p>
        </div>

        {/* 카드 푸터 */}
        <div className="px-5 pb-5 flex items-center justify-between">
          <p className="text-xs text-[hsl(265_18%_45%)]">{card.footerLeftText}</p>
          <div className="flex items-center gap-2">
            {card.footerRightText && (
              <span className="text-xs text-[hsl(265_18%_45%)]">{card.footerRightText}</span>
            )}
            {card.footerBadge && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#f0ebff] text-[#7c3aed]">
                {card.footerBadge}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 이전 / 다음 네비게이션 */}
      {cards.length > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-[hsl(265_18%_45%)] disabled:opacity-30 hover:bg-[rgba(124,58,237,0.06)] hover:text-[#7c3aed] transition-all active:opacity-60"
          >
            <ChevronLeft className="h-4 w-4" />
            이전
          </button>
          <span className="text-sm font-medium text-[hsl(265_18%_45%)]">
            {currentIndex + 1} / {cards.length}
          </span>
          <button
            onClick={goNext}
            disabled={currentIndex === cards.length - 1}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-[hsl(265_18%_45%)] disabled:opacity-30 hover:bg-[rgba(124,58,237,0.06)] hover:text-[#7c3aed] transition-all active:opacity-60"
          >
            다음
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
