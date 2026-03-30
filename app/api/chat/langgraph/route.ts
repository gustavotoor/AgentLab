import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { randomUUID } from 'crypto'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { decrypt } from '@/lib/crypto'
import { getTemplateById } from '@/lib/prompts'
import { sanitize } from '@/lib/sanitizer'

export const maxDuration = 120

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || 'http://localhost:8000'
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || ''

/**
 * POST /api/chat/langgraph
 * LangGraph streaming bridge. Decrypts BYOK key, forwards to Python backend,
 * proxies the SSE stream, and saves messages to Prisma on completion.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { agentId, conversationId, message, delayMode } = await req.json()

    if (!agentId || !message) {
      return NextResponse.json({ error: 'agentId and message are required' }, { status: 400 })
    }

    // Sanitize input before any processing
    const { text: cleanMessage, injectionDetected } = sanitize(message)
    if (injectionDetected) {
      // Still allow through — Python will handle safely with injection_detected flag
      // But log server-side
      console.warn('[langgraph] Injection pattern detected in message from user:', session.user.id)
    }

    // Verify agent belongs to user and has LangGraph enabled
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, userId: session.user.id },
    })

    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

    if (!agent.langGraphEnabled) {
      return NextResponse.json(
        { error: 'LangGraph is not enabled for this agent' },
        { status: 403 }
      )
    }

    // Get user's API key
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { apiKeyEncrypted: true, name: true },
    })

    if (!user?.apiKeyEncrypted) {
      return NextResponse.json(
        { error: 'No API key configured. Please add your Anthropic API key in settings.' },
        { status: 402 }
      )
    }

    let apiKey: string
    try {
      apiKey = decrypt(user.apiKeyEncrypted)
    } catch {
      return NextResponse.json({ error: 'Failed to decrypt API key' }, { status: 500 })
    }

    // Get or create conversation
    let convoId = conversationId as string | null
    if (!convoId) {
      const convo = await prisma.conversation.create({
        data: { agentId, title: null },
      })
      convoId = convo.id
    } else {
      const convo = await prisma.conversation.findFirst({
        where: { id: convoId, agentId },
      })
      if (!convo) {
        const newConvo = await prisma.conversation.create({
          data: { agentId, title: null },
        })
        convoId = newConvo.id
      }
    }

    // Save user message to DB immediately
    await prisma.message.create({
      data: { conversationId: convoId, role: 'user', content: message },
    })

    // Resolve template personality from Next.js (avoids Python duplication)
    const template = getTemplateById(agent.templateId)
    const templatePersonality = template?.personality ?? ''

    // Build agent_config payload for Python
    const agentConfig = {
      name: agent.name,
      emoji: agent.emoji,
      personality: agent.personality,
      template_personality: templatePersonality,
      tone: agent.tone,
      locale: agent.locale,
      extra_soul: agent.extraSoul ?? null,
      template_id: agent.templateId,
      available_tools: agent.availableTools,
      api_key: apiKey,
      lang_graph_enabled: true,
    }

    const sessionId = randomUUID()

    const pythonBody = JSON.stringify({
      message: cleanMessage,
      agent_config: agentConfig,
      session_id: sessionId,
      conversation_id: convoId,
      delay_mode: Boolean(delayMode),
    })

    // Forward request to Python LangGraph backend
    const pythonRes = await fetch(`${BACKEND_URL}/agent/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': INTERNAL_SECRET,
      },
      body: pythonBody,
      // @ts-ignore — duplex required for streaming body in Node.js 18+
      duplex: 'half',
      cache: 'no-store',
    })

    if (!pythonRes.ok || !pythonRes.body) {
      const errText = await pythonRes.text().catch(() => 'Unknown error')
      console.error('[langgraph] Python backend error:', errText)
      return NextResponse.json({ error: 'LangGraph backend error' }, { status: 502 })
    }

    // Proxy SSE stream — accumulate content to save assistant message on done
    let fullContent = ''
    let saveTriggered = false

    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk)

        // Extract message_chunk content for accumulation
        const lines = text.split('\n')
        for (const line of lines) {
          if (line.startsWith('data:')) {
            try {
              const data = JSON.parse(line.slice(5).trim())
              if (data.content && typeof data.content === 'string') {
                fullContent += data.content
              }
            } catch {
              // non-JSON line, skip
            }
          }
          if (line.startsWith('event: done') || line.includes('"type":"done"')) {
            if (!saveTriggered) {
              saveTriggered = true
              // Save assistant message async (fire and forget)
              saveAssistantMessage(convoId!, agentId, message, fullContent).catch((e) =>
                console.error('[langgraph] Failed to save assistant message:', e)
              )
            }
          }
        }

        controller.enqueue(chunk)
      },
    })

    const responseStream = pythonRes.body.pipeThrough(transformStream)

    return new Response(responseStream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
        'X-Conversation-Id': convoId,
      },
    })
  } catch (error) {
    console.error('[langgraph] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function saveAssistantMessage(
  convoId: string,
  agentId: string,
  userMessage: string,
  assistantContent: string
) {
  if (!assistantContent.trim()) return

  await prisma.message.create({
    data: { conversationId: convoId, role: 'assistant', content: assistantContent },
  })

  // Set conversation title from first user message if not set
  const convo = await prisma.conversation.findUnique({
    where: { id: convoId },
    select: { title: true, _count: { select: { messages: true } } },
  })

  if (!convo?.title && (convo?._count?.messages ?? 0) <= 2) {
    const title = userMessage.slice(0, 60) + (userMessage.length > 60 ? '...' : '')
    await prisma.conversation.update({ where: { id: convoId }, data: { title } })
  }

  await prisma.agent.update({
    where: { id: agentId },
    data: { totalChats: { increment: 1 } },
  })
}
