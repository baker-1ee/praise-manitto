'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

export const LOADING_QUOTES = [
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
  '칭찬은 사람을 춤추게 하고 팀을 날게 한다 🦋',
  '말 한마디로 천냥 빚을 갚는다 💬',
  '인정받은 사람이 더 멀리 간다 🏃',
  '따뜻한 말 한마디, 오늘의 에너지가 됩니다 ☀️',
  '칭찬은 최고의 동기부여입니다 🎯',
  '서로 응원하는 팀이 가장 강하다 🤝',
  '좋은 팀원이 좋은 팀을 만든다 🏆',
  '당신의 노력을 누군가는 보고 있어요 👀',
  '칭찬은 나눌수록 커집니다 🎁',
  '오늘 보낸 칭찬이 내일의 힘이 됩니다 💫',
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
  const quoteRef = useRef(LOADING_QUOTES[Math.floor(Math.random() * LOADING_QUOTES.length)])

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
