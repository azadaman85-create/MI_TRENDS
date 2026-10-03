<?php
/**
 * Shared Razorpay gateway behaviour for UPI and COD-with-advance.
 *
 * Flow (the original opened Razorpay over the checkout page; WooCommerce
 * creates the order first):
 *   1. Checkout submits → process_payment() creates a Razorpay order for the
 *      amount due now (full total, or the COD advance) and sends the shopper
 *      to the order-pay page.
 *   2. receipt_page() opens Razorpay Standard Checkout immediately.
 *   3. Razorpay returns order_id/payment_id/signature → POST
 *      /wp-json/mi-trends/v1/razorpay/verify checks the HMAC (MI_Core_REST)
 *      and completes the order → the confirmation page.
 *   4. Optional webhook (payment.captured) completes the order if the browser
 *      closed before step 3.
 *
 * @package MI_Trends_Core
 */

defined( 'ABSPATH' ) || exit;

/**
 * Base gateway.
 */
abstract class MI_Core_Gateway_Razorpay extends WC_Payment_Gateway {

	/**
	 * Set up.
	 */
	public function __construct() {
		$this->has_fields = true;
		$this->supports   = array( 'products', 'refunds' );

		$this->init_form_fields();
		$this->init_settings();

		$this->title       = $this->get_option( 'title' );
		$this->description = $this->get_option( 'description' );
		$this->enabled     = $this->get_option( 'enabled' );

		add_action( 'woocommerce_update_options_payment_gateways_' . $this->id, array( $this, 'process_admin_options' ) );
		add_action( 'woocommerce_receipt_' . $this->id, array( $this, 'receipt_page' ) );
	}

	/**
	 * Amount due now for an order.
	 *
	 * @param WC_Order $order Order.
	 * @return float
	 */
	abstract protected function amount_due( $order );

	/**
	 * Description for Razorpay Checkout.
	 *
	 * @return string
	 */
	abstract protected function checkout_description();

	/**
	 * Available only when keys are configured.
	 *
	 * @return bool
	 */
	public function is_available() {
		return parent::is_available() && MI_Core_Razorpay_API::configured() && 'INR' === get_woocommerce_currency();
	}

	/**
	 * UPI ID field shown under the payment cards (the original asked for it in
	 * both modes; Razorpay then asks the app to approve). It is validated, not stored.
	 */
	public function payment_fields() {
		$cod = 'mi_cod_advance' === $this->id;
		?>
		<label>
			<span><?php esc_html_e( 'UPI ID', 'mi-trends-core' ); ?></span>
			<input name="mi_upi_id" autocomplete="off" placeholder="name@bank" class="input-text">
			<small>
				<?php
				if ( $cod && WC()->cart ) {
					$plan = MI_Core_COD::plan_for_cart();
					/* translators: %s: advance */
					echo esc_html( sprintf( __( 'You’ll approve the %s advance in your UPI app.', 'mi-trends-core' ), mi_core_money( $plan['advance'] ) ) );
				} else {
					esc_html_e( 'You’ll approve the payment in your UPI app.', 'mi-trends-core' );
				}
				?>
			</small>
		</label>
		<?php
		$this->extra_payment_fields();
	}

	/**
	 * Hook for subclasses.
	 */
	protected function extra_payment_fields() {}

	/**
	 * Validate the UPI ID like the original (`^[\w.-]{2,}@[\w.-]{2,}$`).
	 *
	 * @return bool
	 */
	public function validate_fields() {
		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- WooCommerce verifies the checkout nonce before payment validation.
		$upi = isset( $_POST['mi_upi_id'] ) ? sanitize_text_field( wp_unslash( $_POST['mi_upi_id'] ) ) : '';
		if ( ! preg_match( '/^[\w.-]{2,}@[\w.-]{2,}$/', $upi ) ) {
			wc_add_notice(
				'mi_cod_advance' === $this->id
					? __( 'Enter the UPI ID you\'ll pay the advance from.', 'mi-trends-core' )
					: __( 'Enter a valid UPI ID, for example name@bank.', 'mi-trends-core' ),
				'error',
				array( 'id' => 'mi_upi_id' )
			);
			return false;
		}
		return true;
	}

