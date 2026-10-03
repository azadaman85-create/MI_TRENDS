# Products

**Map only — the code is in `theme/mi-trends/` and `plugins/mi-trends-core/`. Nothing in this folder is uploaded.**

Product detail page and everything that displays a product.

| Original (Next.js) | WordPress file(s) | Notes |
|---|---|---|
| `app/(store)/product/[slug]/page.tsx` | [`theme/mi-trends/woocommerce/single-product.php`](../../theme/mi-trends/woocommerce/single-product.php) | Four-view gallery, colour + size pickers (sold-out sizes crossed out, "only N left" badge at ≤3), quantity 1–5, Add to bag / Buy now, pincode check, assurances, offers, accordions (details, shipping, reviews), related products, mobile buy bar. Works without JavaScript (posts to WooCommerce's add-to-cart). |
| `components/ProductCard.tsx` | [`theme/mi-trends/template-parts/components/product-card.php`](../../theme/mi-trends/template-parts/components/product-card.php) | Hover front/back, New/Bestseller + % off badges, wishlist heart, quick add (first in-stock size, first colour), swatches, rating. |
| `components/ProductVisual.tsx` | [`theme/mi-trends/inc/product-visual.php`](../../theme/mi-trends/inc/product-visual.php) | Same 480×640 SVG with the photo, scrim and MI / 01 pill; illustrated fallback when a product has no photo. |
| `components/SizeGuide.tsx` | [`theme/mi-trends/template-parts/components/size-guide.php`](../../theme/mi-trends/template-parts/components/size-guide.php) | Tops / bottoms / shoes table picked by product type. |
| `lib/types.ts Product` | [`plugins/mi-trends-core/includes/class-mi-core-product-data.php`](../../plugins/mi-trends-core/includes/class-mi-core-product-data.php) | `mi_core_product_view()` builds the same shape from WooCommerce data; fields edited in the product editor's **MI TRENDS** tab ([`plugins/mi-trends-core/admin/class-mi-core-admin-products.php`](../../plugins/mi-trends-core/admin/class-mi-core-admin-products.php)). |
| `lib/catalog.ts (related, popular)` | [`plugins/mi-trends-core/includes/class-mi-core-catalog.php`](../../plugins/mi-trends-core/includes/class-mi-core-catalog.php) |  |
