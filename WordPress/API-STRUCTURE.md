# API structure

How data moves between the browser, WordPress, WooCommerce, the database and Razorpay.

## 1. What the original used, and where it went

| Next.js | Purpose | WordPress |
|---|---|---|
| `POST /api/create-order` | create a Razorpay order for the amount due | `MI_Core_Gateway_Razorpay::process_payment()` → `MI_Core_Razorpay_API::create_order()` (server-side, on checkout submit) |
| `POST /api/verify-payment` | HMAC check of the Razorpay signature | `POST /wp-json/mi-trends/v1/razorpay/verify` |
| `checkout.razorpay.com/v1/checkout.js` | Razorpay Standard Checkout | same script, loaded only on the order-pay step |
| Google Identity Services (client-only) | Google sign-in | optional: Nextend Social Login (server-verified), via the `mi_trends_social_login` hook |
| localStorage (bag, wishlist, accounts, orders, stock, settings) | state | WooCommerce session/cart, user meta, WordPress users, WooCommerce orders, variation stock, `wp_options` |

No other external services were used.

## 2. REST API — namespace `mi-trends/v1`

Base URL: `https://your-domain/wp-json/mi-trends/v1/`. JSON in, JSON out. Errors use
WordPress's format `{ "code", "message", "data": { "status" } }`.

| Method & route | Auth | Purpose |
|---|---|---|
| `GET /search?q=` | public | Live search for the search overlay. Empty `q` → 6 most popular. |
| `GET /products?per_page=&page=` | public | Catalogue in the storefront's Product shape (published products only). |
| `POST /track-order` | public, rate-limited | Order progress for an order number + matching email/mobile. |
| `POST /razorpay/verify` | public, order key + HMAC | Completes a Razorpay payment. |
| `POST /razorpay/webhook` | Razorpay HMAC header | Completes payments if the browser closed. |
| `GET /stock` | `manage_woocommerce` | `{productId: {size: units}}` — the original stock feed shape. |
| `POST /stock` | `manage_woocommerce` | Set one size's stock (logged as an adjustment). |
| `GET /dashboard?days=7|30|90` | `manage_woocommerce` | Dashboard figures. |

**Authentication.** Public routes need nothing. Staff routes use WordPress authentication:
the logged-in cookie **plus** the `X-WP-Nonce` header (`wp_create_nonce('wp_rest')`), or an
[Application Password](https://make.wordpress.org/core/2020/11/05/application-passwords-integration-guide/)
over HTTPS for server-to-server use.

### `GET /search?q=oversized`
```json
{ "query": "oversized", "total": 1,
  "items": [ { "id": 41, "name": "Midnight Black Tee", "url": "https://…/product/midnight-black-tee/",
               "collection": "Everyday Icons", "type": "T-shirt", "price": 1049,
               "price_formatted": "₹1,049", "image": "https://…/tee-03-a-960x1280.jpg",
               "palette": ["#131313","#ef3f2f","#f3f0ea"], "art": "Clean lines · Garment dyed" } ] }
```
Matches name, collection, type, category, tags, artwork and colour names (substring, case-insensitive),
ordered by popularity. Cached by browsers for 60 s.

### `POST /track-order`
```json
// request
{ "order": "MIT10000123", "contact": "you@example.com" }     // or the 10-digit mobile
// 200
{ "order": "MIT10000123", "stage_label": "Shipped",
  "stages": [ {"label":"Order confirmed","done":true}, {"label":"Packed","done":true},
              {"label":"Shipped","done":true}, {"label":"Out for delivery","done":false},
              {"label":"Delivered","done":false} ],
  "complete": false, "tracking": "Delhivery · Tracking number 1234567890" }
// 404 { "code": "mi_track", "message": "We couldn’t find an order with those details." }
// 429 after 20 attempts per IP per 10 minutes
```
Order numbers are `MIT` + (10,000,000 + order ID); `#123` and `123` are accepted too.

### `POST /razorpay/verify`
```json
{ "order_id": 123, "order_key": "wc_order_…",
  "razorpay_order_id": "order_…", "razorpay_payment_id": "pay_…", "razorpay_signature": "…" }
// 200 { "success": true, "orderId": "order_…", "redirect": "https://…/checkout/order-received/123/?key=…" }
// 400 { "success": false, "message": "Signature mismatch." }
```
Checks, in order: the WooCommerce order exists and the **order key** matches; it is paid by an
MI gateway; `razorpay_order_id` equals the one stored on the order; the signature equals
`HMAC-SHA256(order_id + "|" + payment_id, key_secret)` (constant-time compare). Then
UPI → `payment_complete()`; COD → advance recorded, status Processing. Idempotent.

### `POST /razorpay/webhook`
Header `X-Razorpay-Signature` = HMAC-SHA256 of the raw body with the webhook secret.
Handles `payment.captured` / `order.paid`; finds the order via `notes.wc_order_id` and the
stored Razorpay order ID; completes it if not already.

### `POST /stock`
```json
{ "variation_id": 57, "quantity": 18, "note": "Recount" }   →   { "variation_id": 57, "quantity": 18 }
```

## 3. AJAX endpoints — `admin-ajax.php`

Used by the theme's `mi-trends.js` for in-page updates (they work for guests and signed-in
users). Every call sends `action` and `nonce` (`wp_create_nonce('mi_trends_store')`, printed
into the page as `MI_TRENDS.nonce`). Response: `{ "success": bool, "data": { "message", "fragments", "counts", … } }`.

