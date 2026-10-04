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
};

export async function getCustomersCollection(): Promise<Collection<CustomerDoc>> {
  const db = await getDb();
  const collection = db.collection<CustomerDoc>("customers");
  // Safe to call on every connection — Mongo no-ops if the index already exists.
  await collection.createIndex({ email: 1 }, { unique: true });
  return collection;
}

export async function getOrdersCollection(): Promise<Collection<OrderDoc>> {
  const db = await getDb();
  const collection = db.collection<OrderDoc>("orders");
  await collection.createIndex({ razorpayOrderId: 1 }, { unique: true });
  await collection.createIndex({ customerId: 1 });
  await collection.createIndex({ placedAt: -1 });
  return collection;
}
