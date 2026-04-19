export async function sendSlackDM(slackUserId: string, message: string): Promise<void> {
  const token = process.env.SLACK_BOT_TOKEN
  if (!token) {
    console.warn('SLACK_BOT_TOKEN이 설정되지 않았습니다.')
    return
  }

  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ channel: slackUserId, text: message }),
  })

  const data = await res.json()
  if (!data.ok) {
    console.error('Slack DM 발송 실패:', data.error)
  }
}

export async function sendPraiseNotification(
  slackUserId: string | null,
  categories: string[],
  content: string,
  appUrl: string,
): Promise<void> {
  if (!slackUserId) return

  const categoryText = categories.length > 0 ? `[${categories.join(', ')}]\n` : ''
  const message = `💌 익명의 팀원이 칭찬을 보냈어요!\n\n${categoryText}"${content}"\n\n👉 확인하기: ${appUrl}/praises/received`

  await sendSlackDM(slackUserId, message)
}

export async function sendRevealNotification(webhookUrl: string, sprintName: string, appUrl: string): Promise<void> {
  if (!webhookUrl) return

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🎉 *${sprintName}* 칭찬 마니또가 공개되었습니다!\n👉 지금 확인하기: ${appUrl}`,
    }),
  })
}
