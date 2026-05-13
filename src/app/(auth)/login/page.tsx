'use client'

import { Suspense, useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Heart, Loader2 } from 'lucide-react'
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

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>
}

function LoginForm() {
  const searchParams = useSearchParams()
  const prefillName = searchParams.get('name') ?? ''
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [autoLogin, setAutoLogin] = useState(true)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: prefillName },
  })

  useEffect(() => {
    if (isKakaoTalkBrowser()) return

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-card">
              <Heart className="h-6 w-6 text-white fill-white" />
            </div>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-heading text-foreground">칭찬 마니또</h1>
          <p className="text-sm text-muted-foreground mt-2">팀원에게 익명으로 칭찬을 전해보세요 💌</p>
        </div>

        <Card className="shadow-deep border-[rgba(28,26,23,0.15)]">
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
                <Label htmlFor="autoLogin" className="text-sm font-normal cursor-pointer text-muted-foreground">
                  다음부터 자동으로 로그인하기
                </Label>
              </div>

              {error && (
                <div className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full h-11" disabled={loading}>
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
