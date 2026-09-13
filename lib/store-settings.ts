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
  /** Share of the total collected up front by UPI when paying COD. */
  codAdvancePercent: number;
  /** Handling fee added to a COD order. */
  codFee: number;
  freeShippingThreshold: number;
  standardShipping: number;
};

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  codEnabled: true,
  codMinimumOrder: 800,
  codAdvancePercent: 20,
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
  /** Paid now by UPI. */
  advance: number;
  /** Collected by the courier on delivery. */
  balance: number;
};

/**
 * Eligibility is judged on the merchandise value — what the shopper actually spent on
 * product, excluding delivery — while the advance is a share of the full COD total, so
 * the advance and the balance always add up to what is owed.
 */
export function codPlanFor(
  { merchandise, shipping }: { merchandise: number; shipping: number },
  settings: StoreSettings,
): CodPlan {
  const total = merchandise + shipping + settings.codFee;

  if (!settings.codEnabled) {
    return { available: false, reason: "disabled", advance: 0, balance: total };
  }
  if (merchandise <= settings.codMinimumOrder) {
    return { available: false, reason: "below-minimum", advance: 0, balance: total };
  }

  const advance = Math.round((total * settings.codAdvancePercent) / 100);
  return { available: true, reason: null, advance, balance: total - advance };
}
