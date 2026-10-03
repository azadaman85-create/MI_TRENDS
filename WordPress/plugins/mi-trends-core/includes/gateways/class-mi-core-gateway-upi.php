<?php
/**
 * UPI — pay the full order total now through Razorpay (checkout/page.tsx, "UPI").
 *
 * @package MI_Trends_Core
 */

defined( 'ABSPATH' ) || exit;

/**
 * UPI gateway.
 */
class MI_Core_Gateway_UPI extends MI_Core_Gateway_Razorpay {

	/**
	 * Set up.
	 */
	public function __construct() {
		$this->id                 = 'mi_razorpay_upi';
		$this->method_title       = __( 'MI TRENDS — UPI (Razorpay)', 'mi-trends-core' );
		$this->method_description = __( 'Customers pay the full amount by UPI through Razorpay Standard Checkout. Razorpay keys are entered here once and are also used by "Cash on delivery (UPI advance)".', 'mi-trends-core' );
		$this->icon               = '';
		parent::__construct();
	}

	/**
	 * Default title.
	 *
	 * @return string
	 */
	protected function default_title() {
		return __( 'UPI', 'mi-trends-core' );
	}

	/**
	 * Full total.
	 *
	 * @param WC_Order $order Order.
	 * @return float
	 */
	protected function amount_due( $order ) {
		return (float) $order->get_total();
	}

	/**
	 * Razorpay description.
	 *
	 * @return string
	 */
	protected function checkout_description() {
		return __( 'Order payment', 'mi-trends-core' );
	}
}
