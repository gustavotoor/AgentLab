'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Edit2, FlaskConical, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { ChatWindowLangGraph } from '@/components/chat/ChatWindowLangGraph'
import { ConversationSidebar } from '@/components/chat/ConversationSidebar'
import { LabPanel } from '@/components/lab/LabPanel'
import { PageLoader } from '@/components/shared/LoadingSpinner'
import type { Agent, Conversation, Message } from '@prisma/client'
import type { SSEEvent } from '@/types/agent-stream'

interface ConversationWithStats extends Conversation {
  _count: { messages: number }
  messages: { content: string; role: string; createdAt: Date }[]
}

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ convoId?: string }>
}

export default function AgentChatPage({ params, searchParams }: PageProps) {
  const { data: session } = useSession()
  const router = useRouter()

  const [agentId, setAgentId] = useState<string | null>(null)
  const [agent, setAgent] = useState<Agent | null>(null)
  const [conversations, setConversations] = useState<ConversationWithStats[]>([])
  const [currentConvoId, setCurrentConvoId] = useState<string | undefined>(undefined)
  const [currentMessages, setCurrentMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // LangGraph lab state
  const [sseEvents, setSseEvents] = useState<SSEEvent[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [delayMode, setDelayMode] = useState(false)
  const [labOpen, setLabOpen] = useState(true)

  useEffect(() => {
    async function init() {
      const { id } = await params
      const { convoId } = await searchParams
      setAgentId(id)

      try {
        const [agentRes, convosRes] = await Promise.all([
          fetch(`/api/agents/${id}`),
          fetch(`/api/conversations/${id}`),
        ])

        if (!agentRes.ok) {
          router.push('/agents')
          return
        }

        const agentData = await agentRes.json()
        const convosData = await convosRes.json()

        setAgent(agentData.data)
        setConversations(convosData.data ?? [])

        if (convoId) {
          setCurrentConvoId(convoId)
          const messagesRes = await fetch(`/api/conversations/${id}/${convoId}`)
          if (messagesRes.ok) {
            const messagesData = await messagesRes.json()
            setCurrentMessages(messagesData.data?.messages ?? [])
          }
        }
      } catch {
        router.push('/agents')
      } finally {
        setIsLoading(false)
      }
    }

    void init()
  }, [params, searchParams, router])

  const handleNewConversation = () => {
    setCurrentConvoId(undefined)
    setCurrentMessages([])
    setSseEvents([])
  }

  const handleSelectConversation = async (convoId: string) => {
    if (!agentId) return
    setCurrentConvoId(convoId)
    setSseEvents([])

    try {
      const res = await fetch(`/api/conversations/${agentId}/${convoId}`)
      if (res.ok) {
        const data = await res.json()
        setCurrentMessages(data.data?.messages ?? [])
      }
    } catch {
      // Silent fail
    }
  }

  const handleConversationCreated = useCallback((newConvoId: string) => {
    setCurrentConvoId(newConvoId)
    if (agentId) {
      fetch(`/api/conversations/${agentId}`)
        .then((r) => r.json())
        .then((d) => setConversations(d.data ?? []))
        .catch(() => {})
    }
  }, [agentId])

  if (isLoading || !agent) {
    return <PageLoader label="Loading agent..." />
  }

  const isLangGraph = agent.langGraphEnabled
  const showLab = isLangGraph && labOpen

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <header className="flex h-14 items-center justify-between border-b px-4 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{agent.emoji}</span>
          <div>
            <h1 className="text-sm font-semibold">{agent.name}</h1>
            <p className="text-xs text-muted-foreground capitalize">{agent.tone} · {agent.locale}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isLangGraph && (
            <Button
              variant={labOpen ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setLabOpen(!labOpen)}
              className="gap-1.5"
            >
              <FlaskConical className="h-4 w-4" />
              Lab
            </Button>
          )}
          <Button asChild variant="ghost" size="sm">
            <Link href={`/agents/${agent.id}/edit`}>
              <Edit2 className="h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </header>

      {/* Chat + Lab area */}
      <div className="flex flex-1 overflow-hidden">
        <ConversationSidebar
          agentId={agent.id}
          conversations={conversations}
          currentConversationId={currentConvoId}
          onNewConversation={handleNewConversation}
          onSelectConversation={handleSelectConversation}
        />

        {/* Chat window */}
        <div className={`flex-1 overflow-hidden ${showLab ? 'border-r border-border' : ''}`}>
          {isLangGraph ? (
            <ChatWindowLangGraph
              key={currentConvoId ?? 'new'}
              agent={agent}
              conversationId={currentConvoId}
              initialMessages={currentMessages}
              apiKeyValid={session?.user?.apiKeyValid ?? false}
              onConversationCreated={handleConversationCreated}
              onSseEventsChange={setSseEvents}
              onStreamingChange={setIsStreaming}
              delayMode={delayMode}
            />
          ) : (
            <ChatWindow
              key={currentConvoId ?? 'new'}
              agent={agent}
              conversationId={currentConvoId}
              initialMessages={currentMessages}
              apiKeyValid={session?.user?.apiKeyValid ?? false}
              onConversationCreated={handleConversationCreated}
            />
          )}
        </div>

        {/* Lab Panel */}
        {showLab && (
          <div className="w-[380px] shrink-0 overflow-hidden flex flex-col">
            <LabPanel
              sseEvents={sseEvents}
              isStreaming={isStreaming}
              delayMode={delayMode}
              onDelayModeChange={setDelayMode}
            />
          </div>
        )}
      </div>
    </div>
  )
}
