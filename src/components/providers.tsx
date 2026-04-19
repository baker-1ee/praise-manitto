'use client'

import { SessionProvider } from 'next-auth/react'
import { Toaster } from '@/components/ui/toaster'
import { ApiLoadingProvider } from '@/components/api-loading-overlay'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ApiLoadingProvider>
        {children}
        <Toaster />
      </ApiLoadingProvider>
    </SessionProvider>
  )
}
