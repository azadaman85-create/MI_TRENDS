<?php
/**
 * Product lists the storefront shows — lib/catalog.ts and app/(store)/page.tsx.
 *
 * "Catalogue order" is menu_order (the importer stores the original array
 * order there), which is what products.slice()/filter() relied on.
 *
 * @package MI_Trends_Core
 */

defined( 'ABSPATH' ) || exit;

/**
 * Catalogue queries, cached in one transient that every product change clears.
 */
class MI_Core_Catalog {

	const CACHE_KEY = 'mi_core_catalog_cache';

	/**
	 * Clear cached lists.
	 */
	public static function flush_cache() {
		delete_transient( self::CACHE_KEY );
	}

	/**
	 * Read-through cache.
	 *
	 * @param string   $key      Key within the cache.
	 * @param callable $callback Producer.
	 * @return mixed
	 */
	private static function cached( $key, $callback ) {
		$cache = get_transient( self::CACHE_KEY );
		$cache = is_array( $cache ) ? $cache : array();
		if ( array_key_exists( $key, $cache ) ) {
			return $cache[ $key ];
		}
		$value = call_user_func( $callback );
		// Re-read: the producer may itself have cached other keys.
		$fresh         = get_transient( self::CACHE_KEY );
		$fresh         = is_array( $fresh ) ? $fresh : array();
		$fresh[ $key ] = $value;
		set_transient( self::CACHE_KEY, $fresh, HOUR_IN_SECONDS );
		return $value;
	}

	/**
	 * Published, visible product IDs in catalogue order.
	 *
	 * @param array $args Extra WP_Query args.
	 * @return int[]
	 */
	public static function query( $args = array() ) {
		$query = new WP_Query(
			array_merge(
				array(
					'post_type'           => 'product',
					'post_status'         => 'publish',
					'posts_per_page'      => -1,
					'fields'              => 'ids',
					'orderby'             => array( 'menu_order' => 'ASC', 'ID' => 'ASC' ),
					'no_found_rows'       => true,
					'ignore_sticky_posts' => true,
					'tax_query'           => array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query -- product visibility, as WooCommerce does.
						array(
							'taxonomy' => 'product_visibility',
							'field'    => 'name',
							'terms'    => array( 'exclude-from-catalog' ),
							'operator' => 'NOT IN',
						),
					),
				),
				$args
			)
		);
		return array_map( 'intval', $query->posts );
	}

	/**
	 * Merge extra tax clauses into the visibility clause.
	 *
	 * @param array $clauses Tax query clauses.
	 * @return array
	 */
	public static function with_tax( $clauses ) {
		return array(
			'tax_query' => array_merge( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query
				array(
					'relation' => 'AND',
					array(
						'taxonomy' => 'product_visibility',
						'field'    => 'name',
						'terms'    => array( 'exclude-from-catalog' ),
						'operator' => 'NOT IN',
					),
				),
				$clauses
			),
		);
	}

	/**
	 * Most popular first (popularity score, then catalogue order).
	 *
	 * @param int $limit Count.
	 * @return int[]
	 */
	public static function popular_ids( $limit = 9 ) {
		$all = self::cached(
			'popular',
			static function () {
				return MI_Core_Catalog::query(
					array(
						'meta_key' => '_mi_popularity', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
						'orderby'  => array( 'meta_value_num' => 'DESC', 'menu_order' => 'ASC' ),
					)
				);
			}
		);
		return array_slice( $all, 0, $limit );
	}

	/**
	 * Lists for the homepage.
	 *
	 * @return array{trending:int[],new:int[],deals:int[],shirts:int[]}
	 */
	public static function home_products() {
		return self::cached(
			'home',
			static function () {
				$trending = MI_Core_Catalog::popular_ids( 9 );

				$new = array_slice( MI_Core_Catalog::query( MI_Core_Catalog::tax( 'product_tag', 'new' ) ), 0, 8 );

				// Under ₹799 — or, with fewer than six such pieces, the cheapest nine.
				$all   = MI_Core_Catalog::query();
				$under = array();
				$price = array();
				foreach ( $all as $id ) {
					$product      = wc_get_product( $id );
					$price[ $id ] = $product ? (float) $product->get_price() : 0;
					if ( $product && $price[ $id ] <= 799 ) {
						$under[] = $id;
					}
				}
				if ( count( $under ) >= 6 ) {
					$deals = array_slice( $under, 0, 9 );
				} else {
					$sorted = $all;
					usort(
						$sorted,
						static function ( $a, $b ) use ( $price ) {
							return $price[ $a ] <=> $price[ $b ];
						}
					);
					$deals = array_slice( $sorted, 0, 9 );
				}

				$shirts = array_slice( MI_Core_Catalog::query( MI_Core_Catalog::tax( 'mi_type', 'shirt' ) ), 0, 8 );

				return array(
					'trending' => $trending,
					'new'      => $new,
					'deals'    => $deals,
					'shirts'   => $shirts,
				);
			}
		);
	}

	/**
	 * Tax clause helper.
	 *
	 * @param string $taxonomy Taxonomy.
	 * @param string $slug     Term slug.
	 * @return array
	 */
	public static function tax( $taxonomy, $slug ) {
		return self::with_tax(
			array(
				array(
					'taxonomy' => $taxonomy,
					'field'    => 'slug',
					'terms'    => array( $slug ),
				),
			)
		);
	}

	/**
	 * Same collection or same type first, then everything else — product/[slug]/page.tsx.
	 *
	 * @param int $product_id Product.
	 * @param int $limit      Count.
	 * @return int[]
	 */
	public static function related_ids( $product_id, $limit = 4 ) {
		$all        = self::cached( 'all', array( __CLASS__, 'query' ) );
		$collection = MI_Core_Product_Data::first_term( $product_id, 'mi_collection' );
		$type       = MI_Core_Product_Data::first_term( $product_id, 'mi_type' );
		$related    = array();
		$rest       = array();
		foreach ( $all as $id ) {
			if ( (int) $id === (int) $product_id ) {
				continue;
			}
			$c = MI_Core_Product_Data::first_term( $id, 'mi_collection' );
			$t = MI_Core_Product_Data::first_term( $id, 'mi_type' );
			if ( ( $collection && $c && $c->term_id === $collection->term_id ) || ( $type && $t && $t->term_id === $type->term_id ) ) {
				$related[] = $id;
			} else {
				$rest[] = $id;
			}
		}
		return array_slice( array_merge( $related, $rest ), 0, $limit );
	}

	/**
	 * Catalogue order, minus what's already in the bag — cart/page.tsx.
	 *
	 * @param int[] $exclude Product IDs.
	 * @param int   $limit   Count.
	 * @return int[]
	 */
	public static function suggestion_ids( $exclude, $limit = 4 ) {
		$all     = self::cached( 'all', array( __CLASS__, 'query' ) );
		$exclude = array_map( 'intval', (array) $exclude );
		return array_slice( array_values( array_diff( $all, $exclude ) ), 0, $limit );
	}
}
