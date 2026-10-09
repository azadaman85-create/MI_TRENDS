import type { Banner, CategoryNode, Review } from "@/lib/admin/types";

/**
 * Rebuilds banners, categories and reviews from whatever the panel posted.
 *
 * Field by field rather than spread, for the same reason the product validator does it:
 * a spread lets the browser write any key it likes, including ones added later. Rows
 * that can't be made sense of are dropped rather than rejecting the whole list — losing
 * one malformed banner is better than refusing to save the other nine.
 */

const MAX_ITEMS = 200;
const MAX_TEXT = 200;
const MAX_BODY = 2000;

const str = (v: unknown, max = MAX_TEXT) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : Number(v) || 0);

const slugify = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

/** Only paths and https URLs — a javascript: or data: link in a banner would be an XSS. */
function safeLink(value: unknown): string {
  const link = str(value, 500);
  if (!link) return "";
  if (link.startsWith("/")) return link;
  try {
    const url = new URL(link);
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

const BANNER_PLACEMENTS: Banner["placement"][] = ["hero", "strip", "category", "popup"];
const BANNER_STATUSES: Banner["status"][] = ["live", "scheduled", "draft"];

export function normaliseBanners(input: unknown[]): Banner[] {
  return input
    .slice(0, MAX_ITEMS)
    .map((raw, index): Banner | null => {
      if (typeof raw !== "object" || raw === null) return null;
      const b = raw as Record<string, unknown>;
      const id = str(b.id, 64) || `banner-${index}`;
      const title = str(b.title);
      if (!title) return null;
      return {
        id,
        title,
        subtitle: str(b.subtitle, 300),
        placement: BANNER_PLACEMENTS.includes(b.placement as Banner["placement"])
          ? (b.placement as Banner["placement"])
          : "hero",
        imageUrl: safeLink(b.imageUrl),
        link: safeLink(b.link),
        status: BANNER_STATUSES.includes(b.status as Banner["status"]) ? (b.status as Banner["status"]) : "draft",
        startsAt: str(b.startsAt, 40),
        endsAt: str(b.endsAt, 40),
        sortOrder: Math.floor(num(b.sortOrder)) || index,
      };
    })
    .filter((b): b is Banner => b !== null);
}

export function normaliseCategories(input: unknown[]): CategoryNode[] {
  const seen = new Set<string>();
  return input
    .slice(0, MAX_ITEMS)
    .map((raw, index): CategoryNode | null => {
      if (typeof raw !== "object" || raw === null) return null;
      const c = raw as Record<string, unknown>;
      const name = str(c.name, 80);
      if (!name) return null;
      const id = str(c.id, 64) || `category-${index}`;
      if (seen.has(id)) return null;
      seen.add(id);
      return {
        id,
        name,
        slug: slugify(str(c.slug, 80) || name),
        parent: typeof c.parent === "string" && c.parent ? str(c.parent, 64) : null,
        productCount: Math.max(0, Math.floor(num(c.productCount))),
        status: c.status === "hidden" ? "hidden" : "visible",
        description: str(c.description, 500),
      };
    })
    .filter((c): c is CategoryNode => c !== null);
}

const REVIEW_STATUSES: Review["status"][] = ["pending", "published", "rejected"];

export function normaliseReviews(input: unknown[]): Review[] {
  return input
    .slice(0, MAX_ITEMS)
    .map((raw, index): Review | null => {
      if (typeof raw !== "object" || raw === null) return null;
      const r = raw as Record<string, unknown>;
      const id = str(r.id, 64) || `review-${index}`;
      const body = str(r.body, MAX_BODY);
      if (!body) return null;
      return {
        id,
        productId: Math.floor(num(r.productId)),
        productName: str(r.productName),
        customerName: str(r.customerName, 80),
        // Clamped rather than rejected: a bad rating shouldn't lose the written review.
        rating: Math.min(5, Math.max(1, Math.round(num(r.rating)) || 5)),
        title: str(r.title),
        body,
        createdAt: str(r.createdAt, 40) || new Date().toISOString(),
        status: REVIEW_STATUSES.includes(r.status as Review["status"]) ? (r.status as Review["status"]) : "pending",
      };
    })
    .filter((r): r is Review => r !== null);
}
