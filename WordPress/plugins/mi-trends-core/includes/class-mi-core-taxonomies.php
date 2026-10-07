<?php
/**
 * Collections and product types.
 *
 * Mapping from lib/catalog.ts:
 *   Product.category  (men|women|unisex) → WooCommerce product_cat terms "Men", "Women", "Unisex"
 *   Product.tags      (new|bestseller|sale) → WooCommerce product_tag terms
 *   Product.collection / Collection        → mi_collection taxonomy (+ tagline, motif, palette)
 *   Product.type      (T-shirt, Shirt, Pyjama Set) → mi_type taxonomy
 *
 * Collections and types get their own taxonomies rather than being squeezed
 * into product_cat because the original shop filters them independently of
 * gender ("Men" + "Shirt" + "Everyday Icons" at once).
 *
 * @package MI_Trends_Core
 */

defined( 'ABSPATH' ) || exit;

/**
 * Taxonomies.
 */
class MI_Core_Taxonomies {

	/**
	 * Hooks.
	 */
	public static function init() {
		add_action( 'init', array( __CLASS__, 'register' ), 5 );
		add_action( 'mi_collection_add_form_fields', array( __CLASS__, 'add_fields' ) );
		add_action( 'mi_collection_edit_form_fields', array( __CLASS__, 'edit_fields' ) );
		add_action( 'created_mi_collection', array( __CLASS__, 'save_fields' ) );
		add_action( 'edited_mi_collection', array( __CLASS__, 'save_fields' ) );
	}

	/**
	 * Register both taxonomies on products.
	 */
	public static function register() {
		register_taxonomy(
			'mi_collection',
			array( 'product' ),
			array(
				'labels'            => array(
					'name'          => __( 'Collections', 'mi-trends-core' ),
					'singular_name' => __( 'Collection', 'mi-trends-core' ),
					'add_new_item'  => __( 'Add collection', 'mi-trends-core' ),
					'edit_item'     => __( 'Edit collection', 'mi-trends-core' ),
					'search_items'  => __( 'Search collections', 'mi-trends-core' ),
					'menu_name'     => __( 'Collections', 'mi-trends-core' ),
				),
				'hierarchical'      => false,
				'public'            => true,
				'show_ui'           => true,
				'show_in_rest'      => true,
				'show_admin_column' => true,
				'rewrite'           => array( 'slug' => 'collection', 'with_front' => false ),
			)
		);

		register_taxonomy(
			'mi_type',
			array( 'product' ),
			array(
				'labels'            => array(
					'name'          => __( 'Product types', 'mi-trends-core' ),
					'singular_name' => __( 'Product type', 'mi-trends-core' ),
					'add_new_item'  => __( 'Add product type', 'mi-trends-core' ),
					'edit_item'     => __( 'Edit product type', 'mi-trends-core' ),
					'menu_name'     => __( 'Product types', 'mi-trends-core' ),
				),
				'hierarchical'      => false,
				'public'            => true,
				'show_ui'           => true,
				'show_in_rest'      => true,
				'show_admin_column' => true,
				'rewrite'           => array( 'slug' => 'type', 'with_front' => false ),
			)
		);
	}

	/**
	 * Collection term data as the theme needs it.
	 *
	 * @param WP_Term $term Term.
	 * @return array{name:string,slug:string,tagline:string,description:string,motif:string,palette:string[]}
	 */
	public static function collection_data( $term ) {
		$palette = json_decode( (string) get_term_meta( $term->term_id, 'mi_palette', true ), true );
		return array(
			'name'        => $term->name,
			'slug'        => $term->slug,
			'tagline'     => (string) get_term_meta( $term->term_id, 'mi_tagline', true ),
			'description' => $term->description,
			'motif'       => (string) get_term_meta( $term->term_id, 'mi_motif', true ),
			'palette'     => is_array( $palette ) && 3 === count( $palette ) ? array_values( $palette ) : array( '#131313', '#ef3f2f', '#f3f0ea' ),
		);
	}

