import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { registerSchema } from '@/lib/validations'
import { generateToken, getTokenExpiry } from '@/lib/tokens'
import { sendVerificationEmail } from '@/lib/email'

/**
 * POST /api/auth/register
 * Creates a new user account and sends email verification.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { name, email, password } = parsed.data

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate verification token
    const { raw, hash } = generateToken()

    // Create user + verification token in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
        },
      })

      await tx.verificationToken.create({
        data: {
          userId: newUser.id,
          token: hash,
          type: 'EMAIL_VERIFICATION',
          expiresAt: getTokenExpiry(24),
        },
      })

      return newUser
    })

    // Send verification email (non-blocking)
    sendVerificationEmail(user.email, user.name ?? 'User', raw).catch((err) => {
      console.error('Failed to send verification email:', err)
    })

    return NextResponse.json(
      { message: 'Account created. Please check your email to verify your account.' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
