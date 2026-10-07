# Bag (cart)

**Map only — the code is in `theme/mi-trends/` and `plugins/mi-trends-core/`. Nothing in this folder is uploaded.**

The bag page and the slide-in bag drawer.

| Original (Next.js) | WordPress file(s) | Notes |
|---|---|---|
| `app/(store)/cart/page.tsx (filled)` | [`theme/mi-trends/woocommerce/cart/cart.php`](../../theme/mi-trends/woocommerce/cart/cart.php) | Lines with colour/size, quantity ±, remove, clear bag, coupon box with code hints, price summary (item total at MRP, product discount, coupon, shipping, total), "Complete the look". Uses WooCommerce's cart form handler (nonce-protected). |
| `app/(store)/cart/page.tsx (empty)` | [`theme/mi-trends/woocommerce/cart/cart-empty.php`](../../theme/mi-trends/woocommerce/cart/cart-empty.php) | First four catalogue pieces, as in the original. |
| `components/CartDrawer.tsx` | [`theme/mi-trends/template-parts/components/cart-drawer.php`](../../theme/mi-trends/template-parts/components/cart-drawer.php) + [`theme/mi-trends/template-parts/components/cart-drawer-content.php`](../../theme/mi-trends/template-parts/components/cart-drawer-content.php) | Refreshed through WooCommerce cart fragments after every change; opened by [`theme/mi-trends/assets/js/mi-trends.js`](../../theme/mi-trends/assets/js/mi-trends.js). |
| `StoreProvider.tsx (bag rules)` | [`plugins/mi-trends-core/includes/class-mi-core-cart.php`](../../plugins/mi-trends-core/includes/class-mi-core-cart.php), [`plugins/mi-trends-core/includes/class-mi-core-coupons.php`](../../plugins/mi-trends-core/includes/class-mi-core-coupons.php) | Colour per line, max 10 per line, one coupon at a time, FIRST15 = 15% capped at ₹400, original messages. |
