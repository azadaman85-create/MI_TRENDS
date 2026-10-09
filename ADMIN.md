# MI TRENDS — Admin panel

The admin panel lives at `/admin` and is built from the storefront's own design language, as
specified in *MI TRENDS Admin Panel Design Requirements* (sections 51–71).

## Getting in

| | |
|---|---|
| Login | http://localhost:3000/admin/login |
| Credentials | Configured per environment — see below |

The super admin identity comes from five env vars, set in `.env.local` (gitignored) and listed
without values in `.env.example`. None of these carry the `NEXT_PUBLIC_` prefix — they're read
only in `lib/admin/session.server.ts`, a server-only module, and never reach the browser:

| Variable | Holds |
|---|---|
| `ADMIN_EMAIL` | The sign-in address |
| `ADMIN_NAME` | Display name, shown in the topbar and used for the avatar initials |
| `ADMIN_PASSWORD_SALT` | Random per-install salt |
| `ADMIN_PASSWORD_HASH` | `scrypt:` + a scrypt digest of the password (see `lib/security/password.ts`) |
| `ADMIN_SESSION_SECRET` | Signs the session cookie — rotate it to invalidate every admin session |

Generate a fresh salt+hash pair after any password change:

```bash
node -e 'const c=require("crypto");const s=c.randomBytes(16).toString("hex");console.log("salt",s);console.log("hash","scrypt:"+c.scryptSync(process.argv[1],s,64).toString("hex"))' 'YOUR_PASSWORD'
```

(Hashing moved from a single SHA-256 round to scrypt — deliberately slow/memory-hard, which is
what actually resists offline guessing; plain SHA-256 doesn't. `verifyPassword()` still accepts
an old unprefixed SHA-256 hash so an already-configured `.env` doesn't break instantly, but
regenerate with the command above the next time the password changes.)

**This is a real security boundary.** Credentials are checked server-side in
`app/api/admin/login/route.ts`; the salt and hash never reach the browser. A successful login gets
a signed, HttpOnly, `SameSite=Lax` session cookie (`lib/admin/session.server.ts`), and `proxy.ts`
gates every `/admin/*` page server-side regardless of what the client does — the route guard in
`app/admin/(panel)/layout.tsx` is UX only (fast redirect, no flash of protected UI), not the real
check. Login is also rate-limited and protected by a progressive lockout (see `SECURITY.md`).

This *used* to be client-side-only (comparing the digest in the browser, trivially bypassable by
editing the bundle) — if you're reading an older copy of this doc or an old deployment, that
version is unsafe and should be redeployed with the server-side flow described above.

## Screens

| Route | What it does |
|---|---|
| `/admin` | Dashboard — 6 KPI cards, revenue area chart, order-status donut, recent orders, low stock, best sellers, payment mix |
| `/admin/products` | Product master — search, status tabs, category/collection filters, sorting, bulk publish/archive/delete, row actions |
| `/admin/products/new`, `/admin/products/[id]` | Product editor — information, images, pricing, variants & inventory, SEO, publishing rail, storefront preview |
| `/admin/categories` | Category tree with visibility toggles and a create/edit modal |
| `/admin/collections` | The eight drops with palette, product count and revenue |
| `/admin/inventory` | Per-size stock adjustment (staged, then **Save**), low/out-of-stock views, stock value |
| `/admin/orders`, `/admin/orders/[id]` | Order list with status tabs and bulk actions; detail with fulfilment timeline, items, payment, customer and address |
| `/admin/customers`, `/admin/customers/[id]` | Customer list by tier; profile with order history and lifetime value |
| `/admin/reviews` | Moderation queue — approve or reject, in bulk or per row |
| `/admin/coupons` | Codes with redemption progress, pause/resume, create/edit modal |
| `/admin/banners` | Hero/strip/campaign slots, drag to reorder, create/edit modal |
| `/admin/reports` | Revenue trend, revenue by collection, category mix, top states |
| `/admin/settings` | Store identity, shipping & payments, account, demo-data reset |

