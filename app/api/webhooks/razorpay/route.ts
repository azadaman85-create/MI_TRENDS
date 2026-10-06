import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

import { finalizePrepaidOrder } from "@/lib/orders/finalize";
import { logSecurityEvent } from "@/lib/security/events";
import { clientIpFrom } from "@/lib/security/rate-limit";
import { requestIdFrom } from "@/lib/security/request-id";

/**
 * Razorpay webhook.
 *
 * The browser callback into /api/verify-payment is not a reliable way to learn that
 * money moved: the customer can close the tab, lose signal or background the app in
 * the second between paying and the redirect. Without this route that order stays
 * "awaiting_payment" forever — charged, but invisible to the admin panel.
 *
 * Razorpay signs the webhook with a secret you choose in the dashboard, which is a
 * *different* secret from the API key secret. Set it as RAZORPAY_WEBHOOK_SECRET.
 *
 * Deliberately not rate-limited by IP: the caller is Razorpay, and throttling them
 * would drop exactly the notifications this route exists to catch. The signature is
 * the access control.
 */

const ENDPOINT = "/api/webhooks/razorpay";

/** Razorpay retries on any non-2xx, which is what we want for a transient failure. */
const RETRY = { status: 500 };

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  const ip = clientIpFrom(request);

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    logSecurityEvent({ type: "PAYMENT_VERIFICATION_FAILED", requestId, ip, endpoint: ENDPOINT, result: "error", risk: "high", meta: { reason: "webhook-secret-missing" } });
    return NextResponse.json({ error: "Webhook is not configured." }, { ...RETRY, headers: { "x-request-id": requestId } });
  }

  // The signature covers the exact bytes Razorpay sent, so this has to read the raw
  // body — re-serialising parsed JSON would not reproduce it.
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  const signatureBuf = Buffer.from(signature, "hex");
  const verified = expectedBuf.length === signatureBuf.length && timingSafeEqual(expectedBuf, signatureBuf);

  if (!verified) {
    logSecurityEvent({ type: "PAYMENT_VERIFICATION_FAILED", requestId, ip, endpoint: ENDPOINT, result: "blocked", risk: "high", meta: { reason: "webhook-signature-mismatch" } });
    // 401, not 500 — a forged call should not be retried.
    return NextResponse.json({ error: "Invalid signature." }, { status: 401, headers: { "x-request-id": requestId } });
  }

  let event: {
    event?: string;
    payload?: { payment?: { entity?: { id?: string; order_id?: string } } };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400, headers: { "x-request-id": requestId } });
  }

  // Only captured payments create orders. Other events (failures, refunds, settlements)
  // are acknowledged so Razorpay stops retrying, but change nothing here.
  if (event.event !== "payment.captured") {
    return NextResponse.json({ received: true, ignored: event.event ?? null }, { headers: { "x-request-id": requestId } });
  }

  const payment = event.payload?.payment?.entity;
  const orderId = payment?.order_id;
  const paymentId = payment?.id;
  if (!orderId || !paymentId) {
    return NextResponse.json({ error: "Missing payment fields." }, { status: 400, headers: { "x-request-id": requestId } });
  }

  try {
    const result = await finalizePrepaidOrder(orderId, paymentId, requestId);

    if (result.outcome === "unknown") {
      // A captured payment for an order this server has no record of. Worth looking at,
      // but retrying won't conjure the order, so acknowledge it.
      logSecurityEvent({ type: "PAYMENT_VERIFICATION_FAILED", requestId, ip, endpoint: ENDPOINT, result: "error", risk: "high", meta: { orderId, reason: "unknown-order" } });
      return NextResponse.json({ received: true, finalized: false }, { headers: { "x-request-id": requestId } });
    }

    if (result.outcome === "finalized") {
      // The browser never made it back — this webhook is the only reason the order exists.
      logSecurityEvent({ type: "PAYMENT_VERIFIED", requestId, ip, endpoint: ENDPOINT, result: "allowed", risk: "low", meta: { orderId, reference: result.order._id, via: "webhook" } });
    }

    return NextResponse.json({ received: true, finalized: result.outcome === "finalized" }, { headers: { "x-request-id": requestId } });
  } catch {
    // Let Razorpay retry rather than losing a paid order.
    logSecurityEvent({ type: "PAYMENT_VERIFICATION_FAILED", requestId, ip, endpoint: ENDPOINT, result: "error", risk: "high", meta: { orderId, reason: "db-write-failed" } });
    return NextResponse.json({ error: "Could not record the order." }, { ...RETRY, headers: { "x-request-id": requestId } });
  }
}
