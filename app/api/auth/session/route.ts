import { NextResponse } from "next/server";

import { currentCustomerId, publicCustomer } from "@/lib/customer/session.server";
import { getCustomersCollection } from "@/lib/db/models";
import { RATE_LIMITS } from "@/lib/security/config";
import { clientIpFrom, consumeRateLimit } from "@/lib/security/rate-limit";
import { requestIdFrom } from "@/lib/security/request-id";

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  const ip = clientIpFrom(request);
  const { limit, windowMs } = RATE_LIMITS.customerSession;
  const { ok } = consumeRateLimit(`customer-session:${ip}`, limit, windowMs);
  if (!ok) {
    return NextResponse.json({ customer: null }, { status: 429, headers: { "x-request-id": requestId } });
  }

  const customerId = await currentCustomerId();
  if (!customerId) {
    return NextResponse.json({ customer: null }, { headers: { "x-request-id": requestId } });
  }

  try {
    const customers = await getCustomersCollection();
    const doc = await customers.findOne({ _id: customerId });
    // A valid cookie for an account that no longer exists reads as signed out.
    if (!doc) return NextResponse.json({ customer: null }, { headers: { "x-request-id": requestId } });
    return NextResponse.json({ customer: publicCustomer(doc) }, { headers: { "x-request-id": requestId } });
  } catch {
    return NextResponse.json({ customer: null }, { status: 503, headers: { "x-request-id": requestId } });
  }
}
