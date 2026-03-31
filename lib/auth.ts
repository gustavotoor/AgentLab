import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

/**
 * NextAuth v4 configuration with Credentials provider.
 * Handles email/password authentication with email verification check.
 */
export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      /**
       * Authorizes a user login attempt.
       * Checks credentials, email verification, and returns user data.
       */
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        })

        if (!user || !user.password) {
          throw new Error('Invalid email or password')
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
        if (!isPasswordValid) {
          throw new Error('Invalid email or password')
        }

        if (!user.emailVerified) {
          throw new Error('EMAIL_NOT_VERIFIED')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          onboardingDone: user.onboardingDone,
          apiKeyValid: user.apiKeyValid,
          locale: user.locale,
          theme: user.theme,
        }
      },
    }),
  ],
  callbacks: {
    /**
     * JWT callback — persists custom fields into the token.
     */
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.onboardingDone = (user as { onboardingDone?: boolean }).onboardingDone ?? false
        token.apiKeyValid = (user as { apiKeyValid?: boolean }).apiKeyValid ?? false
        token.locale = (user as { locale?: string }).locale ?? 'pt-BR'
        token.theme = (user as { theme?: string }).theme ?? 'light'
      }

      // Handle session update trigger (e.g. after onboarding completes)
      if (trigger === 'update' && session) {
        if (session.onboardingDone !== undefined) token.onboardingDone = session.onboardingDone
        if (session.apiKeyValid !== undefined) token.apiKeyValid = session.apiKeyValid
        if (session.locale !== undefined) token.locale = session.locale
        if (session.theme !== undefined) token.theme = session.theme
        if (session.name !== undefined) token.name = session.name
      }

      return token
    },
    /**
     * Session callback — exposes token fields to the client session.
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.onboardingDone = token.onboardingDone as boolean
        session.user.apiKeyValid = token.apiKeyValid as boolean
        session.user.locale = token.locale as string
        session.user.theme = token.theme as string
      }
      return session
    },
  },
}
