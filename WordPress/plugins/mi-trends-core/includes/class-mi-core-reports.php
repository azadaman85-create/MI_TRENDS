<?php
/**
 * Dashboard and report figures — app/admin/(panel)/page.tsx and reports/page.tsx,
 * computed from real WooCommerce orders instead of the seeded demo set.
 *
 * Rules carried over from the original:
 *   - revenue = sum of order totals; cancelled orders don't count (returned ones do,
 *     as in the panel); unpaid/failed/draft orders are excluded too
 *   - change % compares the window with the window before it
 *   - "new customers" = accounts created in the window
 *   - "low stock" = products whose total units are at or below the threshold
 *
 * Orders are read through wc_get_orders() (works with HPOS and posts storage)
 * and results are cached for 10 minutes; any order change clears the cache.
 * For very large stores, WooCommerce → Analytics covers the same ground.
 *
 * @package MI_Trends_Core
 */

defined( 'ABSPATH' ) || exit;

/**
 * Reports.
 */
class MI_Core_Reports {

	const CACHE_GROUP = 'mi_core_reports_';
	const MAX_ORDERS  = 5000;

	/**
	 * Statuses whose totals count as revenue.
	 *
	 * @return string[]
	 */
	public static function revenue_statuses() {
		return array( 'processing', 'on-hold', 'confirmed', 'packed', 'shipped', 'delivered', 'completed', 'returned' );
	}

	/**
	 * Clear cached figures (hooked to order changes in MI_Core_Admin).
	 */
	public static function flush() {
		foreach ( array( 7, 30, 90 ) as $days ) {
			delete_transient( self::CACHE_GROUP . 'dash_' . $days );
			delete_transient( self::CACHE_GROUP . 'rep_' . $days );
		}
	}

	/**
	 * Orders created in [from, to).
	 *
	 * @param int      $from     Unix time.
	 * @param int      $to       Unix time.
	 * @param string[] $statuses Statuses (without wc-).
	 * @return WC_Order[]
	 */
	public static function orders_between( $from, $to, $statuses ) {
		return wc_get_orders(
			array(
				'type'         => 'shop_order',
				'status'       => array_map( static function ( $s ) { return 'wc-' . $s; }, $statuses ),
				'date_created' => $from . '...' . ( $to - 1 ),
				'limit'        => self::MAX_ORDERS,
				'orderby'      => 'date',
				'order'        => 'DESC',
			)
		);
	}

	/**
	 * Percentage change, as the KPI cards show it.
	 *
	 * @param float $current  Current.
	 * @param float $previous Previous.
	 * @return float|null Null when there is nothing to compare with.
	 */
	public static function change( $current, $previous ) {
		if ( $previous <= 0 ) {
			return $current > 0 ? 100.0 : null;
		}
		return round( ( $current - $previous ) / $previous * 100, 1 );
	}

	/**
	 * Daily buckets (oldest first) for a window ending today.
	 *
	 * @param int $days Days.
	 * @return array<string,array{label:string,value:float,orders:int}>
	 */
	private static function buckets( $days ) {
		$out = array();
		for ( $offset = $days - 1; $offset >= 0; $offset-- ) {
			$ts         = strtotime( '-' . $offset . ' days', current_time( 'timestamp' ) ); // phpcs:ignore WordPress.DateTime.CurrentTimeTimestamp.Requested -- local calendar days.
			$key        = gmdate( 'Y-m-d', $ts );
			$out[ $key ] = array( 'label' => date_i18n( 'j M', $ts ), 'value' => 0.0, 'orders' => 0 );
		}
		return $out;
	}

	/**
	 * Products with their total units, for low-stock lists.
	 *
	 * @return array{low:array,out:int,products:int}
	 */
	private static function stock_summary() {
		$rows = MI_Core_Inventory::rows();
		$low  = array();
		$out  = 0;
		foreach ( $rows as $row ) {
			if ( 'out' === $row['state'] ) {
				$out++;
			}
			if ( 'ok' !== $row['state'] ) {
				$low[] = array( 'id' => $row['view']['id'], 'name' => $row['view']['name'], 'sku' => $row['view']['sku'], 'units' => $row['total'] );
			}
		}
		usort( $low, static function ( $a, $b ) { return $a['units'] <=> $b['units']; } );
		return array( 'low' => $low, 'out' => $out, 'products' => count( $rows ) );
	}

