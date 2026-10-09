import type { Collection } from "mongodb";

import { getDb } from "@/lib/db/mongodb";
import type {
  AdminProduct,
  Banner,
  CategoryNode,
  Coupon,
  OrderLine,
  OrderStatus,
  PaymentMode,
  Review,
} from "@/lib/admin/types";

export type AuthProvider = "password" | "google";

/** The real, persisted customer account — replaces the old localStorage-only record. */
export type CustomerDoc = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  picture?: string;
  provider: AuthProvider;
  /** scrypt, not SHA-256 — see lib/security/password.ts. Absent for Google-only accounts. */
  passwordSalt?: string;
  passwordHash?: string;
  createdAt: string;
  /**
   * Password reset. Only the SHA-256 of the emailed token is stored, so a leaked database
   * dump can't be used to reset anyone's password — the raw token exists only in the
   * customer's inbox. Cleared the moment it's used.
   */
  resetTokenHash?: string;
  resetTokenExpiresAt?: string;
  /**
   * Bumped whenever the password changes. Session cookies carry the version they were
   * issued at, so every session that predates a reset stops being accepted.
   */
  sessionVersion?: number;
  passwordChangedAt?: string;
};

/**
 * An order, created server-side once a Razorpay order exists (`status: "awaiting_payment"`)
 * and finalized once the payment is verified (`status: "pending"`, matching the business
 * statuses in lib/admin/types.ts from there on). This is the fix for the structural gap the
 * earlier security passes flagged repeatedly: the order record now only ever comes from the
 * server, keyed to the customer's real session — never constructed and pushed by the browser.
 */
export type OrderDoc = {
  _id: string;
  customerId: string;
  customerName: string;
  email: string;
  phone: string;
  placedAt: string;
  status: OrderStatus | "awaiting_payment";
  payment: PaymentMode;
  paid: boolean;
  advancePaid?: number;
  lines: OrderLine[];
  subtotal: number;
  discount: number;
  shipping: number;
  codFee: number;
  total: number;
  couponCode: string | null;
  address: { line1: string; area: string; city: string; state: string; pincode: string };
  timeline: { label: string; at: string; done: boolean }[];
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  /**
   * Stamped when an admin marks the order delivered. The return window runs from here,
   * so it is recorded separately rather than inferred from the timeline, whose steps all
   * carry the order's own date.
   */
  deliveredAt?: string;
  /** Set once the customer asks to send something back. One request per order. */
  returnRequest?: ReturnRequest;
};

export type ReturnRequest = {
  requestedAt: string;
  reason: string;
  note?: string;
  /** Which lines are coming back, by their index in `lines`, with the quantity returned. */
  items: { lineIndex: number; quantity: number }[];
  /**
   * Where to send the money for a cash-on-delivery return. Prepaid orders don't carry
   * this — those reverse through Razorpay to whatever paid, and asking would be wrong.
   */
  refundUpi?: string;
  status: "requested" | "approved" | "rejected" | "completed";
};

/**
 * A product, as the panel edits it and the storefront reads it.
 *
 * `AdminProduct` is already `Product` plus the panel-only fields, so one document serves
 * both: the storefront takes the `Product` subset of the rows where status is "active",
 * the panel sees everything. Keeping two shapes in two places is exactly how the
 * catalogue and the panel drifted apart in the first place.
 *
 * `_id` is the numeric product id because that is what carts and order lines already
 * carry; `slug` and `sku` get their own unique indexes.
 */
export type ProductDoc = Omit<AdminProduct, "id"> & { _id: number };

/**
 * An uploaded product photo, stored as bytes in Mongo and served by /api/images/[id].
 *
 * Object storage would be the usual answer, but it needs an account and a key this
 * project doesn't have yet, and a product photo that only exists as base64 in one
 * browser's localStorage — which is what this replaces — is worse than any of the
 * trade-offs here. Images are immutable and served with a one-year cache, so each one is
 * read from the database once and lives on the CDN after that. See ADMIN.md for how to
 * move these to Vercel Blob later without touching the product records.
 */
export type ProductImageDoc = {
  _id: string;
  data: Buffer;
  contentType: string;
  size: number;
  createdAt: string;
};

