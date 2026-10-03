<?php
/**
 * Store settings — lib/store-settings.ts plus the admin Settings screen.
 *
 * In the Next.js app these lived in localStorage ("mitrends-store-settings-v1"):
 * the admin wrote them, the storefront read them. Here they are one WordPress
 * option, `mi_core_settings`, edited at MI TRENDS → Settings.
 *
 * Settings WooCommerce already owns are NOT duplicated here: the low-stock
 * threshold is WooCommerce's "Low stock threshold", currency is WooCommerce's,
 * coupons are WooCommerce coupons. Razorpay keys are read from wp-config.php
 * constants first (see INSTALLATION.md), never stored in code.
 *
 * @package MI_Trends_Core
 */

defined( 'ABSPATH' ) || exit;

/**
 * Settings access.
 */
class MI_Core_Settings {

	const OPTION = 'mi_core_settings';

	/**
	 * Defaults — DEFAULT_STORE_SETTINGS and the admin seed values from the original.
	 *
	 * @return array<string,mixed>
	 */
	public static function defaults() {
		return array(
			// lib/store-settings.ts.
			'cod_enabled'             => true,
			'cod_minimum_order'       => 800,
			'cod_advance_percent'     => 20,
			'cod_fee'                 => 49,
			'free_shipping_threshold' => 999,
			'standard_shipping'       => 79,

			// Store identity (admin Settings screen).
			'store_name'              => 'MI TRENDS',
			'tagline'                 => 'Made to be noticed',
			'store_description'       => 'Original streetwear, graphic essentials and everyday statement pieces designed in India.',
			'support_email'           => 'support@mitrends.in',
			'support_phone'           => '+91 98765 43210',
			'support_hours'           => 'Mon–Sat, 10am–7pm IST',
			'registered_address'      => '',

			// Return address printed on shipping labels (components/admin/ShippingLabel.tsx).
			'return_name'             => 'MI TRENDS Dispatch',
			'return_line1'            => 'Unit 4, Design District',
			'return_city'             => 'Mumbai',
			'return_state'            => 'Maharashtra',
			'return_pincode'          => '400001',
			'return_phone'            => '+91 98200 00000',

			// Header marquee (Header.tsx).
			'announcements'           => array(
				'Free shipping over ₹999',
				'Easy 30-day returns',
				'Cash on delivery available',
				'Save 10% with MI10',
			),

			// Operations.
			'restock_returns'         => true,
			'refresh_on_load'         => false,
			'delivery_days'           => 5,
		);
	}

	/**
	 * All settings, merged over the defaults.
	 *
	 * @return array<string,mixed>
	 */
	public static function all() {
		static $cache = null;
		if ( null === $cache || did_action( 'update_option_' . self::OPTION ) ) {
			$saved = get_option( self::OPTION, array() );
			$cache = wp_parse_args( is_array( $saved ) ? $saved : array(), self::defaults() );
		}
		return $cache;
	}

	/**
	 * One setting.
	 *
	 * @param string $key Key.
	 * @return mixed
	 */
	public static function get( $key ) {
		$all = self::all();
		return array_key_exists( $key, $all ) ? $all[ $key ] : null;
	}

	/**
	 * Sanitise a submitted settings array.
	 *
	 * @param array $input Raw input.
	 * @return array
	 */
	public static function sanitize( $input ) {
		$defaults = self::defaults();
		$clean    = array();

		$bools = array( 'cod_enabled', 'restock_returns', 'refresh_on_load' );
		foreach ( $bools as $key ) {
			$clean[ $key ] = ! empty( $input[ $key ] );
		}

		$money = array( 'cod_minimum_order', 'cod_fee', 'free_shipping_threshold', 'standard_shipping' );
		foreach ( $money as $key ) {
			$clean[ $key ] = isset( $input[ $key ] ) ? max( 0, (float) $input[ $key ] ) : $defaults[ $key ];
		}

		$clean['cod_advance_percent'] = isset( $input['cod_advance_percent'] ) ? min( 100, max( 0, (int) $input['cod_advance_percent'] ) ) : $defaults['cod_advance_percent'];
		$clean['delivery_days']       = isset( $input['delivery_days'] ) ? min( 30, max( 1, (int) $input['delivery_days'] ) ) : $defaults['delivery_days'];

		$text = array( 'store_name', 'tagline', 'support_phone', 'support_hours', 'return_name', 'return_line1', 'return_city', 'return_state', 'return_pincode', 'return_phone' );
		foreach ( $text as $key ) {
			$clean[ $key ] = isset( $input[ $key ] ) ? sanitize_text_field( wp_unslash( $input[ $key ] ) ) : $defaults[ $key ];
		}

		$clean['store_description']  = isset( $input['store_description'] ) ? sanitize_textarea_field( wp_unslash( $input['store_description'] ) ) : $defaults['store_description'];
		$clean['registered_address'] = isset( $input['registered_address'] ) ? sanitize_textarea_field( wp_unslash( $input['registered_address'] ) ) : '';
		$clean['support_email']      = isset( $input['support_email'] ) && is_email( wp_unslash( $input['support_email'] ) ) ? sanitize_email( wp_unslash( $input['support_email'] ) ) : $defaults['support_email'];

		$lines                  = isset( $input['announcements'] ) ? (string) wp_unslash( $input['announcements'] ) : '';
		$lines                  = array_filter( array_map( 'sanitize_text_field', preg_split( '/\r\n|\r|\n/', $lines ) ) );
		$clean['announcements'] = array_values( array_slice( $lines, 0, 8 ) );

		return $clean;
	}

	/**
	 * Save settings.
	 *
	 * @param array $input Raw input.
	 */
	public static function save( $input ) {
		update_option( self::OPTION, self::sanitize( $input ), false );
	}

	/**
	 * A secret: a wp-config.php constant wins; otherwise the gateway setting.
	 *
	 * @param string $constant Constant name, e.g. MI_RAZORPAY_KEY_SECRET.
	 * @param string $fallback Value from settings.
	 * @return string
	 */
	public static function secret( $constant, $fallback = '' ) {
		if ( defined( $constant ) && constant( $constant ) ) {
			return (string) constant( $constant );
		}
		$env = getenv( $constant );
		if ( $env ) {
			return (string) $env;
		}
		return (string) $fallback;
	}
}
