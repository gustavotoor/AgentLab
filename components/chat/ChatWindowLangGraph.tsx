"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useTranslations } from "next-intl"
import { AnimatePresence } from "framer-motion"
import { Send, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MessageBubble } from "./MessageBubble"
import type { Agent, Message } from "@prisma/client"
import type { SSEEvent } from "@/types/agent-stream"
import { useAgentStream, type AgentMessage } from "@/hooks/useAgentStream"

interface ChatWindowLangGraphProps {
  agent: Agent
  conversationId?: string
  initialMessages?: Message[]
  apiKeyValid: boolean
  onConversationCreated?: (id: string) => void
  onSseEventsChange?: (events: SSEEvent[]) => void
  onStreamingChange?: (isStreaming: boolean) => void
  delayMode?: boolean
}

/**
 * Chat window variant that uses the LangGraph streaming backend.
 * Exposes SSE events and streaming state to the parent (LabPanel).
 */
export function ChatWindowLangGraph({
  agent,
  conversationId: initialConversationId,
  initialMessages = [],
  apiKeyValid,
  onConversationCreated,
  onSseEventsChange,
  onStreamingChange,
  delayMode = false,
}: ChatWindowLangGraphProps) {
  const t = useTranslations("chat")
  const [input, setInput] = useState("")
  const [error, setError] = useState("")

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { messages, streamingContent, isLoading, sseEvents, sendMessage, setInitialMessages } =
    useAgentStream({
      agentId: agent.id,
      conversationId: initialConversationId ?? null,
      onConversationCreated,
    })

  // Load initial messages into the hook
  useEffect(() => {
    if (initialMessages.length > 0) {
      setInitialMessages(
        initialMessages.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          createdAt: m.createdAt,
        }))
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Expose SSE events to parent (LabPanel)
  useEffect(() => {
    onSseEventsChange?.(sseEvents)
  }, [sseEvents, onSseEventsChange])

  // Expose streaming state to parent
  useEffect(() => {
    onStreamingChange?.(isLoading)
  }, [isLoading, onStreamingChange])

  // Auto-scroll
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent, scrollToBottom])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || isLoading || !apiKeyValid) return

    const userMessage = input.trim()
    setInput("")
    setError("")

    try {
      await sendMessage(userMessage, delayMode)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void handleSubmit()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* LangGraph badge */}
      <div className="flex items-center gap-1.5 px-4 py-1.5 border-b border-border bg-background/50">
        <span className="text-xs text-[#58a6ff] font-mono">⬡ langgraph</span>
        <span className="text-xs text-muted-foreground">·</span>
        <span className="text-xs text-muted-foreground font-mono">modo laboratório ativo</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16 space-y-3">
            <span className="text-5xl">{agent.emoji}</span>
            <div>
              <h3 className="font-semibold">{agent.name}</h3>
              <p className="text-sm text-muted-foreground max-w-xs mt-1">
                {t("startFirst")}
              </p>
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((message: AgentMessage) => (
            <MessageBubble
              key={message.id}
              message={message}
              agentEmoji={agent.emoji}
            />
          ))}
        </AnimatePresence>

        {/* Streaming message */}
        {streamingContent && (
          <MessageBubble
            message={{
              id: "streaming",
              role: "assistant",
              content: streamingContent,
              createdAt: new Date(),
            }}
            agentEmoji={agent.emoji}
            isStreaming
          />
        )}

        {/* Thinking indicator */}
        {isLoading && !streamingContent && (
          <div className="flex items-center gap-3 py-2 px-4">
            <span className="text-xl">{agent.emoji}</span>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Input area */}
      <div className="border-t p-4">
        {!apiKeyValid ? (
          <div className="text-center py-4 space-y-3">
            <p className="text-sm text-muted-foreground">{t("noApiKey")}</p>
            <Button asChild size="sm" variant="outline">
              <a href="/settings">{t("goToSettings")}</a>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-3 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("messagePlaceholder")}
              rows={1}
              className="min-h-[44px] max-h-[200px] resize-none flex-1"
              disabled={isLoading}
              style={{ height: "auto" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement
                target.style.height = "auto"
                target.style.height = `${Math.min(target.scrollHeight, 200)}px`
              }}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="h-11 w-11 shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        )}
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
