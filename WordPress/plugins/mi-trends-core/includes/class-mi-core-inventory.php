<?php
/**
 * Inventory — per-size stock, low stock, and a stock movement log.
 *
 * Stock itself is WooCommerce's: each size variation manages its own stock
 * quantity, and WooCommerce reduces it when an order is paid and restores it
 * on cancellation. This class adds what WooCommerce does not keep: a history
 * of every change ({prefix}mi_stock_movements) with its reason —
 *   order       reduced by an order
 *   restock     restored by a cancelled/refunded order
 *   return      restored by a Returned order (MI_Core_Order_Status)
 *   adjustment  saved on MI TRENDS → Inventory
 *   edit        changed in the product editor or by another plugin
 *   import      set by the catalogue import
 *
 * "Low stock" uses WooCommerce's own threshold (WooCommerce → Settings →
 * Products → Inventory → Low stock threshold; the import sets 12, the
 * original LOW_STOCK_THRESHOLD).
 *
 * @package MI_Trends_Core
 */

defined( 'ABSPATH' ) || exit;

/**
 * Inventory.
 */
class MI_Core_Inventory {

	/**
	 * Reason/order for changes happening right now (set around bulk operations).
	 *
	 * @var array{reason:string,order_id:int}|null
	 */
	private static $context = null;

	/**
	 * Hooks.
	 */
	public static function init() {
		add_action( 'woocommerce_reduce_order_item_stock', array( __CLASS__, 'log_order_reduce' ), 10, 3 );
		add_action( 'woocommerce_restore_order_item_stock', array( __CLASS__, 'log_order_restore' ), 10, 4 );
		add_action( 'woocommerce_before_product_object_save', array( __CLASS__, 'log_editor_change' ) );
		add_action( 'woocommerce_before_product_variation_object_save', array( __CLASS__, 'log_editor_change' ) );
	}

	/**
	 * Low stock threshold (WooCommerce's setting).
	 *
	 * @return int
	 */
	public static function low_threshold() {
		return (int) get_option( 'woocommerce_notify_low_stock_amount', 12 );
	}

	/**
	 * Set the reason for the next changes (e.g. 'return'), or null to clear.
	 *
	 * @param string|null $reason   Reason.
	 * @param int         $order_id Order.
	 */
	public static function set_context( $reason, $order_id = 0 ) {
		self::$context = $reason ? array( 'reason' => $reason, 'order_id' => (int) $order_id ) : null;
	}

	/**
	 * Write a movement row.
	 *
	 * @param WC_Product $product  Product or variation.
	 * @param int|null   $before   Stock before.
	 * @param int|null   $after    Stock after.
	 * @param string     $reason   Reason.
	 * @param int        $order_id Order.
	 * @param string     $note     Note.
	 */
	public static function log( $product, $before, $after, $reason, $order_id = 0, $note = '' ) {
		global $wpdb;
		if ( ! $product instanceof WC_Product ) {
			return;
		}
		$before = null === $before ? null : (int) $before;
		$after  = null === $after ? null : (int) $after;
		$delta  = (int) $after - (int) $before;
		if ( 0 === $delta && null !== $before ) {
			return;
		}
		$size = '';
		if ( $product->is_type( 'variation' ) ) {
			$attrs = $product->get_variation_attributes();
			if ( ! empty( $attrs['attribute_pa_size'] ) ) {
				$term = get_term_by( 'slug', $attrs['attribute_pa_size'], 'pa_size' );
				$size = $term ? $term->name : $attrs['attribute_pa_size'];
			}
		}

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery -- custom table insert.
		$wpdb->insert(
			MI_Core_Schema::stock_movements(),
			array(
				'product_id'   => $product->get_parent_id() ? $product->get_parent_id() : $product->get_id(),
				'variation_id' => $product->get_parent_id() ? $product->get_id() : 0,
				'sku'          => substr( (string) $product->get_sku(), 0, 100 ),
				'size'         => substr( $size, 0, 40 ),
				'delta'        => $delta,
				'stock_before' => $before,
				'stock_after'  => $after,
				'reason'       => substr( $reason, 0, 30 ),
				'order_id'     => $order_id ? (int) $order_id : null,
				'user_id'      => get_current_user_id() ? get_current_user_id() : null,
				'note'         => $note ? substr( $note, 0, 255 ) : null,
				'created_at'   => current_time( 'mysql', true ),
			),
			array( '%d', '%d', '%s', '%s', '%d', '%d', '%d', '%s', '%d', '%d', '%s', '%s' )
		);
	}

	/**
	 * An order reduced stock.
	 *
	 * @param WC_Order_Item_Product $item   Item.
	 * @param array                 $change product, from, to.
	 * @param WC_Order              $order  Order.
	 */
	public static function log_order_reduce( $item, $change, $order ) {
		self::log( $change['product'], $change['from'], $change['to'], 'order', $order->get_id() );
	}

