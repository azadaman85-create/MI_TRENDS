# Settings

**Map only — the code is in `plugins/mi-trends-core/`. Nothing in this folder is uploaded.**

**Where in wp-admin:** MI TRENDS → Settings (`admin.php?page=mi-trends-settings`); WooCommerce → Settings; Appearance → Customize

| Original | WordPress | Notes |
|---|---|---|
| `settings/page.tsx` | [`plugins/mi-trends-core/admin/class-mi-core-admin-pages.php`](../../plugins/mi-trends-core/admin/class-mi-core-admin-pages.php) → `settings()`; storage [`plugins/mi-trends-core/includes/class-mi-core-settings.php`](../../plugins/mi-trends-core/includes/class-mi-core-settings.php) | Store identity, COD (on/off, minimum, advance %, fee), shipping amounts, delivery days, announcement bar, return address, restock returns, refresh counts for cached pages. |
| `lib/store-settings.ts` | option `mi_core_settings` | Same defaults: COD min ₹800, 20% advance, ₹49 fee, free shipping ₹999, standard ₹79. |
| `— (setup)` | **Run store setup** / **Import catalogue** buttons ([`plugins/mi-trends-core/includes/class-mi-core-seeder.php`](../../plugins/mi-trends-core/includes/class-mi-core-seeder.php)) | Also `wp mi-trends setup` / `wp mi-trends import`. |
| `Payments (Razorpay keys)` | WooCommerce → Settings → Payments, or `wp-config.php` constants | `MI_RAZORPAY_KEY_ID`, `MI_RAZORPAY_KEY_SECRET`, `MI_RAZORPAY_WEBHOOK_SECRET`. |
| `banners/page.tsx` | Appearance → Customize → MI TRENDS homepage ([`theme/mi-trends/inc/customizer.php`](../../theme/mi-trends/inc/customizer.php)) | Hero slides (text, link, image, colours). The original banners screen wasn't connected to the storefront; the homepage hero is. |
| `admin/login/page.tsx + lib/admin/auth.tsx` | wp-login.php | Real accounts per staff member (role Shop manager), password hashing, reset, optional 2FA. |
