import { cookies } from "next/headers";

import { createSessionToken, verifySessionToken } from "@/lib/security/session";
import type { CustomerDoc } from "@/lib/db/models";

export const CUSTOMER_SESSION_COOKIE = "mitrends_customer_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days — shoppers shouldn't be logged out weekly
export const CUSTOMER_SESSION_MAX_AGE_SECONDS = SESSION_TTL_MS / 1000;

const CUSTOMER_SESSION_SECRET = process.env.CUSTOMER_SESSION_SECRET ?? "";

export const CUSTOMER_SESSIONS_CONFIGURED = Boolean(CUSTOMER_SESSION_SECRET);

/** What the browser is allowed to see — never the password salt/hash. */
export type PublicCustomer = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  picture?: string;
  provider: CustomerDoc["provider"];
  createdAt: string;
};

export function publicCustomer(doc: CustomerDoc): PublicCustomer {
  return {
    id: doc._id,
    name: doc.name,
    email: doc.email,
    phone: doc.phone,
    picture: doc.picture,
    provider: doc.provider,
    createdAt: doc.createdAt,
  };
}

export function issueCustomerSessionToken(customerId: string, sessionVersion = 0) {
  const now = Date.now();
  return createSessionToken(
    { sub: customerId, role: "customer", iat: now, exp: now + SESSION_TTL_MS, ver: sessionVersion },
    CUSTOMER_SESSION_SECRET,
  );
}

/** The customer id this request is authenticated as, or null. */
export async function currentCustomerId(): Promise<string | null> {
  return (await currentCustomerSession())?.id ?? null;
}

/**
 * The id **and** the session version the cookie was issued at. Callers that already read
 * the customer record (like /api/auth/session) compare the version against the stored one
 * so a session from before a password reset is rejected; callers that don't, don't pay
 * for an extra database round trip.
 */
export async function currentCustomerSession(): Promise<{ id: string; version: number } | null> {
  if (!CUSTOMER_SESSIONS_CONFIGURED) return null;
  const token = (await cookies()).get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = verifySessionToken(token, CUSTOMER_SESSION_SECRET);
  if (!payload || payload.role !== "customer") return null;
  return { id: payload.sub, version: payload.ver ?? 0 };
}

export const customerSessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: CUSTOMER_SESSION_MAX_AGE_SECONDS,
};
