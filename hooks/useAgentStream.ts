"use client"

import { useCallback, useRef, useState } from "react"
import type { SSEEvent } from "@/types/agent-stream"

export interface AgentMessage {
  id: string
  role: "user" | "assistant"
  content: string
  isStreaming?: boolean
  createdAt: Date
}

interface UseAgentStreamOptions {
  agentId: string
  conversationId: string | null
  onConversationCreated?: (id: string) => void
}

interface UseAgentStreamReturn {
  messages: AgentMessage[]
  streamingContent: string
  isLoading: boolean
  sseEvents: SSEEvent[]
  conversationId: string | null
  sendMessage: (text: string, delayMode?: boolean) => Promise<void>
  setInitialMessages: (msgs: AgentMessage[]) => void
  setConversationId: (id: string | null) => void
}

export function useAgentStream({
  agentId,
  conversationId: initialConvoId,
  onConversationCreated,
}: UseAgentStreamOptions): UseAgentStreamReturn {
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [streamingContent, setStreamingContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sseEvents, setSseEvents] = useState<SSEEvent[]>([])
  const [conversationId, setConversationId] = useState<string | null>(initialConvoId)

  const abortRef = useRef<AbortController | null>(null)

  const setInitialMessages = useCallback((msgs: AgentMessage[]) => {
    setMessages(msgs)
  }, [])

  const sendMessage = useCallback(
    async (text: string, delayMode = false) => {
      if (isLoading) return

      const userMsg: AgentMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        createdAt: new Date(),
      }
      setMessages((prev) => [...prev, userMsg])
      setSseEvents([])
      setStreamingContent("")
      setIsLoading(true)

      abortRef.current?.abort()
      abortRef.current = new AbortController()

      let fullContent = ""
      const assistantId = crypto.randomUUID()

      try {
        const res = await fetch("/api/chat/langgraph", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentId,
            conversationId,
            message: text,
            delayMode,
          }),
          signal: abortRef.current.signal,
        })

        // Extract conversation ID from header
        const newConvoId = res.headers.get("X-Conversation-Id")
        if (newConvoId && newConvoId !== conversationId) {
          setConversationId(newConvoId)
          onConversationCreated?.(newConvoId)
        }

        if (!res.body) throw new Error("No response body")

        // Add streaming placeholder
        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: "assistant", content: "", isStreaming: true, createdAt: new Date() },
        ])

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() ?? ""

          let eventType = ""
          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7).trim()
            } else if (line.startsWith("data: ")) {
              const raw = line.slice(6).trim()
              try {
                const data = JSON.parse(raw)
                const event: SSEEvent = { type: eventType as SSEEvent["type"], data }
                setSseEvents((prev) => [...prev, event])

                if (eventType === "message_chunk" && data.content) {
                  fullContent += data.content
                  setStreamingContent(fullContent)
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, content: fullContent }
                        : m
                    )
                  )
                }
              } catch {
                // ignore parse errors
              }
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("[useAgentStream] Error:", err)
          // Remove placeholder on error
          setMessages((prev) => prev.filter((m) => m.id !== assistantId))
        }
      } finally {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, isStreaming: false } : m
          )
        )
        setStreamingContent("")
        setIsLoading(false)
      }
    },
    [agentId, conversationId, isLoading, onConversationCreated]
  )

  return {
    messages,
    streamingContent,
    isLoading,
    sseEvents,
    conversationId,
    sendMessage,
    setInitialMessages,
    setConversationId,
  }
}
