<?php
/**
 * Mobile tab bar — MobileTabBar.tsx. Home, Explore, Search, Wishlist, Bag.
 * Not rendered on checkout, the order confirmation or product pages.
 *
 * @package MI_Trends
 */

defined( 'ABSPATH' ) || exit;

$mi_is_home     = is_front_page();
$mi_is_shop     = function_exists( 'is_shop' ) && ( is_shop() || is_product_taxonomy() );
$mi_wish_page   = get_page_by_path( 'wishlist' );
$mi_is_wishlist = $mi_wish_page && is_page( $mi_wish_page->ID );
$mi_is_cart     = function_exists( 'is_cart' ) && is_cart();
$mi_wishlist    = count( mi_trends_wishlist_ids() );
$mi_cart_count  = mi_trends_cart_count();

/**
 * One tab's icon + label + indicator.
 *
 * @param string $icon   Icon name.
 * @param string $label  Label.
 * @param bool   $active Active state.
 * @param string $badge  Badge markup.
 */
$mi_tab_inner = static function ( $icon, $label, $active, $badge = '' ) {
	echo '<span class="mobile-tab-icon-wrap">';
	mi_trends_icon( $icon, array( 'size' => 22, 'stroke_width' => $active ? 2.4 : 1.9 ) );
	echo $badge; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built below with escaped values.
	echo '</span><span class="mobile-tab-label">' . esc_html( $label ) . '</span>';
	echo '<span class="mobile-tab-indicator" aria-hidden="true"' . ( $active ? '' : ' hidden' ) . '></span>';
};

$mi_badge = static function ( $count, $kind, $accent = false ) {
	return sprintf(
		'<span class="mobile-tab-badge%1$s" aria-hidden="true" data-mi-count="%2$s"%3$s>%4$s</span>',
		$accent ? ' is-accent' : '',
		esc_attr( $kind ),
		$count ? '' : ' hidden',
		esc_html( $count > 99 ? '99+' : (string) $count )
	);
};
?>
<nav class="mobile-tab-bar" aria-label="<?php esc_attr_e( 'Mobile application navigation', 'mi-trends' ); ?>">
	<div class="mobile-tab-bar__inner">
		<a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="mobile-tab-item<?php echo $mi_is_home ? ' is-active' : ''; ?>" aria-label="<?php esc_attr_e( 'Home', 'mi-trends' ); ?>"<?php echo $mi_is_home ? ' aria-current="page"' : ''; ?>>
			<?php $mi_tab_inner( 'home', __( 'Home', 'mi-trends' ), $mi_is_home ); ?>
		</a>

		<a href="<?php echo esc_url( mi_trends_shop_url() ); ?>" class="mobile-tab-item<?php echo $mi_is_shop ? ' is-active' : ''; ?>" aria-label="<?php esc_attr_e( 'Shop', 'mi-trends' ); ?>"<?php echo $mi_is_shop ? ' aria-current="page"' : ''; ?>>
			<?php $mi_tab_inner( 'compass', __( 'Explore', 'mi-trends' ), $mi_is_shop ); ?>
		</a>

		<button type="button" class="mobile-tab-item" data-mi-open="search" data-mi-tab="search" aria-label="<?php esc_attr_e( 'Search catalog', 'mi-trends' ); ?>">
			<?php $mi_tab_inner( 'search', __( 'Search', 'mi-trends' ), false ); ?>
		</button>

		<a href="<?php echo esc_url( mi_trends_wishlist_url() ); ?>" class="mobile-tab-item<?php echo $mi_is_wishlist ? ' is-active' : ''; ?>"
			aria-label="<?php echo esc_attr( sprintf( /* translators: %d: count */ __( 'Wishlist with %d saved items', 'mi-trends' ), $mi_wishlist ) ); ?>"<?php echo $mi_is_wishlist ? ' aria-current="page"' : ''; ?>>
			<?php $mi_tab_inner( 'heart', __( 'Wishlist', 'mi-trends' ), $mi_is_wishlist, $mi_badge( $mi_wishlist, 'wishlist' ) ); ?>
		</a>

		<button type="button" class="mobile-tab-item<?php echo $mi_is_cart ? ' is-active' : ''; ?>" data-mi-open="cart" data-mi-tab="cart"
			aria-label="<?php echo esc_attr( sprintf( /* translators: %d: count */ __( 'Shopping bag with %d items', 'mi-trends' ), $mi_cart_count ) ); ?>">
			<?php $mi_tab_inner( 'shopping-bag', __( 'Bag', 'mi-trends' ), $mi_is_cart, $mi_badge( $mi_cart_count, 'cart', true ) ); ?>
		</button>
	</div>
</nav>
