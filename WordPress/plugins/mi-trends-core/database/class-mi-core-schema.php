<?php
/**
 * Custom tables.
 *
 * Only two, because WordPress and WooCommerce already store everything else
 * (products, variations, stock, orders, customers, coupons, reviews, settings):
 *
 *   {prefix}mi_subscribers      Newsletter and "notify me" sign-ups. WordPress has
 *                               no subscriber store; users would be wrong (no account).
 *   {prefix}mi_stock_movements  Every stock change with its reason. WooCommerce keeps
 *                               only the current stock level, not the history.
 *
 * Contact messages use a private post type (mi_message) instead of a table.
 * Full column documentation: WordPress/DATABASE-STRUCTURE.md and database/schema/.
 *
 * @package MI_Trends_Core
 */

defined( 'ABSPATH' ) || exit;

/**
 * Table names and dbDelta definitions.
 */
class MI_Core_Schema {

	/**
	 * Subscribers table name.
	 *
	 * @return string
	 */
	public static function subscribers() {
		global $wpdb;
		return $wpdb->prefix . 'mi_subscribers';
	}

	/**
	 * Stock movements table name.
	 *
	 * @return string
	 */
	public static function stock_movements() {
		global $wpdb;
		return $wpdb->prefix . 'mi_stock_movements';
	}

	/**
	 * Create or upgrade the tables. Safe to run repeatedly (dbDelta).
	 */
	public static function install() {
		global $wpdb;
		require_once ABSPATH . 'wp-admin/includes/upgrade.php';

		$charset = $wpdb->get_charset_collate();
		$subs    = self::subscribers();
		$moves   = self::stock_movements();

		// dbDelta is strict about formatting: one column per line, two spaces after PRIMARY KEY.
		$sql = "CREATE TABLE {$subs} (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  email varchar(190) NOT NULL,
  source varchar(60) NOT NULL DEFAULT 'footer',
  status varchar(20) NOT NULL DEFAULT 'subscribed',
  user_id bigint(20) unsigned DEFAULT NULL,
  ip_hash char(64) DEFAULT NULL,
  created_at datetime NOT NULL,
  updated_at datetime NOT NULL,
  PRIMARY KEY  (id),
  UNIQUE KEY email_source (email,source),
  KEY status (status),
  KEY created_at (created_at)
) {$charset};
CREATE TABLE {$moves} (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  product_id bigint(20) unsigned NOT NULL,
  variation_id bigint(20) unsigned NOT NULL DEFAULT 0,
  sku varchar(100) DEFAULT NULL,
  size varchar(40) DEFAULT NULL,
  delta int(11) NOT NULL,
  stock_before int(11) DEFAULT NULL,
  stock_after int(11) DEFAULT NULL,
  reason varchar(30) NOT NULL,
  order_id bigint(20) unsigned DEFAULT NULL,
  user_id bigint(20) unsigned DEFAULT NULL,
  note varchar(255) DEFAULT NULL,
  created_at datetime NOT NULL,
  PRIMARY KEY  (id),
  KEY product_created (product_id,created_at),
  KEY variation_id (variation_id),
  KEY order_id (order_id),
  KEY reason_created (reason,created_at)
) {$charset};";

		dbDelta( $sql );
		update_option( 'mi_core_db_version', MI_CORE_DB_VERSION, false );
	}

	/**
	 * Run install() when the stored schema version is behind the code.
	 */
	public static function maybe_upgrade() {
		if ( get_option( 'mi_core_db_version' ) !== MI_CORE_DB_VERSION ) {
			self::install();
		}
	}

	/**
	 * Drop the tables. Only called from uninstall.php when the site owner opted in.
	 */
	public static function drop() {
		global $wpdb;
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.SchemaChange,WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table names are built from $wpdb->prefix.
		$wpdb->query( 'DROP TABLE IF EXISTS ' . self::subscribers() . ', ' . self::stock_movements() );
		delete_option( 'mi_core_db_version' );
	}
}
