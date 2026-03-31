/**
 * In-memory rate limiter.
 * Suitable for single-instance deployments. For multi-instance, replace with Redis.
 *
 * Usage:
 *   const allowed = rateLimit(`register:${ip}`, 5, 15 * 60 * 1000)
 *   if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
 */

const store = new Map<string, number[]>()

// Periodically clean up expired entries to prevent memory leaks (every 10 min)
if (typeof setInterval !== 'undefined') {
  setInterval(
    () => {
      const now = Date.now()
      for (const [key, timestamps] of store.entries()) {
        // Remove entries older than 1 hour (safe upper bound)
        const alive = timestamps.filter((t) => now - t < 3_600_000)
        if (alive.length === 0) {
          store.delete(key)
        } else {
          store.set(key, alive)
        }
      }
    },
    10 * 60 * 1000
  )
}

/**
 * Returns true if the request is within the allowed rate, false if it should be blocked.
 * @param key      Unique identifier (e.g. `register:${ip}` or `chat:${userId}`)
 * @param limit    Max number of requests allowed within the window
 * @param windowMs Time window in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const windowStart = now - windowMs
  const timestamps = (store.get(key) ?? []).filter((t) => t > windowStart)

  if (timestamps.length >= limit) return false

  timestamps.push(now)
  store.set(key, timestamps)
  return true
}

/** Extracts the best available client IP from a Next.js Request. */
export function getClientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}
