# MI TRENDS — meta keys, taxonomies and options

Everything MI Trends Core stores in **standard WordPress/WooCommerce tables**.
All keys start with `_mi_` / `mi_` so they never collide with WooCommerce or other plugins.

## Product meta (`wp_postmeta`, post type `product`)

| Key | Type | Example | Source in the Next.js app |
|---|---|---|---|
| `_mi_colors` | JSON `[{name,hex}]` | `[{"name":"Optic White","hex":"#f4f4f2"}]` | `Product.colors` |
| `_mi_fit` | string | `Regular everyday fit` | `Product.fit` |
| `_mi_fabric` | string | `180 GSM combed cotton jersey` | `Product.fabric` |
| `_mi_art` | string | `Clean lines · No print` | `Product.art` |
| `_mi_palette` | JSON `[ink,accent,paper]` | `["#131313","#ef3f2f","#f3f0ea"]` | `Product.palette` |
| `_mi_cost_price` | number | `378` | `AdminProduct.costPrice` |
| `_mi_popularity` | int | `980` | `Product.popularity` |
| `_mi_seed_rating` | float | `4.6` | `Product.rating` (until real reviews exist) |
| `_mi_seed_review_count` | int | `218` | `Product.reviewCount` (until real reviews exist) |
| `_mi_original_id` | int | `1001` | `Product.id` (traceability) |
| `_mi_seo_title`, `_mi_seo_description` | string | | `AdminProduct.seoTitle/seoDescription` (copy into your SEO plugin) |
| `_mi_discount` | int (derived) | `31` | `Product.discount` — recomputed on save |
| `_mi_effective_rating` | float (derived) | `4.6` | sort key for "Top rated" |
| `_mi_search_index` | string (derived) | `everyday white crew tee everyday icons t-shirt men …` | search haystack |

Prices, SKU, stock, images, gallery, description are WooCommerce's own fields.

## Order meta (`wp_wc_orders_meta` with HPOS, otherwise `wp_postmeta`)

| Key | Meaning |
|---|---|
| `_billing_address_type` | `home` / `work` / `other` ("Save as") |
| `_mi_rzp_order_id` | Razorpay order ID created for this order |
| `_mi_amount_due_now` | amount charged online (full total, or the COD advance) |
| `_mi_cod_advance` / `_mi_cod_balance` | COD split |
| `_mi_cod_advance_paid` | `yes` once the advance is verified |
| `_mi_cod_balance_collected` | `yes` when the order is marked Delivered |
| `_mi_courier`, `_mi_tracking_number`, `_mi_tracking_url` | fulfilment |
| `_mi_status_{status}_at` | ISO time each status was reached |
| `_mi_return_restocked` | `yes` after a Returned order restocked |

Order item meta: `Colour` (visible) and `_mi_color_hex`. Fee item meta: `_mi_fee = mi_cod_fee`.

## Term meta (`wp_termmeta`)

| Taxonomy | Key | Meaning |
|---|---|---|
| `mi_collection` | `mi_tagline`, `mi_motif`, `mi_palette` (JSON) | collection details |
| `pa_size` | `order` | size order (WooCommerce's own key) |

## Taxonomies

| Taxonomy | Terms (imported) | Original |
|---|---|---|
| `product_cat` (WooCommerce) | Men, Women, Unisex | `Product.category` |
| `product_tag` (WooCommerce) | new, bestseller, sale | `Product.tags` |
| `pa_size` (WooCommerce attribute) | XS, S, M, L, XL, XXL | `Product.sizes` |
| `mi_collection` (plugin) | Everyday Icons, Soft Nights | `Collection` |
| `mi_type` (plugin) | T-shirt, Shirt, Pyjama Set | `Product.type` |

## User meta (`wp_usermeta`)

| Key | Meaning |
|---|---|
| `_mi_wishlist` | array of product IDs |
| `_mi_auth_provider` | `password` or `google` |
| `billing_phone`, `billing_*` | WooCommerce customer fields |

## Options (`wp_options`)

| Option | Meaning |
|---|---|
| `mi_core_settings` | store settings (COD rules, shipping amounts, identity, announcements, return address) |
| `mi_core_db_version`, `mi_core_version`, `mi_core_setup_done` | housekeeping |
| `woocommerce_mi_razorpay_upi_settings`, `woocommerce_mi_cod_advance_settings` | gateway settings |
| `theme_mods_mi-trends` | Customizer hero slides |

## Page meta

`_mi_eyebrow`, `_mi_display_title` (use `|` for a line break), `_mi_intro`, `_wp_page_template`.

## Posts

`mi_message` — private post type for contact-form messages (meta `_mi_email`, `_mi_name`, `_mi_order_ref`, `_mi_status`).

## Cookies

`mi_wishlist` (guest wishlist, product IDs, HttpOnly, 30 days). WooCommerce's own cart/session cookies.
