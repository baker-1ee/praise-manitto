import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '칭찬 마니또',
  description: '팀원에게 익명으로 칭찬을 전해보세요 💌',
  metadataBase: new URL('https://manitto.jinung.com'),
  openGraph: {
    title: '칭찬 마니또',
    description: '팀원에게 익명으로 칭찬을 전해보세요 💌',
    siteName: '칭찬 마니또',
    images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
    locale: 'ko_KR',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
