import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

type RouteParams = { params: Promise<{ agentId: string; conversationId: string }> }

/**
 * GET /api/conversations/[agentId]/[conversationId]
 * Returns all messages for a specific conversation.
 */
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { agentId, conversationId } = await params

    // Verify agent belongs to user
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, userId: session.user.id },
    })

    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, agentId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    return NextResponse.json({ data: conversation })
  } catch (error) {
    console.error('Get conversation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/conversations/[agentId]/[conversationId]
 * Deletes a conversation and all its messages.
 */
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { agentId, conversationId } = await params

    const agent = await prisma.agent.findFirst({
      where: { id: agentId, userId: session.user.id },
    })

    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

    // deleteMany ensures the conversation belongs to this agent (prevents IDOR)
    const { count } = await prisma.conversation.deleteMany({
      where: { id: conversationId, agentId },
    })

    if (count === 0) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Conversation deleted' })
  } catch (error) {
    console.error('Delete conversation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
