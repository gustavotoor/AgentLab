import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware that protects (app) routes using NextAuth session checks.
 * Handles:
 * - Redirecting unauthenticated users to /login
 * - Redirecting authenticated users away from auth pages
 * - Preserving callbackUrl for post-login redirects
 */
export default withAuth(
  function middleware(req: NextRequest) {
    const token = (req as NextRequest & { nextauth?: { token: unknown } }).nextauth?.token
    const { pathname } = req.nextUrl

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
