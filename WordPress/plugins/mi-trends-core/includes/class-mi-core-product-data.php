<?php
/**
 * Product data — the Product type from lib/types.ts on top of WooCommerce.
 *
 * Field mapping:
 *   name, slug, sku, description           → WooCommerce product fields
 *   mrp / price                            → regular price / sale price (on each size variation)
 *   sizes, outOfStock, per-size stock      → variations on the global attribute pa_size, each with stock
 *   imageUrl, backImageUrl                 → featured image, first gallery image
 *   category, tags                         → product_cat, product_tag
 *   collection, type                       → mi_collection, mi_type taxonomies
 *   colors [{name,hex}]                    → meta _mi_colors (JSON); chosen colour rides on the cart line
 *   fit, fabric, art                       → meta _mi_fit, _mi_fabric, _mi_art
 *   palette [ink,accent,paper]             → meta _mi_palette (JSON)
 *   popularity                             → meta _mi_popularity
 *   rating, reviewCount                    → WooCommerce reviews; until a product has real reviews the
 *                                            imported figures in _mi_seed_rating / _mi_seed_review_count show
 *   costPrice (admin)                      → meta _mi_cost_price
 *
 * Derived meta kept up to date on every save, so the shop can sort and filter
 * in SQL: _mi_discount (whole % off), _mi_effective_rating, _mi_search_index.
 *
 * @package MI_Trends_Core
 */

defined( 'ABSPATH' ) || exit;

/**
 * Product data.
 */
class MI_Core_Product_Data {

	/**
	 * Per-request cache of built views.
	 *
	 * @var array<int,array>
	 */
	private static $views = array();

	/**
	 * Hooks.
	 */
	public static function init() {
		add_action( 'woocommerce_after_product_object_save', array( __CLASS__, 'after_save' ) );
		add_action( 'woocommerce_after_product_variation_object_save', array( __CLASS__, 'after_save' ) );
		add_action( 'woocommerce_variation_set_stock', array( __CLASS__, 'after_stock_change' ) );
		add_action( 'woocommerce_product_set_stock', array( __CLASS__, 'after_stock_change' ) );
		add_action( 'wp_update_comment_count', array( __CLASS__, 'after_review_count' ) );
		add_action( 'set_object_terms', array( __CLASS__, 'after_terms' ), 10, 4 );
	}

	/**
	 * Colours of a product.
	 *
	 * @param int $product_id Parent product ID.
	 * @return array<int,array{name:string,hex:string}>
	 */
	public static function colors( $product_id ) {
		$colors = json_decode( (string) get_post_meta( $product_id, '_mi_colors', true ), true );
		$out    = array();
		if ( is_array( $colors ) ) {
			foreach ( $colors as $color ) {
				if ( empty( $color['name'] ) ) {
					continue;
				}
				$hex   = sanitize_hex_color( isset( $color['hex'] ) ? $color['hex'] : '' );
				$out[] = array(
					'name' => sanitize_text_field( $color['name'] ),
					'hex'  => $hex ? $hex : '#171717',
				);
			}
		}
		return $out;
	}

	/**
	 * Store colours from "Name | #hex" lines (the product editor field).
	 *
	 * @param int    $product_id Product.
	 * @param string $text       One colour per line.
	 */
	public static function save_colors_from_text( $product_id, $text ) {
		$colors = array();
		foreach ( preg_split( '/\r\n|\r|\n/', (string) $text ) as $line ) {
			$parts = array_map( 'trim', explode( '|', $line ) );
			if ( '' === $parts[0] ) {
				continue;
			}
			$hex      = isset( $parts[1] ) ? sanitize_hex_color( $parts[1] ) : '';
			$colors[] = array(
				'name' => sanitize_text_field( $parts[0] ),
				'hex'  => $hex ? $hex : '#171717',
			);
		}
		update_post_meta( $product_id, '_mi_colors', wp_json_encode( $colors ) );
	}

