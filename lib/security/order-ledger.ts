/**
 * In-memory record of orders this server created, so `/api/verify-payment` can
 * check a payment against what was actually priced — not just trust whatever
 * the browser sends back — and reject a second verification of the same
 * payment (replay / duplicate webhook-style callback).
 *
 * Per-process only, like `lib/security/rate-limit.ts` — fine for the single
 * Node instance this app deploys as, not for multiple instances behind a
 * load balancer without a shared store.
 */
type LedgerEntry = {
  amountPaise: number;
  createdAt: number;
  verifiedPaymentId: string | null;
};

const ledger = new Map<string, LedgerEntry>();
const MAX_ENTRIES = 5_000;
const ENTRY_TTL_MS = 24 * 60 * 60 * 1000; // a day is generous for a checkout session

function prune() {
  if (ledger.size < MAX_ENTRIES) return;
  const now = Date.now();
  for (const [orderId, entry] of ledger) {
    if (now - entry.createdAt > ENTRY_TTL_MS) ledger.delete(orderId);
  }
}

export function recordOrder(razorpayOrderId: string, amountPaise: number) {
  prune();
  ledger.set(razorpayOrderId, { amountPaise, createdAt: Date.now(), verifiedPaymentId: null });
}

export type VerifyCheck =
  | { ok: true }
  | { ok: false; reason: "unknown-order" | "already-verified" };

/** Call once, after the signature itself has already checked out. */
export function checkAndConsume(razorpayOrderId: string, paymentId: string): VerifyCheck {
  const entry = ledger.get(razorpayOrderId);
  if (!entry) return { ok: false, reason: "unknown-order" };
  if (entry.verifiedPaymentId) return { ok: false, reason: "already-verified" };
  entry.verifiedPaymentId = paymentId;
  return { ok: true };
}
