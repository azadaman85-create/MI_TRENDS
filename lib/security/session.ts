import { createHmac, timingSafeEqual } from "crypto";

/**
 * Minimal signed session token: base64url(payload JSON) + "." + base64url(HMAC-SHA256).
 * No DB or external session store needed — the server-only secret is the only trust
 * anchor, so it must never be exposed to the client (no NEXT_PUBLIC_ prefix).
 */

export type SessionPayload = {
  sub: string;
  role: string;
  iat: number;
  exp: number;
};

function base64url(input: Buffer) {
  return input.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlToBuffer(input: string) {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(padded, "base64");
}

function sign(data: string, secret: string) {
  return base64url(createHmac("sha256", secret).update(data).digest());
}

export function createSessionToken(payload: SessionPayload, secret: string) {
  const encodedPayload = base64url(Buffer.from(JSON.stringify(payload)));
  const signature = sign(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string, secret: string): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encodedPayload, signature] = parts;
  if (!encodedPayload || !signature) return null;

  const expected = sign(encodedPayload, secret);
  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);
  if (expectedBuf.length !== signatureBuf.length || !timingSafeEqual(expectedBuf, signatureBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64urlToBuffer(encodedPayload).toString("utf8")) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
