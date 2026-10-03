<?php
/**
 * Bag rules — StoreProvider.tsx on top of the WooCommerce cart.
 *
 *  - A bag line is product + size + colour (key `${id}:${size}:${color}` in the
 *    original). Size is the variation; colour is stored as cart item data
 *    `mi_color`, so the same size in two colours is two lines, and the colour
 *    is copied onto the order item ("Colour: Rosewood").
 *  - A line holds 1–10 units (clampQuantity).
 *  - Quick add takes the first in-stock size and the first colour.
 *  - Messages match the original toasts.
 *
 * @package MI_Trends_Core
 */

defined( 'ABSPATH' ) || exit;

/**
 * Cart.
 */
class MI_Core_Cart {

	const MAX_LINE_QTY = 10;

	/**
	 * Hooks.
	 */
	public static function init() {
		add_filter( 'woocommerce_add_cart_item_data', array( __CLASS__, 'add_color' ), 10, 3 );
		add_filter( 'woocommerce_get_cart_item_from_session', array( __CLASS__, 'restore_color' ), 10, 2 );
		add_filter( 'woocommerce_get_item_data', array( __CLASS__, 'display_color' ), 10, 2 );
		add_action( 'woocommerce_checkout_create_order_line_item', array( __CLASS__, 'order_item_color' ), 10, 3 );
		add_action( 'woocommerce_add_to_cart', array( __CLASS__, 'clamp_after_add' ), 20, 6 );
		add_filter( 'woocommerce_stock_amount_cart_item', array( __CLASS__, 'clamp_amount' ), 10, 2 );
		add_filter( 'woocommerce_quantity_input_max', array( __CLASS__, 'max_quantity' ), 10, 2 );
		add_action( 'admin_post_mi_trends_clear_cart', array( __CLASS__, 'handle_clear' ) );
		add_action( 'admin_post_nopriv_mi_trends_clear_cart', array( __CLASS__, 'handle_clear' ) );
	}

	/**
	 * Pick the colour for a product: the requested one if the product has it, else the first.
	 *
	 * @param int    $product_id Parent product.
	 * @param string $requested  Colour name.
	 * @return array{name:string,hex:string}|null
	 */
	public static function resolve_color( $product_id, $requested ) {
		$colors = MI_Core_Product_Data::colors( $product_id );
		if ( ! $colors ) {
			return null;
		}
		foreach ( $colors as $color ) {
			if ( 0 === strcasecmp( $color['name'], (string) $requested ) ) {
				return $color;
			}
		}
		return $colors[0];
	}

	/**
	 * Attach the chosen colour when a product is added (form post or AJAX).
	 *
	 * @param array $data         Cart item data.
	 * @param int   $product_id   Parent product.
	 * @param int   $variation_id Variation.
	 * @return array
	 */
	public static function add_color( $data, $product_id, $variation_id ) {
		if ( isset( $data['mi_color'] ) ) {
			return $data;
		}
		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- WooCommerce's add-to-cart handler; the value is only matched against the product's own colours.
		$requested = isset( $_POST['mi_color'] ) ? sanitize_text_field( wp_unslash( $_POST['mi_color'] ) ) : '';
		$color     = self::resolve_color( $product_id, $requested );
		if ( $color ) {
			$data['mi_color'] = $color;
		}
		return $data;
	}

	/**
	 * Keep the colour when the cart is loaded from the session.
	 *
	 * @param array $item   Cart item.
	 * @param array $values Session values.
	 * @return array
	 */
	public static function restore_color( $item, $values ) {
		if ( isset( $values['mi_color'] ) ) {
			$item['mi_color'] = $values['mi_color'];
		}
		return $item;
	}

	/**
	 * Show "Colour: …" wherever WooCommerce lists item data.
	 *
	 * @param array $data Item data.
	 * @param array $item Cart item.
	 * @return array
	 */
	public static function display_color( $data, $item ) {
		if ( ! empty( $item['mi_color']['name'] ) ) {
			$data[] = array(
				'key'   => __( 'Colour', 'mi-trends-core' ),
				'value' => esc_html( $item['mi_color']['name'] ),
			);
		}
		return $data;
	}

	/**
	 * Copy the colour to the order line.
	 *
	 * @param WC_Order_Item_Product $item   Order item.
	 * @param string                $key    Cart key.
	 * @param array                 $values Cart item.
	 */
	public static function order_item_color( $item, $key, $values ) {
		if ( ! empty( $values['mi_color']['name'] ) ) {
			$item->add_meta_data( __( 'Colour', 'mi-trends-core' ), $values['mi_color']['name'], true );
			$item->add_meta_data( '_mi_color_hex', $values['mi_color']['hex'], true );
		}
	}

	/**
	 * Never more than 10 on a line (clampQuantity) — adding to an existing line caps silently, as before.
	 *
	 * @param string $key            Cart item key.
	 * @param int    $product_id     Product.
	 * @param int    $quantity       Added quantity.
	 * @param int    $variation_id   Variation.
	 * @param array  $variation      Attributes.
	 * @param array  $cart_item_data Data.
	 */
	public static function clamp_after_add( $key, $product_id, $quantity, $variation_id, $variation, $cart_item_data ) {
		$item = WC()->cart->get_cart_item( $key );
		if ( $item && $item['quantity'] > self::MAX_LINE_QTY ) {
			WC()->cart->set_quantity( $key, self::MAX_LINE_QTY, false );
		}
	}

