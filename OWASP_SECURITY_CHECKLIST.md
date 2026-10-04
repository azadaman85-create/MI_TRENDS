# MI TRENDS — OWASP Top 10 (2021) Checklist

Date: 2026-10-04. Read `SECURITY_AUDIT.md` first — this project has no backend/database, which
changes what several of these categories even mean here. Nothing below is marked PASS unless it
was actually verified (code review, a live test against the dev server, or both — see
`SECURITY_TEST_REPORT.md` for the live evidence).

| # | Category | Status |
|---|---|---|
| A01 | Broken Access Control | **PARTIAL** |
| A02 | Cryptographic Failures | **PASS** |
| A03 | Injection | **PASS** |
| A04 | Insecure Design | **PARTIAL** |
| A05 | Security Misconfiguration | **PASS** |
| A06 | Vulnerable and Outdated Components | **PASS** (one accepted dev-only exception) |
| A07 | Authentication Failures | **PASS** |
| A08 | Software and Data Integrity Failures | **PASS** |
| A09 | Security Logging & Monitoring | **PASS** (scoped) |
| A10 | SSRF | **PASS** (not applicable) |

No category is marked a bare FAIL — the two PARTIALs are deliberate, documented, and bounded by
the project's own architecture (no backend/database), not oversights. Where that's true, it's
explained below rather than hidden behind a PASS that wouldn't survive a second look.

## A01 — Broken Access Control — PARTIAL

**What's protected:** The one real authorization boundary in this app — the admin panel — is
enforced server-side in `proxy.ts` regardless of client JS, confirmed by live test (unauthenticated
`/admin` → `307` to `/admin/login`). Admin login/logout/session all require the signed cookie.

**What's not, and why it's PARTIAL not FAIL:** There is no `/api/orders/[id]`-style endpoint for
IDOR to even apply to — "orders," "customer profiles," "addresses," "cart," "wishlist" are all
`localStorage` reads/writes with no server endpoint parameterized by an ID at all. You can't
test "does `/api/orders/1001` leak another user's order" when no such endpoint exists. This
isn't a gap this pass closed, because closing it means building the backend the brief says not
to invent. Flagged, not fixed — see `SECURITY_AUDIT.md` §4 for the fullest version of this.

**Fixed in this pass — a real one:** `?next=` on login/signup was an open redirect (CWE-601):
`/account/login?next=https://evil.example` would send a shopper who just authenticated off to
an attacker's page. Fixed with `lib/safe-redirect.ts`, which only accepts a same-document
relative path. This is squarely an access-control-adjacent fix (OWASP groups unvalidated
redirects under A01) and the one concrete A01 finding this pass could actually remediate.

## A02 — Cryptographic Failures — PASS

**Fixed in this pass:** the admin password was hashed with a single round of SHA-256 — exactly
what this spec calls out as unsafe for password storage. Moved to scrypt (`lib/security/password.ts`),
built into Node's `crypto` module — deliberately slow/memory-hard, no new dependency. The live
`.env.local` hash was regenerated for the real current password and verified working by a live
login test.

**Already correct, confirmed by this pass:** `RAZORPAY_KEY_SECRET` and the admin credentials have
no `NEXT_PUBLIC_` prefix (server-only). The admin session cookie is `HttpOnly`, `Secure` in
production, `SameSite=Lax`, signed with HMAC-SHA256 over a server-only secret. No secrets appear
in URLs, query parameters, or error messages (checked every route handler's catch block).

**Known, documented exception:** customer account passwords (`lib/account/auth.tsx`) are still
SHA-256 — but hashed *in the browser*, for an account that only ever lives in that browser's own
`localStorage`. There is no server to send a stronger hash to verify against, and Web Crypto
doesn't expose scrypt/Argon2id natively. Upgrading this specific hash buys nothing: the "attacker"
with access to read it already has full read/write access to the same `localStorage`, hash or no
hash. Not fixed, because there's nothing a stronger algorithm would actually defend here.

## A03 — Injection — PASS

No database exists, so there is no SQL/NoSQL injection surface — confirmed by `git grep` finding
zero query-construction code anywhere in the repo. No `eval`, `new Function`, `child_process`, or
shell execution anywhere (swept across all tracked files). No template-injection surface (no
server-rendered templates evaluate user strings as code). XSS (technically A03 in the 2021 list,
treated as its own section in the brief) — no `dangerouslySetInnerHTML` anywhere; every
user-controlled string renders as a React text child, which escapes by default; CSP is
defense-in-depth on top of that.

## A04 — Insecure Design — PARTIAL

**Fixed in an earlier pass, reconfirmed here:** `/api/create-order` used to trust a client-sent
`amount` outright — a real, exploitable price-manipulation bug. It now recomputes the subtotal
and coupon discount from the server's own catalogue and coupon rules (`lib/pricing.ts`),
verified live: a request with `amount: 1` still got charged the real ₹899.

**What's PARTIAL:** shipping cost, the COD handling fee, and the COD advance percentage are
admin-configured values that live only in the admin's own browser `localStorage`
(`lib/store-settings.ts`) — there's no server-side copy for `/api/create-order` to check against,
so these three are accepted from the client and clamped to a bounded range rather than fully
verified. And — the deepest one — the `Order` record the admin panel trusts is still written by
the browser (`lib/order-inbox.ts`), not created by a server once payment is confirmed, so nothing
cryptographically binds a specific order to a specific verified payment. Both are named explicitly
in `SECURITY_AUDIT.md` §3–4 as requiring real backend infrastructure this project doesn't have —
the honest reason this isn't a plain PASS.

## A05 — Security Misconfiguration — PASS

CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, COOP, CORP, and
`Permissions-Policy` are all set in `next.config.ts` and confirmed present on live responses. No
debug mode, verbose error pages, or stack traces returned to a caller in any route (checked every
catch block — all return a fixed, generic message). No default/test credentials — the admin
account requires explicit env configuration and refuses to start up "configured" without it
(`ADMIN_CONFIGURED` check). CSP's one necessary exception (`'unsafe-inline'` for scripts/styles,
`'unsafe-eval'` in development only) is documented inline in `next.config.ts` and in `SECURITY.md`
§5, not silently accepted.

