# admin/ — where each admin-panel screen lives in WordPress

**This folder is a map, not code. Do not upload it.**

The original admin panel (`/admin` in the Next.js app) is now split between WooCommerce's own
screens and the **MI TRENDS** menu added by the plugin. The code is in
[`plugins/mi-trends-core/admin/`](../plugins/mi-trends-core/admin/) — WordPress only runs plugin
code from `wp-content/plugins/`, so it can't live here.

| Original screen | In wp-admin | Folder |
|---|---|---|
| Dashboard | **MI TRENDS → Dashboard** | [dashboard/](dashboard/) |
| Orders, order detail, shipping label | **WooCommerce → Orders** + *MI TRENDS fulfilment* box | [orders/](orders/) |
| Products, product editor, categories, collections, reviews, coupons | **Products**, **Marketing → Coupons** | [products/](products/) |
| Inventory | **MI TRENDS → Inventory** | [inventory/](inventory/) |
| Customers, customer profile | **MI TRENDS → Customers** → Users / Orders | [customers/](customers/) |
| Reports | **MI TRENDS → Reports** (+ WooCommerce → Analytics) | [reports/](reports/) |
| Settings, banners, login | **MI TRENDS → Settings**, Appearance → Customize, wp-login | [settings/](settings/) |

Who can see it: the MI TRENDS menu needs the `manage_woocommerce` capability (Administrator,
Shop manager). Messages need `edit_shop_orders`.

Design: the screens reuse the original `app/admin/admin.css` unchanged
([`assets/css/admin-panel.css`](../plugins/mi-trends-core/assets/css/admin-panel.css)) inside an
`.admin-root` wrapper, plus a small WordPress fit file
([`admin-wp.css`](../plugins/mi-trends-core/assets/css/admin-wp.css)).
