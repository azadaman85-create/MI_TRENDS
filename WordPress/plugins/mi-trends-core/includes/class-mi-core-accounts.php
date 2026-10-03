<?php
/**
 * Customer accounts — lib/account/auth.tsx and the account routes.
 *
 * The original stored accounts and hashed passwords in the browser. Here they
 * are WordPress users with the WooCommerce "customer" role, authenticated by
 * WordPress (salted password hashing, sessions, password reset). What this
 * class adds:
 *   - /account/login/ and /account/signup/ on the My Account page (original routes),
 *     honouring ?next= after sign-in/sign-up
 *   - sign-up asks for full name and an Indian mobile number, as the original did
 *   - a hook (`mi_trends_social_login`) for a Google sign-in button; if the
 *     "Nextend Social Login" plugin is active its Google button is used.
 *
 * @package MI_Trends_Core
 */

defined( 'ABSPATH' ) || exit;

/**
 * Accounts.
 */
class MI_Core_Accounts {

	/**
	 * Hooks.
	 */
	public static function init() {
		add_action( 'init', array( __CLASS__, 'add_rewrite_rules' ) );
		add_filter( 'query_vars', array( __CLASS__, 'query_vars' ) );
		add_filter( 'redirect_canonical', array( __CLASS__, 'keep_auth_urls' ) );
		add_action( 'template_redirect', array( __CLASS__, 'signed_in_redirect' ) );
		add_action( 'woocommerce_register_post', array( __CLASS__, 'validate_registration' ), 10, 3 );
		add_action( 'woocommerce_created_customer', array( __CLASS__, 'save_registration' ), 10, 3 );
		add_filter( 'woocommerce_new_customer_data', array( __CLASS__, 'new_customer_data' ) );
		add_action( 'update_option_woocommerce_myaccount_page_id', array( __CLASS__, 'flush' ) );
		add_action( 'mi_trends_social_login', array( __CLASS__, 'nextend_button' ), 10, 2 );
		add_action( 'nsl_register_new_user', array( __CLASS__, 'mark_google' ) );
	}

	/**
	 * /account/login/ and /account/signup/ → My Account with mi_auth.
	 */
	public static function add_rewrite_rules() {
		if ( ! function_exists( 'wc_get_page_id' ) ) {
			return;
		}
		$page_id = wc_get_page_id( 'myaccount' );
		if ( $page_id <= 0 ) {
			return;
		}
		$uri = get_page_uri( $page_id );
		if ( ! $uri ) {
			return;
		}
		add_rewrite_rule( '^' . preg_quote( $uri, '#' ) . '/(login|signup)/?$', 'index.php?pagename=' . $uri . '&mi_auth=$matches[1]', 'top' );
	}

	/**
	 * Keep /account/login/ and /account/signup/ as typed (WordPress would otherwise
	 * "correct" them to the My Account page URL).
	 *
	 * @param string|false $redirect Redirect URL.
	 * @return string|false
	 */
	public static function keep_auth_urls( $redirect ) {
		return get_query_var( 'mi_auth' ) ? false : $redirect;
	}

	/**
	 * Register the query var.
	 *
	 * @param string[] $vars Vars.
	 * @return string[]
	 */
	public static function query_vars( $vars ) {
		$vars[] = 'mi_auth';
		return $vars;
	}

	/**
	 * Re-flush after the My Account page changes.
	 */
	public static function flush() {
		self::add_rewrite_rules();
		flush_rewrite_rules();
	}

	/**
	 * Signed-in visitors on /account/login or /account/signup go on to ?next= or the account.
	 */
	public static function signed_in_redirect() {
		if ( ! get_query_var( 'mi_auth' ) || ! is_user_logged_in() ) {
			return;
		}
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- redirect target only, validated.
		$next = isset( $_GET['next'] ) ? self::safe_next( wp_unslash( $_GET['next'] ) ) : '';
		wp_safe_redirect( $next ? $next : wc_get_page_permalink( 'myaccount' ) );
		exit;
	}

	/**
	 * Same-site absolute URL from a ?next= path.
	 *
	 * @param string $next Value.
	 * @return string
	 */
	public static function safe_next( $next ) {
		$next = trim( (string) $next );
		if ( '' === $next ) {
			return '';
		}
		if ( 0 === strpos( $next, '/' ) && 0 !== strpos( $next, '//' ) ) {
			$home = wp_parse_url( home_url() );
			$next = $home['scheme'] . '://' . $home['host'] . ( isset( $home['port'] ) ? ':' . $home['port'] : '' ) . $next;
		}
		return wp_validate_redirect( esc_url_raw( $next ), '' );
	}

