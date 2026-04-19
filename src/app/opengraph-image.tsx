import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = '칭찬 마니또 - 팀원에게 익명으로 칭찬을 전해보세요'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
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
        {/* 카드 배경 */}
        <div
          style={{
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 32,
            padding: '48px 72px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255,255,255,0.3)',
          }}
        >
          <div style={{ fontSize: 96 }}>💌</div>
          <div
            style={{
              color: 'white',
              fontSize: 72,
              fontWeight: 'bold',
              letterSpacing: '-2px',
            }}
          >
            칭찬 마니또
          </div>
          <div
            style={{
              color: 'rgba(255,255,255,0.9)',
              fontSize: 32,
              marginTop: 4,
            }}
          >
            팀원에게 익명으로 칭찬을 전해보세요 🎉
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
