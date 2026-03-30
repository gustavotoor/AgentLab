'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MessageBubbleProps {
  message: {
    id: string
    role: 'user' | 'assistant'
    content: string
    createdAt: Date
  }
  agentEmoji?: string
  isStreaming?: boolean
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function MessageBubble({ message, agentEmoji = '🤖', isStreaming = false }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn('flex gap-3 py-2 group', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium select-none',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-xl'
        )}
      >
        {isUser ? 'U' : agentEmoji}
      </div>

      {/* Bubble + meta */}
      <div className={cn('flex flex-col gap-1 max-w-[80%]', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm leading-relaxed relative',
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-muted text-foreground rounded-tl-sm'
          )}
        >
          <div className="whitespace-pre-wrap break-words">
            {message.content}
            {isStreaming && (
              <span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse align-middle" />
            )}
          </div>

          {/* Copy button — assistant only, shown on hover */}
          {!isUser && !isStreaming && (
            <button
              onClick={handleCopy}
              className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex h-6 w-6 items-center justify-center rounded-full bg-background border shadow-sm text-muted-foreground hover:text-foreground"
              title="Copy message"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            </button>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity px-1">
          {formatTime(message.createdAt)}
        </span>
      </div>
    </motion.div>
  )
}
