<?php
/**
 * Shop filtering and sorting — app/(store)/shop/page.tsx, server-side.
 *
 * The URL format is the original's, so every existing link keeps working:
 *   ?category=men                 one value ("is")
 *   ?category=!men                negated ("is not")
 *   ?type=t-shirt,shirt           several values ("is any of")
 *   ?tag=new&tag=!sale            the same field twice
 *   ?gender=women                 alias for category
 *   ?maxPrice=799                 alias for price=under-799
 *   ?browse=collections           opens an empty Collection token
 *   ?q=oversized&sort=price-asc   search and sort
 *
 * Filters become a WooCommerce product tax/meta query on the main shop query,
 * so pagination, counts and caching all behave like normal WooCommerce.
 *
 * @package MI_Trends_Core
 */

defined( 'ABSPATH' ) || exit;

/**
 * Shop query.
 */
class MI_Core_Shop_Query {

	/**
	 * Parsed filters for this request.
	 *
	 * @var array|null
	 */
	private static $filters = null;

	/**
	 * Hooks.
	 */
	public static function init() {
		add_filter( 'request', array( __CLASS__, 'protect_shop_vars' ) );
		add_action( 'woocommerce_product_query', array( __CLASS__, 'apply' ), 50 );
		add_filter( 'posts_clauses', array( __CLASS__, 'clauses' ), 20, 2 );
		add_action( 'template_redirect', array( __CLASS__, 'redirects' ), 5 );
	}

	/**
	 * Sort options (sortLabels).
	 *
	 * @return array<string,string>
	 */
	public static function sort_options() {
		return array(
			'popular'    => __( 'Most popular', 'mi-trends-core' ),
			'newest'     => __( 'Newest first', 'mi-trends-core' ),
			'price-asc'  => __( 'Price: low to high', 'mi-trends-core' ),
			'price-desc' => __( 'Price: high to low', 'mi-trends-core' ),
			'discount'   => __( 'Best discount', 'mi-trends-core' ),
			'rating'     => __( 'Top rated', 'mi-trends-core' ),
		);
	}

	/**
	 * Price bands (priceBands).
	 *
	 * @return array<string,array{label:string,min:float,max:float|null}>
	 */
	public static function price_bands() {
		return array(
			'under-799' => array( 'label' => __( 'Under ₹799', 'mi-trends-core' ), 'min' => 0, 'max' => 799 ),
			'800-1199'  => array( 'label' => __( '₹800 – ₹1,199', 'mi-trends-core' ), 'min' => 800, 'max' => 1199 ),
			'1200-1799' => array( 'label' => __( '₹1,200 – ₹1,799', 'mi-trends-core' ), 'min' => 1200, 'max' => 1799 ),
			'1800-plus' => array( 'label' => __( '₹1,800 & above', 'mi-trends-core' ), 'min' => 1800, 'max' => null ),
		);
	}

	/**
	 * Type aliases used by older links (typeAliases).
	 *
	 * @return array<string,string[]>
	 */
	private static function type_aliases() {
		return array(
			'tees'       => array( 't-shirt' ),
			't-shirts'   => array( 't-shirt' ),
			'tshirts'    => array( 't-shirt' ),
			'shirts'     => array( 'shirt' ),
			'pyjamas'    => array( 'pyjama-set' ),
			'pajamas'    => array( 'pyjama-set' ),
			'sleepwear'  => array( 'pyjama-set' ),
			'nightwear'  => array( 'pyjama-set' ),
		);
	}

