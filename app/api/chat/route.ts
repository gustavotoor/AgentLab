import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { streamText } from 'ai'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { decrypt } from '@/lib/crypto'
import { createModelForProvider } from '@/lib/ai'

export const maxDuration = 60

/**
 * POST /api/chat
 * Streaming chat endpoint. Accepts agentId + conversationId + message,
 * loads history, calls the agent's configured provider via user's BYOK,
 * streams response, and saves both messages on completion.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { agentId, conversationId, message } = await req.json()

    if (!agentId || !message) {
      return NextResponse.json({ error: 'agentId and message are required' }, { status: 400 })
    }

    // Verify agent belongs to user
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, userId: session.user.id },
    })

    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

    const provider = agent.provider ?? 'anthropic'
    const isOpenAI = provider === 'openai'

    // Get user's API key for the agent's provider
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        apiKeyEncrypted: true,
        openaiKeyEncrypted: true,
        apiKeyValid: true,
        name: true,
      },
    })

    const encryptedKey = isOpenAI ? user?.openaiKeyEncrypted : user?.apiKeyEncrypted
    const providerLabel = isOpenAI ? 'OpenAI' : 'Anthropic'

    if (!encryptedKey) {
      return NextResponse.json(
        { error: `No API key configured. Please add your ${providerLabel} API key in settings.` },
        { status: 402 }
      )
    }

    // Decrypt API key
    let apiKey: string
    try {
      apiKey = decrypt(encryptedKey)
    } catch {
      return NextResponse.json({ error: 'Failed to decrypt API key' }, { status: 500 })
    }

    // Get or create conversation
    let convoId = conversationId
    if (!convoId) {
      const convo = await prisma.conversation.create({
        data: { agentId, title: null },
      })
      convoId = convo.id
    } else {
      // Verify conversation belongs to this agent
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

    // Load conversation history (last 20 messages)
    const history = await prisma.message.findMany({
      where: { conversationId: convoId },
      orderBy: { createdAt: 'asc' },
      take: 20,
    })

    // Save user message
    await prisma.message.create({
      data: {
        conversationId: convoId,
        role: 'user',
        content: message,
      },
    })

    // Build messages array for the AI
    const messages = [
      ...history.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ]

    // Create AI model with user's key, provider, and agent's chosen model
    const model = createModelForProvider(apiKey, provider, agent.model ?? undefined)

    // Stream response
    const result = streamText({
      model,
      system: agent.systemPrompt,
      messages,
      onFinish: async ({ text }) => {
        try {
          // Save assistant message
          await prisma.message.create({
            data: {
              conversationId: convoId,
              role: 'assistant',
              content: text,
            },
          })

          // Set conversation title from first message if not set
          const convo = await prisma.conversation.findUnique({
            where: { id: convoId },
            select: { title: true, _count: { select: { messages: true } } },
          })

          if (!convo?.title && (convo?._count?.messages ?? 0) <= 2) {
            const title = message.slice(0, 60) + (message.length > 60 ? '...' : '')
            await prisma.conversation.update({
              where: { id: convoId },
              data: { title },
            })
          }

          // Increment agent chat count
          await prisma.agent.update({
            where: { id: agentId },
            data: { totalChats: { increment: 1 } },
          })
        } catch (err) {
          console.error('Failed to save assistant message:', err)
        }
      },
    })

    // Add conversationId to response headers
    const response = result.toDataStreamResponse()
    const headers = new Headers(response.headers)
    headers.set('X-Conversation-Id', convoId)

    return new Response(response.body, {
      status: response.status,
      headers,
    })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
