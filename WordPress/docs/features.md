# Features

Everything the Next.js store did, where it lives now, and what is WooCommerce, WordPress, or MI TRENDS.

**WC** = WooCommerce, **WP** = WordPress core, **Theme** = MI TRENDS theme, **Core** = MI Trends Core plugin.

## Shopping

| Feature | Original behaviour | Implemented by |
|---|---|---|
| Catalogue, prices (MRP + sale), SKU, images, gallery | `lib/catalog.ts` | WC variable products |
| Sizes with per-size stock, sold-out sizes, "only N left" (≤3) | stock feed | WC variations + Theme |
| Colours (choose on product page, saved on line) | bag key `id:size:colour` | Core (`mi_color` cart data, order item "Colour") |
| Categories Men/Women/Unisex, tags new/bestseller/sale | product fields | WC taxonomies |
| Collections, product types | product fields | Core taxonomies |
| Visibility (active/draft/archived) | admin | WC status + catalog visibility |
| Search (`/` overlay, live results, `?q=`) | client filter | Core REST `/search` + Theme |
| Filters + sorting, shareable URLs | `shop/page.tsx` | Core shop query + Theme filter bar |
| Add to bag, quick add, mini cart drawer, update/remove, clear bag | `StoreProvider` | WC cart + Core AJAX + Theme |
| Max 10 per line, 1–5 on product page | clamp | Core / Theme |
| Wishlist | localStorage | Core (user meta / cookie) |
| Coupons MI10 / FLAT200 / FIRST15 (one at a time, original messages) | `applyCoupon` | WC coupons + Core |
| Free shipping ≥ ₹999, else ₹79 | `FREE_SHIPPING_THRESHOLD` | Core shipping method (WC zone) |
| Pincode delivery estimate | client calc | Theme JS (same formula) |
| Size guide | dialog + page | Theme |
| Ratings & reviews | static | WC reviews (verified buyers), seeded figures until real ones exist |

## Checkout & payment

| Feature | Implemented by |
|---|---|
| Account required (redirect to sign-up and back) | Core |
| Contact + Indian delivery address, Home/Work/Other, validation messages | WC checkout fields shaped by Core; Theme layout; JS + server validation |
| Order summary with live totals | WC (fragment refresh) + Theme |
| UPI via Razorpay (full amount) | Core gateway + Razorpay API |
| Cash on delivery with UPI advance (20%), ₹49 fee, only above ₹800, disabled card with reason | Core gateway + fee + rules |
| Signature verification, webhook | Core REST |
| Refunds through Razorpay | Core gateway (WC refund button) |
| Order confirmation (copy ID, advance/balance, ETA, next steps) | Theme (WC order-received) |
| Order numbers `MIT…` | Core |

## Accounts

| Feature | Implemented by |
|---|---|
| Sign up (name, email, +91 mobile, password with strength hint), sign in, sign out, password reset | WP users + WC account forms, Core validation, Theme screens |
| `/account/login`, `/account/signup`, `?next=` return | Core rewrite rules |
| Account home cards + real order history, addresses, details | Theme + WC endpoints |
| Google sign-in | optional third-party (Nextend Social Login) via hook |

## Content & engagement

| Feature | Implemented by |
|---|---|
| Homepage sections, hero carousel (editable) | Theme + WP Customizer |
| Announcement marquee (editable) | Theme + Core setting |
| Info pages, FAQs (editable) | WP pages + Theme templates |
| Newsletter + notify-me (stored, exportable) | Core (`wp_mi_subscribers`) |
| Contact form (stored, emailed) | Core (Messages) |
| Track order (real lookup, rate-limited) | Core REST + Theme |
| Toasts, back to top, mobile tab bar, mobile buy bar | Theme |
| Responsive: desktop, laptop, tablet, phone (incl. safe areas) | Theme (original CSS breakpoints 1400/1180/1100/1080/900/850/768/700/620/600/560/520/360) |

## Admin / management

| Feature | Implemented by |
|---|---|
| Dashboard: revenue, orders, customers, products, low stock, awaiting confirmation; fulfilment pipeline (new, confirmed, packing, shipment, delivered, returns, cancelled); charts; recent orders; best sellers; payment mix | Core |
| Orders: statuses Processing → Confirmed → Packed → Shipped → Delivered, Cancelled, Returned; bulk changes; emails; tracking; COD balance; shipping label | WC + Core |
| Inventory: per-size grid with staged Save, low/out views, stock value, stock movement log, CSV | Core (WC stock) |
| Products, categories, collections, reviews, coupons | WC + Core fields |
| Customers with tiers (VIP > ₹12,000, regular > 2 orders) | Core (WP users, WC spend) |
| Reports: revenue trend, by collection, by type, top states, CSV | Core (+ WC Analytics) |
| Settings: identity, COD, shipping, marquee, return address, operations; one-click setup and import | Core |
| Staff logins and roles | WP |

## Needs extra configuration or a third-party service

| Need | What to do |
|---|---|
| Taking payments | Razorpay account + keys in wp-config.php (required) |
| Reliable email | SMTP plugin (e.g. WP Mail SMTP) — strongly recommended |
| Google sign-in | Nextend Social Login (optional) |
| GST tax lines / invoices | WooCommerce tax settings + an invoice plugin (optional) |
| Courier booking / AWB automation | courier's WooCommerce plugin (optional; manual AWB field included) |
| SEO titles, sitemaps | Rank Math or Yoast (recommended) |
| Backups, security, caching | host or plugins (see WORDPRESS-SETUP.md) |
