# Seed data

Generated from the original Next.js project by `node tools/build-seed.mjs` (read-only on `mi-trends/`).
Do not edit by hand — re-run the script after changing the catalogue in the original.

| File | Contents | Loaded by |
|---|---|---|
| `catalog.json` | 10 products (sizes, per-size stock, MRP/price, colours, collection, type, fit, fabric, art, palette, cost, rating, photos), 3 categories, 2 collections, 3 types, 3 tags | MI TRENDS → Settings → **Import catalogue** / `wp mi-trends import` |
| `coupons.json` | MI10, FIRST15, FLAT200, FREESHIP (active); DROP01, MONSOON, VIP25 (drafts) | same |
| `pages.json` | Wishlist, Info + 15 info pages (copy, FAQs as Details blocks, templates, header fields) | MI TRENDS → Settings → **Run store setup** |
| `woocommerce-products.csv` | the same catalogue for WooCommerce → Products → Import (replace `{{IMAGE_BASE}}`) | optional alternative |

The plugin keeps its own copy in `plugins/mi-trends-core/database/seed/` (synced by `tools/sync-assets.sh`).
