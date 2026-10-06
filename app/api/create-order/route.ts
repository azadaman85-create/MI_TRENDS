import { NextResponse } from "next/server";

import { currentCustomerId } from "@/lib/customer/session.server";
import { validateOrderContact } from "@/lib/customer/validation";
import { getOrdersCollection, type OrderDoc } from "@/lib/db/models";
import { priceOrder } from "@/lib/pricing";
import { razorpayClient } from "@/lib/razorpay";
import { RATE_LIMITS } from "@/lib/security/config";
import { logSecurityEvent } from "@/lib/security/events";
import { clientIpFrom, consumeRateLimit } from "@/lib/security/rate-limit";
import { requestIdFrom } from "@/lib/security/request-id";

const MIN_AMOUNT_PAISE = 100;
const ENDPOINT = "/api/create-order";

const TIMELINE_STEPS = ["Order placed", "Payment confirmed", "Packed", "Shipped", "Delivered"];

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

  // Who the order belongs to comes from the session cookie, never from the request body —
  // the browser can't claim to be another customer.
  const customerId = await currentCustomerId();
  if (!customerId) {
    return NextResponse.json({ error: "Please sign in before checking out." }, { status: 401, headers: { "x-request-id": requestId } });
  }

  let body: {
    lines?: unknown;
    couponCode?: unknown;
    shipping?: unknown;
    codFee?: unknown;
    paymentMode?: unknown;
    contact?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400, headers: { "x-request-id": requestId } });
  }

  // COD never touches the payment gateway — it has its own route, which creates the
  // order unpaid in one step. Accepting it here would charge the shopper up front.
  if (body.paymentMode === "cod") {
    return NextResponse.json(
      { error: "Cash on delivery orders are placed without an online payment." },
      { status: 400, headers: { "x-request-id": requestId } },
    );
  }

  const contact = validateOrderContact(body.contact);
  if (!contact.ok) {
    return NextResponse.json({ error: contact.error }, { status: 400, headers: { "x-request-id": requestId } });
  }

  // The amount charged is always recomputed here from the catalogue + coupon rules —
  // never trusted from the client. See lib/pricing.ts for the documented exception
  // (shipping and the COD fee, which have no server-side home yet).
  const priced = priceOrder({
    lines: body.lines,
    couponCode: body.couponCode,
    shipping: body.shipping,
    codFee: body.codFee,
    paymentMode: body.paymentMode,
  });

  if (!priced.ok) {
    logSecurityEvent({ type: "ORDER_PRICE_REJECTED", requestId, ip, endpoint: ENDPOINT, result: "blocked", risk: "medium", meta: { reason: priced.error } });
    return NextResponse.json({ error: priced.error }, { status: 400, headers: { "x-request-id": requestId } });
  }

  const amountPaise = Math.round(priced.dueNow * 100);
  if (!Number.isFinite(amountPaise) || amountPaise < MIN_AMOUNT_PAISE) {
    return NextResponse.json({ error: `Amount must be at least ${MIN_AMOUNT_PAISE} paise.` }, { status: 400, headers: { "x-request-id": requestId } });
  }

  const paymentMode: OrderDoc["payment"] = body.paymentMode === "card" ? "card" : body.paymentMode === "netbanking" ? "netbanking" : "upi";
  const placedAt = new Date().toISOString();
  const orderId = `MIT${Date.now().toString().slice(-8)}`;

  try {
    const razorpay = razorpayClient();
    const order = await razorpay.orders.create({ amount: amountPaise, currency: "INR", receipt: orderId });

    // Written as "awaiting_payment": it exists so the finalized order can be built from
    // server-held data once the payment verifies, but it is deliberately excluded from
    // the admin order list until then (an abandoned checkout is not an order).
    const doc: OrderDoc = {
      _id: orderId,
      customerId,
      customerName: contact.value.name,
      email: contact.value.email,
      phone: `+91 ${contact.value.phone}`,
      placedAt,
      status: "awaiting_payment",
      payment: paymentMode,
      paid: false,
      lines: priced.lines,
      subtotal: priced.subtotal,
      discount: priced.discount,
      shipping: priced.shipping,
      codFee: priced.codFee,
      total: priced.total,
      couponCode: typeof body.couponCode === "string" && body.couponCode ? body.couponCode.toUpperCase() : null,
      address: contact.value.address,
      timeline: TIMELINE_STEPS.map((label, index) => ({ label, at: placedAt, done: index === 0 })),
      razorpayOrderId: order.id,
    };

    const orders = await getOrdersCollection();
    await orders.insertOne(doc);

    return NextResponse.json(
      {
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        reference: orderId,
        placedAt,
        breakdown: {
          subtotal: priced.subtotal,
          discount: priced.discount,
          shipping: priced.shipping,
          codFee: priced.codFee,
          total: priced.total,
          dueNow: priced.dueNow,
        },
      },
      { headers: { "x-request-id": requestId } },
    );
  } catch (error) {
    const statusCode = (error as { statusCode?: number })?.statusCode;
    // The reason goes to the server log only — the customer gets the generic message
    // below. Without this, a misconfiguration (missing or wrong Razorpay keys) is
    // indistinguishable in production from Razorpay simply being down.
    logSecurityEvent({
      type: "SUSPICIOUS_REQUEST",
      requestId,
      ip,
      endpoint: ENDPOINT,
      result: "error",
      risk: "low",
      meta: { statusCode: statusCode ?? 0, reason: error instanceof Error ? error.message : "unknown" },
    });
    if (statusCode === 401) {
      return NextResponse.json({ error: "Razorpay authentication failed." }, { status: 401, headers: { "x-request-id": requestId } });
    }
    return NextResponse.json({ error: "Could not start the payment. Please try again." }, { status: 500, headers: { "x-request-id": requestId } });
  }
}
