=== MI Trends Core ===
Contributors: mitrends
Tags: woocommerce, india, upi, razorpay, cash on delivery
Requires at least: 6.4
Tested up to: 6.8
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Business logic for the MI TRENDS store on WooCommerce.

== Description ==

MI Trends Core carries everything that made the MI TRENDS Next.js store work,
on top of WooCommerce, independent of the theme:

* Catalogue fields — colours, collection, product type, fit, fabric, artwork, palette, cost price, popularity.
* Shop filters and sorting with the original URL format (?category=men&tag=!sale&type=t-shirt,shirt&q=…&sort=…).
* Colour on every bag line and order item; 10 per line; one coupon at a time; "15% up to ₹400" coupons.
* Checkout rules: account required, Indian address fields and validation, Home/Work/Other.
* Payments through Razorpay: UPI (full amount) and Cash on delivery with a UPI advance and handling fee.
* "MI TRENDS delivery" shipping: free above ₹999, ₹79 below (configurable).
* Order statuses: Confirmed, Packed, Shipped, Delivered, Returned — with customer emails, tracking fields and a printable shipping label.
* Stock movement log; inventory screen with staged edits; low-stock alerts.
* Wishlist (account or cookie), newsletter and notify-me sign-ups, contact messages, order tracking.
* Dashboard, Reports, Customers (tiers), Subscribers, Settings — in wp-admin under MI TRENDS.
* REST API (mi-trends/v1) and WP-CLI (wp mi-trends setup|import|backfill|stock).

Requires WooCommerce. Designed for the "MI TRENDS" theme, which renders the storefront.

== Installation ==

1. Install and activate WooCommerce.
2. Upload mi-trends-core.zip (Plugins → Add New → Upload Plugin) and activate.
3. Add your Razorpay keys to wp-config.php:
   define( 'MI_RAZORPAY_KEY_ID', 'rzp_live_…' );
   define( 'MI_RAZORPAY_KEY_SECRET', '…' );
4. MI TRENDS → Settings → Run store setup, then Import catalogue.
5. WooCommerce → Settings → Payments: enable "UPI" and "Cash on delivery".

Full guide: INSTALLATION.md in the MI TRENDS WordPress package.

== Changelog ==

= 1.0.0 =
* First release: port of the MI TRENDS Next.js storefront and admin panel logic.
