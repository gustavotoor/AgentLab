"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExecutionLog } from "./ExecutionLog"
import { GraphDiagram } from "./GraphDiagram"
import { ObservabilityPanel } from "./ObservabilityPanel"
import type { SSEEvent } from "@/types/agent-stream"
import type { LogMode } from "@/hooks/useLogAnimation"

interface LabPanelProps {
  sseEvents: SSEEvent[]
  isStreaming: boolean
  delayMode: boolean
  onDelayModeChange: (v: boolean) => void
}

export function LabPanel({
  sseEvents,
  isStreaming,
  delayMode,
  onDelayModeChange,
}: LabPanelProps) {
  const [logMode, setLogMode] = useState<LogMode>("realtime")
  const langfuseUrl = process.env.NEXT_PUBLIC_LANGFUSE_DASHBOARD_URL || null

  return (
    <div className="flex flex-col h-full border-l border-border bg-background overflow-hidden">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold font-mono text-foreground">🔬 lab</span>
          {isStreaming && (
            <span className="flex items-center gap-1 text-xs text-[#3fb950]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse" />
              running
            </span>
          )}
        </div>

        {/* Delay mode toggle */}
        <button
          onClick={() => onDelayModeChange(!delayMode)}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-colors font-mono"
          style={{
            background: delayMode ? "#d2992220" : "transparent",
            color: delayMode ? "#d29922" : "hsl(var(--muted-foreground))",
            borderColor: delayMode ? "#d29922" : "hsl(var(--border))",
          }}
          title={delayMode ? "Modo delay ativo — clique para velocidade normal" : "Ativar modo delay (mais lento, mais legível)"}
        >
          {delayMode ? "🐢 delay" : "⚡ normal"}
        </button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="log" className="flex flex-col flex-1 min-h-0">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent h-8 px-4 shrink-0">
          <TabsTrigger value="log" className="text-xs h-7 font-mono">log</TabsTrigger>
          <TabsTrigger value="graph" className="text-xs h-7 font-mono">graph</TabsTrigger>
          <TabsTrigger value="metrics" className="text-xs h-7 font-mono">langfuse</TabsTrigger>
        </TabsList>

        <TabsContent value="log" className="flex-1 m-0 overflow-hidden">
          <div className="h-full p-3">
            <ExecutionLog
              sseEvents={sseEvents}
              isStreaming={isStreaming}
              mode={logMode}
              onModeChange={setLogMode}
            />
          </div>
        </TabsContent>

        <TabsContent value="graph" className="flex-1 m-0 overflow-auto">
          <div className="p-4">
            <p className="text-xs text-muted-foreground font-mono mb-3">graph execution · nó ativo em azul</p>
            <GraphDiagram sseEvents={sseEvents} />
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="flex-1 m-0 overflow-hidden">
          <div className="h-full p-3">
            <ObservabilityPanel dashboardUrl={langfuseUrl} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
