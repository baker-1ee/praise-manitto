import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT ?? 587),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

const FROM = process.env.EMAIL_FROM ?? '칭찬 마니또 <noreply@praise-manitto.app>'

function isConfigured() {
  return !!(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS)
}

async function send(to: string, subject: string, text: string) {
  if (!isConfigured()) return
  await transporter.sendMail({ from: FROM, to, subject, text })
}

const DIVIDER = '=================================================='
const FOOTER_NOTE = '이 메일은 칭찬 마니또 서비스에서 자동 발송되었습니다.'

function wrapBox(lines: string[]) {
  const width = 48
  const top    = '+' + '-'.repeat(width) + '+'
  const bottom = '+' + '-'.repeat(width) + '+'
  const padded = lines.map(l => {
    const visible = l.replace(/\n/g, '')
    const spaces = Math.max(0, width - 2 - visible.length)
    return '| ' + visible + ' '.repeat(spaces) + ' |'
  })
  return [top, ...padded, bottom].join('\n')
}

export async function sendSprintStartEmail(params: {
  toEmail: string
  toName: string
  sprintName: string
}) {
  const text = [
    DIVIDER,
    '          [ 칭찬 마니또 ]',
    DIVIDER,
    '',
    `  새 스프린트가 시작되었어요!  o(*^▽^*)o`,
    '',
    `  안녕하세요, ${params.toName}님!`,
    `  [${params.sprintName}] 스프린트가 시작되었습니다.`,
    '  당신의 마니또 대상에게 따뜻한 칭찬을 전달해주세요.',
    '',
    '  접속 주소:',
    '  https://manitto.jinung.com',
    '',
    DIVIDER,
    `  ${FOOTER_NOTE}`,
    DIVIDER,
  ].join('\n')

  await send(params.toEmail, `[칭찬 마니또] ${params.sprintName} 스프린트 시작!`, text)
}

export async function sendPraiseReceivedEmail(params: {
  toEmail: string
  toName: string
  sprintName: string
  praiseContent: string
}) {
  const praiseLines = params.praiseContent.split('\n')

  const text = [
    DIVIDER,
    '          [ 칭찬 마니또 ]',
    DIVIDER,
    '',
    `  익명의 마니또가 칭찬을 보냈어요!  (^///^)`,
    '',
    `  ${params.toName}님, [${params.sprintName}] 스프린트에서`,
    '  마니또가 당신에게 몰래 칭찬을 남겼어요!',
    '',
    wrapBox(praiseLines),
    '',
    '  * 스프린트가 공개되면 누구인지 확인할 수 있어요.',
    '',
    DIVIDER,
    `  ${FOOTER_NOTE}`,
    DIVIDER,
  ].join('\n')

  await send(params.toEmail, `[칭찬 마니또] 마니또가 칭찬을 남겼어요!`, text)
}

export async function sendSprintRevealEmail(params: {
  toEmail: string
  toName: string
  sprintName: string
}) {
  const text = [
    DIVIDER,
    '          [ 칭찬 마니또 ]',
    DIVIDER,
    '',
    `  마니또가 공개되었어요!  \\(^o^)/`,
    '',
    `  ${params.toName}님,`,
    `  [${params.sprintName}] 스프린트의 마니또가 공개되었습니다!`,
    '  누가 당신의 마니또였는지 아래 주소에서 확인해보세요.',
    '',
    '  접속 주소:',
    '  https://manitto.jinung.com',
    '',
    DIVIDER,
    `  ${FOOTER_NOTE}`,
    DIVIDER,
  ].join('\n')

  await send(params.toEmail, `[칭찬 마니또] ${params.sprintName} 마니또 공개!`, text)
}
