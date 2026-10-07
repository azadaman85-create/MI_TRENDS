# Components

**Map only — the code is in `theme/mi-trends/` and `plugins/mi-trends-core/`. Nothing in this folder is uploaded.**

Pieces shared by every page.

| Original (Next.js) | WordPress file(s) | Notes |
|---|---|---|
| `components/Header.tsx` | [`theme/mi-trends/header.php`](../../theme/mi-trends/header.php) | Announcement marquee (messages in MI TRENDS → Settings), brand lockup, search trigger, account/wishlist/bag buttons with counts, mobile search bar, desktop nav. |
| `components/Footer.tsx` | [`theme/mi-trends/footer.php`](../../theme/mi-trends/footer.php), [`theme/mi-trends/template-parts/components/newsletter.php`](../../theme/mi-trends/template-parts/components/newsletter.php) | Newsletter (stored in MI TRENDS → Subscribers), four link columns, payment chips, legal row, back-to-top. |
| `navigation links` | [`theme/mi-trends/inc/navigation.php`](../../theme/mi-trends/inc/navigation.php) | Original links by default; assign menus in Appearance → Menus to change them (CSS class `is-sale` = red). |
| `components/MobileNav.tsx` | [`theme/mi-trends/template-parts/components/mobile-nav.php`](../../theme/mi-trends/template-parts/components/mobile-nav.php) |  |
| `components/MobileTabBar.tsx` | [`theme/mi-trends/template-parts/components/mobile-tab-bar.php`](../../theme/mi-trends/template-parts/components/mobile-tab-bar.php) | Hidden on checkout, confirmation and product pages, as before. |
| `components/SearchOverlay.tsx` | [`theme/mi-trends/template-parts/components/search-overlay.php`](../../theme/mi-trends/template-parts/components/search-overlay.php), [`theme/mi-trends/template-parts/components/search-suggestion.php`](../../theme/mi-trends/template-parts/components/search-suggestion.php) | Press `/`; live results from `GET /wp-json/mi-trends/v1/search`. |
| `components/Toast.tsx` | [`theme/mi-trends/assets/js/mi-trends.js`](../../theme/mi-trends/assets/js/mi-trends.js) | `MITrendsToast(message, tone)`; same classes and timing. |
| `SectionHeading (page.tsx)` | [`theme/mi-trends/template-parts/components/section-heading.php`](../../theme/mi-trends/template-parts/components/section-heading.php) |  |
| `lucide-react icons` | [`theme/mi-trends/inc/icons.php`](../../theme/mi-trends/inc/icons.php) + [`theme/mi-trends/assets/icons/icons.json`](../../theme/mi-trends/assets/icons/icons.json) | `mi_trends_icon('heart')`. |
| `app/globals.css` | [`theme/mi-trends/assets/css/storefront-globals.css`](../../theme/mi-trends/assets/css/storefront-globals.css) | Copied unchanged — the whole design system. |
| `StoreProvider.tsx (UI state)` | [`theme/mi-trends/assets/js/mi-trends.js`](../../theme/mi-trends/assets/js/mi-trends.js) | Drawers, search, mobile nav, toasts, wishlist, quick add, hero carousel, product page selectors, forms. |
