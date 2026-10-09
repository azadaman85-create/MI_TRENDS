import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/guard.server";
import type { Banner, CategoryNode, Coupon, Review } from "@/lib/admin/types";
import {
  getBanners,
  getCategories,
  getCoupons,
  getReviews,
  replaceBanners,
  replaceCategories,
  replaceCoupons,
  replaceReviews,
} from "@/lib/content.server";
import { RATE_LIMITS } from "@/lib/security/config";
import { logSecurityEvent } from "@/lib/security/events";
import { clientIpFrom, consumeRateLimit } from "@/lib/security/rate-limit";
import { requestIdFrom } from "@/lib/security/request-id";
import { normaliseBanners, normaliseCategories, normaliseCoupons, normaliseReviews } from "@/lib/content.validate";

const ENDPOINT = "/api/admin/content/[resource]";

/**
 * Banners, categories and reviews — read and replaced whole.
 *
 * One route for three lists because they behave identically: small, hand-curated, edited
 * as a set in the panel. PUT replaces the list; whatever isn't in the body is deleted.
 * Everything is re-validated here, since "the panel sent it" is not a guarantee.
 */
const RESOURCES = ["banners", "categories", "reviews", "coupons"] as const;
type Resource = (typeof RESOURCES)[number];

export async function GET(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  const requestId = requestIdFrom(request);
  const ip = clientIpFrom(request);

  if (!consumeRateLimit(`admin-content:${ip}`, RATE_LIMITS.adminData.limit, RATE_LIMITS.adminData.windowMs).ok) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429, headers: { "x-request-id": requestId } });
  }
  const admin = await requireAdmin();
  if (!admin) {
    logSecurityEvent({ type: "SUSPICIOUS_REQUEST", requestId, ip, endpoint: ENDPOINT, result: "blocked", risk: "high", meta: { reason: "no-admin-session" } });
    return NextResponse.json({ error: "Not authorized." }, { status: 401, headers: { "x-request-id": requestId } });
  }

  const resource = (await params).resource as Resource;
  if (!RESOURCES.includes(resource)) {
    return NextResponse.json({ error: "Unknown resource." }, { status: 404, headers: { "x-request-id": requestId } });
  }

  try {
    const items =
      resource === "banners"
        ? await getBanners()
        : resource === "categories"
          ? await getCategories()
          : resource === "coupons"
            ? await getCoupons()
            : await getReviews();
    return NextResponse.json({ items }, { headers: { "x-request-id": requestId, "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not load that list." }, { status: 503, headers: { "x-request-id": requestId } });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  const requestId = requestIdFrom(request);
  const ip = clientIpFrom(request);

  if (!consumeRateLimit(`admin-content-write:${ip}`, RATE_LIMITS.adminData.limit, RATE_LIMITS.adminData.windowMs).ok) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429, headers: { "x-request-id": requestId } });
  }
  const admin = await requireAdmin();
  if (!admin) {
    logSecurityEvent({ type: "SUSPICIOUS_REQUEST", requestId, ip, endpoint: ENDPOINT, result: "blocked", risk: "high", meta: { reason: "no-admin-session" } });
    return NextResponse.json({ error: "Not authorized." }, { status: 401, headers: { "x-request-id": requestId } });
  }

  const resource = (await params).resource as Resource;
  if (!RESOURCES.includes(resource)) {
    return NextResponse.json({ error: "Unknown resource." }, { status: 404, headers: { "x-request-id": requestId } });
  }

  let body: { items?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400, headers: { "x-request-id": requestId } });
  }
  if (!Array.isArray(body.items)) {
    return NextResponse.json({ error: "Expected a list." }, { status: 400, headers: { "x-request-id": requestId } });
  }

  try {
    let count = 0;
    if (resource === "banners") {
      const items = normaliseBanners(body.items);
      await replaceBanners(items as Banner[]);
      count = items.length;
    } else if (resource === "categories") {
      const items = normaliseCategories(body.items);
      await replaceCategories(items as CategoryNode[]);
      count = items.length;
    } else if (resource === "coupons") {
      const items = normaliseCoupons(body.items);
      await replaceCoupons(items as Coupon[]);
      count = items.length;
    } else {
      const items = normaliseReviews(body.items);
      await replaceReviews(items as Review[]);
      count = items.length;
    }

    logSecurityEvent({ type: "ADMIN_ACTION", requestId, ip, endpoint: ENDPOINT, result: "allowed", risk: "low", meta: { action: `${resource}-replace`, count, admin: admin.email } });
    return NextResponse.json({ ok: true, count }, { headers: { "x-request-id": requestId } });
  } catch {
    return NextResponse.json({ error: "Could not save that list." }, { status: 503, headers: { "x-request-id": requestId } });
  }
}
