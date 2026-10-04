import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import {
  CUSTOMER_SESSION_COOKIE,
  customerSessionCookieOptions,
  issueCustomerSessionToken,
  publicCustomer,
} from "@/lib/customer/session.server";
import { validateSignUp } from "@/lib/customer/validation";
import { getCustomersCollection, type CustomerDoc } from "@/lib/db/models";
import { RATE_LIMITS } from "@/lib/security/config";
import { logSecurityEvent } from "@/lib/security/events";
import { generateSalt, hashPassword } from "@/lib/security/password";
import { clientIpFrom, consumeRateLimit } from "@/lib/security/rate-limit";
import { requestIdFrom } from "@/lib/security/request-id";

const ENDPOINT = "/api/auth/signup";

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  const ip = clientIpFrom(request);

  const { limit, windowMs } = RATE_LIMITS.customerSignup;
  const { ok: withinLimit, retryAfterMs } = consumeRateLimit(`signup:${ip}`, limit, windowMs);
  if (!withinLimit) {
    logSecurityEvent({ type: "RATE_LIMIT_TRIGGERED", requestId, ip, endpoint: ENDPOINT, result: "blocked", risk: "medium" });
    return NextResponse.json(
      { ok: false, message: "Too many attempts. Try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)), "x-request-id": requestId } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400, headers: { "x-request-id": requestId } });
  }

  const validated = validateSignUp({ name: body.name, email: body.email, password: body.password, phone: body.phone });
  if (!validated.ok) {
    return NextResponse.json({ ok: false, message: validated.error.message }, { status: 400, headers: { "x-request-id": requestId } });
  }

  const { name, email, password, phone } = validated.value;

  try {
    const customers = await getCustomersCollection();
    const salt = generateSalt();
    const doc: CustomerDoc = {
      _id: randomUUID(),
      name,
      email,
      phone,
      provider: "password",
      passwordSalt: salt,
      passwordHash: hashPassword(password, salt),
      createdAt: new Date().toISOString(),
    };

    try {
      await customers.insertOne(doc);
    } catch (error) {
      // 11000 is Mongo's duplicate-key code — the unique index on email caught a
      // second signup for the same address (including two racing requests).
      if ((error as { code?: number })?.code === 11000) {
        return NextResponse.json(
          { ok: false, message: "An account with that email already exists. Try signing in." },
          { status: 409, headers: { "x-request-id": requestId } },
        );
      }
      throw error;
    }

    logSecurityEvent({ type: "LOGIN_SUCCESS", requestId, ip, endpoint: ENDPOINT, result: "allowed", risk: "low", meta: { email, signup: true } });

    const response = NextResponse.json({ ok: true, customer: publicCustomer(doc) }, { headers: { "x-request-id": requestId } });
    response.cookies.set(CUSTOMER_SESSION_COOKIE, issueCustomerSessionToken(doc._id), customerSessionCookieOptions);
    return response;
  } catch {
    logSecurityEvent({ type: "SUSPICIOUS_REQUEST", requestId, ip, endpoint: ENDPOINT, result: "error", risk: "low" });
    return NextResponse.json(
      { ok: false, message: "We couldn't create your account right now. Please try again." },
      { status: 503, headers: { "x-request-id": requestId } },
    );
  }
}
