'use client'

import { SessionProvider } from 'next-auth/react'
import { Toaster } from '@/components/ui/toaster'
import { ApiLoadingProvider } from '@/components/api-loading-overlay'
import { KakaoBanner, PwaInstallPrompt } from '@/components/pwa-prompt'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ApiLoadingProvider>
        {children}
        <Toaster />
        <KakaoBanner />
        <PwaInstallPrompt />
      </ApiLoadingProvider>
    </SessionProvider>
  )
}
