'use client'

import { useEffect, useState } from 'react'
import { X, Download, Share } from 'lucide-react'
import { Button } from '@/components/ui/button'

function isStandalone() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)
  )
}

function isIOS() {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isKakaoTalkBrowser() {
  if (typeof navigator === 'undefined') return false
  return /KAKAOTALK/i.test(navigator.userAgent)
}

// ─── 카카오톡 인앱브라우저 유도 배너 ──────────────────────────────────────────

export function KakaoBanner() {
  const [show, setShow] = useState(false)
  const [ios, setIos] = useState(false)

  useEffect(() => {
    if (isKakaoTalkBrowser()) {
      setShow(true)
      setIos(isIOS())
    }
  }, [])

  if (!show) return null

  const dismiss = () => setShow(false)

  const openExternalAndroid = () => {
    const url = window.location.href.replace(/^https?:\/\//, '')
    window.location.href = `intent://${url}#Intent;scheme=https;package=com.android.chrome;end`
  }

  const openExternalIOS = () => {
    window.location.href = `x-safari-${window.location.href}`
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4"
      onClick={dismiss}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 mb-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="text-center flex-1 space-y-2">
            <p className="text-2xl">🌐</p>
            <p className="font-bold text-lg">외부 브라우저에서 열어주세요</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              카카오톡 브라우저에서는 자동 로그인이 제한됩니다.
              Safari 또는 Chrome에서 열면 더 편하게 이용할 수 있어요.
            </p>
          </div>
          <button
            onClick={dismiss}
            className="text-muted-foreground hover:text-foreground ml-2 mt-0.5 p-1"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!ios ? (
          <Button className="w-full gap-2" onClick={openExternalAndroid}>
            <Share className="h-4 w-4" />
            Chrome에서 열기
          </Button>
        ) : (
          <>
            <Button className="w-full gap-2" onClick={openExternalIOS}>
              <Share className="h-4 w-4" />
              Safari에서 열기
            </Button>
            <Button variant="outline" className="w-full" onClick={dismiss}>
              닫고 계속 이용하기
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── PWA 설치 유도 팝업 ────────────────────────────────────────────────────────

const PWA_DISMISSED_KEY = 'pwa_install_dismissed_at'
const DISMISS_TTL_MS = 14 * 24 * 60 * 60 * 1000 // 14일

function hasDismissedRecently(): boolean {
  try {
    const ts = localStorage.getItem(PWA_DISMISSED_KEY)
    if (!ts) return false
    return Date.now() - parseInt(ts) < DISMISS_TTL_MS
  } catch {
    return false
  }
}

function saveDismiss() {
  try {
    localStorage.setItem(PWA_DISMISSED_KEY, Date.now().toString())
  } catch {}
}

type PromptType = 'android' | 'ios' | null

export function PwaInstallPrompt() {
  const [promptType, setPromptType] = useState<PromptType>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    // PWA로 이미 실행 중이거나 카카오톡 브라우저면 스킵
    if (isStandalone() || isKakaoTalkBrowser()) return
    // 최근 14일 내에 닫은 적 있으면 스킵
    if (hasDismissedRecently()) return

    if (isIOS()) {
      setPromptType('ios')
      return
    }

    // Android/Chrome: beforeinstallprompt 이벤트 대기
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setPromptType('android')
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const dismiss = () => {
    saveDismiss()
    setPromptType(null)
  }

  const installAndroid = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    saveDismiss()
    setPromptType(null)
  }

  if (!promptType) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 flex justify-center p-4 pointer-events-none">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 pointer-events-auto border border-border">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon-192x192.png" alt="앱 아이콘" className="w-12 h-12 rounded-xl shadow-sm" />
            <div>
              <p className="font-semibold text-sm">칭찬 마니또</p>
              <p className="text-xs text-muted-foreground">manitto.jinung.com</p>
            </div>
          </div>
          <button onClick={dismiss} className="text-muted-foreground hover:text-foreground mt-0.5">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          홈 화면에 추가하면 앱처럼 빠르게 실행할 수 있어요!
        </p>

        {promptType === 'android' && (
          <Button size="sm" className="w-full mt-3 gap-2" onClick={installAndroid}>
            <Download className="h-4 w-4" />
            홈 화면에 추가
          </Button>
        )}

        {promptType === 'ios' && (
          <div className="mt-3 space-y-2">
            <div className="rounded-xl bg-muted/60 p-4 space-y-3 text-sm">
              <p className="font-medium text-center">홈 화면에 추가하는 방법</p>
              <ol className="space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-bold">1</span>
                  <span>하단 <Share className="inline h-3.5 w-3.5 text-blue-500 mx-0.5" /> 공유 버튼을 탭하세요</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-bold">2</span>
                  <span><span className="font-medium text-foreground">홈 화면에 추가</span>를 선택하세요</span>
                </li>
              </ol>
            </div>
            <Button size="sm" variant="outline" className="w-full" onClick={dismiss}>
              닫기
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