## A06 — Vulnerable and Outdated Components — PASS (one accepted exception)

`npm audit` found 7 issues (6 high, 1 critical) before this pass:

| Dependency | Issue | Severity | Fix |
|---|---|---|---|
| `next` 16.3.5 | RCE in `next/og ImageResponse` | Critical | **Fixed** — bumped to 16.3.8 via `npm audit fix`, within the existing `^16.3.4` range (no `package.json` change needed). Rebuilt and smoke-tested after. |
| `brace-expansion` (nested, via `@typescript-eslint`) | ReDoS / stack-exhaustion DoS | High | **Fixed** — same `npm audit fix` run. |
| `braces` → `micromatch` → `fast-glob` → `@next/eslint-plugin-next` → `eslint-config-next` | Stack-exhaustion DoS | High | **Not fixed.** Only resolvable via `npm audit fix --force`, which downgrades `eslint-config-next` to `14.2.35` — a breaking devDependency change for a tool that only runs at lint time, never shipped to the production bundle or reachable by an external attacker. Accepted as a documented, low-real-world-risk exception rather than forcing a breaking downgrade the brief itself warns against ("do not perform destructive major-version upgrades without checking compatibility"). |

Post-fix: `npx tsc --noEmit`, `npx eslint .`, and `npm run build` all still pass clean.

## A07 — Authentication Failures — PASS

Rate limiting + a progressive brute-force lockout on admin login (`lib/security/lockout.ts`),
keyed by email+IP — verified live in `SECURITY_TEST_REPORT.md` (6th failed attempt locks for 15
minutes with its own distinct message). Session is regenerated fresh on every successful login
(a new signed token, never reused — confirmed by reading `issueAdminSessionToken`'s call site).
Logout clears the cookie. No account-exists oracle: **fixed in this pass** —
`lib/account/auth.tsx`'s `signIn` used to return "we couldn't find an account" vs. "email and
password don't match," letting a failed login double as an email-existence check (this spec's own
named example of what not to do). Both paths now return the same generic message. Admin login
already returned one generic message for both cases, unchanged.

**One documented, accepted limitation:** the admin session is a stateless signed token, not a
server-side session record — logout removes the cookie from the browser that called it, but a
copy of the token captured before logout would remain cryptographically valid until its 12-hour
expiry (there's no revocation list, which would need the database this project doesn't have).
Mitigated by the short TTL and by `ADMIN_SESSION_SECRET` rotation being a one-env-var fix that
invalidates every outstanding token at once if a real incident happens.

## A08 — Software and Data Integrity Failures — PASS

No dedicated payment webhook endpoint exists (confirmed by `git grep`) — only the client-driven
`verify-payment` flow, which was already signature-verified server-side and, as of the earlier
pass, also checked against an in-process ledger of what this server actually created and rejects
a replayed "verify" for the same order (`409`, live-tested). `payment_status=success` from the
frontend is never trusted — the HMAC signature check and the ledger cross-check both happen
server-side before anything is treated as paid. No CI/CD pipeline exists in this repo to audit.

## A09 — Security Logging & Monitoring — PASS (scoped)

`lib/security/events.ts` logs structured JSON for `LOGIN_SUCCESS`/`FAILED`, `ACCOUNT_LOCKED`,
`RATE_LIMIT_TRIGGERED`, `PAYMENT_VERIFIED`/`VERIFICATION_FAILED`/`REPLAY_REJECTED`,
`ORDER_PRICE_REJECTED`, `CSRF_BLOCKED`, `INVALID_INPUT`, `SUSPICIOUS_REQUEST` — matching the
brief's own list closely (admin actions beyond login have no server endpoint to attach a log
event to; see A01). Every event carries a timestamp, type, request ID, IP, endpoint, result and
risk level, and never a password/OTP/token/card number. "Scoped" because the sink is `console`
(Vercel/most Node hosts collect from there) rather than a dedicated log database — there isn't
one in this project — documented as the thing to swap when one exists.

## A10 — SSRF — PASS (not applicable)

Swept every route handler and library file for a server-side `fetch`/HTTP call: the only ones
are to the Razorpay SDK, which calls Razorpay's own fixed API host — never a URL built from user
input. There is no image-proxy, URL-preview, webhook-test, or similar feature anywhere that takes
a user-supplied URL and has the server fetch it. Nothing to protect because the feature that
would need protecting doesn't exist.

## Explicitly out of scope (per the brief's own closing instruction)

CDN/WAF, dedicated DDoS protection, a hosting-level or database firewall, a managed secrets
manager, infrastructure-level monitoring, and production penetration testing are all
infrastructure decisions outside what application code can provide, and none of this is claimed
as "100% secure" or "OWASP certified" — OWASP alignment here means the application-layer code
follows the relevant practices for the architecture it actually has, not that every category's
underlying risk is eliminated.