	/**
	 * Fields on "Add collection".
	 */
	public static function add_fields() {
		wp_nonce_field( 'mi_collection_meta', 'mi_collection_nonce' );
		?>
		<div class="form-field">
			<label for="mi_tagline"><?php esc_html_e( 'Tagline', 'mi-trends-core' ); ?></label>
			<input type="text" name="mi_tagline" id="mi_tagline" value="">
			<p><?php esc_html_e( 'Short line shown with the collection, e.g. “The shirts and tees you reach for first.”', 'mi-trends-core' ); ?></p>
		</div>
		<div class="form-field">
			<label for="mi_motif"><?php esc_html_e( 'Motif', 'mi-trends-core' ); ?></label>
			<input type="text" name="mi_motif" id="mi_motif" value="">
		</div>
		<div class="form-field">
			<label><?php esc_html_e( 'Palette (ink, accent, paper)', 'mi-trends-core' ); ?></label>
			<input type="color" name="mi_palette[]" value="#131313"> <input type="color" name="mi_palette[]" value="#ef3f2f"> <input type="color" name="mi_palette[]" value="#f3f0ea">
			<p><?php esc_html_e( 'Used for the colour dots in the shop filter and for illustrated product art when a product has no photo.', 'mi-trends-core' ); ?></p>
		</div>
		<?php
	}

	/**
	 * Fields on "Edit collection".
	 *
	 * @param WP_Term $term Term.
	 */
	public static function edit_fields( $term ) {
		$data = self::collection_data( $term );
		wp_nonce_field( 'mi_collection_meta', 'mi_collection_nonce' );
		?>
		<tr class="form-field">
			<th scope="row"><label for="mi_tagline"><?php esc_html_e( 'Tagline', 'mi-trends-core' ); ?></label></th>
			<td><input type="text" name="mi_tagline" id="mi_tagline" value="<?php echo esc_attr( $data['tagline'] ); ?>"></td>
		</tr>
		<tr class="form-field">
			<th scope="row"><label for="mi_motif"><?php esc_html_e( 'Motif', 'mi-trends-core' ); ?></label></th>
			<td><input type="text" name="mi_motif" id="mi_motif" value="<?php echo esc_attr( $data['motif'] ); ?>"></td>
		</tr>
		<tr class="form-field">
			<th scope="row"><?php esc_html_e( 'Palette (ink, accent, paper)', 'mi-trends-core' ); ?></th>
			<td>
				<?php foreach ( $data['palette'] as $hex ) : ?>
					<input type="color" name="mi_palette[]" value="<?php echo esc_attr( $hex ); ?>">
				<?php endforeach; ?>
			</td>
		</tr>
		<?php
	}

	/**
	 * Save collection meta.
	 *
	 * @param int $term_id Term ID.
	 */
	public static function save_fields( $term_id ) {
		if ( ! isset( $_POST['mi_collection_nonce'] ) || ! wp_verify_nonce( sanitize_key( wp_unslash( $_POST['mi_collection_nonce'] ) ), 'mi_collection_meta' ) ) {
			return;
		}
		if ( ! current_user_can( 'manage_product_terms' ) ) {
			return;
		}
		if ( isset( $_POST['mi_tagline'] ) ) {
			update_term_meta( $term_id, 'mi_tagline', sanitize_text_field( wp_unslash( $_POST['mi_tagline'] ) ) );
		}
		if ( isset( $_POST['mi_motif'] ) ) {
			update_term_meta( $term_id, 'mi_motif', sanitize_text_field( wp_unslash( $_POST['mi_motif'] ) ) );
		}
		if ( isset( $_POST['mi_palette'] ) && is_array( $_POST['mi_palette'] ) ) {
			$palette = array_values( array_filter( array_map( 'sanitize_hex_color', array_map( 'wp_unslash', (array) $_POST['mi_palette'] ) ) ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- sanitize_hex_color.
			if ( 3 === count( $palette ) ) {
				update_term_meta( $term_id, 'mi_palette', wp_json_encode( $palette ) );
			}
		}
		MI_Core_Catalog::flush_cache();
	}
}
