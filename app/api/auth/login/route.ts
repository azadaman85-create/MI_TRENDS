import { NextResponse } from "next/server";

import {
  CUSTOMER_SESSION_COOKIE,
  customerSessionCookieOptions,
  issueCustomerSessionToken,
  publicCustomer,
} from "@/lib/customer/session.server";
import { getCustomersCollection } from "@/lib/db/models";
import { RATE_LIMITS } from "@/lib/security/config";
import { describeError, logSecurityEvent } from "@/lib/security/events";
import { checkLockout, recordFailure, recordSuccess } from "@/lib/security/lockout";
import { verifyPassword } from "@/lib/security/password";
import { clientIpFrom, consumeRateLimit } from "@/lib/security/rate-limit";
import { requestIdFrom } from "@/lib/security/request-id";

const ENDPOINT = "/api/auth/login";

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  const ip = clientIpFrom(request);

  const { limit, windowMs } = RATE_LIMITS.customerLogin;
  const { ok: withinLimit, retryAfterMs } = consumeRateLimit(`customer-login:${ip}`, limit, windowMs);
  if (!withinLimit) {
    logSecurityEvent({ type: "RATE_LIMIT_TRIGGERED", requestId, ip, endpoint: ENDPOINT, result: "blocked", risk: "medium" });
    return NextResponse.json(
      { ok: false, message: "Too many attempts. Try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)), "x-request-id": requestId } },
    );
  }

  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400, headers: { "x-request-id": requestId } });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  // One generic message for every failure path — never reveals whether the email exists.
  const mismatch = NextResponse.json(
    { ok: false, message: "That email and password don't match." },
    { status: 401, headers: { "x-request-id": requestId } },
  );

  if (!email || !password) {
    return NextResponse.json({ ok: false, message: "Enter your email and password." }, { status: 400, headers: { "x-request-id": requestId } });
  }

  const lockoutKey = `customer:${email}:${ip}`;
  const lockState = checkLockout(lockoutKey);
  if (lockState.locked) {
    logSecurityEvent({ type: "ACCOUNT_LOCKED", requestId, ip, endpoint: ENDPOINT, result: "blocked", risk: "high", meta: { email } });
    return NextResponse.json(
      { ok: false, message: "Too many failed attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(lockState.retryAfterMs / 1000)), "x-request-id": requestId } },
    );
  }

  try {
    const customers = await getCustomersCollection();
    const doc = await customers.findOne({ email });

    if (!doc || !doc.passwordSalt || !doc.passwordHash) {
      recordFailure(lockoutKey);
      logSecurityEvent({ type: "LOGIN_FAILED", requestId, ip, endpoint: ENDPOINT, result: "blocked", risk: "medium", meta: { email } });
      return mismatch;
    }

    if (!verifyPassword(password, doc.passwordSalt, doc.passwordHash)) {
      recordFailure(lockoutKey);
      logSecurityEvent({ type: "LOGIN_FAILED", requestId, ip, endpoint: ENDPOINT, result: "blocked", risk: "medium", meta: { email } });
      return mismatch;
    }

    recordSuccess(lockoutKey);
    logSecurityEvent({ type: "LOGIN_SUCCESS", requestId, ip, endpoint: ENDPOINT, result: "allowed", risk: "low", meta: { email } });

    const response = NextResponse.json({ ok: true, customer: publicCustomer(doc) }, { headers: { "x-request-id": requestId } });
    response.cookies.set(CUSTOMER_SESSION_COOKIE, issueCustomerSessionToken(doc._id, doc.sessionVersion ?? 0), customerSessionCookieOptions);
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
      { ok: false, message: "We couldn't sign you in right now. Please try again." },
      { status: 503, headers: { "x-request-id": requestId } },
    );
  }
}
