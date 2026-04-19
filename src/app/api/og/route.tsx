import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name') ?? ''
  const givenName = name.length >= 3 ? name.slice(1) : name

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
            팀원에게 익명으로 칭찬을 전해보세요 🎉
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
