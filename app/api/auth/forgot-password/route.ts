import { NextResponse } from "next/server";

import { createResetToken } from "@/lib/customer/reset-token";
import { getCustomersCollection } from "@/lib/db/models";
import { sendPasswordReset } from "@/lib/email/mailer";
import { RATE_LIMITS } from "@/lib/security/config";
import { describeError, logSecurityEvent } from "@/lib/security/events";
import { clientIpFrom, consumeRateLimit } from "@/lib/security/rate-limit";
import { requestIdFrom } from "@/lib/security/request-id";
import { EMAIL_PATTERN } from "@/lib/customer/validation";

const ENDPOINT = "/api/auth/forgot-password";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mitrends.co.in";

/**
 * Starts a password reset.
 *
 * Answers identically whether or not the address has an account — otherwise this becomes
 * a way to find out which emails are registered, which is the same enumeration hole the
 * login endpoint already avoids. The work (and the email) only happens when there's a
 * real password account behind the address.
 */
export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  const ip = clientIpFrom(request);

  const { limit, windowMs } = RATE_LIMITS.passwordReset;
  const { ok: withinLimit, retryAfterMs } = consumeRateLimit(`forgot:${ip}`, limit, windowMs);
  if (!withinLimit) {
    logSecurityEvent({ type: "RATE_LIMIT_TRIGGERED", requestId, ip, endpoint: ENDPOINT, result: "blocked", risk: "medium" });
    return NextResponse.json(
      { ok: false, message: "Too many requests. Try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)), "x-request-id": requestId } },
    );
  }

  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400, headers: { "x-request-id": requestId } });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ ok: false, message: "Enter a valid email address." }, { status: 400, headers: { "x-request-id": requestId } });
  }

  // The same answer in every case below.
  const accepted = NextResponse.json(
    { ok: true, message: "If that email has an account, a reset link is on its way." },
    { headers: { "x-request-id": requestId } },
  );

  try {
    const customers = await getCustomersCollection();
    const customer = await customers.findOne({ email });

    // No account, or a Google-only account that has no password to reset. Either way the
    // caller gets the same response; sending nothing is the correct behaviour here.
    if (!customer || !customer.passwordHash) {
      logSecurityEvent({
        type: "LOGIN_FAILED",
        requestId,
        ip,
        endpoint: ENDPOINT,
        result: "blocked",
        risk: "low",
        meta: { reason: customer ? "no-password-account" : "no-account" },
      });
      return accepted;
    }

    const { token, tokenHash, expiresAt } = createResetToken();
    await customers.updateOne(
      { _id: customer._id },
      { $set: { resetTokenHash: tokenHash, resetTokenExpiresAt: expiresAt } },
    );

    const resetUrl = `${SITE_URL}/account/reset-password?token=${encodeURIComponent(token)}`;
    await sendPasswordReset(customer.email, customer.name, resetUrl, requestId);

    logSecurityEvent({
      type: "ADMIN_ACTION",
      requestId,
      ip,
      endpoint: ENDPOINT,
      result: "allowed",
      risk: "low",
      meta: { action: "password-reset-requested", email },
    });

    return accepted;
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
      { ok: false, message: "We couldn't start the reset right now. Please try again." },
      { status: 503, headers: { "x-request-id": requestId } },
    );
  }
}
