import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Nav } from '@/components/nav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (!['ADMIN', 'LEADER'].includes(session.user.role)) redirect('/')

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="container mx-auto px-4 py-6 pb-24 md:pb-8 max-w-5xl">{children}</main>
    </div>
  )
}