	/**
	 * Clamp quantities submitted from the bag page.
	 *
	 * @param int|float $quantity Quantity.
	 * @param string    $key      Cart key.
	 * @return int|float
	 */
	public static function clamp_amount( $quantity, $key ) {
		return min( self::MAX_LINE_QTY, $quantity );
	}

	/**
	 * Quantity inputs stop at 10 (or the stock, if lower).
	 *
	 * @param int        $max     Max.
	 * @param WC_Product $product Product.
	 * @return int
	 */
	public static function max_quantity( $max, $product ) {
		return ( $max > 0 && $max < self::MAX_LINE_QTY ) ? $max : self::MAX_LINE_QTY;
	}

	/**
	 * Add a size/colour/quantity to the bag. Used by the AJAX endpoint.
	 *
	 * @param int    $product_id   Parent product.
	 * @param int    $variation_id Variation (size).
	 * @param string $color        Colour name.
	 * @param int    $quantity     Quantity.
	 * @return true|WP_Error
	 */
	public static function add( $product_id, $variation_id, $color, $quantity ) {
		$product   = wc_get_product( $product_id );
		$variation = $variation_id ? wc_get_product( $variation_id ) : null;

		if ( ! $product || 'publish' !== $product->get_status() ) {
			return new WP_Error( 'mi_unavailable', __( 'This style is currently unavailable.', 'mi-trends-core' ) );
		}
		if ( $product->is_type( 'variable' ) && ( ! $variation || (int) $variation->get_parent_id() !== (int) $product_id ) ) {
			return new WP_Error( 'mi_size', __( 'Choose an available size before adding this style.', 'mi-trends-core' ) );
		}

		$quantity  = max( 1, min( self::MAX_LINE_QTY, (int) $quantity ) );
		$attrs     = $variation ? $variation->get_variation_attributes() : array();
		$color     = self::resolve_color( $product_id, $color );
		$item_data = $color ? array( 'mi_color' => $color ) : array();

		wc_clear_notices();
		$key = WC()->cart->add_to_cart( $product_id, $quantity, $variation ? $variation->get_id() : 0, $attrs, $item_data );

		if ( ! $key ) {
			$errors = wc_get_notices( 'error' );
			wc_clear_notices();
			$message = $errors ? wp_strip_all_tags( is_array( $errors[0] ) ? $errors[0]['notice'] : $errors[0] ) : __( 'This style is currently unavailable.', 'mi-trends-core' );
			return new WP_Error( 'mi_add_failed', $message );
		}

		wc_clear_notices();
		return true;
	}

	/**
	 * Quick add — first size that isn't sold out, first colour (StoreProvider.quickAdd).
	 *
	 * @param int $product_id Product.
	 * @return true|WP_Error
	 */
	public static function quick_add( $product_id ) {
		$view = MI_Core_Product_Data::view( $product_id );
		if ( ! $view ) {
			return new WP_Error( 'mi_unavailable', __( 'This style is currently unavailable.', 'mi-trends-core' ) );
		}
		if ( ! $view['is_variable'] ) {
			return self::add( $product_id, 0, '', 1 );
		}
		foreach ( $view['sizes'] as $size ) {
			if ( ! in_array( $size, $view['out_of_stock'], true ) && ! empty( $view['variations'][ $size ] ) ) {
				return self::add( $product_id, $view['variations'][ $size ], $view['colors'][0]['name'], 1 );
			}
		}
		return new WP_Error( 'mi_unavailable', __( 'This style is currently unavailable.', 'mi-trends-core' ) );
	}

	/**
	 * Set a line's quantity; 0 removes it. Returns the toast message, if any.
	 *
	 * @param string $key      Cart key.
	 * @param int    $quantity Quantity.
	 * @return string|WP_Error
	 */
	public static function update( $key, $quantity ) {
		$item = WC()->cart->get_cart_item( $key );
		if ( ! $item ) {
			return new WP_Error( 'mi_missing', __( 'That item is no longer in your bag.', 'mi-trends-core' ) );
		}
		if ( $quantity <= 0 ) {
			$name = $item['data'] instanceof WC_Product ? ( $item['data']->get_parent_id() ? get_the_title( $item['data']->get_parent_id() ) : $item['data']->get_name() ) : __( 'Item', 'mi-trends-core' );
			WC()->cart->remove_cart_item( $key );
			/* translators: %s: product name */
			return sprintf( __( '%s removed from your bag.', 'mi-trends-core' ), $name );
		}
		WC()->cart->set_quantity( $key, min( self::MAX_LINE_QTY, (int) $quantity ), true );
		return '';
	}

	/**
	 * "Clear bag" on the bag page (form post).
	 */
	public static function handle_clear() {
		check_admin_referer( 'mi_trends_clear_cart', 'mi_clear_nonce' );
		// admin-post.php is an admin request, where WooCommerce doesn't load the session/cart by itself.
		if ( function_exists( 'wc_load_cart' ) ) {
			wc_load_cart();
		}
		if ( WC()->cart ) {
			WC()->cart->empty_cart();
		}
		wp_safe_redirect( wc_get_cart_url() );
		exit;
	}
}
