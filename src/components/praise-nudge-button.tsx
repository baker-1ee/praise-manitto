'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface PraiseNudgeButtonProps {
  sprintId: string
}

function getTodayKey(sprintId: string) {
  return `nudge_${sprintId}`
}

function hasNudgedToday(sprintId: string) {
  if (typeof window === 'undefined') return false
  const stored = localStorage.getItem(getTodayKey(sprintId))
  if (!stored) return false
  return stored === new Date().toISOString().slice(0, 10)
}

function markNudgedToday(sprintId: string) {
  localStorage.setItem(getTodayKey(sprintId), new Date().toISOString().slice(0, 10))
}

type DialogState = 'idle' | 'confirm' | 'already' | 'sending' | 'done' | 'error'

export function PraiseNudgeButton({ sprintId }: PraiseNudgeButtonProps) {
  const [dialog, setDialog] = useState<DialogState>('idle')

  function handleClick() {
    if (hasNudgedToday(sprintId)) {
      setDialog('already')
    } else {
      setDialog('confirm')
    }
  }

  async function handleConfirm() {
    setDialog('sending')
    try {
      const res = await fetch('/api/praises/nudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sprintId }),
      })
      if (!res.ok) throw new Error()
      markNudgedToday(sprintId)
      setDialog('done')
    } catch {
      setDialog('error')
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="default"
        className="w-full gap-2"
        onClick={handleClick}
      >
        <Bell className="h-4 w-4" /> 칭찬 조르기
      </Button>

      <Dialog open={dialog === 'confirm'} onOpenChange={(o) => !o && setDialog('idle')}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>마니또에게 알림 보내기</DialogTitle>
            <DialogDescription>
              마니또에게 &ldquo;칭찬을 기다리고 있어요&rdquo; 메일을 보낼게요.
              <br />
              하루에 한 번만 보낼 수 있어요.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog('idle')}>취소</Button>
            <Button onClick={handleConfirm}>보내기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === 'sending'} onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>전송 중...</DialogTitle>
            <DialogDescription>마니또에게 알림을 보내고 있어요.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === 'done'} onOpenChange={(o) => !o && setDialog('idle')}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>전송 완료 💌</DialogTitle>
            <DialogDescription>
              마니또에게 알림을 보냈어요! 오늘 하루 더 이상 조를 수 없어요.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setDialog('idle')}>확인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === 'already'} onOpenChange={(o) => !o && setDialog('idle')}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>오늘은 이미 조랐어요 🥺</DialogTitle>
            <DialogDescription>
              칭찬 조르기는 하루에 한 번만 가능해요.
              <br />
              내일 다시 시도해보세요!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setDialog('idle')}>확인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === 'error'} onOpenChange={(o) => !o && setDialog('idle')}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>전송 실패</DialogTitle>
            <DialogDescription>
              알림 전송에 실패했어요. 잠시 후 다시 시도해주세요.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setDialog('idle')}>확인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