	/**
	 * An order restored stock (cancel/refund, or a Returned order).
	 *
	 * @param WC_Order_Item_Product $item      Item.
	 * @param int                   $new_stock New stock.
	 * @param int                   $old_stock Old stock.
	 * @param WC_Order              $order     Order.
	 */
	public static function log_order_restore( $item, $new_stock, $old_stock, $order ) {
		$reason = self::$context ? self::$context['reason'] : 'restock';
		self::log( $item->get_product(), $old_stock, $new_stock, $reason, $order->get_id() );
	}

	/**
	 * A stock quantity changed through the product editor (object save).
	 *
	 * @param WC_Product $product Product.
	 */
	public static function log_editor_change( $product ) {
		$changes = $product->get_changes();
		if ( ! array_key_exists( 'stock_quantity', $changes ) || ! $product->get_id() ) {
			return;
		}
		$data   = $product->get_data();
		$before = isset( $data['stock_quantity'] ) ? $data['stock_quantity'] : null;
		$reason = self::$context ? self::$context['reason'] : 'edit';
		self::log( $product, $before, $changes['stock_quantity'], $reason, self::$context ? self::$context['order_id'] : 0 );
	}

	/**
	 * Set a variation's stock from the Inventory screen and log it.
	 *
	 * @param int    $variation_id Variation.
	 * @param int    $quantity     New quantity.
	 * @param string $note         Note.
	 * @return bool
	 */
	public static function set_stock( $variation_id, $quantity, $note = '' ) {
		$product = wc_get_product( $variation_id );
		if ( ! $product ) {
			return false;
		}
		$quantity = max( 0, (int) $quantity );
		$before   = $product->managing_stock() ? (int) $product->get_stock_quantity() : null;
		if ( null !== $before && $before === $quantity ) {
			return true;
		}
		if ( ! $product->managing_stock() ) {
			$product->set_manage_stock( true );
			self::set_context( 'adjustment' );
			$product->set_stock_quantity( $quantity );
			$product->save();
			self::set_context( null );
			return true;
		}
		wc_update_product_stock( $product, $quantity, 'set' );
		self::log( $product, $before, $quantity, 'adjustment', 0, $note );
		return true;
	}

	/**
	 * Per-size stock rows for the Inventory screen.
	 *
	 * @param string $filter all | low | out.
	 * @return array<int,array>
	 */
	public static function rows( $filter = 'all' ) {
		$threshold = self::low_threshold();
		$rows      = array();
		$ids       = wc_get_products(
			array(
				'type'    => 'variable',
				'limit'   => -1,
				'status'  => array( 'publish', 'private', 'draft' ),
				'orderby' => 'menu_order',
				'order'   => 'ASC',
				'return'  => 'ids',
			)
		);
		foreach ( $ids as $id ) {
			$view = MI_Core_Product_Data::view( $id );
			if ( ! $view ) {
				continue;
			}
			$total = 0;
			$cells = array();
			foreach ( $view['sizes'] as $size ) {
				$units          = isset( $view['stock'][ $size ] ) ? $view['stock'][ $size ] : null;
				$cells[ $size ] = array(
					'variation_id' => isset( $view['variations'][ $size ] ) ? $view['variations'][ $size ] : 0,
					'units'        => $units,
				);
				$total         += (int) $units;
			}
			$cost  = (float) get_post_meta( $id, '_mi_cost_price', true );
			$row   = array(
				'view'  => $view,
				'cells' => $cells,
				'total' => $total,
				'value' => $total * ( $cost > 0 ? $cost : $view['price'] ),
				'state' => 0 === $total ? 'out' : ( $total <= $threshold ? 'low' : 'ok' ),
			);
			if ( 'low' === $filter && 'low' !== $row['state'] ) {
				continue;
			}
			if ( 'out' === $filter && 'out' !== $row['state'] ) {
				continue;
			}
			$rows[] = $row;
		}
		return $rows;
	}

	/**
	 * Recent movements.
	 *
	 * @param int $limit      Rows.
	 * @param int $product_id Optional product filter.
	 * @return array<int,object>
	 */
	public static function movements( $limit = 50, $product_id = 0 ) {
		global $wpdb;
		$table = MI_Core_Schema::stock_movements();
		if ( $product_id ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery,WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- custom table name from $wpdb->prefix.
			return $wpdb->get_results( $wpdb->prepare( "SELECT * FROM {$table} WHERE product_id = %d ORDER BY id DESC LIMIT %d", $product_id, $limit ) );
		}
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery,WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- custom table name from $wpdb->prefix.
		return $wpdb->get_results( $wpdb->prepare( "SELECT * FROM {$table} ORDER BY id DESC LIMIT %d", $limit ) );
	}
}
