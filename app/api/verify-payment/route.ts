import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

import type { OrderDoc } from "@/lib/db/models";
import { finalizePrepaidOrder } from "@/lib/orders/finalize";
import { RATE_LIMITS } from "@/lib/security/config";
import { logSecurityEvent } from "@/lib/security/events";
import { clientIpFrom, consumeRateLimit } from "@/lib/security/rate-limit";
import { requestIdFrom } from "@/lib/security/request-id";

const ENDPOINT = "/api/verify-payment";

/** Shared so a first verification and a replayed one answer identically. */
function successBody(order: OrderDoc, orderId: string, paymentId: string) {
  return {
    success: true,
    orderId,
    paymentId,
    reference: order._id,
    order: {
      reference: order._id,
      total: order.total,
      advancePaid: order.advancePaid ?? null,
      items: order.lines.reduce((sum, line) => sum + line.quantity, 0),
      payment: order.payment,
    },
  };
}

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  const ip = clientIpFrom(request);

  const { limit, windowMs } = RATE_LIMITS.verifyPayment;
  const { ok: withinLimit, retryAfterMs } = consumeRateLimit(`verify-payment:${ip}`, limit, windowMs);
  if (!withinLimit) {
    logSecurityEvent({ type: "RATE_LIMIT_TRIGGERED", requestId, ip, endpoint: ENDPOINT, result: "blocked", risk: "medium" });
    return NextResponse.json(
      { error: "Too many attempts. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)), "x-request-id": requestId } },
    );
  }

  let body: { razorpay_order_id?: unknown; razorpay_payment_id?: unknown; razorpay_signature?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400, headers: { "x-request-id": requestId } });
  }

  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = body;
  if (typeof orderId !== "string" || typeof paymentId !== "string" || typeof signature !== "string" || !orderId || !paymentId || !signature) {
    return NextResponse.json({ error: "Missing payment fields." }, { status: 400, headers: { "x-request-id": requestId } });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return NextResponse.json({ error: "Razorpay is not configured." }, { status: 500, headers: { "x-request-id": requestId } });
  }

  const expected = createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  const signatureBuf = Buffer.from(signature, "hex");
  const verified = expectedBuf.length === signatureBuf.length && timingSafeEqual(expectedBuf, signatureBuf);

  if (!verified) {
    logSecurityEvent({ type: "PAYMENT_VERIFICATION_FAILED", requestId, ip, endpoint: ENDPOINT, result: "blocked", risk: "high", meta: { orderId } });
    return NextResponse.json({ success: false, error: "Signature mismatch." }, { status: 400, headers: { "x-request-id": requestId } });
  }

  // Signature alone isn't enough: it only proves Razorpay signed *this* order+payment
  // pair, not that this server created the order or that we haven't already acted on
  // it. finalizePrepaidOrder settles both, in the database — see lib/orders/finalize.ts.
  // Razorpay's webhook runs the same function, so whichever arrives first wins and the
  // other is recognised as a duplicate rather than treated as an error.
  try {
    const result = await finalizePrepaidOrder(orderId, paymentId, requestId);

    if (result.outcome === "unknown") {
      logSecurityEvent({ type: "PAYMENT_VERIFICATION_FAILED", requestId, ip, endpoint: ENDPOINT, result: "error", risk: "high", meta: { orderId, reason: "unknown-order" } });
      return NextResponse.json(
        { success: false, error: "We couldn't find that order. Please contact support." },
        { status: 409, headers: { "x-request-id": requestId } },
      );
    }

    if (result.outcome === "replayed") {
      // A *different* payment against an order that is already closed.
      logSecurityEvent({ type: "PAYMENT_REPLAY_REJECTED", requestId, ip, endpoint: ENDPOINT, result: "blocked", risk: "high", meta: { orderId, reason: "already-verified" } });
      return NextResponse.json(
        { success: false, error: "This payment has already been processed." },
        { status: 409, headers: { "x-request-id": requestId } },
      );
    }

    // "finalized" or "already-final" — the customer paid and the order exists either
    // way, so both answer identically and send them to the success page.
    logSecurityEvent({
      type: "PAYMENT_VERIFIED",
      requestId,
      ip,
      endpoint: ENDPOINT,
      result: "allowed",
      risk: "low",
      meta: { orderId, reference: result.order._id, duplicate: result.outcome === "already-final" },
    });
    return NextResponse.json(successBody(result.order, orderId, paymentId), { headers: { "x-request-id": requestId } });
  } catch {
    // The money moved but we couldn't record it — never report success for that.
    logSecurityEvent({ type: "PAYMENT_VERIFICATION_FAILED", requestId, ip, endpoint: ENDPOINT, result: "error", risk: "high", meta: { orderId, reason: "db-write-failed" } });
    return NextResponse.json(
      { success: false, error: "Your payment went through but we couldn't save the order. Please contact support with your payment ID." },
      { status: 503, headers: { "x-request-id": requestId } },
    );
  }
}
