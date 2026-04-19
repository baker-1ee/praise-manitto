import { prisma } from '@/lib/prisma'
import { RegisterFormWrapper } from './register-form'

const BASE_URL = 'https://manitto.jinung.com'

const DEFAULT_METADATA = {
  openGraph: {
    title: '칭찬 마니또',
    description: '팀원에게 익명으로 칭찬을 전해보세요 💌',
    images: [{ url: `${BASE_URL}/api/og`, width: 1200, height: 630 }],
  },
}

export async function generateMetadata({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams.token
  if (!token) return DEFAULT_METADATA

  try {
    const invite = await prisma.inviteToken.findUnique({
      where: { token },
      include: { user: { select: { name: true } } },
    })

    const name = invite?.user?.name
    if (!name) return DEFAULT_METADATA

    const givenName = name.length >= 3 ? name.slice(1) : name
    const ogUrl = `${BASE_URL}/api/og?name=${encodeURIComponent(name)}`

    return {
      title: `${givenName}님을 칭찬 마니또에 초대합니다!`,
      openGraph: {
        title: `${givenName}님을 칭찬 마니또에 초대합니다!`,
        description: '팀원에게 익명으로 칭찬을 전해보세요 💌',
        images: [{ url: ogUrl, width: 1200, height: 630 }],
      },
    }
  } catch {
    return DEFAULT_METADATA
  }
}

export default function RegisterPage() {
  return <RegisterFormWrapper />
}
