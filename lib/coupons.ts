/**
 * Coupon rules — the single source of truth for both the storefront UI
 * (components/StoreProvider.tsx) and the server-side order-pricing calculator
 * (lib/pricing.ts). Pulled out so the Route Handler that creates a payment
 * order can recompute the discount itself instead of trusting a client-sent
 * number — see lib/pricing.ts for why that matters.
 */
export const VALID_COUPON_CODES = ["MI10", "FLAT200", "FIRST15"] as const;
export type CouponCode = (typeof VALID_COUPON_CODES)[number];

export function isValidCouponCode(code: string): code is CouponCode {
  return (VALID_COUPON_CODES as readonly string[]).includes(code);
}

export function couponMinimum(code: string): number {
  if (code === "FLAT200") return 1499;
  if (code === "FIRST15") return 999;
  return 0;
}

export function calculateCouponDiscount(code: string | null, subtotal: number): number {
  if (!code || subtotal <= 0 || subtotal < couponMinimum(code)) return 0;

  switch (code) {
    case "MI10":
      return Math.round(subtotal * 0.1);
    case "FLAT200":
      return 200;
    case "FIRST15":
      return Math.min(400, Math.round(subtotal * 0.15));
    default:
      return 0;
  }
}
