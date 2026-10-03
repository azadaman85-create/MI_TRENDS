<?php
/**
 * Plugin Name:       MI Trends Core
 * Plugin URI:        https://mitrends.in/
 * Description:       Business logic for the MI TRENDS store on WooCommerce: catalogue fields (colours, collections, fit, fabric), shop filters, colour-aware cart, checkout rules, UPI and COD-with-UPI-advance payments through Razorpay, order statuses (confirmed, packed, shipped, delivered, returned), stock movement log, wishlist, dashboard, inventory, reports, customers, messages and subscribers.
 * Version:           1.0.0
 * Requires at least: 6.4
 * Requires PHP:      7.4
 * Requires Plugins:  woocommerce
 * Author:            MI TRENDS
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       mi-trends-core
 * Domain Path:       /languages
 * WC requires at least: 8.5
 * WC tested up to:   9.8
 *
 * @package MI_Trends_Core
 */

defined( 'ABSPATH' ) || exit;

define( 'MI_CORE_VERSION', '1.0.0' );
define( 'MI_CORE_DB_VERSION', '1.0.0' );
define( 'MI_CORE_FILE', __FILE__ );
define( 'MI_CORE_DIR', plugin_dir_path( __FILE__ ) );
define( 'MI_CORE_URL', plugin_dir_url( __FILE__ ) );

require_once MI_CORE_DIR . 'includes/class-mi-core-settings.php';
require_once MI_CORE_DIR . 'database/class-mi-core-schema.php';
require_once MI_CORE_DIR . 'includes/class-mi-core-installer.php';

register_activation_hook( __FILE__, array( 'MI_Core_Installer', 'activate' ) );
register_deactivation_hook( __FILE__, array( 'MI_Core_Installer', 'deactivate' ) );

/*
 * Declare compatibility with WooCommerce High-Performance Order Storage. All
 * order access goes through wc_get_order()/wc_get_orders() and order CRUD, so
 * it works with both the posts and the custom order tables. The classic
 * (shortcode) cart and checkout are required: the MI TRENDS templates render
 * them, so the blocks are declared incompatible.
 */
add_action(
	'before_woocommerce_init',
	static function () {
		if ( class_exists( \Automattic\WooCommerce\Utilities\FeaturesUtil::class ) ) {
			\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', __FILE__, true );
			\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'cart_checkout_blocks', __FILE__, false );
		}
	}
);

add_action( 'plugins_loaded', 'mi_core_boot', 20 );
/**
 * Start the plugin once WooCommerce is available.
 */
function mi_core_boot() {
	load_plugin_textdomain( 'mi-trends-core', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );

	if ( ! class_exists( 'WooCommerce' ) ) {
		add_action(
			'admin_notices',
			static function () {
				echo '<div class="notice notice-error"><p>' . esc_html__( 'MI Trends Core needs WooCommerce. Install and activate WooCommerce, then reload this page.', 'mi-trends-core' ) . '</p></div>';
			}
		);
		return;
	}

	require_once MI_CORE_DIR . 'includes/class-mi-core-plugin.php';
	MI_Core_Plugin::instance();
}
