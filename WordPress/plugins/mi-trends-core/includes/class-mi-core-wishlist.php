<?php
/**
 * Wishlist — StoreProvider.tsx (toggleWishlist / isWishlisted).
 *
 * The original kept wishlist IDs in localStorage. Here:
 *   signed in  → user meta `_mi_wishlist` (array of product IDs), so it follows the account
 *   guest      → cookie `mi_wishlist` (comma-separated IDs, HttpOnly), merged into the
 *                account on sign-in.
 *
 * @package MI_Trends_Core
 */

defined( 'ABSPATH' ) || exit;

/**
 * Wishlist.
 */
class MI_Core_Wishlist {

	const META   = '_mi_wishlist';
	const COOKIE = 'mi_wishlist';
	const LIMIT  = 200;

	/**
	 * IDs set during this request (cookies only reach $_COOKIE on the next one).
	 *
	 * @var int[]|null
	 */
	private static $pending = null;

	/**
	 * Hooks.
	 */
	public static function init() {
		add_action( 'wp_login', array( __CLASS__, 'merge_on_login' ), 10, 2 );
	}

	/**
	 * Clean a list of IDs.
	 *
	 * @param mixed $ids IDs.
	 * @return int[]
	 */
	private static function clean( $ids ) {
		$ids = array_map( 'absint', (array) $ids );
		return array_slice( array_values( array_unique( array_filter( $ids ) ) ), 0, self::LIMIT );
	}

	/**
	 * Guest IDs from the cookie.
	 *
	 * @return int[]
	 */
	private static function cookie_ids() {
		if ( null !== self::$pending ) {
			return self::$pending;
		}
		$raw = isset( $_COOKIE[ self::COOKIE ] ) ? sanitize_text_field( wp_unslash( $_COOKIE[ self::COOKIE ] ) ) : '';
		return self::clean( explode( ',', $raw ) );
	}

	/**
	 * Write the guest cookie (30 days).
	 *
	 * @param int[] $ids IDs.
	 */
	private static function write_cookie( $ids ) {
		self::$pending = $ids;
		if ( headers_sent() ) {
			return;
		}
		setcookie(
			self::COOKIE,
			implode( ',', $ids ),
			array(
				'expires'  => $ids ? time() + 30 * DAY_IN_SECONDS : time() - HOUR_IN_SECONDS,
				'path'     => COOKIEPATH ? COOKIEPATH : '/',
				'domain'   => COOKIE_DOMAIN,
				'secure'   => is_ssl(),
				'httponly' => true,
				'samesite' => 'Lax',
			)
		);
	}

	/**
	 * Current visitor's wishlist.
	 *
	 * @return int[]
	 */
	public static function ids() {
		if ( is_user_logged_in() ) {
			return self::clean( get_user_meta( get_current_user_id(), self::META, true ) );
		}
		return self::cookie_ids();
	}

	/**
	 * Save the list.
	 *
	 * @param int[] $ids IDs.
	 */
	private static function store( $ids ) {
		$ids = self::clean( $ids );
		if ( is_user_logged_in() ) {
			update_user_meta( get_current_user_id(), self::META, $ids );
		} else {
			self::write_cookie( $ids );
		}
	}

	/**
	 * Add or remove a product.
	 *
	 * @param int $product_id Product.
	 * @return array{wishlisted:bool,count:int,message:string}|WP_Error
	 */
	public static function toggle( $product_id ) {
		$product = wc_get_product( $product_id );
		if ( ! $product || 'publish' !== $product->get_status() ) {
			return new WP_Error( 'mi_unavailable', __( 'This style is currently unavailable.', 'mi-trends-core' ) );
		}
		$ids    = self::ids();
		$exists = in_array( (int) $product_id, $ids, true );
		$ids    = $exists ? array_diff( $ids, array( (int) $product_id ) ) : array_merge( $ids, array( (int) $product_id ) );
		self::store( $ids );

		$name = $product->get_name();
		return array(
			'wishlisted' => ! $exists,
			'count'      => count( self::clean( $ids ) ),
			'message'    => $exists
				/* translators: %s: product */
				? sprintf( __( '%s removed from your wishlist.', 'mi-trends-core' ), $name )
				/* translators: %s: product */
				: sprintf( __( '%s saved to your wishlist.', 'mi-trends-core' ), $name ),
		);
	}

	/**
	 * Fold a guest wishlist into the account on sign-in.
	 *
	 * @param string  $login Login.
	 * @param WP_User $user  User.
	 */
	public static function merge_on_login( $login, $user ) {
		$guest = self::cookie_ids();
		if ( ! $guest ) {
			return;
		}
		$saved = self::clean( get_user_meta( $user->ID, self::META, true ) );
		update_user_meta( $user->ID, self::META, self::clean( array_merge( $saved, $guest ) ) );
		self::write_cookie( array() );
	}
}
