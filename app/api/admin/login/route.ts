import { NextResponse } from "next/server";

import {
  ADMIN_CONFIGURED,
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  issueAdminSessionToken,
  verifyAdminCredentials,
} from "@/lib/admin/session.server";
import { RATE_LIMITS } from "@/lib/security/config";
import { logSecurityEvent } from "@/lib/security/events";
import { checkLockout, recordFailure, recordSuccess } from "@/lib/security/lockout";
import { clientIpFrom, consumeRateLimit } from "@/lib/security/rate-limit";
import { requestIdFrom } from "@/lib/security/request-id";

const ENDPOINT = "/api/admin/login";

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  const ip = clientIpFrom(request);

  const { limit, windowMs } = RATE_LIMITS.adminLogin;
  const { ok: withinLimit, retryAfterMs: rateRetryAfterMs } = consumeRateLimit(`admin-login:${ip}`, limit, windowMs);
  if (!withinLimit) {
    logSecurityEvent({ type: "RATE_LIMIT_TRIGGERED", requestId, ip, endpoint: ENDPOINT, result: "blocked", risk: "medium" });
    return NextResponse.json(
      { ok: false, message: "Too many attempts. Try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rateRetryAfterMs / 1000)), "x-request-id": requestId } },
    );
  }

  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    logSecurityEvent({ type: "INVALID_INPUT", requestId, ip, endpoint: ENDPOINT, result: "blocked", risk: "low" });
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400, headers: { "x-request-id": requestId } });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!ADMIN_CONFIGURED) {
    // The specific remediation hint is only useful to whoever controls the server env,
    // and this endpoint is reachable by anyone on the internet in production — but it's
    // the single most useful message while setting the project up locally, so keep it there.
    const message =
      process.env.NODE_ENV === "production"
        ? "Sign-in is not available right now."
        : "No admin account is configured. Set ADMIN_* in .env.local.";
    return NextResponse.json({ ok: false, message }, { status: 503, headers: { "x-request-id": requestId } });
  }

  if (!email || !password) {
    return NextResponse.json({ ok: false, message: "Enter your email and password." }, { status: 400, headers: { "x-request-id": requestId } });
  }

  // Keyed by email+IP, not IP alone — see lib/security/lockout.ts for why.
  const lockoutKey = `${email}:${ip}`;
  const lockState = checkLockout(lockoutKey);
  if (lockState.locked) {
    logSecurityEvent({ type: "ACCOUNT_LOCKED", requestId, ip, endpoint: ENDPOINT, result: "blocked", risk: "high", meta: { email } });
    return NextResponse.json(
      { ok: false, message: "Too many failed attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(lockState.retryAfterMs / 1000)), "x-request-id": requestId } },
    );
  }

  const user = verifyAdminCredentials(email, password);
  if (!user) {
    const afterFailure = recordFailure(lockoutKey);
    logSecurityEvent({ type: "LOGIN_FAILED", requestId, ip, endpoint: ENDPOINT, result: "blocked", risk: afterFailure.locked ? "high" : "medium", meta: { email } });
    return NextResponse.json({ ok: false, message: "Those credentials do not match an admin account." }, { status: 401, headers: { "x-request-id": requestId } });
  }

  recordSuccess(lockoutKey);
  logSecurityEvent({ type: "LOGIN_SUCCESS", requestId, ip, endpoint: ENDPOINT, result: "allowed", risk: "low", meta: { email } });

  const token = issueAdminSessionToken(user);
  const response = NextResponse.json({ ok: true, user }, { headers: { "x-request-id": requestId } });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
