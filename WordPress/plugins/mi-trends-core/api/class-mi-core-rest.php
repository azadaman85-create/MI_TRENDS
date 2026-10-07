<?php
/**
 * REST API — namespace mi-trends/v1.
 *
 * Public (no login; inputs validated, rate-limited where it matters):
 *   GET  /search?q=                 live search for the search overlay
 *   GET  /products                  catalogue in the storefront's Product shape
 *   POST /track-order               {order, contact} → tracking stages
 *   POST /razorpay/verify           checkout signature check → completes the order
 *   POST /razorpay/webhook          Razorpay webhook (HMAC-verified)
 * Staff only (manage_woocommerce):
 *   GET  /stock                     productId → size → units (the original "stock feed")
 *   POST /stock                     {variation_id, quantity, note} → set stock, logged
 *   GET  /dashboard?days=30         dashboard figures
 *
 * Full request/response reference: WordPress/API-STRUCTURE.md.
 *
 * @package MI_Trends_Core
 */

defined( 'ABSPATH' ) || exit;

/**
 * REST routes.
 */
class MI_Core_REST {

	const NS = 'mi-trends/v1';

	/**
	 * Hooks.
	 */
	public static function init() {
		add_action( 'rest_api_init', array( __CLASS__, 'routes' ) );
	}

	/**
	 * Staff permission.
	 *
	 * @return bool
	 */
	public static function staff() {
		return current_user_can( 'manage_woocommerce' );
	}

