/**
 * Server-trusted order pricing.
 *
 * Previously `/api/create-order` took a plain `amount` number straight from the
 * checkout page and handed it to Razorpay — anyone could intercept that request
 * and lower it before paying, while the storefront UI kept showing the original
 * total. This module recomputes the product subtotal and coupon discount from
 * data the server itself controls (the catalogue, the coupon rules), so the
 * amount actually charged can never be less than what the cart really costs.
 *
 * Shipping and the COD handling fee are the one exception: those come from
 * `lib/store-settings.ts`, which — because this project has no backend/DB — is
 * only ever stored in the *admin's* browser localStorage, with no server-side
 * mirror the Route Handler can read. We still accept those two from the client,
 * but clamp them to a bounded range so a tampered request can only shift the
 * total by a small, capped amount rather than zero it out. A real backend
 * should persist store settings server-side and remove this clamp entirely.
 */
import { getProductById } from "@/lib/catalog";
import { calculateCouponDiscount, isValidCouponCode } from "@/lib/coupons";

export type TrustedOrderLine = {
  productId: number;
  size: string;
  color: string;
  quantity: number;
};

export type PricingResult =
  | {
      ok: true;
      subtotal: number;
      discount: number;
      shipping: number;
      codFee: number;
      /** Full order value — merchandise + shipping + COD fee. */
      total: number;
      /** What Razorpay actually charges right now — the full total for UPI, a clamped share of it for COD. */
      dueNow: number;
    }
  | { ok: false; error: string };

const MAX_QUANTITY_PER_LINE = 10;
const MAX_LINES = 30;
/** Bounds for the client-reported, admin-configurable fields (see module doc above). */
const MAX_SHIPPING = 200;
const MAX_COD_FEE = 200;
/** A COD advance below 10% or above 100% of the order isn't a real admin setting. */
const MIN_ADVANCE_PERCENT = 10;
const MAX_ADVANCE_PERCENT = 100;
const DEFAULT_ADVANCE_PERCENT = 20;

export function priceOrder(input: {
  lines: unknown;
  couponCode: unknown;
  shipping: unknown;
  codFee: unknown;
  paymentMode: unknown;
  advancePercent: unknown;
}): PricingResult {
  const { lines, couponCode, shipping, codFee, paymentMode, advancePercent } = input;

  if (!Array.isArray(lines) || lines.length === 0) {
    return { ok: false, error: "Your bag is empty." };
  }
  if (lines.length > MAX_LINES) {
    return { ok: false, error: "Too many items in one order." };
  }

  let subtotal = 0;
  for (const raw of lines) {
    if (typeof raw !== "object" || raw === null) return { ok: false, error: "Invalid order line." };
    const line = raw as Partial<TrustedOrderLine>;
    const quantity = Number(line.quantity);

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY_PER_LINE) {
      return { ok: false, error: "Invalid quantity." };
    }
    if (typeof line.productId !== "number" && typeof line.productId !== "string") {
      return { ok: false, error: "Invalid product." };
    }

    const product = getProductById(line.productId as number | string);
    if (!product) return { ok: false, error: "One of the items in your bag is no longer available." };

    const size = typeof line.size === "string" ? line.size : "";
    if (!product.sizes.includes(size)) return { ok: false, error: `${product.name} is not available in that size.` };
    if (product.outOfStock.includes(size)) return { ok: false, error: `${product.name} (${size}) is out of stock.` };

    const colorName = typeof line.color === "string" ? line.color : "";
    if (!product.colors.some((c) => c.name === colorName)) {
      return { ok: false, error: `${product.name} is not available in that colour.` };
    }

    // The catalogue's own price — never the client's — is what gets charged.
    subtotal += product.price * quantity;
  }

  const code = typeof couponCode === "string" ? couponCode.trim().toUpperCase() : "";
  const discount = code && isValidCouponCode(code) ? calculateCouponDiscount(code, subtotal) : 0;

  const clampedShipping = clamp(Number(shipping) || 0, 0, MAX_SHIPPING);
  const clampedCodFee = clamp(Number(codFee) || 0, 0, MAX_COD_FEE);

  const total = Math.max(0, subtotal - discount) + clampedShipping + clampedCodFee;

  const isCod = paymentMode === "cod";
  const advancePercentNum = Number(advancePercent);
  const clampedAdvancePercent = isCod
    ? clamp(Number.isFinite(advancePercentNum) ? advancePercentNum : DEFAULT_ADVANCE_PERCENT, MIN_ADVANCE_PERCENT, MAX_ADVANCE_PERCENT)
    : 100;
  const dueNow = isCod ? Math.round((total * clampedAdvancePercent) / 100) : total;

  return { ok: true, subtotal, discount, shipping: clampedShipping, codFee: clampedCodFee, total, dueNow };
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}
