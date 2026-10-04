import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import {
  CUSTOMER_SESSION_COOKIE,
  customerSessionCookieOptions,
  issueCustomerSessionToken,
  publicCustomer,
} from "@/lib/customer/session.server";
import { getCustomersCollection, type CustomerDoc } from "@/lib/db/models";
import { RATE_LIMITS } from "@/lib/security/config";
import { logSecurityEvent } from "@/lib/security/events";
import { clientIpFrom, consumeRateLimit } from "@/lib/security/rate-limit";
import { requestIdFrom } from "@/lib/security/request-id";

const ENDPOINT = "/api/auth/google";

/**
 * Google's own token-introspection endpoint. A fixed, trusted URL — the only thing the
 * caller controls is the token in the query string, so this is not an SSRF surface.
 *
 * Using tokeninfo rather than verifying the JWT against Google's JWKS locally costs one
 * outbound request per sign-in, but means Google (not us) decides whether a signature is
 * valid, and there's no key-rotation cache to get wrong. Worth revisiting with
 * `google-auth-library` if Google sign-in ever becomes high-volume here.
 */
const GOOGLE_TOKENINFO = "https://oauth2.googleapis.com/tokeninfo";

type TokenInfo = {
  aud?: string;
  sub?: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  given_name?: string;
  picture?: string;
};

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  const ip = clientIpFrom(request);

  const { limit, windowMs } = RATE_LIMITS.customerLogin;
  const { ok: withinLimit } = consumeRateLimit(`google-login:${ip}`, limit, windowMs);
  if (!withinLimit) {
    logSecurityEvent({ type: "RATE_LIMIT_TRIGGERED", requestId, ip, endpoint: ENDPOINT, result: "blocked", risk: "medium" });
    return NextResponse.json(
      { ok: false, message: "Too many attempts. Try again in a few minutes." },
      { status: 429, headers: { "x-request-id": requestId } },
    );
  }

  let body: { credential?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400, headers: { "x-request-id": requestId } });
  }

  const credential = typeof body.credential === "string" ? body.credential : "";
  const expectedAudience = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

  if (!credential || !expectedAudience) {
    return NextResponse.json({ ok: false, message: "Google sign-in isn't available right now." }, { status: 400, headers: { "x-request-id": requestId } });
  }

  const genericFailure = NextResponse.json(
    { ok: false, message: "We couldn't verify that Google sign-in. Please try again." },
    { status: 401, headers: { "x-request-id": requestId } },
  );

  let info: TokenInfo;
  try {
    const verifyResponse = await fetch(`${GOOGLE_TOKENINFO}?id_token=${encodeURIComponent(credential)}`, {
      cache: "no-store",
    });
    if (!verifyResponse.ok) {
      logSecurityEvent({ type: "LOGIN_FAILED", requestId, ip, endpoint: ENDPOINT, result: "blocked", risk: "high", meta: { reason: "token-rejected-by-google" } });
      return genericFailure;
    }
    info = (await verifyResponse.json()) as TokenInfo;
  } catch {
    return NextResponse.json(
      { ok: false, message: "We couldn't reach Google to verify that sign-in. Please try again." },
      { status: 503, headers: { "x-request-id": requestId } },
    );
  }

  // Google said the signature is good — but the token could have been minted for a
  // *different* app. Checking `aud` is what stops someone replaying a token issued by
  // another site's Google client against this one.
  if (info.aud !== expectedAudience) {
    logSecurityEvent({ type: "LOGIN_FAILED", requestId, ip, endpoint: ENDPOINT, result: "blocked", risk: "high", meta: { reason: "audience-mismatch" } });
    return genericFailure;
  }

  const emailVerified = info.email_verified === true || info.email_verified === "true";
  const email = typeof info.email === "string" ? info.email.trim().toLowerCase() : "";
  if (!email || !emailVerified) {
    logSecurityEvent({ type: "LOGIN_FAILED", requestId, ip, endpoint: ENDPOINT, result: "blocked", risk: "medium", meta: { reason: "email-unverified" } });
    return genericFailure;
  }

  try {
    const customers = await getCustomersCollection();
    const existing = await customers.findOne({ email });

    if (existing) {
      // Refresh the display fields Google owns, but never touch an existing password
      // credential — a Google sign-in shouldn't be able to overwrite or clear it.
      const name = info.name ?? info.given_name ?? existing.name;
      const picture = info.picture ?? existing.picture;
      await customers.updateOne({ _id: existing._id }, { $set: { name, picture } });

      logSecurityEvent({ type: "LOGIN_SUCCESS", requestId, ip, endpoint: ENDPOINT, result: "allowed", risk: "low", meta: { email, provider: "google" } });
      const response = NextResponse.json(
        { ok: true, customer: publicCustomer({ ...existing, name, picture }) },
        { headers: { "x-request-id": requestId } },
      );
      response.cookies.set(CUSTOMER_SESSION_COOKIE, issueCustomerSessionToken(existing._id), customerSessionCookieOptions);
      return response;
    }

    const doc: CustomerDoc = {
      _id: randomUUID(),
      name: info.name ?? info.given_name ?? email.split("@")[0]!,
      email,
      picture: info.picture,
      provider: "google",
      createdAt: new Date().toISOString(),
    };
    await customers.insertOne(doc);

    logSecurityEvent({ type: "LOGIN_SUCCESS", requestId, ip, endpoint: ENDPOINT, result: "allowed", risk: "low", meta: { email, provider: "google", signup: true } });
    const response = NextResponse.json({ ok: true, customer: publicCustomer(doc) }, { headers: { "x-request-id": requestId } });
    response.cookies.set(CUSTOMER_SESSION_COOKIE, issueCustomerSessionToken(doc._id), customerSessionCookieOptions);
    return response;
  } catch {
    return NextResponse.json(
      { ok: false, message: "We couldn't sign you in right now. Please try again." },
      { status: 503, headers: { "x-request-id": requestId } },
    );
  }
}
