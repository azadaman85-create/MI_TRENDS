import { NextResponse } from "next/server";

import { getProductImagesCollection } from "@/lib/db/models";

/**
 * Serves an uploaded product image.
 *
 * Public, because product photos are public. Each file is immutable — a new upload gets a
 * new id — so it is served with a one-year immutable cache. The database is therefore
 * read once per image and the CDN answers everything after that.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // The id is a UUID plus an extension. Rejecting anything else keeps arbitrary strings
  // out of the query entirely.
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp|avif)$/.test(id)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const images = await getProductImagesCollection();
    const image = await images.findOne({ _id: id });
    if (!image) return new NextResponse("Not found", { status: 404 });

    // The driver hands back a BSON Binary, not the Buffer the type says — the type
    // describes what we wrote, not what comes out. Unwrap it, then copy into a fresh
    // ArrayBuffer so the response never aliases the driver's pooled allocation.
    const bytes = toBuffer(image.data);
    const body = new Uint8Array(bytes).slice().buffer;
    return new NextResponse(body, {
      headers: {
        "Content-Type": image.contentType,
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
        // The bytes were type-checked on upload, but belt and braces: never let a
        // browser sniff its way to treating this as something executable.
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Unavailable", { status: 503 });
  }
}

/**
 * Normalises whatever the driver returns into a Buffer.
 *
 * Writes go in as a Buffer, but BSON stores them as binary and reads come back as a
 * `Binary` wrapper, whose bytes live on `.buffer`. Handling both keeps this correct
 * regardless of driver version.
 */
function toBuffer(value: unknown): Buffer {
  if (Buffer.isBuffer(value)) return value;
  const wrapped = (value as { buffer?: unknown })?.buffer;
  if (Buffer.isBuffer(wrapped)) return wrapped;
  if (wrapped instanceof Uint8Array) return Buffer.from(wrapped);
  if (value instanceof Uint8Array) return Buffer.from(value);
  return Buffer.alloc(0);
}
