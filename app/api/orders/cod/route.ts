import { NextResponse } from "next/server";

import { currentCustomerId } from "@/lib/customer/session.server";
import { validateOrderContact } from "@/lib/customer/validation";
import { getOrdersCollection, type OrderDoc } from "@/lib/db/models";
import { sendOrderConfirmation } from "@/lib/email/mailer";
import { priceOrder } from "@/lib/pricing";
import { RATE_LIMITS } from "@/lib/security/config";
import { describeError, logSecurityEvent } from "@/lib/security/events";
import { clientIpFrom, consumeRateLimit } from "@/lib/security/rate-limit";
import { requestIdFrom } from "@/lib/security/request-id";

const ENDPOINT = "/api/orders/cod";
const TIMELINE_STEPS = ["Order placed", "Payment confirmed", "Packed", "Shipped", "Delivered"];

/**
 * Places a cash-on-delivery order.
 *
 * COD takes nothing up front, so there's no Razorpay order, no payment to verify and
 * no gateway redirect — the order is created live and unpaid in one step. The money is
 * collected by the courier, and the order only becomes `paid` when an admin moves it to
 * "delivered" (see app/api/admin/orders/[id]).
 *
 * Prepaid orders go through /api/create-order → /api/verify-payment instead, because
 * there the order must not exist until the payment is proven.
 */
export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  const ip = clientIpFrom(request);

  const { limit, windowMs } = RATE_LIMITS.createOrder;
  const { ok: withinLimit, retryAfterMs } = consumeRateLimit(`cod-order:${ip}`, limit, windowMs);
  if (!withinLimit) {
    logSecurityEvent({ type: "RATE_LIMIT_TRIGGERED", requestId, ip, endpoint: ENDPOINT, result: "blocked", risk: "medium" });
    return NextResponse.json(
      { error: "Too many order attempts. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)), "x-request-id": requestId } },
    );
  }

  const customerId = await currentCustomerId();
  if (!customerId) {
    return NextResponse.json({ error: "Please sign in before checking out." }, { status: 401, headers: { "x-request-id": requestId } });
  }

  let body: { lines?: unknown; couponCode?: unknown; shipping?: unknown; codFee?: unknown; contact?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400, headers: { "x-request-id": requestId } });
  }

  const contact = validateOrderContact(body.contact);
  if (!contact.ok) {
    return NextResponse.json({ error: contact.error }, { status: 400, headers: { "x-request-id": requestId } });
  }

  const priced = priceOrder({
    lines: body.lines,
    couponCode: body.couponCode,
    shipping: body.shipping,
    codFee: body.codFee,
    paymentMode: "cod",
  });

  if (!priced.ok) {
    logSecurityEvent({ type: "ORDER_PRICE_REJECTED", requestId, ip, endpoint: ENDPOINT, result: "blocked", risk: "medium", meta: { reason: priced.error } });
    return NextResponse.json({ error: priced.error }, { status: 400, headers: { "x-request-id": requestId } });
  }

  const placedAt = new Date().toISOString();
  const orderId = `MIT${Date.now().toString().slice(-8)}`;

  try {
    const doc: OrderDoc = {
      _id: orderId,
      customerId,
      customerName: contact.value.name,
      email: contact.value.email,
      phone: `+91 ${contact.value.phone}`,
      placedAt,
      status: "pending",
      payment: "cod",
      // Nothing has been collected — the courier takes the full amount on delivery.
      paid: false,
      advancePaid: 0,
      lines: priced.lines,
      subtotal: priced.subtotal,
      discount: priced.discount,
      shipping: priced.shipping,
      codFee: priced.codFee,
      total: priced.total,
      couponCode: typeof body.couponCode === "string" && body.couponCode ? body.couponCode.toUpperCase() : null,
      address: contact.value.address,
      // "Payment confirmed" stays open for COD until the money is actually collected.
      timeline: TIMELINE_STEPS.map((label, index) => ({ label, at: placedAt, done: index === 0 })),
      // No Razorpay order exists; this keeps the unique index satisfied and makes COD
      // orders obvious in the database.
      razorpayOrderId: `cod_${orderId}`,
    };

    const orders = await getOrdersCollection();
    await orders.insertOne(doc);

    // Awaited, not fire-and-forget: a serverless function can be frozen the moment it
    // responds, which would kill an in-flight send. It can never fail the order — the
    // helper swallows and logs its own errors.
    await sendOrderConfirmation(doc, requestId);

    return NextResponse.json(
      {
        ok: true,
        reference: orderId,
        placedAt,
        breakdown: {
          subtotal: priced.subtotal,
          discount: priced.discount,
          shipping: priced.shipping,
          codFee: priced.codFee,
          total: priced.total,
          amountPaid: 0,
          dueOnDelivery: priced.total,
        },
      },
      { headers: { "x-request-id": requestId } },
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
      { error: "We couldn't place your order right now. Please try again." },
      { status: 503, headers: { "x-request-id": requestId } },
    );
  }
}