`⌘K` (or `Ctrl+K`) opens a command palette that jumps to any product, order or customer.

## Design system

`app/admin/admin.css` re-uses the storefront tokens from `app/globals.css` verbatim — the same
ink/paper/surface/line neutrals, the same `--red`, `--yellow` and `--green`, the 6px radius and the
`Arial Black` display face over Inter. What changes is density, not language:

| Storefront | Admin |
|---|---|
| 15px body, 48px buttons, 76px header | 14px body, 40px buttons, 68px topbar |
| `.button` uppercase 800/0.09em | `.a-btn`, same type, tighter padding |
| Footer ink `#171716` | Sidebar ink `#171716` |
| Product-card badges | `.a-badge` status badges |
| 180–200ms eases, one 620ms image ease | `lib/admin/motion.ts` presets on the same curve |

Motion is Framer Motion throughout: page transitions, sidebar expand/collapse, staggered card and
table-row entrances, dropdown/modal fade-scale, slide-in toasts, animated chart rendering, and a
shake on failed login. Dark mode was deliberately left out — the storefront is light-only, and the
brief says to follow the storefront when the two conflict.

## Data

Everything is generated deterministically from the storefront catalogue (`lib/admin/data.ts`): 72
products, 184 orders, 96 customers, 64 reviews, coupons and banners, seeded so server and client
renders always agree. Edits you make in the panel are saved to `localStorage` on that device
(`lib/admin/store.tsx`) so it behaves like a real back office; **Settings → Demo data → Reset**
restores the generated set.

### Stock reaching the storefront

Inventory edits are staged in the page rather than written on each keystroke, so a count can
be typed in full and reviewed first. **Save** then does two things: it commits the counts to
the panel's own store, and publishes the whole catalogue's stock to `mitrends-stock-v1` for
the storefront to read (`lib/stock-feed.ts`, the mirror of `lib/order-inbox.ts`).

The product page reads that key through `useStockFeed()` and prefers it over the catalogue's
static `outOfStock` list: a size at zero is disabled as sold out, and three or fewer shows an
"only N left" badge. A product the panel has never published keeps whatever the catalogue
said, so saving one product never marks the rest in stock. The hook listens for both the
same-tab event and cross-tab `storage`, so a shop tab left open updates on save.

## Products

Products live in MongoDB (`products` collection), not in `lib/catalog.ts`.

`lib/catalog.ts` is now only the **seed**: the first time the collection is read and
found empty, it is filled from that file. After that the file is never consulted for the
live catalogue. Deleting a product in the panel is permanent — seeding is guarded on the
collection being completely empty, so it can't resurrect anything.

```
Panel  ->  POST/PATCH /api/admin/products  ->  MongoDB `products`
                                                    |
Storefront layout  <-  getActiveProducts()  <-------+
```

**Publish** is `status: "active"`. There is no separate publish endpoint or flag, because
a second source of truth for "is this live" is a second thing to get out of sync. The
public API and the storefront both read `status: "active"` and nothing else.

Order pricing (`lib/pricing.ts`) resolves against the same live catalogue, so a product
published in the panel is immediately purchasable and an unpublished one immediately
isn't.

### Product images

Uploads go to `POST /api/admin/products/images` and are stored as bytes in the
`productImages` collection, served by `GET /api/images/<id>` with a one-year immutable
cache. Each image is therefore read out of the database once and served from the CDN
after that.

This replaced base64 data URLs held in one browser's `localStorage`, which meant the
photo did not exist for anyone else and silently broke the whole save once the ~5 MB
quota was reached.

**Limits:** 5 MB per file; JPG, PNG, WebP and AVIF only. The declared content type is
checked against the file's magic bytes before anything is stored.

