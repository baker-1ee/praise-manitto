'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn } from 'next-auth/react'
import { Heart, Loader2, CheckCircle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'

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
      window.location.href = `intent://${currentUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`
    }
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
              하단 <span className="font-semibold">···</span> 메뉴 →{' '}
              <span className="font-semibold">기본 브라우저로 열기</span>를 탭해주세요
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

const schema = z.object({
  password: z.string().min(1, '비밀번호를 입력해주세요'),
})
type FormData = z.infer<typeof schema>

type Step = 'loading' | 'form' | 'done' | 'error'

const AUTO_LOGIN_KEY = 'manitto_autologin'

export function RegisterFormWrapper() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}

function RegisterForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') ?? ''

  const [step, setStep] = useState<Step>('loading')
  const [userInfo, setUserInfo] = useState<{ name: string } | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showKakaoBanner, setShowKakaoBanner] = useState(false)
  const [autoLogin, setAutoLogin] = useState(true)

  const slackInviteUrl = process.env.NEXT_PUBLIC_SLACK_INVITE_URL

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (isKakaoTalkBrowser()) { setShowKakaoBanner(true); return }
    if (!token) { setErrorMsg('초대링크가 올바르지 않습니다'); setStep('error'); return }

    fetch(`/api/invite/validate?token=${token}`)
      .then(async (r) => {
        if (r.status === 409 || r.status === 410) {
          const d = await r.json()
          const query = d.name ? `?name=${encodeURIComponent(d.name)}` : ''
          router.replace(`/login${query}`)
          return null
        }
        return r.json()
      })
      .then((d) => {
        if (!d) return
        if (d.error) { setErrorMsg(d.error); setStep('error') }
        else { setUserInfo(d); setStep('form') }
      })
      .catch(() => { setErrorMsg('오류가 발생했습니다'); setStep('error') })
  }, [token])

  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: data.password }),
      })
      const result = await res.json()
      if (!res.ok) {
        setErrorMsg(result.error)
        setStep('error')
        return
      }

      if (autoLogin) {
        localStorage.setItem(AUTO_LOGIN_KEY, JSON.stringify({ name: result.name, password: data.password }))
      } else {
        localStorage.removeItem(AUTO_LOGIN_KEY)
      }

      await signIn('credentials', {
        name: result.name,
        password: data.password,
        redirect: false,
      })

      setStep('done')
    } catch (e) {
      setErrorMsg((e as Error).message)
      setStep('error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {showKakaoBanner && <KakaoBanner />}
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-3">
          <div className="flex justify-center">
            <Heart className="h-8 w-8 fill-primary text-primary" />
          </div>
          <CardTitle className="text-2xl">칭찬 마니또</CardTitle>
        </CardHeader>

        <CardContent>
          {step === 'loading' && (
            <div className="flex flex-col items-center py-8 gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm">초대링크 확인 중...</p>
            </div>
          )}

          {step === 'error' && (
            <div className="text-center py-8 space-y-3">
              <p className="text-4xl">😢</p>
              <p className="font-semibold text-destructive">{errorMsg}</p>
              <p className="text-sm text-muted-foreground">초대링크가 만료되었거나 이미 사용되었습니다.<br />관리자에게 새 링크를 요청해주세요.</p>
            </div>
          )}

          {step === 'form' && userInfo && (
            <div className="space-y-6">
              <div className="rounded-lg bg-muted/50 p-4 space-y-1">
                <p className="text-xs text-muted-foreground">가입 계정</p>
                <p className="font-bold text-lg">{userInfo.name}</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">비밀번호 설정 <span className="text-destructive">*</span></Label>
                  <Input id="password" type="password" placeholder="사용할 비밀번호" {...register('password')} />
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Checkbox
                    id="autoLogin"
                    checked={autoLogin}
                    onCheckedChange={(v) => setAutoLogin(!!v)}
                  />
                  <Label htmlFor="autoLogin" className="text-sm font-normal cursor-pointer text-muted-foreground">
                    다음부터 자동으로 로그인하기
                  </Label>
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  가입 완료
                </Button>
              </form>
            </div>
          )}

          {step === 'done' && (
            <div className="text-center space-y-5 py-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <div className="space-y-1">
                <p className="text-xl font-bold">가입 완료! 🎉</p>
                <p className="text-sm text-muted-foreground">
                  {userInfo?.name}님, 환영합니다!
                </p>
              </div>

              <Button className="w-full" onClick={() => router.push('/')}>
                바로 시작하기 →
              </Button>

              {slackInviteUrl && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
                  <p className="text-sm font-medium text-blue-800">
                    💬 칭찬 알림 받으려면
                  </p>
                  <Button asChild className="w-full bg-[#4A154B] hover:bg-[#3d1040] text-white">
                    <a href={slackInviteUrl} target="_blank" rel="noopener noreferrer" className="gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Slack 워크스페이스 입장하기
                    </a>
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
