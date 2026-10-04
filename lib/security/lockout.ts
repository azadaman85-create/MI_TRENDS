import { ADMIN_LOGIN_LOCKOUT } from "@/lib/security/config";

/**
 * Progressive lockout layered on top of the flat rate limit in
 * `lib/security/rate-limit.ts`. The rate limit alone resets to a clean slate
 * every window; this escalates — more failed cycles mean longer cooldowns —
 * and remembers the failure count across windows until a login actually
 * succeeds. Keyed by email+IP (never IP alone, so one shared office IP
 * failing a login doesn't lock out every other employee on it).
 */
type LockoutState = {
  failures: number;
  lockCycles: number;
  lockedUntil: number | null;
};

const states = new Map<string, LockoutState>();
const MAX_ENTRIES = 5_000;

function getState(key: string): LockoutState {
  let state = states.get(key);
  if (!state) {
    if (states.size >= MAX_ENTRIES) states.clear();
    state = { failures: 0, lockCycles: 0, lockedUntil: null };
    states.set(key, state);
  }
  return state;
}

export type LockoutCheck = { locked: true; retryAfterMs: number } | { locked: false };

/** Call before attempting the credential check. */
export function checkLockout(key: string): LockoutCheck {
  const state = getState(key);
  if (state.lockedUntil && state.lockedUntil > Date.now()) {
    return { locked: true, retryAfterMs: state.lockedUntil - Date.now() };
  }
  return { locked: false };
}

/** Call after a failed credential check. */
export function recordFailure(key: string): LockoutCheck {
  const state = getState(key);
  state.failures += 1;

  if (state.failures >= ADMIN_LOGIN_LOCKOUT.failuresBeforeLock) {
    state.lockCycles += 1;
    state.failures = 0;
    const duration =
      state.lockCycles > ADMIN_LOGIN_LOCKOUT.escalateAfterCycles
        ? ADMIN_LOGIN_LOCKOUT.escalatedLockMs
        : ADMIN_LOGIN_LOCKOUT.initialLockMs;
    state.lockedUntil = Date.now() + duration;
    return { locked: true, retryAfterMs: duration };
  }

  return { locked: false };
}

/** Call after a successful login — a real sign-in clears the slate. */
export function recordSuccess(key: string) {
  states.delete(key);
}