	/**
	 * Build the normalised view of a product (shape documented in the theme's
	 * inc/helpers.php → mi_trends_product_view()).
	 *
	 * @param WC_Product|int $product Product or ID.
	 * @return array|null
	 */
	public static function view( $product ) {
		$product = is_numeric( $product ) ? wc_get_product( (int) $product ) : $product;
		if ( ! $product instanceof WC_Product ) {
			return null;
		}
		if ( $product->is_type( 'variation' ) ) {
			$product = wc_get_product( $product->get_parent_id() );
			if ( ! $product ) {
				return null;
			}
		}

		$id = $product->get_id();
		if ( isset( self::$views[ $id ] ) ) {
			return self::$views[ $id ];
		}

		// Sizes in the attribute's own order (XS → XXL), with their variation and stock.
		$sizes        = array();
		$slug_to_name = array();
		$terms        = wc_get_product_terms( $id, 'pa_size', array( 'fields' => 'all' ) );
		foreach ( $terms as $term ) {
			$sizes[]                     = $term->name;
			$slug_to_name[ $term->slug ] = $term->name;
		}

		$variations   = array();
		$stock        = array();
		$out_of_stock = array();
		$regular      = 0.0;
		$price        = 0.0;

		if ( $product->is_type( 'variable' ) ) {
			foreach ( $product->get_children() as $child_id ) {
				$variation = wc_get_product( $child_id );
				if ( ! $variation || 'publish' !== $variation->get_status() ) {
					continue;
				}
				$slug = $variation->get_attribute( 'pa_size' ) ? sanitize_title( $variation->get_attribute( 'pa_size' ) ) : '';
				$attr = $variation->get_variation_attributes();
				if ( ! empty( $attr['attribute_pa_size'] ) ) {
					$slug = $attr['attribute_pa_size'];
				}
				if ( ! isset( $slug_to_name[ $slug ] ) ) {
					continue;
				}
				$name                = $slug_to_name[ $slug ];
				$variations[ $name ] = $variation->get_id();
				$stock[ $name ]      = $variation->managing_stock() ? (int) $variation->get_stock_quantity() : null;
				if ( ! $variation->is_in_stock() || ! $variation->is_purchasable() ) {
					$out_of_stock[] = $name;
				}
			}
			$regular = (float) $product->get_variation_regular_price( 'min' );
			$price   = (float) $product->get_variation_price( 'min' );
		} else {
			$regular = (float) $product->get_regular_price();
			$price   = (float) $product->get_price();
		}

		foreach ( $sizes as $size ) {
			if ( ! isset( $variations[ $size ] ) && ! in_array( $size, $out_of_stock, true ) ) {
				$out_of_stock[] = $size;
			}
		}

		$mrp      = $regular > 0 ? max( $regular, $price ) : $price;
		$discount = self::discount_percent( $mrp, $price );

		$collection = self::first_term( $id, 'mi_collection' );
		$type       = self::first_term( $id, 'mi_type' );
		$cats       = wp_get_post_terms( $id, 'product_cat', array( 'fields' => 'slugs' ) );
		$category   = 'unisex';
		foreach ( array( 'men', 'women', 'unisex' ) as $candidate ) {
			if ( is_array( $cats ) && in_array( $candidate, $cats, true ) ) {
				$category = $candidate;
				break;
			}
		}
		$tag_slugs = wp_get_post_terms( $id, 'product_tag', array( 'fields' => 'slugs' ) );
		$tags      = is_array( $tag_slugs ) ? array_values( array_intersect( array( 'new', 'bestseller', 'sale' ), $tag_slugs ) ) : array();

		$colors = self::colors( $id );
		if ( ! $colors ) {
			$colors = array( array( 'name' => __( 'As shown', 'mi-trends-core' ), 'hex' => '#171717' ) );
		}

		$palette = json_decode( (string) get_post_meta( $id, '_mi_palette', true ), true );
		if ( ! is_array( $palette ) || 3 !== count( $palette ) ) {
			$palette = $collection ? MI_Core_Taxonomies::collection_data( $collection )['palette'] : array( '#131313', '#ef3f2f', '#f3f0ea' );
		}

		list( $rating, $review_count ) = self::rating( $product );

		$image_id = $product->get_image_id();
		$gallery  = $product->get_gallery_image_ids();

		$view = array(
			'id'              => $id,
			'slug'            => $product->get_slug(),
			'name'            => $product->get_name(),
			'url'             => get_permalink( $id ),
			'collection'      => $collection ? $collection->name : '',
			'collection_slug' => $collection ? $collection->slug : '',
			'collection_url'  => $collection ? add_query_arg( 'collection', $collection->slug, wc_get_page_permalink( 'shop' ) ) : wc_get_page_permalink( 'shop' ),
			'type'            => $type ? $type->name : '',
			'category'        => $category,
			'colors'          => $colors,
			'sizes'           => $sizes,
			'out_of_stock'    => array_values( array_unique( $out_of_stock ) ),
			'stock'           => $stock,
			'variations'      => $variations,
			'mrp'             => $mrp,
			'price'           => $price,
			'discount'        => $discount,
			'rating'          => $rating,
			'review_count'    => $review_count,
			'tags'            => $tags,
			'popularity'      => (int) get_post_meta( $id, '_mi_popularity', true ),
			'fit'             => (string) get_post_meta( $id, '_mi_fit', true ),
			'fabric'          => (string) get_post_meta( $id, '_mi_fabric', true ),
			'sku'             => $product->get_sku(),
			'art'             => (string) get_post_meta( $id, '_mi_art', true ),
			'palette'         => array_values( $palette ),
			'image_url'       => $image_id ? (string) wp_get_attachment_image_url( $image_id, 'mi-product-large' ) : '',
			'back_image_url'  => $gallery ? (string) wp_get_attachment_image_url( $gallery[0], 'mi-product-large' ) : '',
			'sold_out'        => $product->is_type( 'variable' ) ? ( $sizes && count( array_unique( $out_of_stock ) ) >= count( $sizes ) ) : ! $product->is_in_stock(),
			'is_variable'     => $product->is_type( 'variable' ),
		);

		self::$views[ $id ] = apply_filters( 'mi_core_product_view', $view, $product );
		return self::$views[ $id ];
	}

