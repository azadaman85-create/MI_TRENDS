import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE, readAdminSessionToken } from "@/lib/admin/session.server";
import { RATE_LIMITS } from "@/lib/security/config";
import { clientIpFrom, consumeRateLimit } from "@/lib/security/rate-limit";
import { requestIdFrom } from "@/lib/security/request-id";

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  const ip = clientIpFrom(request);
  const { limit, windowMs } = RATE_LIMITS.adminSession;
  const { ok } = consumeRateLimit(`admin-session:${ip}`, limit, windowMs);
  if (!ok) {
    return NextResponse.json({ user: null }, { status: 429, headers: { "x-request-id": requestId } });
  }

  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  const user = readAdminSessionToken(token);
  if (!user) return NextResponse.json({ user: null }, { status: 401, headers: { "x-request-id": requestId } });
  return NextResponse.json({ user }, { headers: { "x-request-id": requestId } });
}
