<?php
/**
 * Bag page — app/(store)/cart/page.tsx (filled bag).
 *
 * Quantity steps, remove, clear bag and coupons post to WooCommerce's own
 * cart form handler (with its nonce), so the page works without JavaScript;
 * mi-trends.js submits them in place. The price summary mirrors the
 * original: item total at MRP, product discount, coupon saving, shipping, total.
 *
 * @package MI_Trends
 * @version 10.1.0 (WooCommerce template version this override was written against)
 */

defined( 'ABSPATH' ) || exit;

$mi_lines     = mi_trends_cart_lines();
$mi_cart      = WC()->cart;
$mi_count     = mi_trends_cart_count();
$mi_item_mrp  = array_sum( wp_list_pluck( $mi_lines, 'mrp_total' ) );
$mi_subtotal  = array_sum( wp_list_pluck( $mi_lines, 'total' ) );
$mi_prod_disc = max( 0, $mi_item_mrp - $mi_subtotal );
$mi_coupon    = (float) $mi_cart->get_discount_total() + (float) $mi_cart->get_discount_tax();
$mi_threshold = (float) mi_trends_setting( 'free_shipping_threshold' );
$mi_shipping  = $mi_subtotal >= $mi_threshold ? 0 : (float) mi_trends_setting( 'standard_shipping' );
$mi_total     = max( 0, $mi_subtotal - $mi_coupon ) + $mi_shipping;
$mi_remaining = max( 0, $mi_threshold - $mi_subtotal );
$mi_progress  = $mi_threshold > 0 ? min( 100, $mi_subtotal / $mi_threshold * 100 ) : 100;
$mi_codes     = $mi_cart->get_applied_coupons();
$mi_checkout  = mi_trends_checkout_link();
$mi_nonce     = wp_create_nonce( 'woocommerce-cart' );
$mi_hints     = apply_filters( 'mi_trends_coupon_hints', array( 'MI10', 'FLAT200', 'FIRST15' ) );

$mi_in_cart     = wp_list_pluck( wp_list_pluck( $mi_lines, 'view' ), 'id' );
$mi_suggestions = function_exists( 'mi_core_suggestion_ids' ) ? mi_core_suggestion_ids( $mi_in_cart, 4 ) : array();

