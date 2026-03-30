import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * GET /api/dashboard
 * Returns dashboard statistics for the current user.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [totalAgents, agentsWithConvos, recentAgents] = await Promise.all([
      prisma.agent.count({ where: { userId: session.user.id } }),
      prisma.agent.findMany({
        where: { userId: session.user.id },
        include: {
          _count: { select: { conversations: true } },
          conversations: {
            include: { _count: { select: { messages: true } } },
          },
        },
      }),
      prisma.agent.findMany({
        where: { userId: session.user.id },
        orderBy: { updatedAt: 'desc' },
        take: 4,
        include: { _count: { select: { conversations: true } } },
      }),
    ])

    const totalConversations = agentsWithConvos.reduce(
      (sum, a) => sum + a._count.conversations,
      0
    )

    const totalMessages = agentsWithConvos.reduce(
      (sum, a) =>
        sum + a.conversations.reduce((s, c) => s + c._count.messages, 0),
      0
    )

    return NextResponse.json({
      data: {
        totalAgents,
        totalConversations,
        totalMessages,
        recentAgents,
      },
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
