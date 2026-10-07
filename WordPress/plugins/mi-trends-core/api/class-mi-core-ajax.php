<?php
/**
 * admin-ajax.php endpoints used by the storefront script (theme assets/js/mi-trends.js).
 *
 * Every endpoint checks the `mi_trends_store` nonce, sanitises its input and
 * answers { success, data: { message, fragments, counts, … } }. Cart responses
 * carry WooCommerce cart fragments, so the drawer and every badge update in place.
 *
 *   mi_add_to_cart        product_id, variation_id, color, quantity
 *   mi_quick_add          product_id
 *   mi_update_cart_item   cart_item_key, quantity (0 removes)
 *   mi_toggle_wishlist    product_id
 *   mi_subscribe          email, source, mi_hp
 *   mi_contact            name, email, order_id, message, mi_hp
 *   mi_refresh            (none) — fragments + counts, for cached pages
 *
 * @package MI_Trends_Core
 */

defined( 'ABSPATH' ) || exit;

/**
 * AJAX.
 */
class MI_Core_Ajax {

	/**
	 * Register endpoints for signed-in and guest visitors.
	 */
	public static function init() {
		$actions = array(
			'mi_add_to_cart'      => 'add_to_cart',
			'mi_quick_add'        => 'quick_add',
			'mi_update_cart_item' => 'update_cart_item',
			'mi_toggle_wishlist'  => 'toggle_wishlist',
			'mi_subscribe'        => 'subscribe',
			'mi_contact'          => 'contact',
			'mi_refresh'          => 'refresh',
		);
		foreach ( $actions as $action => $method ) {
			add_action( 'wp_ajax_' . $action, array( __CLASS__, $method ) );
			add_action( 'wp_ajax_nopriv_' . $action, array( __CLASS__, $method ) );
		}
		add_filter( 'mi_trends_script_data', array( __CLASS__, 'script_data' ) );
	}

	/**
	 * Verify the storefront nonce or stop.
	 */
	private static function verify() {
		if ( ! check_ajax_referer( 'mi_trends_store', 'nonce', false ) ) {
			wp_send_json_error( array( 'message' => __( 'Your session expired. Refresh the page and try again.', 'mi-trends-core' ) ), 403 );
		}
	}

	/**
	 * Cart fragments (from the theme's woocommerce_add_to_cart_fragments filter) and counts.
	 *
	 * @return array
	 */
	private static function state() {
		WC()->cart->calculate_totals();
		return array(
			'fragments' => apply_filters( 'woocommerce_add_to_cart_fragments', array() ),
			'counts'    => array(
				'cart'     => WC()->cart->get_cart_contents_count(),
				'wishlist' => count( MI_Core_Wishlist::ids() ),
			),
		);
	}

