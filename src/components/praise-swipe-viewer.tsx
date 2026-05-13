'use client'

import { useState, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

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
                i === currentIndex ? 'w-6 bg-[#c27b8c]' : 'w-1.5 bg-[#ddd0b0] hover:bg-[#b89c6a]'
              }`}
            />
          ))}
        </div>
      )}

      {/* 편지 카드 */}
      <div
        key={currentIndex}
        className={`rounded-2xl overflow-hidden ${animClass}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          background: 'linear-gradient(150deg, #fffef7 0%, #fdf8ec 100%)',
          border: '1px solid #ddd0b0',
          boxShadow: '0 4px 20px rgba(120,95,50,0.10), 0 1px 0 rgba(255,255,255,0.85) inset',
        }}
      >
        {/* 편지 헤더 */}
        <div className="px-6 pt-5 pb-4" style={{ borderBottom: '1.5px dashed #ddd0b0' }}>
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-xs font-medium"
                style={{ color: '#b89c6a', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
              >
                {card.headerLabel}
              </p>
              <p
                className="text-xl font-bold leading-tight"
                style={{ color: '#3d2b10', fontFamily: 'Georgia, serif' }}
              >
                {card.headerName}
              </p>
            </div>
            <span className="text-2xl select-none">💌</span>
          </div>
        </div>

        {/* 편지 본문 — 줄노트 스타일 */}
        <div className="px-6 py-1">
          <p
            style={{
              width: '100%',
              minHeight: '112px',
              backgroundImage:
                'repeating-linear-gradient(to bottom, transparent 0px, transparent 27px, rgba(180,155,100,0.22) 27px, rgba(180,155,100,0.22) 28px)',
              backgroundPositionY: '10px',
              fontFamily: 'Georgia, "Nanum Myeongjo", "Malgun Gothic", serif',
              fontSize: '14.5px',
              lineHeight: '28px',
              color: '#2d1e08',
              paddingTop: '10px',
              paddingBottom: '8px',
              whiteSpace: 'pre-wrap',
              display: 'block',
            }}
          >
            {card.content}
          </p>
        </div>

        {/* 편지 푸터 */}
        <div className="px-6 pt-3 pb-5" style={{ borderTop: '1.5px dashed #ddd0b0' }}>
          <div className="flex items-center justify-between">
            <p
              className="text-sm"
              style={{ color: '#b89c6a', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            >
              {card.footerLeftText}
            </p>
            <div className="flex items-center gap-2">
              {card.footerRightText && (
                <span
                  className="text-xs"
                  style={{ color: '#b89c6a', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                >
                  {card.footerRightText}
                </span>
              )}
              {card.footerBadge && (
                <span
                  className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                  style={{
                    color: '#a08050',
                    background: 'rgba(200,170,100,0.12)',
                    border: '1px dashed #c8a864',
                  }}
                >
                  {card.footerBadge}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 이전 / 다음 네비게이션 */}
      {cards.length > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm disabled:opacity-30 transition-opacity active:opacity-60"
            style={{ color: '#b89c6a', fontFamily: 'Georgia, serif' }}
          >
            <ChevronLeft className="h-4 w-4" />
            이전
          </button>
          <span
            className="text-sm"
            style={{ color: '#b89c6a', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            {currentIndex + 1} / {cards.length}
          </span>
          <button
            onClick={goNext}
            disabled={currentIndex === cards.length - 1}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm disabled:opacity-30 transition-opacity active:opacity-60"
            style={{ color: '#b89c6a', fontFamily: 'Georgia, serif' }}
          >
            다음
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
