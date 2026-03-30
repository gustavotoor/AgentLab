import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { agentSchema } from '@/lib/validations'
import { buildSystemPrompt } from '@/lib/prompts'

type RouteParams = { params: Promise<{ id: string }> }

/**
 * GET /api/agents/[id]
 * Returns a single agent by ID (must belong to current user).
 */
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    const agent = await prisma.agent.findFirst({
      where: { id, userId: session.user.id },
      include: { _count: { select: { conversations: true } } },
    })

    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

    return NextResponse.json({ data: agent })
  } catch (error) {
    console.error('Get agent error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/agents/[id]
 * Updates an agent's configuration (must belong to current user).
 */
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const existing = await prisma.agent.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existing) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

    const body = await req.json()
    const parsed = agentSchema.partial().safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    })

    const merged = { ...existing, ...parsed.data }
    const systemPrompt = buildSystemPrompt(merged, { name: user?.name })

    const agent = await prisma.agent.update({
      where: { id },
      data: { ...parsed.data, systemPrompt },
    })

    return NextResponse.json({ data: agent })
  } catch (error) {
    console.error('Update agent error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/agents/[id]
 * Deletes an agent and all its conversations (must belong to current user).
 */
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const agent = await prisma.agent.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

    await prisma.agent.delete({ where: { id } })

    return NextResponse.json({ message: 'Agent deleted successfully' })
  } catch (error) {
    console.error('Delete agent error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
