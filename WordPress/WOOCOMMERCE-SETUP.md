# WooCommerce configuration for MI TRENDS

WooCommerce is the e-commerce engine: products, stock, cart, checkout, orders, customers,
coupons, reviews, emails, tax, analytics. MI Trends Core adds the MI TRENDS rules on top.
**(setup)** = applied automatically by MI TRENDS → Settings → Run store setup.

## Store basics — WooCommerce → Settings → General

| Setting | Value | Why |
|---|---|---|
| Store address | your warehouse, country **India** **(setup sets India – Maharashtra if unset)** | shipping origin, tax base |
| Selling location(s) | Sell to specific countries → **India** **(setup)** | original shipped in India only |
| Shipping location(s) | Ship to specific countries → **India** **(setup)** | |
| Currency | **Indian rupee (₹)** **(setup)** | |
| Currency position | Left **(setup)** | `₹899` |
| Thousand / decimal separator | `,` / `.` **(setup)** | |
| Number of decimals | **0** **(setup)** | original showed whole rupees |
| Coupons | enabled **(setup)** | |

The theme formats prices itself in Indian grouping (₹1,29,999), exactly like the original's
`Intl.NumberFormat("en-IN")`; WooCommerce's emails and admin use WooCommerce's format.

## Products — WooCommerce → Settings → Products

| Setting | Value |
|---|---|
| Shop page | **Shop** (`/shop/`) **(setup)** |
| Add to cart behaviour | redirect off, AJAX on **(setup)** (the theme opens the bag drawer) |
| Manage stock | on **(setup)** |
| Low stock threshold | **12** **(setup)** — the original `LOW_STOCK_THRESHOLD`; used by the Inventory screen and dashboard |
| Out of stock threshold | 0 **(setup)** |
| Out of stock visibility | keep sold-out products visible (sizes show crossed out, as before) |
| Reviews | enabled, star ratings on, **only verified owners can review** **(setup)** — "Verified-buyer reviews are shown after delivery" |

### How an MI TRENDS product is built

| Original field | WooCommerce |
|---|---|
| name, slug, SKU, description | product fields |
| MRP / selling price | **Regular price** / **Sale price** on each size variation |
| sizes + `outOfStock` + per-size stock | **Variable product**, attribute **Size** (`pa_size`, "Used for variations"), one variation per size with **Manage stock** and a quantity |
| colours `[{name, hex}]` | **MI TRENDS** tab → Colours (one per line, `Name | #hex`). Shopper picks one; it's saved on the order line. Stock is per size, not per colour (as in the original). |
| collection | **Collections** box (taxonomy `mi_collection`) |
| type (T-shirt/Shirt/Pyjama Set) | **Product types** box (`mi_type`) |
| category men/women/unisex | **Product categories** Men / Women / Unisex |
| tags new/bestseller/sale | **Product tags** `new`, `bestseller`, `sale` (drive the badges and filters) |
| front / back photo | **Product image** / first **Product gallery** image |
| fit, fabric, artwork, palette, cost price, popularity, rating seed | **MI TRENDS** tab |
| featured | the ★ in the product list |
| status active / draft / archived | Published / Draft / Private |

Visibility: "Catalog visibility: Hidden" removes a product from shop, search and homepage rails.

## Shipping — WooCommerce → Settings → Shipping

**(setup)** creates zone **India** (region: India) with the method **MI TRENDS delivery**:
free when the bag subtotal ≥ ₹999, otherwise ₹79 — `FREE_SHIPPING_THRESHOLD` and
`STANDARD_SHIPPING` from the original. The amounts are edited in **MI TRENDS → Settings →
Shipping** (one place, also used by the "Add ₹X more for free shipping" bars). A coupon with
"Allow free shipping" (FREESHIP) makes it free too.

Shipping options: "Calculations → Hide shipping costs until an address is entered" off;
"Shipping destination" **Force shipping to the customer billing address** **(setup)** — the
original had a single delivery address.

