'use client'

import { useState, useEffect } from 'react'
import { getInitials } from '@/lib/utils'

interface Member {
  id: string
  name: string | null
  avatarUrl?: string | null
}

interface Pair {
  manitoId: string
  targetId: string
  praiseCount: number
  praises: Array<{ content: string; createdAt: string }>
  manitoName?: string | null
  targetName?: string | null
}

interface RelationGraphProps {
  members: Member[]
  pairs: Pair[]
  onEdgeClick?: (pair: Pair) => void
}

const SIZE = 500
const CX = SIZE / 2
const CY = SIZE / 2
const NODE_R = 30

export function RelationGraph({ members, pairs, onEdgeClick }: RelationGraphProps) {
  const [visibleCount, setVisibleCount] = useState(0)
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null)

  useEffect(() => {
    setVisibleCount(0)
    setSelectedEdge(null)
    let i = 0
    const id = setInterval(() => {
      i++
      setVisibleCount(i)
      if (i >= pairs.length) clearInterval(id)
    }, 350)
    return () => clearInterval(id)
  }, [pairs])

  const count = members.length
  const R = count <= 3 ? 130 : count <= 6 ? 165 : count <= 10 ? 190 : 210

  const positions = members.map((m, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2
    return {
      id: m.id,
      name: m.name,
      avatarUrl: m.avatarUrl,
      x: CX + R * Math.cos(angle),
      y: CY + R * Math.sin(angle),
    }
  })
  const posMap = new Map(positions.map((p) => [p.id, p]))

  const edgePoints = (fid: string, tid: string) => {
    const f = posMap.get(fid)
    const t = posMap.get(tid)
    if (!f || !t) return null
    const dx = t.x - f.x
    const dy = t.y - f.y
    const dist = Math.hypot(dx, dy)
    const pad = NODE_R + 5
    return {
      x1: f.x + (dx / dist) * pad,
      y1: f.y + (dy / dist) * pad,
      x2: t.x - (dx / dist) * (pad + 4),
      y2: t.y - (dy / dist) * (pad + 4),
      mx: (f.x + t.x) / 2,
      my: (f.y + t.y) / 2,
    }
  }

  return (
    <div className="rounded-xl border bg-muted/20 overflow-hidden">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full" style={{ maxHeight: 480 }}>
        <defs>
          <marker id="arr" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#6366f1" />
          </marker>
          <marker id="arr-sel" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#ec4899" />
          </marker>
          {positions.map((p) => (
            <clipPath key={`clip-${p.id}`} id={`clip-${p.id}`}>
              <circle cx={p.x} cy={p.y} r={NODE_R} />
            </clipPath>
          ))}
        </defs>

        {/* Edges */}
        {pairs.slice(0, visibleCount).map((pair) => {
          const pts = edgePoints(pair.manitoId, pair.targetId)
          if (!pts) return null
          const edgeId = `${pair.manitoId}-${pair.targetId}`
          const selected = selectedEdge === edgeId
          return (
            <g
              key={edgeId}
              className="cursor-pointer"
              onClick={() => {
                setSelectedEdge(selected ? null : edgeId)
                onEdgeClick?.(pair)
              }}
            >
              {/* wide transparent hit area */}
              <line x1={pts.x1} y1={pts.y1} x2={pts.x2} y2={pts.y2} stroke="transparent" strokeWidth="14" />
              <line
                x1={pts.x1} y1={pts.y1} x2={pts.x2} y2={pts.y2}
                stroke={selected ? '#ec4899' : '#6366f1'}
                strokeWidth={selected ? 3 : 2}
                markerEnd={`url(#${selected ? 'arr-sel' : 'arr'})`}
              />
              {pair.praiseCount > 0 && (
                <text
                  x={pts.mx} y={pts.my - 7}
                  textAnchor="middle" fontSize="11" fontWeight="600"
                  fill={selected ? '#ec4899' : '#6366f1'}
                >
                  💌 {pair.praiseCount}
                </text>
              )}
            </g>
          )
        })}

        {/* Nodes */}
        {positions.map((pos) => (
          <g key={pos.id}>
            <circle cx={pos.x} cy={pos.y} r={NODE_R + 2} fill="white" stroke="#e5e7eb" strokeWidth="1.5" />
            {pos.avatarUrl ? (
              <image
                href={pos.avatarUrl}
                x={pos.x - NODE_R} y={pos.y - NODE_R}
                width={NODE_R * 2} height={NODE_R * 2}
                clipPath={`url(#clip-${pos.id})`}
              />
            ) : (
              <>
                <circle cx={pos.x} cy={pos.y} r={NODE_R} fill="#ede9fe" />
                <text
                  x={pos.x} y={pos.y + 5}
                  textAnchor="middle" fontSize="13" fontWeight="700" fill="#6366f1"
                >
                  {getInitials(pos.name)}
                </text>
              </>
            )}
            <text
              x={pos.x} y={pos.y + NODE_R + 15}
              textAnchor="middle" fontSize="11" fontWeight="500" fill="#111827"
            >
              {pos.name}
            </text>
          </g>
        ))}
      </svg>
      <p className="text-xs text-muted-foreground text-center pb-3">
        화살표를 클릭하면 칭찬 내용을 확인할 수 있어요
      </p>
    </div>
  )
}

export type { Pair as GraphPair }
