'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Copy, Check, Users, KeyRound, Trash2, Mail, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { getInitials } from '@/lib/utils'

interface Member {
  id: string
  name: string | null
  email: string | null
  role: string
  avatarUrl: string | null
  hasPassword: boolean
  inviteToken?: { token: string; usedAt: string | null } | null
}
interface Team { id: string; name: string; members: Member[] }

const teamSchema = z.object({ name: z.string().min(1, '팀 이름을 입력해주세요') })
const memberSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
  email: z.string().email('올바른 이메일 형식이 아닙니다').optional().or(z.literal('')),
  role: z.enum(['LEADER', 'MEMBER']),
})
const emailSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다').optional().or(z.literal('')),
})
type TeamForm = z.infer<typeof teamSchema>
type MemberForm = z.infer<typeof memberSchema>
type EmailForm = z.infer<typeof emailSchema>

const ROLE_LABEL: Record<string, string> = { LEADER: '리더', MEMBER: '멤버' }

export default function AdminTeamsPage() {
  const { toast } = useToast()
  const { data: session } = useSession()
  const isAdmin = session?.user.role === 'ADMIN'
  const [teams, setTeams] = useState<Team[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [teamDialogOpen, setTeamDialogOpen] = useState(false)
  const [memberDialogTeamId, setMemberDialogTeamId] = useState<string | null>(null)
  const [emailEditMember, setEmailEditMember] = useState<Member | null>(null)

  const teamForm = useForm<TeamForm>({ resolver: zodResolver(teamSchema) })
  const memberForm = useForm<MemberForm>({ resolver: zodResolver(memberSchema), defaultValues: { role: 'MEMBER' } })
  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema) })

  const loadTeams = useCallback(async () => {
    const res = await fetch('/api/admin/teams')
    const data = await res.json()
    setTeams(Array.isArray(data) ? data : [])
  }, [])

  useEffect(() => { loadTeams() }, [loadTeams])

  const createTeam = async (data: TeamForm) => {
    const res = await fetch('/api/admin/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      toast({ variant: 'destructive', title: '오류', description: err.error })
      return
    }
    toast({ title: '팀이 생성되었습니다' })
    teamForm.reset()
    setTeamDialogOpen(false)
    loadTeams()
  }

  const addMember = async (data: MemberForm) => {
    if (!memberDialogTeamId) return
    const res = await fetch(`/api/admin/teams/${memberDialogTeamId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      toast({ variant: 'destructive', title: '오류', description: err.error })
      return
    }
    toast({ title: '팀원이 추가되었습니다', description: '초대링크를 복사해서 공유하세요' })
    memberForm.reset({ role: 'MEMBER' })
    setMemberDialogTeamId(null)
    loadTeams()
  }

  const updateEmail = async (data: EmailForm) => {
    if (!emailEditMember) return
    const res = await fetch(`/api/admin/users/${emailEditMember.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: data.email || '' }),
    })
    if (!res.ok) {
      const err = await res.json()
      toast({ variant: 'destructive', title: '오류', description: err.error })
      return
    }
    toast({ title: '이메일이 저장되었습니다' })
    setEmailEditMember(null)
    emailForm.reset()
    loadTeams()
  }

  const copyInviteLink = async (teamId: string, member: Member) => {
    let token = member.inviteToken?.token
    if (!token) {
      const res = await fetch(`/api/admin/teams/${teamId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: member.id }),
      })
      const data = await res.json()
      token = data.token
      loadTeams()
    }
    const url = `${window.location.origin}/register?token=${token}`
    await navigator.clipboard.writeText(url)
    setCopiedId(member.id)
    setTimeout(() => setCopiedId(null), 2000)
    toast({ title: '초대링크 복사됨', description: `${member.name}님의 링크가 클립보드에 복사되었습니다` })
  }

  const deleteTeam = async (teamId: string, teamName: string) => {
    if (!confirm(`"${teamName}" 팀을 삭제할까요? 팀원들은 팀에서 제외됩니다.`)) return
    const res = await fetch(`/api/admin/teams/${teamId}`, { method: 'DELETE' })
    if (res.ok) {
      toast({ title: '팀이 삭제되었습니다' })
      loadTeams()
    } else {
      const err = await res.json()
      toast({ variant: 'destructive', title: '오류', description: err.error })
    }
  }

  const removeMember = async (teamId: string, userId: string, memberName: string | null) => {
    if (!confirm(`${memberName ?? '이 팀원'}을 팀에서 제거할까요?`)) return
    const res = await fetch(`/api/admin/teams/${teamId}/members`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    if (res.ok) {
      toast({ title: '팀원이 제거되었습니다' })
      loadTeams()
    } else {
      const err = await res.json()
      toast({ variant: 'destructive', title: '오류', description: err.error })
    }
  }

  const resetPassword = async (teamId: string, userId: string, memberName: string | null) => {
    if (!confirm(`${memberName ?? '이 팀원'}의 비밀번호를 0000으로 초기화할까요?`)) return
    const res = await fetch(`/api/admin/teams/${teamId}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    if (res.ok) {
      toast({ title: '비밀번호가 초기화되었습니다', description: '임시 비밀번호: 0000' })
    } else {
      const err = await res.json()
      toast({ variant: 'destructive', title: '오류', description: err.error })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-heading">팀 & 멤버 관리</h1>
          <p className="text-muted-foreground mt-1 text-sm">팀을 구성하고 초대링크로 팀원을 온보딩하세요</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {isAdmin && (
            <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" /> 팀 생성</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle className="font-serif tracking-subheading">새 팀 생성</DialogTitle></DialogHeader>
                <form onSubmit={teamForm.handleSubmit(createTeam)} className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">팀 이름</Label>
                    <Input placeholder="개발팀" {...teamForm.register('name')} />
                    {teamForm.formState.errors.name && (
                      <p className="text-xs text-destructive">{teamForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full">생성</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* 이메일 수정 다이얼로그 */}
      <Dialog
        open={!!emailEditMember}
        onOpenChange={(o) => {
          if (!o) { setEmailEditMember(null); emailForm.reset() }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif tracking-subheading">이메일 수정 — {emailEditMember?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={emailForm.handleSubmit(updateEmail)} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">이메일</Label>
              <Input
                type="email"
                placeholder="example@company.com"
                {...emailForm.register('email')}
              />
              {emailForm.formState.errors.email && (
                <p className="text-xs text-destructive">{emailForm.formState.errors.email.message}</p>
              )}
              <p className="text-xs text-muted-foreground">비워두면 이메일 알림이 발송되지 않습니다.</p>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">저장</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setEmailEditMember(null); emailForm.reset() }}
              >
                취소
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {teams.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="font-serif font-bold tracking-subheading">아직 생성된 팀이 없어요</p>
            <p className="text-sm text-muted-foreground mt-1">팀 생성 버튼으로 시작하세요</p>
          </CardContent>
        </Card>
      ) : (
        teams.map((team) => (
          <Card key={team.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{team.name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{team.members.length}명</p>
                </div>
                <div className="flex gap-1">
                  <Dialog
                    open={memberDialogTeamId === team.id}
                    onOpenChange={(o) => { setMemberDialogTeamId(o ? team.id : null); memberForm.reset({ role: 'MEMBER' }) }}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm" variant="secondary" className="gap-1">
                        <Plus className="h-3 w-3" /> 팀원 추가
                      </Button>
                    </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle className="font-serif tracking-subheading">팀원 추가 — {team.name}</DialogTitle></DialogHeader>
                    <form onSubmit={memberForm.handleSubmit(addMember)} className="space-y-4 mt-2">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">이름 <span className="text-destructive">*</span></Label>
                        <Input placeholder="홍길동" {...memberForm.register('name')} />
                        {memberForm.formState.errors.name && (
                          <p className="text-xs text-destructive">{memberForm.formState.errors.name.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">이메일</Label>
                        <Input type="email" placeholder="example@company.com" {...memberForm.register('email')} />
                        {memberForm.formState.errors.email && (
                          <p className="text-xs text-destructive">{memberForm.formState.errors.email.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground">입력하면 스프린트 알림 메일을 받을 수 있어요.</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">역할</Label>
                        <Select
                          defaultValue="MEMBER"
                          onValueChange={(v) => memberForm.setValue('role', v as 'LEADER' | 'MEMBER')}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LEADER">리더</SelectItem>
                            <SelectItem value="MEMBER">멤버</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="submit" className="w-full">추가 및 초대링크 생성</Button>
                    </form>
                  </DialogContent>
                  </Dialog>
                  {isAdmin && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10 px-2"
                      onClick={() => deleteTeam(team.id, team.name)}
                      title="팀 삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {team.members.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">팀원이 없어요. 팀원을 추가해주세요.</p>
              ) : (
                team.members.map((member, i) => (
                  <div key={member.id}>
                    {i > 0 && <Separator />}
                    <div className="py-2 space-y-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 shrink-0">
                          {member.avatarUrl && <AvatarImage src={member.avatarUrl} />}
                          <AvatarFallback className="text-sm bg-[#FEF0EA] text-primary font-semibold">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-medium text-sm">{member.name}</span>
                            <Badge variant={member.role === 'LEADER' ? 'default' : 'secondary'} className="text-xs">
                              {ROLE_LABEL[member.role]}
                            </Badge>
                            {member.hasPassword ? (
                              <Badge variant="outline" className="text-xs text-green-600 border-green-600/30">가입 완료</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs text-destructive border-destructive/30">미가입</Badge>
                            )}
                          </div>
                          {member.email ? (
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                              <Mail className="h-3 w-3 shrink-0" />
                              {member.email}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground/60 mt-0.5">이메일 미등록</p>
                          )}
                        </div>

                        <div className="flex gap-1 shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground"
                            onClick={() => {
                              setEmailEditMember(member)
                              emailForm.reset({ email: member.email ?? '' })
                            }}
                            title="이메일 수정"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground"
                            onClick={() => copyInviteLink(team.id, member)}
                            title="초대링크 복사"
                          >
                            {copiedId === member.id ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          {member.hasPassword && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => resetPassword(team.id, member.id, member.name)}
                              title="비밀번호 초기화 (0000)"
                            >
                              <KeyRound className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removeMember(team.id, member.id, member.name)}
                            title="팀에서 제거"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
