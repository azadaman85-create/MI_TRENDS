import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ADMIN_SESSION_COOKIE, readAdminSessionToken } from "@/lib/admin/session.server";

/**
 * Server-side gate for the admin panel. The client-side redirect in
 * `app/admin/(panel)/layout.tsx` is still there for UX (fast redirect, no flash of
 * protected UI), but this is the real boundary: without it, someone could disable
 * JS or call the panel's data fetches directly and never hit that client check.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const user = readAdminSessionToken(token);
  if (!user) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