do_action( 'woocommerce_before_cart' );
?>
<div class="cart-page">
	<header>
		<div><span class="eyebrow"><?php esc_html_e( 'Your current rotation', 'mi-trends' ); ?></span><h1><?php esc_html_e( 'Shopping bag', 'mi-trends' ); ?></h1></div>
		<p><?php echo esc_html( sprintf( /* translators: %d: count */ _n( '%d item', '%d items', $mi_count, 'mi-trends' ), $mi_count ) ); ?></p>
	</header>

	<?php do_action( 'mi_trends_notices' ); ?>

	<div class="shipping-nudge">
		<div>
			<?php mi_trends_icon( 'truck', array( 'size' => 17 ) ); ?>
			<span>
				<?php if ( $mi_remaining > 0 ) : ?>
					<?php
					/* translators: %s: amount */
					printf( esc_html__( 'Add %s for free shipping', 'mi-trends' ), '<strong>' . esc_html( mi_trends_money( $mi_remaining ) ) . '</strong>' );
					?>
				<?php else : ?>
					<strong><?php esc_html_e( 'Free shipping unlocked.', 'mi-trends' ); ?></strong> <?php esc_html_e( 'Nice move.', 'mi-trends' ); ?>
				<?php endif; ?>
			</span>
		</div>
		<div class="shipping-track"><i style="width:<?php echo esc_attr( round( $mi_progress, 2 ) ); ?>%"></i></div>
	</div>

	<div class="cart-layout">
		<section class="items" aria-label="<?php esc_attr_e( 'Bag items', 'mi-trends' ); ?>">
			<?php foreach ( $mi_lines as $mi_line ) : $mi_v = $mi_line['view']; ?>
				<article class="line">
					<a class="line-image" href="<?php echo esc_url( $mi_v['url'] ); ?>" aria-label="<?php echo esc_attr( sprintf( /* translators: %s: product */ __( 'View %s', 'mi-trends' ), $mi_v['name'] ) ); ?>">
						<?php mi_trends_product_visual( $mi_v, array( 'color' => $mi_line['color'] ) ); ?>
					</a>
					<div class="line-copy">
						<div>
							<a class="line-collection" href="<?php echo esc_url( $mi_v['collection_url'] ); ?>"><?php echo esc_html( $mi_v['collection'] ); ?></a>
							<h2><a href="<?php echo esc_url( $mi_v['url'] ); ?>"><?php echo esc_html( $mi_v['name'] ); ?></a></h2>
							<p>
								<span><i style="background:<?php echo esc_attr( $mi_line['color']['hex'] ); ?>"></i><?php echo esc_html( $mi_line['color']['name'] ); ?></span>
								<span><?php echo esc_html( sprintf( /* translators: %s: size */ __( 'Size %s', 'mi-trends' ), $mi_line['size'] ) ); ?></span>
							</p>
						</div>
						<div class="line-bottom">
							<form class="qty" method="post" action="<?php echo esc_url( wc_get_cart_url() ); ?>" aria-label="<?php echo esc_attr( sprintf( /* translators: %s: product */ __( 'Quantity for %s', 'mi-trends' ), $mi_v['name'] ) ); ?>" data-mi-cart-form>
								<input type="hidden" name="woocommerce-cart-nonce" value="<?php echo esc_attr( $mi_nonce ); ?>">
								<input type="hidden" name="update_cart" value="1">
								<button type="submit" name="cart[<?php echo esc_attr( $mi_line['key'] ); ?>][qty]" value="<?php echo (int) $mi_line['quantity'] - 1; ?>" aria-label="<?php esc_attr_e( 'Decrease quantity', 'mi-trends' ); ?>"><?php mi_trends_icon( 'minus', array( 'size' => 14 ) ); ?></button>
								<span><?php echo (int) $mi_line['quantity']; ?></span>
								<button type="submit" name="cart[<?php echo esc_attr( $mi_line['key'] ); ?>][qty]" value="<?php echo (int) $mi_line['quantity'] + 1; ?>" aria-label="<?php esc_attr_e( 'Increase quantity', 'mi-trends' ); ?>"<?php disabled( $mi_line['quantity'] >= 10 ); ?>><?php mi_trends_icon( 'plus', array( 'size' => 14 ) ); ?></button>
							</form>
							<a class="remove" href="<?php echo esc_url( wc_get_cart_remove_url( $mi_line['key'] ) ); ?>"><?php mi_trends_icon( 'trash', array( 'size' => 15 ) ); ?><?php esc_html_e( 'Remove', 'mi-trends' ); ?></a>
						</div>
					</div>
					<div class="line-price">
						<strong><?php echo esc_html( mi_trends_money( $mi_line['total'] ) ); ?></strong>
						<?php if ( $mi_line['mrp_total'] > $mi_line['total'] ) : ?>
							<del><?php echo esc_html( mi_trends_money( $mi_line['mrp_total'] ) ); ?></del>
						<?php endif; ?>
					</div>
				</article>
			<?php endforeach; ?>

			<div class="keep-shopping">
				<a href="<?php echo esc_url( mi_trends_shop_url() ); ?>">← <?php esc_html_e( 'Keep shopping', 'mi-trends' ); ?></a>
				<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
					<input type="hidden" name="action" value="mi_trends_clear_cart">
					<?php wp_nonce_field( 'mi_trends_clear_cart', 'mi_clear_nonce' ); ?>
					<button type="submit"><?php esc_html_e( 'Clear bag', 'mi-trends' ); ?></button>
				</form>
			</div>
		</section>

		<aside>
			<div class="summary">
				<span class="summary-kicker"><?php esc_html_e( 'Order overview', 'mi-trends' ); ?></span>
				<h2><?php esc_html_e( 'Price summary', 'mi-trends' ); ?></h2>

				<?php if ( wc_coupons_enabled() ) : ?>
					<div class="coupon">
						<form method="post" action="<?php echo esc_url( wc_get_cart_url() ); ?>" data-mi-coupon-form>
							<input type="hidden" name="woocommerce-cart-nonce" value="<?php echo esc_attr( $mi_nonce ); ?>">
							<label for="coupon"><?php mi_trends_icon( 'tag', array( 'size' => 15 ) ); ?> <?php esc_html_e( 'Have a coupon?', 'mi-trends' ); ?></label>
							<div>
								<input id="coupon" name="coupon_code" value="" placeholder="<?php esc_attr_e( 'Enter code', 'mi-trends' ); ?>" autocomplete="off">
								<button type="submit" name="apply_coupon" value="1"><?php echo $mi_codes ? esc_html__( 'Change', 'mi-trends' ) : esc_html__( 'Apply', 'mi-trends' ); ?></button>
							</div>
						</form>
						<?php foreach ( $mi_codes as $mi_code ) : ?>
							<a class="coupon-active" href="<?php echo esc_url( add_query_arg( array( 'remove_coupon' => rawurlencode( $mi_code ), '_wpnonce' => $mi_nonce ), wc_get_cart_url() ) ); ?>">
								<?php mi_trends_icon( 'check', array( 'size' => 13 ) ); ?><?php echo esc_html( strtoupper( $mi_code ) ); ?> <?php esc_html_e( 'applied · remove', 'mi-trends' ); ?>
							</a>
						<?php endforeach; ?>
						<p data-mi-coupon-message hidden></p>
						<div class="code-hints">
							<?php foreach ( $mi_hints as $mi_hint ) : ?>
								<button type="button" data-mi-coupon-hint="<?php echo esc_attr( $mi_hint ); ?>"><?php echo esc_html( $mi_hint ); ?></button>
							<?php endforeach; ?>
						</div>
					</div>
				<?php endif; ?>

				<dl>
					<div><dt><?php esc_html_e( 'Item total', 'mi-trends' ); ?></dt><dd><?php echo esc_html( mi_trends_money( $mi_item_mrp ) ); ?></dd></div>
					<div class="saving"><dt><?php esc_html_e( 'Product discount', 'mi-trends' ); ?></dt><dd>− <?php echo esc_html( mi_trends_money( $mi_prod_disc ) ); ?></dd></div>
					<?php if ( $mi_coupon > 0 ) : ?>
						<div class="saving"><dt><?php esc_html_e( 'Coupon saving', 'mi-trends' ); ?></dt><dd>− <?php echo esc_html( mi_trends_money( $mi_coupon ) ); ?></dd></div>
					<?php endif; ?>
					<div><dt><?php esc_html_e( 'Shipping', 'mi-trends' ); ?></dt><dd><?php echo $mi_shipping ? esc_html( mi_trends_money( $mi_shipping ) ) : '<span>' . esc_html__( 'Free', 'mi-trends' ) . '</span>'; ?></dd></div>
					<div class="total"><dt><?php esc_html_e( 'Total to pay', 'mi-trends' ); ?></dt><dd><?php echo esc_html( mi_trends_money( $mi_total ) ); ?></dd></div>
				</dl>
				<p class="total-saving"><?php echo esc_html( sprintf( /* translators: %s: amount */ __( 'You save %s on this order', 'mi-trends' ), mi_trends_money( $mi_prod_disc + $mi_coupon ) ) ); ?></p>
				<a class="checkout" href="<?php echo esc_url( $mi_checkout['url'] ); ?>"><?php echo is_user_logged_in() ? esc_html__( 'Secure checkout', 'mi-trends' ) : esc_html( $mi_checkout['label'] ); ?> <span><?php echo esc_html( mi_trends_money( $mi_total ) ); ?></span></a>
				<div class="secure"><?php mi_trends_icon( 'shield-check', array( 'size' => 16 ) ); ?><span><strong><?php esc_html_e( 'Safe & secure payments', 'mi-trends' ); ?></strong><?php esc_html_e( 'Your information stays protected.', 'mi-trends' ); ?></span></div>
				<?php do_action( 'woocommerce_proceed_to_checkout' ); ?>
			</div>
		</aside>
	</div>

	<?php if ( $mi_suggestions ) : ?>
		<section class="suggestions">
			<div><span class="eyebrow"><?php esc_html_e( 'One more thing', 'mi-trends' ); ?></span><h2><?php esc_html_e( 'Complete the look', 'mi-trends' ); ?></h2></div>
			<div class="suggestion-grid">
				<?php foreach ( $mi_suggestions as $mi_id ) : ?>
					<?php mi_trends_part( 'components/product-card', array( 'product' => $mi_id ) ); ?>
				<?php endforeach; ?>
			</div>
		</section>
	<?php endif; ?>
</div>
<?php
do_action( 'woocommerce_after_cart' );
