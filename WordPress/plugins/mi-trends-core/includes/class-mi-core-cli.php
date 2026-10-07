<?php
/**
 * WP-CLI commands.
 *
 *   wp mi-trends setup                 Store settings, taxonomies, pages, shipping zone.
 *   wp mi-trends import [--no-images]  Catalogue + coupons from database/seed.
 *   wp mi-trends backfill              Recompute discount/rating/search meta for all products.
 *   wp mi-trends stock                 Per-size stock table.
 *
 * @package MI_Trends_Core
 */

defined( 'ABSPATH' ) || exit;

/**
 * Manage the MI TRENDS store.
 */
class MI_Core_CLI {

	/**
	 * Apply the MI TRENDS store setup (safe to re-run).
	 *
	 * @when after_wp_load
	 */
	public function setup() {
		foreach ( MI_Core_Seeder::setup() as $line ) {
			WP_CLI::log( $line );
		}
		WP_CLI::success( 'Store setup complete.' );
	}

	/**
	 * Import the MI TRENDS catalogue and coupons (matches by SKU/code; safe to re-run).
	 *
	 * ## OPTIONS
	 *
	 * [--no-images]
	 * : Skip loading product photos into the Media Library.
	 *
	 * @param array $args       Positional.
	 * @param array $assoc_args Flags.
	 */
	public function import( $args, $assoc_args ) {
		$with_images = ! WP_CLI\Utils\get_flag_value( $assoc_args, 'no-images', false );
		foreach ( MI_Core_Seeder::import( $with_images ) as $line ) {
			WP_CLI::log( $line );
		}
		WP_CLI::success( 'Catalogue imported.' );
	}

	/**
	 * Recompute derived product meta.
	 */
	public function backfill() {
		$count = MI_Core_Product_Data::backfill();
		WP_CLI::success( sprintf( 'Refreshed %d products.', $count ) );
	}

	/**
	 * Show stock per size.
	 */
	public function stock() {
		$rows = array();
		foreach ( MI_Core_Inventory::rows() as $row ) {
			$line = array(
				'SKU'     => $row['view']['sku'],
				'Product' => $row['view']['name'],
			);
			foreach ( $row['cells'] as $size => $cell ) {
				$line[ $size ] = null === $cell['units'] ? '—' : $cell['units'];
			}
			$line['Total'] = $row['total'];
			$line['State'] = $row['state'];
			$rows[]        = $line;
		}
		if ( ! $rows ) {
			WP_CLI::log( 'No variable products yet.' );
			return;
		}
		WP_CLI\Utils\format_items( 'table', $rows, array_keys( $rows[0] ) );
	}
}
