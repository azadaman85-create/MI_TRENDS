<?php
/**
 * One payment method card (UPI / Cash on delivery) — checkout/page.tsx.
 *
 * Gateways can supply the small line under their name with the
 * `mi_trends_gateway_subtitle` filter (MI Trends Core does, for the COD
 * advance wording); otherwise the gateway's title is shown alone. The
 * detail fields render in payment.php, below the cards.
 *
 * @package MI_Trends
 * @version 3.5.0 (WooCommerce template version this override was written against)
 */

defined( 'ABSPATH' ) || exit;

$mi_icon     = apply_filters( 'mi_trends_gateway_icon', 'mi_cod_advance' === $gateway->id ? 'banknote' : 'smartphone', $gateway );
$mi_subtitle = apply_filters( 'mi_trends_gateway_subtitle', '', $gateway );
?>
<li class="wc_payment_method payment_method_<?php echo esc_attr( $gateway->id ); ?><?php echo $gateway->chosen ? ' active' : ''; ?>">
	<label for="payment_method_<?php echo esc_attr( $gateway->id ); ?>">
		<input id="payment_method_<?php echo esc_attr( $gateway->id ); ?>" type="radio" class="input-radio" name="payment_method" value="<?php echo esc_attr( $gateway->id ); ?>" <?php checked( $gateway->chosen, true ); ?> data-order_button_text="<?php echo esc_attr( $gateway->order_button_text ); ?>">
		<?php mi_trends_icon( $mi_icon, array( 'size' => 18 ) ); ?>
		<span>
			<strong><?php echo wp_kses_post( $gateway->get_title() ); ?></strong>
			<?php if ( $mi_subtitle ) : ?>
				<small><?php echo esc_html( $mi_subtitle ); ?></small>
			<?php endif; ?>
		</span>
	</label>
</li>
