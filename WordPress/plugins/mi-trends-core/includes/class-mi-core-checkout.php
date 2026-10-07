<?php
/**
 * Checkout — app/(store)/checkout/page.tsx rules on WooCommerce's checkout.
 *
 *  - Account required: signed-out shoppers are sent to sign-up and back.
 *  - Fields: one "Full name", +91 mobile, email, house/building, road/area,
 *    pincode, city, state (India), and Save as Home/Work/Other. No company,
 *    no last name, no order notes; India only.
 *  - Validation and messages are the original validate().
 *  - The mobile number is stored as "+91 XXXXXXXXXX", as the original did.
 *
 * @package MI_Trends_Core
 */

defined( 'ABSPATH' ) || exit;

/**
 * Checkout.
 */
class MI_Core_Checkout {

	/**
	 * Hooks.
	 */
	public static function init() {
		add_action( 'template_redirect', array( __CLASS__, 'require_account' ), 1 );
		add_filter( 'woocommerce_checkout_fields', array( __CLASS__, 'fields' ), 20 );
		add_filter( 'woocommerce_billing_fields', array( __CLASS__, 'billing_fields' ), 20 );
		add_filter( 'default_checkout_billing_country', array( __CLASS__, 'india' ) );
		add_filter( 'woocommerce_checkout_get_value', array( __CLASS__, 'prefill' ), 10, 2 );
		add_filter( 'woocommerce_checkout_posted_data', array( __CLASS__, 'normalize_posted' ) );
		add_action( 'woocommerce_after_checkout_validation', array( __CLASS__, 'validate' ), 10, 2 );
		add_filter( 'woocommerce_enable_order_notes_field', '__return_false' );
		add_filter( 'woocommerce_cart_needs_shipping_address', '__return_false' );
		add_action( 'woocommerce_admin_order_data_after_billing_address', array( __CLASS__, 'admin_address_type' ) );
		add_filter( 'woocommerce_order_number', array( __CLASS__, 'order_number' ), 10, 2 );
		add_filter( 'woocommerce_shop_order_search_fields', array( __CLASS__, 'search_fields' ) );
		add_filter( 'woocommerce_shop_order_search_results', array( __CLASS__, 'search_by_number' ), 10, 3 );
		add_action( 'init', array( __CLASS__, 'unhook_thankyou_table' ) );
	}

	/**
	 * Order numbers look like the original's (MIT + 8 digits): MIT10001234 for order 1234.
	 *
	 * @param string   $number Number.
	 * @param WC_Order $order  Order.
	 * @return string
	 */
	public static function order_number( $number, $order ) {
		return 'MIT' . ( 10000000 + (int) $order->get_id() );
	}

	/**
	 * Turn a typed order number (MIT10001234, #1234, 1234) into an order ID.
	 *
	 * @param string $number Input.
	 * @return int
	 */
	public static function order_id_from_number( $number ) {
		$number = strtoupper( trim( (string) $number ) );
		$digits = (int) preg_replace( '/\D/', '', $number );
		if ( 0 === strpos( $number, 'MIT' ) && $digits > 10000000 ) {
			return $digits - 10000000;
		}
		return $digits;
	}

	/**
	 * Legacy order screen search: also match the MIT number.
	 *
	 * @param array $fields Meta fields.
	 * @return array
	 */
	public static function search_fields( $fields ) {
		$fields[] = '_billing_phone';
		return $fields;
	}

	/**
	 * Legacy order screen: searching "MIT10001234" finds order 1234.
	 *
	 * @param int[]  $ids    Results.
	 * @param string $term   Search term.
	 * @param array  $fields Fields.
	 * @return int[]
	 */
	public static function search_by_number( $ids, $term, $fields ) {
		$id = self::order_id_from_number( $term );
		if ( $id && 0 === stripos( trim( $term ), 'MIT' ) ) {
			$ids[] = $id;
		}
		return array_unique( $ids );
	}

	/**
	 * Checkout needs an account (`router.replace("/account/signup?next=/checkout")`).
	 */
	public static function require_account() {
		if ( ! function_exists( 'is_checkout' ) || ! is_checkout() || is_user_logged_in() ) {
			return;
		}
		if ( is_wc_endpoint_url( 'order-received' ) || is_wc_endpoint_url( 'order-pay' ) ) {
			return;
		}
		if ( ! apply_filters( 'mi_core_checkout_requires_account', true ) ) {
			return;
		}
		$signup = trailingslashit( wc_get_page_permalink( 'myaccount' ) ) . 'signup/';
		wp_safe_redirect( add_query_arg( 'next', rawurlencode( wp_make_link_relative( wc_get_checkout_url() ) ), $signup ) );
		exit;
	}

	/**
	 * India.
	 *
	 * @return string
	 */
	public static function india() {
		return 'IN';
	}

