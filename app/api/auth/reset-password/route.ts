import { NextResponse } from "next/server";

import {
  CUSTOMER_SESSION_COOKIE,
  customerSessionCookieOptions,
  issueCustomerSessionToken,
  publicCustomer,
} from "@/lib/customer/session.server";
import { hashResetToken, resetTokenExpired, resetTokenMatches } from "@/lib/customer/reset-token";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/customer/validation";
import { getCustomersCollection } from "@/lib/db/models";
import { RATE_LIMITS } from "@/lib/security/config";
import { describeError, logSecurityEvent } from "@/lib/security/events";
import { generateSalt, hashPassword } from "@/lib/security/password";
import { clientIpFrom, consumeRateLimit } from "@/lib/security/rate-limit";
import { requestIdFrom } from "@/lib/security/request-id";

const ENDPOINT = "/api/auth/reset-password";

/**
 * Completes a password reset.
 *
 * The token is looked up by its hash, must not have expired, and is cleared as soon as
 * it's used — so a link that's been through someone's inbox, browser history or a mail
 * scanner can't be replayed. Setting a new password also bumps `sessionVersion`, which
 * invalidates every session issued before now: if the reset was prompted by someone else
 * having got in, this is what throws them out.
 */
export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  const ip = clientIpFrom(request);

  const { limit, windowMs } = RATE_LIMITS.passwordReset;
  const { ok: withinLimit } = consumeRateLimit(`reset:${ip}`, limit, windowMs);
  if (!withinLimit) {
    logSecurityEvent({ type: "RATE_LIMIT_TRIGGERED", requestId, ip, endpoint: ENDPOINT, result: "blocked", risk: "medium" });
    return NextResponse.json(
      { ok: false, message: "Too many attempts. Try again in a few minutes." },
      { status: 429, headers: { "x-request-id": requestId } },
    );
  }

  let body: { token?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400, headers: { "x-request-id": requestId } });
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!token) {
    return NextResponse.json({ ok: false, message: "That reset link is incomplete." }, { status: 400, headers: { "x-request-id": requestId } });
  }
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    return NextResponse.json({ ok: false, message: "Use at least 8 characters." }, { status: 400, headers: { "x-request-id": requestId } });
  }

  const invalidLink = NextResponse.json(
    { ok: false, message: "That reset link has expired or already been used. Request a new one." },
    { status: 400, headers: { "x-request-id": requestId } },
  );

  try {
    const customers = await getCustomersCollection();
    // Indexed lookup on the hash — the raw token is never stored to look up by.
    const customer = await customers.findOne({ resetTokenHash: hashResetToken(token) });

    if (
      !customer ||
      !customer.resetTokenHash ||
      !resetTokenMatches(token, customer.resetTokenHash) ||
      resetTokenExpired(customer.resetTokenExpiresAt)
    ) {
      logSecurityEvent({ type: "LOGIN_FAILED", requestId, ip, endpoint: ENDPOINT, result: "blocked", risk: "medium", meta: { reason: "invalid-or-expired-token" } });
      return invalidLink;
    }

    const salt = generateSalt();
    const nextVersion = (customer.sessionVersion ?? 0) + 1;

    await customers.updateOne(
      { _id: customer._id },
      {
        $set: {
          passwordSalt: salt,
          passwordHash: hashPassword(password, salt),
          sessionVersion: nextVersion,
          passwordChangedAt: new Date().toISOString(),
          // A Google-only account that sets a password can now sign in either way.
          provider: customer.provider ?? "password",
        },
        $unset: { resetTokenHash: "", resetTokenExpiresAt: "" },
      },
    );

    logSecurityEvent({
      type: "ADMIN_ACTION",
      requestId,
      ip,
      endpoint: ENDPOINT,
      result: "allowed",
      risk: "medium",
      meta: { action: "password-reset-completed", email: customer.email },
    });

    // Sign them straight in on this device with a token carrying the new version, so the
    // reset ends with them logged in rather than back at the login form.
    const response = NextResponse.json(
      { ok: true, customer: publicCustomer({ ...customer, sessionVersion: nextVersion }) },
      { headers: { "x-request-id": requestId } },
    );
    response.cookies.set(
      CUSTOMER_SESSION_COOKIE,
      issueCustomerSessionToken(customer._id, nextVersion),
      customerSessionCookieOptions,
    );
    return response;
  } catch (error) {
    logSecurityEvent({
      type: "SUSPICIOUS_REQUEST",
      requestId,
      ip,
      endpoint: ENDPOINT,
      result: "error",
      risk: "low",
      meta: { cause: describeError(error) },
    });
    return NextResponse.json(
      { ok: false, message: "We couldn't reset your password right now. Please try again." },
      { status: 503, headers: { "x-request-id": requestId } },
    );
  }
}