| `action` | Params | Does | Returns |
|---|---|---|---|
| `mi_add_to_cart` | `product_id`, `variation_id`, `color`, `quantity` (1–10) | add size + colour to bag | message, `fragments`, `counts`, `checkout_url` |
| `mi_quick_add` | `product_id` | first in-stock size, first colour | message, fragments, counts |
| `mi_update_cart_item` | `cart_item_key`, `quantity` (0 removes) | change a bag line | message, fragments, counts |
| `mi_toggle_wishlist` | `product_id` | save/unsave | `wishlisted`, message, counts.wishlist |
| `mi_subscribe` | `email`, `source`, `mi_hp` (honeypot) | newsletter / notify-me | message |
| `mi_contact` | `name`, `email`, `order_id`, `message`, `mi_hp` | contact message | message |
| `mi_refresh` | — | current fragments + counts (for cached pages) | fragments, counts |

`fragments` follows WooCommerce's cart-fragment convention: `{ "div.mi-cart-drawer-content": "<html>", "mi_cart_count": 3 }`.
The theme supplies the HTML through the standard `woocommerce_add_to_cart_fragments` filter.

### Form posts (work without JavaScript)

| Target | Fields | Handler |
|---|---|---|
| product page form → product URL | `add-to-cart`, `variation_id`, `attribute_pa_size`, `quantity`, `mi_color` | WooCommerce add-to-cart handler (+ `woocommerce_add_cart_item_data` adds the colour) |
| bag quantity/coupon → `/cart/` | `cart[key][qty]`, `update_cart`, `coupon_code`, `apply_coupon`, `woocommerce-cart-nonce` | WooCommerce cart handler |
| `admin-post.php?action=mi_trends_clear_cart` | `mi_clear_nonce` | empty the bag |
| `admin-post.php?action=mi_trends_subscribe` / `mi_trends_contact` | nonce + fields | as the AJAX versions |
| `/checkout/` | WooCommerce checkout fields + `mi_upi_id`, `billing_address_type`, `woocommerce-process-checkout-nonce` | WooCommerce checkout (+ MI validation) |
| `/account/login/`, `/account/signup/` | WooCommerce login/register fields + `mi_name`, `billing_phone`, `redirect` | WooCommerce form handler (+ MI validation) |

## 4. WordPress hooks used (selection)

**Theme** (presentation): `after_setup_theme`, `wp_enqueue_scripts`, `wp_head`, `body_class`,
`customize_register`, `woocommerce_enqueue_styles` (off), `loop_shop_per_page`,
`woocommerce_add_to_cart_fragments`, `woocommerce_email_styles`; template overrides under `woocommerce/`.

**Plugin** (logic):

