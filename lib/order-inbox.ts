import type { Order } from "@/lib/admin/types";

/**
 * Hand-off between the storefront checkout and the admin panel.
 *
 * There is no backend, so a placed order is written to its own localStorage key and the
 * admin store merges it in on load (newest first, de-duplicated by id). Keeping it in a
 * separate key means the storefront never has to import the admin's seed data, and an
 * order placed before the panel was ever opened still turns up there.
 */
const INBOX_KEY = "mitrends-order-inbox-v1";

export function readOrderInbox(): Order[] {
  try {
    const raw = window.localStorage.getItem(INBOX_KEY);
    const parsed = raw ? (JSON.parse(raw) as Order[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function pushOrderToAdmin(order: Order) {
  try {
    const inbox = readOrderInbox().filter((entry) => entry.id !== order.id);
    window.localStorage.setItem(INBOX_KEY, JSON.stringify([order, ...inbox].slice(0, 200)));
    return true;
  } catch {
    // Storage unavailable — the shopper still gets their confirmation.
    return false;
  }
}

/** Merges inbox orders into a list, newest first, without duplicating ids. */
export function mergeOrders(existing: Order[], inbox: Order[]) {
  if (!inbox.length) return existing;
  const seen = new Set(inbox.map((order) => order.id));
  return [...inbox, ...existing.filter((order) => !seen.has(order.id))];
}