	/**
	 * Whole-percent discount, rounded like the original (getDiscountPercent).
	 *
	 * @param float $mrp   MRP.
	 * @param float $price Selling price.
	 * @return int
	 */
	public static function discount_percent( $mrp, $price ) {
		if ( $mrp <= 0 || $price >= $mrp ) {
			return 0;
		}
		return (int) round( ( $mrp - $price ) / $mrp * 100 );
	}

	/**
	 * Rating and count: real WooCommerce reviews once there are any, otherwise the imported figures.
	 *
	 * @param WC_Product $product Product.
	 * @return array{0:float,1:int}
	 */
	public static function rating( $product ) {
		$count = (int) $product->get_review_count();
		if ( $count > 0 ) {
			return array( round( (float) $product->get_average_rating(), 1 ), $count );
		}
		return array(
			round( (float) get_post_meta( $product->get_id(), '_mi_seed_rating', true ), 1 ),
			(int) get_post_meta( $product->get_id(), '_mi_seed_review_count', true ),
		);
	}

	/**
	 * First term of a taxonomy on a product.
	 *
	 * @param int    $product_id Product.
	 * @param string $taxonomy   Taxonomy.
	 * @return WP_Term|null
	 */
	public static function first_term( $product_id, $taxonomy ) {
		$terms = get_the_terms( $product_id, $taxonomy );
		return ( is_array( $terms ) && $terms ) ? $terms[0] : null;
	}

	/**
	 * Recompute the derived meta (discount, rating, search index, popularity default).
	 *
	 * @param int $product_id Parent product.
	 */
	public static function refresh_derived( $product_id ) {
		unset( self::$views[ $product_id ] );
		$product = wc_get_product( $product_id );
		if ( ! $product || $product->is_type( 'variation' ) ) {
			return;
		}
		$view = self::view( $product );
		if ( ! $view ) {
			return;
		}

		update_post_meta( $product_id, '_mi_discount', $view['discount'] );
		update_post_meta( $product_id, '_mi_effective_rating', $view['rating'] );
		if ( '' === get_post_meta( $product_id, '_mi_popularity', true ) ) {
			update_post_meta( $product_id, '_mi_popularity', 0 );
		}

		// SearchOverlay.tsx + shop/page.tsx searched name, collection, type, category, tags and artwork.
		$haystack = implode( ' ', array_merge( array( $view['name'], $view['collection'], $view['type'], $view['category'], $view['art'] ), $view['tags'], wp_list_pluck( $view['colors'], 'name' ) ) );
		update_post_meta( $product_id, '_mi_search_index', function_exists( 'mb_strtolower' ) ? mb_strtolower( $haystack ) : strtolower( $haystack ) );

		unset( self::$views[ $product_id ] );
		MI_Core_Catalog::flush_cache();
	}

	/**
	 * Product or variation saved.
	 *
	 * @param WC_Product $product Product.
	 */
	public static function after_save( $product ) {
		$parent = $product->get_parent_id() ? $product->get_parent_id() : $product->get_id();
		self::refresh_derived( $parent );
	}

	/**
	 * Stock changed directly (orders, the inventory screen).
	 *
	 * @param WC_Product $product Product or variation.
	 */
	public static function after_stock_change( $product ) {
		$parent = $product->get_parent_id() ? $product->get_parent_id() : $product->get_id();
		unset( self::$views[ $parent ] );
		MI_Core_Catalog::flush_cache();
	}

	/**
	 * Review counts changed — the effective rating may have switched from seeded to real.
	 *
	 * @param int $post_id Post.
	 */
	public static function after_review_count( $post_id ) {
		if ( 'product' === get_post_type( $post_id ) ) {
			self::refresh_derived( (int) $post_id );
		}
	}

	/**
	 * Terms changed (collection, type, category, tags feed the search index).
	 *
	 * @param int    $object_id Object.
	 * @param array  $terms     Terms.
	 * @param array  $tt_ids    Term taxonomy IDs.
	 * @param string $taxonomy  Taxonomy.
	 */
	public static function after_terms( $object_id, $terms, $tt_ids, $taxonomy ) {
		if ( in_array( $taxonomy, array( 'mi_collection', 'mi_type', 'product_cat', 'product_tag' ), true ) && 'product' === get_post_type( $object_id ) ) {
			self::refresh_derived( (int) $object_id );
		}
	}

	/**
	 * Backfill derived meta for every product (activation, import, CLI).
	 *
	 * @return int Products processed.
	 */
	public static function backfill() {
		$ids = wc_get_products(
			array(
				'limit'  => -1,
				'status' => array( 'publish', 'draft', 'private' ),
				'return' => 'ids',
			)
		);
		foreach ( $ids as $id ) {
			self::refresh_derived( (int) $id );
		}
		return count( $ids );
	}
}
