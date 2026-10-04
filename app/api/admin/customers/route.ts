import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/guard.server";
import type { Customer } from "@/lib/admin/types";
import { getCustomersCollection, getOrdersCollection } from "@/lib/db/models";
import { RATE_LIMITS } from "@/lib/security/config";
import { logSecurityEvent } from "@/lib/security/events";
import { clientIpFrom, consumeRateLimit } from "@/lib/security/rate-limit";
import { requestIdFrom } from "@/lib/security/request-id";

const ENDPOINT = "/api/admin/customers";
const MAX_CUSTOMERS = 1000;

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  const ip = clientIpFrom(request);

  const { limit, windowMs } = RATE_LIMITS.adminData;
  const { ok: withinLimit } = consumeRateLimit(`admin-customers:${ip}`, limit, windowMs);
  if (!withinLimit) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429, headers: { "x-request-id": requestId } });
  }

  const admin = await requireAdmin();
  if (!admin) {
    logSecurityEvent({ type: "SUSPICIOUS_REQUEST", requestId, ip, endpoint: ENDPOINT, result: "blocked", risk: "high", meta: { reason: "no-admin-session" } });
    return NextResponse.json({ error: "Not authorized." }, { status: 401, headers: { "x-request-id": requestId } });
  }

  try {
    const [customersCollection, ordersCollection] = await Promise.all([
      getCustomersCollection(),
      getOrdersCollection(),
    ]);

    const docs = await customersCollection.find({}).sort({ createdAt: -1 }).limit(MAX_CUSTOMERS).toArray();

    // One grouped pass over orders rather than a query per customer. Sorting by placedAt
    // first means $last picks up the most recent delivery address for each customer.
    const stats = await ordersCollection
      .aggregate<{ _id: string; orders: number; spend: number; lastOrderAt: string; city?: string; state?: string }>([
        { $match: { status: { $nin: ["awaiting_payment", "cancelled"] } } },
        { $sort: { placedAt: 1 } },
        {
          $group: {
            _id: "$customerId",
            orders: { $sum: 1 },
            spend: { $sum: "$total" },
            lastOrderAt: { $max: "$placedAt" },
            city: { $last: "$address.city" },
            state: { $last: "$address.state" },
          },
        },
      ])
      .toArray();
    const statsById = new Map(stats.map((entry) => [entry._id, entry]));

    const customers: Customer[] = docs.map((doc) => {
      const stat = statsById.get(doc._id);
      const orders = stat?.orders ?? 0;
      const spend = stat?.spend ?? 0;
      // Never ships passwordSalt/passwordHash — only these fields are selected.
      return {
        id: doc._id,
        name: doc.name,
        email: doc.email,
        phone: doc.phone ?? "",
        // No signup field for these — the latest order's delivery address is the best
        // signal the panel has, and an em dash reads better than an empty cell.
        city: stat?.city ?? "—",
        state: stat?.state ?? "—",
        joinedAt: doc.createdAt,
        orders,
        spend,
        tier: spend > 12000 ? "vip" : orders > 2 ? "regular" : "new",
        lastOrderAt: stat?.lastOrderAt ?? null,
      };
    });

    return NextResponse.json({ customers }, { headers: { "x-request-id": requestId, "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not load customers." }, { status: 503, headers: { "x-request-id": requestId } });
  }
}
