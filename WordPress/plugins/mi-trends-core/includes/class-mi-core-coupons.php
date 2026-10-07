<?php
/**
 * Coupons — StoreProvider.tsx (applyCoupon / calculateCouponDiscount) as
 * WooCommerce coupons.
 *
 * The original codes, as imported:
 *   MI10      10% off, no minimum                     → percent coupon
 *   FLAT200   ₹200 off on ₹1,499+                     → fixed cart, minimum spend 1499
 *   FIRST15   15% off up to ₹400 on ₹999+             → fixed cart with "percent, capped" meta
 *   FREESHIP  free shipping on ₹699+ (admin seed)     → free-shipping coupon (the MI shipping method honours it)
 *
 * WooCommerce has no "percent with a maximum" type, so FIRST15 is stored as a
 * fixed-cart coupon whose amount (the cap, ₹400) is lowered at calculation time
 * to 15% of the bag when that is smaller — min(400, round(subtotal × 0.15)),
 * exactly the original formula. Any coupon can use it: set "Percent, capped" in
 * the coupon's MI TRENDS fields.
 *
 * One code at a time, as in the original: applying a code replaces the last.
 * The messages are the original toasts.
 *
 * @package MI_Trends_Core
 */

defined( 'ABSPATH' ) || exit;

/**
 * Coupons.
 */
class MI_Core_Coupons {

	/**
	 * True while WooCommerce is calculating cart totals.
	 *
	 * @var bool
	 */
	private static $calculating = false;

	/**
	 * Hooks.
	 */
	public static function init() {
		add_action( 'woocommerce_before_calculate_totals', array( __CLASS__, 'start' ), 1 );
		add_action( 'woocommerce_after_calculate_totals', array( __CLASS__, 'stop' ), 999 );
		add_filter( 'woocommerce_coupon_get_amount', array( __CLASS__, 'capped_percent_amount' ), 10, 2 );
		add_action( 'woocommerce_applied_coupon', array( __CLASS__, 'one_at_a_time' ) );
		add_filter( 'woocommerce_coupon_error', array( __CLASS__, 'error_message' ), 10, 3 );
		add_filter( 'woocommerce_coupon_message', array( __CLASS__, 'success_message' ), 10, 3 );

		if ( is_admin() ) {
			add_action( 'woocommerce_coupon_options', array( __CLASS__, 'admin_fields' ), 10, 2 );
			add_action( 'woocommerce_coupon_options_save', array( __CLASS__, 'admin_save' ), 10, 2 );
		}
	}

	/** Cart calculation started. */
	public static function start() {
		self::$calculating = true;
	}

	/** Cart calculation finished. */
	public static function stop() {
		self::$calculating = false;
	}

	/**
	 * Bag subtotal at selling price — what calculateCouponDiscount() was given.
	 *
	 * @return float
	 */
	private static function cart_subtotal() {
		$total = 0.0;
		foreach ( WC()->cart->get_cart() as $item ) {
			if ( isset( $item['data'] ) && $item['data'] instanceof WC_Product ) {
				$total += (float) $item['data']->get_price() * (int) $item['quantity'];
			}
		}
		return $total;
	}

	/**
	 * "Percent, capped": the coupon amount becomes min(cap, round(subtotal × percent)).
	 *
	 * @param float     $amount Stored amount (the cap).
	 * @param WC_Coupon $coupon Coupon.
	 * @return float
	 */
	public static function capped_percent_amount( $amount, $coupon ) {
		if ( ! self::$calculating || ! WC()->cart ) {
			return $amount;
		}
		$percent = (float) $coupon->get_meta( '_mi_capped_percent' );
		if ( $percent <= 0 ) {
			return $amount;
		}
		return min( (float) $amount, round( self::cart_subtotal() * $percent / 100 ) );
	}

