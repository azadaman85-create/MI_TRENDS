import { adminProducts } from "@/lib/admin/data";
import type { AdminProduct } from "@/lib/admin/types";
import { getProductsCollection, type ProductDoc } from "@/lib/db/models";
import type { Product } from "@/lib/types";

/**
 * The catalogue, read from MongoDB.
 *
 * This is the source of truth now. `lib/catalog.ts` is kept only as the seed for a fresh
 * database and as the type anchor — nothing at runtime reads it for the live catalogue.
 */

/** Document -> the shape the panel and the storefront already expect. */
export function toAdminProduct(doc: ProductDoc): AdminProduct {
  const { _id, ...rest } = doc;
  return { ...rest, id: _id };
}

/** The storefront only ever needs the public subset. */
export function toProduct(doc: ProductDoc): Product {
  const p = toAdminProduct(doc);
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    collection: p.collection,
    collectionSlug: p.collectionSlug,
    type: p.type,
    category: p.category,
    colors: p.colors,
    sizes: p.sizes,
    outOfStock: p.outOfStock,
    mrp: p.mrp,
    price: p.price,
    discount: p.discount,
    rating: p.rating,
    reviewCount: p.reviewCount,
    tags: p.tags,
    popularity: p.popularity,
    fit: p.fit,
    fabric: p.fabric,
    sku: p.sku,
    art: p.art,
    palette: p.palette,
    imageUrl: p.imageUrl,
    backImageUrl: p.backImageUrl,
    stock: p.stock,
  };
}

/**
 * Fills an empty collection from the hand-written catalogue, once.
 *
 * Guarded on the collection being completely empty rather than on a flag, so it can never
 * resurrect a product an admin deliberately deleted. Uses an unordered insert and
 * tolerates duplicate-key errors, because two cold starts can race here.
 */
export async function ensureProductsSeeded(): Promise<void> {
  const products = await getProductsCollection();
  if ((await products.estimatedDocumentCount()) > 0) return;

  const docs: ProductDoc[] = adminProducts.map(({ id, ...rest }) => ({ ...rest, _id: id }));
  try {
    await products.insertMany(docs, { ordered: false });
  } catch (error) {
    // 11000 = duplicate key: another instance seeded first, which is the desired outcome.
    const code = (error as { code?: number })?.code;
    if (code !== 11000) throw error;
  }
}

/** Everything the storefront should show, most popular first. */
export async function getActiveProducts(): Promise<Product[]> {
  await ensureProductsSeeded();
  const products = await getProductsCollection();
  const docs = await products.find({ status: "active" }).sort({ popularity: -1 }).toArray();
  return docs.map(toProduct);
}

/** Everything, including drafts and archived — panel only. */
export async function getAllProductsForAdmin(): Promise<AdminProduct[]> {
  await ensureProductsSeeded();
  const products = await getProductsCollection();
  const docs = await products.find({}).sort({ updatedAt: -1 }).toArray();
  return docs.map(toAdminProduct);
}

export async function getActiveProductBySlug(slug: string): Promise<Product | null> {
  await ensureProductsSeeded();
  const products = await getProductsCollection();
  const doc = await products.findOne({ slug, status: "active" });
  return doc ? toProduct(doc) : null;
}
