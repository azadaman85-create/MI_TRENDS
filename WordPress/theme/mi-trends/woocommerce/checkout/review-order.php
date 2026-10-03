<?php
/**
 * Checkout order summary — the dark "Your order" card from checkout/page.tsx.
 *
 * WooCommerce re-renders this whole element (it must keep the class
 * woocommerce-checkout-review-order-table) every time the checkout updates,
 * which is how the total, the COD rows and the Pay button follow the shopper's
 * choices — the job React state did in the original.
 *
 * @package MI_Trends
 * @version 5.2.0 (WooCommerce template version this override was written against)
 */

defined( 'ABSPATH' ) || exit;

$mi_cart     = WC()->cart;
$mi_lines    = mi_trends_cart_lines();
$mi_count    = mi_trends_cart_count();
$mi_method   = WC()->session ? (string) WC()->session->get( 'chosen_payment_method' ) : '';
$mi_is_cod   = 'mi_cod_advance' === $mi_method;
$mi_total    = (float) $mi_cart->get_total( 'edit' );
$mi_plan     = ( $mi_is_cod && function_exists( 'mi_core_cod_plan_for_cart' ) ) ? mi_core_cod_plan_for_cart() : null;
$mi_due_now  = $mi_plan && $mi_plan['available'] ? $mi_plan['advance'] : $mi_total;
$mi_due_later = $mi_plan && $mi_plan['available'] ? $mi_plan['balance'] : 0;
$mi_eta      = wp_date( 'D, j M', time() + 5 * DAY_IN_SECONDS );
$mi_shipping = (float) $mi_cart->get_shipping_total() + (float) $mi_cart->get_shipping_tax();
$mi_coupon   = (float) $mi_cart->get_discount_total() + (float) $mi_cart->get_discount_tax();
?>
<div class="shop_table woocommerce-checkout-review-order-table summary">
	<span class="summary-kicker"><?php esc_html_e( 'Your order', 'mi-trends' ); ?></span>
	<h2><?php echo esc_html( sprintf( /* translators: %d: count */ _n( '%d piece', '%d pieces', $mi_count, 'mi-trends' ), $mi_count ) ); ?></h2>

	<?php do_action( 'woocommerce_review_order_before_cart_contents' ); ?>
	<div class="summary-items">
		<?php foreach ( $mi_lines as $mi_line ) : ?>
			<article>
				<div class="summary-image"><?php mi_trends_product_visual( $mi_line['view'], array( 'decorative' => true ) ); ?><b><?php echo (int) $mi_line['quantity']; ?></b></div>
				<div><strong><?php echo esc_html( $mi_line['view']['name'] ); ?></strong><span><?php echo esc_html( $mi_line['color']['name'] . ' · ' . $mi_line['size'] ); ?></span></div>
				<em><?php echo esc_html( mi_trends_money( $mi_line['total'] ) ); ?></em>
			</article>
		<?php endforeach; ?>
	</div>
	<?php do_action( 'woocommerce_review_order_after_cart_contents' ); ?>

	<div class="eta"><?php mi_trends_icon( 'map-pin', array( 'size' => 16 ) ); ?><span><small><?php esc_html_e( 'Estimated delivery', 'mi-trends' ); ?></small><strong><?php echo esc_html( sprintf( /* translators: %s: date */ __( 'By %s', 'mi-trends' ), $mi_eta ) ); ?></strong></span></div>

	<dl>
		<div><dt><?php esc_html_e( 'Subtotal', 'mi-trends' ); ?></dt><dd><?php echo esc_html( mi_trends_money( (float) $mi_cart->get_subtotal() + (float) $mi_cart->get_subtotal_tax() ) ); ?></dd></div>
		<?php if ( $mi_coupon > 0 ) : ?>
			<div class="saving"><dt><?php esc_html_e( 'Coupon', 'mi-trends' ); ?></dt><dd>− <?php echo esc_html( mi_trends_money( $mi_coupon ) ); ?></dd></div>
		<?php endif; ?>
		<?php if ( $mi_cart->needs_shipping() ) : ?>
			<div><dt><?php esc_html_e( 'Shipping', 'mi-trends' ); ?></dt><dd><?php echo $mi_shipping > 0 ? esc_html( mi_trends_money( $mi_shipping ) ) : '<span>' . esc_html__( 'Free', 'mi-trends' ) . '</span>'; ?></dd></div>
			<?php
			// The original has a single delivery rate, so there is nothing to choose; keep WooCommerce's chosen method in the form.
			foreach ( (array) WC()->session->get( 'chosen_shipping_methods' ) as $mi_index => $mi_rate ) {
				printf( '<input type="hidden" name="shipping_method[%d]" value="%s" class="shipping_method">', (int) $mi_index, esc_attr( $mi_rate ) );
			}
			?>
		<?php endif; ?>
		<?php foreach ( $mi_cart->get_fees() as $mi_fee ) : ?>
			<div><dt><?php echo esc_html( $mi_fee->name ); ?></dt><dd><?php echo esc_html( mi_trends_money( (float) $mi_fee->total + (float) $mi_fee->tax ) ); ?></dd></div>
		<?php endforeach; ?>
		<?php do_action( 'woocommerce_review_order_before_order_total' ); ?>
		<div class="total"><dt><?php esc_html_e( 'Order total', 'mi-trends' ); ?></dt><dd><?php echo esc_html( mi_trends_money( $mi_total ) ); ?></dd></div>
		<?php if ( $mi_plan && $mi_plan['available'] ) : ?>
			<div><dt><?php esc_html_e( 'Pay now by UPI', 'mi-trends' ); ?></dt><dd><?php echo esc_html( mi_trends_money( $mi_due_now ) ); ?></dd></div>
			<div><dt><?php esc_html_e( 'On delivery', 'mi-trends' ); ?></dt><dd><?php echo esc_html( mi_trends_money( $mi_due_later ) ); ?></dd></div>
		<?php endif; ?>
		<?php do_action( 'woocommerce_review_order_after_order_total' ); ?>
	</dl>

	<?php
	$mi_button = sprintf(
		/* translators: 1: amount, 2: " advance" for COD */
		__( 'Pay %1$s%2$s', 'mi-trends' ),
		mi_trends_money( $mi_due_now ),
		$mi_plan && $mi_plan['available'] ? __( ' advance', 'mi-trends' ) : ''
	);
	?>
	<?php do_action( 'woocommerce_review_order_before_submit' ); ?>
	<button type="submit" class="button alt" name="woocommerce_checkout_place_order" id="place_order" value="<?php echo esc_attr( $mi_button ); ?>" data-value="<?php echo esc_attr( $mi_button ); ?>">
		<?php echo esc_html( $mi_button ); ?> <?php mi_trends_icon( 'lock-keyhole', array( 'size' => 15 ) ); ?>
	</button>
	<?php do_action( 'woocommerce_review_order_after_submit' ); ?>

	<div class="trust"><?php mi_trends_icon( 'shield-check', array( 'size' => 16 ) ); ?><span><strong><?php esc_html_e( 'Payments are encrypted', 'mi-trends' ); ?></strong><?php esc_html_e( 'We never store your full card or UPI details.', 'mi-trends' ); ?></span></div>
</div>
