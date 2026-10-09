import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ADMIN_SESSION_COOKIE, readAdminSessionToken } from "@/lib/admin/session.server";
import { logSecurityEvent } from "@/lib/security/events";
import { clientIpFrom } from "@/lib/security/rate-limit";
import { PATHNAME_HEADER } from "@/lib/request-path";
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

  const canonical = canonicalRedirect(request);
  if (canonical) return canonical;

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
  // generateMetadata has no access to the current route, so the canonical URL would
  // otherwise have to be hardcoded. Passing the path through is the supported way.
  forwardedHeaders.set(PATHNAME_HEADER, pathname);
  response = NextResponse.next({ request: { headers: forwardedHeaders } });
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}

/**
 * Sends every production request to the one canonical hostname.
 *
 * The project answers on its generated *.vercel.app alias as well as the real domain,
 * and that alias can lag behind on an older deployment — so a shopper who lands there
 * gets a stale site with none of today's products. Beyond staleness it splits everything
 * that is keyed to a hostname: session cookies don't carry across, and Google sign-in
 * only authorises the real domain as a JavaScript origin, so it simply fails there.
 *
 * Only in production, and only for safe methods. Preview deployments live on
 * *.vercel.app by design and must keep working, and redirecting a POST would break
 * Razorpay's webhook if it were ever pointed at the wrong host.
 */
function canonicalRedirect(request: NextRequest): NextResponse | null {
  if (process.env.VERCEL_ENV !== "production") return null;
  if (request.method !== "GET" && request.method !== "HEAD") return null;

  let canonical: URL;
  try {
    canonical = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "");
  } catch {
    // No canonical host configured: leave every request exactly as it came in.
    return null;
  }

  const host = request.headers.get("host");
  if (!host || host === canonical.host) return null;

  const target = new URL(request.nextUrl.toString());
  target.protocol = "https:";
  // hostname and port assigned separately: setting `host` to a value without a port
  // leaves any existing port in place, sending the visitor to a dead address.
  target.hostname = canonical.hostname;
  target.port = canonical.port;
  // 308 rather than 301: it preserves the method, and browsers cache it less
  // aggressively than a permanent GET-only redirect if the canonical host ever changes.
  return NextResponse.redirect(target, 308);
}

function safeHost(origin: string): string | null {
  try {
    return new URL(origin).host;
  } catch {
    return null;
  }
}

export const config = {
  /*
    Everything except the static asset paths, so the canonical-host redirect covers real
    pages and not just /admin and /api. Static files are skipped because they are served
    straight from the CDN and never need the firewall — running on them would add a hop
    to every image and script for no benefit.
  */
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/|icon.png|apple-icon.png).*)"],
};
