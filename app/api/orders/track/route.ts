import { NextResponse } from "next/server";

import { currentCustomerId } from "@/lib/customer/session.server";
import { getOrdersCollection } from "@/lib/db/models";
import { RATE_LIMITS } from "@/lib/security/config";
import { describeError, logSecurityEvent } from "@/lib/security/events";
import { clientIpFrom, consumeRateLimit } from "@/lib/security/rate-limit";
import { requestIdFrom } from "@/lib/security/request-id";

const ENDPOINT = "/api/orders/track";

/**
 * Order tracking for shoppers.
 *
 * Order references are `MIT` + a timestamp slice, which is guessable — so an ID alone is
 * not proof of ownership. An order carries a name, phone and full delivery address, and
 * handing that to anyone who guesses a nearby number would be a real privacy leak.
 *
 * So a caller must either be signed in as the customer who placed it, or supply the
 * email the order was placed with. A wrong email and a non-existent order return the
 * exact same response, so this can't be used to discover which IDs exist.
 */
export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  const ip = clientIpFrom(request);

  const { limit, windowMs } = RATE_LIMITS.orderTracking;
  const { ok: withinLimit, retryAfterMs } = consumeRateLimit(`track:${ip}`, limit, windowMs);
  if (!withinLimit) {
    logSecurityEvent({ type: "RATE_LIMIT_TRIGGERED", requestId, ip, endpoint: ENDPOINT, result: "blocked", risk: "medium" });
    return NextResponse.json(
      { error: "Too many lookups. Try again in a minute." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)), "x-request-id": requestId } },
    );
  }

  const url = new URL(request.url);
  const reference = (url.searchParams.get("orderId") ?? "").trim().toUpperCase();
  const email = (url.searchParams.get("email") ?? "").trim().toLowerCase();

  if (!reference) {
    return NextResponse.json({ error: "Enter the order ID from your confirmation email." }, { status: 400, headers: { "x-request-id": requestId } });
  }

  // One message for "no such order" and "not yours" alike — see the doc comment above.
  const notFound = NextResponse.json(
    { error: "We couldn't find that order. Check the order ID and the email you ordered with." },
    { status: 404, headers: { "x-request-id": requestId } },
  );

  try {
    const orders = await getOrdersCollection();
    const order = await orders.findOne({ _id: reference, status: { $ne: "awaiting_payment" } });
    if (!order) return notFound;

    const signedInCustomerId = await currentCustomerId();
    const ownsIt = signedInCustomerId !== null && signedInCustomerId === order.customerId;
    const emailMatches = email.length > 0 && email === order.email.toLowerCase();

    if (!ownsIt && !emailMatches) {
      logSecurityEvent({
        type: "SUSPICIOUS_REQUEST",
        requestId,
        ip,
        endpoint: ENDPOINT,
        result: "blocked",
        risk: "medium",
        meta: { reason: "ownership-check-failed", order: reference },
      });
      return notFound;
    }

    const eta = new Date(order.placedAt);
    eta.setDate(eta.getDate() + 5);

    // Deliberately narrow: enough for the shopper to recognise their order and see where
    // it is, without echoing back the full address or any payment identifiers.
    return NextResponse.json(
      {
        order: {
          reference: order._id,
          placedAt: order.placedAt,
          status: order.status,
          payment: order.payment,
          paid: order.paid,
          total: order.total,
          dueOnDelivery: order.payment === "cod" && !order.paid ? order.total : 0,
          estimatedDelivery: eta.toISOString(),
          timeline: order.timeline,
          items: order.lines.map((line) => ({
            name: line.name,
            size: line.size,
            color: line.color,
            quantity: line.quantity,
            imageUrl: line.imageUrl ?? null,
          })),
          deliveringTo: `${order.address.city}, ${order.address.state}`,
        },
      },
      { headers: { "x-request-id": requestId, "Cache-Control": "no-store" } },
    );
  } catch (error) {
    logSecurityEvent({
      type: "SUSPICIOUS_REQUEST",
      requestId,
      ip,
      endpoint: ENDPOINT,
      result: "error",
      risk: "low",
      meta: { cause: describeError(error) },
    });
    return NextResponse.json(
      { error: "We couldn't look that up right now. Please try again." },
      { status: 503, headers: { "x-request-id": requestId } },
    );
  }
}
