import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateToken, getTokenExpiry } from '@/lib/tokens'
import { sendVerificationEmail } from '@/lib/email'

/**
 * POST /api/auth/resend-verification
 * Resends the email verification link to an unverified user.
 */
export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ message: 'If that email exists, a verification link was sent.' })
    }

    if (user.emailVerified) {
      return NextResponse.json({ message: 'Email is already verified.' })
    }

    const { raw, hash } = generateToken()

    // Delete old tokens and create new one
    await prisma.$transaction([
      prisma.verificationToken.deleteMany({
        where: { userId: user.id, type: 'EMAIL_VERIFICATION', usedAt: null },
      }),
      prisma.verificationToken.create({
        data: {
          userId: user.id,
          token: hash,
          type: 'EMAIL_VERIFICATION',
          expiresAt: getTokenExpiry(24),
        },
      }),
    ])

    await sendVerificationEmail(user.email, user.name ?? 'User', raw)

    return NextResponse.json({ message: 'Verification email sent.' })
  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
