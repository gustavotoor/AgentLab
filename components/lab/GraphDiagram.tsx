"use client"

import type { SSEEvent } from "@/types/agent-stream"

interface GraphDiagramProps {
  sseEvents: SSEEvent[]
}

// AgentLab 5-node graph topology
const NODES = [
  { id: "classify_intent",   label: "classify_intent",   x: 155, y: 40  },
  { id: "retrieve_context",  label: "retrieve_context",  x: 20,  y: 140 },
  { id: "execute_tools",     label: "execute_tools",     x: 155, y: 140 },
  { id: "generate_response", label: "generate_response", x: 290, y: 140 },
  { id: "validate_response", label: "validate_response", x: 155, y: 240 },
]

const EDGES = [
  { from: "START",            to: "classify_intent",   label: "" },
  { from: "classify_intent",  to: "retrieve_context",  label: "reasoning" },
  { from: "classify_intent",  to: "execute_tools",     label: "tool_use" },
  { from: "classify_intent",  to: "generate_response", label: "chat" },
  { from: "retrieve_context", to: "generate_response", label: "" },
  { from: "execute_tools",    to: "generate_response", label: "" },
  { from: "generate_response",to: "validate_response", label: "" },
  { from: "validate_response",to: "generate_response", label: "retry" },
  { from: "validate_response",to: "END",               label: "✓" },
]

function getActiveNode(sseEvents: SSEEvent[]): string | null {
  for (let i = sseEvents.length - 1; i >= 0; i--) {
    const e = sseEvents[i]
    if (e.type === "node_start") return e.data.node as string
    if (e.type === "done") return null
  }
  return null
}

export function GraphDiagram({ sseEvents }: GraphDiagramProps) {
  const activeNode = getActiveNode(sseEvents)
  const nodeById = Object.fromEntries(NODES.map((n) => [n.id, n]))
  const startPos = { x: 155, y: -15 }
  const endPos = { x: 290, y: 335 }

  return (
    <svg viewBox="0 0 450 370" className="w-full" style={{ maxHeight: "280px" }}>
      <defs>
        <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#30363d" />
        </marker>
        <marker id="arr-active" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#58a6ff" />
        </marker>
      </defs>

      {/* Edges */}
      {EDGES.map((edge, i) => {
        const from =
          edge.from === "START" ? startPos
          : edge.from === "END"  ? endPos
          : nodeById[edge.from]
        const to =
          edge.to === "START" ? startPos
          : edge.to === "END"  ? endPos
          : nodeById[edge.to]
        if (!from || !to) return null

        const nodeW = 110
        const nodeH = 30
        const x1 = from.x + nodeW / 2
        const y1 = edge.from === "START" ? from.y + 10 : from.y + nodeH
        const x2 = to.x + nodeW / 2
        const y2 = edge.to === "END" ? to.y : to.y
        const mx = (x1 + x2) / 2
        const my = (y1 + y2) / 2

        return (
          <g key={i}>
            <line
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#30363d" strokeWidth="1.5"
              markerEnd="url(#arr)"
            />
            {edge.label && (
              <text x={mx + 4} y={my - 4} fontSize="8" fill="#8b949e" textAnchor="middle">
                {edge.label}
              </text>
            )}
          </g>
        )
      })}

      {/* Nodes */}
      {NODES.map((node) => {
        const isActive = node.id === activeNode
        return (
          <g key={node.id}>
            <rect
              x={node.x} y={node.y} width={110} height={30} rx={5}
              fill={isActive ? "#58a6ff22" : "#161b22"}
              stroke={isActive ? "#58a6ff" : "#30363d"}
              strokeWidth={isActive ? 2 : 1}
            />
            <text
              x={node.x + 55} y={node.y + 19}
              fontSize="8" fill={isActive ? "#58a6ff" : "#8b949e"}
              textAnchor="middle" fontFamily="monospace"
            >
              {node.label}
            </text>
          </g>
        )
      })}

      {/* START */}
      <text x={155 + 55} y={-3} fontSize="9" fill="#3fb950" textAnchor="middle">START</text>

      {/* END */}
      <rect x={235} y={315} width={110} height={28} rx={5} fill="#161b22" stroke="#3fb950" strokeWidth={1} />
      <text x={290} y={333} fontSize="9" fill="#3fb950" textAnchor="middle">END</text>
    </svg>
  )
}
