# Pages

**Map only — the code is in `theme/mi-trends/` and `plugins/mi-trends-core/`. Nothing in this folder is uploaded.**

Site pages that are not part of the shop/checkout flow.

| Original (Next.js) | WordPress file(s) | Notes |
|---|---|---|
| `app/(store)/page.tsx (Home)` | [`theme/mi-trends/front-page.php`](../../theme/mi-trends/front-page.php) | All sections: mobile stories, hero carousel, coupon ticker, mobile feed tabs, category rail, Trending, editorials, New drops, USP strip, Under ₹799, Shop the edits. Hero slides are edited in Appearance → Customize → MI TRENDS homepage ([`theme/mi-trends/inc/customizer.php`](../../theme/mi-trends/inc/customizer.php)). Product lists come from `mi_core_home_products()` ([`plugins/mi-trends-core/includes/class-mi-core-catalog.php`](../../plugins/mi-trends-core/includes/class-mi-core-catalog.php)). |
| `app/(store)/info/[slug] — about, careers, press, shipping, returns, terms, privacy, accessibility` | [`theme/mi-trends/page.php`](../../theme/mi-trends/page.php) + [`theme/mi-trends/template-parts/components/info-header.php`](../../theme/mi-trends/template-parts/components/info-header.php) | Ordinary WordPress pages under **Info**; edit text in Pages. Header fields (eyebrow, headline with `|` line breaks, intro) are in the page's *MI TRENDS page header* box. |
| `info/gift-cards, info/stores` | [`theme/mi-trends/page-templates/info-notify.php`](../../theme/mi-trends/page-templates/info-notify.php) | Page template *Info — with "Get notified" form*; sign-ups go to MI TRENDS → Subscribers. |
| `info/contact` | [`theme/mi-trends/page-templates/info-contact.php`](../../theme/mi-trends/page-templates/info-contact.php) | Messages saved to MI TRENDS → Messages and emailed to the support address. |
| `info/faqs` | [`theme/mi-trends/page-templates/info-faqs.php`](../../theme/mi-trends/page-templates/info-faqs.php) | Questions are Details blocks in the page content (editable). |
| `info/track-order` | [`theme/mi-trends/page-templates/info-track-order.php`](../../theme/mi-trends/page-templates/info-track-order.php) | Real order lookup: `POST /wp-json/mi-trends/v1/track-order`. |
| `info/size-guide` | [`theme/mi-trends/page-templates/info-size-guide.php`](../../theme/mi-trends/page-templates/info-size-guide.php) | Tables from `mi_trends_size_rows()` in [`theme/mi-trends/inc/helpers.php`](../../theme/mi-trends/inc/helpers.php). |
| `info/account` | [`theme/mi-trends/page-templates/info-account.php`](../../theme/mi-trends/page-templates/info-account.php) |  |
| `app/(store)/wishlist/page.tsx` | [`theme/mi-trends/page-templates/wishlist.php`](../../theme/mi-trends/page-templates/wishlist.php) | Page template *Wishlist*; data from [`plugins/mi-trends-core/includes/class-mi-core-wishlist.php`](../../plugins/mi-trends-core/includes/class-mi-core-wishlist.php). |
| `NotFoundInfo (404)` | [`theme/mi-trends/404.php`](../../theme/mi-trends/404.php), [`theme/mi-trends/template-parts/content-none.php`](../../theme/mi-trends/template-parts/content-none.php) |  |
| `— (no blog in the original)` | [`theme/mi-trends/index.php`](../../theme/mi-trends/index.php), [`theme/mi-trends/single.php`](../../theme/mi-trends/single.php), [`theme/mi-trends/archive.php`](../../theme/mi-trends/archive.php), [`theme/mi-trends/search.php`](../../theme/mi-trends/search.php), [`theme/mi-trends/sidebar.php`](../../theme/mi-trends/sidebar.php) | Required WordPress fallbacks, styled like the info pages. |

Styling: page-specific styles from each original `<style jsx>` are in [`theme/mi-trends/assets/css/pages.css`](../../theme/mi-trends/assets/css/pages.css) (source copy: `assets/css/pages.css`).