	/**
	 * Everything the dashboard shows.
	 *
	 * @param int $days 7, 30 or 90.
	 * @return array
	 */
	public static function dashboard( $days = 30 ) {
		$days   = in_array( (int) $days, array( 7, 30, 90 ), true ) ? (int) $days : 30;
		$cached = get_transient( self::CACHE_GROUP . 'dash_' . $days );
		if ( is_array( $cached ) ) {
			return $cached;
		}

		$now      = time();
		$from     = $now - $days * DAY_IN_SECONDS;
		$prev     = $from - $days * DAY_IN_SECONDS;
		$current  = self::orders_between( $from, $now + 1, self::revenue_statuses() );
		$previous = self::orders_between( $prev, $from, self::revenue_statuses() );
		$all      = self::orders_between( $from, $now + 1, array_merge( self::revenue_statuses(), array( 'cancelled', 'refunded' ) ) );

		$sum = static function ( $orders ) {
			$total = 0.0;
			foreach ( $orders as $order ) {
				$total += (float) $order->get_total();
			}
			return $total;
		};

		$series = self::buckets( $days );
		foreach ( $current as $order ) {
			$date = $order->get_date_created();
			$key  = $date ? $date->date_i18n( 'Y-m-d' ) : '';
			if ( isset( $series[ $key ] ) ) {
				$series[ $key ]['value'] += (float) $order->get_total();
				$series[ $key ]['orders']++;
			}
		}

		// Pipeline: every fulfilment state, in order.
		$pipeline = array();
		foreach ( array( 'processing', 'confirmed', 'packed', 'shipped', 'delivered', 'completed', 'cancelled', 'returned', 'refunded', 'on-hold' ) as $status ) {
			$pipeline[ $status ] = 0;
		}
		foreach ( $all as $order ) {
			$status = $order->get_status();
			if ( isset( $pipeline[ $status ] ) ) {
				$pipeline[ $status ]++;
			}
		}

		$best    = array();
		$payment = array();
		foreach ( $current as $order ) {
			$method             = $order->get_payment_method_title() ? $order->get_payment_method_title() : __( 'Other', 'mi-trends-core' );
			$payment[ $method ] = ( isset( $payment[ $method ] ) ? $payment[ $method ] : 0 ) + 1;
			foreach ( $order->get_items() as $item ) {
				if ( ! $item instanceof WC_Order_Item_Product ) {
					continue;
				}
				$pid = $item->get_product_id();
				if ( ! isset( $best[ $pid ] ) ) {
					$best[ $pid ] = array( 'name' => $item->get_name(), 'units' => 0, 'revenue' => 0.0 );
				}
				$best[ $pid ]['units']   += (int) $item->get_quantity();
				$best[ $pid ]['revenue'] += (float) $item->get_total() + (float) $item->get_total_tax();
			}
		}
		uasort( $best, static function ( $a, $b ) { return $b['units'] <=> $a['units']; } );

		$new_customers  = self::customers_joined( $from, $now + 1 );
		$prev_customers = self::customers_joined( $prev, $from );
		$stock          = self::stock_summary();

		$recent = array();
		foreach ( wc_get_orders( array( 'type' => 'shop_order', 'limit' => 6, 'orderby' => 'date', 'order' => 'DESC' ) ) as $order ) {
			$recent[] = array(
				'id'       => $order->get_id(),
				'number'   => $order->get_order_number(),
				'customer' => trim( $order->get_formatted_billing_full_name() ),
				'status'   => $order->get_status(),
				'total'    => (float) $order->get_total(),
				'placed'   => $order->get_date_created() ? $order->get_date_created()->getTimestamp() : 0,
				'edit'     => $order->get_edit_order_url(),
			);
		}

		$revenue      = $sum( $current );
		$prev_revenue = $sum( $previous );

		$data = array(
			'days'     => $days,
			'kpis'     => array(
				'revenue'       => array( 'value' => $revenue, 'change' => self::change( $revenue, $prev_revenue ) ),
				'orders'        => array( 'value' => count( $current ), 'change' => self::change( count( $current ), count( $previous ) ) ),
				'customers'     => array( 'value' => $new_customers, 'change' => self::change( $new_customers, $prev_customers ) ),
				'products'      => array( 'value' => $stock['products'] ),
				'low_stock'     => array( 'value' => count( $stock['low'] ), 'out' => $stock['out'] ),
				'pending'       => array( 'value' => $pipeline['processing'] + $pipeline['on-hold'] ),
				'avg_order'     => array( 'value' => count( $current ) ? $revenue / count( $current ) : 0 ),
			),
			'series'   => array_values( $series ),
			'pipeline' => $pipeline,
			'best'     => array_slice( array_values( $best ), 0, 6 ),
			'payment'  => $payment,
			'low'      => array_slice( $stock['low'], 0, 8 ),
			'recent'   => $recent,
		);

		set_transient( self::CACHE_GROUP . 'dash_' . $days, $data, 10 * MINUTE_IN_SECONDS );
		return $data;
	}

