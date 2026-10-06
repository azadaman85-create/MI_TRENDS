import { NextResponse } from "next/server";

import { currentCustomerId } from "@/lib/customer/session.server";
import { getOrdersCollection } from "@/lib/db/models";
import { returnEligibility } from "@/lib/returns";
import { RATE_LIMITS } from "@/lib/security/config";
import { logSecurityEvent } from "@/lib/security/events";
import { clientIpFrom, consumeRateLimit } from "@/lib/security/rate-limit";
import { requestIdFrom } from "@/lib/security/request-id";

const ENDPOINT = "/api/orders/mine";

/**
 * The signed-in customer's own orders.
 *
 * Scoped by the session's customer id and nothing else — there is no id parameter to
 * tamper with. Orders still awaiting payment are left out: an abandoned checkout is not
 * an order, and showing one would only confuse.
 *
 * Each order carries its return eligibility, computed server-side, so the page never has
 * to work out the window itself and can't disagree with what the API will accept.
 */
export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  const ip = clientIpFrom(request);

  const { limit, windowMs } = RATE_LIMITS.orderTracking;
  const { ok: withinLimit, retryAfterMs } = consumeRateLimit(`mine:${ip}`, limit, windowMs);
  if (!withinLimit) {
    logSecurityEvent({ type: "RATE_LIMIT_TRIGGERED", requestId, ip, endpoint: ENDPOINT, result: "blocked", risk: "medium" });
    return NextResponse.json(
      { error: "Too many requests. Try again in a minute." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)), "x-request-id": requestId } },
    );
  }

  const customerId = await currentCustomerId();
  if (!customerId) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401, headers: { "x-request-id": requestId } });
  }

  try {
    const orders = await getOrdersCollection();
    const docs = await orders
      .find({ customerId, status: { $ne: "awaiting_payment" } })
      .sort({ placedAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json(
      {
        orders: docs.map((order) => ({
          reference: order._id,
          placedAt: order.placedAt,
          deliveredAt: order.deliveredAt ?? null,
          status: order.status,
          payment: order.payment,
          paid: order.paid,
          total: order.total,
          lines: order.lines.map((line) => ({
            name: line.name,
            sku: line.sku,
            size: line.size,
            color: line.color,
            quantity: line.quantity,
            price: line.price,
            imageUrl: line.imageUrl ?? null,
          })),
          returnRequest: order.returnRequest
            ? { status: order.returnRequest.status, requestedAt: order.returnRequest.requestedAt, reason: order.returnRequest.reason }
            : null,
          returns: returnEligibility(order),
        })),
      },
      { headers: { "x-request-id": requestId } },
    );
  } catch {
    return NextResponse.json(
      { error: "Could not load your orders. Please try again." },
      { status: 503, headers: { "x-request-id": requestId } },
    );
  }
}
