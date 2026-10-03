import { NextResponse } from "next/server";

import {
  ADMIN_CONFIGURED,
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  issueAdminSessionToken,
  verifyAdminCredentials,
} from "@/lib/admin/session.server";
import { clientIpFrom, consumeRateLimit } from "@/lib/security/rate-limit";

const LOGIN_ATTEMPT_LIMIT = 5;
const LOGIN_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

export async function POST(request: Request) {
  const ip = clientIpFrom(request);
  const { ok, retryAfterMs } = consumeRateLimit(`admin-login:${ip}`, LOGIN_ATTEMPT_LIMIT, LOGIN_WINDOW_MS);
  if (!ok) {
    return NextResponse.json(
      { ok: false, message: "Too many attempts. Try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } },
    );
  }

  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!ADMIN_CONFIGURED) {
    return NextResponse.json(
      { ok: false, message: "No admin account is configured. Set ADMIN_* in .env.local." },
      { status: 500 },
    );
  }

  if (!email || !password) {
    return NextResponse.json({ ok: false, message: "Enter your email and password." }, { status: 400 });
  }

  const user = verifyAdminCredentials(email, password);
  if (!user) {
    return NextResponse.json({ ok: false, message: "Those credentials do not match an admin account." }, { status: 401 });
  }

  const token = issueAdminSessionToken(user);
  const response = NextResponse.json({ ok: true, user });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
