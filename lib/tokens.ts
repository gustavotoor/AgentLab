/**
 * Token generation and verification for email confirmation and password reset.
 * Tokens are stored as SHA-256 hashes in the database; the plaintext is sent to the user.
 */
import { randomBytes, createHash } from "crypto";
import { db } from "@/lib/db";

/**
 * Generate a random token and its SHA-256 hash.
 * @returns Object with plaintext token and hashed version for DB storage
 */
export function generateToken(): { token: string; hashedToken: string } {
  const token = randomBytes(32).toString("hex");
  const hashedToken = hashToken(token);
  return { token, hashedToken };
}

/**
 * Hash a token string using SHA-256.
 * @param token - The plaintext token to hash
 * @returns SHA-256 hex digest
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Create a verification token in the database.
 * Deletes any existing unused tokens of the same type for the user.
 * @param userId - The user ID to create the token for
 * @param type - Token type: "email-verification" or "password-reset"
 * @param expiresInHours - Hours until the token expires
 * @returns The created token record
 */
export async function createVerificationToken(
  userId: string,
  type: string,
  expiresInHours: number
) {
  // Delete existing unused tokens of same type for this user
  await db.verificationToken.deleteMany({
    where: { userId, type, usedAt: null },
  });

  const { token, hashedToken } = generateToken();

  const record = await db.verificationToken.create({
    data: {
      userId,
      token: hashedToken,
      type,
      expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000),
    },
  });

  // Return both the DB record and the plaintext token for email
  return { ...record, plainToken: token };
}

/**
 * Verify a token: check it exists, hasn't expired, and hasn't been used.
 * Marks the token as used if valid.
 * @param token - The plaintext token from the user
 * @param type - Expected token type
 * @returns The verification token record if valid, null otherwise
 */
export async function verifyToken(token: string, type: string) {
  const hashedToken = hashToken(token);

  const record = await db.verificationToken.findFirst({
    where: {
      token: hashedToken,
      type,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!record) return null;

  // Mark as used
  await db.verificationToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return record;
}
