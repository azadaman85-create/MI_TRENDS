import { createHash, randomBytes, timingSafeEqual } from "crypto";

/**
 * Password-reset tokens.
 *
 * The raw token goes out in the email and is never written down. What's stored is its
 * SHA-256, so a stolen database dump can't be turned into a password reset for anyone.
 * (Plain SHA-256 is the right tool here, unlike for passwords: the token is 32 random
 * bytes, so there's nothing to brute-force and nothing to slow an attacker down from.)
 */

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // an hour is long enough to find the email

export function createResetToken(): { token: string; tokenHash: string; expiresAt: string } {
  const token = randomBytes(32).toString("hex");
  return {
    token,
    tokenHash: hashResetToken(token),
    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString(),
  };
}

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Constant-time compare, so the stored hash can't be probed a byte at a time. */
export function resetTokenMatches(token: string, storedHash: string): boolean {
  const attempt = Buffer.from(hashResetToken(token), "hex");
  let stored: Buffer;
  try {
    stored = Buffer.from(storedHash, "hex");
  } catch {
    return false;
  }
  return attempt.length === stored.length && attempt.length > 0 && timingSafeEqual(attempt, stored);
}

export function resetTokenExpired(expiresAt: string | undefined): boolean {
  if (!expiresAt) return true;
  const expiry = Date.parse(expiresAt);
  return Number.isNaN(expiry) || expiry < Date.now();
}
