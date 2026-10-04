import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

import { getOrdersCollection } from "@/lib/db/models";
import type { OrderStatus } from "@/lib/admin/types";
import { RATE_LIMITS } from "@/lib/security/config";
import { logSecurityEvent } from "@/lib/security/events";
import { checkAndConsume } from "@/lib/security/order-ledger";
import { clientIpFrom, consumeRateLimit } from "@/lib/security/rate-limit";
import { requestIdFrom } from "@/lib/security/request-id";

const ENDPOINT = "/api/verify-payment";

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
  // pair, not that we haven't already acted on it. Cross-check against the order this
  // server actually created, and refuse a second "success" for the same payment —
  // otherwise a replayed callback could double-fulfil (or legitimise an order ID this
  // server never created at all).
  const ledgerCheck = checkAndConsume(orderId, paymentId);
  if (!ledgerCheck.ok) {
    logSecurityEvent({
      type: "PAYMENT_REPLAY_REJECTED",
      requestId,
      ip,
      endpoint: ENDPOINT,
      result: "blocked",
      risk: "high",
      meta: { orderId, reason: ledgerCheck.reason },
    });
    return NextResponse.json({ success: false, error: "This payment has already been processed." }, { status: 409, headers: { "x-request-id": requestId } });
  }

  // Payment is real and not a replay — promote the pending order to a live one. This is
  // the only place an order becomes visible to the admin panel, so an order in the panel
  // always corresponds to a payment this server verified itself.
  try {
    const orders = await getOrdersCollection();
    const finalizedAt = new Date().toISOString();
    const result = await orders.findOneAndUpdate(
      { razorpayOrderId: orderId, status: "awaiting_payment" },
      {
        $set: {
          status: "pending" as OrderStatus,
          // A COD order is only part-paid now; the courier collects the balance.
          paid: true,
          razorpayPaymentId: paymentId,
          "timeline.1.done": true,
          "timeline.1.at": finalizedAt,
        },
      },
      { returnDocument: "after" },
    );

    if (!result) {
      // Signature and ledger both passed but there's no pending order to promote —
      // nothing was double-charged, but this shouldn't happen, so it's worth a look.
      logSecurityEvent({ type: "PAYMENT_VERIFICATION_FAILED", requestId, ip, endpoint: ENDPOINT, result: "error", risk: "high", meta: { orderId, reason: "no-pending-order" } });
      return NextResponse.json(
        { success: false, error: "We couldn't find that order. Please contact support." },
        { status: 409, headers: { "x-request-id": requestId } },
      );
    }

    logSecurityEvent({ type: "PAYMENT_VERIFIED", requestId, ip, endpoint: ENDPOINT, result: "allowed", risk: "low", meta: { orderId, reference: result._id } });
    return NextResponse.json(
      {
        success: true,
        orderId,
        paymentId,
        reference: result._id,
        order: {
          reference: result._id,
          total: result.total,
          advancePaid: result.advancePaid ?? null,
          items: result.lines.reduce((sum, line) => sum + line.quantity, 0),
          payment: result.payment,
        },
      },
      { headers: { "x-request-id": requestId } },
    );
  } catch {
    // The money moved but we couldn't record it — never report success for that.
    logSecurityEvent({ type: "PAYMENT_VERIFICATION_FAILED", requestId, ip, endpoint: ENDPOINT, result: "error", risk: "high", meta: { orderId, reason: "db-write-failed" } });
    return NextResponse.json(
      { success: false, error: "Your payment went through but we couldn't save the order. Please contact support with your payment ID." },
      { status: 503, headers: { "x-request-id": requestId } },
    );
  }
}
