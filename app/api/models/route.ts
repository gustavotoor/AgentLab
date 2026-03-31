import { NextRequest, NextResponse } from 'next/server'
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

interface OpenAIModel {
  id: string
  object: string
  created: number
  owned_by: string
}

/**
 * Returns only agentic-capable Anthropic models (Opus + Sonnet families, no Haiku).
 */
function isAgenticAnthropic(id: string): boolean {
  const lower = id.toLowerCase()
  return lower.startsWith('claude') && !lower.includes('haiku')
}

/**
 * Returns only modern agentic OpenAI models: GPT-5.x, o3, and o4 families.
 * Older generations (gpt-4, gpt-3.5, o1, gpt-4o, etc.) are excluded.
 */
function isAgenticOpenAI(id: string): boolean {
  // Allow gpt-5 exactly or gpt-5.x variants (e.g. gpt-5.2)
  const isGpt5 = /^gpt-5(\.|$)/.test(id)
  // Allow o3 and o3-* variants (e.g. o3-mini)
  const isO3 = /^o3(-|$)/.test(id)
  // Allow o4 and o4-* variants (e.g. o4-mini)
  const isO4 = /^o4(-|$)/.test(id)

  if (!isGpt5 && !isO3 && !isO4) return false

  // Exclude non-text modalities
  return !id.includes('embedding') &&
    !id.includes('audio') &&
    !id.includes('realtime') &&
    !id.includes('search')
}

/**
 * Formats an OpenAI model ID into a human-readable display name.
 * e.g. "gpt-5.2" → "GPT-5.2", "o4-mini" → "O4 Mini"
 */
function formatOpenAIModelName(id: string): string {
  if (/^gpt-5/.test(id)) {
    // "gpt-5" → "GPT-5", "gpt-5.2" → "GPT-5.2"
    return id.replace(/^gpt-/, 'GPT-')
  }
  // "o3" → "O3", "o3-mini" → "O3 Mini", "o4-mini" → "O4 Mini"
  return id
    .replace(/^(o\d)/, (m) => m.toUpperCase())
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * GET /api/models?provider=anthropic|openai
 * Fetches available agentic models for the requested provider.
 * Defaults to anthropic if no provider param is supplied.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const provider = req.nextUrl.searchParams.get('provider') ?? 'anthropic'

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { apiKeyEncrypted: true, openaiKeyEncrypted: true },
    })

    if (provider === 'openai') {
      if (!user?.openaiKeyEncrypted) {
        return NextResponse.json({ error: 'No OpenAI API key configured' }, { status: 402 })
      }

      let apiKey: string
      try {
        apiKey = decrypt(user.openaiKeyEncrypted)
      } catch {
        return NextResponse.json({ error: 'Failed to decrypt OpenAI API key' }, { status: 500 })
      }

      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: 'no-store',
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        return NextResponse.json(
          { error: err?.error?.message ?? 'Failed to fetch models from OpenAI' },
          { status: res.status }
        )
      }

      const body = await res.json()
      const all: OpenAIModel[] = body.data ?? []

      const models = all
        .filter((m) => isAgenticOpenAI(m.id))
        .sort((a, b) => b.created - a.created)
        .map((m) => ({ id: m.id, name: formatOpenAIModelName(m.id), provider: 'openai' }))

      return NextResponse.json({ data: models })
    }

    // Default: Anthropic
    if (!user?.apiKeyEncrypted) {
      return NextResponse.json({ error: 'No Anthropic API key configured' }, { status: 402 })
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
      .filter((m) => isAgenticAnthropic(m.id))
      .map((m) => ({ id: m.id, name: m.display_name, provider: 'anthropic' }))

    return NextResponse.json({ data: models })
  } catch (error) {
    console.error('Models fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
