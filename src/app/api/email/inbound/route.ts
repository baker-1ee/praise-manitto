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

    console.log('[inbound] historyId:', historyId)
    const messages = await fetchNewMessages(String(historyId))
    console.log('[inbound] messages found:', messages.length, messages.map(m => m.from))

    for (const msg of messages) {
      const senderEmail = msg.from.toLowerCase()
      console.log('[inbound] processing:', senderEmail)

      const user = await prisma.user.findFirst({
        where: { email: { equals: senderEmail, mode: 'insensitive' } },
      })

      if (!user) {
        console.log('[inbound] user not found:', senderEmail)
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
        console.log('[inbound] no active pair for user:', user.id)
        await markAsRead(msg.messageId)
        continue
      }

      if (!msg.body) {
        console.log('[inbound] empty body, skipping')
        await markAsRead(msg.messageId)
        continue
      }

      // 읽음 처리를 먼저 해서 동시 요청 시 중복 처리 방지
      await markAsRead(msg.messageId)

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

    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[inbound] error:', e)
    return NextResponse.json({ ok: true })
  }
}
