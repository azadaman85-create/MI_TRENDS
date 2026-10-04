# MI TRENDS — Security Audit

Date: 2026-10-04
Scope: application-level security only (see "Infrastructure-level gaps" at the end for what
this audit explicitly does not cover).

## 1. Architecture, as it actually exists

This is **not** a typical e-commerce stack with a database and a session store. Reading the
codebase before touching anything turned up:

| Layer | Reality |
|---|---|
| Frontend framework | Next.js 16 (App Router, Turbopack), React 19 |
| Backend framework | Next.js Route Handlers — exactly 5 of them exist (see below). No Express/Fastify/separate API server. |
| Database | **None.** No Postgres/MySQL/Mongo/Supabase, no ORM, no connection string anywhere. |
| Authentication (customer) | Client-side only. `lib/account/auth.tsx` stores accounts and sessions in the browser's `localStorage`, under keys `mitrends-customers-v1` / `mitrends-customer-session-v1`. Passwords are salted SHA-256 (computed in-browser via Web Crypto), never sent anywhere. |
| Authentication (admin) | **Fixed in an earlier session, verified again here.** `app/api/admin/login/route.ts` checks credentials server-side against `ADMIN_EMAIL`/`ADMIN_PASSWORD_SALT`/`ADMIN_PASSWORD_HASH` (server-only env vars), issues a signed HttpOnly session cookie, and `proxy.ts` gates `/admin/*` regardless of client JS. This *was* a critical, client-side-only bypass before that fix — see `ADMIN.md`'s note on it. |
| API architecture | 5 Route Handlers total: `POST /api/create-order`, `POST /api/verify-payment`, `POST /api/admin/login`, `POST /api/admin/logout`, `GET /api/admin/session`. Everything else — products, orders, customers, inventory, coupons, banners, reviews — is read/written straight to the browser's `localStorage` by client components. There is no `/api/orders`, `/api/products`, etc. |
| Admin authorization | Single super-admin account. No roles, no permission system, no user management screen to create additional admins. |
| Payment gateway | Razorpay Standard Checkout, test mode. Order creation and signature verification are both server-side (`razorpay` npm SDK + HMAC-SHA256 verification using `crypto.timingSafeEqual`). |
| Order workflow | A "placed" order is a plain JSON object the checkout page constructs **entirely client-side** and writes into `localStorage` (`lib/order-inbox.ts`, key `mitrends-order-inbox-v1`). The admin panel reads that key on load and merges it into its own `localStorage` state (`lib/admin/store.tsx`, key `mitrends-admin-state-v4`). **No server ever sees, validates, or stores the order record itself** — only the Razorpay payment inside it is server-verified. |
| Session/cookie implementation | Only the admin session uses a real cookie (HttpOnly, `SameSite=Lax`, signed HMAC, 12h TTL — `lib/security/session.ts`). Customer "sessions" are a JSON blob in `localStorage`, readable and writable by any script running on the page. |
| Existing security middleware | `proxy.ts` (this Next.js version's name for `middleware.ts`) — previously admin-only, extended in this pass into a small firewall (see `SECURITY.md`). |
| Environment variables | `.env.local` (gitignored, confirmed not tracked by git). Holds the admin credentials, Google OAuth client ID, and Razorpay keys. `RAZORPAY_KEY_SECRET` correctly has no `NEXT_PUBLIC_` prefix. |
| Deployment architecture | Vercel (confirmed via `@vercel/speed-insights` and prior deploy work in this project). `output: "standalone"` in `next.config.ts`. Single Node process — no mention of multiple regions/instances. |

## 2. What this means for the rest of the spec

Several sections of the brief assume infrastructure that doesn't exist here. Rather than
inventing it (which the brief itself warns against — "do not rebuild," "do not create
duplicate security systems"), each is called out explicitly:

- **SQL/NoSQL injection, parameterized queries, least-privilege DB credentials, foreign keys**
  — not applicable. There is no database to inject into.
- **OTP, password reset, email/phone change flows** — none of these exist in the app today
  (confirmed by reading `lib/account/auth.tsx` in full — it has `signUp`, `signIn`,
  `signInWithGoogle`, `signOut` and nothing else). Nothing to secure that isn't already covered
  by "don't invent new functionality."
- **JWT** — not used. The admin session is a plain signed-and-expiring token (HMAC, not JWT),
  which is simpler and was already the right tool for one role with no claims beyond identity.
- **RBAC with multiple roles (SUPER_ADMIN/ORDER_MANAGER/etc.)** — there is exactly one admin
  account by design. Building a multi-role permission system for a single hard-coded user would
  be inventing functionality nobody asked for and that nothing in the admin UI exercises.
  Documented as a **recommendation for if/when multiple admin users are introduced**, not
  implemented now.
- **File upload hardening (MIME/signature validation, non-executable storage, antivirus, etc.)**
  — `components/admin/ProductImageUploader.tsx` does read files with a file input, but it never
  leaves the browser: files are base64-encoded into `data:` URLs and stored in the admin's own
  `localStorage` product record. There is no server-side upload endpoint, no file written to a
  filesystem or bucket, and no code path where this could be served to another user or executed.
  The realistic residual risk is low (an admin could theoretically push a non-image data URI into
  their own `<img src>` via devtools, which browsers refuse to execute) — informational, not
  fixed, since there's no server component to harden.
- **Automated CI test suite** — no test framework (Jest/Vitest/Playwright) exists in
  `package.json`. Adding one is a legitimate infrastructure decision but a separate one from
  this security pass; `SECURITY_TEST_REPORT.md` documents real, manually-run verification
  against the live dev server instead of fabricating a test suite that would need its own
  review. This is noted as a recommendation, not a gap papered over.

## 3. The one critical finding: price/amount integrity (now fixed)

Before this pass, `app/api/create-order/route.ts` took a plain `amount` number from the
checkout page's request body and handed it straight to Razorpay. **Anyone could intercept that
fetch call in devtools and lower the amount before paying** — Razorpay would create a
₹1 order while the storefront UI still displayed the real total. This is exactly the "never
trust prices/totals from the frontend" risk the brief calls out, and it was real and exploitable.

Fixed by recomputing the order amount server-side from the catalogue (`lib/pricing.ts` against
`lib/catalog.ts`) and the coupon rules (`lib/coupons.ts`), so the amount actually charged can
never be less than what the cart really costs. Full details and test evidence in
`SECURITY_TEST_REPORT.md`.

**One honest limitation of the fix:** shipping cost, the COD handling fee, and the COD advance
percentage are configured by the admin and stored in — again — the admin's own browser
`localStorage` (`lib/store-settings.ts`), with no server-side copy at all. The Route Handler
has no way to know the real values, so it accepts them from the client but **clamps** them to a
bounded range (documented in `lib/pricing.ts`) rather than trusting them outright. This bounds
the damage to a small amount rather than the unbounded "pay ₹1 for anything" problem that
existed before. The real fix — store settings server-side — requires the backend this project
doesn't have.

## 4. The one structural risk nothing in this pass can close

**The order record itself is not bound to the payment that supposedly paid for it.**
`pushOrderToAdmin()` (`lib/order-inbox.ts`) writes whatever `Order` object the checkout page
constructs into `localStorage`, and the admin panel trusts it. Today, that write only happens
after a real Razorpay payment succeeds — but nothing stops a user from calling
`pushOrderToAdmin()` directly from the browser console with a fabricated order (wrong total,
items never paid for, a `paid: true` flag) completely independent of any real payment. The
server-side payment verification added in this pass confirms a *real payment happened*; it does
not and cannot confirm *that specific order record matches it*, because the order record has no
server-side existence at all.

Closing this fully requires a real backend: an orders table, a server endpoint that creates the
order record itself (not the browser) once payment is verified, and order IDs the client can
never invent. That's a backend/database project, not a hardening pass on top of the existing
one — flagged here per the brief's own instruction not to claim "100% secure" and to name what
needs infrastructure the project doesn't have.

## 5. Secrets

`git grep` across all tracked files for live-key patterns (`sk_live`, `rzp_live`, Google API key
shapes, PEM-format private keys) returned nothing. `.env.local` is gitignored and confirmed not
tracked (`git ls-files | grep env` returns only the blank `.env.example`). `.gitignore` was
extended to also exclude `*.pem`, `*.key`, `credentials*`, `secrets*` per the brief, even though
none currently exist in the repo.

No credentials were found in git history either (this repo's history is short and was reviewed
commit-by-commit as part of this project's prior sessions — no rotation is required).

## 6. Infrastructure-level gaps (out of scope for an application-level pass)

Per the brief's own closing instruction, these require infrastructure this project doesn't
provision, and no application-level code change substitutes for them:

- No CDN/WAF in front of the app (relying on whatever Vercel's platform provides by default).
- No dedicated DDoS protection beyond Vercel's platform-level mitigation.
- No managed secret store (secrets live in a single `.env.local` / Vercel's env var UI).
- Rate limiting and the brute-force lockout are **in-process memory** (see `SECURITY.md`) —
  correct for the single Node instance this app currently deploys as, but would need a shared
  store (Redis, etc.) the moment it runs on more than one instance.
