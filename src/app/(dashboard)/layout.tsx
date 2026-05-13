import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Nav } from '@/components/nav'
import { PasswordChangeBanner } from '@/components/password-change-banner'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen bg-background relative">
      {/* Decorative background blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -top-32 -right-32 h-[600px] w-[600px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.13) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-[-96px] -left-24 h-[400px] w-[400px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.09) 0%, transparent 70%)' }}
        />
      </div>

      <Nav />
      <PasswordChangeBanner />
      <main className="container mx-auto px-4 py-6 pb-24 md:pb-8 max-w-4xl">
        {children}
      </main>
    </div>
  )
}
