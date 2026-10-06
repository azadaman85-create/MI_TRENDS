import type { Collection } from "mongodb";

import { getDb } from "@/lib/db/mongodb";
import type { OrderLine, OrderStatus, PaymentMode } from "@/lib/admin/types";

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
  status: "requested" | "approved" | "rejected" | "completed";
};

/**
 * Index creation is idempotent, but issuing it on every request adds a round trip per
 * call for no benefit. These promises make it happen once per process; a failure clears
 * the cache so the next request retries rather than silently running unindexed forever.
 */
let customerIndexes: Promise<void> | undefined;
let orderIndexes: Promise<void> | undefined;

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
