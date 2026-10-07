# Dashboard

**Map only — the code is in `plugins/mi-trends-core/`. Nothing in this folder is uploaded.**

**Where in wp-admin:** MI TRENDS → Dashboard (`admin.php?page=mi-trends`)

| Original | WordPress | Notes |
|---|---|---|
| `app/admin/(panel)/page.tsx` | [`plugins/mi-trends-core/admin/class-mi-core-admin-pages.php`](../../plugins/mi-trends-core/admin/class-mi-core-admin-pages.php) → `dashboard()` | Range 7/30/90 days, CSV export, 6 KPI cards (revenue with % change, orders, new customers, products, low stock, awaiting confirmation). |
| `— (requirement)` | same | **Fulfilment pipeline**: New/processing, Confirmed, Packing, Shipment, Delivered, Returns, Cancelled — each links to the filtered order list. |
| `charts/AreaChart, Donut, BarChart` | [`plugins/mi-trends-core/admin/class-mi-core-admin-charts.php`](../../plugins/mi-trends-core/admin/class-mi-core-admin-charts.php) | Revenue chart, order-status donut, best sellers, payment mix — server-rendered SVG, no chart library. |
| `lib/admin/data.ts (figures)` | [`plugins/mi-trends-core/includes/class-mi-core-reports.php`](../../plugins/mi-trends-core/includes/class-mi-core-reports.php) → `dashboard()` | Real WooCommerce orders, cached 10 minutes, cleared on any order change. Same rules: cancelled excluded, returned counted. |
| `— (API)` | `GET /wp-json/mi-trends/v1/dashboard?days=30` | Same figures as JSON (staff only). |
