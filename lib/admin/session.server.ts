import { createHash, timingSafeEqual } from "crypto";

import { createSessionToken, verifySessionToken } from "@/lib/security/session";

export const ADMIN_SESSION_COOKIE = "mitrends_admin_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

/**
 * Super admin identity, verified server-side only. These are intentionally NOT
 * prefixed with NEXT_PUBLIC_ — that prefix tells Next.js to inline the value into
 * the client bundle, which previously shipped the password salt+hash to anyone
 * who opened devtools. Set these in `.env.local` (gitignored).
 */
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
const ADMIN_NAME = process.env.ADMIN_NAME ?? "Admin";
const ADMIN_PASSWORD_SALT = process.env.ADMIN_PASSWORD_SALT ?? "";
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH ?? "";
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET ?? "";

export const ADMIN_CONFIGURED = Boolean(
  ADMIN_EMAIL && ADMIN_PASSWORD_SALT && ADMIN_PASSWORD_HASH && ADMIN_SESSION_SECRET,
);

export type AdminUser = {
  name: string;
  email: string;
  role: string;
  initials: string;
};

/** Same construction as the storefront account store: SHA-256 over `salt:password`. */
function hashPassword(password: string, salt: string) {
  return createHash("sha256").update(`${salt}:${password}`).digest("hex");
}

function safeEqualHex(a: string, b: string) {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  return bufA.length === bufB.length && bufA.length > 0 && timingSafeEqual(bufA, bufB);
}

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "AD";
  const first = parts[0]![0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]![0] ?? "") : (parts[0]![1] ?? "");
  return (first + last).toUpperCase();
}

export function verifyAdminCredentials(email: string, password: string): AdminUser | null {
  if (!ADMIN_CONFIGURED) return null;
  const attempted = hashPassword(password, ADMIN_PASSWORD_SALT);
  if (email.trim().toLowerCase() !== ADMIN_EMAIL || !safeEqualHex(attempted, ADMIN_PASSWORD_HASH)) {
    return null;
  }
  return { name: ADMIN_NAME, email: ADMIN_EMAIL, role: "Super admin", initials: initialsFor(ADMIN_NAME) };
}

export function issueAdminSessionToken(user: AdminUser) {
  const now = Date.now();
  return createSessionToken({ sub: user.email, role: user.role, iat: now, exp: now + SESSION_TTL_MS }, ADMIN_SESSION_SECRET);
}

export function readAdminSessionToken(token: string | undefined): AdminUser | null {
  if (!token || !ADMIN_CONFIGURED) return null;
  const payload = verifySessionToken(token, ADMIN_SESSION_SECRET);
  if (!payload || payload.sub !== ADMIN_EMAIL) return null;
  return { name: ADMIN_NAME, email: ADMIN_EMAIL, role: payload.role, initials: initialsFor(ADMIN_NAME) };
}

export const ADMIN_SESSION_MAX_AGE_SECONDS = SESSION_TTL_MS / 1000;
