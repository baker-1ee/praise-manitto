'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PasswordChangeBanner() {
  const { data: session } = useSession()
  const router = useRouter()

  if (!session?.user?.mustChangePassword) return null

  return (
    <div className="bg-orange-50 border-b border-orange-200 px-4 py-3">
      <div className="container mx-auto max-w-4xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-orange-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <p className="text-sm font-medium">
            관리자가 비밀번호를 초기화했습니다. 지금 바로 비밀번호를 변경해주세요.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 border-orange-300 text-orange-700 hover:bg-orange-100"
          onClick={() => router.push('/change-password')}
        >
          비밀번호 변경
        </Button>
      </div>
    </div>
  )
}
