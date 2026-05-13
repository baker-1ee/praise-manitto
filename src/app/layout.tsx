import type { Metadata } from 'next'
import { Inter, Fraunces } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  variable: '--font-serif',
})

export const metadata: Metadata = {
  title: '칭찬 마니또',
  description: '팀원에게 익명으로 칭찬을 전해보세요 💌',
  metadataBase: new URL('https://manitto.jinung.com'),
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '칭찬 마니또',
    startupImage: '/apple-touch-icon.png',
  },
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
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#F0EBE1" />
      </head>
      <body className={`${inter.variable} ${fraunces.variable} ${inter.className}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
