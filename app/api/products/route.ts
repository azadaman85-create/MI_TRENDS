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
          /*
            Not cached. The storefront reads the catalogue server-side in the layout, so
            nothing in the app depends on this endpoint being fast — but a shared cache
            here meant a product published in the panel was still missing from the API a
            minute later, which reads as a bug every time. A single indexed query over a
            catalogue this size is not worth that confusion.
          */
          "Cache-Control": "no-store",
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
