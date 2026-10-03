<?php
/**
 * Storefront forms that only showed a toast in the original — now stored:
 *
 *   Newsletter (footer) and "Get notified" (Gift cards, Stores)
 *       → {prefix}mi_subscribers, source = footer | notify:gift-cards | notify:stores
 *   Contact form
 *       → private post type mi_message (MI TRENDS → Messages) + email to the support address
 *   Track order
 *       → real WooCommerce order lookup by number + billing email/mobile
 *
 * Each has a honeypot field and a per-IP rate limit; IPs are only stored hashed.
 *
 * @package MI_Trends_Core
 */

defined( 'ABSPATH' ) || exit;

/**
 * Forms.
 */
class MI_Core_Forms {

	/**
	 * Hooks.
	 */
	public static function init() {
		add_action( 'init', array( __CLASS__, 'register_message_type' ) );
		add_action( 'admin_post_mi_trends_subscribe', array( __CLASS__, 'post_subscribe' ) );
		add_action( 'admin_post_nopriv_mi_trends_subscribe', array( __CLASS__, 'post_subscribe' ) );
		add_action( 'admin_post_mi_trends_contact', array( __CLASS__, 'post_contact' ) );
		add_action( 'admin_post_nopriv_mi_trends_contact', array( __CLASS__, 'post_contact' ) );
	}

	/**
	 * Messages: private, admin-only post type.
	 */
	public static function register_message_type() {
		register_post_type(
			'mi_message',
			array(
				'labels'          => array(
					'name'          => __( 'Messages', 'mi-trends-core' ),
					'singular_name' => __( 'Message', 'mi-trends-core' ),
					'edit_item'     => __( 'Message', 'mi-trends-core' ),
					'search_items'  => __( 'Search messages', 'mi-trends-core' ),
					'not_found'     => __( 'No messages yet.', 'mi-trends-core' ),
				),
				'public'          => false,
				'show_ui'         => true,
				'show_in_menu'    => false,
				'supports'        => array( 'title', 'editor' ),
				'capability_type' => 'shop_order',
				'map_meta_cap'    => true,
				'capabilities'    => array( 'create_posts' => 'do_not_allow' ),
			)
		);
	}

	/**
	 * Hashed client IP (never stored raw).
	 *
	 * @return string
	 */
	public static function ip_hash() {
		$ip = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';
		return hash_hmac( 'sha256', $ip, wp_salt( 'nonce' ) );
	}

	/**
	 * Simple per-IP rate limit.
	 *
	 * @param string $bucket Name.
	 * @param int    $max    Attempts.
	 * @param int    $window Seconds.
	 * @return bool True when allowed.
	 */
	public static function allow( $bucket, $max, $window ) {
		$key   = 'mi_rl_' . $bucket . '_' . substr( self::ip_hash(), 0, 20 );
		$count = (int) get_transient( $key );
		if ( $count >= $max ) {
			return false;
		}
		set_transient( $key, $count + 1, $window );
		return true;
	}

	/**
	 * Save a sign-up.
	 *
	 * @param string $email  Email.
	 * @param string $source Source.
	 * @return string|WP_Error Message for the toast.
	 */
	public static function subscribe( $email, $source ) {
		global $wpdb;
		$email  = sanitize_email( $email );
		$source = sanitize_text_field( $source );
		if ( ! preg_match( '/^(footer|notify:[a-z0-9-]{1,40})$/', $source ) ) {
			$source = 'footer';
		}
		if ( ! is_email( $email ) ) {
			return new WP_Error( 'mi_email', __( 'Enter a valid email address.', 'mi-trends-core' ) );
		}
		if ( ! self::allow( 'subscribe', 10, HOUR_IN_SECONDS ) ) {
			return new WP_Error( 'mi_rate', __( 'Too many attempts. Please try again later.', 'mi-trends-core' ) );
		}

		$table = MI_Core_Schema::subscribers();
		$now   = current_time( 'mysql', true );
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery,WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- custom table; values prepared.
		$wpdb->query(
			$wpdb->prepare(
				"INSERT INTO {$table} (email, source, status, user_id, ip_hash, created_at, updated_at) VALUES (%s, %s, 'subscribed', %d, %s, %s, %s) ON DUPLICATE KEY UPDATE status = 'subscribed', updated_at = VALUES(updated_at)", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				strtolower( $email ),
				$source,
				get_current_user_id(),
				self::ip_hash(),
				$now,
				$now
			)
		);

		do_action( 'mi_core_subscribed', $email, $source );

		return 0 === strpos( $source, 'notify:' )
			? __( "You're on the list — we'll email you the moment this is live.", 'mi-trends-core' )
			: __( 'You’re on the list. Fresh drops, no inbox clutter.', 'mi-trends-core' );
	}

