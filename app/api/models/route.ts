import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { decrypt } from '@/lib/crypto'

interface AnthropicModel {
  id: string
  display_name: string
  created_at: string
  type: string
}

/**
 * Returns only agentic-capable models (Opus + Sonnet families, no Haiku).
 * Haiku is excluded because it's optimised for speed/cost, not complex agentic workflows.
 */
function isAgentic(id: string): boolean {
  const lower = id.toLowerCase()
  return lower.startsWith('claude') && !lower.includes('haiku')
}

/**
 * GET /api/models
 * Fetches the user's available Anthropic models and filters for agentic ones.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { apiKeyEncrypted: true },
    })

    if (!user?.apiKeyEncrypted) {
      return NextResponse.json(
        { error: 'No API key configured' },
        { status: 402 }
      )
    }

    let apiKey: string
    try {
      apiKey = decrypt(user.apiKeyEncrypted)
    } catch {
      return NextResponse.json({ error: 'Failed to decrypt API key' }, { status: 500 })
    }

    const res = await fetch('https://api.anthropic.com/v1/models?limit=100', {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return NextResponse.json(
        { error: err?.error?.message ?? 'Failed to fetch models from Anthropic' },
        { status: res.status }
      )
    }

    const body = await res.json()
    const all: AnthropicModel[] = body.data ?? []

    const models = all
      .filter((m) => isAgentic(m.id))
      .map((m) => ({ id: m.id, name: m.display_name }))

    return NextResponse.json({ data: models })
  } catch (error) {
    console.error('Models fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
