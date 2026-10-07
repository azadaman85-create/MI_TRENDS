<?php
/**
 * Store setup and catalogue import.
 *
 * Two separate, repeatable actions (MI TRENDS → Settings, or WP-CLI):
 *
 *   setup()   WooCommerce settings the original's rules need (INR with no
 *             decimals, India only, account required at checkout, ship to the
 *             billing address, low-stock threshold 12, verified reviews), the
 *             Size attribute, categories, tags, collections and product types,
 *             the India shipping zone with the MI shipping rate, the classic
 *             cart/checkout shortcodes, the My Account slug "account", the
 *             Wishlist and Info pages, and email colours.
 *   import()  The ten products from database/seed/catalog.json (generated from
 *             lib/catalog.ts and lib/admin/data.ts) with photos, size variations,
 *             prices and per-size stock; and the coupons from coupons.json.
 *
 * Both match existing records by SKU / slug / code and update them, so running
 * them twice does not duplicate anything.
 *
 * @package MI_Trends_Core
 */

defined( 'ABSPATH' ) || exit;

/**
 * Seeder.
 */
class MI_Core_Seeder {

	/**
	 * Read a seed file.
	 *
	 * @param string $name File in database/seed.
	 * @return array
	 */
	public static function seed( $name ) {
		$file = MI_CORE_DIR . 'database/seed/' . $name;
		if ( ! is_readable( $file ) ) {
			return array();
		}
		$data = json_decode( (string) file_get_contents( $file ), true ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- local plugin file.
		return is_array( $data ) ? $data : array();
	}

	/* --------------------------------------------------------------------- */
	/* Setup                                                                 */
	/* --------------------------------------------------------------------- */

	/**
	 * Run the store setup.
	 *
	 * @return string[] Log lines.
	 */
	public static function setup() {
		$log = array();

		$options = array(
			'woocommerce_currency'                              => 'INR',
			'woocommerce_currency_pos'                          => 'left',
			'woocommerce_price_thousand_sep'                    => ',',
			'woocommerce_price_decimal_sep'                     => '.',
			'woocommerce_price_num_decimals'                    => 0,
			'woocommerce_allowed_countries'                     => 'specific',
			'woocommerce_specific_allowed_countries'            => array( 'IN' ),
			'woocommerce_ship_to_countries'                     => 'specific',
			'woocommerce_specific_ship_to_countries'            => array( 'IN' ),
			'woocommerce_ship_to_destination'                   => 'billing_only',
			'woocommerce_enable_guest_checkout'                 => 'no',
			'woocommerce_enable_checkout_login_reminder'        => 'no',
			'woocommerce_enable_signup_and_login_from_checkout' => 'no',
			'woocommerce_enable_myaccount_registration'         => 'yes',
			'woocommerce_registration_generate_username'        => 'yes',
			'woocommerce_registration_generate_password'        => 'no',
			'woocommerce_enable_coupons'                        => 'yes',
			'woocommerce_manage_stock'                          => 'yes',
			'woocommerce_notify_low_stock_amount'               => 12,
			'woocommerce_notify_no_stock_amount'                => 0,
			'woocommerce_prices_include_tax'                    => 'yes',
			'woocommerce_enable_reviews'                        => 'yes',
			'woocommerce_review_rating_verification_label'      => 'yes',
			'woocommerce_review_rating_verification_required'   => 'yes',
			'woocommerce_enable_review_rating'                  => 'yes',
			'woocommerce_cart_redirect_after_add'               => 'no',
			'woocommerce_enable_ajax_add_to_cart'               => 'yes',
			'woocommerce_email_from_name'                       => 'MI TRENDS',
			'woocommerce_email_base_color'                      => '#171716',
			'woocommerce_email_background_color'                => '#f3f0ea',
			'woocommerce_email_body_background_color'           => '#fffdf9',
			'woocommerce_email_text_color'                      => '#131313',
		);
		foreach ( $options as $key => $value ) {
			update_option( $key, $value );
		}
		if ( ! get_option( 'woocommerce_default_country' ) || 0 !== strpos( (string) get_option( 'woocommerce_default_country' ), 'IN' ) ) {
			update_option( 'woocommerce_default_country', 'IN:MH' );
		}
		$log[] = 'WooCommerce settings: INR (no decimals), India only, account required, ship to billing address, low stock 12, verified reviews.';

		if ( '' === (string) get_option( 'permalink_structure' ) ) {
			update_option( 'permalink_structure', '/%postname%/' );
			$log[] = 'Permalinks set to "Post name" (they were "Plain").';
		}
		$permalinks                 = (array) get_option( 'woocommerce_permalinks', array() );
		$permalinks['product_base'] = '/product';
		update_option( 'woocommerce_permalinks', $permalinks );

		$log   = array_merge( $log, self::taxonomies() );
		$log   = array_merge( $log, self::woocommerce_pages() );
		$log   = array_merge( $log, self::content_pages() );
		$log[] = self::shipping_zone();

		MI_Core_Accounts::add_rewrite_rules();
		flush_rewrite_rules();
		MI_Core_Catalog::flush_cache();

		return $log;
	}

	/**
	 * Size attribute, categories, tags, collections, types.
	 *
	 * @return string[]
	 */
	private static function taxonomies() {
		$catalog = self::seed( 'catalog.json' );
		$log     = array();

		// Global attribute "Size" (pa_size) with the six sizes in order.
		$attribute_id = wc_attribute_taxonomy_id_by_name( 'size' );
		if ( ! $attribute_id ) {
			$attribute_id = wc_create_attribute(
				array(
					'name'         => 'Size',
					'slug'         => 'size',
					'type'         => 'select',
					'order_by'     => 'menu_order',
					'has_archives' => false,
				)
			);
			$log[] = 'Created the Size attribute.';
		}
		if ( ! taxonomy_exists( 'pa_size' ) ) {
			register_taxonomy( 'pa_size', array( 'product' ), array( 'hierarchical' => false, 'show_ui' => false, 'query_var' => true, 'rewrite' => false ) );
		}
		$sizes = isset( $catalog['sizes'] ) ? $catalog['sizes'] : array( 'XS', 'S', 'M', 'L', 'XL', 'XXL' );
		foreach ( $sizes as $index => $size ) {
			$term = self::ensure_term( $size, sanitize_title( $size ), 'pa_size' );
			if ( $term ) {
				wc_set_term_order( $term, $index, 'pa_size' );
			}
		}

		foreach ( isset( $catalog['categories'] ) ? $catalog['categories'] : array() as $category ) {
			self::ensure_term( $category['name'], $category['slug'], 'product_cat', $category['description'] );
		}
		foreach ( isset( $catalog['tags'] ) ? $catalog['tags'] : array() as $tag ) {
			self::ensure_term( $tag['name'], $tag['slug'], 'product_tag' );
		}
		foreach ( isset( $catalog['collections'] ) ? $catalog['collections'] : array() as $collection ) {
			$term_id = self::ensure_term( $collection['name'], $collection['slug'], 'mi_collection', $collection['description'] );
			if ( $term_id ) {
				update_term_meta( $term_id, 'mi_tagline', $collection['tagline'] );
				update_term_meta( $term_id, 'mi_motif', $collection['motif'] );
				update_term_meta( $term_id, 'mi_palette', wp_json_encode( $collection['palette'] ) );
			}
		}
		foreach ( isset( $catalog['types'] ) ? $catalog['types'] : array() as $type ) {
			self::ensure_term( $type['name'], $type['slug'], 'mi_type' );
		}

		$log[] = 'Sizes, categories (Men, Women, Unisex), tags (new, bestseller, sale), collections and product types are in place.';
		return $log;
	}

	/**
	 * Create a term if missing; return its ID.
	 *
	 * @param string $name        Name.
	 * @param string $slug        Slug.
	 * @param string $taxonomy    Taxonomy.
	 * @param string $description Description.
	 * @return int
	 */
	private static function ensure_term( $name, $slug, $taxonomy, $description = '' ) {
		$existing = get_term_by( 'slug', $slug, $taxonomy );
		if ( $existing ) {
			if ( $description && ! $existing->description ) {
				wp_update_term( $existing->term_id, $taxonomy, array( 'description' => $description ) );
			}
			return (int) $existing->term_id;
		}
		$result = wp_insert_term( $name, $taxonomy, array( 'slug' => $slug, 'description' => $description ) );
		return is_wp_error( $result ) ? 0 : (int) $result['term_id'];
	}

	/**
	 * Shop, cart (shortcode), checkout (shortcode), My Account (slug "account").
	 *
	 * @return string[]
	 */
	private static function woocommerce_pages() {
		$log   = array();
		$pages = array(
			'shop'      => array( 'shop', __( 'Shop', 'mi-trends-core' ), '' ),
			'cart'      => array( 'cart', __( 'Bag', 'mi-trends-core' ), '<!-- wp:shortcode -->[woocommerce_cart]<!-- /wp:shortcode -->' ),
			'checkout'  => array( 'checkout', __( 'Checkout', 'mi-trends-core' ), '<!-- wp:shortcode -->[woocommerce_checkout]<!-- /wp:shortcode -->' ),
			'myaccount' => array( 'account', __( 'Account', 'mi-trends-core' ), '<!-- wp:shortcode -->[woocommerce_my_account]<!-- /wp:shortcode -->' ),
		);

		foreach ( $pages as $key => $page ) {
			list( $slug, $title, $content ) = $page;
			$page_id = wc_get_page_id( $key );
			$post    = $page_id > 0 ? get_post( $page_id ) : null;

			if ( ! $post || 'trash' === $post->post_status ) {
				$page_id = wp_insert_post(
					array(
						'post_type'    => 'page',
						'post_status'  => 'publish',
						'post_title'   => $title,
						'post_name'    => $slug,
						'post_content' => $content,
					)
				);
				update_option( 'woocommerce_' . $key . '_page_id', $page_id );
				$log[] = sprintf( 'Created the %s page.', $title );
				continue;
			}

			$update = array( 'ID' => $page_id );
			if ( $post->post_name !== $slug ) {
				$update['post_name'] = $slug;
			}
			// The MI TRENDS templates render the classic cart/checkout, not the blocks.
			if ( $content && false === strpos( $post->post_content, trim( wp_strip_all_tags( $content ) ) ) ) {
				update_post_meta( $page_id, '_mi_previous_content', $post->post_content );
				$update['post_content'] = $content;
				$log[]                  = sprintf( 'Switched the %s page to the classic shortcode (previous content kept in the _mi_previous_content field).', $title );
			}
			if ( count( $update ) > 1 ) {
				wp_update_post( $update );
			}
		}
		return $log;
	}

	/**
	 * Wishlist + Info pages from pages.json.
	 *
	 * @return string[]
	 */
	private static function content_pages() {
		$data    = self::seed( 'pages.json' );
		$created = 0;
		foreach ( isset( $data['pages'] ) ? $data['pages'] : array() as $page ) {
			$parent = self::upsert_page( $page, 0, $created );
			foreach ( isset( $page['children'] ) ? $page['children'] : array() as $child ) {
				self::upsert_page( $child, $parent, $created );
			}
		}
		return array( sprintf( 'Content pages ready (%d created; existing ones left as edited).', $created ) );
	}

	/**
	 * Create a page if missing (never overwrite one the owner edited).
	 *
	 * @param array $page     Page data.
	 * @param int   $parent   Parent ID.
	 * @param int   $created  Counter.
	 * @return int Page ID.
	 */
	private static function upsert_page( $page, $parent, &$created ) {
		$path     = $parent ? get_page_uri( $parent ) . '/' . $page['slug'] : $page['slug'];
		$existing = get_page_by_path( $path );
		if ( $existing ) {
			return (int) $existing->ID;
		}
		$id = wp_insert_post(
			array(
				'post_type'    => 'page',
				'post_status'  => 'publish',
				'post_title'   => $page['title'],
				'post_name'    => $page['slug'],
				'post_parent'  => $parent,
				'post_content' => isset( $page['content'] ) ? $page['content'] : '',
			)
		);
		if ( ! $id || is_wp_error( $id ) ) {
			return 0;
		}
		$created++;
		if ( ! empty( $page['template'] ) ) {
			update_post_meta( $id, '_wp_page_template', $page['template'] );
		}
		foreach ( array( 'eyebrow' => '_mi_eyebrow', 'display_title' => '_mi_display_title', 'intro' => '_mi_intro' ) as $field => $meta ) {
			if ( ! empty( $page[ $field ] ) ) {
				update_post_meta( $id, $meta, $page[ $field ] );
			}
		}
		return (int) $id;
	}

	/**
	 * Shipping zone "India" with the MI TRENDS rate.
	 *
	 * @return string
	 */
	private static function shipping_zone() {
		foreach ( WC_Shipping_Zones::get_zones() as $zone_data ) {
			if ( 'India' === $zone_data['zone_name'] ) {
				return 'Shipping zone "India" already exists — left unchanged.';
			}
		}
		$zone = new WC_Shipping_Zone();
		$zone->set_zone_name( 'India' );
		$zone->set_zone_order( 0 );
		$zone->add_location( 'IN', 'country' );
		$zone->save();
		$zone->add_shipping_method( 'mi_trends_shipping' );
		return 'Created shipping zone "India" with the MI TRENDS rate (free over the threshold, flat fee below).';
	}

	/* --------------------------------------------------------------------- */
	/* Import                                                                */
	/* --------------------------------------------------------------------- */

	/**
	 * Import products and coupons.
	 *
	 * @param bool $with_images Sideload photos into the Media Library.
	 * @return string[] Log lines.
	 */
	public static function import( $with_images = true ) {
		if ( function_exists( 'set_time_limit' ) ) {
			set_time_limit( 300 ); // phpcs:ignore Squiz.PHP.DiscouragedFunctions.Discouraged -- photo sideloading can take a while.
		}
		$catalog = self::seed( 'catalog.json' );
		if ( empty( $catalog['products'] ) ) {
			return array( 'catalog.json is missing — nothing imported.' );
		}

		// Terms must exist first.
		self::taxonomies();

		$log = array();
		foreach ( $catalog['products'] as $data ) {
			$log[] = self::import_product( $data, $with_images );
		}
		$log = array_merge( $log, self::import_coupons() );

		MI_Core_Product_Data::backfill();
		MI_Core_Catalog::flush_cache();
		wc_delete_product_transients();
		return $log;
	}

	/**
	 * One product with its size variations.
	 *
	 * @param array $data        Product from catalog.json.
	 * @param bool  $with_images Load photos.
	 * @return string
	 */
	private static function import_product( $data, $with_images ) {
		$existing_id = wc_get_product_id_by_sku( $data['sku'] );
		$product     = $existing_id ? wc_get_product( $existing_id ) : null;
		$is_new      = ! $product;
		if ( ! $product || ! $product->is_type( 'variable' ) ) {
			$product = new WC_Product_Variable( $existing_id ? $existing_id : 0 );
		}

		$product->set_name( $data['name'] );
		$product->set_slug( $data['slug'] );
		$product->set_sku( $data['sku'] );
		$product->set_status( 'publish' );
		$product->set_catalog_visibility( 'visible' );
		$product->set_description( $data['description'] );
		$product->set_menu_order( (int) $data['menu_order'] );
		$product->set_featured( ! empty( $data['featured'] ) );
		$product->set_reviews_allowed( true );
		$product->set_manage_stock( false );

		$category = get_term_by( 'slug', $data['category'], 'product_cat' );
		$product->set_category_ids( $category ? array( (int) $category->term_id ) : array() );
		$tag_ids = array();
		foreach ( $data['tags'] as $tag ) {
			$term = get_term_by( 'slug', $tag, 'product_tag' );
			if ( $term ) {
				$tag_ids[] = (int) $term->term_id;
			}
		}
		$product->set_tag_ids( $tag_ids );

		$size_ids = array();
		foreach ( $data['sizes'] as $size ) {
			$term = get_term_by( 'slug', sanitize_title( $size ), 'pa_size' );
			if ( $term ) {
				$size_ids[] = (int) $term->term_id;
			}
		}
		$attribute = new WC_Product_Attribute();
		$attribute->set_id( wc_attribute_taxonomy_id_by_name( 'size' ) );
		$attribute->set_name( 'pa_size' );
		$attribute->set_options( $size_ids );
		$attribute->set_position( 0 );
		$attribute->set_visible( true );
		$attribute->set_variation( true );
		$product->set_attributes( array( $attribute ) );

		if ( $with_images ) {
			$front = self::sideload( $data['image'], $data['name'] );
			$back  = self::sideload( $data['back_image'], $data['name'] . ' — alternate view' );
			if ( $front ) {
				$product->set_image_id( $front );
			}
			if ( $back ) {
				$product->set_gallery_image_ids( array( $back ) );
			}
		}

		$product_id = $product->save();

		update_post_meta( $product_id, '_mi_colors', wp_json_encode( $data['colors'] ) );
		update_post_meta( $product_id, '_mi_fit', $data['fit'] );
		update_post_meta( $product_id, '_mi_fabric', $data['fabric'] );
		update_post_meta( $product_id, '_mi_art', $data['art'] );
		update_post_meta( $product_id, '_mi_palette', wp_json_encode( $data['palette'] ) );
		update_post_meta( $product_id, '_mi_cost_price', $data['cost_price'] );
		update_post_meta( $product_id, '_mi_popularity', (int) $data['popularity'] );
		update_post_meta( $product_id, '_mi_seed_rating', (float) $data['rating'] );
		update_post_meta( $product_id, '_mi_seed_review_count', (int) $data['review_count'] );
		update_post_meta( $product_id, '_mi_original_id', (int) $data['original_id'] );
		if ( ! empty( $data['seo_title'] ) ) {
			update_post_meta( $product_id, '_mi_seo_title', $data['seo_title'] );
			update_post_meta( $product_id, '_mi_seo_description', $data['seo_description'] );
		}
		wp_set_object_terms( $product_id, $data['collection'], 'mi_collection' );
		wp_set_object_terms( $product_id, sanitize_title( $data['type'] ), 'mi_type' );

		// Size variations.
		$existing = array();
		foreach ( wc_get_product( $product_id )->get_children() as $child_id ) {
			$child = wc_get_product( $child_id );
			$attrs = $child ? $child->get_variation_attributes() : array();
			if ( ! empty( $attrs['attribute_pa_size'] ) ) {
				$existing[ $attrs['attribute_pa_size'] ] = $child;
			}
		}
		foreach ( $data['sizes'] as $index => $size ) {
			$slug      = sanitize_title( $size );
			$variation = isset( $existing[ $slug ] ) ? $existing[ $slug ] : new WC_Product_Variation();
			$before    = $variation->get_id() && $variation->managing_stock() ? (int) $variation->get_stock_quantity() : null;
			$units     = isset( $data['stock'][ $size ] ) ? (int) $data['stock'][ $size ] : 0;

			$variation->set_parent_id( $product_id );
			$variation->set_attributes( array( 'pa_size' => $slug ) );
			$variation->set_sku( $data['sku'] . '-' . $size );
			$variation->set_regular_price( (string) $data['mrp'] );
			$variation->set_sale_price( $data['price'] < $data['mrp'] ? (string) $data['price'] : '' );
			$variation->set_status( 'publish' );
			$variation->set_menu_order( $index );
			$variation->set_manage_stock( true );
			MI_Core_Inventory::set_context( 'import' );
			$variation->set_stock_quantity( $units );
			$variation->set_stock_status( $units > 0 ? 'instock' : 'outofstock' );
			$variation->save();
			MI_Core_Inventory::set_context( null );
			if ( null === $before ) {
				MI_Core_Inventory::log( $variation, 0, $units, 'import', 0, 'Catalogue import' );
			}
		}

		WC_Product_Variable::sync( $product_id );
		MI_Core_Product_Data::refresh_derived( $product_id );

		return sprintf( '%s %s (%s).', $is_new ? 'Imported' : 'Updated', $data['name'], $data['sku'] );
	}

	/**
	 * Copy a bundled photo into the Media Library (once).
	 *
	 * @param string|null $file  File name in assets/seed/images.
	 * @param string      $title Alt/title.
	 * @return int Attachment ID or 0.
	 */
	private static function sideload( $file, $title ) {
		if ( ! $file ) {
			return 0;
		}
		$found = get_posts(
			array(
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'posts_per_page' => 1,
				'fields'         => 'ids',
				'meta_key'       => '_mi_seed_image', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				'meta_value'     => $file, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
			)
		);
		if ( $found ) {
			return (int) $found[0];
		}

		$source = MI_CORE_DIR . 'assets/seed/images/' . basename( $file );
		if ( ! is_readable( $source ) ) {
			return 0;
		}
		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/media.php';
		require_once ABSPATH . 'wp-admin/includes/image.php';

		$tmp = wp_tempnam( basename( $file ) );
		if ( ! $tmp || ! copy( $source, $tmp ) ) {
			return 0;
		}
		$id = media_handle_sideload( array( 'name' => basename( $file ), 'tmp_name' => $tmp ), 0, $title );
		if ( is_wp_error( $id ) ) {
			wp_delete_file( $tmp );
			return 0;
		}
		update_post_meta( $id, '_mi_seed_image', $file );
		update_post_meta( $id, '_wp_attachment_image_alt', $title );
		return (int) $id;
	}

	/**
	 * Coupons from coupons.json.
	 *
	 * @return string[]
	 */
	private static function import_coupons() {
		$data = self::seed( 'coupons.json' );
		$log  = array();
		foreach ( isset( $data['coupons'] ) ? $data['coupons'] : array() as $row ) {
			$id     = wc_get_coupon_id_by_code( $row['code'] );
			$coupon = new WC_Coupon( $id ? $id : 0 );
			$coupon->set_code( $row['code'] );
			$coupon->set_discount_type( $row['discount_type'] );
			$coupon->set_amount( $row['amount'] );
			$coupon->set_minimum_amount( $row['minimum_amount'] ? $row['minimum_amount'] : '' );
			$coupon->set_usage_limit( (int) $row['usage_limit'] );
			$coupon->set_individual_use( ! empty( $row['individual_use'] ) );
			$coupon->set_free_shipping( ! empty( $row['free_shipping'] ) );
			if ( ! empty( $row['expires'] ) ) {
				$coupon->set_date_expires( $row['expires'] );
			}
			if ( ! empty( $row['capped_percent'] ) ) {
				$coupon->update_meta_data( '_mi_capped_percent', (float) $row['capped_percent'] );
			}
			$coupon->set_status( ! empty( $row['publish'] ) ? 'publish' : 'draft' );
			$coupon->save();
			$log[] = sprintf( 'Coupon %s %s (%s).', $row['code'], $id ? 'updated' : 'created', ! empty( $row['publish'] ) ? 'active' : 'saved as draft — ' . $row['status'] );
		}
		return $log;
	}

	/* --------------------------------------------------------------------- */
	/* WooCommerce CSV importer: the "MI …" columns                          */
	/* --------------------------------------------------------------------- */

	/**
	 * Hooks for WooCommerce → Products → Import.
	 */
	public static function init_csv() {
		add_filter( 'woocommerce_csv_product_import_mapping_options', array( __CLASS__, 'csv_options' ) );
		add_filter( 'woocommerce_csv_product_import_mapping_default_columns', array( __CLASS__, 'csv_defaults' ) );
		add_filter( 'woocommerce_product_import_inserted_product_object', array( __CLASS__, 'csv_apply' ), 10, 2 );
	}

	/**
	 * Column → key.
	 *
	 * @return array<string,string>
	 */
	private static function csv_columns() {
		return array(
			'MI Collection'   => 'mi_collection',
			'MI Type'         => 'mi_type',
			'MI Colours'      => 'mi_colors',
			'MI Fit'          => 'mi_fit',
			'MI Fabric'       => 'mi_fabric',
			'MI Artwork'      => 'mi_art',
			'MI Palette'      => 'mi_palette',
			'MI Cost price'   => 'mi_cost_price',
			'MI Popularity'   => 'mi_popularity',
			'MI Rating'       => 'mi_rating',
			'MI Review count' => 'mi_review_count',
		);
	}

	/**
	 * Offer the columns in the mapping dropdown.
	 *
	 * @param array $options Options.
	 * @return array
	 */
	public static function csv_options( $options ) {
		foreach ( self::csv_columns() as $label => $key ) {
			$options[ $key ] = $label;
		}
		return $options;
	}

	/**
	 * Map them automatically by header name.
	 *
	 * @param array $columns Columns.
	 * @return array
	 */
	public static function csv_defaults( $columns ) {
		return array_merge( $columns, self::csv_columns() );
	}

	/**
	 * Apply the MI columns to an imported product.
	 *
	 * @param WC_Product $product Product.
	 * @param array      $data    Row.
	 * @return WC_Product
	 */
	public static function csv_apply( $product, $data ) {
		if ( $product->is_type( 'variation' ) ) {
			return $product;
		}
		$id = $product->get_id();
		if ( ! empty( $data['mi_collection'] ) ) {
			wp_set_object_terms( $id, sanitize_title( $data['mi_collection'] ), 'mi_collection' );
		}
		if ( ! empty( $data['mi_type'] ) ) {
			$type = sanitize_text_field( $data['mi_type'] );
			if ( ! term_exists( sanitize_title( $type ), 'mi_type' ) ) {
				wp_insert_term( $type, 'mi_type', array( 'slug' => sanitize_title( $type ) ) );
			}
			wp_set_object_terms( $id, sanitize_title( $type ), 'mi_type' );
		}
		if ( ! empty( $data['mi_colors'] ) ) {
			MI_Core_Product_Data::save_colors_from_text( $id, str_replace( ';', "\n", $data['mi_colors'] ) );
		}
		foreach ( array( 'mi_fit' => '_mi_fit', 'mi_fabric' => '_mi_fabric', 'mi_art' => '_mi_art' ) as $key => $meta ) {
			if ( isset( $data[ $key ] ) && '' !== $data[ $key ] ) {
				update_post_meta( $id, $meta, sanitize_text_field( $data[ $key ] ) );
			}
		}
		if ( ! empty( $data['mi_palette'] ) ) {
			$palette = array_values( array_filter( array_map( 'sanitize_hex_color', preg_split( '/[\s,]+/', $data['mi_palette'] ) ) ) );
			if ( 3 === count( $palette ) ) {
				update_post_meta( $id, '_mi_palette', wp_json_encode( $palette ) );
			}
		}
		$numbers = array( 'mi_cost_price' => '_mi_cost_price', 'mi_popularity' => '_mi_popularity', 'mi_rating' => '_mi_seed_rating', 'mi_review_count' => '_mi_seed_review_count' );
		foreach ( $numbers as $key => $meta ) {
			if ( isset( $data[ $key ] ) && '' !== $data[ $key ] ) {
				update_post_meta( $id, $meta, (float) $data[ $key ] );
			}
		}
		MI_Core_Product_Data::refresh_derived( $id );
		return $product;
	}
}

MI_Core_Seeder::init_csv();