	/**
	 * Register routes.
	 */
	public static function routes() {
		register_rest_route(
			self::NS,
			'/search',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'search' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'q' => array( 'type' => 'string', 'required' => false, 'sanitize_callback' => 'sanitize_text_field' ),
				),
			)
		);
		register_rest_route(
			self::NS,
			'/products',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'products' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'per_page' => array( 'type' => 'integer', 'default' => 24, 'minimum' => 1, 'maximum' => 100 ),
					'page'     => array( 'type' => 'integer', 'default' => 1, 'minimum' => 1 ),
				),
			)
		);
		register_rest_route(
			self::NS,
			'/track-order',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'track' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'order'   => array( 'type' => 'string', 'required' => true, 'sanitize_callback' => 'sanitize_text_field' ),
					'contact' => array( 'type' => 'string', 'required' => true, 'sanitize_callback' => 'sanitize_text_field' ),
				),
			)
		);
		register_rest_route(
			self::NS,
			'/razorpay/verify',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'verify_payment' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'order_id'            => array( 'type' => 'integer', 'required' => true ),
					'order_key'           => array( 'type' => 'string', 'required' => true, 'sanitize_callback' => 'sanitize_text_field' ),
					'razorpay_order_id'   => array( 'type' => 'string', 'required' => true, 'sanitize_callback' => 'sanitize_text_field' ),
					'razorpay_payment_id' => array( 'type' => 'string', 'required' => true, 'sanitize_callback' => 'sanitize_text_field' ),
					'razorpay_signature'  => array( 'type' => 'string', 'required' => true, 'sanitize_callback' => 'sanitize_text_field' ),
				),
			)
		);
		register_rest_route(
			self::NS,
			'/razorpay/webhook',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'webhook' ),
				'permission_callback' => '__return_true',
			)
		);
		register_rest_route(
			self::NS,
			'/stock',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'stock_feed' ),
					'permission_callback' => array( __CLASS__, 'staff' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( __CLASS__, 'set_stock' ),
					'permission_callback' => array( __CLASS__, 'staff' ),
					'args'                => array(
						'variation_id' => array( 'type' => 'integer', 'required' => true ),
						'quantity'     => array( 'type' => 'integer', 'required' => true, 'minimum' => 0 ),
						'note'         => array( 'type' => 'string', 'default' => '', 'sanitize_callback' => 'sanitize_text_field' ),
					),
				),
			)
		);
		register_rest_route(
			self::NS,
			'/dashboard',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'dashboard' ),
				'permission_callback' => array( __CLASS__, 'staff' ),
				'args'                => array(
					'days' => array( 'type' => 'integer', 'default' => 30, 'enum' => array( 7, 30, 90 ) ),
				),
			)
		);
	}

	/**
	 * The fields a search suggestion needs.
	 *
	 * @param array $view Product view.
	 * @return array
	 */
	private static function suggestion( $view ) {
		return array(
			'id'              => $view['id'],
			'name'            => $view['name'],
			'url'             => $view['url'],
			'collection'      => $view['collection'],
			'type'            => $view['type'],
			'price'           => $view['price'],
			'price_formatted' => mi_core_money( $view['price'] ),
			'image'           => $view['image_url'],
			'palette'         => $view['palette'],
			'art'             => $view['art'],
		);
	}

	/**
	 * GET /search — empty query returns the six most popular, like the overlay.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response
	 */
	public static function search( $request ) {
		$q = trim( (string) $request->get_param( 'q' ) );
		if ( '' === $q ) {
			$ids = MI_Core_Catalog::popular_ids( 6 );
		} else {
			$q   = substr( $q, 0, 80 );
			$wpq = new WP_Query(
				array(
					'post_type'      => 'product',
					'post_status'    => 'publish',
					'posts_per_page' => 30,
					'fields'         => 'ids',
					'no_found_rows'  => true,
					'mi_search'      => $q,
					'meta_key'       => '_mi_popularity', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
					'orderby'        => array( 'meta_value_num' => 'DESC', 'menu_order' => 'ASC' ),
				)
			);
			$ids = $wpq->posts;
		}

		$items = array();
		foreach ( $ids as $id ) {
			$view = MI_Core_Product_Data::view( (int) $id );
			if ( $view ) {
				$items[] = self::suggestion( $view );
			}
		}

		$response = rest_ensure_response( array( 'query' => $q, 'total' => count( $items ), 'items' => $items ) );
		$response->header( 'Cache-Control', 'public, max-age=60' );
		return $response;
	}

	/**
	 * GET /products — catalogue in the storefront's shape.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response
	 */
	public static function products( $request ) {
		$per_page = (int) $request->get_param( 'per_page' );
		$page     = (int) $request->get_param( 'page' );
		$query    = new WP_Query(
			array(
				'post_type'      => 'product',
				'post_status'    => 'publish',
				'posts_per_page' => $per_page,
				'paged'          => $page,
				'fields'         => 'ids',
				'orderby'        => array( 'menu_order' => 'ASC', 'ID' => 'ASC' ),
			)
		);
		$items = array();
		foreach ( $query->posts as $id ) {
			$view = MI_Core_Product_Data::view( (int) $id );
			if ( $view ) {
				unset( $view['variations'] );
				$items[] = $view;
			}
		}
		$response = rest_ensure_response( $items );
		$response->header( 'X-WP-Total', (string) $query->found_posts );
		$response->header( 'X-WP-TotalPages', (string) $query->max_num_pages );
		return $response;
	}

	/**
	 * POST /track-order.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function track( $request ) {
		$result = MI_Core_Forms::track( (string) $request->get_param( 'order' ), (string) $request->get_param( 'contact' ) );
		return is_wp_error( $result ) ? $result : rest_ensure_response( $result );
	}

	/**
	 * POST /razorpay/verify — app/api/verify-payment, plus completing the WooCommerce order.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function verify_payment( $request ) {
		$order = wc_get_order( (int) $request->get_param( 'order_id' ) );
		if ( ! $order || ! hash_equals( $order->get_order_key(), (string) $request->get_param( 'order_key' ) ) ) {
			return new WP_Error( 'mi_rzp_order', __( 'Order not found.', 'mi-trends-core' ), array( 'status' => 404 ) );
		}
		if ( ! in_array( $order->get_payment_method(), array( 'mi_razorpay_upi', 'mi_cod_advance' ), true ) ) {
			return new WP_Error( 'mi_rzp_method', __( 'This order is not paid through Razorpay.', 'mi-trends-core' ), array( 'status' => 400 ) );
		}

		$rzp_order  = (string) $request->get_param( 'razorpay_order_id' );
		$payment_id = (string) $request->get_param( 'razorpay_payment_id' );
		$signature  = (string) $request->get_param( 'razorpay_signature' );

		if ( ! hash_equals( (string) $order->get_meta( '_mi_rzp_order_id' ), $rzp_order ) ) {
			return new WP_Error( 'mi_rzp_mismatch', __( 'Payment does not belong to this order.', 'mi-trends-core' ), array( 'status' => 400 ) );
		}
		if ( ! MI_Core_Razorpay_API::verify_signature( $rzp_order, $payment_id, $signature ) ) {
			$order->add_order_note( __( 'Razorpay signature mismatch — payment not accepted.', 'mi-trends-core' ) );
			return new WP_REST_Response( array( 'success' => false, 'message' => __( 'Signature mismatch.', 'mi-trends-core' ) ), 400 );
		}

		MI_Core_Gateway_Razorpay::complete( $order, $payment_id );

		return rest_ensure_response(
			array(
				'success'  => true,
				'orderId'  => $rzp_order,
				'redirect' => $order->get_checkout_order_received_url(),
			)
		);
	}

	/**
	 * POST /razorpay/webhook — completes orders whose browser closed before /verify.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response
	 */
	public static function webhook( $request ) {
		$body      = $request->get_body();
		$signature = (string) $request->get_header( 'x_razorpay_signature' );
		if ( ! MI_Core_Razorpay_API::verify_webhook( $body, $signature ) ) {
			return new WP_REST_Response( array( 'ok' => false ), 401 );
		}

		$event   = json_decode( $body, true );
		$payment = isset( $event['payload']['payment']['entity'] ) ? $event['payload']['payment']['entity'] : null;
		if ( ! $payment || ! in_array( isset( $event['event'] ) ? $event['event'] : '', array( 'payment.captured', 'order.paid' ), true ) ) {
			return rest_ensure_response( array( 'ok' => true, 'ignored' => true ) );
		}

		$order_id = isset( $payment['notes']['wc_order_id'] ) ? (int) $payment['notes']['wc_order_id'] : 0;
		$order    = $order_id ? wc_get_order( $order_id ) : null;
		if ( $order && isset( $payment['order_id'] ) && hash_equals( (string) $order->get_meta( '_mi_rzp_order_id' ), (string) $payment['order_id'] ) ) {
			MI_Core_Gateway_Razorpay::complete( $order, sanitize_text_field( (string) $payment['id'] ) );
		}
		return rest_ensure_response( array( 'ok' => true ) );
	}

	/**
	 * GET /stock — productId → size → units, the original stock feed's shape.
	 *
	 * @return WP_REST_Response
	 */
	public static function stock_feed() {
		$feed = array();
		foreach ( MI_Core_Inventory::rows() as $row ) {
			$sizes = array();
			foreach ( $row['cells'] as $size => $cell ) {
				$sizes[ $size ] = $cell['units'];
			}
			$feed[ (string) $row['view']['id'] ] = $sizes;
		}
		return rest_ensure_response( $feed );
	}

	/**
	 * POST /stock — set one size's stock (logged as an adjustment).
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function set_stock( $request ) {
		$variation = wc_get_product( (int) $request->get_param( 'variation_id' ) );
		if ( ! $variation || ! $variation->is_type( 'variation' ) ) {
			return new WP_Error( 'mi_stock', __( 'Variation not found.', 'mi-trends-core' ), array( 'status' => 404 ) );
		}
		MI_Core_Inventory::set_stock( $variation->get_id(), (int) $request->get_param( 'quantity' ), (string) $request->get_param( 'note' ) );
		return rest_ensure_response( array( 'variation_id' => $variation->get_id(), 'quantity' => (int) wc_get_product( $variation->get_id() )->get_stock_quantity() ) );
	}

	/**
	 * GET /dashboard.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response
	 */
	public static function dashboard( $request ) {
		return rest_ensure_response( MI_Core_Reports::dashboard( (int) $request->get_param( 'days' ) ) );
	}
}
