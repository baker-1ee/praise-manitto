import Link from 'next/link'
import { Heart } from 'lucide-react'

export default function RevealLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center px-4 max-w-5xl">
          <Link href="/" className="flex items-center gap-2 font-bold text-primary">
            <Heart className="h-5 w-5 fill-primary" />
            <span className="text-sm">칭찬 마니또</span>
          </Link>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {children}
      </main>
    </div>
  )
}
