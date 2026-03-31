import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { encrypt, maskApiKey } from '@/lib/crypto'
import { apiKeySchema } from '@/lib/validations'

/**
 * POST /api/user/api-key
 * Validates, encrypts, and saves the user's Anthropic API key.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = apiKeySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { apiKey } = parsed.data

    // M3: Validate key against Anthropic API before saving
    try {
      const testRes = await fetch('https://api.anthropic.com/v1/models', {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
      })
      if (testRes.status === 401 || testRes.status === 403) {
        return NextResponse.json({ error: 'Invalid API key. Please check and try again.' }, { status: 400 })
      }
    } catch {
      // Network error — allow save anyway to not block users on transient failures
    }

    // Encrypt and save
    const encrypted = encrypt(apiKey)
    const masked = maskApiKey(apiKey)

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        apiKeyEncrypted: encrypted,
        apiKeyMasked: masked,
        apiKeyValid: true,
      },
    })

    return NextResponse.json({
      data: { masked, valid: true },
      message: 'API key saved successfully',
    })
  } catch (error) {
    console.error('API key save error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/user/api-key
 * Removes the stored API key for the current user.
 */
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        apiKeyEncrypted: null,
        apiKeyMasked: null,
        apiKeyValid: false,
      },
    })

    return NextResponse.json({ message: 'API key removed' })
  } catch (error) {
    console.error('API key delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
