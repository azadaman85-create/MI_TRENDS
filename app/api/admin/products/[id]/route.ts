import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/guard.server";
import { getProductsCollection } from "@/lib/db/models";
import { ensureProductsSeeded } from "@/lib/products.server";
import { normaliseProduct } from "@/lib/products.validate";
import { RATE_LIMITS } from "@/lib/security/config";
import { logSecurityEvent } from "@/lib/security/events";
import { clientIpFrom, consumeRateLimit } from "@/lib/security/rate-limit";
import { requestIdFrom } from "@/lib/security/request-id";

const ENDPOINT = "/api/admin/products/[id]";

async function guard(request: Request) {
  const requestId = requestIdFrom(request);
  const ip = clientIpFrom(request);

  const { limit, windowMs } = RATE_LIMITS.adminData;
  if (!consumeRateLimit(`admin-product-write:${ip}`, limit, windowMs).ok) {
    return { requestId, ip, admin: null, deny: NextResponse.json({ error: "Too many requests." }, { status: 429, headers: { "x-request-id": requestId } }) };
  }
  const admin = await requireAdmin();
  if (!admin) {
    logSecurityEvent({ type: "SUSPICIOUS_REQUEST", requestId, ip, endpoint: ENDPOINT, result: "blocked", risk: "high", meta: { reason: "no-admin-session" } });
    return { requestId, ip, admin: null, deny: NextResponse.json({ error: "Not authorized." }, { status: 401, headers: { "x-request-id": requestId } }) };
  }
  return { requestId, ip, admin, deny: null };
}

/**
 * Saves an edit, which is also how Publish works: the panel sends the product with
 * `status: "active"`, and the storefront query picks it up on the next read. There is no
 * separate publish endpoint, because "published" is not a separate thing to get out of
 * sync — it is this one field.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { requestId, ip, admin, deny } = await guard(request);
  if (deny || !admin) return deny!;

  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Unknown product." }, { status: 400, headers: { "x-request-id": requestId } });
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
    await ensureProductsSeeded();
    const products = await getProductsCollection();
    // createdAt is deliberately absent from the update — an edit must not rewrite it.
    const result = await products.findOneAndUpdate(
      { _id: id },
      { $set: { ...parsed.value, updatedAt: new Date().toISOString() } },
      { returnDocument: "after" },
    );
    if (!result) {
      return NextResponse.json({ error: "Product not found." }, { status: 404, headers: { "x-request-id": requestId } });
    }

    logSecurityEvent({ type: "ADMIN_ACTION", requestId, ip, endpoint: ENDPOINT, result: "allowed", risk: "low", meta: { action: "product-update", product: id, status: parsed.value.status, admin: admin.email } });

    const { _id, ...rest } = result;
    return NextResponse.json({ ok: true, product: { ...rest, id: _id } }, { headers: { "x-request-id": requestId } });
  } catch (error) {
    if ((error as { code?: number })?.code === 11000) {
      return NextResponse.json(
        { error: "Another product already uses that slug or SKU." },
        { status: 409, headers: { "x-request-id": requestId } },
      );
    }
    return NextResponse.json({ error: "Could not save the product." }, { status: 503, headers: { "x-request-id": requestId } });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { requestId, ip, admin, deny } = await guard(request);
  if (deny || !admin) return deny!;

  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Unknown product." }, { status: 400, headers: { "x-request-id": requestId } });
  }

  try {
    await ensureProductsSeeded();
    const products = await getProductsCollection();
    const result = await products.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Product not found." }, { status: 404, headers: { "x-request-id": requestId } });
    }

    logSecurityEvent({ type: "ADMIN_ACTION", requestId, ip, endpoint: ENDPOINT, result: "allowed", risk: "medium", meta: { action: "product-delete", product: id, admin: admin.email } });

    // Past orders keep their own copy of name, price and SKU per line, so deleting a
    // product never rewrites order history.
    return NextResponse.json({ ok: true }, { headers: { "x-request-id": requestId } });
  } catch {
    return NextResponse.json({ error: "Could not delete the product." }, { status: 503, headers: { "x-request-id": requestId } });
  }
}
