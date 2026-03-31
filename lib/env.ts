/**
 * Validates required environment variables at runtime startup.
 * Import this file in any module that needs guaranteed env access (e.g. lib/db.ts).
 *
 * Skipped during `next build` (NEXT_PHASE=phase-production-build) since env vars
 * are not available at build time, only at runtime.
 */

// Skip during static build phase
if (process.env.NEXT_PHASE !== 'phase-production-build') {
  const required = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'ENCRYPTION_KEY',
    'NEXTAUTH_URL',
  ] as const

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`)
    }
  }

  // ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes for AES-256)
  const encKey = process.env.ENCRYPTION_KEY!
  if (!/^[0-9a-fA-F]{64}$/.test(encKey)) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string (openssl rand -hex 32)')
  }

  // NEXTAUTH_SECRET should have enough entropy (minimum 32 characters)
  if (process.env.NEXTAUTH_SECRET!.length < 32) {
    throw new Error('NEXTAUTH_SECRET is too short — generate with: openssl rand -base64 32')
  }
}
