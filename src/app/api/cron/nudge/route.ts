import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPraiseNudgeEmail } from '@/lib/email'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const activeSprints = await prisma.sprint.findMany({
    where: { status: 'ACTIVE' },
  })

  let count = 0

  for (const sprint of activeSprints) {
    const pairs = await prisma.manitoPair.findMany({
      where: { sprintId: sprint.id },
      include: {
        manito: true,
        target: true,
      },
    })

    for (const pair of pairs) {
      if (!pair.manito.email) continue

      await sendPraiseNudgeEmail({
        toEmail: pair.manito.email,
        toName: pair.manito.name ?? '팀원',
        targetName: pair.target.name ?? '팀원',
        sprintName: sprint.name,
      })

      count++
    }
  }

  return NextResponse.json({ ok: true, sent: count })
}
