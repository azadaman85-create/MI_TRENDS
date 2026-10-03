# Shop

**Map only — the code is in `theme/mi-trends/` and `plugins/mi-trends-core/`. Nothing in this folder is uploaded.**

The product listing, filters and sorting.

| Original (Next.js) | WordPress file(s) | Notes |
|---|---|---|
| `app/(store)/shop/page.tsx` | [`theme/mi-trends/woocommerce/archive-product.php`](../../theme/mi-trends/woocommerce/archive-product.php) | Breadcrumb, title that follows the filters ("The sale edit", "Men's edit", "Results for …"), count, sort, grid, empty state, pagination (48 per page). |
| `components/ui/filter-token-bar.tsx` | [`theme/mi-trends/template-parts/components/filter-bar.php`](../../theme/mi-trends/template-parts/components/filter-bar.php) + [`theme/mi-trends/assets/js/filter-bar.js`](../../theme/mi-trends/assets/js/filter-bar.js) | Same classes and CSS ([`theme/mi-trends/assets/css/filter-token-bar.css`](../../theme/mi-trends/assets/css/filter-token-bar.css), unchanged). Tokens render server-side; the script adds the popovers. |
| `shop filtering logic (parseFilters, matchesFilter, sort)` | [`plugins/mi-trends-core/includes/class-mi-core-shop-query.php`](../../plugins/mi-trends-core/includes/class-mi-core-shop-query.php) | Same URL format: `?category=men&tag=!sale&type=t-shirt,shirt&size=m&collection=…&price=under-799&discount=20&q=…&sort=price-asc`. Aliases `gender`, `maxPrice=799`, `browse=collections` still work. |
| `search overlay → /shop?q=` | [`theme/mi-trends/template-parts/components/search-overlay.php`](../../theme/mi-trends/template-parts/components/search-overlay.php) | WordPress `?s=` searches and category/tag/collection archive URLs redirect to the shop with the matching filter. |
| `WooCommerce loops elsewhere (shortcodes/blocks)` | [`theme/mi-trends/woocommerce/content-product.php`](../../theme/mi-trends/woocommerce/content-product.php) | Uses the same product card. |
