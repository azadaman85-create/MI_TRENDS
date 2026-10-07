<?php
/**
 * Cash on delivery with a UPI advance (checkout/page.tsx, "Cash on delivery").
 *
 * A share of the total (default 20%) is paid now by UPI through Razorpay; the
 * courier collects the rest. Offered only above the minimum order value and
 * only while enabled in MI TRENDS → Settings. The handling fee is added to the
 * order by MI_Core_COD.
 *
 * @package MI_Trends_Core
 */

defined( 'ABSPATH' ) || exit;

/**
 * COD-with-advance gateway.
 */
class MI_Core_Gateway_COD_Advance extends MI_Core_Gateway_Razorpay {

	/**
	 * Set up.
	 */
	public function __construct() {
		$this->id                 = 'mi_cod_advance';
		$this->method_title       = __( 'MI TRENDS — Cash on delivery (UPI advance)', 'mi-trends-core' );
		$this->method_description = __( 'Takes an advance by UPI through Razorpay and the balance in cash on delivery. Rules (minimum order, advance %, handling fee) are set in MI TRENDS → Settings. Uses the Razorpay keys from the UPI gateway.', 'mi-trends-core' );
		parent::__construct();
	}

	/**
	 * Default title.
	 *
	 * @return string
	 */
	protected function default_title() {
		return __( 'Cash on delivery', 'mi-trends-core' );
	}

	/**
	 * Only when COD is allowed for this bag.
	 *
	 * @return bool
	 */
	public function is_available() {
		if ( ! parent::is_available() ) {
			return false;
		}
		if ( is_admin() && ! wp_doing_ajax() ) {
			return true;
		}
		if ( ! WC()->cart ) {
			return true; // Order-pay page: availability was decided at checkout.
		}
		$plan = MI_Core_COD::plan_for_cart();
		return $plan['available'];
	}

	/**
	 * The "₹X now, ₹Y on delivery" note (cod-note in the original).
	 */
	protected function extra_payment_fields() {
		if ( ! WC()->cart ) {
			return;
		}
		$plan = MI_Core_COD::plan_for_cart();
		if ( ! $plan['available'] ) {
			return;
		}
		$fee = (float) MI_Core_Settings::get( 'cod_fee' );
		?>
		<div class="cod-note">
			<?php echo function_exists( 'mi_trends_get_icon' ) ? mi_trends_get_icon( 'truck', array( 'size' => 19 ) ) : ''; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- theme icon from its own JSON. ?>
			<div>
				<strong>
					<?php
					/* translators: 1: now, 2: on delivery */
					echo esc_html( sprintf( __( '%1$s now, %2$s on delivery', 'mi-trends-core' ), mi_core_money( $plan['advance'] ), mi_core_money( $plan['balance'] ) ) );
					?>
				</strong>
				<p>
					<?php
					echo esc_html(
						sprintf(
							/* translators: 1: percent, 2: balance, 3: fee */
							__( 'A %1$d%% advance confirms the order. The courier collects the remaining %2$s — including the %3$s handling fee — when it arrives. Please keep the exact amount ready.', 'mi-trends-core' ),
							(int) MI_Core_Settings::get( 'cod_advance_percent' ),
							mi_core_money( $plan['balance'] ),
							mi_core_money( $fee )
						)
					);
					?>
				</p>
			</div>
		</div>
		<?php
	}

	/**
	 * Re-check eligibility on submit.
	 *
	 * @return bool
	 */
	public function validate_fields() {
		$plan = MI_Core_COD::plan_for_cart();
		if ( ! $plan['available'] ) {
			wc_add_notice(
				'disabled' === $plan['reason']
					? __( 'Cash on delivery is unavailable right now.', 'mi-trends-core' )
					/* translators: %s: minimum */
					: sprintf( __( 'Cash on delivery is only on orders above %s.', 'mi-trends-core' ), mi_core_money( MI_Core_Settings::get( 'cod_minimum_order' ) ) ),
				'error'
			);
			return false;
		}
		return parent::validate_fields();
	}

	/**
	 * Record the advance/balance split on the order.
	 *
	 * @param WC_Order $order Order.
	 */
	protected function before_payment( $order ) {
		$total   = (float) $order->get_total();
		$advance = (float) round( $total * (float) MI_Core_Settings::get( 'cod_advance_percent' ) / 100 );
		$order->update_meta_data( '_mi_cod_advance', $advance );
		$order->update_meta_data( '_mi_cod_balance', $total - $advance );
		$order->save();
	}

	/**
	 * The advance.
	 *
	 * @param WC_Order $order Order.
	 * @return float
	 */
	protected function amount_due( $order ) {
		return (float) $order->get_meta( '_mi_cod_advance' );
	}

	/**
	 * Razorpay description.
	 *
	 * @return string
	 */
	protected function checkout_description() {
		return __( 'Cash on delivery advance', 'mi-trends-core' );
	}
}
