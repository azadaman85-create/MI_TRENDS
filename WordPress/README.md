# MI TRENDS — WordPress / WooCommerce implementation

This folder is the WordPress version of the MI TRENDS store. It reproduces the existing
Next.js project (`../mi-trends/`) — same design, pages, components, shopping flow and
business rules — as a **WordPress theme** plus a **WooCommerce companion plugin**, with
everything you need to install, migrate and deploy it.

> **The original project is untouched.** Nothing in `../mi-trends/` was created, changed,
> moved or deleted. This folder sits *next to* it (not inside it) on purpose: inside, the
> original's `npm run lint` (`eslint .`) would have started linting these files.
> Tools here only ever **read** the original (`tools/build-seed.mjs`, `tools/sync-assets.sh --from-original`).

---

## What to upload, what to read

```text
UPLOAD TO WORDPRESS
├── theme/mi-trends/            → Appearance → Themes → Add New → Upload  (or dist/mi-trends.zip)
└── plugins/mi-trends-core/     → Plugins → Add New → Upload             (or dist/mi-trends-core.zip)

DOCUMENTATION
├── README.md                   ← you are here
├── INSTALLATION.md             step-by-step install, for non-developers
├── WORDPRESS-SETUP.md          WordPress settings: permalinks, media, users, security, caching, SEO, performance
├── WOOCOMMERCE-SETUP.md        products, shipping, payments (Razorpay), tax, emails, coupons
├── DATABASE-STRUCTURE.md       which tables hold what; the two custom tables
├── API-STRUCTURE.md            REST, AJAX, hooks, auth, data flow
├── MIGRATION-GUIDE.md          Next.js → WordPress: reused / converted / reimplemented
└── docs/                       pages.md · components.md · features.md · deployment.md
```

Build the zips at any time: `bash tools/package.sh` → `dist/mi-trends.zip`, `dist/mi-trends-core.zip`.