Courier integration (labels/AWB from Shiprocket, Delhivery etc.) is not part of the original;
install the courier's WooCommerce plugin if you want automated booking. Until then, staff type
courier + AWB into the order's **MI TRENDS fulfilment** box, which the customer sees in emails
and on Track order.

## Payments — WooCommerce → Settings → Payments

The original took **UPI** and **Cash on delivery with a UPI advance**, both through Razorpay.
MI Trends Core provides both as WooCommerce gateways:

| Gateway | What happens |
|---|---|
| **MI TRENDS — UPI (Razorpay)** | full order total charged by Razorpay Standard Checkout |
| **MI TRENDS — Cash on delivery (UPI advance)** | 20% (configurable) charged now by UPI; courier collects the rest + ₹49 handling fee; offered only when the bag (after coupons) is above ₹800; hidden/disabled otherwise with the reason shown |

Keys (never commit them, never put them in code):

```php
// wp-config.php
define( 'MI_RAZORPAY_KEY_ID', 'rzp_test_…' );          // public key id
define( 'MI_RAZORPAY_KEY_SECRET', '…' );               // secret — server only
define( 'MI_RAZORPAY_WEBHOOK_SECRET', '…' );           // optional, for the webhook
```

(or fill them on the UPI gateway screen; constants win). Then:

1. Enable both gateways; titles default to "UPI" and "Cash on delivery".
2. Razorpay Dashboard → Payment capture → **Automatic**.
3. Optional webhook: `https://your-domain/wp-json/mi-trends/v1/razorpay/webhook`, event `payment.captured`.
4. Test with `rzp_test_` keys and the UPI ID `success@razorpay` (and `failure@razorpay`).

COD rules live in **MI TRENDS → Settings → Cash on delivery** (on/off, minimum ₹800,
advance 20%, fee ₹49). Refunds: the order's **Refund** button refunds through Razorpay up to
the amount paid online; refund any cash collected on delivery separately.

Alternative: the official **Razorpay for WooCommerce** plugin also works for full UPI/card
payments (disable "MI TRENDS — UPI" if you use it), but it has no COD-advance mode.

## Accounts & privacy — WooCommerce → Settings → Accounts & Privacy

| Setting | Value |
|---|---|
| Guest checkout | **off** **(setup)** — the original required an account |
| Log-in reminder / create account at checkout | off **(setup)** — signed-out shoppers are sent to `/account/signup/?next=/checkout/` |
| Account creation on "My account" | **on** **(setup)** |
| Generate username from email | on **(setup)** |
| Send password setup link | **off** **(setup)** — shoppers choose a password (min. 8 chars), as before |
| Privacy policy | Info → Privacy policy |

Sign-up asks for full name, email, Indian mobile (+91) and password, with the original messages.

## Tax — WooCommerce → Settings → Tax

The original priced everything **inclusive of tax** ("Inclusive of all taxes"). **(setup)** sets
"Prices entered with tax: Yes". Whether to turn tax calculation on is a business decision:

- Not GST-registered / don't need tax lines: leave **Enable tax rates and calculations** off.
- GST-registered: enable taxes, add standard rates for India (e.g. apparel 5% / 12% by price
  band — confirm with your accountant), keep prices entered *inclusive*, and consider a GST
  invoice plugin (e.g. "PDF Invoices & Packing Slips" with GSTIN). Prices shown don't change
  because they include tax.

## Emails — WooCommerce → Settings → Emails

| | |
|---|---|
| From name / address | `MI TRENDS` **(setup sets the name)** / an address on your domain |
| Colours | base `#171716`, background `#f3f0ea`, body `#fffdf9`, text `#131313` **(setup)** |
| Header image | upload the MI TRENDS logo (optional) |
| Footer text | e.g. `MI TRENDS · Made with care in India · support@mitrends.in` |