	/**
	 * Integer from POST.
	 *
	 * @param string $key Key.
	 * @return int
	 */
	private static function int( $key ) {
		return isset( $_POST[ $key ] ) ? absint( wp_unslash( $_POST[ $key ] ) ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Missing -- verified in verify().
	}

	/**
	 * Text from POST.
	 *
	 * @param string $key Key.
	 * @return string
	 */
	private static function text( $key ) {
		return isset( $_POST[ $key ] ) ? sanitize_text_field( wp_unslash( $_POST[ $key ] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Missing -- verified in verify().
	}

	/**
	 * Add to bag from the product page.
	 */
	public static function add_to_cart() {
		self::verify();
		$product_id = self::int( 'product_id' );
		$result     = MI_Core_Cart::add( $product_id, self::int( 'variation_id' ), self::text( 'color' ), max( 1, self::int( 'quantity' ) ) );
		if ( is_wp_error( $result ) ) {
			wp_send_json_error( array_merge( array( 'message' => $result->get_error_message() ), self::state() ) );
		}
		wp_send_json_success(
			array_merge(
				array(
					/* translators: %s: product */
					'message'      => sprintf( __( '%s added to your bag.', 'mi-trends-core' ), get_the_title( $product_id ) ),
					'checkout_url' => is_user_logged_in() ? wc_get_checkout_url() : add_query_arg( 'next', rawurlencode( wp_make_link_relative( wc_get_checkout_url() ) ), trailingslashit( wc_get_page_permalink( 'myaccount' ) ) . 'signup/' ),
				),
				self::state()
			)
		);
	}

	/**
	 * Quick add from a product card.
	 */
	public static function quick_add() {
		self::verify();
		$product_id = self::int( 'product_id' );
		$result     = MI_Core_Cart::quick_add( $product_id );
		if ( is_wp_error( $result ) ) {
			wp_send_json_error( array_merge( array( 'message' => $result->get_error_message() ), self::state() ) );
		}
		/* translators: %s: product */
		wp_send_json_success( array_merge( array( 'message' => sprintf( __( '%s added to your bag.', 'mi-trends-core' ), get_the_title( $product_id ) ) ), self::state() ) );
	}

	/**
	 * Change a line's quantity in the drawer.
	 */
	public static function update_cart_item() {
		self::verify();
		$key      = preg_replace( '/[^a-f0-9]/', '', strtolower( self::text( 'cart_item_key' ) ) );
		$quantity = isset( $_POST['quantity'] ) ? (int) wp_unslash( $_POST['quantity'] ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Missing -- verified in verify().
		$result   = MI_Core_Cart::update( $key, $quantity );
		if ( is_wp_error( $result ) ) {
			wp_send_json_error( array_merge( array( 'message' => $result->get_error_message() ), self::state() ) );
		}
		wp_send_json_success( array_merge( array( 'message' => $result ), self::state() ) );
	}

	/**
	 * Wishlist heart.
	 */
	public static function toggle_wishlist() {
		self::verify();
		$result = MI_Core_Wishlist::toggle( self::int( 'product_id' ) );
		if ( is_wp_error( $result ) ) {
			wp_send_json_error( array( 'message' => $result->get_error_message() ) );
		}
		wp_send_json_success(
			array(
				'message'    => $result['message'],
				'wishlisted' => $result['wishlisted'],
				'counts'     => array( 'wishlist' => $result['count'] ),
			)
		);
	}

	/**
	 * Newsletter / notify-me.
	 */
	public static function subscribe() {
		self::verify();
		if ( '' !== self::text( 'mi_hp' ) ) {
			wp_send_json_success( array( 'message' => __( 'You’re on the list. Fresh drops, no inbox clutter.', 'mi-trends-core' ) ) );
		}
		$result = MI_Core_Forms::subscribe( self::text( 'email' ), self::text( 'source' ) );
		if ( is_wp_error( $result ) ) {
			wp_send_json_error( array( 'message' => $result->get_error_message() ) );
		}
		wp_send_json_success( array( 'message' => $result ) );
	}

	/**
	 * Contact form.
	 */
	public static function contact() {
		self::verify();
		if ( '' !== self::text( 'mi_hp' ) ) {
			wp_send_json_success( array( 'message' => __( "Message sent — we'll reply within 24 hours.", 'mi-trends-core' ) ) );
		}
		$result = MI_Core_Forms::contact(
			array(
				'name'     => self::text( 'name' ),
				'email'    => self::text( 'email' ),
				'order_id' => self::text( 'order_id' ),
				// phpcs:ignore WordPress.Security.NonceVerification.Missing -- verified in verify().
				'message'  => isset( $_POST['message'] ) ? sanitize_textarea_field( wp_unslash( $_POST['message'] ) ) : '',
			)
		);
		if ( is_wp_error( $result ) ) {
			wp_send_json_error( array( 'message' => $result->get_error_message() ) );
		}
		wp_send_json_success( array( 'message' => $result ) );
	}

	/**
	 * Current fragments and counts (for full-page-cached HTML).
	 */
	public static function refresh() {
		self::verify();
		wp_send_json_success( self::state() );
	}

	/**
	 * Expose the "refresh on load" setting to the theme script.
	 *
	 * @param array $data Script data.
	 * @return array
	 */
	public static function script_data( $data ) {
		$data['refreshOnLoad'] = (bool) MI_Core_Settings::get( 'refresh_on_load' );
		return $data;
	}
}
