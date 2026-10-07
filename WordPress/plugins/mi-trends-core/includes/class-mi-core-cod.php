<?php
/**
 * Cash on delivery with a UPI advance — codPlanFor() in lib/store-settings.ts.
 *
 *   merchandise = bag subtotal − coupon discount
 *   total       = merchandise + shipping + COD fee
 *   available   = COD enabled AND merchandise > minimum order
 *   advance     = round(total × advance% / 100)   (paid now by UPI through Razorpay)
 *   balance     = total − advance                  (collected by the courier)
 *
 * The COD fee is added to the WooCommerce cart as a fee only while
 * "Cash on delivery" is the chosen payment method, so the order total is
 * exactly what the shopper owes.
 *
 * @package MI_Trends_Core
 */

defined( 'ABSPATH' ) || exit;

/**
 * COD rules.
 */
class MI_Core_COD {

	const GATEWAY = 'mi_cod_advance';

	/**
	 * Hooks.
	 */
	public static function init() {
		add_action( 'woocommerce_cart_calculate_fees', array( __CLASS__, 'add_fee' ) );
		add_action( 'woocommerce_checkout_create_order_fee_item', array( __CLASS__, 'tag_fee_item' ), 10, 4 );
		add_action( 'mi_trends_unavailable_payment_methods', array( __CLASS__, 'unavailable_card' ) );
		add_filter( 'mi_trends_gateway_subtitle', array( __CLASS__, 'subtitle' ), 10, 2 );
	}

	/**
	 * The pure calculation, unit-testable (tools/tests/cod-plan.php).
	 *
	 * @param float $merchandise Subtotal after coupon.
	 * @param float $shipping    Shipping.
	 * @param array $settings    cod_enabled, cod_minimum_order, cod_advance_percent, cod_fee.
	 * @return array{available:bool,reason:?string,advance:float,balance:float,total:float}
	 */
	public static function plan( $merchandise, $shipping, $settings ) {
		$total = (float) $merchandise + (float) $shipping + (float) $settings['cod_fee'];

		if ( empty( $settings['cod_enabled'] ) ) {
			return array( 'available' => false, 'reason' => 'disabled', 'advance' => 0.0, 'balance' => $total, 'total' => $total );
		}
		if ( (float) $merchandise <= (float) $settings['cod_minimum_order'] ) {
			return array( 'available' => false, 'reason' => 'below-minimum', 'advance' => 0.0, 'balance' => $total, 'total' => $total );
		}

		$advance = (float) round( $total * (float) $settings['cod_advance_percent'] / 100 );
		return array( 'available' => true, 'reason' => null, 'advance' => $advance, 'balance' => $total - $advance, 'total' => $total );
	}

	/**
	 * Current settings in the shape plan() wants.
	 *
	 * @return array
	 */
	public static function settings() {
		return array(
			'cod_enabled'         => (bool) MI_Core_Settings::get( 'cod_enabled' ),
			'cod_minimum_order'   => (float) MI_Core_Settings::get( 'cod_minimum_order' ),
			'cod_advance_percent' => (float) MI_Core_Settings::get( 'cod_advance_percent' ),
			'cod_fee'             => (float) MI_Core_Settings::get( 'cod_fee' ),
		);
	}

	/**
	 * Merchandise value and shipping of the current cart (excluding any COD fee).
	 *
	 * @return array{0:float,1:float}
	 */
	public static function cart_parts() {
		$cart        = WC()->cart;
		$subtotal    = (float) $cart->get_subtotal() + (float) $cart->get_subtotal_tax();
		$discount    = (float) $cart->get_discount_total() + (float) $cart->get_discount_tax();
		$shipping    = (float) $cart->get_shipping_total() + (float) $cart->get_shipping_tax();
		$merchandise = max( 0, $subtotal - $discount );
		return array( $merchandise, $shipping );
	}

	/**
	 * Plan for the current cart.
	 *
	 * @return array
	 */
	public static function plan_for_cart() {
		if ( ! WC()->cart ) {
			return self::plan( 0, 0, self::settings() );
		}
		list( $merchandise, $shipping ) = self::cart_parts();
		return self::plan( $merchandise, $shipping, self::settings() );
	}

