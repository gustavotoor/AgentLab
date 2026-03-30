"use client"

import { useEffect, useRef, useState } from "react"
import type { LogLine, SSEEvent } from "@/types/agent-stream"

export type LogMode = "realtime" | "animated"

let _id = 0
const nextId = () => `line-${++_id}`

function eventToLines(event: SSEEvent): LogLine[] {
  const lines: LogLine[] = []
  const { type, data } = event

  if (type === "node_start") {
    lines.push({
      id: nextId(),
      type: "node_start",
      node: data.node as string,
      timestamp: Date.now(),
    })
  } else if (type === "node_data") {
    lines.push({
      id: nextId(),
      type: "node_data",
      node: data.node as string,
      key: data.key as string,
      value: data.value as string,
      timestamp: Date.now(),
    })
  } else if (type === "node_complete") {
    lines.push({
      id: nextId(),
      type: "node_complete",
      node: data.node as string,
      duration_ms: data.duration_ms as number,
      timestamp: Date.now(),
    })
  } else if (type === "done") {
    lines.push({
      id: nextId(),
      type: "done",
      total_ms: data.total_ms as number,
      total_tokens: data.total_tokens as number,
      total_cost: data.total_cost as number,
      status: data.status as string,
      timestamp: Date.now(),
    })
  } else if (type === "error") {
    lines.push({
      id: nextId(),
      type: "error",
      message: data.message as string,
      node: data.node as string,
      timestamp: Date.now(),
    })
  }

  return lines
}

const DELAYS: Record<string, number> = {
  node_start: 0,
  node_data: 150,
  node_complete: 300,
  done: 500,
  error: 0,
}

export function useLogAnimation(sseEvents: SSEEvent[], mode: LogMode): LogLine[] {
  const [visibleLines, setVisibleLines] = useState<LogLine[]>([])
  const prevLengthRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    timerRef.current.forEach(clearTimeout)
    timerRef.current = []

    if (mode === "realtime") {
      const allLines = sseEvents.flatMap(eventToLines)
      setVisibleLines(allLines)
      prevLengthRef.current = sseEvents.length
      return
    }

    // Animated: only process new events
    const newEvents = sseEvents.slice(prevLengthRef.current)
    prevLengthRef.current = sseEvents.length

    if (newEvents.length === 0) return

    const newLines = newEvents.flatMap(eventToLines)
    let cumulativeDelay = 0

    for (const line of newLines) {
      const delay = DELAYS[line.type] ?? 100
      cumulativeDelay += delay
      const d = cumulativeDelay
      const t = setTimeout(() => {
        setVisibleLines((prev) => [...prev, line])
      }, d)
      timerRef.current.push(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sseEvents, mode])

  // Reset when events are cleared
  useEffect(() => {
    if (sseEvents.length === 0) {
      setVisibleLines([])
      prevLengthRef.current = 0
    }
  }, [sseEvents])

  return visibleLines
}
