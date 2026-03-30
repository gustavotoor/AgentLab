'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { AnimatePresence } from 'framer-motion'
import { Send, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MessageBubble } from './MessageBubble'
import type { Agent, Message } from '@prisma/client'

interface ChatWindowProps {
  agent: Agent
  conversationId?: string
  initialMessages?: Message[]
  apiKeyValid: boolean
  onConversationCreated?: (id: string) => void
}

interface StreamMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}

/**
 * Main chat window component with streaming message support.
 * Handles sending messages, streaming AI responses, and conversation state.
 */
export function ChatWindow({
  agent,
  conversationId: initialConversationId,
  initialMessages = [],
  apiKeyValid,
  onConversationCreated,
}: ChatWindowProps) {
  const t = useTranslations('chat')
  const [messages, setMessages] = useState<StreamMessage[]>(
    initialMessages.map((m) => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      createdAt: m.createdAt,
    }))
  )
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [conversationId, setConversationId] = useState(initialConversationId)
  const [error, setError] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent, scrollToBottom])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || isLoading || !apiKeyValid) return

    const userMessage = input.trim()
    setInput('')
    setError('')
    setIsLoading(true)

    // Add user message immediately
    const tempUserMsg: StreamMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMessage,
      createdAt: new Date(),
    }
    setMessages((prev) => [...prev, tempUserMsg])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          conversationId,
          message: userMessage,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to send message')
      }

      // Get conversation ID from header
      const newConvoId = res.headers.get('X-Conversation-Id')
      if (newConvoId && !conversationId) {
        setConversationId(newConvoId)
        onConversationCreated?.(newConvoId)
      }

      // Stream the response
      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let fullContent = ''
      setStreamingContent('')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('0:')) {
            try {
              const text = JSON.parse(line.slice(2))
              fullContent += text
              setStreamingContent(fullContent)
            } catch {
              // Skip malformed chunks
            }
          }
        }
      }

      // Add assistant message
      if (fullContent) {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: fullContent,
            createdAt: new Date(),
          },
        ])
      }
      setStreamingContent('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      // Remove the temp user message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id))
    } finally {
      setIsLoading(false)
      setStreamingContent('')
      textareaRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSubmit()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16 space-y-3">
            <span className="text-5xl">{agent.emoji}</span>
            <div>
              <h3 className="font-semibold">{agent.name}</h3>
              <p className="text-sm text-muted-foreground max-w-xs mt-1">
                {t('startFirst')}
              </p>
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} agentEmoji={agent.emoji} />
          ))}
        </AnimatePresence>

        {/* Streaming message */}
        {streamingContent && (
          <MessageBubble
            message={{
              id: 'streaming',
              role: 'assistant',
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
            <p className="text-sm text-muted-foreground">{t('noApiKey')}</p>
            <Button asChild size="sm" variant="outline">
              <a href="/settings">{t('goToSettings')}</a>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-3 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('messagePlaceholder')}
              rows={1}
              className="min-h-[44px] max-h-[200px] resize-none flex-1"
              disabled={isLoading}
              style={{ height: 'auto' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement
                target.style.height = 'auto'
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
