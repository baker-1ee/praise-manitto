'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Send, MessageSquare } from 'lucide-react'
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

      toast({ title: '편지를 보냈어요! 💌', description: `${targetName}님에게 익명으로 전달됩니다.` })
      reset()
      onSuccess?.()
      router.push('/praises/sent')
    } catch (e) {
      toast({ variant: 'destructive', title: '오류', description: (e as Error).message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      {/* 편지지 */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(150deg, #fffef7 0%, #fdf8ec 100%)',
          border: '1px solid #ddd0b0',
          boxShadow: '0 4px 20px rgba(120,95,50,0.10), 0 1px 0 rgba(255,255,255,0.85) inset',
        }}
      >
        {/* 편지 헤더 — 수신인 */}
        <div
          className="px-6 pt-5 pb-4"
          style={{ borderBottom: '1.5px dashed #ddd0b0' }}
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11 shrink-0 ring-2 ring-[#e8d9b8] ring-offset-1">
              {targetAvatarUrl && <AvatarImage src={targetAvatarUrl} />}
              <AvatarFallback className="bg-[#f5ecd8] text-[#8a6a30] font-semibold text-base">
                {getInitials(targetName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-medium"
                style={{ color: '#b89c6a', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
              >
                To.
              </p>
              <p
                className="text-xl font-bold leading-tight"
                style={{ color: '#3d2b10', fontFamily: 'Georgia, serif' }}
              >
                {targetName}님에게
              </p>
              {targetBio && (
                <p className="text-xs mt-0.5 truncate" style={{ color: '#a08050' }}>
                  {targetBio}
                </p>
              )}
            </div>
            <span className="text-3xl select-none">💌</span>
          </div>
        </div>

        {/* 편지 본문 — 줄노트 textarea */}
        <div className="px-6 py-1">
          <textarea
            {...register('content')}
            placeholder={`${targetName ?? '마니또 대상'}님의 좋은 점을\n솔직하게 전해보세요...\n\n진심 어린 칭찬이 큰 힘이 됩니다 💛`}
            style={{
              width: '100%',
              minHeight: '210px',
              backgroundColor: 'transparent',
              backgroundImage:
                'repeating-linear-gradient(to bottom, transparent 0px, transparent 27px, rgba(180,155,100,0.22) 27px, rgba(180,155,100,0.22) 28px)',
              backgroundAttachment: 'local',
              backgroundPositionY: '10px',
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontFamily: 'Georgia, "Nanum Myeongjo", "Malgun Gothic", serif',
              fontSize: '14.5px',
              lineHeight: '28px',
              color: '#2d1e08',
              paddingTop: '10px',
              paddingBottom: '8px',
            }}
          />
        </div>

        {/* 편지 푸터 — 발신인 */}
        <div
          className="px-6 pt-3 pb-5"
          style={{ borderTop: '1.5px dashed #ddd0b0' }}
        >
          <div className="flex items-end justify-between">
            <p
              className="text-sm"
              style={{ color: '#b89c6a', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            >
              — 익명의 마니또로부터 ♥
            </p>
            <div className="text-right">
              <span
                className={cn(
                  'text-xs font-medium tabular-nums',
                  contentLength > 500 ? 'text-red-500' : contentLength >= 10 ? 'text-[#7a9e60]' : 'text-[#b8a888]',
                )}
              >
                {contentLength} / 500
              </span>
              {errors.content && (
                <p className="text-xs text-red-500 mt-0.5">{errors.content.message}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 도장 느낌의 익명 배지 */}
      <div className="flex justify-center">
        <span
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
          style={{
            color: '#a08050',
            background: 'rgba(200,170,100,0.12)',
            border: '1px dashed #c8a864',
          }}
        >
          🔒 발신자는 스프린트 공개 전까지 알 수 없어요
        </span>
      </div>

      {/* 전송 버튼 */}
      <Button
        type="submit"
        className="w-full gap-2 h-12 text-base font-semibold rounded-xl"
        style={{
          background: 'linear-gradient(135deg, #0075de 0%, #005bb5 100%)',
          boxShadow: '0 4px 12px rgba(0,117,222,0.30)',
        }}
        disabled={isSubmitting}
      >
        <Send className="h-4 w-4" />
        {isSubmitting ? '편지 보내는 중...' : '편지 봉투에 넣어 보내기'}
      </Button>

      <Button
        type="button"
        variant="ghost"
        className="w-full gap-2 text-[#a39e98]"
        onClick={() => router.push('/praises/sent')}
      >
        <MessageSquare className="h-4 w-4" />
        보낸 편지 보기
      </Button>
    </form>
  )
}
