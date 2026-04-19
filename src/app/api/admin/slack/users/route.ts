import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { WebClient } from '@slack/web-api'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const token = process.env.SLACK_BOT_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'SLACK_BOT_TOKEN이 설정되지 않았습니다' }, { status: 400 })
  }

  try {
    const client = new WebClient(token)
    const result = await client.users.list({ limit: 200 })

    const members = (result.members ?? [])
      .filter((m) => !m.is_bot && !m.deleted && m.id !== 'USLACKBOT')
      .map((m) => ({
        id: m.id,
        name: m.real_name ?? m.name ?? '',
        displayName: m.profile?.display_name ?? '',
        email: m.profile?.email ?? '',
        avatar: m.profile?.image_48 ?? '',
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'))

    return NextResponse.json(members)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Slack API 호출에 실패했습니다'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
