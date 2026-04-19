'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Plus, Eye, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { formatDate } from '@/lib/utils'

const STATUS_LABEL: Record<string, string> = {
  PENDING: '대기 중',
  ACTIVE: '진행 중',
  REVEALED: '공개됨',
  CLOSED: '종료',
}
const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  PENDING: 'secondary',
  ACTIVE: 'default',
  REVEALED: 'outline',
  CLOSED: 'outline',
}

const schema = z.object({
  name: z.string().min(1, '스프린트 이름을 입력해주세요'),
  startDate: z.string().min(1, '시작일을 선택해주세요'),
  endDate: z.string().min(1, '종료일을 선택해주세요'),
})
type FormData = z.infer<typeof schema>

interface Sprint {
  id: string
  name: string
  startDate: string
  endDate: string
  status: string
  _count: { pairs: number; praises: number }
}

export default function AdminSprintsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [revealing, setRevealing] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const load = async () => {
    const res = await fetch('/api/admin/sprints')
    const data = await res.json()
    setSprints(data)
  }

  useEffect(() => { load() }, [])

  const onCreate = async (data: FormData) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/sprints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      toast({ title: '스프린트 생성 완료!', description: '마니또가 자동 배정되었습니다.' })
      reset()
      setOpen(false)
      load()
    } catch (e) {
      toast({ variant: 'destructive', title: '오류', description: (e as Error).message })
    } finally {
      setSubmitting(false)
    }
  }

  const onReveal = async (sprintId: string) => {
    if (!confirm('스프린트를 공개하면 모든 팀원이 마니또 관계를 볼 수 있습니다. 공개하시겠어요?')) return
    setRevealing(sprintId)
    try {
      const res = await fetch(`/api/admin/sprints/${sprintId}/reveal`, { method: 'PUT' })
      if (!res.ok) throw new Error('공개에 실패했습니다')
      toast({ title: '공개 완료! 🎉', description: '팀원들에게 Slack 알림이 발송됩니다.' })
      load()
      router.push(`/reveal/${sprintId}`)
    } catch (e) {
      toast({ variant: 'destructive', title: '오류', description: (e as Error).message })
    } finally {
      setRevealing(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <h1 className="text-xl font-bold">스프린트 관리</h1>
          <p className="text-muted-foreground mt-1 text-sm">스프린트를 생성하면 마니또가 자동으로 배정됩니다</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> 새 스프린트
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 스프린트 생성</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onCreate)} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>스프린트 이름</Label>
                <Input placeholder="2024 Sprint 5" {...register('name')} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>시작일</Label>
                  <Input type="date" {...register('startDate')} />
                  {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>종료일</Label>
                  <Input type="date" {...register('endDate')} />
                  {errors.endDate && <p className="text-xs text-destructive">{errors.endDate.message}</p>}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                생성 및 마니또 배정
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {sprints.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground">아직 생성된 스프린트가 없어요</p>
            </CardContent>
          </Card>
        )}
        {sprints.map((sprint) => (
          <Card key={sprint.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{sprint.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDate(sprint.startDate)} ~ {formatDate(sprint.endDate)}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[sprint.status]}>{STATUS_LABEL[sprint.status]}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>👥 마니또 {sprint._count.pairs}쌍</span>
                  <span>💌 칭찬 {sprint._count.praises}개</span>
                </div>
                <div className="flex gap-2">
                  {sprint.status === 'REVEALED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => router.push(`/reveal/${sprint.id}`)}
                    >
                      <Eye className="h-3 w-3" /> 결과 보기
                    </Button>
                  )}
                  {sprint.status === 'ACTIVE' && (
                    <Button
                      size="sm"
                      className="gap-1"
                      onClick={() => onReveal(sprint.id)}
                      disabled={revealing === sprint.id}
                    >
                      {revealing === sprint.id && <Loader2 className="h-3 w-3 animate-spin" />}
                      🎉 공개하기
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