| Area | Hooks |
|---|---|
| Boot | `plugins_loaded`, `before_woocommerce_init` (HPOS compatibility), activation/deactivation |
| Catalogue | `init` (taxonomies), `woocommerce_after_product_object_save`, `woocommerce_after_product_variation_object_save`, `set_object_terms`, `wp_update_comment_count`, `woocommerce_product_data_tabs/panels`, `woocommerce_admin_process_product_object` |
| Shop | `request` (protect `?tag=`), `woocommerce_product_query`, `posts_clauses`, `template_redirect` (search & taxonomy → shop filters) |
| Cart | `woocommerce_add_cart_item_data`, `woocommerce_get_cart_item_from_session`, `woocommerce_get_item_data`, `woocommerce_add_to_cart`, `woocommerce_stock_amount_cart_item`, `woocommerce_quantity_input_max`, `woocommerce_checkout_create_order_line_item` |
| Coupons | `woocommerce_coupon_get_amount`, `woocommerce_applied_coupon`, `woocommerce_coupon_error`, `woocommerce_coupon_message`, `woocommerce_before/after_calculate_totals`, `woocommerce_coupon_options(_save)` |
| Checkout | `template_redirect` (account required), `woocommerce_billing_fields`, `woocommerce_checkout_fields`, `woocommerce_checkout_get_value`, `woocommerce_checkout_posted_data`, `woocommerce_after_checkout_validation`, `woocommerce_order_number` |
| COD | `woocommerce_cart_calculate_fees`, `woocommerce_checkout_create_order_fee_item` |
| Payments | `woocommerce_payment_gateways`, `woocommerce_receipt_{gateway}` |
| Shipping | `woocommerce_shipping_init`, `woocommerce_shipping_methods` |
| Orders | `wc_order_statuses`, `woocommerce_order_is_paid_statuses`, `woocommerce_reports_order_statuses`, `bulk_actions-edit-shop_order`, `bulk_actions-woocommerce_page_wc-orders`, `woocommerce_order_status_changed`, `woocommerce_process_shop_order_meta` |
| Stock log | `woocommerce_reduce_order_item_stock`, `woocommerce_restore_order_item_stock`, `woocommerce_before_product(_variation)_object_save` |
| Emails | `woocommerce_email_classes`, `woocommerce_email_actions`, `woocommerce_order_status_{status}_notification`, `woocommerce_email_order_meta` |
| Accounts | `init` (rewrite rules), `query_vars`, `redirect_canonical`, `woocommerce_register_post`, `woocommerce_new_customer_data`, `woocommerce_created_customer`, `wp_login` (merge wishlist) |
| APIs | `rest_api_init`, `wp_ajax_*` / `wp_ajax_nopriv_*`, `admin_post_*` |

**Hooks the package provides for customisation**

| Hook | Type | Use |
|---|---|---|
| `mi_core_product_view` | filter | change the product data every template renders |
| `mi_core_shop_fields` | filter | add/remove shop filter fields |
| `mi_core_checkout_requires_account` | filter | return false to allow guest checkout |
| `mi_core_subscribed`, `mi_core_contact_message` | action | push sign-ups/messages to a CRM |
| `mi_trends_social_login` | action | print a social sign-in button |
| `mi_trends_hero_slides`, `mi_trends_home_categories`, `mi_trends_home_editorials`, `mi_trends_home_collection_tiles` | filter | homepage content |
| `mi_trends_pdp_offers`, `mi_trends_coupon_hints`, `mi_trends_trending_searches`, `mi_trends_social_links` | filter | small content lists |
| `mi_trends_products_per_page` | filter | shop page size (48) |

## 5. Data flow

```text
Browser (theme templates + mi-trends.js)
   │  page loads: PHP renders everything server-side (works without JS)
   │  in-page actions: admin-ajax (cart, wishlist, forms) · REST (search, track, verify)
   ▼
WordPress (routing, users, nonces, REST/AJAX, pages, options)
   │  MI Trends Core hooks into WordPress and WooCommerce
   ▼
WooCommerce (products, variations/stock, cart session, checkout, orders, coupons, emails)
   │  CRUD objects / data stores (HPOS-aware)
   ▼
Database (wp_posts/postmeta, terms, users, wc_orders*, sessions, options, wp_mi_* tables)

Checkout → Razorpay:
  submit /checkout/ ─► WooCommerce creates order (Pending payment)
                    ─► gateway: Razorpay API POST /v1/orders (amount due now) ─► order-pay page
  shopper approves in UPI app (Razorpay Checkout)
                    ─► POST /wp-json/mi-trends/v1/razorpay/verify (HMAC) ─► order Processing,
                       stock reduced (logged), emails sent ─► confirmation page
  (backup) Razorpay webhook payment.captured ─► same completion
```

**Frontend → WordPress:** templates read via `mi_core_*` functions (product view, wishlist,
shop state, COD plan); writes go through WooCommerce form handlers, AJAX or REST, each with a nonce.
**WordPress → WooCommerce:** the plugin uses WooCommerce APIs only (`WC()->cart`, `wc_get_product`,
`wc_get_orders`, `WC_Coupon`, `wc_update_product_stock`, gateway/shipping classes, emails).
**WordPress → database:** through WordPress/WooCommerce APIs, except the two custom tables
(prepared `$wpdb` queries).
