'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Send, MessageSquare } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

const schema = z.object({
  content: z.string().min(10, '10자 이상 작성해주세요').max(500, '500자 이하로 작성해주세요'),
})

type FormData = z.infer<typeof schema>

interface PraiseFormProps {
  targetName: string | null
  onSuccess?: () => void
}

export function PraiseForm({ targetName, onSuccess }: PraiseFormProps) {
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
        body: JSON.stringify({ content: data.content, categories: [] }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '오류가 발생했습니다')
      }

      toast({ title: '칭찬을 보냈어요! 💌', description: `${targetName}님에게 익명으로 전달됩니다.` })
      reset()
      onSuccess?.()
    } catch (e) {
      toast({ variant: 'destructive', title: '오류', description: (e as Error).message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="content">
          칭찬 내용 <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="content"
          {...register('content')}
          placeholder={`${targetName ?? '마니또 대상'}님에게 전하고 싶은 칭찬을 적어주세요.\n익명으로 전달됩니다. 😊`}
          className="min-h-[120px] resize-none"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          {errors.content ? (
            <span className="text-destructive">{errors.content.message}</span>
          ) : (
            <span>최소 10자, 최대 500자</span>
          )}
          <span className={cn(contentLength > 500 && 'text-destructive')}>{contentLength} / 500</span>
        </div>
      </div>

      <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
        <Send className="h-4 w-4" />
        {isSubmitting ? '전송 중...' : '익명으로 칭찬 보내기'}
      </Button>

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        onClick={() => router.push('/praises/sent')}
      >
        <MessageSquare className="h-4 w-4" />
        보낸 칭찬 보기
      </Button>
    </form>
  )
}
