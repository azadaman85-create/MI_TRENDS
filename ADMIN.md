# MI TRENDS — Admin panel

The admin panel lives at `/admin` and is built from the storefront's own design language, as
specified in *MI TRENDS Admin Panel Design Requirements* (sections 51–71).

## Getting in

| | |
|---|---|
| Login | http://localhost:3000/admin/login |
| Email | `admin@mitrends.in` |
| Password | `mitrends2026` |

The storefront has no backend in this project, so the panel ships with a local session
(`lib/admin/auth.tsx`) instead of a real identity provider. Swap `signIn()` for an API call when
one exists; the route guard in `app/admin/(panel)/layout.tsx` stays the same.

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
