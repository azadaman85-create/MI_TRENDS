import { NextResponse } from "next/server";

import { getCoupons } from "@/lib/content.server";
import { COUPON_REJECTION_COPY, evaluateCoupon, findCoupon } from "@/lib/coupons";
import { RATE_LIMITS } from "@/lib/security/config";
import { clientIpFrom, consumeRateLimit } from "@/lib/security/rate-limit";
import { requestIdFrom } from "@/lib/security/request-id";

const ENDPOINT = "/api/coupons/validate";

/**
 * Checks a coupon for the cart screen.
 *
 * The coupon list deliberately never reaches the browser: it contains scheduled and
 * paused codes that haven't been announced, and shipping it would hand those out. So the
 * browser asks about one code at a time and gets back only a yes/no and an amount.
 *
 * This is a preview, not the price. The discount actually charged is recomputed in
 * lib/pricing.ts when the order is created, from the same records — a reply here is
 * never trusted as input later.
 *
 * Rate-limited because it is an unauthenticated endpoint that would otherwise let
 * someone brute-force the code list.
 */
export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  const ip = clientIpFrom(request);

  const { limit, windowMs } = RATE_LIMITS.orderTracking;
  const { ok: withinLimit, retryAfterMs } = consumeRateLimit(`coupon:${ip}`, limit, windowMs);
  if (!withinLimit) {
    return NextResponse.json(
      { ok: false, message: "Too many attempts. Try again in a minute." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)), "x-request-id": requestId } },
    );
  }

  let body: { code?: unknown; subtotal?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400, headers: { "x-request-id": requestId } });
  }

  const code = typeof body.code === "string" ? body.code.trim().toUpperCase().slice(0, 40) : "";
  const subtotal = Number(body.subtotal);
  if (!code || !Number.isFinite(subtotal) || subtotal < 0) {
    return NextResponse.json({ ok: false, message: "Enter a coupon code." }, { status: 400, headers: { "x-request-id": requestId } });
  }

  try {
    const outcome = evaluateCoupon(findCoupon(await getCoupons(), code), subtotal);
    if (!outcome.ok) {
      const message =
        outcome.reason === "below-minimum" && outcome.minimumSpend
          ? `${code} works on orders of ₹${outcome.minimumSpend.toLocaleString("en-IN")} or more.`
          : COUPON_REJECTION_COPY[outcome.reason];
      // 200, not 4xx: "this code doesn't apply" is a normal answer, not a failed request.
      return NextResponse.json({ ok: false, message }, { headers: { "x-request-id": requestId, "Cache-Control": "no-store" } });
    }

    return NextResponse.json(
      { ok: true, code, discount: outcome.discount, freeShipping: outcome.freeShipping },
      { headers: { "x-request-id": requestId, "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { ok: false, message: "Could not check that code right now." },
      { status: 503, headers: { "x-request-id": requestId } },
    );
  }
}
