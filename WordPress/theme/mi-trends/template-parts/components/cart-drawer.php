<?php
/**
 * Cart drawer — CartDrawer.tsx.
 *
 * The React drawer only exists in the DOM while open, and the stylesheet relies
 * on that: `html:has(.drawer-layer)` locks page scroll. So the drawer is kept in
 * a hidden source container and mi-trends.js wraps it in `.drawer-layer` when it
 * opens and puts it back when it closes. The inner `.mi-cart-drawer-content` is
 * refreshed through WooCommerce cart fragments after every cart change.
 *
 * @package MI_Trends
 */

defined( 'ABSPATH' ) || exit;

if ( ! function_exists( 'WC' ) ) {
	return;
}
?>
<div class="mi-overlay-source" data-mi-source="cart" hidden>
	<aside class="drawer cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-drawer-title">
		<div class="sheet-handle" aria-hidden="true"></div>
		<?php mi_trends_part( 'components/cart-drawer-content' ); ?>
	</aside>
</div>