	/**
	 * Applying a code replaces any other (single coupon, as in the original).
	 *
	 * @param string $code Applied code.
	 */
	public static function one_at_a_time( $code ) {
		foreach ( WC()->cart->get_applied_coupons() as $applied ) {
			if ( wc_format_coupon_code( $applied ) !== wc_format_coupon_code( $code ) ) {
				WC()->cart->remove_coupon( $applied );
			}
		}
	}

	/**
	 * Original error wording.
	 *
	 * @param string    $message Message.
	 * @param int       $code    WooCommerce error code.
	 * @param WC_Coupon $coupon  Coupon.
	 * @return string
	 */
	public static function error_message( $message, $code, $coupon ) {
		if ( WC_Coupon::E_WC_COUPON_NOT_EXIST === $code || WC_Coupon::E_WC_COUPON_INVALID_FILTERED === $code ) {
			return __( 'That coupon code is not valid.', 'mi-trends-core' );
		}
		if ( WC_Coupon::E_WC_COUPON_MIN_SPEND_LIMIT_NOT_MET === $code && $coupon instanceof WC_Coupon ) {
			return sprintf(
				/* translators: 1: code, 2: minimum spend */
				__( '%1$s works on orders of %2$s or more.', 'mi-trends-core' ),
				strtoupper( $coupon->get_code() ),
				mi_core_money( $coupon->get_minimum_amount() )
			);
		}
		if ( WC_Coupon::E_WC_COUPON_PLEASE_ENTER === $code ) {
			return __( 'Enter a coupon code to continue.', 'mi-trends-core' );
		}
		return $message;
	}

	/**
	 * Original success wording.
	 *
	 * @param string    $message Message.
	 * @param int       $code    Code.
	 * @param WC_Coupon $coupon  Coupon.
	 * @return string
	 */
	public static function success_message( $message, $code, $coupon ) {
		if ( WC_Coupon::WC_COUPON_SUCCESS === $code && $coupon instanceof WC_Coupon ) {
			/* translators: %s: code */
			return sprintf( __( '%s applied. Your new total is ready.', 'mi-trends-core' ), strtoupper( $coupon->get_code() ) );
		}
		if ( WC_Coupon::WC_COUPON_REMOVED === $code ) {
			return __( 'Coupon removed.', 'mi-trends-core' );
		}
		return $message;
	}

	/**
	 * Coupon editor: the "percent, capped" field.
	 *
	 * @param int       $coupon_id Coupon.
	 * @param WC_Coupon $coupon    Coupon.
	 */
	public static function admin_fields( $coupon_id, $coupon ) {
		woocommerce_wp_text_input(
			array(
				'id'                => '_mi_capped_percent',
				'label'             => __( 'MI TRENDS: percent, capped', 'mi-trends-core' ),
				'description'       => __( 'For "15% off up to ₹400": choose Fixed cart discount, enter 400 as the amount and 15 here. The discount is the smaller of the two.', 'mi-trends-core' ),
				'desc_tip'          => true,
				'type'              => 'number',
				'custom_attributes' => array( 'min' => '0', 'max' => '100', 'step' => '1' ),
				'value'             => $coupon->get_meta( '_mi_capped_percent' ),
			)
		);
	}

	/**
	 * Save the field (WooCommerce has verified its nonce and capability before this action).
	 *
	 * @param int       $coupon_id Coupon.
	 * @param WC_Coupon $coupon    Coupon.
	 */
	public static function admin_save( $coupon_id, $coupon ) {
		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- runs inside WooCommerce's verified coupon save.
		$value = isset( $_POST['_mi_capped_percent'] ) ? min( 100, max( 0, (float) wp_unslash( $_POST['_mi_capped_percent'] ) ) ) : 0;
		if ( $value > 0 ) {
			$coupon->update_meta_data( '_mi_capped_percent', $value );
		} else {
			$coupon->delete_meta_data( '_mi_capped_percent' );
		}
		$coupon->save();
	}
}
