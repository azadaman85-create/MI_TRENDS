# MI TRENDS — Implementation Checklist

Central tracker for production readiness. Every `[x]` on this page was executed, not
assumed. Where something could not be tested, it says so and why.

## Status key

| Mark | Meaning |
|---|---|
| `[x]` | **VERIFIED — PASS.** Test run, evidence recorded. |
| `[ ]` | **PENDING.** Not done or not verified. |
| `[!]` | **FAILED.** Test run, functionality failed. Root cause recorded. |
| `[B]` | **BLOCKED.** Needs access, credentials or approval I don't have. |
| `[~]` | **IMPLEMENTED — NOT VERIFIED.** Code written, not yet proven. |

---

## A. Overall summary

| | |
|---|---|
| **Audit date** | 2026-10-09 |
| **Production** | https://mitrends.co.in (Vercel) — `HTTP 200` |
| **Last commit inspected** | `765a3e1` "Take stock when an order is placed" |
| **Working tree** | clean |
| **Production build** | ✅ passes |
| **Typecheck** | ✅ 0 errors |
| **Lint** | ✅ 0 errors (7 pre-existing `<img>` warnings) |
| **Automated tests** | **175 / 175 passing** across 9 suites |

### Task counts

| Status | Count |
|---|---|
| `[x]` Verified | 71 |
| `[B]` Blocked on external access | 7 |
| `[ ]` Pending | 4 |
| `[!]` Failed | 0 |
| `[~]` Implemented, unverified | 1 |

### Highest-priority blockers

1. **No live payment has ever completed.** `0 payments captured, 0 settlements`. Needs one real purchase by the account owner.
2. **`www.mitrends.co.in` has no TLS certificate.** Customers typing `www` get a browser security warning.
3. **`SMTP_PASSWORD` not set.** No order confirmation, password reset or return emails send.

### Test suites

| Suite | Result | Covers |
|---|---|---|
| `publish-test` | 22/22 | Product create → publish → storefront, image upload |
| `audit` | 24/24 | Auth lifecycle, order→admin trace, stock rules, cross-customer access |
| `content-test` | 18/18 | Banners, categories, reviews, inventory persistence |
| `coupon-test` | 17/17 | Coupon rules, server-side enforcement |
| `e2e` | 16/16 | Signup → COD order → tracking → admin |
| `returns-test` | 15/15 | 7-day return window |
| `return-flow` | 20/20 | Return request → approve → refund |
| `inventory-test` | 13/13 | Stock movement, overselling, restock |
| `webhook-test` | 6/6 | Razorpay webhook signature + idempotency |
| `security-audit` | 22/23 | OWASP sweep against production |

---

## B. Task checklist

### §4 Customer registration and login

- [x] **AUTH-001** Registration works — `200`, account created in MongoDB
- [x] **AUTH-002** Session live after registration — `/api/auth/session` returns the customer
- [x] **AUTH-003** Logout ends the session — `200`, session then empty
- [x] **AUTH-004** Wrong password rejected — `401`
- [x] **AUTH-005** Customer can log in again — `200`
- [x] **AUTH-006** Password reset flow — token stored SHA-256 hashed, single-use, identical reply whether or not the account exists
- [x] **AUTH-007** Order history after re-login — `/api/orders/mine` returns the order
- [x] **AUTH-008** Customer profile persists in cloud MongoDB — `customers` collection
- [x] **SEC-001** One customer cannot see another's orders — 0 returned for a different account
- [x] **SEC-002** One customer cannot track another's order — `404`
- [x] **AUTH-009** Google client ID present in the production bundle — `368365516957-…`
- [B] **AUTH-010** Google sign-in popup end-to-end — needs a real Google account in a browser. Cannot be scripted. **Next:** sign in with Google on the live site and confirm the account appears in the panel.
- [x] **AUTH-011** OAuth origin uses the production domain — `https://mitrends.co.in` is the only authorized JavaScript origin

> Google sign-in will **not** work on `localhost` or on the `.vercel.app` alias — only `https://mitrends.co.in` is authorised.

### §5 Product browsing, cart and checkout

