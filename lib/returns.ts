import type { OrderDoc } from "@/lib/db/models";

/**
 * The return policy, in one place.
 *
 * Every surface that states the window — the product page, the footer, the policy page,
 * the invoice, the emails — reads RETURN_WINDOW_DAYS from here, so the promise made to
 * the customer and the rule the server enforces can never drift apart.
 *
 * The window runs from delivery, not from the order date: a parcel that took a week to
 * arrive would otherwise burn most of its own return window in transit.
 */

export const RETURN_WINDOW_DAYS = 7;

/**
 * How long inspection takes once the item is back with us, before the refund is sent.
 * Stated as a range because couriers and bank credits both vary.
 */
export const REFUND_INSPECTION_DAYS_MIN = 2;
export const REFUND_INSPECTION_DAYS_MAX = 3;

/**
 * Where the money goes back to, which depends on how it arrived.
 *
 * A prepaid order reverses through Razorpay to the exact UPI ID or card that paid — there
 * is no choosing, and offering a choice would be a promise we can't keep. Cash on
 * delivery has no such trail: the customer handed notes to a courier, so a refund has to
 * be sent somewhere, and we have to ask where.
 */
export function isPrepaid(payment: string): boolean {
  return payment !== "cod";
}

export const REFUND_INSPECTION_COPY =
  `Once we have the item back, we check it within ${REFUND_INSPECTION_DAYS_MIN}–${REFUND_INSPECTION_DAYS_MAX} working days`;

export const REFUND_POLICY_PREPAID =
  `${REFUND_INSPECTION_COPY} and refund to the same UPI ID or card you paid with.`;

export const REFUND_POLICY_COD =
  `${REFUND_INSPECTION_COPY} and send the refund to the UPI ID you give us below — a cash-on-delivery ` +
  `order has no card or UPI to send it back to.`;

export function refundPolicyFor(payment: string): string {
  return isPrepaid(payment) ? REFUND_POLICY_PREPAID : REFUND_POLICY_COD;
}

/** Generic wording for places that aren't about one specific order. */
export const REFUND_POLICY_SHORT =
  `${REFUND_INSPECTION_COPY} and refund you — prepaid orders go back to the same UPI ID or card, ` +
  `and cash-on-delivery orders go to a UPI ID you give us.`;

const DAY_MS = 24 * 60 * 60 * 1000;

export type ReturnEligibility =
  | { eligible: true; deadline: string; daysLeft: number }
  | { eligible: false; reason: ReturnBlockReason; deadline?: string };

export type ReturnBlockReason =
  | "not-delivered"
  | "window-closed"
  | "already-requested"
  | "order-closed";

export const RETURN_BLOCK_COPY: Record<ReturnBlockReason, string> = {
  "not-delivered": "You can request a return once the order has been delivered.",
  "window-closed": `The ${RETURN_WINDOW_DAYS}-day return window for this order has closed.`,
  "already-requested": "A return has already been requested for this order.",
  "order-closed": "This order was cancelled or already returned.",
};

/**
 * When the clock started.
 *
 * Orders delivered before deliveredAt existed fall back to the Delivered step's own
 * timestamp. Those older rows stamped every step with the order date, so they resolve to
 * the order date — which, for anything genuinely that old, has long since expired anyway.
 */
export function deliveredAtOf(order: Pick<OrderDoc, "deliveredAt" | "timeline" | "status">): string | null {
  if (order.deliveredAt) return order.deliveredAt;
  if (order.status !== "delivered" && order.status !== "returned") return null;
  const step = order.timeline?.find((s) => s.label === "Delivered" && s.done);
  return step?.at ?? null;
}

export function returnDeadline(deliveredAt: string): Date {
  return new Date(new Date(deliveredAt).getTime() + RETURN_WINDOW_DAYS * DAY_MS);
}

/**
 * The single source of truth for "can this order be returned right now".
 *
 * Called by the returns page to decide what to show and by the API to decide what to
 * accept — the UI hiding the button is a convenience, this is the actual rule.
 */
export function returnEligibility(
  order: Pick<OrderDoc, "deliveredAt" | "timeline" | "status" | "returnRequest">,
  now: Date = new Date(),
): ReturnEligibility {
  if (order.returnRequest) return { eligible: false, reason: "already-requested" };
  if (order.status === "cancelled" || order.status === "returned") {
    return { eligible: false, reason: "order-closed" };
  }

  const deliveredAt = deliveredAtOf(order);
  if (!deliveredAt) return { eligible: false, reason: "not-delivered" };

  const deadline = returnDeadline(deliveredAt);
  if (now.getTime() > deadline.getTime()) {
    return { eligible: false, reason: "window-closed", deadline: deadline.toISOString() };
  }

  // Round up, so the last partial day still reads as "1 day left" rather than "0".
  const daysLeft = Math.max(1, Math.ceil((deadline.getTime() - now.getTime()) / DAY_MS));
  return { eligible: true, deadline: deadline.toISOString(), daysLeft };
}

/** The stages a return moves through, in order, as the admin works it. */
export const RETURN_STATUSES = ["requested", "approved", "rejected", "completed"] as const;
export type ReturnStatus = (typeof RETURN_STATUSES)[number];

/** What each stage means to the customer reading their own order. */
export function returnStatusCopy(status: ReturnStatus, payment: string): string {
  switch (status) {
    case "requested":
      return `We've got your request. We'll arrange pickup and email you the details. ${refundPolicyFor(payment)}`;
    case "approved":
      return `Return approved — pickup is being arranged. ${refundPolicyFor(payment)}`;
    case "rejected":
      return "This return couldn't be accepted. Check your email for the reason, or contact us and we'll go through it with you.";
    case "completed":
      return isPrepaid(payment)
        ? "Refund sent to the UPI ID or card you paid with. Banks usually show it within 3–5 working days."
        : "Refund sent to the UPI ID you gave us. Banks usually show it within 3–5 working days.";
  }
}

/** The same stages, labelled for the panel. */
export const RETURN_STATUS_LABEL: Record<ReturnStatus, string> = {
  requested: "Return requested",
  approved: "Return approved",
  rejected: "Return rejected",
  completed: "Refunded",
};

export const RETURN_REASONS = [
  "Size doesn't fit",
  "Not what I expected",
  "Quality isn't right",
  "Arrived damaged",
  "Wrong item delivered",
  "Changed my mind",
] as const;

export type ReturnReason = (typeof RETURN_REASONS)[number];
