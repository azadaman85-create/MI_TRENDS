import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/guard.server";
import { getOrdersCollection } from "@/lib/db/models";
import { RATE_LIMITS } from "@/lib/security/config";
import { logSecurityEvent } from "@/lib/security/events";
import { clientIpFrom, consumeRateLimit } from "@/lib/security/rate-limit";
import { requestIdFrom } from "@/lib/security/request-id";

const ENDPOINT = "/api/admin/orders";
/** Enough for the panel's list views; paginate here if the order book outgrows it. */
const MAX_ORDERS = 500;

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  const ip = clientIpFrom(request);

  const { limit, windowMs } = RATE_LIMITS.adminData;
  const { ok: withinLimit } = consumeRateLimit(`admin-orders:${ip}`, limit, windowMs);
  if (!withinLimit) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429, headers: { "x-request-id": requestId } });
  }

  const admin = await requireAdmin();
  if (!admin) {
    logSecurityEvent({ type: "SUSPICIOUS_REQUEST", requestId, ip, endpoint: ENDPOINT, result: "blocked", risk: "high", meta: { reason: "no-admin-session" } });
    return NextResponse.json({ error: "Not authorized." }, { status: 401, headers: { "x-request-id": requestId } });
  }

  try {
    const orders = await getOrdersCollection();
    // "awaiting_payment" rows are checkouts that never completed — not orders, so the
    // panel never sees them.
    const docs = await orders
      .find({ status: { $ne: "awaiting_payment" } })
      .sort({ placedAt: -1 })
      .limit(MAX_ORDERS)
      .toArray();

    // Explicit field list rather than spreading the document: the panel's Order type uses
    // `id`, and the Razorpay identifiers stay server-side since nothing in the UI needs them.
    const list = docs.map((doc) => ({
      id: doc._id,
      customerId: doc.customerId,
      customerName: doc.customerName,
      email: doc.email,
      phone: doc.phone,
      placedAt: doc.placedAt,
      status: doc.status,
      payment: doc.payment,
      paid: doc.paid,
      advancePaid: doc.advancePaid,
      lines: doc.lines,
      subtotal: doc.subtotal,
      discount: doc.discount,
      shipping: doc.shipping,
      codFee: doc.codFee,
      total: doc.total,
      couponCode: doc.couponCode,
      address: doc.address,
      timeline: doc.timeline,
    }));
    return NextResponse.json({ orders: list }, { headers: { "x-request-id": requestId, "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not load orders." }, { status: 503, headers: { "x-request-id": requestId } });
  }
}
