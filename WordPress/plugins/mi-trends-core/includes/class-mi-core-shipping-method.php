<?php
/**
 * "MI TRENDS delivery" shipping method — FREE_SHIPPING_THRESHOLD / STANDARD_SHIPPING.
 *
 * One rate, exactly as the original computed it:
 *   bag subtotal ≥ free-shipping threshold (₹999)  → Free
 *   otherwise                                      → standard fee (₹79)
 * The threshold and fee live in MI TRENDS → Settings (one place, shared with the
 * storefront's "Add ₹X more for free shipping" nudges). A free-shipping coupon
 * (e.g. FREESHIP) also makes it free.
 *
 * Add it to a shipping zone (the store setup creates "India" with it).
 *
 * @package MI_Trends_Core
 */

defined( 'ABSPATH' ) || exit;

/**
 * Shipping method.
 */
class MI_Core_Shipping_Method extends WC_Shipping_Method {

	/**
	 * Set up.
	 *
	 * @param int $instance_id Instance.
	 */
	public function __construct( $instance_id = 0 ) {
		$this->id                 = 'mi_trends_shipping';
		$this->instance_id        = absint( $instance_id );
		$this->method_title       = __( 'MI TRENDS delivery', 'mi-trends-core' );
		$this->method_description = __( 'Free above the threshold, a flat fee below it. Amounts are set in MI TRENDS → Settings.', 'mi-trends-core' );
		$this->supports           = array( 'shipping-zones', 'instance-settings' );
		$this->instance_form_fields = array(
			'title' => array(
				'title'   => __( 'Title', 'mi-trends-core' ),
				'type'    => 'text',
				'default' => __( 'Standard delivery', 'mi-trends-core' ),
			),
		);
		$this->title = $this->get_option( 'title', __( 'Standard delivery', 'mi-trends-core' ) );

		add_action( 'woocommerce_update_options_shipping_' . $this->id, array( $this, 'process_admin_options' ) );
	}

	/**
	 * Does an applied coupon grant free shipping?
	 *
	 * @return bool
	 */
	private function coupon_free_shipping() {
		if ( ! WC()->cart ) {
			return false;
		}
		foreach ( WC()->cart->get_coupons() as $coupon ) {
			if ( $coupon->is_valid() && $coupon->get_free_shipping() ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Add the rate.
	 *
	 * @param array $package Package.
	 */
	public function calculate_shipping( $package = array() ) {
		$subtotal = 0.0;
		foreach ( $package['contents'] as $item ) {
			$subtotal += (float) $item['line_subtotal'] + (float) $item['line_subtotal_tax'];
		}
		$threshold = (float) MI_Core_Settings::get( 'free_shipping_threshold' );
		$fee       = (float) MI_Core_Settings::get( 'standard_shipping' );
		$free      = $subtotal >= $threshold || $this->coupon_free_shipping();

		$this->add_rate(
			array(
				'id'      => $this->get_rate_id(),
				'label'   => $free ? __( 'Free delivery', 'mi-trends-core' ) : $this->title,
				'cost'    => $free ? 0 : $fee,
				'package' => $package,
				'taxes'   => false,
			)
		);
	}
}
