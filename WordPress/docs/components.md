# Components

Each React component and the reusable WordPress piece that replaces it. Template parts are
called with `mi_trends_part( 'components/name', $args )`; they render the same markup and class
names as the original, so the original stylesheet styles them unchanged.

| Original component | WordPress | How to use |
|---|---|---|
| `Header.tsx` | `header.php` | automatic; menus via Appearance → Menus, marquee via MI TRENDS → Settings |
| `Footer.tsx` | `footer.php` | automatic; social links filter `mi_trends_social_links` |
| Newsletter (in Footer) | `template-parts/components/newsletter.php` | `mi_trends_part( 'components/newsletter' )` |
| Navigation / mega-menu links | `inc/navigation.php` → `mi_trends_menu_links( $location )` | locations: primary, mobile-featured, mobile-primary, footer-shop/help/brand/legal |
| `MobileNav.tsx` | `template-parts/components/mobile-nav.php` | opened by any `[data-mi-open="mobile-nav"]` |
| `MobileTabBar.tsx` | `template-parts/components/mobile-tab-bar.php` | hidden on checkout/confirmation/product (`mi_trends_hide_tab_bar()`) |
| `SearchOverlay.tsx` | `template-parts/components/search-overlay.php` (+ `search-suggestion.php`) | `[data-mi-open="search"]` or the `/` key |
| `CartDrawer.tsx` (mini cart) | `template-parts/components/cart-drawer.php` + `cart-drawer-content.php` | `[data-mi-open="cart"]`; refreshed by cart fragments |
| `ProductCard.tsx` | `template-parts/components/product-card.php` | `mi_trends_part( 'components/product-card', array( 'product' => $id, 'compact' => false ) )` |
| Product grid / rail | CSS classes `.product-grid`, `.product-rail` | loop the card inside |
| `ProductVisual.tsx` | `inc/product-visual.php` → `mi_trends_product_visual( $view, array( 'view' => 'front|back|detail|flat' ) )` | |
| `SizeGuide.tsx` | `template-parts/components/size-guide.php` | `[data-mi-open="size-guide"]` |
| Filter bar (`filter-token-bar.tsx`) | `template-parts/components/filter-bar.php` + `assets/js/filter-bar.js` | shop only |
| `SectionHeading` | `template-parts/components/section-heading.php` | args: eyebrow, title, href, link_label |
| Hero carousel | `front-page.php` (`[data-mi-hero]`) + Customizer slides | |
| Category bubbles / mobile stories | `front-page.php`, data `mi_trends_home_categories()` | filter to change |
| Editorial cards, collection tiles, USP strip, offers | `front-page.php`, `single-product.php` | filters `mi_trends_home_editorials`, `mi_trends_home_collection_tiles`, `mi_trends_pdp_offers` |
| `InfoHeader` | `template-parts/components/info-header.php` | args: post or eyebrow/title/intro |
| `AuthShell.tsx` | `template-parts/components/auth-shell.php` | sign-in / sign-up |
| `Toast.tsx` | `assets/js/mi-trends.js` → `window.MITrendsToast( message, 'success'|'error'|'info' )` | |
| Reviews | WooCommerce reviews inside the product page's "Ratings & reviews" accordion | Products → Reviews |
| Wishlist heart | any `[data-mi-wishlist="{product id}"]` button | AJAX `mi_toggle_wishlist` |
| Quick add | any `[data-mi-quick-add="{product id}"]` button | AJAX `mi_quick_add` |
| lucide-react icons | `inc/icons.php` → `mi_trends_icon( 'name', array( 'size' => 18 ) )` | names in `assets/icons/icons.json` |
| Admin `KpiCard`, `Card`, `Badge`, charts | `plugins/mi-trends-core/admin/class-mi-core-admin-pages.php`, `class-mi-core-admin-charts.php` | `.a-kpi`, `.a-card`, `.a-badge` classes from admin.css |

Data helpers (theme → plugin): `mi_trends_product_view()`, `mi_trends_cart_lines()`,
`mi_trends_wishlist_ids()`, `mi_trends_setting()`, `mi_trends_money()` (₹ in Indian grouping).
Each falls back to plain WooCommerce data if the plugin is off.
