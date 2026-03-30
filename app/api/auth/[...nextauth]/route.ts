import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * NextAuth.js route handler for all authentication endpoints.
 * Handles /api/auth/signin, /api/auth/signout, /api/auth/session, etc.
 */
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
