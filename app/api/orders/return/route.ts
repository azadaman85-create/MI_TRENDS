import { NextResponse } from "next/server";

import { currentCustomerId } from "@/lib/customer/session.server";
import { getOrdersCollection, type ReturnRequest } from "@/lib/db/models";
import { RETURN_BLOCK_COPY, RETURN_REASONS, returnEligibility } from "@/lib/returns";
import { RATE_LIMITS } from "@/lib/security/config";
import { logSecurityEvent } from "@/lib/security/events";
import { clientIpFrom, consumeRateLimit } from "@/lib/security/rate-limit";
import { requestIdFrom } from "@/lib/security/request-id";

const ENDPOINT = "/api/orders/return";
const MAX_NOTE = 500;

/**
 * Raises a return request against one of the caller's own orders.
 *
 * The page hides the button once the window has closed, but that is presentation. The
 * window, the ownership and the line items are all re-checked here, because the browser
 * is free to send whatever it likes.
 *
 * The write is conditional on `returnRequest` still being absent, so two taps on a slow
 * connection raise one request rather than two.
 */
export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  const ip = clientIpFrom(request);

  const { limit, windowMs } = RATE_LIMITS.createOrder;
  const { ok: withinLimit, retryAfterMs } = consumeRateLimit(`return:${ip}`, limit, windowMs);
  if (!withinLimit) {
    logSecurityEvent({ type: "RATE_LIMIT_TRIGGERED", requestId, ip, endpoint: ENDPOINT, result: "blocked", risk: "medium" });
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)), "x-request-id": requestId } },
    );
  }

  const customerId = await currentCustomerId();
  if (!customerId) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401, headers: { "x-request-id": requestId } });
  }

  let body: { reference?: unknown; reason?: unknown; note?: unknown; items?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400, headers: { "x-request-id": requestId } });
  }

  const reference = typeof body.reference === "string" ? body.reference.trim().toUpperCase() : "";
  const reason = typeof body.reason === "string" ? body.reason : "";
  const note = typeof body.note === "string" ? body.note.trim().slice(0, MAX_NOTE) : "";

  if (!reference) {
    return NextResponse.json({ error: "Which order are you returning?" }, { status: 400, headers: { "x-request-id": requestId } });
  }
  if (!RETURN_REASONS.includes(reason as (typeof RETURN_REASONS)[number])) {
    return NextResponse.json({ error: "Choose a reason for the return." }, { status: 400, headers: { "x-request-id": requestId } });
  }
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "Choose at least one item to return." }, { status: 400, headers: { "x-request-id": requestId } });
  }

  try {
    const orders = await getOrdersCollection();
    // Scoped to this customer, so another shopper's reference simply doesn't exist here.
    const order = await orders.findOne({ _id: reference, customerId });
    if (!order) {
      return NextResponse.json({ error: "We couldn't find that order." }, { status: 404, headers: { "x-request-id": requestId } });
    }

    const eligibility = returnEligibility(order);
    if (!eligibility.eligible) {
      return NextResponse.json(
        { error: RETURN_BLOCK_COPY[eligibility.reason] },
        { status: 409, headers: { "x-request-id": requestId } },
      );
    }

    // Every selected line must exist on this order, and you can't send back more than
    // was delivered.
    const items: ReturnRequest["items"] = [];
    for (const raw of body.items) {
      if (typeof raw !== "object" || raw === null) {
        return NextResponse.json({ error: "Invalid item selection." }, { status: 400, headers: { "x-request-id": requestId } });
      }
      const { lineIndex, quantity } = raw as { lineIndex?: unknown; quantity?: unknown };
      const index = Number(lineIndex);
      const qty = Number(quantity);
      const line = order.lines[index];
      if (!Number.isInteger(index) || !line) {
        return NextResponse.json({ error: "That item isn't on this order." }, { status: 400, headers: { "x-request-id": requestId } });
      }
      if (!Number.isInteger(qty) || qty < 1 || qty > line.quantity) {
        return NextResponse.json(
          { error: `You can return at most ${line.quantity} of ${line.name}.` },
          { status: 400, headers: { "x-request-id": requestId } },
        );
      }
      if (items.some((i) => i.lineIndex === index)) {
        return NextResponse.json({ error: "That item is listed twice." }, { status: 400, headers: { "x-request-id": requestId } });
      }
      items.push({ lineIndex: index, quantity: qty });
    }

    const returnRequest: ReturnRequest = {
      requestedAt: new Date().toISOString(),
      reason,
      ...(note ? { note } : {}),
      items,
      status: "requested",
    };

    // Conditional on the field still being unset — the first request wins, a duplicate
    // submit matches nothing and is reported as already requested.
    const result = await orders.updateOne(
      { _id: reference, customerId, returnRequest: { $exists: false } },
      { $set: { returnRequest } },
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: RETURN_BLOCK_COPY["already-requested"] },
        { status: 409, headers: { "x-request-id": requestId } },
      );
    }

    return NextResponse.json(
      { ok: true, reference, returnRequest: { status: returnRequest.status, requestedAt: returnRequest.requestedAt } },
      { headers: { "x-request-id": requestId } },
    );
  } catch {
    return NextResponse.json(
      { error: "Could not raise the return. Please try again." },
      { status: 503, headers: { "x-request-id": requestId } },
    );
  }
}