Emails sent: New order (to you), Processing order / order received, **MI TRENDS order update**
(Confirmed, Packed, Shipped with tracking, Delivered, Returned), Completed, Cancelled, Refunded,
Customer note, Reset password, New account. All can be switched off individually.
Use an SMTP plugin (WP Mail SMTP) so they arrive.

## Order statuses

| Status | Meaning | Customer email |
|---|---|---|
| Pending payment | order created, Razorpay not completed | — |
| **Processing** | paid (or COD advance paid) — new order to confirm | order received |
| **Confirmed** | checked, going to packing | order update |
| **Packed** | packed, ready to ship | order update |
| **Shipped** | handed to courier (add courier + AWB first) | order update with tracking |
| **Delivered** | delivered; COD balance marked collected | order update |
| Completed | optional final state (treated like Delivered) | completed |
| Cancelled | stock returned automatically | cancelled |
| **Returned** | item came back; stock added back (setting) | order update |
| Refunded | money returned | refunded |

Bulk "Change status to …" works for all of them on WooCommerce → Orders.

## Coupons — Marketing → Coupons

Imported:

| Code | Rule | WooCommerce setup |
|---|---|---|
| `MI10` | 10% off | Percentage, 10 |
| `FLAT200` | ₹200 off on ₹1,499+ | Fixed cart 200, minimum spend 1499 |
| `FIRST15` | 15% off up to ₹400 on ₹999+ | Fixed cart **400**, minimum 999, **MI TRENDS: percent, capped = 15** |
| `FREESHIP` | free shipping on ₹699+ | Fixed cart 0, Allow free shipping, minimum 699 |
| `DROP01`, `VIP25`, `MONSOON` | panel demo codes | saved as drafts |

One code per bag (applying a new code replaces the old one), as in the original; messages match
("FLAT200 works on orders of ₹1,499 or more."). Usage counts start at zero.

## Reviews — Products → Reviews

Moderate (approve/spam/trash) like the original Reviews queue. Until a product has its own
approved reviews, its card shows the imported rating and count; from the first real review on,
WooCommerce's real average and count are shown and used for "Top rated" sorting.

## Analytics

WooCommerce → Analytics covers revenue, orders, products, categories, coupons, taxes and stock
over any date range. MI TRENDS → Dashboard / Reports give the original panel's quick views.
Include the custom statuses in Analytics: WooCommerce → Settings → Analytics → "Actionable
statuses" (Processing, Confirmed, Packed) and leave "Excluded statuses" to Cancelled/Failed/Pending.

## Advanced — WooCommerce → Settings → Advanced

- Page setup: Cart = **Bag**, Checkout = **Checkout**, My account = **Account** **(setup)**.
- Cart and Checkout must contain the classic shortcodes `[woocommerce_cart]` /
  `[woocommerce_checkout]` — **(setup)** converts them (the previous block content is kept in a
  custom field `_mi_previous_content`). The MI TRENDS templates don't apply to the Cart/Checkout *blocks*.
- Features → **High-performance order storage**: supported (recommended for new stores).
- REST API keys: only if an external system (ERP, courier) needs them; never share admin passwords.

## Third-party plugins (optional)

| Need | Suggested plugin |
|---|---|
| Reliable email | WP Mail SMTP |
| Google sign-in (original had it) | Nextend Social Login — its Google button appears automatically on sign-in/sign-up |
| SEO | Rank Math or Yoast SEO |
| Backups | UpdraftPlus / host backups |
| Security & 2FA | Wordfence or Solid Security; Two Factor |
| Caching | host cache, WP Rocket or LiteSpeed Cache (see WORDPRESS-SETUP.md for exclusions) |
| GST invoices | PDF Invoices & Packing Slips for WooCommerce |
| Courier automation | your courier's WooCommerce plugin (Shiprocket, Delhivery …) |
| Image optimisation | EWWW / ShortPixel / Imagify |