	/**
	 * Billing fields shaped like the original form.
	 *
	 * @param array $fields Billing fields.
	 * @return array
	 */
	public static function billing_fields( $fields ) {
		unset( $fields['billing_last_name'], $fields['billing_company'] );

		$fields['billing_first_name'] = array_merge(
			isset( $fields['billing_first_name'] ) ? $fields['billing_first_name'] : array(),
			array(
				'label'        => __( 'Full name', 'mi-trends-core' ),
				'placeholder'  => __( 'Your full name', 'mi-trends-core' ),
				'class'        => array( 'form-row-first' ),
				'autocomplete' => 'name',
				'required'     => true,
				'priority'     => 10,
			)
		);
		$fields['billing_phone'] = array_merge(
			isset( $fields['billing_phone'] ) ? $fields['billing_phone'] : array(),
			array(
				'label'       => __( 'Mobile number', 'mi-trends-core' ),
				'placeholder' => __( '10-digit number', 'mi-trends-core' ),
				'class'       => array( 'form-row-last' ),
				'required'    => true,
				'priority'    => 20,
			)
		);
		$fields['billing_email'] = array_merge(
			isset( $fields['billing_email'] ) ? $fields['billing_email'] : array(),
			array(
				'label'       => __( 'Email address', 'mi-trends-core' ),
				'placeholder' => 'you@example.com',
				'description' => __( 'Order updates and your invoice will arrive here.', 'mi-trends-core' ),
				'class'       => array( 'form-row-wide' ),
				'required'    => true,
				'priority'    => 30,
			)
		);
		$fields['billing_address_1'] = array_merge(
			isset( $fields['billing_address_1'] ) ? $fields['billing_address_1'] : array(),
			array(
				'label'       => __( 'Flat, house or building', 'mi-trends-core' ),
				'placeholder' => __( 'House number and building', 'mi-trends-core' ),
				'class'       => array( 'form-row-wide', 'address-field' ),
				'required'    => true,
				'priority'    => 40,
			)
		);
		$fields['billing_address_2'] = array_merge(
			isset( $fields['billing_address_2'] ) ? $fields['billing_address_2'] : array(),
			array(
				'label'        => __( 'Road, area or locality', 'mi-trends-core' ),
				'label_class'  => array(),
				'placeholder'  => __( 'Area and nearby landmark', 'mi-trends-core' ),
				'class'        => array( 'form-row-wide', 'address-field' ),
				'required'     => true,
				'autocomplete' => 'address-line2',
				'priority'     => 50,
			)
		);
		$fields['billing_postcode'] = array_merge(
			isset( $fields['billing_postcode'] ) ? $fields['billing_postcode'] : array(),
			array(
				'label'             => __( 'Pincode', 'mi-trends-core' ),
				'placeholder'       => __( '6-digit pincode', 'mi-trends-core' ),
				'class'             => array( 'form-row-first', 'address-field' ),
				'required'          => true,
				'custom_attributes' => array( 'inputmode' => 'numeric', 'maxlength' => '6' ),
				'priority'          => 60,
			)
		);
		$fields['billing_city'] = array_merge(
			isset( $fields['billing_city'] ) ? $fields['billing_city'] : array(),
			array(
				'label'       => __( 'City', 'mi-trends-core' ),
				'placeholder' => __( 'City', 'mi-trends-core' ),
				'class'       => array( 'form-row-last', 'address-field' ),
				'required'    => true,
				'priority'    => 70,
			)
		);
		$fields['billing_state'] = array_merge(
			isset( $fields['billing_state'] ) ? $fields['billing_state'] : array(),
			array(
				'type'        => 'state',
				'country'     => 'IN',
				'label'       => __( 'State', 'mi-trends-core' ),
				'placeholder' => __( 'Choose state', 'mi-trends-core' ),
				'class'       => array( 'form-row-wide', 'address-field' ),
				'required'    => true,
				'priority'    => 80,
			)
		);
		$fields['billing_country'] = array_merge(
			isset( $fields['billing_country'] ) ? $fields['billing_country'] : array(),
			array(
				'type'     => 'hidden',
				'default'  => 'IN',
				'required' => false,
				'priority' => 90,
			)
		);
		$fields['billing_address_type'] = array(
			'type'     => 'radio',
			'label'    => __( 'Save as', 'mi-trends-core' ),
			'options'  => array(
				'home'  => __( 'Home', 'mi-trends-core' ),
				'work'  => __( 'Work', 'mi-trends-core' ),
				'other' => __( 'Other', 'mi-trends-core' ),
			),
			'default'  => 'home',
			'required' => false,
			'priority' => 100,
		);

		return $fields;
	}

	/**
	 * Checkout field set: no shipping or order fields (delivery goes to the billing address).
	 *
	 * @param array $fields Fields.
	 * @return array
	 */
	public static function fields( $fields ) {
		unset( $fields['order']['order_comments'] );
		return $fields;
	}

