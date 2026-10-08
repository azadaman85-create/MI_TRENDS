import { NextResponse } from "next/server";

import { getActiveProducts } from "@/lib/products.server";
import { requestIdFrom } from "@/lib/security/request-id";

/**
 * The public catalogue.
 *
 * Returns only `status: "active"` rows — a draft is invisible here, which is the whole
 * point of the panel's Publish button. No authentication: this is the shop window.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  try {
    const products = await getActiveProducts();
    return NextResponse.json(
      { products },
      {
        headers: {
          "x-request-id": requestId,
          // Short shared cache: a publish shows up within a minute without every
          // shopper hitting the database, and stale-while-revalidate keeps it instant.
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Could not load products." },
      { status: 503, headers: { "x-request-id": requestId } },
    );
  }
}
