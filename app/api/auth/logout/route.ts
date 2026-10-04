import { NextResponse } from "next/server";

import { CUSTOMER_SESSION_COOKIE } from "@/lib/customer/session.server";
import { requestIdFrom } from "@/lib/security/request-id";

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  const response = NextResponse.json({ ok: true }, { headers: { "x-request-id": requestId } });
  response.cookies.set(CUSTOMER_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
