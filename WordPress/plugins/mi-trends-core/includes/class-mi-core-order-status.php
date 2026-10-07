<?php
/**
 * Order fulfilment statuses — OrderStatus in lib/admin/types.ts.
 *
 *   Original   WooCommerce
 *   pending  → Processing (wc-processing)   new, paid order waiting to be confirmed
 *   confirmed→ Confirmed  (wc-confirmed)    custom
 *   packed   → Packed     (wc-packed)       custom
 *   shipped  → Shipped    (wc-shipped)      custom
 *   delivered→ Delivered  (wc-delivered)    custom; COD balance marked collected
 *   cancelled→ Cancelled  (wc-cancelled)    WooCommerce restocks automatically
 *   returned → Returned   (wc-returned)     custom; restocks if enabled in Settings
 * WooCommerce's own "Pending payment" means unpaid (Razorpay not completed).
 *
 * The status dropdown, list filters and bulk "Change status to …" actions
 * come from WooCommerce once the statuses are registered. Each move records a
 * timestamp (for tracking) and emails the customer (MI_Core_Emails).
 *
 * @package MI_Trends_Core
 */

defined( 'ABSPATH' ) || exit;

/**
 * Statuses.
 */
class MI_Core_Order_Status {

	/**
	 * Custom statuses (slug without "wc-" => label).
	 *
	 * @return array<string,string>
	 */
	public static function statuses() {
		return array(
			'confirmed' => _x( 'Confirmed', 'Order status', 'mi-trends-core' ),
			'packed'    => _x( 'Packed', 'Order status', 'mi-trends-core' ),
			'shipped'   => _x( 'Shipped', 'Order status', 'mi-trends-core' ),
			'delivered' => _x( 'Delivered', 'Order status', 'mi-trends-core' ),
			'returned'  => _x( 'Returned', 'Order status', 'mi-trends-core' ),
		);
	}

	/**
	 * Hooks.
	 */
	public static function init() {
		add_action( 'init', array( __CLASS__, 'register' ), 9 );
		add_filter( 'wc_order_statuses', array( __CLASS__, 'add_to_list' ) );
		add_filter( 'woocommerce_order_is_paid_statuses', array( __CLASS__, 'paid_statuses' ) );
		add_filter( 'woocommerce_reports_order_statuses', array( __CLASS__, 'report_statuses' ) );
		add_filter( 'woocommerce_valid_order_statuses_for_cancel', array( __CLASS__, 'cancellable' ) );
		add_filter( 'bulk_actions-edit-shop_order', array( __CLASS__, 'bulk_actions' ), 30 );
		add_filter( 'bulk_actions-woocommerce_page_wc-orders', array( __CLASS__, 'bulk_actions' ), 30 );
		add_action( 'woocommerce_order_status_changed', array( __CLASS__, 'on_change' ), 10, 4 );
	}

	/**
	 * register_post_status for each custom status.
	 */
	public static function register() {
		foreach ( self::statuses() as $slug => $label ) {
			register_post_status(
				'wc-' . $slug,
				array(
					'label'                     => $label,
					'public'                    => false,
					'exclude_from_search'       => false,
					'show_in_admin_all_list'    => true,
					'show_in_admin_status_list' => true,
					/* translators: %s: count */
					'label_count'               => _n_noop( $label . ' <span class="count">(%s)</span>', $label . ' <span class="count">(%s)</span>', 'mi-trends-core' ), // phpcs:ignore WordPress.WP.I18n.NonSingularStringLiteralSingular,WordPress.WP.I18n.NonSingularStringLiteralPlural -- label is already translated.
				)
			);
		}
	}

	/**
	 * Place the custom statuses right after Processing, in fulfilment order.
	 *
	 * @param array $statuses Statuses.
	 * @return array
	 */
	public static function add_to_list( $statuses ) {
		$out = array();
		foreach ( $statuses as $key => $label ) {
			$out[ $key ] = $label;
			if ( 'wc-processing' === $key ) {
				foreach ( self::statuses() as $slug => $custom ) {
					$out[ 'wc-' . $slug ] = $custom;
				}
			}
		}
		foreach ( self::statuses() as $slug => $custom ) {
			if ( ! isset( $out[ 'wc-' . $slug ] ) ) {
				$out[ 'wc-' . $slug ] = $custom;
			}
		}
		return $out;
	}

	/**
	 * Confirmed → delivered orders count as paid (download access, reports).
	 *
	 * @param string[] $statuses Statuses.
	 * @return string[]
	 */
	public static function paid_statuses( $statuses ) {
		return array_merge( $statuses, array( 'confirmed', 'packed', 'shipped', 'delivered' ) );
	}