	/**
	 * Plan for a placed order (its total already includes the fee).
	 *
	 * @param WC_Order $order Order.
	 * @return array
	 */
	public static function plan_for_order( $order ) {
		$settings = self::settings();
		$fee      = 0.0;
		foreach ( $order->get_fees() as $item ) {
			if ( 'mi_cod_fee' === $item->get_meta( '_mi_fee' ) ) {
				$fee += (float) $item->get_total() + (float) $item->get_total_tax();
			}
		}
		$settings['cod_fee'] = $fee;
		$shipping            = (float) $order->get_shipping_total() + (float) $order->get_shipping_tax();
		$merchandise         = (float) $order->get_total() - $shipping - $fee;
		$plan                = self::plan( $merchandise, $shipping, $settings );
		// The order was accepted at checkout; recompute the split even if settings changed since.
		if ( ! $plan['available'] ) {
			$plan['available'] = true;
			$plan['advance']   = (float) round( $plan['total'] * (float) self::settings()['cod_advance_percent'] / 100 );
			$plan['balance']   = $plan['total'] - $plan['advance'];
		}
		return $plan;
	}

	/**
	 * Is COD the shopper's current choice?
	 *
	 * @return bool
	 */
	public static function chosen() {
		return WC()->session && self::GATEWAY === WC()->session->get( 'chosen_payment_method' );
	}

	/**
	 * Add the handling fee while COD is chosen and allowed.
	 *
	 * @param WC_Cart $cart Cart.
	 */
	public static function add_fee( $cart ) {
		if ( ! self::chosen() ) {
			return;
		}
		// Merchandise is judged before the fee exists, so read the parts directly.
		$subtotal    = (float) $cart->get_subtotal() + (float) $cart->get_subtotal_tax();
		$discount    = (float) $cart->get_discount_total() + (float) $cart->get_discount_tax();
		$merchandise = max( 0, $subtotal - $discount );
		$plan        = self::plan( $merchandise, 0, self::settings() );
		$fee         = (float) MI_Core_Settings::get( 'cod_fee' );
		if ( $plan['available'] && $fee > 0 ) {
			$cart->add_fee( __( 'COD fee', 'mi-trends-core' ), $fee, false );
		}
	}

	/**
	 * Mark the COD fee line on the order so reports and the advance split can find it.
	 *
	 * @param WC_Order_Item_Fee $item    Fee item.
	 * @param string            $fee_key Fee key.
	 * @param object            $fee     Cart fee.
	 * @param WC_Order          $order   Order.
	 */
	public static function tag_fee_item( $item, $fee_key, $fee, $order ) {
		if ( isset( $fee->id ) && 'cod-fee' === $fee->id ) {
			$item->add_meta_data( '_mi_fee', 'mi_cod_fee', true );
		}
	}

	/**
	 * The disabled COD card with its reason, when COD is set up but this bag can't use it.
	 */
	public static function unavailable_card() {
		$gateways = WC()->payment_gateways() ? WC()->payment_gateways()->payment_gateways() : array();
		if ( empty( $gateways[ self::GATEWAY ] ) || 'yes' !== $gateways[ self::GATEWAY ]->enabled ) {
			return;
		}
		$available = WC()->payment_gateways()->get_available_payment_gateways();
		if ( isset( $available[ self::GATEWAY ] ) ) {
			return;
		}
		$plan   = self::plan_for_cart();
		$reason = 'disabled' === $plan['reason']
			? __( 'Unavailable right now', 'mi-trends-core' )
			/* translators: %s: minimum order */
			: sprintf( __( 'Only on orders above %s', 'mi-trends-core' ), mi_core_money( MI_Core_Settings::get( 'cod_minimum_order' ) ) );
		?>
		<li class="wc_payment_method payment_method_<?php echo esc_attr( self::GATEWAY ); ?> disabled">
			<label>
				<input type="radio" disabled aria-disabled="true">
				<?php echo function_exists( 'mi_trends_get_icon' ) ? mi_trends_get_icon( 'banknote', array( 'size' => 18 ) ) : ''; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- theme icon from its own JSON. ?>
				<span><strong><?php echo esc_html( $gateways[ self::GATEWAY ]->get_title() ); ?></strong><small><?php echo esc_html( $reason ); ?></small></span>
			</label>
		</li>
		<?php
	}

	/**
	 * Small line under each payment card, as in the original.
	 *
	 * @param string             $subtitle Subtitle.
	 * @param WC_Payment_Gateway $gateway  Gateway.
	 * @return string
	 */
	public static function subtitle( $subtitle, $gateway ) {
		if ( self::GATEWAY === $gateway->id ) {
			return sprintf(
				/* translators: 1: advance percent, 2: fee */
				__( '%1$d%% by UPI now, rest on delivery · %2$s fee', 'mi-trends-core' ),
				(int) MI_Core_Settings::get( 'cod_advance_percent' ),
				mi_core_money( MI_Core_Settings::get( 'cod_fee' ) )
			);
		}
		if ( 'mi_razorpay_upi' === $gateway->id ) {
			return __( 'Google Pay, PhonePe, BHIM or any UPI app', 'mi-trends-core' );
		}
		return $subtitle;
	}
}