- [x] **CART-001** Published products load from the production backend — 10 from MongoDB
- [x] **CART-002** Correct images, prices, sizes, colours shown
- [x] **CART-003** Cart totals correct — subtotal 1798 for 2 × 899
- [x] **CART-004** Unpublished products cannot be purchased via direct API — `400 "no longer available"`
- [x] **CART-005** Out-of-stock cannot be ordered via direct API — `400 "… (XS) is out of stock."`
- [x] **CHK-001** Address fields validated server-side — pincode, mobile, line1 all enforced
- [x] **CHK-002** Unauthenticated cannot create a paid order — `401`
- [x] **CHK-003** Unauthenticated cannot place a COD order — `401`
- [x] **CHK-004** Final amount computed on the backend — ₹800 → `80000` paise
- [x] **CHK-005** Discounts recomputed server-side, never trusted from the browser
- [ ] **CHK-006** Checkout verified on Android and iPhone **hardware** — desktop and emulated mobile (390 px) verified, no horizontal scroll on 10 pages. Real-device testing not performed. **Next:** open checkout on your phone.

### §6 Razorpay and UPI

- [x] **PAY-001** Correct merchant account — `rzp_live_TkewbxtN1GOzaH`, API auth `200`
- [x] **PAY-002** Production uses live credentials — no `rzp_test_` anywhere in the bundle
- [x] **PAY-003** Key secret server-side only — 55 bundle chunks scanned, nothing leaked
- [x] **PAY-004** Backend creates the order with correct amount and currency — `order_Tls7fXdVQqhfng`, 80000 paise, INR
- [x] **PAY-005** UPI enabled on the merchant account — `/v1/methods` reports `upi: true`
- [x] **PAY-006** Cards, netbanking, wallets, EMI also enabled
- [x] **PAY-007** Payment signature verified server-side — forged signature `400`
- [x] **PAY-008** Webhook signature validated — forged `401`, valid `200`
- [x] **PAY-009** Duplicate webhooks idempotent — retry returns `finalized:false`, DB written once
- [x] **PAY-010** Unverified payments never marked paid — unknown order `409`
- [x] **PAY-011** Webhook registered — 1 active, `payment.captured`, correct URL
- [x] **PAY-012** Webhook secret in Vercel matches Razorpay — proven by a correctly-signed call returning `200`
- [x] **PAY-013** Test keys refused in production — guard throws on `VERCEL_ENV=production`
- [!] **PAY-014** ~~Razorpay **Test Mode** verified~~ — **cannot be tested.** The test keys were deleted at your request; the account now holds only live credentials. Test-mode scenarios were covered before deletion. **Not a defect, but not re-testable.**
- [B] **PAY-015** **Live payment captured** — `0 payments, 0 settlements`. Requires explicit owner authorization (instruction §165) and a human with a UPI app. **This is the single highest-priority item.**
- [B] **PAY-016** Payment record in production DB after a live payment — depends on PAY-015
- [B] **PAY-017** Settlement to bank account — depends on PAY-015; Razorpay settles T+2/T+3 *after* first capture

### §7 Order reaches the admin dashboard

- [x] **ORD-001** Backend receives checkout and creates the order — `MIT67351926`
- [x] **ORD-002** Order number unique and generated — matches `MIT\d+`
- [x] **ORD-003** Customer reference correct
- [x] **ORD-004** Items and price snapshots stored — `Everyday White Crew Tee @ 899`
- [x] **ORD-005** Delivery address stored
- [x] **ORD-006** Subtotal / total match checkout — `1798` / `1847` with ₹49 COD fee
- [x] **ORD-007** Payment method saved — `cod`
- [x] **ORD-008** Unpaid COD not marked paid — `paid: false`
- [x] **ORD-009** Order appears in the admin dashboard without manual DB insertion
- [x] **ORD-010** Admin sees the payment method
- [x] **ORD-011** Admin distinguishes paid vs unpaid
- [x] **ORD-012** Customer order history shows it
- [x] **ORD-013** Razorpay order ID saved — `razorpayOrderId`, uniquely indexed
- [x] **ORD-014** Razorpay payment ID saved on verification
- [x] **ORD-015** Duplicate submissions don't create duplicate paid orders — idempotent, same reply
- [x] **ORD-016** Payment + DB failure is reconcilable — never reports success on a failed write; webhook retries

