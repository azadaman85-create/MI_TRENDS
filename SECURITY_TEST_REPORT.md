# MI TRENDS — Security Test Report

Date: 2026-10-04. All tests run with `curl` against the local dev server
(`npm run dev`, `http://localhost:3000`), immediately after a clean restart unless noted. This
is **manual verification evidence, not an automated CI suite** — there's no test framework
(Jest/Vitest/Playwright) in this project; see `SECURITY_AUDIT.md` §2 for why adding one is
flagged as a recommendation rather than done as part of this pass. No destructive testing was
run against any external/production system — everything below is local.

## Results

| # | Test | Expected | Observed | Result |
|---|---|---|---|---|
| T1 | Security headers present on every response | CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, COOP, CORP, Permissions-Policy, `x-request-id` | All present (see raw output below) | **PASS** |
| T2 | Malformed JSON body to `/api/admin/login` | Generic `400`, no stack trace | `{"ok":false,"message":"Invalid request."}` — `400` | **PASS** |
| T3 | `/api/create-order` with a non-existent `productId` | Rejected, generic message | `{"error":"One of the items in your bag is no longer available."}` — `400` | **PASS** |
| T4 | `/api/create-order` with a real product but `amount: 1` in the body | Server ignores the client amount and charges the real catalogue price | Client sent `amount:1`; server created a Razorpay order for `89900` paise (₹899 — the real price of product 1001) | **PASS — the critical fix** |
| T5 | `/api/create-order` with `quantity: 999` | Rejected | `{"error":"Invalid quantity."}` — `400` | **PASS** |
| T6 | `/api/create-order` with an invalid size for the product | Rejected | `{"error":"Everyday White Crew Tee is not available in that size."}` — `400` | **PASS** |
| T7 | `/api/create-order` with `shipping: 999999, codFee: 999999` | Clamped to the bounded max, not trusted outright | Response `shipping:200, codFee:200` (the configured `MAX_SHIPPING`/`MAX_COD_FEE`), total `1299` not `999899+` | **PASS** |
| T8 | `POST /api/admin/logout` with `Origin: https://evil-attacker.example` | Rejected (CSRF defense) | `{"error":"Request rejected."}` — `403` | **PASS** |
| T9 | Same request with `Origin: http://localhost:3000` (matching `Host`) | Allowed | `{"ok":true}` — `200` | **PASS** |
| T10 | `/api/verify-payment` with a fabricated signature | Rejected | `{"success":false,"error":"Signature mismatch."}` — `400` | **PASS** |
| T11 | 6 consecutive failed admin logins from one IP | The progressive lockout (5 failures) engages, distinct from the flatter rate limit (8) | First 5 → `401`; 6th → `429` **"Too many failed attempts. Try again later."** (the lockout's own message) | **PASS** |
| T12 | Correct admin password, sent immediately after, while locked | Still blocked — a lock doesn't get bypassed by finally typing it right | `429`, same lockout message | **PASS (expected — see note)** |

### Raw output — T1 (security headers)

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://accounts.google.com https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.googleusercontent.com https://*.razorpay.com; font-src 'self' data:; connect-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://lumberjack.razorpay.com https://accounts.google.com https://www.googleapis.com; frame-src https://api.razorpay.com https://checkout.razorpay.com https://accounts.google.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Cross-Origin-Opener-Policy: same-origin-allow-popups
Cross-Origin-Resource-Policy: same-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), usb=(), payment=(self)
x-request-id: 739f3e9e-6194-4786-845f-372a4efd4638
```

### Raw output — T4 (the critical price-integrity fix)

Request body sent: `{"amount":1,"lines":[{"productId":1001,"size":"M","color":"Optic White","quantity":1}],"paymentMode":"upi","shipping":0,"codFee":0}`

Response: `{"order_id":"order_TjkPj83NhY5s0l","amount":89900,"currency":"INR","breakdown":{"subtotal":899,"discount":0,"shipping":0,"codFee":0,"total":899}}`

The client-supplied `amount: 1` (1 paise) was discarded entirely. The server priced the order
from the catalogue (`lib/catalog.ts` product 1001 = ₹899) and charged that.

### Raw output — T11/T12 (brute-force, after rebalancing the two thresholds — see note)

```
attempt 1 -> 401  {"ok":false,"message":"Those credentials do not match an admin account."}
attempt 2 -> 401  {"ok":false,"message":"Those credentials do not match an admin account."}
attempt 3 -> 401  {"ok":false,"message":"Those credentials do not match an admin account."}
attempt 4 -> 401  {"ok":false,"message":"Those credentials do not match an admin account."}
attempt 5 -> 401  {"ok":false,"message":"Those credentials do not match an admin account."}
attempt 6 -> 429  {"ok":false,"message":"Too many failed attempts. Try again later."}
(immediately after, correct password) -> 429  {"ok":false,"message":"Too many failed attempts. Try again later."}
```

## Notes on T11/T12 and the lockout mechanism

**This test was run twice.** The first run used the original config, where the flat rate limit
and the lockout's `failuresBeforeLock` were both 5 — the flat limiter fired first every time
(generic "Too many attempts" message) and the lockout's own 5th-failure trigger never got a
chance to run, since the limiter cut requests off one failure before the lockout's threshold.
That's a real tuning bug this test caught, and it was fixed on the spot: `lib/security/config.ts`
now sets the flat rate limit to 8 and leaves the lockout at 5, so the lockout is the mechanism
that actually engages for a sustained attack. The raw output above is from the **second run**,
after that fix — note the distinct `"Too many failed attempts. Try again later."` message
(from `lib/security/lockout.ts`), different from the rate limiter's own wording, confirming it's
the lockout and not the flat limit that fired at attempt 6.

**Why T12's correct password was also blocked:** this is intentional — a lock means a lock,
regardless of whether the next attempt happens to be correct. The brief itself names the
underlying tension ("use stricter limits for auth" vs. "do not permanently block legitimate
customers"); the resolution is that the lock is **temporary and bounded** (15 minutes on the
first lock cycle, escalating to 60 minutes on repeated cycles without a successful login), not
permanent.

**The 60-minute escalated cooldown (second lock cycle) was verified by code review of
`lib/security/lockout.ts`, not reproduced live** — doing so would require deliberately failing
through a full first lockout, waiting it out, and failing through a second cycle, which is a
15+ minute live test not run as part of this pass. `recordFailure()`'s logic (increment
`lockCycles`, pick `escalatedLockMs` once `lockCycles > escalateAfterCycles`) was read and is
straightforward enough to trust from inspection alone.

## Additional tests — OWASP pass (2026-10-04)

| # | Test | Expected | Observed | Result |
|---|---|---|---|---|
| T13 | Admin login with the real password, after switching the hash algorithm to scrypt | Still succeeds — the regenerated `.env.local` hash matches | `{"ok":true,"user":{"name":"Maidul Islam",...}}` — `200` | **PASS** |
| T14 | Admin login with a wrong password, under the new scrypt verification path | Still rejected | `{"ok":false,"message":"Those credentials do not match an admin account."}` — `401` | **PASS** |
| T15 | Customer login account-enumeration fix | Both "no such account" and "wrong password" paths in `lib/account/auth.tsx` return the identical message | Confirmed by reading the code — a single `mismatch` constant is returned from both branches | **PASS (code review — see note)** |
| T16 | `npm audit` before/after | Critical RCE and the high-severity `brace-expansion` ReDoS fixed; app still builds | `npm audit` dropped from 7 (6 high, 1 critical) to 5 high — all remaining are inside the dev-only ESLint tooling chain. `npx tsc --noEmit`, `npx eslint .`, and `npm run build` all passed clean afterward. | **PASS** |
| T17 | Full page regression after all of the above | Every route still returns `200` (or the expected `307`/`401`/`403`/`429`) | `/`, `/shop`, `/cart`, `/checkout`, `/wishlist`, `/account/login`, `/account/signup`, `/product/[slug]`, `/order-success`, `/admin/login` → `200`; `/admin` (no session) → `307` | **PASS** |

**T15 note:** this is a client-side code path (`lib/account/auth.tsx` runs in the browser against
`localStorage`, not a server endpoint), so there's no HTTP request to `curl` against — verifying
it means reading the function, which was done. The open-redirect fix (`lib/safe-redirect.ts`) is
the same situation: it's exercised inside a React component after `useSearchParams()`, not at an
HTTP layer `curl` can reach, so it was verified by code review and a type-check pass rather than
a live browser redirect test (no browser tool was available in this session — noted as a
limitation below, same as the rest of this report).

## Known limitations of this test pass

- Everything above is single-process, single-request-at-a-time manual testing. No load testing,
  no concurrency testing (e.g. two simultaneous `verify-payment` calls racing each other).
- The `rate-limit`/`lockout` stores are in-process memory and were exercised
  within one server lifetime — a restart (which happened between some tests, intentionally, to
  get clean state) resets them, which is documented as a known limitation elsewhere, not a bug
  being hidden here.
- No browser-based testing (no browser tool was available in this session) — everything was
  verified at the HTTP/API layer, not by clicking through the UI. The checkout page's payload
  shape was verified by reading `app/(store)/checkout/page.tsx` to confirm it sends the fields
  these tests exercise, not by a live browser checkout run.
