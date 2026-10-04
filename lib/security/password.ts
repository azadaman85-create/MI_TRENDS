import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";

/**
 * Password hashing for the one real server-side credential in this app (the
 * admin password). Previously SHA-256(salt:password) — a single fast round of
 * a general-purpose hash, which is exactly what OWASP calls out as unsafe for
 * password storage: GPUs/ASICs can brute-force SHA-256 at billions of guesses
 * per second. scrypt is deliberately slow and memory-hard, which is what
 * actually matters for a credential meant to resist offline guessing.
 *
 * Picked over bcrypt/Argon2id because it's built into Node's own `crypto`
 * module — no new dependency for a project with exactly one password to hash.
 */
const KEY_LENGTH = 64;
const SCRYPT_PREFIX = "scrypt:";

export function hashPassword(password: string, salt: string): string {
  return SCRYPT_PREFIX + scryptSync(password, salt, KEY_LENGTH).toString("hex");
}

export function generateSalt(): string {
  return randomBytes(16).toString("hex");
}

/**
 * Verifies a password against a stored hash. Accepts the legacy
 * SHA-256(`salt:password`) format too (no prefix, 64 hex chars) purely so an
 * already-deployed `.env` isn't instantly broken by this change — but treats
 * it as a point to migrate off, not a long-term dual format. See
 * `ADMIN.md`/`SECURITY.md` for the one-command regeneration step.
 */
export function verifyPassword(password: string, salt: string, stored: string): boolean {
  if (stored.startsWith(SCRYPT_PREFIX)) {
    const expected = scryptSync(password, salt, KEY_LENGTH);
    const storedBuf = hexToBuffer(stored.slice(SCRYPT_PREFIX.length));
    return storedBuf !== null && storedBuf.length === expected.length && timingSafeEqual(storedBuf, expected);
  }

  // Legacy path — see doc comment above.
  const legacy = createHash("sha256").update(`${salt}:${password}`).digest("hex");
  const expectedBuf = hexToBuffer(legacy);
  const storedBuf = hexToBuffer(stored);
  return expectedBuf !== null && storedBuf !== null && expectedBuf.length === storedBuf.length && timingSafeEqual(expectedBuf, storedBuf);
}

function hexToBuffer(hex: string): Buffer | null {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2 !== 0) return null;
  return Buffer.from(hex, "hex");
}
