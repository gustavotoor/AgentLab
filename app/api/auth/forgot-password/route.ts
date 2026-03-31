import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { forgotPasswordSchema } from '@/lib/validations'
import { generateToken, getTokenExpiry } from '@/lib/tokens'
import { sendPasswordResetEmail } from '@/lib/email'
import { rateLimitAuth, getClientIp } from '@/lib/rate-limit'

/**
 * POST /api/auth/forgot-password
 * Sends a password reset email to the specified address.
 */
export async function POST(req: Request) {
  try {
    const ip = getClientIp(req)
    if (!(await rateLimitAuth(`forgot-password:${ip}`))) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }

    const body = await req.json()
    const parsed = forgotPasswordSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const { email } = parsed.data
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'If that email exists, a reset link was sent.',
      })
    }

    const { raw, hash } = generateToken()

    await prisma.$transaction([
      prisma.verificationToken.deleteMany({
        where: { userId: user.id, type: 'PASSWORD_RESET', usedAt: null },
      }),
      prisma.verificationToken.create({
        data: {
          userId: user.id,
          token: hash,
          type: 'PASSWORD_RESET',
          expiresAt: getTokenExpiry(1), // 1 hour
        },
      }),
    ])

    await sendPasswordResetEmail(user.email, user.name ?? 'User', raw)

    return NextResponse.json({ message: 'If that email exists, a reset link was sent.' })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
