import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashToken } from '@/lib/tokens'

/**
 * GET /api/auth/verify-email?token=...
 * Verifies a user's email address using the provided token.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const rawToken = searchParams.get('token')

    if (!rawToken) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const tokenHash = hashToken(rawToken)

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token: tokenHash },
      include: { user: true },
    })

    if (!verificationToken) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
    }

    if (verificationToken.usedAt) {
      return NextResponse.json({ error: 'Token has already been used' }, { status: 400 })
    }

    if (verificationToken.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Token has expired' }, { status: 400 })
    }

    if (verificationToken.type !== 'EMAIL_VERIFICATION') {
      return NextResponse.json({ error: 'Invalid token type' }, { status: 400 })
    }

    // Mark email as verified and token as used in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: verificationToken.userId },
        data: { emailVerified: new Date() },
      }),
      prisma.verificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() },
      }),
    ])

    return NextResponse.json({ message: 'Email verified successfully' })
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
