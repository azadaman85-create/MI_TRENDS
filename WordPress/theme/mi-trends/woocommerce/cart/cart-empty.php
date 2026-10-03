<?php
/**
 * Empty bag — app/(store)/cart/page.tsx (empty state) with four trending pieces.
 *
 * @package MI_Trends
 * @version 7.0.1 (WooCommerce template version this override was written against)
 */

defined( 'ABSPATH' ) || exit;

// The original shows the first four catalogue pieces (products.slice(0, 4)); the import keeps catalogue order in menu_order.
$mi_trending = wc_get_products(
	array(
		'limit'   => 4,
		'orderby' => 'menu_order',
		'order'   => 'ASC',
		'return'  => 'ids',
		'status'  => 'publish',
	)
);

do_action( 'woocommerce_cart_is_empty' );
?>
<div class="empty-cart">
	<?php do_action( 'mi_trends_notices' ); ?>
	<div class="empty-icon"><?php mi_trends_icon( 'shopping-bag', array( 'size' => 30 ) ); ?></div>
	<span><?php esc_html_e( 'Your bag is taking a break', 'mi-trends' ); ?></span>
	<h1><?php esc_html_e( 'Ready when you are.', 'mi-trends' ); ?></h1>
	<p><?php esc_html_e( 'Build a rotation from fresh graphics, heavyweight essentials and everyday extras.', 'mi-trends' ); ?></p>
	<a href="<?php echo esc_url( mi_trends_shop_url() ); ?>"><?php esc_html_e( 'Start shopping', 'mi-trends' ); ?> <?php mi_trends_icon( 'arrow-right', array( 'size' => 16 ) ); ?></a>
	<?php if ( $mi_trending ) : ?>
		<section>
			<div><small><?php esc_html_e( 'Good place to start', 'mi-trends' ); ?></small><h2><?php esc_html_e( 'Trending right now', 'mi-trends' ); ?></h2></div>
			<div class="empty-grid">
				<?php foreach ( $mi_trending as $mi_id ) : ?>
					<?php mi_trends_part( 'components/product-card', array( 'product' => $mi_id, 'compact' => true ) ); ?>
				<?php endforeach; ?>
			</div>
		</section>
	<?php endif; ?>
</div>
