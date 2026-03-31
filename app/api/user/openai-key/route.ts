import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { encrypt, maskApiKey } from '@/lib/crypto'
import { openaiKeySchema } from '@/lib/validations'

/**
 * POST /api/user/openai-key
 * Validates, encrypts, and saves the user's OpenAI API key.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = openaiKeySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { apiKey } = parsed.data

    const encrypted = encrypt(apiKey)
    const masked = maskApiKey(apiKey)

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        openaiKeyEncrypted: encrypted,
        openaiKeyMasked: masked,
        openaiKeyValid: true,
      },
    })

    return NextResponse.json({
      data: { masked, valid: true },
      message: 'OpenAI API key saved successfully',
    })
  } catch (error) {
    console.error('OpenAI API key save error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/user/openai-key
 * Removes the stored OpenAI API key for the current user.
 */
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        openaiKeyEncrypted: null,
        openaiKeyMasked: null,
        openaiKeyValid: false,
      },
    })

    return NextResponse.json({ message: 'OpenAI API key removed' })
  } catch (error) {
    console.error('OpenAI API key delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
