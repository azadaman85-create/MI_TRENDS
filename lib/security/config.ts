/**
 * Centralized rate-limit configuration.
 *
 * Every API route reads its limits from here instead of hard-coding its own
 * numbers, so tuning a limit (or auditing what the limits actually are) means
 * editing one file rather than hunting through every route handler.
 */
export type RateLimitRule = {
  /** Max requests allowed inside the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
};

export const RATE_LIMITS = {
  /**
   * Credential submission — the strictest limit in the app. Deliberately higher than
   * ADMIN_LOGIN_LOCKOUT.failuresBeforeLock (5) below: if the two were equal, this flat
   * limit would always fire first and the lockout's own multi-window escalation would
   * never get a chance to engage. This one exists to blunt a fast automated flood;
   * the lockout is what actually punishes repeated wrong passwords.
   */
  adminLogin: { limit: 8, windowMs: 10 * 60 * 1000 } as RateLimitRule,
  adminLogout: { limit: 20, windowMs: 60 * 1000 } as RateLimitRule,
  adminSession: { limit: 60, windowMs: 60 * 1000 } as RateLimitRule,
  createOrder: { limit: 20, windowMs: 60 * 1000 } as RateLimitRule,
  verifyPayment: { limit: 20, windowMs: 60 * 1000 } as RateLimitRule,

  /** Customer-facing auth. Looser than the admin's — real shoppers mistype and retry. */
  customerSignup: { limit: 10, windowMs: 10 * 60 * 1000 } as RateLimitRule,
  customerLogin: { limit: 12, windowMs: 10 * 60 * 1000 } as RateLimitRule,
  customerSession: { limit: 120, windowMs: 60 * 1000 } as RateLimitRule,
  /** Admin panel polls these for near-real-time order/customer updates. */
  adminData: { limit: 240, windowMs: 60 * 1000 } as RateLimitRule,
} as const;

/**
 * Progressive brute-force lockout for admin login, layered on top of the plain
 * rate limit above. Tracked per (email + IP) — not IP alone, since the doc's
 * own guidance is right that multiple legitimate users can share an IP (NAT,
 * office wifi, campus networks), and IP-only lockout would punish all of them
 * for one person's typos.
 */
export const ADMIN_LOGIN_LOCKOUT = {
  /** Failures before the first cooldown kicks in. */
  failuresBeforeLock: 5,
  /** First lockout duration. */
  initialLockMs: 15 * 60 * 1000,
  /** Lockout duration after repeated lock-outs without a successful login. */
  escalatedLockMs: 60 * 60 * 1000,
  /** How many lock cycles before escalating to the longer cooldown. */
  escalateAfterCycles: 2,
} as const;
