import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/guard.server";
import type { AdminProduct } from "@/lib/admin/types";
import { getProductsCollection, type ProductDoc } from "@/lib/db/models";
import { ensureProductsSeeded, getAllProductsForAdmin } from "@/lib/products.server";
import { normaliseProduct } from "@/lib/products.validate";
import { RATE_LIMITS } from "@/lib/security/config";
import { logSecurityEvent } from "@/lib/security/events";
import { clientIpFrom, consumeRateLimit } from "@/lib/security/rate-limit";
import { requestIdFrom } from "@/lib/security/request-id";

const ENDPOINT = "/api/admin/products";

/** The whole catalogue, drafts and archived included. */
export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  const ip = clientIpFrom(request);

  const { limit, windowMs } = RATE_LIMITS.adminData;
  if (!consumeRateLimit(`admin-products:${ip}`, limit, windowMs).ok) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429, headers: { "x-request-id": requestId } });
  }

  const admin = await requireAdmin();
  if (!admin) {
    logSecurityEvent({ type: "SUSPICIOUS_REQUEST", requestId, ip, endpoint: ENDPOINT, result: "blocked", risk: "high", meta: { reason: "no-admin-session" } });
    return NextResponse.json({ error: "Not authorized." }, { status: 401, headers: { "x-request-id": requestId } });
  }

  try {
    return NextResponse.json(
      { products: await getAllProductsForAdmin() },
      { headers: { "x-request-id": requestId, "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "Could not load products." }, { status: 503, headers: { "x-request-id": requestId } });
  }
}

/** Creates a product. The id is assigned here, never taken from the browser. */
export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  const ip = clientIpFrom(request);

  const { limit, windowMs } = RATE_LIMITS.adminData;
  if (!consumeRateLimit(`admin-product-write:${ip}`, limit, windowMs).ok) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429, headers: { "x-request-id": requestId } });
  }

  const admin = await requireAdmin();
  if (!admin) {
    logSecurityEvent({ type: "SUSPICIOUS_REQUEST", requestId, ip, endpoint: ENDPOINT, result: "blocked", risk: "high", meta: { reason: "no-admin-session" } });
    return NextResponse.json({ error: "Not authorized." }, { status: 401, headers: { "x-request-id": requestId } });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400, headers: { "x-request-id": requestId } });
  }

  const parsed = normaliseProduct(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400, headers: { "x-request-id": requestId } });
  }

  try {
    // Before anything is written: an empty collection must be filled from the catalogue
    // first, or this product takes an id the seed was about to use.
    await ensureProductsSeeded();
    const products = await getProductsCollection();
    // The browser doesn't get to choose an id — it could collide with, or overwrite, an
    // existing product.
    const highest = await products.find({}).sort({ _id: -1 }).limit(1).toArray();
    const nextId = (highest[0]?._id ?? 1000) + 1;

    const now = new Date().toISOString();
    const doc: ProductDoc = { ...parsed.value, _id: nextId, createdAt: now, updatedAt: now };

    await products.insertOne(doc);

    logSecurityEvent({ type: "ADMIN_ACTION", requestId, ip, endpoint: ENDPOINT, result: "allowed", risk: "low", meta: { action: "product-create", product: nextId, status: doc.status, admin: admin.email } });

    const { _id, ...rest } = doc;
    return NextResponse.json(
      { ok: true, product: { ...rest, id: _id } satisfies AdminProduct },
      { headers: { "x-request-id": requestId } },
    );
  } catch (error) {
    if ((error as { code?: number })?.code === 11000) {
      return NextResponse.json(
        { error: "A product with that slug or SKU already exists." },
        { status: 409, headers: { "x-request-id": requestId } },
      );
    }
    return NextResponse.json({ error: "Could not save the product." }, { status: 503, headers: { "x-request-id": requestId } });
  }
}
