# MI TRENDS — Security

What's actually implemented, where it lives, and how to change it. Read `SECURITY_AUDIT.md`
first if you want the "why" and the honest list of what this project's architecture (no
backend, no database) means can't be fixed here. `OWASP_SECURITY_CHECKLIST.md` maps all of this
to the OWASP Top 10 categories, PASS/PARTIAL per category with the reasoning.

## Architecture

```
Request
  → proxy.ts            (firewall: request ID, CSRF-style Origin check, admin session gate)
  → Route Handler        (per-endpoint rate limit, input validation, business logic)
  → lib/security/*        (shared: rate limiting, lockout, event log, pricing integrity, order ledger)
  → lib/db/*              (MongoDB: customers, orders)
```

Customers and orders persist in MongoDB (`lib/db/`). Products, categories, coupons, banners,
reviews, inventory and store settings are still browser-local — see `SECURITY_AUDIT.md` §7 for
what moved and what didn't. The rate limiter, lockout and order ledger under `lib/security/`
are still in-process memory, not in the database — see "Known limitation" under §2.

### Sessions

Two independent signed-cookie sessions, same mechanism (`lib/security/session.ts`), different
secrets and cookies so neither can be used as the other:

| | Admin | Customer |
|---|---|---|
| Cookie | `mitrends_admin_session` | `mitrends_customer_session` |
| Secret | `ADMIN_SESSION_SECRET` | `CUSTOMER_SESSION_SECRET` |
| TTL | 12 hours | 30 days |
| Guard | `proxy.ts` for pages, `lib/admin/guard.server.ts` for `/api/admin/*` | `currentCustomerId()` in `lib/customer/session.server.ts` |

Both are HttpOnly, `SameSite=Lax`, and `Secure` in production.

## 1. The firewall (`proxy.ts`)

Runs in front of `/admin/*` and `/api/*`. Three things, in order:

1. **Request ID.** Every matched request gets an `x-request-id` header (reused if the client/a
   CDN already set one) on both the request (so the route handler can read it) and the
   response. Security events log this ID so one request can be traced end to end.
2. **CSRF-style Origin check**, for `POST`/`PUT`/`PATCH`/`DELETE` requests to `/api/*` only. If
   an `Origin` header is present and its host doesn't match the request's own `Host` header, the
   request is rejected with `403` before it reaches the route. If `Origin` is absent, the
   request is allowed — some legitimate same-origin requests don't send one, and blocking on
   absence would reject real customers, not attackers.
3. **Admin session gate**, unchanged from before this pass: every `/admin/*` page except
   `/admin/login` requires a valid signed session cookie, checked server-side. The client-side
   redirect in `app/admin/(panel)/layout.tsx` is UX only (fast redirect, no flash of protected
   UI) — this is the real boundary.

## 2. Rate limiting

All limits live in one place: `lib/security/config.ts`. Nothing hard-codes a number inline in a
route file.

| Endpoint | Limit |
|---|---|
| `POST /api/admin/login` | 8 / 10 min per IP (deliberately looser than the 5-failure lockout below — see §3) |
| `POST /api/admin/logout` | 20 / min per IP |
| `GET /api/admin/session` | 60 / min per IP |
| `POST /api/create-order` | 20 / min per IP |
| `POST /api/verify-payment` | 20 / min per IP |

Implementation: `lib/security/rate-limit.ts`, a fixed-window counter in a `Map`. **Known
limitation:** per-process memory, not shared across instances. Fine for this app's single Node
deployment; replace with a shared store (Redis, etc.) before running more than one instance
behind a load balancer.

## 3. Brute-force protection (admin login only — the only credential-checking endpoint)

Layered on top of the flat rate limit above: `lib/security/lockout.ts` tracks failures keyed by
**email + IP**, not IP alone (a shared office/campus IP failing once shouldn't lock out every
other person behind it). Config in `lib/security/config.ts`:

- 5 failed attempts → locked 15 minutes.
- Locked again without a successful login in between → 60 minutes (escalating).
- A successful login clears the slate for that key.

This is separate from, and in addition to, the plain rate limit — the rate limit resets every
window regardless of outcome; the lockout remembers failures *across* windows until a real login
succeeds.

