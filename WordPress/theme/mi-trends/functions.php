<?php
/**
 * MI TRENDS theme bootstrap.
 *
 * The theme is presentation only. Anything that has to keep working if the
 * theme is switched — cart colour selection, COD rules, wishlist storage,
 * order statuses, stock logging, reports — lives in the MI Trends Core plugin.
 * Where the theme needs that data it calls the plugin's public functions
 * (mi_trends_*) and falls back to plain WooCommerce data when the plugin is off.
 *
 * @package MI_Trends
 */

defined( 'ABSPATH' ) || exit;

define( 'MI_THEME_VERSION', '1.0.0' );
define( 'MI_THEME_DIR', get_template_directory() );
define( 'MI_THEME_URI', get_template_directory_uri() );

require MI_THEME_DIR . '/inc/setup.php';
require MI_THEME_DIR . '/inc/icons.php';
require MI_THEME_DIR . '/inc/helpers.php';
require MI_THEME_DIR . '/inc/product-visual.php';
require MI_THEME_DIR . '/inc/navigation.php';
require MI_THEME_DIR . '/inc/customizer.php';
require MI_THEME_DIR . '/inc/assets.php';

if ( class_exists( 'WooCommerce' ) ) {
	require MI_THEME_DIR . '/inc/woocommerce.php';
}