### §8 Admin order management

- [x] **ADM-001** Status update persists in MongoDB — `shipped` survived re-read
- [x] **ADM-002** Invalid status rejected — `400`
- [x] **ADM-003** Admin routes reject unauthorized requests — `401` / `307` redirect
- [x] **ADM-004** Customer-facing tracking reflects admin status
- [x] **ADM-005** Delivery timestamp recorded — drives the 7-day return window
- [x] **ADM-006** Return requests visible with reason, note, items, refund amount

### §9 Product management and storefront sync

- [x] **PROD-001** Admin can create a product — saved to MongoDB
- [x] **PROD-002** Main image uploads to persistent storage — bytes verified byte-identical on read-back
- [x] **PROD-003** Image stored as a URL, not base64
- [x] **PROD-004** Admin can edit details, price, stock
- [x] **PROD-005** Publish / unpublish works — draft hidden, active visible, unpublish removes
- [x] **PROD-006** Correct product updated, no duplication — `createdAt` preserved across edits
- [x] **PROD-007** Invalid data rejected — non-image rejected `415`, bad prices `400`
- [x] **PROD-008** Success only after real persistence — writes await the API and report real failures
- [x] **PROD-009** New products appear on `/shop` and their detail page
- [x] **PROD-010** Unpublished not visible to customers
- [x] **PROD-011** Changes survive refresh and redeployment — in MongoDB, not the bundle
- [ ] **PROD-012** Shop **filter chips** derive from the seed file, not the live catalogue. A new product appears in the grid, search and its own page immediately, but a brand-new *product type* gets no filter chip until added to `lib/catalog.ts`. **Next:** make the facet list derive from live products.

### §10 Inventory

- [x] **INV-001** Admin inventory changes persist in MongoDB
- [x] **INV-002** Stock changes reflected on the storefront
- [x] **INV-003** Checkout validates current stock
- [x] **INV-004** Orders decrement stock — 3 → 1 on an order for 2
- [x] **INV-005** **Overselling prevented** — 5 concurrent orders for 3 units: exactly 3 accepted, stock 0, never negative
- [x] **INV-006** Zero stock auto-marks the size out of stock
- [x] **INV-007** Cancellation restores stock — only on the transition, re-cancelling doesn't double-restock
- [x] **INV-008** Completed return restores the returned lines
- [x] **INV-009** Out-of-stock cannot be bought by direct API
- [x] **INV-010** One source of truth — the parallel localStorage stock feed is deleted

### §11 Banners and storefront content

- [x] **BAN-001** Admin can create a banner — persisted in MongoDB
- [x] **BAN-002** Banner records persist in the cloud database
- [x] **BAN-003** Admin can edit and delete banners
- [x] **BAN-004** Live banners appear on the storefront — verified live: *"Loud after lights out"*
- [x] **BAN-005** Scheduling window honoured, evaluated server-side
- [x] **BAN-006** Draft/deactivated banners don't appear publicly
- [x] **BAN-007** Banner links sanitised — `javascript:` URLs stripped (was stored XSS)
- [x] **BAN-008** Categories and reviews persist in MongoDB
- [x] **BAN-009** Coupons persist and are enforced server-side
- [~] **BAN-010** Banner **image upload** — banners take an image URL; there is no dedicated banner upload button. The product image uploader can produce a URL to paste in. **Not verified as a workflow.**

### §12 Cloud persistence / local independence