**Moving to object storage later.** Products store a plain URL string, so switching to
Vercel Blob, S3 or Cloudinary means changing one route — `app/api/admin/products/images/route.ts`
— to upload there and return its URL. Existing products keep working: their
`/api/images/...` URLs stay valid as long as the collection and the serving route remain.

## Banners, categories and reviews

All three live in MongoDB (`banners`, `categories`, `reviews`), alongside products.

They used to be written to this browser's `localStorage`, which meant a banner the owner
added was visible to the owner and to nobody else — every customer saw the hardcoded
homepage slides instead.

```
Panel  ->  PUT /api/admin/content/<banners|categories|reviews>  ->  MongoDB
                                                                      |
Homepage  <-  getLiveBanners()  <-------------------------------------+
```

Each list is read and written **whole**: `PUT` replaces it, and anything not in the body
is deleted. They are small, hand-curated lists edited as a set, so this is simpler than
a per-row endpoint and makes a delete and a reorder the same operation. The trade-off is
last-write-wins if two people edit the same list at once.

Banner links and image URLs are restricted to site-relative paths or `https://` URLs —
a `javascript:` URL in a banner would otherwise be stored XSS.

Whether a banner is currently running (its `startsAt`/`endsAt` window) is decided on the
server, not in the browser: it is a fact about the data, and reading the clock during
render is impure.

## Inventory

There is no longer a separate stock feed. The Inventory screen writes stock onto the
product record itself, which is the same record the storefront reads — so the two can no
longer disagree. `lib/stock-feed.ts` and `lib/banner-feed.ts` have been deleted.

Setting a size to zero marks it out of stock server-side; the product page reads
`outOfStock` and `stock` straight from the product.

## Coupons

Coupons live in MongoDB (`coupons`) and the rules are evaluated from the record:
percent / flat / free-shipping, minimum spend, usage limit, and the date window.

They used to be a hardcoded switch over three literal codes while the panel wrote to
localStorage — so a coupon created in the panel did nothing, and one paused there kept
working.

**Dates beat the stored status.** A coupon marked `active` whose `expiresAt` has passed
is rejected, because the status only reflects whenever an admin last touched it. An
explicit `paused` still wins over the dates, because that is a deliberate act.

**The coupon list never reaches the browser.** It holds scheduled and paused codes that
haven't been announced. The cart asks about one code at a time via
`POST /api/coupons/validate` (rate-limited, so the list can't be brute-forced), and the
discount actually charged is recomputed at checkout from the same records — the reply to
the browser is a preview, never an input.

Two guards: a percentage above 100 is clamped to 100, and no discount can exceed the
bag total.

## Backup and recovery

Atlas keeps its own cluster snapshots, restored through the Atlas UI. These scripts are
the other half — a file you hold, that can be inspected and restored one collection at a
time, which is what you want after a bad bulk edit rather than a whole-cluster rollback.

**Take a backup** (do this before any risky change):

```
npx tsx --env-file=.env.local scripts/backup.ts
```

Writes `scripts/backups/mitrends-<timestamp>.json` covering products, productImages,
orders, customers, banners, categories, reviews and coupons. Product image bytes are
included, so a restore brings the pictures back too.

The file contains customer emails and password hashes. `scripts/backups/` is gitignored —
keep it that way, and off shared drives.

**Restore:**

```
npx tsx --env-file=.env.local scripts/restore.ts <file> coupons,banners
npx tsx --env-file=.env.local scripts/restore.ts <file> products --replace
```

You must name the collections; there is no restore-everything switch. By default only
documents whose `_id` is missing are inserted, so a restore brings back what was deleted
without undoing edits made since. `--replace` overwrites matching documents as well.
Neither mode ever deletes something the backup doesn't contain.

Take a fresh backup before restoring, so the current state is recoverable if the restore
turns out to be the wrong call.

**Housekeeping note:** deleting a product or replacing an image leaves the old bytes in
`productImages`. They are harmless but accumulate; there is no automatic sweep yet.
