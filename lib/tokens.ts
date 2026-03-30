import { randomBytes, createHash } from 'crypto'

/**
 * Generates a cryptographically secure random token with its SHA-256 hash.
 * The raw token is sent to the user, the hash is stored in the database.
 * @returns {{ raw: string; hash: string }} Object containing the raw token and its hash
 */
export function generateToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString('hex')
  const hash = createHash('sha256').update(raw).digest('hex')
  return { raw, hash }
}

/**
 * Hashes a token using SHA-256 for database lookup.
 * @param {string} raw - The raw token string
 * @returns {string} The SHA-256 hash of the token
 */
export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

/**
 * Returns the expiry date for a token.
 * @param {number} hours - Number of hours until expiry (default: 24)
 * @returns {Date} The expiry date
 */
export function getTokenExpiry(hours = 24): Date {
  const date = new Date()
  date.setHours(date.getHours() + hours)
  return date
}
