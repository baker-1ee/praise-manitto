'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const schema = z
  .object({
    newPassword: z.string().min(1, '비밀번호를 입력해주세요'),
    confirm: z.string().min(1, '비밀번호를 한 번 더 입력해주세요'),
  })
  .refine((d) => d.newPassword === d.confirm, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['confirm'],
  })
type FormData = z.infer<typeof schema>

export default function ChangePasswordPage() {
  const router = useRouter()
  const { update } = useSession()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: data.newPassword }),
      })
      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error)
      }
      await update({ mustChangePassword: false })
      router.push('/')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex justify-center pt-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <KeyRound className="h-8 w-8 text-orange-500" />
          </div>
          <CardTitle>비밀번호 변경</CardTitle>
          <CardDescription>관리자가 임시 비밀번호(0000)로 초기화했습니다. 새 비밀번호를 설정해주세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">새 비밀번호</Label>
              <Input id="newPassword" type="password" placeholder="새 비밀번호 입력" {...register('newPassword')} />
              {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">비밀번호 확인</Label>
              <Input id="confirm" type="password" placeholder="비밀번호 재입력" {...register('confirm')} />
              {errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              비밀번호 변경
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