	/**
	 * Pre-fill from the account (the original filled name, email and mobile from the customer).
	 *
	 * @param mixed  $value Value.
	 * @param string $input Field.
	 * @return mixed
	 */
	public static function prefill( $value, $input ) {
		if ( ( null !== $value && '' !== $value ) || ! is_user_logged_in() ) {
			return $value;
		}
		$user = wp_get_current_user();
		if ( 'billing_first_name' === $input ) {
			return $user->display_name;
		}
		if ( 'billing_email' === $input ) {
			return $user->user_email;
		}
		if ( 'billing_country' === $input ) {
			return 'IN';
		}
		return $value;
	}

	/**
	 * Store the mobile as "+91 XXXXXXXXXX" and keep the address type to the three choices.
	 *
	 * @param array $data Posted data.
	 * @return array
	 */
	public static function normalize_posted( $data ) {
		if ( isset( $data['billing_phone'] ) ) {
			$digits = substr( preg_replace( '/\D/', '', (string) $data['billing_phone'] ), -10 );
			if ( preg_match( '/^[6-9][0-9]{9}$/', $digits ) ) {
				$data['billing_phone'] = '+91 ' . $digits;
			}
		}
		$data['billing_country'] = 'IN';
		if ( isset( $data['billing_address_type'] ) && ! in_array( $data['billing_address_type'], array( 'home', 'work', 'other' ), true ) ) {
			$data['billing_address_type'] = 'home';
		}
		return $data;
	}

	/**
	 * The original validate(): same rules, same messages.
	 *
	 * @param array    $data   Posted data.
	 * @param WP_Error $errors Errors.
	 */
	public static function validate( $data, $errors ) {
		$value = static function ( $key ) use ( $data ) {
			return isset( $data[ $key ] ) ? trim( (string) $data[ $key ] ) : '';
		};
		$len   = static function ( $text ) {
			return function_exists( 'mb_strlen' ) ? mb_strlen( $text ) : strlen( $text );
		};

		// Replace WooCommerce's generic "is a required field" notices for these fields with the original wording.
		foreach ( array( 'billing_first_name', 'billing_phone', 'billing_email', 'billing_address_1', 'billing_address_2', 'billing_postcode', 'billing_city', 'billing_state' ) as $key ) {
			$errors->remove( $key . '_required' );
			$errors->remove( $key . '_validation' );
		}

		if ( $len( $value( 'billing_first_name' ) ) < 2 ) {
			$errors->add( 'billing_first_name_mi', __( 'Enter the name we should use for delivery.', 'mi-trends-core' ), array( 'id' => 'billing_first_name' ) );
		}
		if ( ! preg_match( '/^[6-9][0-9]{9}$/', substr( preg_replace( '/\D/', '', $value( 'billing_phone' ) ), -10 ) ) ) {
			$errors->add( 'billing_phone_mi', __( 'Enter a valid 10-digit Indian mobile number.', 'mi-trends-core' ), array( 'id' => 'billing_phone' ) );
		}
		if ( ! is_email( $value( 'billing_email' ) ) ) {
			$errors->add( 'billing_email_mi', __( 'Enter a valid email address.', 'mi-trends-core' ), array( 'id' => 'billing_email' ) );
		}
		if ( $len( $value( 'billing_address_1' ) ) < 8 ) {
			$errors->add( 'billing_address_1_mi', __( 'Add a complete house, flat or building address.', 'mi-trends-core' ), array( 'id' => 'billing_address_1' ) );
		}
		if ( $len( $value( 'billing_address_2' ) ) < 3 ) {
			$errors->add( 'billing_address_2_mi', __( 'Add your road, area or locality.', 'mi-trends-core' ), array( 'id' => 'billing_address_2' ) );
		}
		if ( ! preg_match( '/^[1-9][0-9]{5}$/', $value( 'billing_postcode' ) ) ) {
			$errors->add( 'billing_postcode_mi', __( 'Enter a valid 6-digit pincode.', 'mi-trends-core' ), array( 'id' => 'billing_postcode' ) );
		}
		if ( $len( $value( 'billing_city' ) ) < 2 ) {
			$errors->add( 'billing_city_mi', __( 'Enter your city.', 'mi-trends-core' ), array( 'id' => 'billing_city' ) );
		}
		if ( '' === $value( 'billing_state' ) ) {
			$errors->add( 'billing_state_mi', __( 'Choose your state.', 'mi-trends-core' ), array( 'id' => 'billing_state' ) );
		}
	}

	/**
	 * Show Home/Work/Other on the admin order screen.
	 *
	 * @param WC_Order $order Order.
	 */
	public static function admin_address_type( $order ) {
		$type = $order->get_meta( '_billing_address_type' );
		if ( $type ) {
			echo '<p><strong>' . esc_html__( 'Saved as', 'mi-trends-core' ) . ':</strong> ' . esc_html( ucfirst( $type ) ) . '</p>';
		}
	}

	/**
	 * The confirmation page is the MI TRENDS design; WooCommerce's order table and
	 * customer details under it are dropped (they remain in the account and emails).
	 */
	public static function unhook_thankyou_table() {
		remove_action( 'woocommerce_thankyou', 'woocommerce_order_details_table', 10 );
	}
}
