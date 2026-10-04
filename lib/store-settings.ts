/**
 * Checkout rules the admin panel owns and the storefront obeys.
 *
 * There is no backend, so the settings live in their own localStorage key: the admin
 * writes them, the storefront reads them. Both sides fall back to the defaults below
 * when nothing has been saved yet.
 */

export type StoreSettings = {
  /** Master switch for cash on delivery. */
  codEnabled: boolean;
  /** COD is offered only above this order value. */
  codMinimumOrder: number;
  /** Handling fee added to a COD order, collected with the balance on delivery. */
  codFee: number;
  freeShippingThreshold: number;
  standardShipping: number;
};

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  codEnabled: true,
  codMinimumOrder: 800,
  codFee: 49,
  freeShippingThreshold: 999,
  standardShipping: 79,
};

const SETTINGS_KEY = "mitrends-store-settings-v1";

export function readStoreSettings(): StoreSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_STORE_SETTINGS;
    return { ...DEFAULT_STORE_SETTINGS, ...(JSON.parse(raw) as Partial<StoreSettings>) };
  } catch {
    return DEFAULT_STORE_SETTINGS;
  }
}

export function writeStoreSettings(patch: Partial<StoreSettings>): StoreSettings {
  const next = { ...readStoreSettings(), ...patch };
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable — the change applies for this session only.
  }
  return next;
}

export type CodPlan = {
  /** Can this order be placed as cash on delivery at all? */
  available: boolean;
  /** Why not, when it isn't. */
  reason: "disabled" | "below-minimum" | null;
  /** Collected by the courier on delivery — the whole total, since COD takes nothing up front. */
  balance: number;
};

/**
 * Eligibility is judged on the merchandise value — what the shopper actually spent on
 * product, excluding delivery.
 *
 * COD takes **no** up-front payment: the shopper pays the courier the full amount
 * (including the handling fee) on delivery, and the order is never marked paid until
 * an admin moves it to "delivered".
 */
export function codPlanFor(
  { merchandise, shipping }: { merchandise: number; shipping: number },
  settings: StoreSettings,
): CodPlan {
  const total = merchandise + shipping + settings.codFee;

  if (!settings.codEnabled) {
    return { available: false, reason: "disabled", balance: total };
  }
  if (merchandise <= settings.codMinimumOrder) {
    return { available: false, reason: "below-minimum", balance: total };
  }

  return { available: true, reason: null, balance: total };
}
