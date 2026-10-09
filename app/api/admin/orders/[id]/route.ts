import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/guard.server";
import type { OrderStatus } from "@/lib/admin/types";
import { getOrdersCollection } from "@/lib/db/models";
import { giveBackStock } from "@/lib/inventory.server";
import { RETURN_STATUSES, type ReturnStatus } from "@/lib/returns";
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

  let body: { status?: unknown; returnStatus?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400, headers: { "x-request-id": requestId } });
  }

  // Moving a return along is a separate call from moving the order along: the two have
  // different lifecycles, and a delivered order keeps its delivered status while its
  // return is being worked.
  if (body.returnStatus !== undefined) {
    return patchReturnStatus({ id, returnStatus: body.returnStatus, requestId, ip, adminEmail: admin.email });
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

    // Cancelling puts the units back, but only on the transition into cancelled —
    // re-saving an already-cancelled order must not restock it a second time.
    if (nextStatus === "cancelled" && existing.status !== "cancelled") {
      await giveBackStock(existing.lines);
    }

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

/**
 * Moves a return through its stages.
 *
 * Kept apart from the fulfilment status because the two are independent: an order stays
 * "delivered" while its return is requested, approved and finally refunded. Marking a
 * return completed also sets the order's own status to "returned", which is the point at
 * which the item is genuinely back and the money has gone out.
 */
async function patchReturnStatus({
  id,
  returnStatus,
  requestId,
  ip,
  adminEmail,
}: {
  id: string;
  returnStatus: unknown;
  requestId: string;
  ip: string;
  adminEmail: string;
}) {
  if (typeof returnStatus !== "string" || !RETURN_STATUSES.includes(returnStatus as ReturnStatus)) {
    return NextResponse.json({ error: "Unknown return status." }, { status: 400, headers: { "x-request-id": requestId } });
  }
  const next = returnStatus as ReturnStatus;

  try {
    const orders = await getOrdersCollection();
    // Conditional on a return actually existing — an admin can't invent one.
    const existing = await orders.findOne({ _id: id, returnRequest: { $exists: true } });
    if (!existing?.returnRequest) {
      return NextResponse.json({ error: "No return request on this order." }, { status: 404, headers: { "x-request-id": requestId } });
    }

    const update: Record<string, unknown> = { "returnRequest.status": next };
    // A completed return is the only stage that changes the order itself: the goods are
    // back and the refund has gone out, so it is no longer simply "delivered".
    if (next === "completed") update.status = "returned" as OrderStatus;

    await orders.updateOne({ _id: id }, { $set: update });

    // Returned goods go back on the shelf — only the lines actually sent back, and only
    // on the transition, so marking it completed twice doesn't restock twice.
    if (next === "completed" && existing.returnRequest.status !== "completed") {
      const returned = existing.returnRequest.items
        .map((item) => {
          const line = existing.lines[item.lineIndex];
          return line ? { productId: line.productId, size: line.size, quantity: item.quantity, name: line.name } : null;
        })
        .filter((line): line is NonNullable<typeof line> => line !== null);
      await giveBackStock(returned);
    }

    logSecurityEvent({
      type: "ADMIN_ACTION",
      requestId,
      ip,
      endpoint: ENDPOINT,
      result: "allowed",
      risk: "low",
      meta: { action: "return-status", order: id, returnStatus: next, admin: adminEmail },
    });

    return NextResponse.json({ ok: true, returnStatus: next }, { headers: { "x-request-id": requestId } });
  } catch {
    return NextResponse.json({ error: "Could not update the return." }, { status: 503, headers: { "x-request-id": requestId } });
  }
}
