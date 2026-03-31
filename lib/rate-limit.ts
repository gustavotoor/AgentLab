/**
 * Rate limiter backed by Upstash Redis (production-safe, works across serverless instances).
 * Falls back to in-memory store when Upstash env vars are not configured (local dev only).
 *
 * Required env vars for production (configure in Dokploy dashboard):
 *   UPSTASH_REDIS_REST_URL   — from upstash.com console
 *   UPSTASH_REDIS_REST_TOKEN — from upstash.com console
 */
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ---------------------------------------------------------------------------
// Upstash-backed limiters (created lazily, only if env vars present)
// ---------------------------------------------------------------------------

let _authLimiter: Ratelimit | null = null
let _chatLimiter: Ratelimit | null = null
let _loginLimiter: Ratelimit | null = null

function getRedis(): Redis | null {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return Redis.fromEnv()
  }
  return null
}

function getAuthLimiter(): Ratelimit | null {
  if (_authLimiter) return _authLimiter
  const redis = getRedis()
  if (!redis) return null
  _authLimiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '15 m'), prefix: 'rl:auth', analytics: false })
  return _authLimiter
}

function getChatLimiter(): Ratelimit | null {
  if (_chatLimiter) return _chatLimiter
  const redis = getRedis()
  if (!redis) return null
  _chatLimiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, '1 h'), prefix: 'rl:chat', analytics: false })
  return _chatLimiter
}

function getLoginLimiter(): Ratelimit | null {
  if (_loginLimiter) return _loginLimiter
  const redis = getRedis()
  if (!redis) return null
  _loginLimiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '15 m'), prefix: 'rl:login', analytics: false })
  return _loginLimiter
}

// ---------------------------------------------------------------------------
// In-memory fallback (single-instance / local dev only)
// ---------------------------------------------------------------------------

const memStore = new Map<string, number[]>()

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, ts] of memStore.entries()) {
      const alive = ts.filter((t) => now - t < 3_600_000)
      if (alive.length === 0) memStore.delete(key)
      else memStore.set(key, alive)
    }
  }, 10 * 60 * 1000)
}

function memRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const recent = (memStore.get(key) ?? []).filter((t) => t > now - windowMs)
  if (recent.length >= limit) return false
  recent.push(now)
  memStore.set(key, recent)
  return true
}

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

/**
 * Rate limit for authentication endpoints (register, forgot-password, resend-verification).
 * Limit: 5 requests per 15 minutes per IP.
 */
export async function rateLimitAuth(key: string): Promise<boolean> {
  const limiter = getAuthLimiter()
  if (limiter) {
    const { success } = await limiter.limit(key)
    return success
  }
  if (process.env.NODE_ENV === 'production') {
    console.warn('[rate-limit] UPSTASH_REDIS_REST_URL not set — rate limiting disabled in production!')
  }
  return memRateLimit(key, 5, 15 * 60 * 1000)
}

/**
 * Rate limit for chat endpoints.
 * Limit: 30 requests per hour per user ID.
 */
export async function rateLimitChat(key: string): Promise<boolean> {
  const limiter = getChatLimiter()
  if (limiter) {
    const { success } = await limiter.limit(key)
    return success
  }
  if (process.env.NODE_ENV === 'production') {
    console.warn('[rate-limit] UPSTASH_REDIS_REST_URL not set — rate limiting disabled in production!')
  }
  return memRateLimit(key, 30, 60 * 60 * 1000)
}

/**
 * Rate limit for login endpoint.
 * Limit: 10 attempts per 15 minutes per IP.
 * Edge-compatible (uses Upstash REST API).
 */
export async function rateLimitLogin(key: string): Promise<boolean> {
  const limiter = getLoginLimiter()
  if (limiter) {
    const { success } = await limiter.limit(key)
    return success
  }
  return memRateLimit(key, 10, 15 * 60 * 1000)
}

/** Extracts the best available client IP from a Next.js Request. */
export function getClientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}
