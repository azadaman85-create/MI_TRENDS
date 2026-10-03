# Inventory

**Map only — the code is in `plugins/mi-trends-core/`. Nothing in this folder is uploaded.**

**Where in wp-admin:** MI TRENDS → Inventory (`admin.php?page=mi-trends-inventory`)

| Original | WordPress | Notes |
|---|---|---|
| `inventory/page.tsx` | [`plugins/mi-trends-core/admin/class-mi-core-admin-pages.php`](../../plugins/mi-trends-core/admin/class-mi-core-admin-pages.php) → `inventory()` + [`plugins/mi-trends-core/assets/js/admin.js`](../../plugins/mi-trends-core/assets/js/admin.js) | Products × sizes grid, edits staged until **Save N changes**, All / Low stock / Sold out tabs, units on hand, stock value at cost, low/sold-out counts. |
| `— (requirement: stock movement)` | [`plugins/mi-trends-core/includes/class-mi-core-inventory.php`](../../plugins/mi-trends-core/includes/class-mi-core-inventory.php) | Every change logged with its reason (order, restock, return, adjustment, edit, import) in `wp_mi_stock_movements`; latest 30 shown, CSV export. |
| `LOW_STOCK_THRESHOLD = 12` | WooCommerce → Settings → Products → Inventory | One setting, WooCommerce's. |
| `lib/stock-feed.ts` | variation stock + `GET/POST /wp-json/mi-trends/v1/stock` | The storefront reads stock directly; no sync needed. |
| `— (CLI)` | `wp mi-trends stock` | Stock table in the terminal. |
