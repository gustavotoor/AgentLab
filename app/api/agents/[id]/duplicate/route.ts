import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

type RouteParams = { params: Promise<{ id: string }> }

/**
 * POST /api/agents/[id]/duplicate
 * Creates a copy of an agent for the current user.
 */
export async function POST(_req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const original = await prisma.agent.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!original) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

    const duplicate = await prisma.agent.create({
      data: {
        userId: session.user.id,
        name: `${original.name} (copy)`,
        emoji: original.emoji,
        templateId: original.templateId,
        personality: original.personality,
        tone: original.tone,
        locale: original.locale,
        extraSoul: original.extraSoul,
        systemPrompt: original.systemPrompt,
      },
    })

    return NextResponse.json({ data: duplicate }, { status: 201 })
  } catch (error) {
    console.error('Duplicate agent error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
