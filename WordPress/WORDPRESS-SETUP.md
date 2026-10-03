# WordPress configuration for MI TRENDS

Settings that live in WordPress itself (WooCommerce has its own guide:
[WOOCOMMERCE-SETUP.md](WOOCOMMERCE-SETUP.md)). Items marked **(setup)** are applied by
MI TRENDS → Settings → Run store setup.

## General — Settings → General

| Setting | Value |
|---|---|
| Site Title | `MI TRENDS` (used in the browser tab: "Page | MI TRENDS") |
| Tagline | `Made to be noticed` |
| Timezone | `Kolkata` (UTC+5:30) — order dates, reports and delivery estimates use it |
| Site Language | English (India) or English (UK) — matches the original's "colour", "pyjama" |
| Membership | leave "Anyone can register" **off** — customers register through WooCommerce's account page |

## Permalinks — Settings → Permalinks

| Setting | Value |
|---|---|
| Structure | **Post name** `/%postname%/` **(setup, if it was Plain)** |
| Product base | `/product/` **(setup)** → `/product/everyday-white-crew-tee/`, exactly as before |

Resulting URLs match the Next.js routes: `/`, `/shop/?category=men`, `/product/{slug}/`,
`/cart/`, `/checkout/`, `/account/`, `/account/login/`, `/account/signup/`, `/wishlist/`,
`/info/{slug}/`. The order confirmation is WooCommerce's `/checkout/order-received/{id}/`
(was `/order-success`). After changing permalinks, click **Save** once to flush rules.

## Reading — Settings → Reading

- Homepage: either setting works; the theme's `front-page.php` renders the MI TRENDS homepage.
  For clarity choose **A static page** → an empty page called "Home".
- Search engine visibility: **tick while building, untick at launch.**

## Media — Settings → Media

The theme registers `mi-product` (480×640, cropped) and `mi-product-large` (960×1280) — the
3:4 portrait every product visual uses. Recommended:

| Setting | Value |
|---|---|
| Thumbnail | 150×150 cropped (default) |
| Medium | 480×640 |
| Large | 1200×1600 |
| Organise uploads by month | on |

Upload product photos at least **960×1280** (3:4). After changing sizes on a live store, run
**Regenerate Thumbnails** once. For WebP/AVIF output, an image optimisation plugin (e.g. EWWW, ShortPixel, Imagify) is recommended.

## Users and roles

| Role | Who | Can |
|---|---|---|
| Administrator | owner/developer | everything; keep to 1–2 people |
| Shop manager (WooCommerce) | staff running the store | products, orders, coupons, reports, **all MI TRENDS screens** (`manage_woocommerce`) |
| Customer (WooCommerce) | shoppers | their account, orders, wishlist |

The original admin had one "super admin" checked in the browser. In WordPress every staff
member gets their own login (**Users → Add New**, role **Shop manager**), with real password
hashing, sessions and password reset. Enable two-factor (below) for all staff.

## Security

- **HTTPS everywhere** — Settings → General: both URLs `https://`. Required by Razorpay.
- **Secrets in `wp-config.php`, never in the database or code**:
  ```php
  define( 'MI_RAZORPAY_KEY_ID', 'rzp_live_…' );
  define( 'MI_RAZORPAY_KEY_SECRET', '…' );
  define( 'MI_RAZORPAY_WEBHOOK_SECRET', '…' );
  define( 'DISALLOW_FILE_EDIT', true );   // no theme/plugin editor in wp-admin
  define( 'WP_DEBUG', false );
  ```
  Environment variables with the same names also work (useful on container hosts).
- **Two-factor login** for staff: "Two Factor" (by WordPress contributors) or "Wordfence Login Security".
- **Firewall / malware scan**: Wordfence, Solid Security, or your host's WAF (Cloudflare works well).
- **Limit login attempts** (Wordfence includes it).
- **Updates**: WordPress, WooCommerce and PHP on current versions; after WooCommerce updates check
  WooCommerce → Status → **Templates** for "outdated" MI TRENDS overrides.
- **Backups**: daily database + weekly files, kept off-server (UpdraftPlus, Jetpack VaultPress,
  or host backups). Test a restore once.
- What the code already does: every form and AJAX call has a nonce; every admin action checks
  `manage_woocommerce` / `edit_shop_orders`; all output is escaped and input sanitised; contact,
  newsletter and order tracking have honeypots and per-IP rate limits; IPs are only stored hashed;
  order tracking requires the order's email or mobile; Razorpay payments are accepted only after
  an HMAC signature check against the server-side secret.

## Caching

Pages that change per visitor must **never be page-cached**: `/cart/`, `/checkout/`,
`/account/*`, `/wishlist/`, and any URL with `?add-to-cart`, `wc-ajax` or `/wp-json/mi-trends/`.
WooCommerce sets `DONOTCACHEPAGE` on cart/checkout/account; add `/wishlist/` to your cache
plugin's exclusions yourself.

Recommended:
- Host page cache (or WP Rocket / LiteSpeed Cache / W3TC) with the exclusions above.
- Object cache (Redis/Memcached) if the host offers it — reports and catalogue lists use transients.
- If the homepage/shop are cached for logged-out visitors, turn on **MI TRENDS → Settings →
  Operations → Refresh bag and wishlist counts after page load** so the header badges stay correct.
- CDN for `wp-content/uploads` and theme assets.

## SEO

- Install **Rank Math** or **Yoast SEO**. Set titles to `%title% | MI TRENDS` (the original's
  template) and the homepage title `MI TRENDS — Made to be noticed`.
- The import stores the original SEO title/description per product in `_mi_seo_title` /
  `_mi_seo_description`; paste them into the SEO plugin's product fields (or map them with its
  import tool).
- Product structured data (schema.org Product, Offer, AggregateRating) is printed by WooCommerce.
- XML sitemap: from the SEO plugin (or WordPress's `/wp-sitemap.xml`).
- Shop filter URLs (`?category=…&tag=…`) should be `noindex` or canonical to `/shop/` — set
  "noindex paginated/filtered archives" in the SEO plugin.

## Performance

- PHP 8.2+ and OPcache.
- The theme loads: Inter (self-hosted, 8 small woff2 files, `font-display: swap`, latin preloaded),
  6 stylesheets (~95 KB unminified, gzip ~20 KB), one storefront script (~30 KB, no jQuery),
  plus the filter-bar script on the shop and WooCommerce's checkout script on checkout.
  WooCommerce's own frontend stylesheets are not loaded.
- Minify/combine with your cache plugin if you like; nothing depends on load order beyond what
  `wp_enqueue_style` declares.
- Product photos are drawn inside SVGs (as in the original); serve them from a CDN and keep
  originals ≤ 300 KB.
- Turn off WooCommerce features you don't use (WooCommerce → Settings → Advanced → Features:
  e.g. "Order attribution", "Remote logging") to trim requests.

## Privacy

- **Settings → Privacy**: select **Info → Privacy policy** as the privacy page.
- Personal data the plugin stores: newsletter emails (+ hashed IP), contact messages, wishlist IDs.
  WordPress's Tools → Export/Erase Personal Data covers users and WooCommerce orders; for
  subscribers use MI TRENDS → Subscribers → Export CSV and delete rows on request.
- Cookie consent: the site sets only functional cookies (cart session, wishlist, login). If you
  add analytics or ads, add a consent plugin (e.g. Complianz, CookieYes).
