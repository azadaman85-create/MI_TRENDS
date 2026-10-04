import { NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE } from "@/lib/admin/session.server";
import { RATE_LIMITS } from "@/lib/security/config";
import { clientIpFrom, consumeRateLimit } from "@/lib/security/rate-limit";
import { requestIdFrom } from "@/lib/security/request-id";

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  const ip = clientIpFrom(request);
  const { limit, windowMs } = RATE_LIMITS.adminLogout;
  const { ok } = consumeRateLimit(`admin-logout:${ip}`, limit, windowMs);
  if (!ok) {
    return NextResponse.json({ ok: false }, { status: 429, headers: { "x-request-id": requestId } });
  }

  const response = NextResponse.json({ ok: true }, { headers: { "x-request-id": requestId } });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
