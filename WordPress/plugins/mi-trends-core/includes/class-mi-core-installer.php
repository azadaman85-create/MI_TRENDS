<?php
/**
 * Activation / deactivation.
 *
 * Activation only does what is safe to do automatically: create the two custom
 * tables, register the taxonomies and rewrite rules, and flush permalinks. It
 * does not change any WooCommerce setting or create content — that is the
 * "Store setup" and "Import catalogue" buttons on MI TRENDS → Settings (or
 * `wp mi-trends setup` / `wp mi-trends import`), so nothing happens to an
 * existing store without the owner asking for it.
 *
 * @package MI_Trends_Core
 */

defined( 'ABSPATH' ) || exit;

/**
 * Installer.
 */
class MI_Core_Installer {

	/**
	 * Plugin activated.
	 */
	public static function activate() {
		MI_Core_Schema::install();

		if ( false === get_option( MI_Core_Settings::OPTION, false ) ) {
			add_option( MI_Core_Settings::OPTION, MI_Core_Settings::defaults(), '', false );
		}

		// Taxonomies and the /account/login|signup rules must exist before flushing.
		require_once MI_CORE_DIR . 'includes/class-mi-core-taxonomies.php';
		require_once MI_CORE_DIR . 'includes/class-mi-core-accounts.php';
		MI_Core_Taxonomies::register();
		MI_Core_Accounts::add_rewrite_rules();
		flush_rewrite_rules();

		update_option( 'mi_core_version', MI_CORE_VERSION, false );
	}

	/**
	 * Plugin deactivated: drop our rewrite rules. Data stays (see uninstall.php).
	 */
	public static function deactivate() {
		flush_rewrite_rules();
	}
}
