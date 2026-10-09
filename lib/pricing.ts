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
 * `lib/store-settings.ts`, which is still only stored in the *admin's* browser
 * localStorage, with no server-side copy the Route Handler can read (customers and
 * orders moved to MongoDB; store settings did not). We still accept those two from
 * the client but clamp them to a bounded range, so a tampered request can only shift
 * the total by a small, capped amount rather than zero it out. Moving settings into
 * MongoDB too would let this clamp go away entirely.
 */
import { getActiveProducts } from "@/lib/products.server";
import { getCoupons } from "@/lib/content.server";
import { couponDiscount } from "@/lib/coupons";
import type { OrderLine } from "@/lib/admin/types";

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
      /**
       * What's collected online right now: the full total for a prepaid order, and
       * **zero** for COD — a COD shopper pays the courier on delivery and is never sent
       * to the payment gateway.
       */
      dueNow: number;
      /**
       * The order lines rebuilt from the catalogue — name, SKU, price and image come from
       * the server's own product data, so the stored order can't carry a client-invented
       * product name or price alongside a correct total.
       */
      lines: OrderLine[];
    }
  | { ok: false; error: string };

const MAX_QUANTITY_PER_LINE = 10;
const MAX_LINES = 30;
/** Bounds for the client-reported, admin-configurable fields (see module doc above). */
const MAX_SHIPPING = 200;
const MAX_COD_FEE = 200;

export async function priceOrder(input: {
  lines: unknown;
  couponCode: unknown;
  shipping: unknown;
  codFee: unknown;
  paymentMode: unknown;
}): Promise<PricingResult> {
  const { lines, couponCode, shipping, codFee, paymentMode } = input;

  // Priced against the database, not a compiled-in list: a product published from the
  // panel has to be purchasable, and one that has been unpublished or deleted has to
  // stop being purchasable. Loaded once and indexed, rather than queried per line.
  const [catalogueList, coupons] = await Promise.all([getActiveProducts(), getCoupons()]);
  const catalogue = new Map(catalogueList.map((product) => [String(product.id), product]));
  const getProductById = (id: number | string) => catalogue.get(String(id));

  if (!Array.isArray(lines) || lines.length === 0) {
    return { ok: false, error: "Your bag is empty." };
  }
  if (lines.length > MAX_LINES) {
    return { ok: false, error: "Too many items in one order." };
  }

  let subtotal = 0;
  const pricedLines: OrderLine[] = [];
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
    pricedLines.push({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      size,
      color: colorName,
      quantity,
      price: product.price,
      imageUrl: product.imageUrl,
    });
  }

  const code = typeof couponCode === "string" ? couponCode.trim().toUpperCase() : "";
  // Evaluated against the coupon records in the database, so a code an admin created
  // actually works and one they paused actually stops.
  const discount = couponDiscount(coupons, code, subtotal);

  const clampedShipping = clamp(Number(shipping) || 0, 0, MAX_SHIPPING);
  const clampedCodFee = clamp(Number(codFee) || 0, 0, MAX_COD_FEE);

  const total = Math.max(0, subtotal - discount) + clampedShipping + clampedCodFee;

  // COD collects nothing online; everything else is charged in full.
  const dueNow = paymentMode === "cod" ? 0 : total;

  return { ok: true, subtotal, discount, shipping: clampedShipping, codFee: clampedCodFee, total, dueNow, lines: pricedLines };
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}
