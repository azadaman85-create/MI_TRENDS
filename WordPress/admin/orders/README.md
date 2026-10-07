# Orders

**Map only — the code is in `plugins/mi-trends-core/`. Nothing in this folder is uploaded.**

**Where in wp-admin:** WooCommerce → Orders; open an order for the *MI TRENDS fulfilment* box

| Original | WordPress | Notes |
|---|---|---|
| `app/admin/(panel)/orders/page.tsx` | WooCommerce → Orders | Status tabs, search (also by `MIT…` number), bulk **Change status to confirmed / packed / shipped / delivered / returned**. |
| `orders/[id]/page.tsx` | WooCommerce order screen + [`plugins/mi-trends-core/admin/class-mi-core-admin-orders.php`](../../plugins/mi-trends-core/admin/class-mi-core-admin-orders.php) | Status dropdown, items (with Colour), payment, customer, address type, notes = timeline. Box: COD advance/balance, courier, AWB, tracking link. |
| `components/admin/ShippingLabel.tsx` | [`plugins/mi-trends-core/admin/class-mi-core-admin-orders.php`](../../plugins/mi-trends-core/admin/class-mi-core-admin-orders.php) → `label_page()` | **Print shipping label** button; same layout, dispatch reference, COD collect amount, contents, return address (MI TRENDS → Settings). |
| `OrderStatus (pending…returned)` | [`plugins/mi-trends-core/includes/class-mi-core-order-status.php`](../../plugins/mi-trends-core/includes/class-mi-core-order-status.php) | Custom statuses Confirmed, Packed, Shipped, Delivered, Returned; Delivered marks the COD balance collected; Returned restocks (setting). |
| `— (emails)` | [`plugins/mi-trends-core/includes/emails/class-mi-core-email-status-update.php`](../../plugins/mi-trends-core/includes/emails/class-mi-core-email-status-update.php) | Customer email on each status; editable in WooCommerce → Settings → Emails. |
| `lib/order-inbox.ts` | WooCommerce orders | Orders are real; nothing to sync. |
