# Customers

**Map only — the code is in `plugins/mi-trends-core/`. Nothing in this folder is uploaded.**

**Where in wp-admin:** MI TRENDS → Customers (`admin.php?page=mi-trends-customers`)

| Original | WordPress | Notes |
|---|---|---|
| `customers/page.tsx` | [`plugins/mi-trends-core/admin/class-mi-core-admin-pages.php`](../../plugins/mi-trends-core/admin/class-mi-core-admin-pages.php) → `customers()` | Search, tier tabs with counts, mobile, city, orders, lifetime value, joined. |
| `tier rule` | [`plugins/mi-trends-core/includes/class-mi-core-reports.php`](../../plugins/mi-trends-core/includes/class-mi-core-reports.php) → `tier()` | VIP above ₹12,000 lifetime spend, regular after 3 orders, otherwise new — the original rule. |
| `customers/[id]/page.tsx` | Users → edit user; orders filtered by customer | Name links to the user, order count links to their orders. |
| `— (accounts)` | [`plugins/mi-trends-core/includes/class-mi-core-accounts.php`](../../plugins/mi-trends-core/includes/class-mi-core-accounts.php) | Customers are WordPress users (role Customer). |
| `— (messages, subscribers)` | MI TRENDS → Messages, MI TRENDS → Subscribers | Contact form messages; newsletter / notify-me sign-ups with CSV export. |
