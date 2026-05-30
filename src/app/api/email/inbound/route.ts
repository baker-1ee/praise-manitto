import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchNewMessages, markAsRead } from '@/lib/gmail'
import { sendPraiseReceivedEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const messageData = body?.message?.data
    if (!messageData) {
      return NextResponse.json({ ok: true })
    }

    const decoded = JSON.parse(Buffer.from(messageData, 'base64').toString('utf-8'))
    const { historyId } = decoded

    if (!historyId) {
      return NextResponse.json({ ok: true })
    }

    const messages = await fetchNewMessages(String(historyId))

    for (const msg of messages) {
      const senderEmail = msg.from.toLowerCase()

      const user = await prisma.user.findFirst({
        where: { email: { equals: senderEmail, mode: 'insensitive' } },
      })

      if (!user) {
        await markAsRead(msg.messageId)
        continue
      }

      const pair = await prisma.manitoPair.findFirst({
        where: {
          manitoId: user.id,
          sprint: { status: 'ACTIVE' },
        },
        include: { sprint: true },
      })

      if (!pair) {
        await markAsRead(msg.messageId)
        continue
      }

      if (!msg.body) {
        await markAsRead(msg.messageId)
        continue
      }

      await prisma.praise.create({
        data: {
          sprintId: pair.sprintId,
          fromUserId: user.id,
          toUserId: pair.targetId,
          content: msg.body,
          categories: [],
        },
      })

      const targetUser = await prisma.user.findUnique({
        where: { id: pair.targetId },
      })

      if (targetUser?.email) {
        await sendPraiseReceivedEmail({
          toEmail: targetUser.email,
          toName: targetUser.name ?? '팀원',
          sprintName: pair.sprint.name,
          praiseContent: msg.body,
        })
      }

      await markAsRead(msg.messageId)
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
