/**
 * In-memory fixed-window rate limiter, keyed per caller (e.g. IP, or IP+email).
 *
 * This is per-process state: fine for the single Node server this app currently
 * deploys as (`output: "standalone"`), but it resets on restart and does not share
 * state across multiple instances. Swap for a shared store (Redis, etc.) before
 * running more than one instance behind a load balancer.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Bound memory use: drop the oldest-expiring entries once the map gets large.
const MAX_BUCKETS = 10_000;

export function consumeRateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterMs: number } {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) buckets.clear();
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterMs: 0 };
  }

  if (existing.count >= limit) {
    return { ok: false, retryAfterMs: existing.resetAt - now };
  }

  existing.count += 1;
  return { ok: true, retryAfterMs: 0 };
}

export function clientIpFrom(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