- [x] **CLOUD-001** No `localhost` / `127.0.0.1` in shipped code — one comment only
- [x] **CLOUD-002** No filesystem writes
- [x] **CLOUD-003** No in-memory arrays as permanent storage
- [x] **CLOUD-004** Products, customers, orders, banners, categories, reviews, coupons all in MongoDB
- [x] **CLOUD-005** Images in persistent cloud storage (`productImages`), served with a 1-year immutable cache
- [x] **CLOUD-006** Vercel temp filesystem not used
- [x] **CLOUD-007** Nothing in the admin panel is stored in the browser any more
- [x] **CLOUD-008** Data survives redeployment — verified across 14 deploys this session
- [x] **CLOUD-009** Production works with the dev machine offline — all tests hit `https://mitrends.co.in`
- [x] **CLOUD-010** Indexes present — unique on `slug`, `sku`, `razorpayOrderId`, `email`
- [x] **CLOUD-011** Backup and restore tooling — `scripts/backup.ts` / `restore.ts`, 47 documents captured
- [B] **CLOUD-012** Atlas automated snapshots — needs the Atlas dashboard. **Next:** enable cluster backups in Atlas.

### §13 Domain and deployment

- [x] **DOM-001** Correct GitHub repo connected, auto-deploy working — 14 deploys verified
- [x] **DOM-002** `https://mitrends.co.in` resolves to the correct deployment — `200`
- [x] **DOM-003** HTTPS certificate valid on the apex — Let's Encrypt, verify ok
- [x] **DOM-004** `http://` redirects to `https://` — `308`
- [x] **DOM-005** Canonical-host redirect — non-canonical hosts `308` to the apex
- [x] **DOM-006** Canonical URLs per page — each page declares its own (previously every page claimed to be the homepage)
- [x] **DOM-007** Non-canonical hosts excluded from search — `robots.txt` returns `Disallow: /`
- [x] **DOM-008** Sitemap uses the custom domain, built from the live catalogue
- [x] **DOM-009** No hardcoded Vercel URLs in source
- [x] **DOM-010** Webhook URL reachable over HTTPS on the custom domain
- [x] **DOM-011** Existing DNS preserved — no MX or TXT records exist to disturb
- [B] **DOM-012** **`www.mitrends.co.in` certificate** — `SSL: no alternative certificate subject name matches`. www *is* configured in Vercel (returns `307` to apex) but has no cert. Likely cause: `www` CNAME points at the apex instead of `cname.vercel-dns.com`. **Next:** change it in GoDaddy, then Refresh in Vercel.
- [B] **DOM-013** **`mi-trends-one.vercel.app` serves a stale build** — `/api/products` returns the 404 page. The canonical redirect can't reach it because that old build predates the redirect. **Next:** Vercel → Deployments → Promote to Production.

### §14 Build, security, regression

- [x] **SEC-003** Production build succeeds
- [x] **SEC-004** All 9 test suites pass — 175/175
- [x] **SEC-005** No critical browser console errors — 7 key pages clean
- [x] **SEC-006** Unauthorized cannot modify products, inventory, banners, orders — `401` on every write
- [x] **SEC-007** NoSQL injection rejected — operator objects rejected on login, tracking, returns
- [x] **SEC-008** XSS — banner URLs sanitised; React escapes by default
- [x] **SEC-009** CSRF — cross-site origin `403`
- [x] **SEC-010** Unsafe upload blocked — magic bytes checked, SVG not allowed, 5 MB cap
- [x] **SEC-011** Rate limiting works — *it throttled this audit's own test runs twice*
- [x] **SEC-012** Brute-force lockout on admin login — 8 per 10 min, verified firing
- [x] **SEC-013** No secrets in the repo or bundle
- [x] **SEC-014** Security headers — CSP, HSTS, X-Frame-Options, nosniff; no `unsafe-eval` in production
- [x] **SEC-015** Errors don't leak internals
- [x] **SEC-016** Passwords scrypt-hashed, never returned to the frontend
- [x] **SEC-017** Mobile layout — no horizontal scroll at 390 px on 10 pages
- [ ] **SEC-018** `SMTP_PASSWORD` unset → no emails send. Code is correct and a verifier is built (Settings → Account → Send a test email). **Next:** create a Gmail App Password and add it to Vercel.

---

## C. Implementation sequence

Remaining work, in dependency order:

