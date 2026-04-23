'use client'

import { Suspense, useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Heart, Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'

const AUTO_LOGIN_KEY = 'manitto_autologin'

const schema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
})
type FormData = z.infer<typeof schema>

function isKakaoTalkBrowser() {
  if (typeof navigator === 'undefined') return false
  return /KAKAOTALK/i.test(navigator.userAgent)
}

function isAndroid() {
  if (typeof navigator === 'undefined') return false
  return /android/i.test(navigator.userAgent)
}

function KakaoBanner() {
  const currentUrl = typeof window !== 'undefined' ? window.location.href : ''

  const openExternal = () => {
    if (isAndroid()) {
      // Android: intent scheme으로 Chrome에서 열기
      const intentUrl = `intent://${currentUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`
      window.location.href = intentUrl
    }
    // iOS는 직접 열기 불가 — 안내 텍스트로 대신함
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 mb-4">
        <div className="text-center space-y-2">
          <p className="text-2xl">🌐</p>
          <p className="font-bold text-lg">외부 브라우저에서 열어주세요</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            카카오톡 브라우저에서는 자동 로그인이 제한됩니다.
            Safari 또는 Chrome에서 열면 더 편하게 이용할 수 있어요.
          </p>
        </div>

        {isAndroid() ? (
          <Button className="w-full gap-2" onClick={openExternal}>
            <ExternalLink className="h-4 w-4" />
            Chrome에서 열기
          </Button>
        ) : (
          <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm text-center">
            <p className="font-medium">iPhone 사용자</p>
            <p className="text-muted-foreground">
              하단 <span className="font-semibold">···</span> 메뉴 → <span className="font-semibold">기본 브라우저로 열기</span>를 탭해주세요
            </p>
          </div>
        )}

      </div>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>
}

function LoginForm() {
  const searchParams = useSearchParams()
  const prefillName = searchParams.get('name') ?? ''
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [autoLogin, setAutoLogin] = useState(true)
  const [showKakaoBanner, setShowKakaoBanner] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: prefillName },
  })

  useEffect(() => {
    if (isKakaoTalkBrowser()) {
      setShowKakaoBanner(true)
      return
    }

    // prefillName보다 자동로그인 먼저 시도
    const saved = localStorage.getItem(AUTO_LOGIN_KEY)
    if (saved) {
      try {
        const { name, password } = JSON.parse(saved)
        setLoading(true)
        signIn('credentials', { name, password, redirect: false }).then((result) => {
          if (result?.error) {
            localStorage.removeItem(AUTO_LOGIN_KEY)
            setLoading(false)
            if (prefillName) setValue('name', prefillName)
          } else {
            window.location.href = '/'
          }
        })
        return
      } catch {
        localStorage.removeItem(AUTO_LOGIN_KEY)
      }
    }

    if (prefillName) setValue('name', prefillName)
  }, [])

  useEffect(() => {
    if (prefillName) setValue('name', prefillName)
  }, [prefillName, setValue])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError('')
    const result = await signIn('credentials', {
      name: data.name,
      password: data.password,
      redirect: false,
    })
    setLoading(false)
    if (result?.error) {
      setError('이름 또는 비밀번호가 올바르지 않습니다.')
    } else {
      if (autoLogin) {
        localStorage.setItem(AUTO_LOGIN_KEY, JSON.stringify({ name: data.name, password: data.password }))
      } else {
        localStorage.removeItem(AUTO_LOGIN_KEY)
      }
      window.location.href = '/'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {showKakaoBanner && <KakaoBanner />}

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-card border border-[rgba(160,100,80,0.15)] shadow-notion-card">
              <Heart className="h-6 w-6 fill-[#c27b8c] text-[#c27b8c]" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-[-0.625px] text-foreground">칭찬 마니또</h1>
          <p className="text-sm text-[#615d59] mt-1.5">팀원에게 익명으로 칭찬을 전해보세요 💌</p>
        </div>

        <Card className="shadow-notion-deep">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">이름</Label>
                <Input id="name" type="text" {...register('name')} disabled={loading} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">비밀번호</Label>
                <Input id="password" type="password" {...register('password')} disabled={loading} />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="autoLogin"
                  checked={autoLogin}
                  onCheckedChange={(v) => setAutoLogin(!!v)}
                  disabled={loading}
                />
                <Label htmlFor="autoLogin" className="text-sm font-normal cursor-pointer text-[#615d59]">
                  다음부터 자동으로 로그인하기
                </Label>
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? '로그인 중...' : '로그인'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