	/**
	 * Create the Razorpay order and send the shopper to pay.
	 *
	 * @param int $order_id Order.
	 * @return array
	 */
	public function process_payment( $order_id ) {
		$order = wc_get_order( $order_id );
		$this->before_payment( $order );

		$due    = $this->amount_due( $order );
		$result = MI_Core_Razorpay_API::create_order(
			(int) round( $due * 100 ),
			$order->get_order_number(),
			array(
				'wc_order_id' => (string) $order->get_id(),
				'mode'        => 'mi_cod_advance' === $this->id ? 'cod_advance' : 'full',
			)
		);

		if ( is_wp_error( $result ) ) {
			wc_add_notice( $result->get_error_message(), 'error' );
			$order->add_order_note( sprintf( /* translators: %s: error */ __( 'Razorpay order could not be created: %s', 'mi-trends-core' ), $result->get_error_message() ) );
			return array( 'result' => 'failure' );
		}

		$order->update_meta_data( '_mi_rzp_order_id', $result['id'] );
		$order->update_meta_data( '_mi_amount_due_now', $due );
		$order->save();

		return array(
			'result'   => 'success',
			'redirect' => $order->get_checkout_payment_url( true ),
		);
	}

	/**
	 * Hook for subclasses to record anything before payment.
	 *
	 * @param WC_Order $order Order.
	 */
	protected function before_payment( $order ) {}

	/**
	 * Order-pay page: open Razorpay Checkout.
	 *
	 * @param int $order_id Order.
	 */
	public function receipt_page( $order_id ) {
		$order = wc_get_order( $order_id );
		if ( ! $order || $order->is_paid() || $order->get_meta( '_mi_cod_advance_paid' ) ) {
			return;
		}
		$rzp_order = (string) $order->get_meta( '_mi_rzp_order_id' );
		$due       = (float) $order->get_meta( '_mi_amount_due_now' );
		if ( ! $rzp_order || $due <= 0 ) {
			echo '<p class="payment-error">' . esc_html__( 'This payment link has expired. Please place the order again.', 'mi-trends-core' ) . '</p>';
			return;
		}

		wp_enqueue_script( 'razorpay-checkout', 'https://checkout.razorpay.com/v1/checkout.js', array(), null, true ); // phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion -- Razorpay serves its own versioned file.
		wp_enqueue_script( 'mi-core-razorpay', MI_CORE_URL . 'assets/js/razorpay.js', array( 'razorpay-checkout' ), MI_CORE_VERSION, true );
		wp_localize_script(
			'mi-core-razorpay',
			'MI_RAZORPAY',
			array(
				'verifyUrl' => esc_url_raw( rest_url( 'mi-trends/v1/razorpay/verify' ) ),
				'orderId'   => $order->get_id(),
				'orderKey'  => $order->get_order_key(),
				'options'   => array(
					'key'         => MI_Core_Razorpay_API::key_id(),
					'amount'      => (int) round( $due * 100 ),
					'currency'    => 'INR',
					'name'        => (string) MI_Core_Settings::get( 'store_name' ),
					'description' => $this->checkout_description(),
					'order_id'    => $rzp_order,
					'prefill'     => array(
						'name'    => $order->get_billing_first_name(),
						'email'   => $order->get_billing_email(),
						'contact' => preg_replace( '/\D/', '', $order->get_billing_phone() ),
					),
					'theme'       => array( 'color' => '#e5482b' ),
				),
				'i18n'      => array(
					'cancelled' => __( 'Payment cancelled.', 'mi-trends-core' ),
					'failed'    => __( 'Payment failed. Please try again.', 'mi-trends-core' ),
					'verifying' => __( 'Confirming your payment…', 'mi-trends-core' ),
				),
			)
		);
		?>
		<p class="payment-error" data-mi-rzp-error hidden></p>
		<button type="button" class="button-pay" data-mi-rzp-open>
			<?php
			/* translators: %s: amount */
			echo esc_html( sprintf( __( 'Pay %s', 'mi-trends-core' ), mi_core_money( $due ) ) );
			?>
		</button>
		<?php
	}

	/**
	 * Mark the order paid after a verified payment. Idempotent.
	 *
	 * @param WC_Order $order      Order.
	 * @param string   $payment_id Razorpay payment ID.
	 */
	public static function complete( $order, $payment_id ) {
		if ( $order->get_transaction_id() === $payment_id && ( $order->is_paid() || $order->get_meta( '_mi_cod_advance_paid' ) ) ) {
			return;
		}

		if ( 'mi_cod_advance' === $order->get_payment_method() ) {
			$order->set_transaction_id( $payment_id );
			$order->update_meta_data( '_mi_cod_advance_paid', 'yes' );
			$order->add_order_note(
				sprintf(
					/* translators: 1: advance, 2: balance, 3: payment id */
					__( 'COD advance of %1$s received by UPI (Razorpay %3$s). Collect %2$s on delivery.', 'mi-trends-core' ),
					mi_core_money( $order->get_meta( '_mi_cod_advance' ) ),
					mi_core_money( $order->get_meta( '_mi_cod_balance' ) ),
					$payment_id
				)
			);
			$order->save();
			// Processing reduces stock and sends the "order received" email, like a paid order.
			$order->update_status( 'processing' );
			return;
		}

		$order->add_order_note( sprintf( /* translators: %s: payment id */ __( 'UPI payment received (Razorpay %s).', 'mi-trends-core' ), $payment_id ) );
		$order->payment_complete( $payment_id );
	}