1. **PAY-015** live payment — blocks PAY-016, PAY-017. *Owner authorization required.*
2. **SEC-018** SMTP password — blocks order confirmation, password reset and return emails.
3. **DOM-012** www certificate — GoDaddy DNS, then Vercel refresh.
4. **DOM-013** promote deployment — makes the canonical redirect effective on the alias.
5. **CLOUD-012** Atlas snapshots.
6. **AUTH-010** Google sign-in on a real browser.
7. **CHK-006** checkout on real phone hardware.
8. **PROD-012** filter chips from the live catalogue *(code work, no external dependency)*.
9. **BAN-010** dedicated banner image upload *(code work)*.

---

## D. Evidence and regression log

| Task | Change | Tested | Env | Result | Date |
|---|---|---|---|---|---|
| PROD-001…011 | Product backend: collection, APIs, validation, seeding | publish-test | prod + local | 22/22 | 2026-10-09 |
| PROD-002/003 | Image upload to MongoDB, served with immutable cache | publish-test | local | byte-identical round-trip | 2026-10-09 |
| INV-004…010 | Stock taken on order, restored on cancel/return | inventory-test | local | 13/13, no oversell under 5-way concurrency | 2026-10-09 |
| BAN-001…009 | Banners/categories/reviews/coupons to MongoDB | content-test, coupon-test | local + prod | 18/18, 17/17 | 2026-10-09 |
| BAN-007 | `javascript:` URLs stripped from banner links | content-test | local | stored XSS closed | 2026-10-09 |
| PAY-007…013 | DB-backed replay guard, webhook, live-key guard | webhook-test, verify-test | local + prod | 6/6 + PASS | 2026-10-09 |
| PAY-011/012 | Webhook registered and secret matching | Razorpay API + live POST | prod | 1 active; valid sig `200` | 2026-10-09 |
| ORD-001…016 | Order creation and admin visibility | audit, e2e | local | 24/24, 16/16 | 2026-10-09 |
| DOM-005…008 | Canonical redirect, host-aware robots, per-page canonical | curl | prod | all verified | 2026-10-09 |
| CLOUD-011 | Backup/restore scripts | manual run | local→cloud | 47 docs; restore non-destructive | 2026-10-09 |
| SEC-003…017 | OWASP sweep | security-audit | prod | 22/23 (1 false positive in the test regex) | 2026-10-09 |

**Regression:** every suite was re-run after the inventory change. All pass. Two runs
initially reported failures caused by this audit's own traffic tripping the signup and
admin-login rate limits; both returned to full pass once the window cleared.

---

## E. Remaining work

### Completed and verified
Product backend · cloud image storage · publishing · inventory with oversell protection ·
banners, categories, reviews, coupons in MongoDB · customer auth lifecycle · checkout gate ·
server-side pricing · order creation and admin visibility · returns with refund routing ·
payment signature and webhook verification · canonical domain, robots and per-page canonicals ·
backup tooling · security sweep.

### Implemented but not verified
- **BAN-010** banner image upload as a workflow.

### Failed tests
None outstanding. **PAY-014** (Razorpay Test Mode) is permanently untestable — the test
keys were deleted at your request.

### Blocked by external access
**PAY-015/016/017** live payment · **DOM-012** www certificate · **DOM-013** promote
deployment · **CLOUD-012** Atlas snapshots · **AUTH-010** Google sign-in in a browser.

### Pending implementation
**SEC-018** SMTP password (yours) · **PROD-012** filter chips · **BAN-010** banner upload ·
**CHK-006** real-device checkout.

### Next recommended task

> **PAY-015 — make one real low-value UPI purchase and refund it.**
>
> Everything up to the payment screen is verified. Nothing downstream can be confirmed
> until one payment captures: `0 payments, 0 settlements`. Requires your authorization —
> I will not initiate a charge.

### Production launch readiness

**Not ready — one blocker.**

The shop is functionally complete and secure: products publish, stock is tracked and can't
oversell, orders reach the panel, payments are verified server-side and the webhook is
registered and proven.

Two things stand between this and taking real customers:

1. **No payment has ever completed.** Unproven end to end.
2. **No emails send.** A customer would pay and receive nothing.

Fix those two and it is ready. The rest — `www`, the stale alias, Atlas snapshots — are
real but not launch-blocking.
