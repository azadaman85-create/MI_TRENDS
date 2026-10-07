# Database structure

The Next.js MI TRENDS project had **no database**: the catalogue was a TypeScript file
(`lib/catalog.ts`), the admin data was generated in the browser (`lib/admin/data.ts`), and
the bag, wishlist, accounts, orders, stock and settings lived in the browser's localStorage
(`mitrends-bag-v1`, `mitrends-customers-v1`, `mitrends-order-inbox-v1`, `mitrends-stock-v1`,
`mitrends-store-settings-v1`). In WordPress all of it moves into the site database.

**Principle:** use WordPress and WooCommerce tables for everything they already model.
Only two custom tables exist, for data neither stores.

Table names below use the default `wp_` prefix.

## 1. WordPress core tables used

| Table | MI TRENDS data |
|---|---|
| `wp_posts` | products (`product`), size variations (`product_variation`), pages (Info pages, Wishlist, Shop, Bag, Checkout, Account), coupons (`shop_coupon`), contact messages (`mi_message`), media (`attachment`), orders (`shop_order`, only when HPOS is off) |
| `wp_postmeta` | product fields (`_price`, `_regular_price`, `_sale_price`, `_sku`, `_stock`, `_stock_status` …) and MI fields (`_mi_*`, see `database/schema/meta-keys.md`); page header fields; order meta when HPOS is off |
| `wp_terms`, `wp_term_taxonomy`, `wp_term_relationships`, `wp_termmeta` | categories Men/Women/Unisex (`product_cat`), tags new/bestseller/sale (`product_tag`), sizes (`pa_size`), collections (`mi_collection` + palette/tagline meta), product types (`mi_type`), product visibility |
| `wp_users`, `wp_usermeta` | customers and staff; billing details (`billing_phone` …), wishlist (`_mi_wishlist`), sign-up method |
| `wp_comments`, `wp_commentmeta` | product reviews and ratings (`rating`, `verified`); order notes when HPOS is off |
| `wp_options` | WooCommerce settings, `mi_core_settings`, gateway settings, Customizer hero slides (`theme_mods_mi-trends`), transients (cached reports / catalogue lists) |

## 2. WooCommerce tables used

| Table | MI TRENDS data |
|---|---|
| `wp_wc_orders`, `wp_wc_orders_meta`, `wp_wc_order_addresses`, `wp_wc_order_operational_data` | orders (HPOS) — status, totals, payment method, Razorpay IDs, COD split, tracking, address type |
| `wp_woocommerce_order_items`, `wp_woocommerce_order_itemmeta` | order lines (product, variation = size, qty, totals, **Colour**), shipping line, COD fee line, coupon line |
| `wp_wc_product_meta_lookup` | fast price/stock/rating lookups (used for price sorting) |
| `wp_wc_product_attributes_lookup` | attribute filtering |
| `wp_woocommerce_attribute_taxonomies` | the Size attribute definition |
| `wp_wc_customer_lookup`, `wp_wc_order_stats`, `wp_wc_order_product_lookup`, `wp_wc_order_coupon_lookup` | WooCommerce Analytics |
| `wp_woocommerce_sessions` | live carts (bag) of visitors — replaces `mitrends-bag-v1` |
| `wp_woocommerce_shipping_zones`, `…_zone_locations`, `…_zone_methods` | zone "India" + MI TRENDS delivery |
| `wp_woocommerce_payment_tokens*` | unused (no saved cards) |
| `wp_woocommerce_tax_rates*` | GST rates if you enable tax |
| `wp_wc_webhooks`, `wp_woocommerce_api_keys`, `wp_actionscheduler_*` | WooCommerce internals |

## 3. Custom tables (MI Trends Core)

Created on plugin activation via `dbDelta()`; definitions in
`plugins/mi-trends-core/database/class-mi-core-schema.php`, reference SQL in
[`database/schema/custom-tables.sql`](database/schema/custom-tables.sql).

### `wp_mi_subscribers`

**Purpose.** Newsletter sign-ups (footer "Join the list") and "Get notified" sign-ups
(Gift cards, Stores). In the original these only showed a toast; WordPress has no subscriber
store, and making WordPress users of people who never registered would be wrong.

| Column | Type | Null | Notes |
|---|---|---|---|
| `id` | BIGINT UNSIGNED AUTO_INCREMENT | no | **Primary key** |
| `email` | VARCHAR(190) | no | lower-cased |
| `source` | VARCHAR(60) | no | `footer`, `notify:gift-cards`, `notify:stores` |
| `status` | VARCHAR(20) | no | `subscribed` / `unsubscribed` |
| `user_id` | BIGINT UNSIGNED | yes | → `wp_users.ID` when signed in (logical FK, not enforced) |
| `ip_hash` | CHAR(64) | yes | HMAC-SHA256 of the IP with a site salt — never the raw IP |
| `created_at` | DATETIME | no | UTC |
| `updated_at` | DATETIME | no | UTC |