	/**
	 * Refund through Razorpay.
	 *
	 * @param int        $order_id Order.
	 * @param float|null $amount   Amount.
	 * @param string     $reason   Reason.
	 * @return bool|WP_Error
	 */
	public function process_refund( $order_id, $amount = null, $reason = '' ) {
		$order = wc_get_order( $order_id );
		if ( ! $order || ! $order->get_transaction_id() ) {
			return new WP_Error( 'mi_rzp_refund', __( 'No Razorpay payment to refund.', 'mi-trends-core' ) );
		}
		$paid_online = 'mi_cod_advance' === $order->get_payment_method() ? (float) $order->get_meta( '_mi_cod_advance' ) : (float) $order->get_total();
		if ( null === $amount || $amount <= 0 || $amount > $paid_online ) {
			/* translators: %s: amount paid online */
			return new WP_Error( 'mi_rzp_refund', sprintf( __( 'Razorpay can refund up to %s (the amount paid online). Refund any cash collected on delivery separately.', 'mi-trends-core' ), mi_core_money( $paid_online ) ) );
		}
		$result = MI_Core_Razorpay_API::refund( $order->get_transaction_id(), (int) round( $amount * 100 ), $reason );
		if ( is_wp_error( $result ) ) {
			return $result;
		}
		$order->add_order_note( sprintf( /* translators: 1: amount, 2: refund id */ __( 'Refunded %1$s through Razorpay (%2$s).', 'mi-trends-core' ), mi_core_money( $amount ), isset( $result['id'] ) ? $result['id'] : '' ) );
		return true;
	}

	/**
	 * Settings fields shared by both gateways.
	 */
	public function init_form_fields() {
		$from_config = defined( 'MI_RAZORPAY_KEY_ID' ) && defined( 'MI_RAZORPAY_KEY_SECRET' );

		$this->form_fields = array(
			'enabled'     => array(
				'title'   => __( 'Enable', 'mi-trends-core' ),
				'type'    => 'checkbox',
				'label'   => $this->method_title,
				'default' => 'no',
			),
			'title'       => array(
				'title'   => __( 'Title', 'mi-trends-core' ),
				'type'    => 'text',
				'default' => $this->default_title(),
			),
			'description' => array(
				'title'   => __( 'Description', 'mi-trends-core' ),
				'type'    => 'textarea',
				'default' => '',
			),
		);

		// Keys are entered once, on the UPI gateway; COD with advance reuses them.
		if ( 'mi_razorpay_upi' === $this->id ) {
			$this->form_fields['keys'] = array(
				'title'       => __( 'Razorpay keys', 'mi-trends-core' ),
				'type'        => 'title',
				'description' => $from_config
					? __( 'Keys are set in wp-config.php (MI_RAZORPAY_KEY_ID / MI_RAZORPAY_KEY_SECRET) and override anything entered below.', 'mi-trends-core' )
					: __( 'Recommended: define MI_RAZORPAY_KEY_ID, MI_RAZORPAY_KEY_SECRET and MI_RAZORPAY_WEBHOOK_SECRET in wp-config.php instead of storing them here. Get keys at dashboard.razorpay.com → Settings → API Keys. Use rzp_test_ keys until you go live.', 'mi-trends-core' ),
			);
			$this->form_fields['key_id']         = array( 'title' => __( 'Key ID', 'mi-trends-core' ), 'type' => 'text', 'default' => '', 'placeholder' => 'rzp_test_…' );
			$this->form_fields['key_secret']     = array( 'title' => __( 'Key secret', 'mi-trends-core' ), 'type' => 'password', 'default' => '' );
			$this->form_fields['webhook_secret'] = array(
				'title'       => __( 'Webhook secret', 'mi-trends-core' ),
				'type'        => 'password',
				'default'     => '',
				/* translators: %s: webhook URL */
				'description' => sprintf( __( 'Optional. In Razorpay → Webhooks add %s for the payment.captured event with this secret.', 'mi-trends-core' ), '<code>' . esc_html( rest_url( 'mi-trends/v1/razorpay/webhook' ) ) . '</code>' ),
			);
		}
	}

	/**
	 * Default title.
	 *
	 * @return string
	 */
	abstract protected function default_title();
}
