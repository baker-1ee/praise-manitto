import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

async function loadNotoSansKR(): Promise<ArrayBuffer> {
  // Old IE UA returns TTF format which Satori supports
  const css = await fetch(
    'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@700',
    { headers: { 'User-Agent': 'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)' } },
  ).then((r) => r.text())

  const match = css.match(/url\(([^)]+)\) format\('truetype'\)/)
  if (!match) throw new Error('Font URL not found')

  return fetch(match[1]).then((r) => r.arrayBuffer())
}

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name') ?? ''
  const givenName = name.length >= 3 ? name.slice(1) : name

  const fontData = await loadNotoSansKR()

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          padding: 60,
          fontFamily: 'Noto Sans KR',
        }}
      >
        <div
          style={{
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 32,
            padding: '48px 72px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
            border: '2px solid rgba(255,255,255,0.3)',
          }}
        >
          <div style={{ fontSize: 96 }}>💌</div>
          {givenName ? (
            <div
              style={{
                color: 'white',
                fontSize: 64,
                fontWeight: 'bold',
                letterSpacing: '-2px',
              }}
            >
              {givenName}님을 초대합니다!
            </div>
          ) : null}
          <div
            style={{
              color: 'white',
              fontSize: givenName ? 40 : 72,
              fontWeight: 'bold',
              letterSpacing: '-2px',
            }}
          >
            칭찬 마니또
          </div>
          <div
            style={{
              color: 'rgba(255,255,255,0.9)',
              fontSize: 28,
              marginTop: 4,
            }}
          >
            팀원에게 익명으로 칭찬을 전해보세요
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [{ name: 'Noto Sans KR', data: fontData, weight: 700 }],
    },
  )
}
