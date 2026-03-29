/**
 * AES-256-GCM encryption/decryption for API keys.
 * Uses ENCRYPTION_KEY env var (hex string, 32 bytes = 64 hex chars).
 * Format: "iv:authTag:ciphertext" (all base64-encoded).
 */
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/** Get the encryption key from environment, validated */
function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error("ENCRYPTION_KEY environment variable is not set");
  return Buffer.from(key, "hex");
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * @param text - The plaintext to encrypt
 * @returns Encrypted string in format "iv:authTag:ciphertext"
 */
export function encrypt(text: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");
  const authTag = cipher.getAuthTag();

  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
}

/**
 * Decrypt an AES-256-GCM encrypted string.
 * @param encryptedText - The encrypted string in format "iv:authTag:ciphertext"
 * @returns Decrypted plaintext string
 */
export function decrypt(encryptedText: string): string {
  const key = getKey();
  const [ivB64, authTagB64, ciphertext] = encryptedText.split(":");

  if (!ivB64 || !authTagB64 || !ciphertext) {
    throw new Error("Invalid encrypted text format");
  }

  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