	/**
	 * Sign-up checks with the original messages.
	 *
	 * @param string   $username Username.
	 * @param string   $email    Email.
	 * @param WP_Error $errors   Errors.
	 */
	public static function validate_registration( $username, $email, $errors ) {
		// phpcs:disable WordPress.Security.NonceVerification.Missing -- WooCommerce verified the register nonce before this action.
		$name     = isset( $_POST['mi_name'] ) ? sanitize_text_field( wp_unslash( $_POST['mi_name'] ) ) : '';
		$phone    = isset( $_POST['billing_phone'] ) ? preg_replace( '/\D/', '', sanitize_text_field( wp_unslash( $_POST['billing_phone'] ) ) ) : '';
		$password = isset( $_POST['password'] ) ? (string) wp_unslash( $_POST['password'] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- password, only measured.
		// phpcs:enable

		if ( ( function_exists( 'mb_strlen' ) ? mb_strlen( $name ) : strlen( $name ) ) < 2 ) {
			$errors->add( 'mi_name', __( 'Tell us what to call you.', 'mi-trends-core' ) );
		}
		if ( ! preg_match( '/^[6-9][0-9]{9}$/', $phone ) ) {
			$errors->add( 'mi_phone', __( 'Enter a valid 10-digit Indian mobile number.', 'mi-trends-core' ) );
		}
		if ( 'no' === get_option( 'woocommerce_registration_generate_password' ) && strlen( $password ) < 8 ) {
			$errors->add( 'mi_password', __( 'Use at least 8 characters.', 'mi-trends-core' ) );
		}
	}

	/**
	 * Use the full name as the display name at creation.
	 *
	 * @param array $data New customer data.
	 * @return array
	 */
	public static function new_customer_data( $data ) {
		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- inside WooCommerce's verified registration.
		$name = isset( $_POST['mi_name'] ) ? sanitize_text_field( wp_unslash( $_POST['mi_name'] ) ) : '';
		if ( $name ) {
			$parts              = preg_split( '/\s+/', $name, 2 );
			$data['first_name'] = $parts[0];
			$data['last_name']  = isset( $parts[1] ) ? $parts[1] : '';
			$data['display_name'] = $name;
		}
		return $data;
	}

	/**
	 * Store name and mobile on the new customer (so checkout is pre-filled).
	 *
	 * @param int   $customer_id   User.
	 * @param array $customer_data Data.
	 * @param bool  $generated     Password generated.
	 */
	public static function save_registration( $customer_id, $customer_data, $generated ) {
		// phpcs:disable WordPress.Security.NonceVerification.Missing -- inside WooCommerce's verified registration.
		$name  = isset( $_POST['mi_name'] ) ? sanitize_text_field( wp_unslash( $_POST['mi_name'] ) ) : '';
		$phone = isset( $_POST['billing_phone'] ) ? preg_replace( '/\D/', '', sanitize_text_field( wp_unslash( $_POST['billing_phone'] ) ) ) : '';
		// phpcs:enable

		$customer = new WC_Customer( $customer_id );
		if ( $name ) {
			$customer->set_display_name( $name );
			$customer->set_billing_first_name( $name );
		}
		if ( preg_match( '/^[6-9][0-9]{9}$/', $phone ) ) {
			$customer->set_billing_phone( '+91 ' . $phone );
		}
		$customer->set_billing_country( 'IN' );
		$customer->save();
		update_user_meta( $customer_id, '_mi_auth_provider', 'password' );
	}

	/**
	 * Google button from Nextend Social Login, if installed.
	 *
	 * @param string $mode     login | signup.
	 * @param string $redirect Where to go afterwards.
	 */
	public static function nextend_button( $mode, $redirect ) {
		if ( ! class_exists( 'NextendSocialLogin', false ) || ! shortcode_exists( 'nextend_social_login' ) ) {
			return;
		}
		echo '<div class="mi-social-login">';
		echo do_shortcode( '[nextend_social_login provider="google" redirect="' . esc_url( $redirect ) . '"]' );
		echo '</div>';
	}

	/**
	 * Remember that a Nextend-created user signed up with Google.
	 *
	 * @param int $user_id User.
	 */
	public static function mark_google( $user_id ) {
		update_user_meta( $user_id, '_mi_auth_provider', 'google' );
	}
}