Indexes: `PRIMARY (id)`, `UNIQUE email_source (email, source)` (re-subscribing updates the row),
`status`, `created_at`.
Relationships: optional `user_id` → `wp_users.ID`.

### `wp_mi_stock_movements`

**Purpose.** A history of every stock change and why. WooCommerce keeps only the current
quantity per variation. The original panel had no log either, but its Inventory screen and
the requirement for "stock movement" need one.

| Column | Type | Null | Notes |
|---|---|---|---|
| `id` | BIGINT UNSIGNED AUTO_INCREMENT | no | **Primary key** |
| `product_id` | BIGINT UNSIGNED | no | → `wp_posts.ID` (parent product) |
| `variation_id` | BIGINT UNSIGNED | no (0) | → `wp_posts.ID` (size variation) |
| `sku` | VARCHAR(100) | yes | snapshot, e.g. `MIT-TEE-01-M` |
| `size` | VARCHAR(40) | yes | snapshot, e.g. `M` |
| `delta` | INT | no | after − before |
| `stock_before` | INT | yes | |
| `stock_after` | INT | yes | |
| `reason` | VARCHAR(30) | no | `order`, `restock`, `return`, `adjustment`, `edit`, `import` |
| `order_id` | BIGINT UNSIGNED | yes | → WooCommerce order ID |
| `user_id` | BIGINT UNSIGNED | yes | → `wp_users.ID` (who) |
| `note` | VARCHAR(255) | yes | optional note from the Inventory screen |
| `created_at` | DATETIME | no | UTC |

Indexes: `PRIMARY (id)`, `product_created (product_id, created_at)` (per-product history),
`variation_id`, `order_id`, `reason_created (reason, created_at)` (reports by reason).
Relationships (logical, not enforced, so deleting a product keeps its history):
`product_id`/`variation_id` → `wp_posts`, `order_id` → `wp_wc_orders` (or `wp_posts`),
`user_id` → `wp_users`.

**Not created on purpose:** no products table (WooCommerce products), no inventory table
(variation stock), no orders/customers tables (WooCommerce), no coupons (WooCommerce), no
reviews (comments), no settings table (`wp_options`), no wishlist table (user meta — a short
list of IDs per user), no messages table (private post type with WordPress's admin UI and
privacy tools), no banners table (Customizer).

## 4. Where each kind of data lives

| Data | Storage | Owner |
|---|---|---|
| **Product data** | `wp_posts` (product + variations), `wp_postmeta`, taxonomies, `wp_wc_product_meta_lookup` | WooCommerce (+ `_mi_*` meta by the plugin) |
| **Inventory** | variation `_stock` / `_stock_status` meta | WooCommerce |
| Stock history | `wp_mi_stock_movements` | MI Trends Core |
| Low-stock threshold | option `woocommerce_notify_low_stock_amount` (12) | WooCommerce |
| **Orders** | HPOS tables (or posts) + order items | WooCommerce |
| Fulfilment extras (tracking, COD split) | order meta `_mi_*` | MI Trends Core |
| **Customers** | `wp_users` + `wp_usermeta` (`billing_*`), `wp_wc_customer_lookup` | WordPress / WooCommerce |
| Wishlist | user meta `_mi_wishlist`; guest cookie | MI Trends Core |
| Bag (cart) | `wp_woocommerce_sessions` (+ persistent cart user meta) | WooCommerce |
| Coupons | `shop_coupon` posts + meta (`_mi_capped_percent`) | WooCommerce (+ plugin field) |
| Reviews | `wp_comments` | WooCommerce |
| **Reports** | computed from orders on request, cached in transients (10 min); WooCommerce Analytics tables | MI Trends Core / WooCommerce |
| **Settings** | `wp_options`: `mi_core_settings` (COD, shipping amounts, identity, announcements, return address), WooCommerce options, `theme_mods_mi-trends` (hero) | plugin / WooCommerce / theme |
| Subscribers | `wp_mi_subscribers` | MI Trends Core |
| Contact messages | `mi_message` posts | MI Trends Core |
| Info page copy | page content + `_mi_eyebrow` / `_mi_display_title` / `_mi_intro` | WordPress |

## 5. localStorage → database mapping

| Original key | Now |
|---|---|
| `mitrends-bag-v1` (lines, wishlist, coupon) | WooCommerce session/cart (+ `mi_color` per line); wishlist → user meta / cookie; coupon → cart applied coupon |
| `mitrends-customers-v1`, `mitrends-customer-session-v1` | `wp_users` + WordPress auth cookies |
| `mitrends-order-inbox-v1` | WooCommerce orders |
| `mitrends-stock-v1` (stock feed) | variation stock (+ `GET /wp-json/mi-trends/v1/stock`) |
| `mitrends-store-settings-v1` | option `mi_core_settings` |
| admin edits (`lib/admin/store.tsx`) | the real records they edited |

The browser data from the old site cannot be transferred (it lived in each visitor's browser);
the real catalogue is imported from `database/seed/`. See MIGRATION-GUIDE.md.
