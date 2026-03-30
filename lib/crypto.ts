import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'

/**
 * Retrieves the encryption key from environment variables.
 * The key must be a 64-character hex string (32 bytes).
 * @throws {Error} If ENCRYPTION_KEY is not set
 * @returns {Buffer} The encryption key as a Buffer
 */
function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) throw new Error('ENCRYPTION_KEY not set')
  if (key.length !== 64) throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)')
  return Buffer.from(key, 'hex')
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * @param {string} text - The plaintext to encrypt
 * @returns {string} Encrypted string in format "iv:authTag:encrypted" (all hex)
 */
export function encrypt(text: string): string {
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [iv.toString('hex'), authTag.toString('hex'), encrypted.toString('hex')].join(':')
}

/**
 * Decrypts an AES-256-GCM encrypted string.
 * @param {string} encryptedText - The encrypted string in format "iv:authTag:encrypted"
 * @returns {string} The decrypted plaintext
 * @throws {Error} If decryption fails or the auth tag is invalid
 */
export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':')
  if (parts.length !== 3) throw new Error('Invalid encrypted text format')
  const [ivHex, authTagHex, encryptedHex] = parts
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const encrypted = Buffer.from(encryptedHex, 'hex')
  const decipher = createDecipheriv(ALGORITHM, getKey(), iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}

/**
 * Creates a masked version of an API key for display purposes.
 * Shows the first 7 characters and the last 4 characters.
 * @param {string} apiKey - The full API key
 * @returns {string} The masked API key (e.g., "sk-ant-...abcd")
 */
export function maskApiKey(apiKey: string): string {
  if (apiKey.length < 12) return '****'
  return `${apiKey.slice(0, 7)}...${apiKey.slice(-4)}`
}
