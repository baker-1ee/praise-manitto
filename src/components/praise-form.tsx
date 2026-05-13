'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Send, MessageSquare, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/components/ui/use-toast'
import { cn, getInitials } from '@/lib/utils'

const schema = z.object({
  content: z.string().min(10, '10자 이상 작성해주세요').max(500, '500자 이하로 작성해주세요'),
})

type FormData = z.infer<typeof schema>

interface PraiseFormProps {
  targetName: string | null
  targetBio?: string | null
  targetAvatarUrl?: string | null
  sprintId: string
  onSuccess?: () => void
}

export function PraiseForm({ targetName, targetBio, targetAvatarUrl, sprintId, onSuccess }: PraiseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const contentLength = watch('content')?.length ?? 0

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/praises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: data.content, categories: [], sprintId }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '오류가 발생했습니다')
      }

      toast({ title: '칭찬을 보냈어요!', description: `${targetName}님에게 익명으로 전달됩니다.` })
      reset()
      onSuccess?.()
      router.push(`/praises/sent?sprintId=${sprintId}`)
    } catch (e) {
      toast({ variant: 'destructive', title: '오류', description: (e as Error).message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      {/* 수신인 카드 */}
      <div className="bg-white rounded-2xl border border-[hsl(263_50%_90%)] shadow-[0_4px_18px_rgba(124,58,237,0.04),0_2px_8px_rgba(124,58,237,0.03)]">
        {/* 수신인 */}
        <div className="px-5 pt-5 pb-4 flex items-center gap-3 border-b border-[hsl(263_50%_90%)]">
          <Avatar className="h-11 w-11 shrink-0 ring-2 ring-violet-200 ring-offset-1">
            {targetAvatarUrl && <AvatarImage src={targetAvatarUrl} />}
            <AvatarFallback className="bg-violet-50 text-violet-600 font-semibold text-base">
              {getInitials(targetName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[hsl(265_18%_45%)] tracking-wide uppercase">받는 사람</p>
            <p className="text-lg font-bold tracking-[-0.5px] text-[hsl(267_50%_10%)] leading-tight">
              {targetName}
            </p>
            {targetBio && (
              <p className="text-xs mt-0.5 truncate text-[hsl(265_18%_45%)]">{targetBio}</p>
            )}
          </div>
        </div>

        {/* 내용 입력 */}
        <div className="px-5 py-4">
          <textarea
            {...register('content')}
            placeholder="진심 어린 칭찬을 작성해보세요."
            className="w-full min-h-[120px] resize-none bg-transparent border-none outline-none text-[15px] leading-relaxed text-[hsl(267_50%_10%)] placeholder:text-[#9c95b8]"
          />
        </div>

        {/* 하단 카운터 */}
        <div className="px-5 pb-4 flex items-center justify-end gap-2">
          {errors.content && (
            <p className="text-xs text-red-500 flex-1">{errors.content.message}</p>
          )}
          <span
            className={cn(
              'text-xs font-medium tabular-nums',
              contentLength > 500 ? 'text-red-500' : contentLength >= 10 ? 'text-violet-500' : 'text-[#9c95b8]',
            )}
          >
            {contentLength} / 500
          </span>
        </div>
      </div>

      {/* 익명 배지 */}
      <div className="flex justify-center">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#f0ebff] text-[#7c3aed]">
          <Lock className="h-3 w-3" />
          발신자는 스프린트 공개 전까지 알 수 없어요
        </span>
      </div>

      {/* 전송 버튼 */}
      <Button
        type="submit"
        className="w-full gap-2 h-12 text-base font-semibold rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white"
        style={{ boxShadow: '0 4px 14px rgba(124,58,237,0.30)' }}
        disabled={isSubmitting}
      >
        <Send className="h-4 w-4" />
        {isSubmitting ? '보내는 중...' : '칭찬 보내기'}
      </Button>

      <Button
        type="button"
        variant="ghost"
        className="w-full gap-2 text-[hsl(265_18%_45%)] hover:text-[#7c3aed] hover:bg-[rgba(124,58,237,0.06)]"
        onClick={() => router.push(`/praises/sent?sprintId=${sprintId}`)}
      >
        <MessageSquare className="h-4 w-4" />
        보낸 칭찬 보기
      </Button>
    </form>
  )
}
