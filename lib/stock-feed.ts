/**
 * Hand-off between the admin inventory screen and the storefront.
 *
 * The mirror image of `lib/order-inbox.ts`: orders travel storefront → panel, stock
 * travels panel → storefront. There is no backend, so saved stock is written to its own
 * localStorage key and the storefront reads it when rendering a product.
 *
 * Keeping it in a separate key means the storefront never imports the admin's seed data,
 * and a shopper who has never opened the panel simply falls back to the catalogue's own
 * `outOfStock` list.
 */
const STOCK_KEY = "mitrends-stock-v1";

/** productId → size → units on hand. */
export type StockFeed = Record<string, Record<string, number>>;

/** Broadcast so an open storefront tab can react without a reload. */
export const STOCK_EVENT = "mitrends:stock";

export function readStockFeed(): StockFeed {
  try {
    const raw = window.localStorage.getItem(STOCK_KEY);
    const parsed = raw ? (JSON.parse(raw) as StockFeed) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    // Storage unavailable (private mode, blocked cookies) — fall back to the catalogue.
    return {};
  }
}

/** Called when the panel saves. Replaces the feed wholesale: the panel is the source of truth. */
export function publishStockFeed(feed: StockFeed) {
  try {
    window.localStorage.setItem(STOCK_KEY, JSON.stringify(feed));
    // `storage` only fires in *other* tabs, so dispatch locally too.
    window.dispatchEvent(new CustomEvent(STOCK_EVENT));
    return true;
  } catch {
    return false;
  }
}

/**
 * Units on hand for one size, or `null` when the panel has never published this product
 * and the caller should trust the catalogue instead.
 */
export function unitsFor(feed: StockFeed, productId: number | string, size: string): number | null {
  const entry = feed[String(productId)];
  if (!entry) return null;
  const units = entry[size];
  return typeof units === "number" ? units : null;
}

/**
 * Which sizes are sold out, preferring saved stock and falling back to the catalogue.
 *
 * A size the panel has never published keeps whatever the catalogue said, so publishing
 * stock for one product never silently marks every other product in stock.
 */
export function soldOutSizes(
  feed: StockFeed,
  productId: number | string,
  sizes: readonly string[],
  catalogueOutOfStock: readonly string[],
): string[] {
  const entry = feed[String(productId)];
  if (!entry) return [...catalogueOutOfStock];
  return sizes.filter((size) => {
    const units = entry[size];
    return typeof units === "number" ? units <= 0 : catalogueOutOfStock.includes(size);
  });
}
