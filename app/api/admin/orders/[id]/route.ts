import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/guard.server";
import type { OrderStatus } from "@/lib/admin/types";
import { getOrdersCollection } from "@/lib/db/models";
import { RATE_LIMITS } from "@/lib/security/config";
import { logSecurityEvent } from "@/lib/security/events";
import { clientIpFrom, consumeRateLimit } from "@/lib/security/rate-limit";
import { requestIdFrom } from "@/lib/security/request-id";

const ENDPOINT = "/api/admin/orders/[id]";

/** The fulfilment flow, in order — index decides which timeline steps are done. */
const ORDER_FLOW: OrderStatus[] = ["pending", "confirmed", "packed", "shipped", "delivered"];
const ALLOWED_STATUSES: OrderStatus[] = [...ORDER_FLOW, "cancelled", "returned"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = requestIdFrom(request);
  const ip = clientIpFrom(request);

  const { limit, windowMs } = RATE_LIMITS.adminData;
  const { ok: withinLimit } = consumeRateLimit(`admin-order-patch:${ip}`, limit, windowMs);
  if (!withinLimit) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429, headers: { "x-request-id": requestId } });
  }

  const admin = await requireAdmin();
  if (!admin) {
    logSecurityEvent({ type: "SUSPICIOUS_REQUEST", requestId, ip, endpoint: ENDPOINT, result: "blocked", risk: "high", meta: { reason: "no-admin-session" } });
    return NextResponse.json({ error: "Not authorized." }, { status: 401, headers: { "x-request-id": requestId } });
  }

  const { id } = await params;

  let body: { status?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400, headers: { "x-request-id": requestId } });
  }

  // Only the fulfilment status is writable here. Totals, lines, the customer and the
  // payment state are not — an admin API that accepted arbitrary fields would let a
  // compromised panel session rewrite order history.
  const status = body.status;
  if (typeof status !== "string" || !ALLOWED_STATUSES.includes(status as OrderStatus)) {
    return NextResponse.json({ error: "Unknown order status." }, { status: 400, headers: { "x-request-id": requestId } });
  }
  const nextStatus = status as OrderStatus;

  try {
    const orders = await getOrdersCollection();
    const existing = await orders.findOne({ _id: id, status: { $ne: "awaiting_payment" } });
    if (!existing) {
      return NextResponse.json({ error: "Order not found." }, { status: 404, headers: { "x-request-id": requestId } });
    }

    const now = new Date().toISOString();
    const reached =
      nextStatus === "cancelled" || nextStatus === "returned" ? 2 : ORDER_FLOW.indexOf(nextStatus) + 1;
    // Stamp the steps this update completes with the time it actually happened; steps
    // that were already done keep their own timestamp.
    const timeline = existing.timeline.map((step, index) => ({
      ...step,
      done: index < reached,
      at: index < reached && !step.done ? now : step.at,
    }));
    // A COD order is only fully paid once the courier has collected on delivery.
    const paid = existing.payment !== "cod" || nextStatus === "delivered";

    const update: Record<string, unknown> = { status: nextStatus, paid, timeline };
    // The return window runs from here, so record it the first time delivery is marked —
    // re-marking an already-delivered order must not silently extend the window.
    if (nextStatus === "delivered" && !existing.deliveredAt) update.deliveredAt = now;

    await orders.updateOne({ _id: id }, { $set: update });

    logSecurityEvent({
      type: "ADMIN_ACTION",
      requestId,
      ip,
      endpoint: ENDPOINT,
      result: "allowed",
      risk: "low",
      meta: { action: "order-status", order: id, status: nextStatus, admin: admin.email },
    });

    return NextResponse.json({ ok: true, status: nextStatus }, { headers: { "x-request-id": requestId } });
  } catch {
    return NextResponse.json({ error: "Could not update the order." }, { status: 503, headers: { "x-request-id": requestId } });
  }
}
