'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Trash2, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, truncate } from '@/lib/utils'
import type { Conversation } from '@prisma/client'

interface ConversationWithStats extends Conversation {
  _count: { messages: number }
  messages: { content: string; role: string; createdAt: Date }[]
}

interface ConversationSidebarProps {
  agentId: string
  conversations: ConversationWithStats[]
  currentConversationId?: string
  onNewConversation: () => void
  onSelectConversation: (id: string) => void
}

/**
 * Sidebar listing all conversations for an agent.
 * Handles creation, selection, and deletion of conversations.
 */
export function ConversationSidebar({
  agentId,
  conversations: initialConversations,
  currentConversationId,
  onNewConversation,
  onSelectConversation,
}: ConversationSidebarProps) {
  const t = useTranslations('chat')
  const [conversations, setConversations] = useState(initialConversations)

  const handleDelete = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation()
    try {
      const res = await fetch(`/api/conversations/${agentId}/${conversationId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== conversationId))
        if (currentConversationId === conversationId) {
          onNewConversation()
        }
      }
    } catch {
      // Silent fail
    }
  }

  return (
    <div className="flex flex-col h-full border-r bg-muted/20 w-64 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="text-sm font-semibold">{t('conversations')}</h3>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onNewConversation}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>{t('noConversations')}</p>
          </div>
        ) : (
          conversations.map((convo) => {
            const lastMessage = convo.messages[0]
            return (
              <button
                key={convo.id}
                onClick={() => onSelectConversation(convo.id)}
                className={cn(
                  'w-full text-left rounded-lg p-3 text-sm transition-colors group flex items-start justify-between gap-2',
                  currentConversationId === convo.id
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted text-foreground'
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-xs">
                    {convo.title ?? 'New conversation'}
                  </p>
                  {lastMessage && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {truncate(lastMessage.content, 50)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground/50 mt-1">
                    {convo._count.messages} messages
                  </p>
                </div>
                <button
                  onClick={(e) => handleDelete(e, convo.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