## 4. Order & payment integrity

The core fix in this pass. Full narrative in `SECURITY_AUDIT.md` §3; mechanics here:

- `lib/pricing.ts` — `priceOrder()` takes cart lines (`productId`, `size`, `color`, `quantity`)
  and a coupon code, and computes the subtotal/discount **from the server's own catalogue and
  coupon data** (`lib/catalog.ts`, `lib/coupons.ts`), never from a client-sent number. Rejects
  unknown products, invalid sizes/colors, and out-of-stock sizes.
- Shipping, the COD fee, and the COD advance percentage are clamped (not trusted outright) —
  see the "one honest limitation" note in the audit for why they can't be fully server-verified
  in this architecture.
- `app/api/create-order/route.ts` charges the server-computed amount via Razorpay, never the
  client's. `app/(store)/checkout/page.tsx` sends cart contents, not a price.
- `lib/security/order-ledger.ts` — an in-process record of what each Razorpay order was actually
  priced at. `app/api/verify-payment/route.ts` checks a payment against it after the signature
  passes, and rejects a second "verify" call for the same order (`PAYMENT_REPLAY_REJECTED`,
  `409 Conflict`) — closing the replay/duplicate-callback gap.
- **What this does not cover:** the `Order` record the admin panel displays is still
  constructed client-side and written to `localStorage` independent of the server. See
  `SECURITY_AUDIT.md` §4 — this needs a real backend to close, not more hardening.

## 5. Security headers / CSP

`next.config.ts`, applied to every route. Unchanged in substance from the earlier hardening
pass this project already had; `va.vercel-scripts.com` was added to `script-src` for Speed
Insights. CSP uses `'unsafe-inline'` for scripts/styles because Next injects inline bootstrap
scripts and this app doesn't thread a per-request nonce through yet — a documented tradeoff,
not an oversight. `'unsafe-eval'` is scoped to development only (React's dev-mode debugging
needs it; production never does).

Also set: HSTS, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`,
`Cross-Origin-Opener-Policy: same-origin-allow-popups` (loose enough for the Google/Razorpay
popups to still talk back to the tab), `Cross-Origin-Resource-Policy: same-origin`, and a
`Permissions-Policy` disabling camera/mic/geolocation/usb.

## 6. Password hashing

`lib/security/password.ts` — scrypt (Node's built-in `crypto.scryptSync`), not SHA-256, for the
admin password — the one password in this app that's actually checked server-side. Stored as
`scrypt:<hex>` in `ADMIN_PASSWORD_HASH`; `verifyPassword()` also accepts a legacy bare-hex
SHA-256 value so an already-deployed `.env` isn't instantly broken, but that path is a migration
aid, not a second permanent format — regenerate with the command in `ADMIN.md` after any
password change. Customer account passwords (`lib/account/auth.tsx`) stay SHA-256, deliberately:
that hash is computed in the browser for an account that only ever lives in that browser's own
`localStorage`, so a stronger algorithm wouldn't defend against anything real — see
`SECURITY_AUDIT.md` §6.

## 7. Open redirect protection

`lib/safe-redirect.ts` — `sanitizeNextPath()` validates the `?next=` parameter login and signup
both accept (so the flow can return a shopper to where they started). Only a same-document
relative path is accepted; an absolute URL, a protocol-relative `//host` URL, or anything else
falls back to a safe default. Used in `app/(store)/account/login/page.tsx` and
`app/(store)/account/signup/page.tsx` — if a third page ever adds its own `?next=`-style
parameter, route it through this same helper rather than reading `searchParams` directly.

## 8. XSS

No `dangerouslySetInnerHTML` anywhere in the codebase (checked). Every user-controlled string —
reviews, names, addresses, search queries, coupon codes — is rendered as a React text child,
which escapes by default. The CSP above is defense-in-depth on top of that, not the primary
defense.

## 9. Input validation

Every Route Handler validates its own body (`typeof` checks, bounded ranges, catalogue
look-ups) and returns a generic `400` with a safe message on anything malformed — no stack
traces, no internal error details, ever returned to a caller. `lib/pricing.ts` is the strictest
validator (rejects unknown products, bad sizes/colors, quantity bounds, line-count bounds).

