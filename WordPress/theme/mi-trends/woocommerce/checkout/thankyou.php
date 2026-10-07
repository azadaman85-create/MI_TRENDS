<?php
/**
 * Order confirmation — app/(store)/order-success/page.tsx.
 *
 * The original read the order from the URL (?order=…&amount=…); here it is the
 * real WooCommerce order on the order-received endpoint, which WooCommerce only
 * shows to the buyer (order key check).
 *
 * Note: the hero section keeps the original's class "hero", so it picks up the
 * global .hero rules (min-height, beige ground) just like the Next.js page did.
 *
 * @package MI_Trends
 * @version 8.1.0 (WooCommerce template version this override was written against)
 */

defined( 'ABSPATH' ) || exit;

/** @var WC_Order|false $order */

if ( ! $order ) :
	?>
	<div class="checkout-empty">
		<span><?php esc_html_e( 'Nothing to show', 'mi-trends' ); ?></span>
		<h1><?php esc_html_e( 'No recent order found.', 'mi-trends' ); ?></h1>
		<p><?php esc_html_e( 'Place an order and we’ll show your confirmation right here.', 'mi-trends' ); ?></p>
		<a href="<?php echo esc_url( mi_trends_shop_url() ); ?>"><?php esc_html_e( 'Start shopping', 'mi-trends' ); ?> <?php mi_trends_icon( 'arrow-right', array( 'size' => 16 ) ); ?></a>
	</div>
	<?php
	return;
endif;

if ( $order->has_status( 'failed' ) ) :
	?>
	<div class="checkout-empty">
		<span><?php esc_html_e( 'Payment didn’t go through', 'mi-trends' ); ?></span>
		<h1><?php esc_html_e( 'Let’s try that again.', 'mi-trends' ); ?></h1>
		<p><?php esc_html_e( 'Your bank declined the payment, so the order wasn’t placed. Nothing has been charged.', 'mi-trends' ); ?></p>
		<a class="button-pay" href="<?php echo esc_url( $order->get_checkout_payment_url() ); ?>"><?php esc_html_e( 'Pay now', 'mi-trends' ); ?></a>
	</div>
	<?php
	return;
endif;