	/**
	 * Save a contact message and email support.
	 *
	 * @param array $input name, email, order_id, message.
	 * @return string|WP_Error
	 */
	public static function contact( $input ) {
		$name    = sanitize_text_field( isset( $input['name'] ) ? $input['name'] : '' );
		$email   = sanitize_email( isset( $input['email'] ) ? $input['email'] : '' );
		$order   = sanitize_text_field( isset( $input['order_id'] ) ? $input['order_id'] : '' );
		$message = sanitize_textarea_field( isset( $input['message'] ) ? $input['message'] : '' );

		if ( '' === $name || ! is_email( $email ) || '' === trim( $message ) ) {
			return new WP_Error( 'mi_contact', __( 'We couldn’t send that. Check the fields and try again.', 'mi-trends-core' ) );
		}
		if ( ! self::allow( 'contact', 5, HOUR_IN_SECONDS ) ) {
			return new WP_Error( 'mi_rate', __( 'Too many messages. Please try again later.', 'mi-trends-core' ) );
		}

		$post_id = wp_insert_post(
			array(
				'post_type'    => 'mi_message',
				'post_status'  => 'private',
				/* translators: 1: name, 2: email */
				'post_title'   => sprintf( __( '%1$s <%2$s>', 'mi-trends-core' ), $name, $email ),
				'post_content' => $message,
			),
			true
		);
		if ( is_wp_error( $post_id ) ) {
			return new WP_Error( 'mi_contact', __( 'We couldn’t send that. Check the fields and try again.', 'mi-trends-core' ) );
		}
		update_post_meta( $post_id, '_mi_email', $email );
		update_post_meta( $post_id, '_mi_name', $name );
		update_post_meta( $post_id, '_mi_order_ref', $order );
		update_post_meta( $post_id, '_mi_status', 'new' );

		$to = (string) MI_Core_Settings::get( 'support_email' );
		if ( is_email( $to ) ) {
			wp_mail(
				$to,
				/* translators: %s: name */
				sprintf( __( '[MI TRENDS] Message from %s', 'mi-trends-core' ), $name ),
				$message . "\n\n—\n" . $name . ' <' . $email . '>' . ( $order ? "\n" . __( 'Order:', 'mi-trends-core' ) . ' ' . $order : '' ),
				array( 'Reply-To: ' . str_replace( array( "\r", "\n" ), '', $name ) . ' <' . $email . '>' )
			);
		}

		do_action( 'mi_core_contact_message', $post_id );

		return __( "Message sent — we'll reply within 24 hours.", 'mi-trends-core' );
	}

