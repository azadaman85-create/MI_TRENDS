<?php
/**
 * Checkout payment panel — the method cards and the detail box from checkout/page.tsx.
 *
 * WooCommerce re-renders this element on every checkout update. The method
 * cards keep WooCommerce's names and classes (ul.payment_methods,
 * input.input-radio, div.payment_box.payment_method_{id}) so its script still
 * switches the detail box; the place-order button lives in the summary card
 * (review-order.php), as in the original layout.
 *
 * @package MI_Trends
 * @version 9.8.0 (WooCommerce template version this override was written against)
 */

defined( 'ABSPATH' ) || exit;

if ( ! wp_doing_ajax() ) {
	do_action( 'woocommerce_review_order_before_payment' );
}
?>
<div id="payment" class="woocommerce-checkout-payment">
	<?php if ( WC()->cart && WC()->cart->needs_payment() ) : ?>
		<?php if ( ! empty( $available_gateways ) ) : ?>
			<ul class="wc_payment_methods payment_methods methods payment-methods">
				<?php
				foreach ( $available_gateways as $gateway ) {
					wc_get_template( 'checkout/payment-method.php', array( 'gateway' => $gateway ) );
				}
				// A disabled COD card, with the reason, when COD exists but this bag can't use it.
				do_action( 'mi_trends_unavailable_payment_methods' );
				?>
			</ul>
			<div class="payment-detail">
				<?php foreach ( $available_gateways as $gateway ) : ?>
					<?php if ( $gateway->has_fields() || $gateway->get_description() ) : ?>
						<div class="payment_box payment_method_<?php echo esc_attr( $gateway->id ); ?>"<?php echo $gateway->chosen ? '' : ' style="display:none;"'; ?>>
							<?php $gateway->payment_fields(); ?>
						</div>
					<?php endif; ?>
				<?php endforeach; ?>
			</div>
		<?php else : ?>
			<p class="payment-error">
				<?php
				echo wp_kses_post(
					apply_filters(
						'woocommerce_no_available_payment_methods_message',
						WC()->customer->get_billing_country()
							? esc_html__( 'Sorry, it seems that there are no available payment methods. Please contact us if you require assistance or wish to make alternate arrangements.', 'mi-trends' )
							: esc_html__( 'Please fill in your details above to see available payment methods.', 'mi-trends' )
					)
				);
				?>
			</p>
		<?php endif; ?>
	<?php endif; ?>

	<div class="form-row place-order">
		<noscript>
			<?php esc_html_e( 'Since your browser does not support JavaScript, or it is disabled, please ensure you click the Update Totals button before placing your order. You may be charged more than the amount stated above if you fail to do so.', 'mi-trends' ); ?>
			<button type="submit" class="button" name="woocommerce_checkout_update_totals" value="<?php esc_attr_e( 'Update totals', 'mi-trends' ); ?>"><?php esc_html_e( 'Update totals', 'mi-trends' ); ?></button>
		</noscript>

		<?php wc_get_template( 'checkout/terms.php' ); ?>
		<?php wp_nonce_field( 'woocommerce-process_checkout', 'woocommerce-process-checkout-nonce' ); ?>
	</div>
</div>
<?php
if ( ! wp_doing_ajax() ) {
	do_action( 'woocommerce_review_order_after_payment' );
}
