<?php
/**
 * Payment step — shown on the order-pay page while Razorpay opens.
 *
 * In the original the Razorpay modal opened on top of the checkout page. In
 * WooCommerce the order is created first and the shopper lands here; MI Trends
 * Core's gateway opens the same Razorpay Standard Checkout immediately (and
 * the button reopens it if it was closed).
 *
 * @package MI_Trends
 * @version 3.2.0 (WooCommerce template version this override was written against)
 */

defined( 'ABSPATH' ) || exit;

/** @var WC_Order $order */
$mi_advance = (float) $order->get_meta( '_mi_cod_advance' );
$mi_due     = $mi_advance > 0 ? $mi_advance : (float) $order->get_total();
?>
<div class="checkout-page">
	<div class="checkout-top">
		<a href="<?php echo esc_url( wc_get_cart_url() ); ?>"><?php mi_trends_icon( 'arrow-left', array( 'size' => 15 ) ); ?><?php esc_html_e( 'Back to bag', 'mi-trends' ); ?></a>
		<div class="checkout-progress"><span class="done"><?php mi_trends_icon( 'check', array( 'size' => 12 ) ); ?><?php esc_html_e( 'Bag', 'mi-trends' ); ?></span><i></i><span class="active">2 <?php esc_html_e( 'Checkout', 'mi-trends' ); ?></span><i></i><span>3 <?php esc_html_e( 'Done', 'mi-trends' ); ?></span></div>
		<span><?php mi_trends_icon( 'lock-keyhole', array( 'size' => 14 ) ); ?><?php esc_html_e( 'Secure checkout', 'mi-trends' ); ?></span>
	</div>

	<div class="checkout-empty">
		<span><?php esc_html_e( 'One last step', 'mi-trends' ); ?></span>
		<h1><?php esc_html_e( 'Approve your payment.', 'mi-trends' ); ?></h1>
		<p>
			<?php
			echo esc_html(
				sprintf(
					/* translators: 1: amount, 2: order number */
					__( 'Approve %1$s in your UPI app to confirm order %2$s.', 'mi-trends' ),
					mi_trends_money( $mi_due ),
					$order->get_order_number()
				)
			);
			?>
		</p>
		<?php
		// The gateway prints the Razorpay button and script here.
		do_action( 'woocommerce_receipt_' . $order->get_payment_method(), $order->get_id() );
		?>
	</div>
</div>
