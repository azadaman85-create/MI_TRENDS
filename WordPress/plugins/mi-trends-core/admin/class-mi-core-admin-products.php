<?php
/**
 * Product editor additions (ProductEditor.tsx fields WooCommerce lacks) and the
 * page-header box for info pages.
 *
 * Product data → "MI TRENDS" tab: colours, fit, fabric, artwork line, palette,
 * cost price, popularity, imported rating/review count.
 * Everything else — name, description, SKU, prices, sizes/stock (variations),
 * images, categories, tags, collection, product type, status, featured — uses
 * WooCommerce's own editor.
 *
 * @package MI_Trends_Core
 */

defined( 'ABSPATH' ) || exit;

/**
 * Product admin.
 */
class MI_Core_Admin_Products {

	/**
	 * Hooks.
	 */
	public static function init() {
		add_filter( 'woocommerce_product_data_tabs', array( __CLASS__, 'tab' ) );
		add_action( 'woocommerce_product_data_panels', array( __CLASS__, 'panel' ) );
		add_action( 'woocommerce_admin_process_product_object', array( __CLASS__, 'save' ) );
		add_action( 'add_meta_boxes_page', array( __CLASS__, 'page_box' ) );
		add_action( 'save_post_page', array( __CLASS__, 'save_page_box' ), 10, 2 );
	}

	/**
	 * Add the tab.
	 *
	 * @param array $tabs Tabs.
	 * @return array
	 */
	public static function tab( $tabs ) {
		$tabs['mi_trends'] = array(
			'label'    => __( 'MI TRENDS', 'mi-trends-core' ),
			'target'   => 'mi_trends_product_data',
			'class'    => array(),
			'priority' => 15,
		);
		return $tabs;
	}

