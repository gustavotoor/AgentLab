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

    const [totalAgents, totalConversations, totalMessages, recentAgents] = await Promise.all([
      prisma.agent.count({ where: { userId: session.user.id } }),
      prisma.conversation.count({ where: { agent: { userId: session.user.id } } }),
      prisma.message.count({ where: { conversation: { agent: { userId: session.user.id } } } }),
      prisma.agent.findMany({
        where: { userId: session.user.id },
        orderBy: { updatedAt: 'desc' },
        take: 4,
        include: { _count: { select: { conversations: true } } },
      }),
    ])

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
