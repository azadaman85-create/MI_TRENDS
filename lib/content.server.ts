import {
  banners as seedBanners,
  categoryTree as seedCategories,
  reviews as seedReviews,
} from "@/lib/admin/data";
import type { Banner, CategoryNode, Review } from "@/lib/admin/types";
import {
  getBannersCollection,
  getCategoriesCollection,
  getReviewsCollection,
  type BannerDoc,
  type CategoryDoc,
  type ReviewDoc,
} from "@/lib/db/models";

/**
 * Banners, categories and reviews, read from MongoDB.
 *
 * All three used to live in one browser's localStorage, which meant a banner the owner
 * added was visible to the owner and to nobody else. They are small, hand-curated lists,
 * so each is read and written whole rather than row by row — simpler than six endpoints,
 * and the panel already holds the entire list in memory. The trade-off is last-write-wins
 * when two people edit the same list at once, which is fine for a single-owner store.
 *
 * Seeding fills a collection only when it is completely empty, so it can never bring
 * back something deliberately deleted. Same rule as the product seeding.
 */

/* ---------------------------------- banners --------------------------------- */

export async function getBanners(): Promise<Banner[]> {
  const collection = await getBannersCollection();
  if ((await collection.estimatedDocumentCount()) === 0 && seedBanners.length > 0) {
    const docs: BannerDoc[] = seedBanners.map(({ id, ...rest }) => ({ ...rest, _id: id }));
    await collection.insertMany(docs, { ordered: false }).catch(ignoreDuplicate);
  }
  const docs = await collection.find({}).sort({ sortOrder: 1 }).toArray();
  return docs.map(({ _id, ...rest }) => ({ ...rest, id: _id }));
}

/**
 * What the storefront shows: banners marked live and currently inside their scheduling
 * window, in display order.
 *
 * The window is evaluated here rather than in the browser because "is this banner
 * running right now" is a fact about the data, not a rendering decision — and reading
 * the clock during render is exactly the kind of impurity React warns about.
 */
export async function getLiveBanners(): Promise<Banner[]> {
  const now = Date.now();
  return (await getBanners())
    .filter((banner) => banner.status === "live")
    .filter((banner) => {
      const starts = banner.startsAt ? Date.parse(banner.startsAt) : Number.NaN;
      const ends = banner.endsAt ? Date.parse(banner.endsAt) : Number.NaN;
      if (Number.isFinite(starts) && now < starts) return false;
      if (Number.isFinite(ends) && now > ends) return false;
      return true;
    });
}

export async function replaceBanners(items: Banner[]): Promise<void> {
  const collection = await getBannersCollection();
  await collection.bulkWrite(
    [
      ...items.map(({ id, ...rest }) => ({
        updateOne: { filter: { _id: id }, update: { $set: rest }, upsert: true },
      })),
      { deleteMany: { filter: { _id: { $nin: items.map((item) => item.id) } } } },
    ],
    { ordered: true },
  );
}

/* -------------------------------- categories -------------------------------- */

export async function getCategories(): Promise<CategoryNode[]> {
  const collection = await getCategoriesCollection();
  if ((await collection.estimatedDocumentCount()) === 0 && seedCategories.length > 0) {
    const docs: CategoryDoc[] = seedCategories.map(({ id, ...rest }) => ({ ...rest, _id: id }));
    await collection.insertMany(docs, { ordered: false }).catch(ignoreDuplicate);
  }
  const docs = await collection.find({}).toArray();
  return docs.map(({ _id, ...rest }) => ({ ...rest, id: _id }));
}

export async function replaceCategories(items: CategoryNode[]): Promise<void> {
  const collection = await getCategoriesCollection();
  await collection.bulkWrite(
    [
      ...items.map(({ id, ...rest }) => ({
        updateOne: { filter: { _id: id }, update: { $set: rest }, upsert: true },
      })),
      { deleteMany: { filter: { _id: { $nin: items.map((item) => item.id) } } } },
    ],
    { ordered: true },
  );
}

/* ---------------------------------- reviews --------------------------------- */

export async function getReviews(): Promise<Review[]> {
  const collection = await getReviewsCollection();
  if ((await collection.estimatedDocumentCount()) === 0 && seedReviews.length > 0) {
    const docs: ReviewDoc[] = seedReviews.map(({ id, ...rest }) => ({ ...rest, _id: id }));
    await collection.insertMany(docs, { ordered: false }).catch(ignoreDuplicate);
  }
  const docs = await collection.find({}).sort({ createdAt: -1 }).toArray();
  return docs.map(({ _id, ...rest }) => ({ ...rest, id: _id }));
}

export async function replaceReviews(items: Review[]): Promise<void> {
  const collection = await getReviewsCollection();
  await collection.bulkWrite(
    [
      ...items.map(({ id, ...rest }) => ({
        updateOne: { filter: { _id: id }, update: { $set: rest }, upsert: true },
      })),
      { deleteMany: { filter: { _id: { $nin: items.map((item) => item.id) } } } },
    ],
    { ordered: true },
  );
}

/** Two cold starts can race the seed; the loser's duplicate-key error is the right outcome. */
function ignoreDuplicate(error: unknown): void {
  if ((error as { code?: number })?.code !== 11000) throw error;
}