	/**
	 * Tab content.
	 */
	public static function panel() {
		global $post;
		$colors = MI_Core_Product_Data::colors( $post->ID );
		$lines  = array();
		foreach ( $colors as $color ) {
			$lines[] = $color['name'] . ' | ' . $color['hex'];
		}
		$palette = json_decode( (string) get_post_meta( $post->ID, '_mi_palette', true ), true );
		$palette = is_array( $palette ) && 3 === count( $palette ) ? $palette : array( '#131313', '#ef3f2f', '#f3f0ea' );
		?>
		<div id="mi_trends_product_data" class="panel woocommerce_options_panel hidden">
			<div class="options_group">
				<p class="form-field">
					<label for="mi_colors"><?php esc_html_e( 'Colours', 'mi-trends-core' ); ?></label>
					<textarea id="mi_colors" name="mi_colors" rows="4" style="width:60%" placeholder="Optic White | #f4f4f2"><?php echo esc_textarea( implode( "\n", $lines ) ); ?></textarea>
					<?php echo wc_help_tip( __( 'One per line: name | hex. Shoppers pick one on the product page; it is saved on the bag line and the order. Stock is per size, not per colour.', 'mi-trends-core' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- WooCommerce escapes the tip. ?>
				</p>
				<?php
				woocommerce_wp_text_input( array( 'id' => '_mi_fit', 'label' => __( 'Fit', 'mi-trends-core' ), 'placeholder' => 'Regular everyday fit' ) );
				woocommerce_wp_text_input( array( 'id' => '_mi_fabric', 'label' => __( 'Fabric', 'mi-trends-core' ), 'placeholder' => '180 GSM combed cotton jersey' ) );
				woocommerce_wp_text_input( array( 'id' => '_mi_art', 'label' => __( 'Artwork line', 'mi-trends-core' ), 'placeholder' => 'Clean lines · No print' ) );
				?>
				<p class="form-field">
					<label><?php esc_html_e( 'Palette (ink, accent, paper)', 'mi-trends-core' ); ?></label>
					<?php foreach ( $palette as $hex ) : ?>
						<input type="color" name="mi_palette[]" value="<?php echo esc_attr( $hex ); ?>" style="width:48px;height:30px;padding:0;margin-right:6px">
					<?php endforeach; ?>
					<?php echo wc_help_tip( __( 'Used for illustrated artwork when a product has no photo.', 'mi-trends-core' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				</p>
			</div>
			<div class="options_group">
				<?php
				woocommerce_wp_text_input( array( 'id' => '_mi_cost_price', 'label' => __( 'Cost price (₹)', 'mi-trends-core' ), 'type' => 'number', 'custom_attributes' => array( 'min' => '0', 'step' => '1' ), 'desc_tip' => true, 'description' => __( 'Used for stock value on the Inventory screen. Never shown to shoppers.', 'mi-trends-core' ) ) );
				woocommerce_wp_text_input( array( 'id' => '_mi_popularity', 'label' => __( 'Popularity score', 'mi-trends-core' ), 'type' => 'number', 'custom_attributes' => array( 'min' => '0', 'step' => '1' ), 'desc_tip' => true, 'description' => __( 'Orders "Most popular" sorting and the Trending rail. Higher shows first.', 'mi-trends-core' ) ) );
				woocommerce_wp_text_input( array( 'id' => '_mi_seed_rating', 'label' => __( 'Imported rating', 'mi-trends-core' ), 'type' => 'number', 'custom_attributes' => array( 'min' => '0', 'max' => '5', 'step' => '0.1' ), 'desc_tip' => true, 'description' => __( 'Shown until the product has its own WooCommerce reviews; then the real average is used.', 'mi-trends-core' ) ) );
				woocommerce_wp_text_input( array( 'id' => '_mi_seed_review_count', 'label' => __( 'Imported review count', 'mi-trends-core' ), 'type' => 'number', 'custom_attributes' => array( 'min' => '0', 'step' => '1' ) ) );
				?>
			</div>
		</div>
		<?php
	}

	/**
	 * Save (WooCommerce has checked the nonce and the edit_product capability).
	 *
	 * @param WC_Product $product Product.
	 */
	public static function save( $product ) {
		// phpcs:disable WordPress.Security.NonceVerification.Missing -- WooCommerce verified woocommerce_meta_nonce before this action.
		$id = $product->get_id();
		if ( isset( $_POST['mi_colors'] ) ) {
			MI_Core_Product_Data::save_colors_from_text( $id, sanitize_textarea_field( wp_unslash( $_POST['mi_colors'] ) ) );
		}
		foreach ( array( '_mi_fit', '_mi_fabric', '_mi_art' ) as $key ) {
			if ( isset( $_POST[ $key ] ) ) {
				$product->update_meta_data( $key, sanitize_text_field( wp_unslash( $_POST[ $key ] ) ) );
			}
		}
		if ( isset( $_POST['mi_palette'] ) && is_array( $_POST['mi_palette'] ) ) {
			$palette = array_values( array_filter( array_map( 'sanitize_hex_color', array_map( 'wp_unslash', (array) $_POST['mi_palette'] ) ) ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- sanitize_hex_color.
			if ( 3 === count( $palette ) ) {
				$product->update_meta_data( '_mi_palette', wp_json_encode( $palette ) );
			}
		}
		$numbers = array(
			'_mi_cost_price'        => 'floatval',
			'_mi_popularity'        => 'intval',
			'_mi_seed_rating'       => 'floatval',
			'_mi_seed_review_count' => 'intval',
		);
		foreach ( $numbers as $key => $cast ) {
			if ( isset( $_POST[ $key ] ) && '' !== $_POST[ $key ] ) {
				$value = call_user_func( $cast, wp_unslash( $_POST[ $key ] ) );
				if ( '_mi_seed_rating' === $key ) {
					$value = min( 5, max( 0, $value ) );
				}
				$product->update_meta_data( $key, max( 0, $value ) );
			}
		}
		// phpcs:enable
	}

	/**
	 * "MI TRENDS page header" on pages.
	 */
	public static function page_box() {
		add_meta_box( 'mi_page_header', __( 'MI TRENDS page header', 'mi-trends-core' ), array( __CLASS__, 'render_page_box' ), 'page', 'side' );
	}

	/**
	 * Render the box.
	 *
	 * @param WP_Post $post Page.
	 */
	public static function render_page_box( $post ) {
		wp_nonce_field( 'mi_page_header', 'mi_page_header_nonce' );
		$fields = array(
			'_mi_eyebrow'       => array( __( 'Eyebrow (small red line)', 'mi-trends-core' ), 'Our story' ),
			'_mi_display_title' => array( __( 'Headline — use | for a line break', 'mi-trends-core' ), 'MADE TO BE|NOTICED.' ),
			'_mi_intro'         => array( __( 'Intro', 'mi-trends-core' ), '' ),
		);
		foreach ( $fields as $key => $config ) {
			printf(
				'<p><label for="%1$s"><strong>%2$s</strong></label><br><%3$s id="%1$s" name="%1$s" class="widefat" placeholder="%4$s"%5$s</p>',
				esc_attr( $key ),
				esc_html( $config[0] ),
				'_mi_intro' === $key ? 'textarea rows="3"' : 'input type="text"',
				esc_attr( $config[1] ),
				'_mi_intro' === $key
					? '>' . esc_textarea( (string) get_post_meta( $post->ID, $key, true ) ) . '</textarea>'
					: ' value="' . esc_attr( (string) get_post_meta( $post->ID, $key, true ) ) . '">'
			);
		}
	}

	/**
	 * Save the box.
	 *
	 * @param int     $post_id Page.
	 * @param WP_Post $post    Post.
	 */
	public static function save_page_box( $post_id, $post ) {
		if ( ! isset( $_POST['mi_page_header_nonce'] ) || ! wp_verify_nonce( sanitize_key( wp_unslash( $_POST['mi_page_header_nonce'] ) ), 'mi_page_header' ) ) {
			return;
		}
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}
		if ( ! current_user_can( 'edit_page', $post_id ) ) {
			return;
		}
		foreach ( array( '_mi_eyebrow', '_mi_display_title' ) as $key ) {
			if ( isset( $_POST[ $key ] ) ) {
				update_post_meta( $post_id, $key, sanitize_text_field( wp_unslash( $_POST[ $key ] ) ) );
			}
		}
		if ( isset( $_POST['_mi_intro'] ) ) {
			update_post_meta( $post_id, '_mi_intro', sanitize_textarea_field( wp_unslash( $_POST['_mi_intro'] ) ) );
		}
	}
}
