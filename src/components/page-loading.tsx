'use client'

import { useRef } from 'react'
import { LOADING_QUOTES } from '@/components/api-loading-overlay'

export function PageLoading() {
  const quoteRef = useRef(LOADING_QUOTES[Math.floor(Math.random() * LOADING_QUOTES.length)])

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl px-8 py-7 max-w-xs w-full mx-4 flex flex-col items-center gap-4">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="inline-block w-2.5 h-2.5 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <p className="text-center text-sm font-medium text-gray-700 leading-relaxed">
          {quoteRef.current}
        </p>
      </div>
    </div>
  )
}
