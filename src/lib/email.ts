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

async function send(to: string, subject: string, html: string) {
  if (!isConfigured()) return
  await transporter.sendMail({ from: FROM, to, subject, html })
}

function baseTemplate(body: string) {
  return `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f6f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f5f4;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">
        <tr><td style="text-align:center;padding-bottom:24px">
          <span style="font-size:24px;font-weight:700;letter-spacing:-0.5px;color:#1a1a1a">💌 칭찬 마니또</span>
        </td></tr>
        <tr><td style="background:#ffffff;border-radius:12px;padding:32px 28px;border:1px solid rgba(0,0,0,0.08)">
          ${body}
        </td></tr>
        <tr><td style="text-align:center;padding-top:20px;font-size:12px;color:#a39e98">
          이 메일은 칭찬 마니또 서비스에서 자동 발송되었습니다.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function sendSprintStartEmail(params: {
  toEmail: string
  toName: string
  sprintName: string
}) {
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1a1a1a;letter-spacing:-0.5px">
      새 스프린트가 시작되었어요! 🚀
    </h2>
    <p style="margin:0 0 20px;color:#615d59;font-size:14px;line-height:1.6">
      ${params.toName}님, <strong>${params.sprintName}</strong> 스프린트가 시작되었습니다.<br>
      당신의 마니또 대상에게 따뜻한 칭찬을 전달해주세요.
    </p>
    <p style="margin:0;color:#615d59;font-size:14px;line-height:1.6">
      아래 주소로 접속하세요:<br>
      <span style="font-size:15px;font-weight:600;color:#1a1a1a">https://manitto.jinung.com</span>
    </p>
  `)
  await send(params.toEmail, `[칭찬 마니또] ${params.sprintName} 스프린트 시작!`, html)
}

export async function sendPraiseReceivedEmail(params: {
  toEmail: string
  toName: string
  sprintName: string
  praiseContent: string
}) {
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1a1a1a;letter-spacing:-0.5px">
      익명의 마니또가 칭찬을 보냈어요 💌
    </h2>
    <p style="margin:0 0 20px;color:#615d59;font-size:14px;line-height:1.6">
      ${params.toName}님, <strong>${params.sprintName}</strong> 스프린트에서<br>
      마니또가 당신에게 몰래 칭찬을 남겼어요!
    </p>
    <div style="background:#f6f5f4;border-radius:8px;padding:16px 20px;border-left:4px solid #0075de">
      <p style="margin:0;font-size:15px;color:#1a1a1a;line-height:1.7;white-space:pre-wrap">${params.praiseContent}</p>
    </div>
    <p style="margin:16px 0 0;color:#a39e98;font-size:12px">스프린트가 공개되면 누구인지 확인할 수 있어요.</p>
  `)
  await send(params.toEmail, `[칭찬 마니또] 마니또가 칭찬을 남겼어요!`, html)
}

export async function sendSprintRevealEmail(params: {
  toEmail: string
  toName: string
  sprintName: string
}) {
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1a1a1a;letter-spacing:-0.5px">
      마니또가 공개되었어요! 🎉
    </h2>
    <p style="margin:0 0 20px;color:#615d59;font-size:14px;line-height:1.6">
      ${params.toName}님, <strong>${params.sprintName}</strong> 스프린트의 마니또가 공개되었습니다!<br>
      누가 당신의 마니또였는지 아래 주소에서 확인해보세요.
    </p>
    <p style="margin:0;color:#615d59;font-size:14px;line-height:1.6">
      <span style="font-size:15px;font-weight:600;color:#1a1a1a">https://manitto.jinung.com</span>
    </p>
  `)
  await send(params.toEmail, `[칭찬 마니또] ${params.sprintName} 마니또 공개!`, html)
}
