import type { Coupon } from "@/lib/admin/types";

/**
 * Coupon rules.
 *
 * These are pure functions over a coupon record so the same logic runs in two places:
 * the server, which computes the discount that is actually charged (lib/pricing.ts), and
 * the browser, which only previews it. The server never trusts the browser's number.
 *
 * The rules used to be a hardcoded switch over three literal codes, which meant the
 * admin Coupons screen could create a coupon that no checkout had ever heard of.
 */

export type CouponOutcome =
  | { ok: true; discount: number; freeShipping: boolean }
  | { ok: false; reason: CouponRejection; minimumSpend?: number };

export type CouponRejection = "unknown" | "inactive" | "not-started" | "expired" | "exhausted" | "below-minimum";

export const COUPON_REJECTION_COPY: Record<CouponRejection, string> = {
  unknown: "That code isn't valid.",
  inactive: "That code isn't active right now.",
  "not-started": "That code isn't active yet.",
  expired: "That code has expired.",
  exhausted: "That code has been fully claimed.",
  "below-minimum": "Your bag is below the minimum for that code.",
};

/** Case-insensitive lookup; shoppers type codes however they like. */
export function findCoupon(coupons: Coupon[], code: string | null): Coupon | undefined {
  if (!code) return undefined;
  const wanted = code.trim().toUpperCase();
  return coupons.find((coupon) => coupon.code.trim().toUpperCase() === wanted);
}

/**
 * Decides whether a coupon applies to this subtotal, and for how much.
 *
 * `now` is a parameter rather than a call to Date.now() so the caller controls the clock
 * — the server passes the real time, and tests can pass a fixed one.
 */
export function evaluateCoupon(coupon: Coupon | undefined, subtotal: number, now = Date.now()): CouponOutcome {
  if (!coupon) return { ok: false, reason: "unknown" };
  if (coupon.status === "paused" || coupon.status === "expired") {
    return { ok: false, reason: coupon.status === "expired" ? "expired" : "inactive" };
  }

  // The dates are the authority, not the stored status, which can go stale between
  // whenever an admin last touched it and now.
  const starts = coupon.startsAt ? Date.parse(coupon.startsAt) : Number.NaN;
  const ends = coupon.expiresAt ? Date.parse(coupon.expiresAt) : Number.NaN;
  if (Number.isFinite(starts) && now < starts) return { ok: false, reason: "not-started" };
  if (Number.isFinite(ends) && now > ends) return { ok: false, reason: "expired" };

  if (coupon.usageLimit > 0 && coupon.usage >= coupon.usageLimit) {
    return { ok: false, reason: "exhausted" };
  }
  if (subtotal < coupon.minimumSpend) {
    return { ok: false, reason: "below-minimum", minimumSpend: coupon.minimumSpend };
  }

  if (coupon.type === "shipping") return { ok: true, discount: 0, freeShipping: true };

  const raw = coupon.type === "percent" ? Math.round((subtotal * coupon.value) / 100) : Math.round(coupon.value);
  // Never let a coupon exceed the bag — a 200-off code on a 150 bag must not pay the
  // customer, and a misconfigured 200% percentage must not either.
  return { ok: true, discount: Math.max(0, Math.min(raw, subtotal)), freeShipping: false };
}

/** Convenience for callers that only want the number. */
export function couponDiscount(coupons: Coupon[], code: string | null, subtotal: number, now = Date.now()): number {
  const outcome = evaluateCoupon(findCoupon(coupons, code), subtotal, now);
  return outcome.ok ? outcome.discount : 0;
}

export function couponFreeShipping(coupons: Coupon[], code: string | null, subtotal: number, now = Date.now()): boolean {
  const outcome = evaluateCoupon(findCoupon(coupons, code), subtotal, now);
  return outcome.ok && outcome.freeShipping;
}
