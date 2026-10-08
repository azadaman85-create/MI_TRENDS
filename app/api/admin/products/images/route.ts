import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/guard.server";
import { getProductImagesCollection } from "@/lib/db/models";
import { RATE_LIMITS } from "@/lib/security/config";
import { logSecurityEvent } from "@/lib/security/events";
import { clientIpFrom, consumeRateLimit } from "@/lib/security/rate-limit";
import { requestIdFrom } from "@/lib/security/request-id";

const ENDPOINT = "/api/admin/products/images";

/** 5 MB. Big enough for a real product photo, small enough not to bloat the database. */
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Only formats a browser will actually render. The list is a allow-list rather than a
 * block-list: an SVG, for instance, can carry script, and nothing here needs one.
 */
const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
]);

/**
 * Stores an uploaded product photo and returns the URL to save on the product.
 *
 * This replaces the previous behaviour, where the file was turned into a base64 string
 * and kept in one browser's localStorage — which meant the image did not exist for
 * anyone else, and silently broke once the 5 MB storage quota was hit.
 */
export async function POST(request: Request) {
  const requestId = requestIdFrom(request);
  const ip = clientIpFrom(request);

  const { limit, windowMs } = RATE_LIMITS.adminData;
  if (!consumeRateLimit(`admin-image:${ip}`, limit, windowMs).ok) {
    return NextResponse.json({ error: "Too many uploads. Try again shortly." }, { status: 429, headers: { "x-request-id": requestId } });
  }

  const admin = await requireAdmin();
  if (!admin) {
    logSecurityEvent({ type: "SUSPICIOUS_REQUEST", requestId, ip, endpoint: ENDPOINT, result: "blocked", risk: "high", meta: { reason: "no-admin-session" } });
    return NextResponse.json({ error: "Not authorized." }, { status: 401, headers: { "x-request-id": requestId } });
  }

  let file: File | null = null;
  try {
    const form = await request.formData();
    const candidate = form.get("file");
    if (candidate instanceof File) file = candidate;
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400, headers: { "x-request-id": requestId } });
  }

  if (!file) {
    return NextResponse.json({ error: "No file received." }, { status: 400, headers: { "x-request-id": requestId } });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Use a JPG, PNG, WebP or AVIF image." },
      { status: 415, headers: { "x-request-id": requestId } },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `That image is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 5 MB.` },
      { status: 413, headers: { "x-request-id": requestId } },
    );
  }

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    // The declared content type is the browser's claim; check the magic bytes agree
    // before storing something that will later be served back with that type.
    if (!looksLikeImage(bytes, file.type)) {
      return NextResponse.json(
        { error: "That file isn't the image type it claims to be." },
        { status: 415, headers: { "x-request-id": requestId } },
      );
    }

    const id = `${randomUUID()}.${ALLOWED.get(file.type)}`;
    const images = await getProductImagesCollection();
    await images.insertOne({
      _id: id,
      data: bytes,
      contentType: file.type,
      size: bytes.byteLength,
      createdAt: new Date().toISOString(),
    });

    logSecurityEvent({ type: "ADMIN_ACTION", requestId, ip, endpoint: ENDPOINT, result: "allowed", risk: "low", meta: { action: "image-upload", image: id, bytes: bytes.byteLength, admin: admin.email } });

    return NextResponse.json({ ok: true, url: `/api/images/${id}` }, { headers: { "x-request-id": requestId } });
  } catch {
    return NextResponse.json({ error: "Could not store that image." }, { status: 503, headers: { "x-request-id": requestId } });
  }
}

/** Magic-number check, so the stored bytes match the type they'll be served as. */
function looksLikeImage(bytes: Buffer, type: string): boolean {
  if (bytes.length < 12) return false;
  switch (type) {
    case "image/jpeg":
      return bytes[0] === 0xff && bytes[1] === 0xd8;
    case "image/png":
      return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
    // Both sit inside a RIFF/ISO-BMFF container identified at offset 8.
    case "image/webp":
      return bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
    case "image/avif":
      return bytes.subarray(4, 8).toString("ascii") === "ftyp";
    default:
      return false;
  }
}
