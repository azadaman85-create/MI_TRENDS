import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ADMIN_SESSION_COOKIE, readAdminSessionToken } from "@/lib/admin/session.server";
import { logSecurityEvent } from "@/lib/security/events";
import { clientIpFrom } from "@/lib/security/rate-limit";
import { REQUEST_ID_HEADER, requestIdFrom } from "@/lib/security/request-id";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * The application firewall. Runs in front of every admin page and every API route:
 *
 * 1. Stamps a request ID on the response (and forwards it to the route handler via a
 *    request header) so one request can be traced across the firewall, the route,
 *    and the security event log, per the request-id section of the security spec.
 * 2. For state-changing API calls, rejects a cross-site Origin — defense-in-depth
 *    CSRF protection for the two real server-side mutations this app has (admin
 *    login/logout and payment order creation/verification). Only rejects a
 *    *confirmed mismatch*; it never blocks on a missing Origin, because plenty of
 *    legitimate same-origin requests (older browsers, some fetch configurations)
 *    don't send one, and blocking on absence would lock out real customers.
 * 3. Gates every /admin/* page server-side (unchanged from before) — the client-side
 *    redirect in app/admin/(panel)/layout.tsx is UX only, this is the real boundary.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = requestIdFrom(request);

  if (pathname.startsWith("/api/") && MUTATING_METHODS.has(request.method)) {
    // Compare Host:port strings directly rather than `request.nextUrl.origin` — the
    // latter reflects the bind address (e.g. 0.0.0.0 in dev, or whatever a reverse
    // proxy/CDN sets it to in production), not what the client actually requested,
    // and comparing against it rejects every legitimate same-origin request.
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    const originHost = origin ? safeHost(origin) : null;
    if (originHost && originHost !== host) {
      logSecurityEvent({
        type: "CSRF_BLOCKED",
        requestId,
        ip: clientIpFrom(request),
        endpoint: pathname,
        result: "blocked",
        risk: "high",
        meta: { origin },
      });
      return NextResponse.json({ error: "Request rejected." }, { status: 403, headers: { [REQUEST_ID_HEADER]: requestId } });
    }
  }

  let response: NextResponse;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const user = readAdminSessionToken(token);
    if (!user) {
      response = NextResponse.redirect(new URL("/admin/login", request.url));
      response.headers.set(REQUEST_ID_HEADER, requestId);
      return response;
    }
  }

  const forwardedHeaders = new Headers(request.headers);
  forwardedHeaders.set(REQUEST_ID_HEADER, requestId);
  response = NextResponse.next({ request: { headers: forwardedHeaders } });
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}

function safeHost(origin: string): string | null {
  try {
    return new URL(origin).host;
  } catch {
    return null;
  }
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