**Using WordPress Studio?** Studio's *Import* needs a full-site backup, not a theme/plugin zip.
Import `dist/mi-trends-studio-backup.zip` instead (complete site, already set up) — see
[docs/deployment.md → Option D](docs/deployment.md#option-d--wordpress-studio-local-site-on-your-macpc).

## Requirements

| | Minimum | Recommended |
|---|---|---|
| WordPress | 6.4 | latest |
| WooCommerce | 8.5 | latest (tested to 9.8) |
| PHP | 7.4 | 8.2 / 8.3 (all files are syntax-checked on 7.4 and 8.3) |
| Database | MySQL 5.7 / MariaDB 10.3 | MySQL 8 / MariaDB 10.6 |
| HTTPS | required for payments | |
| Payment account | Razorpay (India) — for UPI and the COD advance | |

WooCommerce's **classic (shortcode) Cart and Checkout** are used — the MI TRENDS templates
render them. The store setup switches those two pages to shortcodes for you. High-Performance
Order Storage (HPOS) is supported.

## Folder structure

```text
WordPress/
├── README.md, INSTALLATION.md, WORDPRESS-SETUP.md, WOOCOMMERCE-SETUP.md,
│   DATABASE-STRUCTURE.md, API-STRUCTURE.md, MIGRATION-GUIDE.md
├── theme/mi-trends/                 THE THEME (presentation only)
│   ├── style.css, functions.php, screenshot.png
│   ├── header.php, footer.php, front-page.php, page.php, single.php, archive.php,
│   │   search.php, 404.php, index.php, sidebar.php
│   ├── inc/                         setup, assets, icons, helpers, product visual, navigation,
│   │                                customizer (hero slides), woocommerce glue
│   ├── template-parts/components/   product card, cart drawer, search overlay, mobile nav,
│   │                                mobile tab bar, size guide, filter bar, newsletter, auth shell …
│   ├── page-templates/              wishlist + info pages (contact, FAQs, track order, size guide …)
│   ├── woocommerce/                 shop, product, cart, checkout, thank-you, account overrides
│   └── assets/                      css, js, images, icons, fonts (copied from ../assets)
├── plugins/mi-trends-core/          THE PLUGIN (business logic)
│   ├── mi-trends-core.php, uninstall.php, readme.txt
│   ├── includes/                    product data, shop query, cart, coupons, wishlist, checkout,
│   │                                COD, order statuses, inventory, accounts, forms, reports,
│   │                                emails, seeder, CLI, shipping method, gateways/
│   ├── admin/                       Dashboard, Inventory, Reports, Customers, Subscribers,
│   │                                Settings, product tab, order box, shipping label, charts
│   ├── api/                         REST routes, AJAX endpoints, Razorpay client
│   ├── database/                    schema (custom tables) + seed data
│   ├── templates/emails/            "order update" email
│   └── assets/                      admin css/js, Razorpay script, seed product photos
├── assets/                          SOURCE of all shared assets (css, js, images, icons, fonts)
├── templates/ …                     map of every page/component → the file that implements it
├── admin/ …                         map of every admin screen → where it lives in WordPress
├── database/                        schema/, seed/, migrations/
├── docs/                            pages, components, features, deployment
├── tools/                           build-seed.mjs, sync-assets.sh, package.sh
└── dist/                            built zips (after tools/package.sh)
```

`templates/` and `admin/` are **maps**, not code: each README there points to the theme or
plugin file that implements that page or screen, so nothing is duplicated.

## How it relates to the original

| Next.js | WordPress |
|---|---|
| `app/globals.css`, `account.css`, `filter-token-bar.css`, `admin.css` | copied **unchanged** into `assets/css/` |
| Every page's `<style jsx>` | `assets/css/pages.css`, same values, prefixed by the page's root class |
| React components (`components/*.tsx`) | PHP template parts + `assets/js/mi-trends.js` |
| `lib/catalog.ts` (10 products) | WooCommerce variable products (one variation per size), imported from `database/seed/` |
| `StoreProvider` (bag, wishlist, coupons in localStorage) | WooCommerce cart/session + plugin (colour per line, wishlist in user meta/cookie) |
| `/api/create-order`, `/api/verify-payment` (Razorpay) | plugin's Razorpay gateways + `/wp-json/mi-trends/v1/razorpay/verify` |
| Browser-only accounts | WordPress users (customer role), real password hashing |
| Admin panel (`/admin`, localStorage data) | wp-admin: WooCommerce screens + MI TRENDS menu |

Full detail in [MIGRATION-GUIDE.md](MIGRATION-GUIDE.md).

## Installation (short)

1. Install WordPress and WooCommerce.
2. Upload and activate the **MI Trends Core** plugin, then the **MI TRENDS** theme.
3. **MI TRENDS → Settings → Run store setup**, then **Import catalogue**.
4. Put the Razorpay keys in `wp-config.php`; enable **UPI** and **Cash on delivery** in WooCommerce → Settings → Payments.
5. Test an order, then go live.

Every click is spelled out in [INSTALLATION.md](INSTALLATION.md).

## Development

- **Assets:** edit in `WordPress/assets/`, then `bash tools/sync-assets.sh` to copy into the theme and plugin.
  `--from-original` re-copies the verbatim stylesheets and photos from `../mi-trends`.
- **Catalogue seed:** `node tools/build-seed.mjs` regenerates `database/seed/*` from the original
  `lib/catalog.ts`, `lib/admin/data.ts` and the info pages (Node 22.6+).
- **Local WordPress without Docker:** WordPress Playground —
  `npx @wp-playground/cli server --mount-before-install=theme/mi-trends:/wordpress/wp-content/themes/mi-trends --mount-before-install=plugins/mi-trends-core:/wordpress/wp-content/plugins/mi-trends-core --login`
  then install WooCommerce and activate both. (This is how the package was tested.)
- **Coding standards:** WordPress Coding Standards style (tabs, Yoda conditions, escaping on output,
  sanitising on input, nonces + capability checks on every write, prefixed names: theme `mi_trends_*`,
  plugin `mi_core_*` / `MI_Core_*`).
- **Templates:** WooCommerce overrides carry the WooCommerce template `@version` they were written
  against; after WooCommerce updates, check WooCommerce → Status → Templates for outdated overrides.

## Deployment

Build zips with `tools/package.sh`, upload through wp-admin (or SFTP to `wp-content/themes/` and
`wp-content/plugins/`), set keys in `wp-config.php`, run setup + import once, then follow the
go-live checklist in [docs/deployment.md](docs/deployment.md).

## Licences

Theme and plugin: GPL-2.0-or-later (required for WordPress themes/plugins). Inter font: SIL OFL 1.1
(`assets/fonts/Inter-OFL-LICENSE.txt`). Icons: Lucide (ISC). Product photography: Unsplash licence,
as in the original project.