	/**
	 * Customers registered in [from, to).
	 *
	 * @param int $from Unix time.
	 * @param int $to   Unix time.
	 * @return int
	 */
	public static function customers_joined( $from, $to ) {
		$query = new WP_User_Query(
			array(
				'role'        => 'customer',
				'fields'      => 'ID',
				'count_total' => true,
				'number'      => 1,
				'date_query'  => array(
					array(
						'after'     => gmdate( 'Y-m-d H:i:s', $from ),
						'before'    => gmdate( 'Y-m-d H:i:s', $to ),
						'inclusive' => true,
						'column'    => 'user_registered',
					),
				),
			)
		);
		return (int) $query->get_total();
	}

	/**
	 * Reports screen: revenue trend, revenue by collection, category mix, top states.
	 *
	 * @param int $days 7, 30 or 90.
	 * @return array
	 */
	public static function reports( $days = 30 ) {
		$days   = in_array( (int) $days, array( 7, 30, 90 ), true ) ? (int) $days : 30;
		$cached = get_transient( self::CACHE_GROUP . 'rep_' . $days );
		if ( is_array( $cached ) ) {
			return $cached;
		}

		$now    = time();
		$from   = $now - $days * DAY_IN_SECONDS;
		$orders = self::orders_between( $from, $now + 1, self::revenue_statuses() );
		$series = self::buckets( $days );

		$by_collection = array();
		$by_category   = array();
		$by_state      = array();
		$units         = 0;
		$terms_cache   = array();

		foreach ( $orders as $order ) {
			$date = $order->get_date_created();
			$key  = $date ? $date->date_i18n( 'Y-m-d' ) : '';
			if ( isset( $series[ $key ] ) ) {
				$series[ $key ]['value'] += (float) $order->get_total();
				$series[ $key ]['orders']++;
			}

			$state_code = $order->get_billing_state();
			$states     = WC()->countries->get_states( 'IN' );
			$state      = isset( $states[ $state_code ] ) ? $states[ $state_code ] : ( $state_code ? $state_code : __( 'Unknown', 'mi-trends-core' ) );
			$by_state[ $state ] = ( isset( $by_state[ $state ] ) ? $by_state[ $state ] : 0 ) + (float) $order->get_total();

			foreach ( $order->get_items() as $item ) {
				if ( ! $item instanceof WC_Order_Item_Product ) {
					continue;
				}
				$pid   = $item->get_product_id();
				$line  = (float) $item->get_total() + (float) $item->get_total_tax();
				$units += (int) $item->get_quantity();
				if ( ! isset( $terms_cache[ $pid ] ) ) {
					$collection          = MI_Core_Product_Data::first_term( $pid, 'mi_collection' );
					$type                = MI_Core_Product_Data::first_term( $pid, 'mi_type' );
					$terms_cache[ $pid ] = array(
						$collection ? $collection->name : __( 'No collection', 'mi-trends-core' ),
						$type ? $type->name : __( 'Other', 'mi-trends-core' ),
					);
				}
				list( $collection_name, $type_name ) = $terms_cache[ $pid ];
				$by_collection[ $collection_name ]   = ( isset( $by_collection[ $collection_name ] ) ? $by_collection[ $collection_name ] : 0 ) + $line;
				$by_category[ $type_name ]           = ( isset( $by_category[ $type_name ] ) ? $by_category[ $type_name ] : 0 ) + $line;
			}
		}

		arsort( $by_collection );
		arsort( $by_category );
		arsort( $by_state );

		$revenue = 0.0;
		foreach ( $orders as $order ) {
			$revenue += (float) $order->get_total();
		}

		$data = array(
			'days'          => $days,
			'revenue'       => $revenue,
			'orders'        => count( $orders ),
			'units'         => $units,
			'avg_order'     => count( $orders ) ? $revenue / count( $orders ) : 0,
			'series'        => array_values( $series ),
			'by_collection' => $by_collection,
			'by_category'   => $by_category,
			'by_state'      => array_slice( $by_state, 0, 8, true ),
		);
		set_transient( self::CACHE_GROUP . 'rep_' . $days, $data, 10 * MINUTE_IN_SECONDS );
		return $data;
	}

	/**
	 * Customer tiers — new / regular / VIP, the original rule:
	 * VIP when lifetime spend > ₹12,000, regular when more than 2 orders, else new.
	 *
	 * @param float $spend  Lifetime spend.
	 * @param int   $orders Order count.
	 * @return string
	 */
	public static function tier( $spend, $orders ) {
		if ( $spend > 12000 ) {
			return 'vip';
		}
		return $orders > 2 ? 'regular' : 'new';
	}
}
