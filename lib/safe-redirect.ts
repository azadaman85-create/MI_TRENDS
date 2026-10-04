/**
 * Validates a post-login/signup `?next=` redirect target.
 *
 * Login and signup both accept `?next=<path>` so the account flow can hand the
 * shopper back to where they started (checkout, a product page, etc.). Taking
 * that value straight from the URL and handing it to `router.push()` is a
 * classic open-redirect: a link like `/account/login?next=https://evil.example`
 * sends a shopper who just authenticated on the real site off to an attacker's
 * page, right after they've shown they trust this domain enough to log in.
 *
 * Only a same-document relative path (starts with exactly one `/`, not `//` or
 * `/\`, which browsers can still parse as protocol-relative to another host)
 * is accepted. Anything else — an absolute URL, a protocol-relative URL, a bare
 * scheme — falls back to a safe default.
 */
export function sanitizeNextPath(raw: string | null, fallback: string): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  return raw;
}