	/**
	 * Field definitions (the `fields` array), built from live terms.
	 *
	 * @return array<int,array>
	 */
	public static function fields() {
		static $fields = null;
		if ( null !== $fields ) {
			return $fields;
		}

		$category_options = array();
		foreach ( array( 'men' => __( 'Men', 'mi-trends-core' ), 'women' => __( 'Women', 'mi-trends-core' ), 'unisex' => __( 'Unisex', 'mi-trends-core' ) ) as $slug => $label ) {
			$term = get_term_by( 'slug', $slug, 'product_cat' );
			if ( $term && $term->count > 0 ) {
				$category_options[] = array( 'value' => $slug, 'label' => $label );
			}
		}

		$type_options = array();
		foreach ( (array) get_terms( array( 'taxonomy' => 'mi_type', 'hide_empty' => true ) ) as $term ) {
			if ( $term instanceof WP_Term ) {
				$type_options[] = array( 'value' => $term->slug, 'label' => $term->name );
			}
		}
		usort( $type_options, static function ( $a, $b ) { return strcmp( $a['label'], $b['label'] ); } );

		$size_options = array();
		if ( taxonomy_exists( 'pa_size' ) ) {
			foreach ( (array) get_terms( array( 'taxonomy' => 'pa_size', 'hide_empty' => true, 'orderby' => 'menu_order' ) ) as $term ) {
				if ( $term instanceof WP_Term ) {
					$size_options[] = array( 'value' => $term->slug, 'label' => $term->name );
				}
			}
		}

		$collection_options = array();
		foreach ( (array) get_terms( array( 'taxonomy' => 'mi_collection', 'hide_empty' => false ) ) as $term ) {
			if ( $term instanceof WP_Term ) {
				$data                 = MI_Core_Taxonomies::collection_data( $term );
				$collection_options[] = array( 'value' => $term->slug, 'label' => $term->name, 'palette' => $data['palette'] );
			}
		}

		$price_options = array();
		foreach ( self::price_bands() as $value => $band ) {
			$price_options[] = array( 'value' => $value, 'label' => $band['label'] );
		}

		$discount_options = array();
		foreach ( array( 10, 20, 30, 40 ) as $value ) {
			/* translators: %d: percent */
			$discount_options[] = array( 'value' => (string) $value, 'label' => sprintf( __( '%d%% off', 'mi-trends-core' ), $value ) );
		}

		$fields = array(
			array(
				'id'        => 'category',
				'label'     => __( 'Category', 'mi-trends-core' ),
				'icon'      => 'shapes',
				'operators' => array(
					array( 'value' => 'is', 'label' => __( 'is', 'mi-trends-core' ) ),
					array( 'value' => 'is_not', 'label' => __( 'is not', 'mi-trends-core' ), 'negate' => true ),
					array( 'value' => 'is_any', 'label' => __( 'is any of', 'mi-trends-core' ), 'multi' => true ),
				),
				'options'   => $category_options,
			),
			array(
				'id'        => 'type',
				'label'     => __( 'Product type', 'mi-trends-core' ),
				'icon'      => 'shirt',
				'operators' => array(
					array( 'value' => 'is_any', 'label' => __( 'is any of', 'mi-trends-core' ), 'multi' => true ),
					array( 'value' => 'is_none', 'label' => __( 'is none of', 'mi-trends-core' ), 'multi' => true, 'negate' => true ),
				),
				'options'   => $type_options,
			),
			array(
				'id'        => 'size',
				'label'     => __( 'Size', 'mi-trends-core' ),
				'icon'      => 'ruler',
				'operators' => array( array( 'value' => 'is_any', 'label' => __( 'is any of', 'mi-trends-core' ), 'multi' => true ) ),
				'options'   => $size_options,
			),
			array(
				'id'        => 'collection',
				'label'     => __( 'Collection', 'mi-trends-core' ),
				'icon'      => 'layers',
				'operators' => array(
					array( 'value' => 'is_any', 'label' => __( 'is any of', 'mi-trends-core' ), 'multi' => true ),
					array( 'value' => 'is_none', 'label' => __( 'is none of', 'mi-trends-core' ), 'multi' => true, 'negate' => true ),
				),
				'options'   => $collection_options,
			),
			array(
				'id'        => 'tag',
				'label'     => __( 'Tag', 'mi-trends-core' ),
				'icon'      => 'tag',
				'operators' => array(
					array( 'value' => 'is_any', 'label' => __( 'is any of', 'mi-trends-core' ), 'multi' => true ),
					array( 'value' => 'is_none', 'label' => __( 'is none of', 'mi-trends-core' ), 'multi' => true, 'negate' => true ),
				),
				'options'   => array(
					array( 'value' => 'new', 'label' => __( 'New arrival', 'mi-trends-core' ) ),
					array( 'value' => 'bestseller', 'label' => __( 'Bestseller', 'mi-trends-core' ) ),
					array( 'value' => 'sale', 'label' => __( 'On sale', 'mi-trends-core' ) ),
				),
			),
			array(
				'id'        => 'price',
				'label'     => __( 'Price', 'mi-trends-core' ),
				'icon'      => 'indian-rupee',
				'operators' => array( array( 'value' => 'is', 'label' => __( 'is', 'mi-trends-core' ) ) ),
				'options'   => $price_options,
			),
			array(
				'id'        => 'discount',
				'label'     => __( 'Discount', 'mi-trends-core' ),
				'icon'      => 'percent',
				'operators' => array( array( 'value' => 'at_least', 'label' => __( 'is at least', 'mi-trends-core' ) ) ),
				'options'   => $discount_options,
			),
		);

		$fields = apply_filters( 'mi_core_shop_fields', $fields );
		return $fields;
	}

