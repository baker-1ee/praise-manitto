import { prisma } from '@/lib/prisma'
import { RegisterFormWrapper } from './register-form'

export async function generateMetadata({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams.token
  if (!token) return {}

  const invite = await prisma.inviteToken.findUnique({
    where: { token },
    include: { user: { select: { name: true } } },
  })

  const name = invite?.user?.name
  if (!name) return {}

  const givenName = name.length >= 3 ? name.slice(1) : name
  const ogUrl = `/api/og?name=${encodeURIComponent(name)}`

  return {
    title: `${givenName}님을 칭찬 마니또에 초대합니다!`,
    openGraph: {
      title: `${givenName}님을 칭찬 마니또에 초대합니다!`,
      description: '팀원에게 익명으로 칭찬을 전해보세요 💌',
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
  }
}

export default function RegisterPage() {
  return <RegisterFormWrapper />
}