## 10. Security event log

`lib/security/events.ts` — structured JSON written to console (which is where Vercel and most
Node hosts collect logs from; there's no log database to write to instead). Event types:
`LOGIN_FAILED`, `LOGIN_SUCCESS`, `RATE_LIMIT_TRIGGERED`, `ACCOUNT_LOCKED`,
`PAYMENT_VERIFICATION_FAILED`, `PAYMENT_VERIFIED`, `PAYMENT_REPLAY_REJECTED`,
`ORDER_PRICE_REJECTED`, `CSRF_BLOCKED`, `INVALID_INPUT`, `SUSPICIOUS_REQUEST`. Never logs a
password, OTP, token, or payment secret — only the fields listed in each event's `meta`, which
are all non-sensitive by construction (email for login events, order ID for payment events,
etc.).

**To wire this to a real sink later:** change the body of `logSecurityEvent()` — every call
site stays the same.

## 11. Admin security

Covered above (firewall gate, rate limit, lockout). No multi-role RBAC — see
`SECURITY_AUDIT.md` §2 for why that's not implemented (there is exactly one admin account).
Admin actions beyond login/logout (product edits, order status changes, etc.) are client-side
`localStorage` writes with no server endpoint at all, so there's nothing for CSRF or an audit
log to attach to there — flagged, not silently ignored.

## 12. Environment variables reference

| Variable | Required | Notes |
|---|---|---|
| `ADMIN_EMAIL` | Yes | No `NEXT_PUBLIC_` prefix — server-only |
| `ADMIN_NAME` | Yes | |
| `ADMIN_PASSWORD_SALT` | Yes | |
| `ADMIN_PASSWORD_HASH` | Yes | `scrypt:` + a scrypt digest of the password (§6) |
| `ADMIN_SESSION_SECRET` | Yes | Signs the session cookie; rotate to invalidate all sessions |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | For Google sign-in | Public by design (OAuth client IDs are) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Yes | Public by design |
| `RAZORPAY_KEY_SECRET` | Yes | Server-only, no `NEXT_PUBLIC_` prefix |
| `MONGODB_URI` | Yes | Atlas connection string, server-only. Rotate in Atlas if leaked |
| `MONGODB_DB_NAME` | No | Defaults to `mitrends` |
| `CUSTOMER_SESSION_SECRET` | Yes | Signs customer session cookies; rotate to sign everyone out |

## 13. Incident response (what little there is to respond with)

- **Suspected admin credential compromise:** rotate `ADMIN_PASSWORD_SALT`/`HASH` (command in
  `.env.local`'s own comment) *and* `ADMIN_SESSION_SECRET` (invalidates every existing session
  immediately, including the attacker's).
- **Suspected Razorpay key compromise:** rotate in the Razorpay dashboard, update
  `RAZORPAY_KEY_SECRET`/`NEXT_PUBLIC_RAZORPAY_KEY_ID`, redeploy.
- **Suspected database credential compromise:** rotate the database user's password in Atlas,
  update `MONGODB_URI` locally and in Vercel, redeploy. Check Atlas's access logs for queries
  you don't recognise — the `customers` and `orders` collections hold customer PII.
- **Suspected customer session theft:** rotate `CUSTOMER_SESSION_SECRET` — every outstanding
  customer cookie stops verifying immediately (everyone has to sign in again).
- **Reviewing what happened:** search the deployment's console logs for `[security]` lines —
  each is a JSON object with a `requestId` you can grep across the whole incident.

## 14. Running the security tests

There's no automated suite (see `SECURITY_AUDIT.md` §2 for why). `SECURITY_TEST_REPORT.md`
documents the exact `curl` commands used to verify each control against the local dev server —
rerun them the same way after any change to `proxy.ts`, `lib/pricing.ts`, or anything under
`lib/security/`.

## 15. Updating security configuration

- Rate limits / lockout thresholds: `lib/security/config.ts` — one file, no hunting through
  route handlers.
- CSP / security headers: `next.config.ts`.
- Pricing rules a request must satisfy: `lib/pricing.ts` (bounds like `MAX_SHIPPING`,
  `MAX_QUANTITY_PER_LINE` are constants at the top of the file).
