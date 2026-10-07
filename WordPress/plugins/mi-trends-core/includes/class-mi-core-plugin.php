<?php
/**
 * Plugin loader.
 *
 * @package MI_Trends_Core
 */

defined( 'ABSPATH' ) || exit;

/**
 * Wires every module together.
 */
final class MI_Core_Plugin {

	/**
	 * Singleton.
	 *
	 * @var MI_Core_Plugin|null
	 */
	private static $instance = null;

	/**
	 * Get the instance.
	 *
	 * @return MI_Core_Plugin
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Load and initialise modules.
	 */
	private function __construct() {
		$includes = array(
			'includes/functions.php',
			'includes/class-mi-core-taxonomies.php',
			'includes/class-mi-core-product-data.php',
			'includes/class-mi-core-catalog.php',
			'includes/class-mi-core-shop-query.php',
			'includes/class-mi-core-cart.php',
			'includes/class-mi-core-coupons.php',
			'includes/class-mi-core-wishlist.php',
			'includes/class-mi-core-checkout.php',
			'includes/class-mi-core-cod.php',
			'includes/class-mi-core-order-status.php',
			'includes/class-mi-core-inventory.php',
			'includes/class-mi-core-accounts.php',
			'includes/class-mi-core-forms.php',
			'includes/class-mi-core-reports.php',
			'includes/class-mi-core-seeder.php',
			'includes/class-mi-core-emails.php',
			'api/class-mi-core-ajax.php',
			'api/class-mi-core-rest.php',
			'api/class-mi-core-razorpay-api.php',
		);
		foreach ( $includes as $file ) {
			require_once MI_CORE_DIR . $file;
		}

		MI_Core_Schema::maybe_upgrade();

		MI_Core_Taxonomies::init();
		MI_Core_Product_Data::init();
		MI_Core_Shop_Query::init();
		MI_Core_Cart::init();
		MI_Core_Coupons::init();
		MI_Core_Wishlist::init();
		MI_Core_Checkout::init();
		MI_Core_COD::init();
		MI_Core_Order_Status::init();
		MI_Core_Inventory::init();
		MI_Core_Accounts::init();
		MI_Core_Forms::init();
		MI_Core_Emails::init();
		MI_Core_Ajax::init();
		MI_Core_REST::init();

		// Shipping method and payment gateways extend WooCommerce classes, so they load on WooCommerce's hooks.
		add_action( 'woocommerce_shipping_init', array( $this, 'load_shipping' ) );
		add_filter( 'woocommerce_shipping_methods', array( $this, 'register_shipping' ) );
		add_action( 'plugins_loaded', array( $this, 'load_gateways' ), 30 );
		add_filter( 'woocommerce_payment_gateways', array( $this, 'register_gateways' ) );

		if ( is_admin() ) {
			require_once MI_CORE_DIR . 'admin/class-mi-core-admin.php';
			MI_Core_Admin::init();
		}

		if ( defined( 'WP_CLI' ) && WP_CLI ) {
			require_once MI_CORE_DIR . 'includes/class-mi-core-cli.php';
			WP_CLI::add_command( 'mi-trends', 'MI_Core_CLI' );
		}
	}

	/**
	 * Load the shipping method class.
	 */
	public function load_shipping() {
		require_once MI_CORE_DIR . 'includes/class-mi-core-shipping-method.php';
	}

	/**
	 * Register the shipping method.
	 *
	 * @param array $methods Methods.
	 * @return array
	 */
	public function register_shipping( $methods ) {
		$this->load_shipping();
		$methods['mi_trends_shipping'] = 'MI_Core_Shipping_Method';
		return $methods;
	}

	/**
	 * Load gateway classes.
	 */
	public function load_gateways() {
		if ( ! class_exists( 'WC_Payment_Gateway' ) ) {
			return;
		}
		require_once MI_CORE_DIR . 'includes/gateways/class-mi-core-gateway-razorpay.php';
		require_once MI_CORE_DIR . 'includes/gateways/class-mi-core-gateway-upi.php';
		require_once MI_CORE_DIR . 'includes/gateways/class-mi-core-gateway-cod-advance.php';
	}

	/**
	 * Register gateways.
	 *
	 * @param array $gateways Gateways.
	 * @return array
	 */
	public function register_gateways( $gateways ) {
		$this->load_gateways();
		$gateways[] = 'MI_Core_Gateway_UPI';
		$gateways[] = 'MI_Core_Gateway_COD_Advance';
		return $gateways;
	}
}
