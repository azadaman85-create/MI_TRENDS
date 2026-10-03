# Migrating MI TRENDS from Next.js to WordPress

```text
Existing MI TRENDS (Next.js, ../mi-trends)
        ↓   design copied verbatim, components ported to PHP templates
WordPress Theme (theme/mi-trends)
        ↓   business rules moved out of React state into hooks
MI Trends Core Plugin (plugins/mi-trends-core)
        ↓   products, cart, checkout, orders, coupons, emails
WooCommerce
        ↓   CRUD + two custom tables
WordPress Database
        ↓   upload, setup, import, keys, test
Live Website
```

The Next.js project stays exactly as it is. Nothing here modifies it; the tools only read it.

## 1. What was reused, converted, reimplemented

### Reused as-is (copied, unchanged)

| Original | Now |
|---|---|
| `app/globals.css` (whole storefront design system) | `theme/mi-trends/assets/css/storefront-globals.css` |
| `components/account/account.css` | `…/assets/css/account.css` |
| `components/ui/filter-token-bar.css` | `…/assets/css/filter-token-bar.css` |
| `app/admin/admin.css` | `plugins/mi-trends-core/assets/css/admin-panel.css` |
| `public/images/products/*.jpg`, `hero-oversized.jpg` | theme images; plugin seed images (imported to the Media Library) |
| `app/icon.svg` | favicon fallback and admin menu icon |
| Inter (`@fontsource/inter` 400–700) | self-hosted woff2 in `assets/fonts/` |
| Copy: info pages, FAQs, hero/home text, toasts, validation messages | identical strings in templates, seed and plugin |
| Lucide icon shapes | `assets/icons/icons.json` |

### Converted (same output, different technology)

| Original | Now |
|---|---|
| React components (`components/*.tsx`, pages) | PHP templates rendering the same markup and class names — see [templates/](templates/) |
| `<style jsx>` per page | `assets/css/pages.css`, same values, prefixed by page root class |
| Client state in `StoreProvider` (drawers, search, toasts, quantities) | `assets/js/mi-trends.js` (vanilla JS, no framework) |
| `ProductVisual.tsx` SVG | `inc/product-visual.php` |
| `lib/catalog.ts` (10 products) | WooCommerce variable products via `database/seed/catalog.json` |
| `lib/admin/data.ts` stock and cost | per-size variation stock and `_mi_cost_price` |
| Coupons in `StoreProvider` | WooCommerce coupons (+ "percent, capped" for FIRST15) |
| URL query filters on `/shop` | the same parameters, applied server-side to the WooCommerce query |

### Reimplemented (logic moved to a server)

| Original (browser-only) | Now (server) |
|---|---|
| Accounts with browser-side SHA-256 (`lib/account/auth.tsx`) | WordPress users, server password hashing, password reset |
| Admin "super admin" checked in the browser | wp-admin logins with roles (Administrator, Shop manager) |
| Orders in localStorage (`order-inbox`) | WooCommerce orders with statuses, notes, emails |
| Stock feed in localStorage | WooCommerce stock, reduced on payment, restored on cancel/return, logged |
| Store settings in localStorage | `mi_core_settings` option |
| Razorpay API routes | gateway classes + REST verify + webhook |
| Track order (fake stage from a hash) | real lookup by order number + email/mobile |
| Newsletter / contact (toast only) | stored (subscribers table, Messages) and emailed |
| Wishlist in localStorage | user meta (account) or cookie (guest), merged on sign-in |
| Dashboard/report demo numbers | figures from real orders |

## 2. Where each piece of data is stored now

| Data | Stored in | Managed by |
|---|---|---|
| Products, prices, sizes, stock, images, categories, tags, reviews, coupons, orders, customers, cart sessions, emails, tax, shipping zones | **WooCommerce** (its tables / post types) | WooCommerce screens |
| Pages, menus, users, media, Customizer (hero slides), general options | **WordPress** | WordPress screens |
| Colours, fit, fabric, artwork, palette, popularity, cost price, collections, product types, COD/shipping/identity settings, order fulfilment fields, wishlist, stock history, subscribers, messages, order statuses | **MI Trends Core** (meta keys, 2 taxonomies, 1 option, 2 custom tables, 1 private post type) | MI TRENDS screens and the product editor tab |

Details: [DATABASE-STRUCTURE.md](DATABASE-STRUCTURE.md), [database/schema/meta-keys.md](database/schema/meta-keys.md).

## 3. Migration steps

1. **Build the packages** (only if you changed something): `node tools/build-seed.mjs` (regenerates the seed from the original's catalogue), `bash tools/package.sh` (zips).
2. **Install** WordPress + WooCommerce, upload the plugin and theme, activate ([INSTALLATION.md](INSTALLATION.md) steps 1–6).
3. **Store setup**: MI TRENDS → Settings → *Run store setup*.
4. **Catalogue**: *Import catalogue* — 10 products, 60 size variations with the admin seed's stock, photos, 7 coupons.
5. **Check data**: Products (10), each with 6 sizes; Marketing → Coupons; MI TRENDS → Inventory matches the original panel's stock (e.g. Everyday White Crew Tee XS 0, XXL 3).
6. **Payments**: Razorpay keys in wp-config.php, enable both gateways.
7. **URLs**: if the domain stays the same, the main routes keep working (`/shop?…`, `/product/{slug}`, `/cart`, `/checkout`, `/account`, `/account/login`, `/account/signup`, `/wishlist`, `/info/{slug}`). Add one redirect: `/order-success` → `/` (the confirmation is now WooCommerce's order-received page). Product cards in the original linked to `/collection/{slug}`, which did not exist; they now link to `/shop?collection={slug}`.
8. **Switch DNS** from the Next.js host to WordPress; keep the Next.js deployment until you have checked the live site.

## 4. What can't be migrated

- **Visitor browser data** from the old site (bags, wishlists, accounts, orders placed in the demo, admin edits) lived in each visitor's localStorage and never reached a server. Customers create accounts again.
- **Demo data** the panel generated (customers, orders, reviews) is not imported — it wasn't real. Ratings/review counts shown on products are imported as display figures until real reviews arrive.
- **Coupon usage counts** start at zero.

## 5. Differences from the original (deliberate)

| Original | WordPress | Why |
|---|---|---|
| Razorpay opened over the checkout page | order created first, payment step page opens Razorpay | WooCommerce's gateway flow; same Razorpay Standard Checkout |
| State list of 19 states | WooCommerce's full Indian state list | otherwise customers in other states couldn't order |
| Cart page coupon hint "HYPE10" (not a valid code) | "MI10" | the original hint always failed |
| Order IDs `MIT` + timestamp digits | `MIT` + (10,000,000 + order ID) | stable, reversible for tracking |
| Google sign-in decoded in the browser | optional server-verified plugin (Nextend Social Login) | the original noted it needed server verification |
| Shop showed every product on one page | 48 per page with pagination | keeps the shop fast as the catalogue grows |
| `referrer: no-referrer` | `strict-origin-when-cross-origin` | WooCommerce form redirects need same-site referrers |

Preserved even though they look unintended (flagged for a future decision):

- The order confirmation hero uses the global `.hero` class, inheriting the carousel's tall height and beige background — kept identical.
- Illustrated product art treats "T-shirt" as a shirt shape (`type.includes("shirt")`) — kept identical (only shows when a product has no photo).

## 6. Rollback

The original Next.js project is untouched, so rolling back is pointing DNS back to its host.
On WordPress, deactivating the plugin keeps all data (see `plugins/mi-trends-core/uninstall.php`);
switching themes leaves products and orders in WooCommerce.
