<?php
/**
 * Razorpay — the server half of app/api/create-order and app/api/verify-payment.
 *
 * Keys come from wp-config.php constants (preferred) or the gateway settings:
 *   define( 'MI_RAZORPAY_KEY_ID', 'rzp_live_…' );
 *   define( 'MI_RAZORPAY_KEY_SECRET', '…' );          // never exposed to the browser
 *   define( 'MI_RAZORPAY_WEBHOOK_SECRET', '…' );      // for the optional webhook
 * Nothing is hard-coded here.
 *
 * @package MI_Trends_Core
 */

defined( 'ABSPATH' ) || exit;

/**
 * Minimal Razorpay REST client (orders, signature checks, refunds).
 */
class MI_Core_Razorpay_API {

	const BASE            = 'https://api.razorpay.com/v1/';
	const MIN_AMOUNT_PAISE = 100;

	/**
	 * Gateway option, shared by both MI gateways (stored on the UPI gateway).
	 *
	 * @param string $key Option key.
	 * @return string
	 */
	private static function option( $key ) {
		$settings = get_option( 'woocommerce_mi_razorpay_upi_settings', array() );
		return is_array( $settings ) && isset( $settings[ $key ] ) ? (string) $settings[ $key ] : '';
	}

	/**
	 * Public key ID (safe to send to the browser).
	 *
	 * @return string
	 */
	public static function key_id() {
		return MI_Core_Settings::secret( 'MI_RAZORPAY_KEY_ID', self::option( 'key_id' ) );
	}

	/**
	 * Secret (server only).
	 *
	 * @return string
	 */
	private static function key_secret() {
		return MI_Core_Settings::secret( 'MI_RAZORPAY_KEY_SECRET', self::option( 'key_secret' ) );
	}

	/**
	 * Webhook secret.
	 *
	 * @return string
	 */
	private static function webhook_secret() {
		return MI_Core_Settings::secret( 'MI_RAZORPAY_WEBHOOK_SECRET', self::option( 'webhook_secret' ) );
	}

	/**
	 * Are both keys present?
	 *
	 * @return bool
	 */
	public static function configured() {
		return '' !== self::key_id() && '' !== self::key_secret();
	}

	/**
	 * Call the API.
	 *
	 * @param string $method HTTP method.
	 * @param string $path   Path under /v1/.
	 * @param array  $body   JSON body.
	 * @return array|WP_Error
	 */
	private static function request( $method, $path, $body = null ) {
		if ( ! self::configured() ) {
			return new WP_Error( 'mi_rzp_config', __( 'Razorpay is not configured.', 'mi-trends-core' ) );
		}
		$args = array(
			'method'  => $method,
			'timeout' => 20,
			'headers' => array(
				// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- HTTP Basic auth header.
				'Authorization' => 'Basic ' . base64_encode( self::key_id() . ':' . self::key_secret() ),
				'Content-Type'  => 'application/json',
			),
		);
		if ( null !== $body ) {
			$args['body'] = wp_json_encode( $body );
		}

		$response = wp_remote_request( self::BASE . ltrim( $path, '/' ), $args );
		if ( is_wp_error( $response ) ) {
			return new WP_Error( 'mi_rzp_http', __( 'Could not reach Razorpay. Please try again.', 'mi-trends-core' ) );
		}
		$code = (int) wp_remote_retrieve_response_code( $response );
		$data = json_decode( (string) wp_remote_retrieve_body( $response ), true );

		if ( 401 === $code ) {
			return new WP_Error( 'mi_rzp_auth', __( 'Razorpay authentication failed.', 'mi-trends-core' ) );
		}
		if ( $code < 200 || $code >= 300 ) {
			$message = isset( $data['error']['description'] ) ? (string) $data['error']['description'] : __( 'Razorpay rejected the request.', 'mi-trends-core' );
			return new WP_Error( 'mi_rzp_error', $message, array( 'status' => $code ) );
		}
		return is_array( $data ) ? $data : array();
	}

	/**
	 * Create a Razorpay order (app/api/create-order/route.ts).
	 *
	 * @param int    $amount_paise Amount in paise (≥ 100).
	 * @param string $receipt      Receipt (our order number).
	 * @param array  $notes        Notes.
	 * @return array{id:string,amount:int,currency:string}|WP_Error
	 */
	public static function create_order( $amount_paise, $receipt, $notes = array() ) {
		$amount_paise = (int) round( $amount_paise );
		if ( $amount_paise < self::MIN_AMOUNT_PAISE ) {
			/* translators: %d: minimum paise */
			return new WP_Error( 'mi_rzp_amount', sprintf( __( 'Amount must be at least %d paise.', 'mi-trends-core' ), self::MIN_AMOUNT_PAISE ) );
		}
		$order = self::request(
			'POST',
			'orders',
			array(
				'amount'   => $amount_paise,
				'currency' => 'INR',
				'receipt'  => substr( (string) $receipt, 0, 40 ),
				'notes'    => $notes,
			)
		);
		if ( is_wp_error( $order ) ) {
			return $order;
		}
		if ( empty( $order['id'] ) ) {
			return new WP_Error( 'mi_rzp_order', __( 'Could not create the Razorpay order.', 'mi-trends-core' ) );
		}
		return array(
			'id'       => (string) $order['id'],
			'amount'   => (int) $order['amount'],
			'currency' => (string) $order['currency'],
		);
	}

	/**
	 * Check a checkout signature (app/api/verify-payment/route.ts): HMAC-SHA256 of
	 * "order_id|payment_id" with the key secret, compared in constant time.
	 *
	 * @param string $order_id   Razorpay order ID.
	 * @param string $payment_id Razorpay payment ID.
	 * @param string $signature  Signature from Razorpay Checkout.
	 * @return bool
	 */
	public static function verify_signature( $order_id, $payment_id, $signature ) {
		$secret = self::key_secret();
		if ( '' === $secret || '' === $order_id || '' === $payment_id || '' === $signature ) {
			return false;
		}
		$expected = hash_hmac( 'sha256', $order_id . '|' . $payment_id, $secret );
		return hash_equals( $expected, strtolower( $signature ) );
	}

	/**
	 * Check a webhook body against X-Razorpay-Signature.
	 *
	 * @param string $body      Raw body.
	 * @param string $signature Header value.
	 * @return bool
	 */
	public static function verify_webhook( $body, $signature ) {
		$secret = self::webhook_secret();
		if ( '' === $secret || '' === $signature ) {
			return false;
		}
		return hash_equals( hash_hmac( 'sha256', $body, $secret ), strtolower( $signature ) );
	}

	/**
	 * Refund a payment (full or partial).
	 *
	 * @param string $payment_id   Payment.
	 * @param int    $amount_paise Amount in paise.
	 * @param string $reason       Note.
	 * @return array|WP_Error
	 */
	public static function refund( $payment_id, $amount_paise, $reason = '' ) {
		return self::request(
			'POST',
			'payments/' . rawurlencode( $payment_id ) . '/refund',
			array(
				'amount' => (int) round( $amount_paise ),
				'notes'  => array( 'reason' => substr( (string) $reason, 0, 250 ) ),
			)
		);
	}
}
