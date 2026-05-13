import { Nav } from '@/components/nav'

export default function RevealLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="container mx-auto px-4 py-6 pb-24 md:pb-8 max-w-4xl">
        {children}
      </main>
    </div>
  )
}