$mi_items    = $order->get_item_count();
$mi_advance  = (float) $order->get_meta( '_mi_cod_advance' );
$mi_balance  = (float) $order->get_meta( '_mi_cod_balance' );
$mi_is_cod   = $mi_balance > 0;
$mi_eta      = wp_date( 'D, j M', ( $order->get_date_created() ? $order->get_date_created()->getTimestamp() : time() ) + 5 * DAY_IN_SECONDS );
$mi_payment  = $mi_is_cod ? __( 'Cash on delivery', 'mi-trends' ) : $order->get_payment_method_title();
$mi_track    = add_query_arg( 'order', rawurlencode( $order->get_order_number() ), mi_trends_info_url( 'track-order' ) );
?>
<div class="success-page">
	<div class="checkout-progress">
		<span class="done"><?php mi_trends_icon( 'check', array( 'size' => 12 ) ); ?><?php esc_html_e( 'Bag', 'mi-trends' ); ?></span><i></i>
		<span class="done"><?php mi_trends_icon( 'check', array( 'size' => 12 ) ); ?><?php esc_html_e( 'Checkout', 'mi-trends' ); ?></span><i></i>
		<span class="active">3 <?php esc_html_e( 'Done', 'mi-trends' ); ?></span>
	</div>

	<section class="hero success-hero">
		<div class="badge"><?php mi_trends_icon( 'check-circle', array( 'size' => 34 ) ); ?></div>
		<span class="eyebrow"><?php esc_html_e( 'Order confirmed', 'mi-trends' ); ?></span>
		<h1><?php esc_html_e( 'You’re all set.', 'mi-trends' ); ?></h1>
		<p><?php esc_html_e( 'Thanks for shopping with MI TRENDS. A confirmation is on its way to your inbox.', 'mi-trends' ); ?></p>
	</section>

	<section class="order-card">
		<div class="order-id-row">
			<div>
				<small><?php esc_html_e( 'Order ID', 'mi-trends' ); ?></small>
				<strong data-mi-order-id><?php echo esc_html( $order->get_order_number() ); ?></strong>
			</div>
			<button type="button" data-mi-copy-order="<?php echo esc_attr( $order->get_order_number() ); ?>" aria-label="<?php esc_attr_e( 'Copy order ID', 'mi-trends' ); ?>">
				<span data-mi-copy-state="idle"><?php mi_trends_icon( 'copy', array( 'size' => 15 ) ); ?> <?php esc_html_e( 'Copy', 'mi-trends' ); ?></span>
				<span data-mi-copy-state="done" hidden><?php mi_trends_icon( 'check', array( 'size' => 15 ) ); ?> <?php esc_html_e( 'Copied', 'mi-trends' ); ?></span>
			</button>
		</div>

		<div class="order-grid">
			<div>
				<?php mi_trends_icon( 'package', array( 'size' => 17 ) ); ?>
				<span><small><?php esc_html_e( 'Items', 'mi-trends' ); ?></small><strong><?php echo esc_html( sprintf( /* translators: %d: count */ _n( '%d piece', '%d pieces', max( 1, $mi_items ), 'mi-trends' ), max( 1, $mi_items ) ) ); ?></strong></span>
			</div>
			<div>
				<?php mi_trends_icon( 'shopping-bag', array( 'size' => 17 ) ); ?>
				<span><small><?php echo $mi_is_cod ? esc_html__( 'Advance paid', 'mi-trends' ) : esc_html__( 'Amount paid', 'mi-trends' ); ?></small><strong><?php echo esc_html( mi_trends_money( $mi_is_cod ? $mi_advance : $order->get_total() ) ); ?></strong></span>
				<?php if ( $mi_is_cod ) : ?>
					<span><small><?php esc_html_e( 'Due on delivery', 'mi-trends' ); ?></small><strong><?php echo esc_html( mi_trends_money( $mi_balance ) ); ?></strong></span>
				<?php endif; ?>
			</div>
			<div>
				<?php mi_trends_icon( 'check', array( 'size' => 17 ) ); ?>
				<span><small><?php esc_html_e( 'Payment method', 'mi-trends' ); ?></small><strong><?php echo esc_html( $mi_payment ); ?></strong></span>
			</div>
			<div>
				<?php mi_trends_icon( 'map-pin', array( 'size' => 17 ) ); ?>
				<span><small><?php esc_html_e( 'Estimated delivery', 'mi-trends' ); ?></small><strong><?php echo esc_html( $mi_eta ); ?></strong></span>
			</div>
		</div>
	</section>

	<section class="next-steps">
		<h2><?php esc_html_e( 'What happens next', 'mi-trends' ); ?></h2>
		<ol>
			<li><span>01</span><div><strong><?php esc_html_e( 'Confirmation email', 'mi-trends' ); ?></strong><p><?php esc_html_e( 'We’ve sent your receipt and order details to your inbox.', 'mi-trends' ); ?></p></div><?php mi_trends_icon( 'mail', array( 'size' => 17 ) ); ?></li>
			<li><span>02</span><div><strong><?php esc_html_e( 'Packed with care', 'mi-trends' ); ?></strong><p><?php esc_html_e( 'Your order is picked, checked and packed at our warehouse.', 'mi-trends' ); ?></p></div><?php mi_trends_icon( 'package', array( 'size' => 17 ) ); ?></li>
			<li><span>03</span><div><strong><?php esc_html_e( 'On its way', 'mi-trends' ); ?></strong><p><?php esc_html_e( 'Tracking details are shared once your order ships.', 'mi-trends' ); ?></p></div><?php mi_trends_icon( 'map-pin', array( 'size' => 17 ) ); ?></li>
		</ol>
	</section>

	<div class="actions">
		<a href="<?php echo esc_url( mi_trends_shop_url() ); ?>" class="button button--ink"><?php esc_html_e( 'Continue shopping', 'mi-trends' ); ?> <?php mi_trends_icon( 'arrow-right', array( 'size' => 16 ) ); ?></a>
		<a href="<?php echo esc_url( $mi_track ); ?>" class="button button--ghost"><?php esc_html_e( 'Track this order', 'mi-trends' ); ?></a>
	</div>

	<?php
	// Lets payment gateways print bank details etc. The default order-details table is unhooked by MI Trends Core.
	do_action( 'woocommerce_thankyou_' . $order->get_payment_method(), $order->get_id() );
	do_action( 'woocommerce_thankyou', $order->get_id() );
	?>
</div>
