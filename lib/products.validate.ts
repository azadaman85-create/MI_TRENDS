import type { AdminProduct, ProductStatus } from "@/lib/admin/types";
import type { ProductColor } from "@/lib/types";

/**
 * Turns whatever the panel posted into a product the database will accept.
 *
 * Everything is rebuilt field by field rather than spread from the request: a spread
 * would let the browser write `_id`, `createdAt`, or any field invented later. Prices and
 * stock are the fields worth being strict about — they decide what a customer is charged
 * and whether an order can be placed at all.
 */

const STATUSES: ProductStatus[] = ["active", "draft", "archived"];
const CATEGORIES = ["men", "women", "unisex"] as const;
const TAGS = ["new", "bestseller", "sale"] as const;

const MAX_TEXT = 200;
const MAX_LONG_TEXT = 4000;
const MAX_PRICE = 1_000_000;
const MAX_IMAGES = 8;
const MAX_SIZES = 20;

type Normalised = Omit<AdminProduct, "id" | "createdAt" | "updatedAt">;
export type NormaliseResult = { ok: true; value: Normalised } | { ok: false; error: string };

const str = (v: unknown, max = MAX_TEXT) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : Number(v));

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function normaliseProduct(input: unknown): NormaliseResult {
  if (typeof input !== "object" || input === null) return { ok: false, error: "Invalid product." };
  const raw = input as Record<string, unknown>;

  const name = str(raw.name);
  if (name.length < 2) return { ok: false, error: "Enter a product name." };

  const slug = slugify(str(raw.slug) || name);
  if (!slug) return { ok: false, error: "This product needs a usable slug." };

  const sku = str(raw.sku, 40).toUpperCase();
  if (sku.length < 2) return { ok: false, error: "Enter a SKU." };

  const price = num(raw.price);
  const mrp = num(raw.mrp);
  if (!Number.isFinite(price) || price <= 0 || price > MAX_PRICE) {
    return { ok: false, error: "Enter a selling price above zero." };
  }
  if (!Number.isFinite(mrp) || mrp < price || mrp > MAX_PRICE) {
    return { ok: false, error: "The MRP must be at least the selling price." };
  }

  const status = STATUSES.includes(raw.status as ProductStatus) ? (raw.status as ProductStatus) : "draft";

  const category = (CATEGORIES as readonly string[]).includes(str(raw.category))
    ? (str(raw.category) as AdminProduct["category"])
    : "unisex";

  const sizes = Array.isArray(raw.sizes)
    ? [...new Set(raw.sizes.map((s) => str(s, 12)).filter(Boolean))].slice(0, MAX_SIZES)
    : [];
  if (sizes.length === 0) return { ok: false, error: "Add at least one size." };

  const colors: ProductColor[] = Array.isArray(raw.colors)
    ? raw.colors
        .map((c) => {
          const o = (typeof c === "object" && c !== null ? c : {}) as Record<string, unknown>;
          return { name: str(o.name, 40), hex: str(o.hex, 9) };
        })
        .filter((c) => c.name && /^#[0-9a-fA-F]{3,8}$/.test(c.hex))
        .slice(0, 12)
    : [];
  if (colors.length === 0) return { ok: false, error: "Add at least one colour." };

  // Stock is keyed by size; anything for a size this product doesn't sell is dropped.
  const stock: Record<string, number> = {};
  const rawStock = (typeof raw.stock === "object" && raw.stock !== null ? raw.stock : {}) as Record<string, unknown>;
  for (const size of sizes) {
    const units = Math.floor(num(rawStock[size]));
    stock[size] = Number.isFinite(units) && units > 0 ? Math.min(units, 100_000) : 0;
  }

  const images = Array.isArray(raw.images)
    ? raw.images.map((i) => str(i, 500)).filter(Boolean).slice(0, MAX_IMAGES)
    : [];

  const tags = Array.isArray(raw.tags)
    ? ([...new Set(raw.tags.map((t) => str(t, 20)))].filter((t) =>
        (TAGS as readonly string[]).includes(t),
      ) as AdminProduct["tags"])
    : [];

  const paletteRaw = Array.isArray(raw.palette) ? raw.palette.map((p) => str(p, 9)) : [];
  const palette: [string, string, string] = [
    paletteRaw[0] || colors[0]!.hex,
    paletteRaw[1] || colors[1]?.hex || "#131313",
    paletteRaw[2] || colors[2]?.hex || "#f3f0ea",
  ];

  // Derived, never trusted from the client: a stale browser could report a discount that
  // doesn't match the prices beside it.
  const discount = mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const outOfStock = sizes.filter((size) => stock[size]! <= 0);

  return {
    ok: true,
    value: {
      name,
      slug,
      sku,
      collection: str(raw.collection) || "Everyday Icons",
      collectionSlug: slugify(str(raw.collectionSlug) || str(raw.collection) || "everyday-icons"),
      type: str(raw.type) || "T-shirt",
      category,
      colors,
      sizes,
      outOfStock,
      mrp,
      price,
      discount,
      rating: Math.min(5, Math.max(0, num(raw.rating) || 0)),
      reviewCount: Math.max(0, Math.floor(num(raw.reviewCount) || 0)),
      tags,
      popularity: Math.max(0, Math.floor(num(raw.popularity) || 0)),
      fit: str(raw.fit),
      fabric: str(raw.fabric),
      art: str(raw.art),
      palette,
      imageUrl: images[0],
      backImageUrl: images[1],
      images,
      status,
      featured: Boolean(raw.featured),
      stock,
      costPrice: Math.max(0, num(raw.costPrice) || 0),
      seoTitle: str(raw.seoTitle),
      seoDescription: str(raw.seoDescription, 400),
      description: str(raw.description, MAX_LONG_TEXT),
    },
  };
}
