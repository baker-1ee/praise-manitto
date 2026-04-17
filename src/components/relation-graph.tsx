'use client'

import { useEffect, useState, useCallback } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { getInitials } from '@/lib/utils'

interface Member {
  id: string
  name: string | null
}

interface Pair {
  manitoId: string
  targetId: string
  praiseCount: number
  praises: Array<{ content: string; categories: string[]; createdAt: string }>
}

interface RelationGraphProps {
  members: Member[]
  pairs: Pair[]
  onEdgeClick?: (pair: Pair) => void
}

function MemberNode({ data }: { data: { name: string | null } }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <Avatar className="h-14 w-14 border-2 border-primary shadow-md">
        <AvatarFallback className="bg-primary/10 text-primary font-bold">
          {getInitials(data.name)}
        </AvatarFallback>
      </Avatar>
      <span className="text-xs font-semibold bg-background/90 px-2 py-0.5 rounded-full shadow-sm max-w-[80px] truncate text-center">
        {data.name}
      </span>
    </div>
  )
}

const nodeTypes = { member: MemberNode }

export function RelationGraph({ members, pairs, onEdgeClick }: RelationGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [visibleEdgeCount, setVisibleEdgeCount] = useState(0)

  const radius = Math.max(200, members.length * 35)
  const cx = radius + 80
  const cy = radius + 80

  useEffect(() => {
    const memberNodes: Node[] = members.map((m, i) => {
      const angle = (2 * Math.PI * i) / members.length - Math.PI / 2
      return {
        id: m.id,
        type: 'member',
        position: {
          x: cx + radius * Math.cos(angle) - 35,
          y: cy + radius * Math.sin(angle) - 35,
        },
        data: { name: m.name },
        draggable: true,
      }
    })
    setNodes(memberNodes)

    // 엣지를 순차적으로 등장시키는 애니메이션
    setVisibleEdgeCount(0)
    let count = 0
    const interval = setInterval(() => {
      count++
      setVisibleEdgeCount(count)
      if (count >= pairs.length) clearInterval(interval)
    }, 300)

    return () => clearInterval(interval)
  }, [members, pairs, cx, cy, radius, setNodes])

  useEffect(() => {
    const visiblePairs = pairs.slice(0, visibleEdgeCount)
    const newEdges: Edge[] = visiblePairs.map((pair) => ({
      id: `${pair.manitoId}-${pair.targetId}`,
      source: pair.manitoId,
      target: pair.targetId,
      animated: true,
      label: pair.praiseCount > 0 ? `💌 ${pair.praiseCount}` : undefined,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
      style: { stroke: '#6366f1', strokeWidth: 2 },
      labelStyle: { fontSize: 12, fontWeight: 600 },
      data: pair,
    }))
    setEdges(newEdges)
  }, [visibleEdgeCount, pairs, setEdges])

  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      if (edge.data && onEdgeClick) onEdgeClick(edge.data as Pair)
    },
    [onEdgeClick],
  )

  return (
    <div style={{ width: '100%', height: '600px' }} className="rounded-xl border bg-muted/20">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onEdgeClick={handleEdgeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.3}
        maxZoom={1.5}
      >
        <Background />
        <Controls />
      </ReactFlow>
      <div className="px-4 pb-3 text-xs text-muted-foreground text-center">
        화살표를 클릭하면 칭찬 내용을 확인할 수 있어요
      </div>
    </div>
  )
}

export type { Pair as GraphPair }
