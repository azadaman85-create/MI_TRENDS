import { NextResponse } from "next/server";

import { priceOrder } from "@/lib/pricing";
import { razorpayClient } from "@/lib/razorpay";
import { RATE_LIMITS } from "@/lib/security/config";
import { logSecurityEvent } from "@/lib/security/events";
import { recordOrder } from "@/lib/security/order-ledger";
import { clientIpFrom, consumeRateLimit } from "@/lib/security/rate-limit";
import { requestIdFrom } from "@/lib/security/request-id";

const MIN_AMOUNT_PAISE = 100;
const ENDPOINT = "/api/create-order";

export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  const ip = clientIpFrom(request);

  const { limit, windowMs } = RATE_LIMITS.createOrder;
  const { ok: withinLimit, retryAfterMs } = consumeRateLimit(`create-order:${ip}`, limit, windowMs);
  if (!withinLimit) {
    logSecurityEvent({ type: "RATE_LIMIT_TRIGGERED", requestId, ip, endpoint: ENDPOINT, result: "blocked", risk: "medium" });
    return NextResponse.json(
      { error: "Too many order attempts. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)), "x-request-id": requestId } },
    );
  }

  let body: {
    lines?: unknown;
    couponCode?: unknown;
    shipping?: unknown;
    codFee?: unknown;
    paymentMode?: unknown;
    advancePercent?: unknown;
    receipt?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400, headers: { "x-request-id": requestId } });
  }

  // The amount charged is always recomputed here from the catalogue + coupon rules —
  // never trusted from the client — so intercepting this request and lowering the
  // price no longer works. See lib/pricing.ts for the documented exception (shipping,
  // COD fee and the COD advance share, which this app has no server-side home for yet).
  const priced = priceOrder({
    lines: body.lines,
    couponCode: body.couponCode,
    shipping: body.shipping,
    codFee: body.codFee,
    paymentMode: body.paymentMode,
    advancePercent: body.advancePercent,
  });

  if (!priced.ok) {
    logSecurityEvent({ type: "ORDER_PRICE_REJECTED", requestId, ip, endpoint: ENDPOINT, result: "blocked", risk: "medium", meta: { reason: priced.error } });
    return NextResponse.json({ error: priced.error }, { status: 400, headers: { "x-request-id": requestId } });
  }

  const amountPaise = Math.round(priced.dueNow * 100);
  const receipt = typeof body.receipt === "string" && body.receipt ? body.receipt : `receipt_${Date.now()}`;

  if (!Number.isFinite(amountPaise) || amountPaise < MIN_AMOUNT_PAISE) {
    return NextResponse.json({ error: `Amount must be at least ${MIN_AMOUNT_PAISE} paise.` }, { status: 400, headers: { "x-request-id": requestId } });
  }

  try {
    const razorpay = razorpayClient();
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt,
    });
    recordOrder(order.id, amountPaise);
    return NextResponse.json(
      {
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        breakdown: { subtotal: priced.subtotal, discount: priced.discount, shipping: priced.shipping, codFee: priced.codFee, total: priced.total },
      },
      { headers: { "x-request-id": requestId } },
    );
  } catch (error) {
    const statusCode = (error as { statusCode?: number })?.statusCode;
    logSecurityEvent({ type: "SUSPICIOUS_REQUEST", requestId, ip, endpoint: ENDPOINT, result: "error", risk: "low", meta: { statusCode: statusCode ?? 0 } });
    if (statusCode === 401) {
      return NextResponse.json({ error: "Razorpay authentication failed." }, { status: 401, headers: { "x-request-id": requestId } });
    }
    return NextResponse.json({ error: "Could not create the Razorpay order." }, { status: 500, headers: { "x-request-id": requestId } });
  }
}
