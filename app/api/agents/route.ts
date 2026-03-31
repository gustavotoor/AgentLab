import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { agentSchema } from '@/lib/validations'
import { buildSystemPrompt } from '@/lib/prompts'

/**
 * GET /api/agents
 * Returns all agents for the current user.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const agents = await prisma.agent.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { conversations: true } },
      },
    })

    return NextResponse.json({ data: agents })
  } catch (error) {
    console.error('Get agents error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/agents
 * Creates a new agent for the current user.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = agentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { name, emoji, templateId, personality, tone, locale, extraSoul, langGraphEnabled, availableTools, model, provider } = parsed.data

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    })

    // M5: strip HTML tags from user-supplied text fields to prevent stored XSS
    const stripHtml = (s: string) => s.replace(/<[^>]*>/g, '').trim()

    const agentData = {
      name: stripHtml(name),
      emoji,
      templateId,
      personality: stripHtml(personality),
      tone,
      locale,
      extraSoul: extraSoul ? stripHtml(extraSoul) : extraSoul,
    }

    const systemPrompt = buildSystemPrompt(agentData, { name: user?.name })

    const agent = await prisma.agent.create({
      data: {
        ...agentData,
        systemPrompt,
        langGraphEnabled: langGraphEnabled ?? false,
        availableTools: availableTools ?? [],
        model: model ?? 'claude-sonnet-4-6',
        provider: provider ?? 'anthropic',
        userId: session.user.id,
      },
    })

    return NextResponse.json({ data: agent }, { status: 201 })
  } catch (error) {
    console.error('Create agent error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