/**
 * Index creation is idempotent, but issuing it on every request adds a round trip per
 * call for no benefit. These promises make it happen once per process; a failure clears
 * the cache so the next request retries rather than silently running unindexed forever.
 */
let customerIndexes: Promise<void> | undefined;
let orderIndexes: Promise<void> | undefined;
let productIndexes: Promise<void> | undefined;
let contentIndexes: Promise<void> | undefined;
let imageIndexes: Promise<void> | undefined;

function once(current: Promise<void> | undefined, work: () => Promise<unknown>, reset: () => void): Promise<void> {
  if (!current) {
    return work()
      .then(() => undefined)
      .catch((error) => {
        reset();
        throw error;
      });
  }
  return current;
}

export async function getCustomersCollection(): Promise<Collection<CustomerDoc>> {
  const db = await getDb();
  const collection = db.collection<CustomerDoc>("customers");
  customerIndexes = once(
    customerIndexes,
    () => collection.createIndex({ email: 1 }, { unique: true }),
    () => {
      customerIndexes = undefined;
    },
  );
  await customerIndexes;
  return collection;
}

export async function getOrdersCollection(): Promise<Collection<OrderDoc>> {
  const db = await getDb();
  const collection = db.collection<OrderDoc>("orders");
  orderIndexes = once(
    orderIndexes,
    () =>
      Promise.all([
        collection.createIndex({ razorpayOrderId: 1 }, { unique: true }),
        collection.createIndex({ customerId: 1 }),
        collection.createIndex({ placedAt: -1 }),
      ]),
    () => {
      orderIndexes = undefined;
    },
  );
  await orderIndexes;
  return collection;
}

export async function getProductsCollection(): Promise<Collection<ProductDoc>> {
  const db = await getDb();
  const collection = db.collection<ProductDoc>("products");
  productIndexes = once(
    productIndexes,
    () =>
      Promise.all([
        collection.createIndex({ slug: 1 }, { unique: true }),
        collection.createIndex({ sku: 1 }, { unique: true }),
        // The storefront's only query: active rows, most popular first.
        collection.createIndex({ status: 1, popularity: -1 }),
      ]),
    () => {
      productIndexes = undefined;
    },
  );
  await productIndexes;
  return collection;
}

export async function getProductImagesCollection(): Promise<Collection<ProductImageDoc>> {
  const db = await getDb();
  const collection = db.collection<ProductImageDoc>("productImages");
  imageIndexes = once(
    imageIndexes,
    () => collection.createIndex({ createdAt: -1 }),
    () => {
      imageIndexes = undefined;
    },
  );
  await imageIndexes;
  return collection;
}

/**
 * Storefront content the panel edits: banners, the category tree and reviews.
 *
 * Each already carries its own string `id`, which becomes `_id`. They share one helper
 * because they share a shape of problem — small, hand-curated lists that used to live in
 * one browser's localStorage and so were invisible to every customer.
 */
export type BannerDoc = Omit<Banner, "id"> & { _id: string };
export type CategoryDoc = Omit<CategoryNode, "id"> & { _id: string };
export type ReviewDoc = Omit<Review, "id"> & { _id: string };
export type CouponDoc = Omit<Coupon, "id"> & { _id: string };

export async function getBannersCollection(): Promise<Collection<BannerDoc>> {
  const db = await getDb();
  const collection = db.collection<BannerDoc>("banners");
  contentIndexes = once(
    contentIndexes,
    () => collection.createIndex({ status: 1, sortOrder: 1 }),
    () => {
      contentIndexes = undefined;
    },
  );
  await contentIndexes;
  return collection;
}

export async function getCategoriesCollection(): Promise<Collection<CategoryDoc>> {
  return (await getDb()).collection<CategoryDoc>("categories");
}

export async function getReviewsCollection(): Promise<Collection<ReviewDoc>> {
  return (await getDb()).collection<ReviewDoc>("reviews");
}

export async function getCouponsCollection(): Promise<Collection<CouponDoc>> {
  return (await getDb()).collection<CouponDoc>("coupons");
}
