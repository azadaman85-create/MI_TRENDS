import { randomUUID } from "crypto";

/** Header both the proxy and route handlers read/write so one request has one ID end to end. */
export const REQUEST_ID_HEADER = "x-request-id";

/** Reuse an upstream-assigned ID (e.g. from a CDN) if present, otherwise mint one. */
export function requestIdFrom(request: Request): string {
  return request.headers.get(REQUEST_ID_HEADER) || randomUUID();
}