	/**
	 * Field by ID.
	 *
	 * @param string $id Field.
	 * @return array|null
	 */
	private static function field( $id ) {
		foreach ( self::fields() as $field ) {
			if ( $field['id'] === $id ) {
				return $field;
			}
		}
		return null;
	}

	/**
	 * Raw query pairs, in order, keeping repeated keys (PHP's $_GET drops them).
	 *
	 * @return array<int,array{0:string,1:string}>
	 */
	public static function raw_pairs() {
		$query = isset( $_SERVER['QUERY_STRING'] ) ? (string) wp_unslash( $_SERVER['QUERY_STRING'] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- each value is sanitised below.
		$pairs = array();
		foreach ( explode( '&', $query ) as $chunk ) {
			if ( '' === $chunk ) {
				continue;
			}
			$parts = explode( '=', $chunk, 2 );
			$key   = sanitize_key( urldecode( str_replace( '+', ' ', $parts[0] ) ) );
			$value = isset( $parts[1] ) ? sanitize_text_field( urldecode( str_replace( '+', ' ', $parts[1] ) ) ) : '';
			if ( '' !== $key ) {
				$pairs[] = array( $key, $value );
			}
		}
		return $pairs;
	}

	/**
	 * Values of a key in the raw pairs.
	 *
	 * @param array  $pairs Pairs.
	 * @param string $key   Key (lower-case).
	 * @return string[]
	 */
	private static function all_of( $pairs, $key ) {
		$out = array();
		foreach ( $pairs as $pair ) {
			if ( $pair[0] === $key ) {
				$out[] = $pair[1];
			}
		}
		return $out;
	}

	/**
	 * First value of a key.
	 *
	 * @param array  $pairs Pairs.
	 * @param string $key   Key.
	 * @return string
	 */
	private static function one_of( $pairs, $key ) {
		$all = self::all_of( $pairs, $key );
		return $all ? $all[0] : '';
	}

	/**
	 * Slugify like the original (lowercase, non-alphanumerics → "-").
	 *
	 * @param string $value Value.
	 * @return string
	 */
	private static function slugify( $value ) {
		return trim( preg_replace( '/[^a-z0-9]+/', '-', strtolower( trim( (string) $value ) ) ), '-' );
	}

	/**
	 * Expand aliases (expandValues).
	 *
	 * @param string   $field Field.
	 * @param string[] $raw   Values.
	 * @return string[]
	 */
	private static function expand( $field, $raw ) {
		if ( 'type' === $field ) {
			$aliases = self::type_aliases();
			$out     = array();
			foreach ( $raw as $value ) {
				$out = array_merge( $out, isset( $aliases[ $value ] ) ? $aliases[ $value ] : array( $value ) );
			}
			return $out;
		}
		if ( 'collection' === $field ) {
			$definition = self::field( 'collection' );
			return array_map(
				static function ( $value ) use ( $definition ) {
					foreach ( $definition['options'] as $option ) {
						if ( $option['value'] === $value || self::slugify( $option['label'] ) === self::slugify( $value ) ) {
							return $option['value'];
						}
					}
					return $value;
				},
				$raw
			);
		}
		return $raw;
	}

	/**
	 * Keep only known option values (normalizeValues).
	 *
	 * @param string   $field Field.
	 * @param string[] $raw   Values.
	 * @return string[]
	 */
	private static function normalize( $field, $raw ) {
		$definition = self::field( $field );
		$allowed    = $definition ? wp_list_pluck( $definition['options'], 'value' ) : array();
		$out        = array();
		foreach ( $raw as $value ) {
			$value = strtolower( trim( $value ) );
			if ( '' !== $value && in_array( $value, $allowed, true ) && ! in_array( $value, $out, true ) ) {
				$out[] = $value;
			}
		}
		return $out;
	}

	/**
	 * Pick the operator for parsed values (operatorFor).
	 *
	 * @param array $field  Field.
	 * @param array $values Values.
	 * @param bool  $negate Negated.
	 * @return array Operator definition.
	 */
	private static function operator_for( $field, $values, $negate ) {
		$default = $field['operators'][0];
		if ( $negate ) {
			foreach ( $field['operators'] as $op ) {
				if ( ! empty( $op['negate'] ) ) {
					return $op;
				}
			}
			return $default;
		}
		if ( count( $values ) > 1 ) {
			foreach ( $field['operators'] as $op ) {
				if ( ! empty( $op['multi'] ) && empty( $op['negate'] ) ) {
					return $op;
				}
			}
		}
		return $default;
	}

	/**
	 * Parse filters from the URL (parseFilters).
	 *
	 * @return array<int,array{field:string,operator:string,values:string[],negate:bool}>
	 */
	public static function filters() {
		if ( null !== self::$filters ) {
			return self::$filters;
		}
		$pairs  = self::raw_pairs();
		$parsed = array();

		foreach ( self::fields() as $field ) {
			$entries = self::all_of( $pairs, $field['id'] );
			if ( 'category' === $field['id'] && ! $entries ) {
				$entries = self::all_of( $pairs, 'gender' );
			}
			if ( 'price' === $field['id'] && ! $entries && '799' === self::one_of( $pairs, 'maxprice' ) ) {
				$entries = array( 'under-799' );
			}
			if ( 'collection' === $field['id'] && ! $entries && 'collections' === self::one_of( $pairs, 'browse' ) ) {
				$entries = array( '' );
			}

			foreach ( $entries as $raw ) {
				$negate = 0 === strpos( $raw, '!' );
				$body   = $negate ? substr( $raw, 1 ) : $raw;
				$values = self::normalize( $field['id'], self::expand( $field['id'], explode( ',', $body ) ) );
				$op     = self::operator_for( $field, $values, $negate );
				if ( empty( $op['multi'] ) ) {
					$values = array_slice( $values, 0, 1 );
				}
				$parsed[] = array(
					'field'    => $field['id'],
					'operator' => $op['value'],
					'values'   => $values,
					'negate'   => ! empty( $op['negate'] ),
				);
			}
		}

		self::$filters = $parsed;
		return $parsed;
	}

	/**
	 * Current sort key.
	 *
	 * @return string
	 */
	public static function sort() {
		$sort = sanitize_key( self::one_of( self::raw_pairs(), 'sort' ) );
		return array_key_exists( $sort, self::sort_options() ) ? $sort : 'popular';
	}

	/**
	 * Current search text.
	 *
	 * @return string
	 */
	public static function search() {
		return trim( self::one_of( self::raw_pairs(), 'q' ) );
	}

	/**
	 * Remove `tag` from the main query vars on the shop page. WordPress treats
	 * ?tag= as a blog-tag filter, which would empty the product archive; the
	 * shop reads it itself (as a product tag).
	 *
	 * @param array $vars Query vars.
	 * @return array
	 */
	public static function protect_shop_vars( $vars ) {
		if ( is_admin() || ! isset( $vars['tag'] ) ) {
			return $vars;
		}
		$shop_id = wc_get_page_id( 'shop' );
		$is_shop = ( isset( $vars['post_type'] ) && 'product' === $vars['post_type'] )
			|| ( $shop_id > 0 && isset( $vars['page_id'] ) && (int) $vars['page_id'] === $shop_id )
			|| ( $shop_id > 0 && isset( $vars['pagename'] ) && get_page_uri( $shop_id ) === $vars['pagename'] );
		if ( $is_shop ) {
			unset( $vars['tag'] );
		}
		return $vars;
	}

	/**
	 * Apply filters, search and sort to the main product query.
	 *
	 * @param WP_Query $q Query.
	 */
	public static function apply( $q ) {
		if ( ! $q->is_main_query() || is_admin() ) {
			return;
		}

		$tax_query  = (array) $q->get( 'tax_query' );
		$meta_query = (array) $q->get( 'meta_query' );

		foreach ( self::filters() as $filter ) {
			if ( ! $filter['values'] ) {
				continue;
			}
			$values = $filter['values'];
			$op     = $filter['negate'] ? 'NOT IN' : 'IN';

			switch ( $filter['field'] ) {
				case 'category':
					// Unisex pieces belong to both the men's and women's edits.
					if ( ! $filter['negate'] && array_diff( $values, array( 'unisex' ) ) ) {
						$values[] = 'unisex';
					}
					$tax_query[] = array( 'taxonomy' => 'product_cat', 'field' => 'slug', 'terms' => array_unique( $values ), 'operator' => $op );
					break;
				case 'type':
					$tax_query[] = array( 'taxonomy' => 'mi_type', 'field' => 'slug', 'terms' => $values, 'operator' => $op );
					break;
				case 'size':
					$tax_query[] = array( 'taxonomy' => 'pa_size', 'field' => 'slug', 'terms' => $values, 'operator' => 'IN' );
					break;
				case 'collection':
					$tax_query[] = array( 'taxonomy' => 'mi_collection', 'field' => 'slug', 'terms' => $values, 'operator' => $op );
					break;
				case 'tag':
					$tax_query[] = array( 'taxonomy' => 'product_tag', 'field' => 'slug', 'terms' => $values, 'operator' => $op );
					break;
				case 'price':
					$bands = self::price_bands();
					if ( isset( $bands[ $values[0] ] ) ) {
						$band         = $bands[ $values[0] ];
						$meta_query[] = null === $band['max']
							? array( 'key' => '_price', 'value' => $band['min'], 'compare' => '>=', 'type' => 'NUMERIC' )
							: array( 'key' => '_price', 'value' => array( $band['min'], $band['max'] ), 'compare' => 'BETWEEN', 'type' => 'NUMERIC' );
					}
					break;
				case 'discount':
					$meta_query[] = array( 'key' => '_mi_discount', 'value' => (int) $values[0], 'compare' => '>=', 'type' => 'NUMERIC' );
					break;
			}
		}

		$q->set( 'tax_query', $tax_query );
		$q->set( 'meta_query', $meta_query );

		$search = self::search();
		if ( '' !== $search ) {
			$q->set( 'mi_search', $search );
		}

		switch ( self::sort() ) {
			case 'newest':
				$q->set( 'mi_sort_newest', true );
				$q->set( 'orderby', 'ID' );
				$q->set( 'order', 'DESC' );
				break;
			case 'price-asc':
			case 'price-desc':
				$args = WC()->query->get_catalog_ordering_args( 'price', 'price-asc' === self::sort() ? 'ASC' : 'DESC' );
				$q->set( 'orderby', $args['orderby'] );
				$q->set( 'order', $args['order'] );
				if ( ! empty( $args['meta_key'] ) ) {
					$q->set( 'meta_key', $args['meta_key'] );
				}
				break;
			case 'discount':
				$q->set( 'meta_key', '_mi_discount' );
				$q->set( 'orderby', array( 'meta_value_num' => 'DESC', 'menu_order' => 'ASC' ) );
				break;
			case 'rating':
				$q->set( 'meta_key', '_mi_effective_rating' );
				$q->set( 'orderby', array( 'meta_value_num' => 'DESC', 'menu_order' => 'ASC' ) );
				break;
			case 'popular':
			default:
				$q->set( 'meta_key', '_mi_popularity' );
				$q->set( 'orderby', array( 'meta_value_num' => 'DESC', 'menu_order' => 'ASC' ) );
				break;
		}
	}

	/**
	 * SQL for search (name or search index contains the text) and "newest" (new tag first).
	 *
	 * @param array    $clauses Clauses.
	 * @param WP_Query $query   Query.
	 * @return array
	 */
	public static function clauses( $clauses, $query ) {
		global $wpdb;

		$search = (string) $query->get( 'mi_search' );
		if ( '' !== $search ) {
			$like              = '%' . $wpdb->esc_like( function_exists( 'mb_strtolower' ) ? mb_strtolower( $search ) : strtolower( $search ) ) . '%';
			$clauses['where'] .= $wpdb->prepare(
				" AND ( {$wpdb->posts}.post_title LIKE %s OR EXISTS ( SELECT 1 FROM {$wpdb->postmeta} mi_s WHERE mi_s.post_id = {$wpdb->posts}.ID AND mi_s.meta_key = '_mi_search_index' AND mi_s.meta_value LIKE %s ) )",
				$like,
				$like
			);
		}

		if ( $query->get( 'mi_sort_newest' ) ) {
			$new = get_term_by( 'slug', 'new', 'product_tag' );
			if ( $new ) {
				$clauses['orderby'] = $wpdb->prepare(
					"EXISTS ( SELECT 1 FROM {$wpdb->term_relationships} mi_n WHERE mi_n.object_id = {$wpdb->posts}.ID AND mi_n.term_taxonomy_id = %d ) DESC, {$wpdb->posts}.ID DESC",
					$new->term_taxonomy_id
				);
			}
		}

		return $clauses;
	}

	/**
	 * Keep one shop: WordPress searches and product taxonomy archives go to the
	 * shop with the equivalent filter, as the original only had /shop.
	 */
	public static function redirects() {
		if ( is_admin() || wp_doing_ajax() ) {
			return;
		}
		$shop = wc_get_page_permalink( 'shop' );

		if ( is_search() && '' !== get_search_query() && ! is_shop() ) {
			wp_safe_redirect( add_query_arg( 'q', rawurlencode( get_search_query() ), $shop ) );
			exit;
		}

		$map = array(
			'product_cat'   => 'category',
			'product_tag'   => 'tag',
			'mi_collection' => 'collection',
			'mi_type'       => 'type',
		);
		foreach ( $map as $taxonomy => $param ) {
			if ( is_tax( $taxonomy ) ) {
				$term = get_queried_object();
				if ( $term instanceof WP_Term ) {
					wp_safe_redirect( add_query_arg( $param, rawurlencode( $term->slug ), $shop ), 301 );
					exit;
				}
			}
		}
	}

	/**
	 * Serialise filters back to query pairs (serializeFilters), keeping q, sort, browse.
	 *
	 * @param array $filters Filters.
	 * @return string URL.
	 */
	private static function url_for( $filters ) {
		$pairs = array();
		foreach ( array( 'q', 'sort', 'browse' ) as $keep ) {
			$value = self::one_of( self::raw_pairs(), $keep );
			if ( '' !== $value ) {
				$pairs[] = rawurlencode( $keep ) . '=' . rawurlencode( $value );
			}
		}
		foreach ( $filters as $filter ) {
			$value   = $filter['values'] ? ( $filter['negate'] ? '!' : '' ) . implode( ',', $filter['values'] ) : '';
			$pairs[] = rawurlencode( $filter['field'] ) . '=' . str_replace( '%2C', ',', rawurlencode( $value ) );
		}
		$base = wc_get_page_permalink( 'shop' );
		return $pairs ? $base . ( false === strpos( $base, '?' ) ? '?' : '&' ) . implode( '&', $pairs ) : $base;
	}

	/**
	 * Everything the shop template needs.
	 *
	 * @return array
	 */
	public static function state() {
		$filters = self::filters();
		$pairs   = self::raw_pairs();
		$search  = self::search();
		$browse  = 'collections' === self::one_of( $pairs, 'browse' );

		foreach ( $filters as $i => &$filter ) {
			$without              = $filters;
			unset( $without[ $i ] );
			$filter['remove_url'] = self::url_for( array_values( $without ) );
		}
		unset( $filter );

		$active_tag      = null;
		$active_category = null;
		foreach ( $filters as $filter ) {
			if ( null === $active_tag && 'tag' === $filter['field'] ) {
				$active_tag = $filter;
			}
			if ( null === $active_category && 'category' === $filter['field'] ) {
				$active_category = $filter;
			}
		}

		if ( '' !== $search ) {
			/* translators: %s: search text */
			$title = sprintf( __( 'Results for “%s”', 'mi-trends-core' ), $search );
		} elseif ( $browse ) {
			$title = __( 'Browse collections', 'mi-trends-core' );
		} elseif ( $active_tag && in_array( 'sale', $active_tag['values'], true ) ) {
			$title = __( 'The sale edit', 'mi-trends-core' );
		} elseif ( $active_tag && in_array( 'new', $active_tag['values'], true ) ) {
			$title = __( 'New arrivals', 'mi-trends-core' );
		} elseif ( $active_category && 1 === count( $active_category['values'] ) ) {
			/* translators: %s: category, e.g. Men */
			$title = sprintf( __( '%s\'s edit', 'mi-trends-core' ), ucfirst( $active_category['values'][0] ) );
		} else {
			$title = __( 'Shop all', 'mi-trends-core' );
		}

		return array(
			'query'              => $search,
			'browse_collections' => $browse,
			'filters'            => $filters,
			'fields'             => self::fields(),
			'sort'               => self::sort(),
			'sort_options'       => self::sort_options(),
			'title'              => $title,
			'params'             => $pairs,
			'clear_url'          => self::url_for( array() ),
		);
	}
}
