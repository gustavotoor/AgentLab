"use client"

import { useEffect, useRef } from "react"
import type { SSEEvent } from "@/types/agent-stream"
import { useLogAnimation, type LogMode } from "@/hooks/useLogAnimation"

interface ExecutionLogProps {
  sseEvents: SSEEvent[]
  isStreaming: boolean
  mode: LogMode
  onModeChange: (m: LogMode) => void
}

export function ExecutionLog({ sseEvents, isStreaming, mode, onModeChange }: ExecutionLogProps) {
  const lines = useLogAnimation(sseEvents, mode)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [lines])

  return (
    <div className="flex flex-col h-full rounded-lg overflow-hidden border border-border bg-[#0d1117]">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border flex items-center justify-between shrink-0">
        <span className="text-xs text-muted-foreground font-mono">
          ⬛ execution log
        </span>
        <div className="flex gap-1">
          {(["realtime", "animated"] as LogMode[]).map((m) => (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              className="px-2 py-0.5 text-xs rounded transition-colors font-mono"
              style={{
                background: mode === m ? "#161b22" : "transparent",
                color: mode === m ? "#e6edf3" : "#8b949e",
                border: `1px solid ${mode === m ? "#30363d" : "transparent"}`,
              }}
            >
              {m === "realtime" ? "⚡ real-time" : "🐢 animated"}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal output */}
      <div className="flex-1 overflow-y-auto p-3 text-xs leading-relaxed font-mono">
        {lines.length === 0 && !isStreaming && (
          <span className="text-[#8b949e]">aguardando execução...</span>
        )}

        {lines.map((line) => {
          if (line.type === "node_start") {
            return (
              <div key={line.id} className="mt-2 animate-in fade-in duration-200">
                <span className="text-[#58a6ff]">{">"} [{line.node}]</span>
              </div>
            )
          }

          if (line.type === "node_data") {
            return (
              <div key={line.id} className="pl-4 animate-in fade-in duration-150">
                <span className="text-[#8b949e]">{line.key}: </span>
                <span
                  style={{
                    color: line.key === "security" && line.value === "injection_detected"
                      ? "#f85149"
                      : line.key === "status" && line.value === "retry"
                      ? "#d29922"
                      : "#e6edf3",
                  }}
                >
                  {line.value}
                </span>
              </div>
            )
          }

          if (line.type === "node_complete") {
            return (
              <div key={line.id} className="pl-4 animate-in fade-in duration-150">
                <span className="text-[#3fb950]">
                  ✓ {((line.duration_ms ?? 0) / 1000).toFixed(2)}s
                </span>
              </div>
            )
          }

          if (line.type === "done") {
            return (
              <div key={line.id} className="mt-2 animate-in fade-in duration-200">
                <span className="text-[#3fb950]">
                  {">"} [END] ✓ {((line.total_ms ?? 0) / 1000).toFixed(2)}s
                  {line.total_tokens ? ` · ${line.total_tokens} tokens` : ""}
                  {line.total_cost ? ` · $${line.total_cost.toFixed(4)}` : ""}
                </span>
              </div>
            )
          }

          if (line.type === "error") {
            return (
              <div key={line.id} className="pl-4 animate-in fade-in duration-150">
                <span className="text-[#f85149]">✗ {line.message}</span>
              </div>
            )
          }

          return null
        })}

        {isStreaming && (
          <span className="text-[#58a6ff] animate-pulse">█</span>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