	/**
	 * Find an order by number + billing email or mobile, and describe its progress.
	 *
	 * @param string $number  Order number (MIT…).
	 * @param string $contact Email or mobile used at checkout.
	 * @return array|WP_Error
	 */
	public static function track( $number, $contact ) {
		$number  = sanitize_text_field( $number );
		$contact = sanitize_text_field( $contact );
		if ( strlen( trim( $number ) ) < 4 ) {
			return new WP_Error( 'mi_track', __( 'Enter the order ID from your confirmation email.', 'mi-trends-core' ), array( 'status' => 400 ) );
		}
		if ( '' === trim( $contact ) ) {
			return new WP_Error( 'mi_track', __( 'Enter the email or mobile number used at checkout.', 'mi-trends-core' ), array( 'status' => 400 ) );
		}
		if ( ! self::allow( 'track', 20, 10 * MINUTE_IN_SECONDS ) ) {
			return new WP_Error( 'mi_rate', __( 'Too many attempts. Please try again in a few minutes.', 'mi-trends-core' ), array( 'status' => 429 ) );
		}

		$not_found = new WP_Error( 'mi_track', __( 'We couldn’t find an order with those details.', 'mi-trends-core' ), array( 'status' => 404 ) );
		$order     = wc_get_order( MI_Core_Checkout::order_id_from_number( $number ) );
		if ( ! $order || 'shop_order' !== $order->get_type() ) {
			return $not_found;
		}

		$digits = substr( preg_replace( '/\D/', '', $contact ), -10 );
		$match  = ( is_email( $contact ) && 0 === strcasecmp( $contact, $order->get_billing_email() ) )
			|| ( 10 === strlen( $digits ) && substr( preg_replace( '/\D/', '', $order->get_billing_phone() ), -10 ) === $digits );
		if ( ! $match ) {
			return $not_found;
		}

		$tracking = MI_Core_Order_Status::tracking( $order );
		$courier  = (string) $order->get_meta( '_mi_courier' );
		$awb      = (string) $order->get_meta( '_mi_tracking_number' );

		return array(
			'order'       => $order->get_order_number(),
			'stage_label' => $tracking['stage_label'],
			'stages'      => $tracking['stages'],
			'complete'    => $tracking['complete'],
			/* translators: 1: courier, 2: tracking number */
			'tracking'    => $awb ? sprintf( __( '%1$s · Tracking number %2$s', 'mi-trends-core' ), $courier ? $courier : __( 'Courier', 'mi-trends-core' ), $awb ) : '',
		);
	}

	/**
	 * Newsletter / notify without JavaScript.
	 */
	public static function post_subscribe() {
		check_admin_referer( 'mi_trends_subscribe', 'mi_subscribe_nonce' );
		$back = wp_get_referer() ? wp_get_referer() : home_url( '/' );
		if ( ! empty( $_POST['mi_hp'] ) ) {
			wp_safe_redirect( $back );
			exit;
		}
		$result = self::subscribe(
			isset( $_POST['email'] ) ? sanitize_email( wp_unslash( $_POST['email'] ) ) : '',
			isset( $_POST['source'] ) ? sanitize_text_field( wp_unslash( $_POST['source'] ) ) : 'footer'
		);
		wp_safe_redirect( add_query_arg( 'mi_subscribed', is_wp_error( $result ) ? 'error' : 'yes', $back ) );
		exit;
	}

	/**
	 * Contact without JavaScript.
	 */
	public static function post_contact() {
		check_admin_referer( 'mi_trends_contact', 'mi_contact_nonce' );
		$back = wp_get_referer() ? wp_get_referer() : home_url( '/' );
		if ( ! empty( $_POST['mi_hp'] ) ) {
			wp_safe_redirect( add_query_arg( 'mi_contact', 'sent', $back ) );
			exit;
		}
		$result = self::contact(
			array(
				'name'     => isset( $_POST['name'] ) ? sanitize_text_field( wp_unslash( $_POST['name'] ) ) : '',
				'email'    => isset( $_POST['email'] ) ? sanitize_email( wp_unslash( $_POST['email'] ) ) : '',
				'order_id' => isset( $_POST['order_id'] ) ? sanitize_text_field( wp_unslash( $_POST['order_id'] ) ) : '',
				'message'  => isset( $_POST['message'] ) ? sanitize_textarea_field( wp_unslash( $_POST['message'] ) ) : '',
			)
		);
		wp_safe_redirect( add_query_arg( 'mi_contact', is_wp_error( $result ) ? 'error' : 'sent', $back ) );
		exit;
	}
}
