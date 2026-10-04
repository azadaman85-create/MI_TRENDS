/**
 * Security event log.
 *
 * There is no database or log aggregator in this project, so this writes
 * structured JSON to stderr/stdout (console), which is where Vercel and most
 * Node hosts already collect logs from. Swap `emit` for a real sink (a
 * logging service, a table, a queue) when one exists — every call site stays
 * the same, only this one function needs to change.
 *
 * Never pass raw passwords, OTPs, tokens, card numbers or session secrets as
 * `meta` — these events are meant to be safe to export/share with a SOC.
 */
export type SecurityEventType =
  | "LOGIN_FAILED"
  | "LOGIN_SUCCESS"
  | "RATE_LIMIT_TRIGGERED"
  | "ACCOUNT_LOCKED"
  | "SUSPICIOUS_REQUEST"
  | "PAYMENT_VERIFICATION_FAILED"
  | "PAYMENT_VERIFIED"
  | "PAYMENT_REPLAY_REJECTED"
  | "ORDER_PRICE_REJECTED"
  | "CSRF_BLOCKED"
  | "INVALID_INPUT";

export type SecurityEvent = {
  type: SecurityEventType;
  requestId?: string;
  ip?: string;
  endpoint?: string;
  result: "allowed" | "blocked" | "error";
  risk: "low" | "medium" | "high";
  meta?: Record<string, string | number | boolean | null>;
};

export function logSecurityEvent(event: SecurityEvent) {
  const record = {
    timestamp: new Date().toISOString(),
    ...event,
  };
  const line = JSON.stringify(record);
  // Blocked/error events are the ones worth a noisier log level.
  if (event.result === "blocked" || event.result === "error") {
    console.warn(`[security] ${line}`);
  } else {
    console.log(`[security] ${line}`);
  }
}
