import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Login rate limiter — created lazily (Edge-compatible via Upstash REST API)
let loginRateLimiter: Ratelimit | null = null
function getLoginRateLimiter(): Ratelimit | null {
  if (loginRateLimiter) return loginRateLimiter
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    loginRateLimiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, '15 m'),
      prefix: 'rl:login',
      analytics: false,
    })
  }
  return loginRateLimiter
}

/**
 * Middleware that protects (app) routes using NextAuth session checks.
 * Handles:
 * - Redirecting unauthenticated users to /login
 * - Redirecting authenticated users away from auth pages
 * - Preserving callbackUrl for post-login redirects
 */
export default withAuth(
  async function middleware(req: NextRequest) {
    const token = (req as NextRequest & { nextauth?: { token: unknown } }).nextauth?.token
    const { pathname } = req.nextUrl

    // H2: Rate limit login attempts to prevent brute force
    if (pathname === '/api/auth/callback/credentials' && req.method === 'POST') {
      const limiter = getLoginRateLimiter()
      if (limiter) {
        const ip =
          req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
          req.headers.get('x-real-ip') ??
          'unknown'
        const { success } = await limiter.limit(`login:${ip}`)
        if (!success) {
          return NextResponse.json(
            { error: 'Too many login attempts. Please try again later.' },
            { status: 429 }
          )
        }
      }
    }

    // Auth pages: redirect authenticated users to dashboard
    const authPages = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email']
    if (authPages.some((p) => pathname.startsWith(p)) && token) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      /**
       * Determines if a request is authorized.
       * Returns true for public routes, requires token for protected routes.
       */
      authorized({ token, req }) {
        const { pathname } = req.nextUrl

        // Public routes - always allow
        const publicRoutes = [
          '/',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
          '/verify-email',
        ]

        if (publicRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'))) {
          return true
        }

        // API auth routes - always allow
        if (pathname.startsWith('/api/auth/')) {
          return true
        }

        // Protected routes require a token
        return !!token
      },
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
