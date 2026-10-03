<?php
/**
 * Uninstall MI Trends Core.
 *
 * By default nothing is deleted: products, orders, customers and coupons are
 * WooCommerce's and stay; the plugin's own data (settings, subscribers, stock
 * log, messages) stays too, so reinstalling picks up where it left off.
 *
 * To remove the plugin's own data as well, add this to wp-config.php before
 * deleting the plugin:
 *     define( 'MI_CORE_REMOVE_DATA', true );
 *
 * @package MI_Trends_Core
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

if ( ! defined( 'MI_CORE_REMOVE_DATA' ) || ! MI_CORE_REMOVE_DATA ) {
	return;
}

require_once __DIR__ . '/database/class-mi-core-schema.php';

if ( ! defined( 'MI_CORE_DB_VERSION' ) ) {
	define( 'MI_CORE_DB_VERSION', '1.0.0' );
}

MI_Core_Schema::drop();

foreach ( array( 'mi_core_settings', 'mi_core_version', 'mi_core_setup_done' ) as $option ) {
	delete_option( $option );
}
delete_transient( 'mi_core_catalog_cache' );

$mi_messages = get_posts(
	array(
		'post_type'      => 'mi_message',
		'post_status'    => 'any',
		'posts_per_page' => -1,
		'fields'         => 'ids',
	)
);
foreach ( $mi_messages as $mi_message_id ) {
	wp_delete_post( $mi_message_id, true );
}

delete_metadata( 'user', 0, '_mi_wishlist', '', true );
