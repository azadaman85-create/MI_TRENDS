# MI TRENDS — Admin panel

The admin panel lives at `/admin` and is built from the storefront's own design language, as
specified in *MI TRENDS Admin Panel Design Requirements* (sections 51–71).

## Getting in

| | |
|---|---|
| Login | http://localhost:3000/admin/login |
| Credentials | Configured per environment — see below |

The super admin identity comes from four env vars, set in `.env.local` (gitignored) and listed
without values in `.env.example`:

| Variable | Holds |
|---|---|
| `NEXT_PUBLIC_ADMIN_EMAIL` | The sign-in address |
| `NEXT_PUBLIC_ADMIN_NAME` | Display name, shown in the topbar and used for the avatar initials |
| `NEXT_PUBLIC_ADMIN_PASSWORD_SALT` | Random per-install salt |
| `NEXT_PUBLIC_ADMIN_PASSWORD_HASH` | SHA-256 of `salt:password` |

Generate a fresh pair after any password change:

```bash
node -e 'const c=require("crypto");const s=c.randomBytes(16).toString("hex");console.log("salt",s);console.log("hash",c.createHash("sha256").update(s+":"+process.argv[1]).digest("hex"))' 'YOUR_PASSWORD'
```

**This is not a real security boundary.** The project has no backend, so `lib/admin/auth.tsx`
compares the digest in the browser, and anyone can edit the client bundle to walk past it. Storing
a salted digest rather than the password only ensures the password itself is never written into the
repository or the bundle. Swap `signIn()` for a server call the moment a real identity provider
exists; the route guard in `app/admin/(panel)/layout.tsx` stays the same.

## Screens

| Route | What it does |
|---|---|
| `/admin` | Dashboard — 6 KPI cards, revenue area chart, order-status donut, recent orders, low stock, best sellers, payment mix |
| `/admin/products` | Product master — search, status tabs, category/collection filters, sorting, bulk publish/archive/delete, row actions |
| `/admin/products/new`, `/admin/products/[id]` | Product editor — information, images, pricing, variants & inventory, SEO, publishing rail, storefront preview |
| `/admin/categories` | Category tree with visibility toggles and a create/edit modal |
| `/admin/collections` | The eight drops with palette, product count and revenue |
| `/admin/inventory` | Per-size stock adjustment, low/out-of-stock views, stock value |
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
