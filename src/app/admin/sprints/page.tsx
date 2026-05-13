'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Plus, Eye, Loader2, Trash2, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  teamId: z.string().min(1, '팀을 선택해주세요'),
})
type FormData = z.infer<typeof schema>

interface Team { id: string; name: string }

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
  const { data: session } = useSession()
  const isLeader = session?.user.role === 'LEADER'
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [revealing, setRevealing] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const load = async () => {
    const res = await fetch('/api/admin/sprints')
    const data = await res.json()
    setSprints(data)
  }

  const loadTeams = async () => {
    const res = await fetch('/api/admin/teams')
    const data = await res.json()
    setTeams(Array.isArray(data) ? data : [])
  }

  useEffect(() => {
    load()
    loadTeams()
  }, [])

  useEffect(() => {
    if (isLeader && session?.user.teamId) {
      setValue('teamId', session.user.teamId)
    }
  }, [isLeader, session?.user.teamId, setValue])

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

  const onDelete = async (sprintId: string, sprintName: string) => {
    if (!confirm(`"${sprintName}" 스프린트를 삭제할까요? 관련 칭찬 데이터도 모두 삭제됩니다.`)) return
    setDeleting(sprintId)
    try {
      const res = await fetch(`/api/admin/sprints/${sprintId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('삭제에 실패했습니다')
      toast({ title: '스프린트가 삭제되었습니다' })
      load()
    } catch (e) {
      toast({ variant: 'destructive', title: '오류', description: (e as Error).message })
    } finally {
      setDeleting(null)
    }
  }

  const onReveal = async (sprintId: string) => {
    if (!confirm('스프린트를 공개하면 모든 팀원이 마니또 관계를 볼 수 있습니다. 공개하시겠어요?')) return
    setRevealing(sprintId)
    try {
      const res = await fetch(`/api/admin/sprints/${sprintId}/reveal`, { method: 'PUT' })
      if (!res.ok) throw new Error('공개에 실패했습니다')
      toast({ title: '공개 완료! 🎉' })
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.625px]">스프린트 관리</h1>
          <p className="text-[#615d59] mt-1 text-sm">스프린트를 생성하면 마니또가 자동으로 배정됩니다</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shrink-0">
              <Plus className="h-4 w-4" /> 새 스프린트
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="tracking-[-0.25px]">새 스프린트 생성</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onCreate)} className="space-y-4 mt-2">
              {!isLeader && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">팀 선택 <span className="text-destructive">*</span></Label>
                  <Select onValueChange={(v) => setValue('teamId', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="팀을 선택해주세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.teamId && <p className="text-xs text-destructive">{errors.teamId.message}</p>}
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-sm font-medium">스프린트 이름</Label>
                <Input placeholder="2024 Sprint 5" {...register('name')} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">시작일</Label>
                  <Input type="date" {...register('startDate')} />
                  {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">종료일</Label>
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

      <div className="space-y-3">
        {sprints.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="h-10 w-10 mx-auto text-[#a39e98] mb-3" />
              <p className="text-[#615d59] text-sm">아직 생성된 스프린트가 없어요</p>
            </CardContent>
          </Card>
        )}
        {sprints.map((sprint) => (
          <Card key={sprint.id} className="hover:shadow-notion-card transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{sprint.name}</CardTitle>
                  <p className="text-xs text-[#a39e98] mt-1">
                    {formatDate(sprint.startDate)} ~ {formatDate(sprint.endDate)}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[sprint.status]}>{STATUS_LABEL[sprint.status]}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex gap-4 text-xs text-[#615d59]">
                  <span>👥 {sprint._count.pairs}쌍</span>
                  <span>💌 {sprint._count.praises}개</span>
                </div>
                <div className="flex gap-2">
                  {sprint.status === 'REVEALED' && (
                    <Button
                      size="sm"
                      variant="secondary"
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
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onDelete(sprint.id, sprint.name)}
                    disabled={deleting === sprint.id}
                  >
                    {deleting === sprint.id
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : <Trash2 className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
