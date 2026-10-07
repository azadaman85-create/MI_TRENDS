# Products, categories, collections, reviews, coupons

**Map only — the code is in `plugins/mi-trends-core/`. Nothing in this folder is uploaded.**

**Where in wp-admin:** Products; Products → Categories / Collections / Product types / Reviews; Marketing → Coupons

| Original | WordPress | Notes |
|---|---|---|
| `products/page.tsx (list)` | Products → All Products | Search, status filters, category filter, bulk actions — WooCommerce. Collection and Product type columns added. |
| `components/admin/ProductEditor.tsx` | WooCommerce product editor + **MI TRENDS** tab ([`plugins/mi-trends-core/admin/class-mi-core-admin-products.php`](../../plugins/mi-trends-core/admin/class-mi-core-admin-products.php)) | Variable product, Size attribute → one variation per size with price and stock. MI TRENDS tab: colours, fit, fabric, artwork, palette, cost price, popularity, imported rating. |
| `ProductImageUploader.tsx` | Product image + Product gallery | First gallery image = back view. |
| `categories/page.tsx` | Products → Categories | Men / Women / Unisex. |
| `collections/page.tsx` | Products → Collections ([`plugins/mi-trends-core/includes/class-mi-core-taxonomies.php`](../../plugins/mi-trends-core/includes/class-mi-core-taxonomies.php)) | Tagline, motif, palette. |
| `reviews/page.tsx` | Products → Reviews | Approve / spam / trash. |
| `coupons/page.tsx` | Marketing → Coupons ([`plugins/mi-trends-core/includes/class-mi-core-coupons.php`](../../plugins/mi-trends-core/includes/class-mi-core-coupons.php)) | Extra field *MI TRENDS: percent, capped* for "15% up to ₹400". |
| `Import` | MI TRENDS → Settings → Import catalogue ([`plugins/mi-trends-core/includes/class-mi-core-seeder.php`](../../plugins/mi-trends-core/includes/class-mi-core-seeder.php)) | Or `wp mi-trends import`. |
