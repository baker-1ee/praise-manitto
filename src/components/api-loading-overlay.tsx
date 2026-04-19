'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

const QUOTES = [
  '칭찬은 고래도 춤추게 한다 🐳',
  '오늘의 칭찬 한 마디가 누군가의 하루를 바꿉니다 🌟',
  '작은 칭찬이 큰 용기가 됩니다 💪',
  '당신의 따뜻한 말이 전달되고 있어요 💌',
  '칭찬받은 사람은 더 잘하고 싶어진다 🚀',
  '좋은 말은 메아리가 되어 돌아옵니다 🔄',
  '칭찬은 마음의 비타민입니다 💊',
  '진심은 반드시 전해집니다 ❤️',
  '함께 성장하는 팀을 만들어요 🌱',
  '오늘도 서로를 빛나게 해주세요 ✨',
]

const LoadingContext = createContext({ pending: 0, inc: () => {}, dec: () => {} })

export function useApiLoading() {
  return useContext(LoadingContext)
}

export function ApiLoadingProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState(0)
  const inc = useCallback(() => setPending((n) => n + 1), [])
  const dec = useCallback(() => setPending((n) => Math.max(0, n - 1)), [])

  useEffect(() => {
    const original = window.fetch
    window.fetch = async function (...args) {
      const url = typeof args[0] === 'string' ? args[0] : args[0] instanceof URL ? args[0].href : args[0].url
      const isApi = url.startsWith('/api/') || url.includes('/api/')
      if (isApi) inc()
      try {
        return await original.apply(this, args)
      } finally {
        if (isApi) dec()
      }
    }
    return () => { window.fetch = original }
  }, [inc, dec])

  return (
    <LoadingContext.Provider value={{ pending, inc, dec }}>
      {children}
      {pending > 0 && <LoadingOverlay />}
    </LoadingContext.Provider>
  )
}

function LoadingOverlay() {
  const quoteRef = useRef(QUOTES[Math.floor(Math.random() * QUOTES.length)])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
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
