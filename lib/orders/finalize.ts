import type { OrderStatus } from "@/lib/admin/types";
import { getOrdersCollection, type OrderDoc } from "@/lib/db/models";
import { sendOrderConfirmation } from "@/lib/email/mailer";
import { takeStock } from "@/lib/inventory.server";
import { logSecurityEvent } from "@/lib/security/events";

/**
 * Promotes a prepaid order from "awaiting_payment" to a real order.
 *
 * Two callers race for this: the browser coming back from Razorpay Checkout
 * (`/api/verify-payment`) and Razorpay's own webhook (`/api/webhooks/razorpay`).
 * Either may arrive first, both may arrive, and the webhook is retried on failure —
 * so this has to be idempotent rather than merely correct once.
 *
 * The guard is the conditional update itself. It matches on
 * `razorpayOrderId` + `status: "awaiting_payment"`, both in the database, so:
 *
 *   - only an order this server actually wrote can be promoted, and
 *   - only the first caller can promote it, whichever one that turns out to be.
 *
 * It deliberately does not live in process memory: on a serverless host `create-order`,
 * `verify-payment` and the webhook routinely run in different instances.
 */

export type FinalizeResult =
  | { outcome: "finalized"; order: OrderDoc }
  /** The same payment, already recorded — a retry, a double submit, or the other caller won the race. */
  | { outcome: "already-final"; order: OrderDoc }
  /** A *different* payment against an order that is already closed. */
  | { outcome: "replayed"; order: OrderDoc }
  /** No order with this Razorpay order ID — this server never created it. */
  | { outcome: "unknown" };

export async function finalizePrepaidOrder(
  razorpayOrderId: string,
  paymentId: string,
  requestId: string,
): Promise<FinalizeResult> {
  const orders = await getOrdersCollection();
  const finalizedAt = new Date().toISOString();

  const promoted = await orders.findOneAndUpdate(
    { razorpayOrderId, status: "awaiting_payment" },
    {
      $set: {
        status: "pending" as OrderStatus,
        // Only prepaid orders reach here — COD is placed unpaid elsewhere.
        paid: true,
        razorpayPaymentId: paymentId,
        "timeline.1.done": true,
        "timeline.1.at": finalizedAt,
      },
    },
    { returnDocument: "after" },
  );

  if (promoted) {
    /*
      Stock moves here and nowhere else on the prepaid path. The conditional update above
      is what makes that safe: only one caller can flip the order out of
      "awaiting_payment", so the browser callback and the webhook cannot both take units
      for the same order. Deliberately not at create-order time — that row is an
      abandoned checkout until it is paid.

      A shortfall is logged rather than refused. The customer has already been charged,
      so the order must stand; what it means is the shop oversold and someone has to
      decide what to do, which is a human decision, not a 500.
    */
    const stock = await takeStock(promoted.lines);
    if (!stock.ok) {
      logSecurityEvent({
        type: "SUSPICIOUS_REQUEST",
        requestId,
        endpoint: "orders/finalize",
        result: "error",
        risk: "high",
        meta: { order: promoted._id, reason: `paid but could not take stock: ${stock.error}` },
      });
    }

    // Best-effort, and only on the transition — a mail failure must never turn a paid
    // order into an error, and the loser of the race must not send a second copy.
    await sendOrderConfirmation(promoted, requestId);
    return { outcome: "finalized", order: promoted };
  }

  const existing = await orders.findOne({ razorpayOrderId });
  if (!existing) return { outcome: "unknown" };
  return existing.razorpayPaymentId === paymentId
    ? { outcome: "already-final", order: existing }
    : { outcome: "replayed", order: existing };
}
