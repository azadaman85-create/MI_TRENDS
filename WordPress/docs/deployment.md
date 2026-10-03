# Deployment

## What gets uploaded

```text
UPLOAD TO WORDPRESS
├── dist/mi-trends.zip        (theme)   → ends up in wp-content/themes/mi-trends/
└── dist/mi-trends-core.zip   (plugin)  → ends up in wp-content/plugins/mi-trends-core/
```

Nothing else in this folder is uploaded. `templates/`, `admin/`, `docs/`, `database/`,
`assets/`, `tools/` and the `.md` files are documentation and build sources.

Rebuild the zips after any change: `bash tools/package.sh` (it syncs `assets/` first).

## Option A — upload through wp-admin (easiest)

1. **Plugins → Add New Plugin → Upload Plugin** → `mi-trends-core.zip` → Install → Activate.
2. **Appearance → Themes → Add New Theme → Upload Theme** → `mi-trends.zip` → Install → Activate.

If WordPress says "The uploaded file exceeds the upload_max_filesize directive", your host's
limit is below 4.2 MB — raise it in the host panel (PHP settings) or use Option B.

## Option B — the host's File Manager (cPanel, hPanel, Plesk …)

1. Open **File Manager** and go to your WordPress folder (usually `public_html/`).
2. Go into **`wp-content/plugins/`**.
3. **Upload** `mi-trends-core.zip`, then right-click it → **Extract**. You must end up with
   `wp-content/plugins/mi-trends-core/mi-trends-core.php` — *one* `mi-trends-core` folder, not
   `mi-trends-core/mi-trends-core/`. Delete the zip afterwards.
4. Go into **`wp-content/themes/`**, upload `mi-trends.zip`, **Extract**. You must end up with
   `wp-content/themes/mi-trends/style.css`. Delete the zip.
5. In wp-admin: **Plugins** → activate **MI Trends Core** (WooCommerce first), then
   **Appearance → Themes** → activate **MI TRENDS**.

Permissions (if your File Manager shows them): folders `755`, files `644`.

Correct result:

```text
public_html/wp-content/
├── plugins/
│   ├── woocommerce/
│   └── mi-trends-core/
│       ├── mi-trends-core.php
│       ├── includes/ admin/ api/ database/ templates/ assets/ …
└── themes/
    └── mi-trends/
        ├── style.css
        ├── functions.php
        ├── screenshot.png
        └── inc/ template-parts/ page-templates/ woocommerce/ assets/ …
```

Common mistakes:

| Symptom | Cause | Fix |
|---|---|---|
| "The package could not be installed. The theme is missing the style.css stylesheet." | zipped the *contents* instead of the folder, or uploaded the whole `WordPress/` folder | use `dist/mi-trends.zip` as built |
| Theme listed as "broken" | extracted into `themes/mi-trends/mi-trends/` | move the inner folder up one level |
| Plugin not in the list | extracted into `plugins/mi-trends-core/mi-trends-core/` | same |
| "MI Trends Core needs WooCommerce" | WooCommerce inactive | activate WooCommerce |
| Shop shows a plain WooCommerce layout | theme not active, or Cart/Checkout still use blocks | activate MI TRENDS; run MI TRENDS → Settings → Run store setup |

## Option C — SFTP / SSH

```bash
unzip mi-trends-core.zip -d /path/to/wordpress/wp-content/plugins/
unzip mi-trends.zip -d /path/to/wordpress/wp-content/themes/
wp plugin activate woocommerce mi-trends-core
wp theme activate mi-trends
wp mi-trends setup
wp mi-trends import
```

## Option D — WordPress Studio (local site on your Mac/PC)

Studio's **Import** button only accepts *full-site backups* (Jetpack, Local, Playground,
All-in-One `.wpress`, `.sql`, WordPress `.xml`). The theme and plugin zips are not backups, so
importing them fails with **"No suitable importer found for the provided backup contents"**.
A zip containing the two zips fails the same way.

Two ways that work:

**D1 — import the ready-made site (fastest).**
1. Studio → **Add site** → **Import from a backup** (or open an empty site → *Import / Export* → Import).
2. Choose `dist/mi-trends-studio-backup.zip` (31 MB).
3. When it finishes, open the site. WooCommerce, MI Trends Core and the MI TRENDS theme are
   active; store setup and the catalogue import are already done (10 products, coupons, pages).
   Sign in with the admin username/password Studio shows for the site.

Rebuild it after changes with `bash tools/build-studio-backup.sh`.

**D2 — fresh Studio site + the two zips.**
1. Studio → **Add site** → create an empty site → **WP Admin**.
2. Plugins → Add New → install **WooCommerce**; then Upload Plugin → `mi-trends-core.zip`;
   Appearance → Themes → Upload Theme → `mi-trends.zip`; activate all three.
3. MI TRENDS → Settings → **Run store setup**, then **Import catalogue**.

## After uploading (once)

1. MI TRENDS → Settings → **Run store setup**, then **Import catalogue**.
2. `wp-config.php`: `MI_RAZORPAY_KEY_ID`, `MI_RAZORPAY_KEY_SECRET` (and `MI_RAZORPAY_WEBHOOK_SECRET`).
3. WooCommerce → Settings → Payments: enable UPI and Cash on delivery.
4. WooCommerce → Settings → **Site visibility → Live** (new WooCommerce stores start in "Coming soon" mode, visible only to admins).
5. Settings → Reading: untick "Discourage search engines".

## Updating later

Upload the new zip the same way. In wp-admin, WordPress asks "Replace current with uploaded" —
choose **Replace**. Settings, products, orders and custom tables are kept (they live in the
database). With File Manager: delete the old folder, extract the new zip.
After a WooCommerce update, check WooCommerce → Status → **Templates** for outdated overrides.

## Go-live checklist

- [ ] HTTPS works on every page; Settings → General URLs are `https://`.
- [ ] Razorpay **live** keys in wp-config.php; webhook pointed at the live URL; automatic capture on.
- [ ] A real ₹ UPI payment and a COD-advance order placed and refunded.
- [ ] Emails arrive (SMTP plugin connected): order received, status updates, password reset.
- [ ] Site visibility Live; search engines allowed; sitemap submitted.
- [ ] Page cache excludes `/cart/`, `/checkout/`, `/account/*`, `/wishlist/`.
- [ ] Daily backups running and a restore tested.
- [ ] Staff accounts are Shop managers with 2FA; `DISALLOW_FILE_EDIT` set.
- [ ] Legal pages (Terms, Privacy, Returns, Shipping) checked.

## Monitoring & troubleshooting

- PHP errors: set `WP_DEBUG`, `WP_DEBUG_LOG` to true temporarily; read `wp-content/debug.log`.
- WooCommerce → Status → Logs: payment and shipping errors.
- Order stuck in *Pending payment*: the shopper closed Razorpay — they can pay from My account → Orders, or configure the webhook.
- Bag count wrong on cached pages: turn on MI TRENDS → Settings → Operations → *Refresh bag and wishlist counts after page load*.
- `/account/login/` shows 404: Settings → Permalinks → Save (re-flushes rules).