	/**
	 * Include them in WooCommerce's legacy reports (returned counts as sold, as in the original panel).
	 *
	 * @param string[]|false $statuses Statuses.
	 * @return string[]|false
	 */
	public static function report_statuses( $statuses ) {
		if ( is_array( $statuses ) && in_array( 'completed', $statuses, true ) ) {
			$statuses = array_merge( $statuses, array_keys( self::statuses() ) );
		}
		return $statuses;
	}

	/**
	 * Customers may cancel until the order is packed.
	 *
	 * @param string[] $statuses Statuses.
	 * @return string[]
	 */
	public static function cancellable( $statuses ) {
		$statuses[] = 'confirmed';
		return $statuses;
	}

	/**
	 * "Change status to …" bulk actions on the orders list (legacy and HPOS screens).
	 *
	 * @param array $actions Actions.
	 * @return array
	 */
	public static function bulk_actions( $actions ) {
		foreach ( self::statuses() as $slug => $label ) {
			/* translators: %s: status */
			$actions[ 'mark_' . $slug ] = sprintf( __( 'Change status to %s', 'mi-trends-core' ), strtolower( $label ) );
		}
		return $actions;
	}

	/**
	 * Record when each stage was reached; settle COD on delivery; restock returns.
	 *
	 * @param int      $order_id Order.
	 * @param string   $from     Old status.
	 * @param string   $to       New status.
	 * @param WC_Order $order    Order.
	 */
	public static function on_change( $order_id, $from, $to, $order ) {
		$order->update_meta_data( '_mi_status_' . $to . '_at', gmdate( 'c' ) );

		if ( 'delivered' === $to && 'mi_cod_advance' === $order->get_payment_method() && 'yes' !== $order->get_meta( '_mi_cod_balance_collected' ) ) {
			$order->update_meta_data( '_mi_cod_balance_collected', 'yes' );
			$order->set_date_paid( time() );
			$order->add_order_note(
				/* translators: %s: amount */
				sprintf( __( 'Delivered — COD balance of %s marked as collected.', 'mi-trends-core' ), mi_core_money( $order->get_meta( '_mi_cod_balance' ) ) )
			);
		}

		if ( 'returned' === $to && MI_Core_Settings::get( 'restock_returns' ) && 'yes' !== $order->get_meta( '_mi_return_restocked' ) ) {
			$order->update_meta_data( '_mi_return_restocked', 'yes' );
			$order->save();
			MI_Core_Inventory::set_context( 'return', $order->get_id() );
			wc_increase_stock_levels( $order );
			MI_Core_Inventory::set_context( null );
			$order->add_order_note( __( 'Returned — stock added back.', 'mi-trends-core' ) );
		}

		$order->save();
	}

	/**
	 * The five tracking stages (track-order in the original) and how far an order is.
	 *
	 * @param WC_Order $order Order.
	 * @return array{stage_label:string,stages:array,complete:bool}
	 */
	public static function tracking( $order ) {
		$labels = array(
			__( 'Order confirmed', 'mi-trends-core' ),
			__( 'Packed', 'mi-trends-core' ),
			__( 'Shipped', 'mi-trends-core' ),
			__( 'Out for delivery', 'mi-trends-core' ),
			__( 'Delivered', 'mi-trends-core' ),
		);
		$reach  = array(
			'processing' => 0,
			'on-hold'    => 0,
			'confirmed'  => 0,
			'packed'     => 1,
			'shipped'    => 2,
			'delivered'  => 4,
			'completed'  => 4,
		);
		$status = $order->get_status();

		if ( in_array( $status, array( 'cancelled', 'returned', 'refunded', 'failed', 'pending' ), true ) ) {
			$label  = wc_get_order_status_name( $status );
			$stages = array();
			foreach ( $labels as $i => $text ) {
				$stages[] = array( 'label' => $text, 'done' => 0 === $i && 'pending' !== $status && 'failed' !== $status );
			}
			return array( 'stage_label' => $label, 'stages' => $stages, 'complete' => true );
		}

		$at     = isset( $reach[ $status ] ) ? $reach[ $status ] : 0;
		$stages = array();
		foreach ( $labels as $i => $text ) {
			$stages[] = array( 'label' => $text, 'done' => $i <= $at );
		}
		return array( 'stage_label' => $labels[ $at ], 'stages' => $stages, 'complete' => 4 === $at );
	}
}
