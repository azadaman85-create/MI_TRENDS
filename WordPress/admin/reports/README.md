# Reports

**Map only — the code is in `plugins/mi-trends-core/`. Nothing in this folder is uploaded.**

**Where in wp-admin:** MI TRENDS → Reports (`admin.php?page=mi-trends-reports`); WooCommerce → Analytics

| Original | WordPress | Notes |
|---|---|---|
| `reports/page.tsx` | [`plugins/mi-trends-core/admin/class-mi-core-admin-pages.php`](../../plugins/mi-trends-core/admin/class-mi-core-admin-pages.php) → `reports()` | Range tabs, gross revenue, orders, units, average order, revenue trend, revenue by collection, category mix, top states, CSV export. |
| `calculations` | [`plugins/mi-trends-core/includes/class-mi-core-reports.php`](../../plugins/mi-trends-core/includes/class-mi-core-reports.php) → `reports()` | From WooCommerce orders (HPOS-compatible), cached 10 minutes. |
| `lib/admin/csv.ts` | `admin-post.php?action=mi_core_export&type=revenue|movements|subscribers` | Nonce-protected, formula-injection safe. |
| `— (deeper analysis)` | WooCommerce → Analytics | Refunds, taxes, coupons, cohorts, stock. |
