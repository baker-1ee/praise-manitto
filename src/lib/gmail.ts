import { google } from 'googleapis'

function getOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI,
  )
  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  })
  return oauth2Client
}

export function getGmailClient() {
  const auth = getOAuth2Client()
  const gmail = google.gmail({ version: 'v1', auth })
  return { auth, gmail }
}

type GmailPayload = {
  mimeType?: string | null
  body?: { data?: string | null } | null
  parts?: GmailPayload[] | null
}

function extractPlainTextBody(payload: GmailPayload): string {
  if (!payload) return ''

  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8')
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      const result = extractPlainTextBody(part)
      if (result) return result
    }
  }

  return ''
}

function stripQuotedReply(text: string): string {
  const lines = text.split('\n')
  const result: string[] = []

  for (const line of lines) {
    if (line.startsWith('>')) break
    if (/^--- /.test(line)) break
    if (/^On .+ wrote:$/.test(line.trim())) break
    // Outlook: 언더스코어 구분선
    if (/^_{5,}/.test(line.trim())) break
    // Outlook 한국어: "보낸 사람:", "From:" 헤더
    if (/^보낸 사람\s*:/i.test(line.trim())) break
    if (/^From\s*:/i.test(line.trim())) break
    // 표준 서명 구분자 (RFC 3676): "-- " 또는 "--"만 있는 줄
    if (/^--\s*$/.test(line)) break
    result.push(line)
  }

  return result.join('\n').trim()
}

function extractEmail(from: string): string {
  const match = from.match(/<([^>]+)>/)
  if (match) return match[1]
  return from.trim()
}

export async function fetchNewMessages(historyId: string) {
  const { gmail } = getGmailClient()

  const historyRes = await gmail.users.history.list({
    userId: 'me',
    startHistoryId: historyId,
    historyTypes: ['messageAdded'],
  })

  const histories = historyRes.data.history ?? []
  const messageIds = new Set<string>()

  for (const h of histories) {
    for (const m of h.messagesAdded ?? []) {
      if (m.message?.id) messageIds.add(m.message.id)
    }
  }

  const results: { from: string; subject: string; body: string; messageId: string }[] = []

  for (const id of messageIds) {
    const msg = await gmail.users.messages.get({ userId: 'me', id, format: 'full' })
    const headers = msg.data.payload?.headers ?? []
    const fromHeader = headers.find((h) => h.name?.toLowerCase() === 'from')?.value ?? ''
    const subject = headers.find((h) => h.name?.toLowerCase() === 'subject')?.value ?? ''
    const rawBody = extractPlainTextBody(msg.data.payload ?? {})
    const body = stripQuotedReply(rawBody)
    results.push({ from: extractEmail(fromHeader), subject, body, messageId: id })
  }

  return results
}

export async function markAsRead(messageId: string) {
  const { gmail } = getGmailClient()
  await gmail.users.messages.modify({
    userId: 'me',
    id: messageId,
    requestBody: { removeLabelIds: ['UNREAD'] },
  })
}

export async function setupWatch() {
  const { gmail } = getGmailClient()
  const res = await gmail.users.watch({
    userId: 'me',
    requestBody: {
      topicName: process.env.GMAIL_PUBSUB_TOPIC,
      labelIds: ['INBOX'],
    },
  })
  return res.data
}

export async function getOrCreateHistoryId() {
  const { gmail } = getGmailClient()
  const res = await gmail.users.getProfile({ userId: 'me' })
  return res.data.historyId
}
