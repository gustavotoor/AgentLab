import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

type RouteParams = { params: Promise<{ agentId: string }> }

/**
 * GET /api/conversations/[agentId]
 * Returns all conversations for an agent (must belong to current user).
 */
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { agentId } = await params

    // Verify agent belongs to user
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, userId: session.user.id },
    })

    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

    const conversations = await prisma.conversation.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { messages: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true, createdAt: true, role: true },
        },
      },
    })

    return NextResponse.json({ data: conversations })
  } catch (error) {
    console.error('Get conversations error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
