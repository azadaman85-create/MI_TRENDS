<?php
/**
 * MI TRENDS admin screens: Dashboard, Inventory, Reports, Customers,
 * Subscribers, Settings — and their form handlers.
 *
 * Every handler checks the capability (manage_woocommerce) and a nonce.
 *
 * @package MI_Trends_Core
 */

defined( 'ABSPATH' ) || exit;

/**
 * Admin pages.
 */
class MI_Core_Admin_Pages {

	/**
	 * Stop unless the user can manage the store.
	 */
	private static function guard() {
		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			wp_die( esc_html__( 'You do not have permission to do that.', 'mi-trends-core' ), 403 );
		}
	}

	/**
	 * Selected range (7/30/90) from the URL.
	 *
	 * @return int
	 */
	private static function range() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- view filter.
		$days = isset( $_GET['range'] ) ? absint( $_GET['range'] ) : 30;
		return in_array( $days, array( 7, 30, 90 ), true ) ? $days : 30;
	}

	/**
	 * Range tabs (Tabs.tsx, segment style).
	 *
	 * @param string $page Page slug.
	 * @param int    $days Current.
	 * @return string
	 */
	private static function range_tabs( $page, $days ) {
		$out = '<nav class="a-tabs a-tabs--segment" aria-label="' . esc_attr__( 'Date range', 'mi-trends-core' ) . '">';
		foreach ( array( 7, 30, 90 ) as $option ) {
			$out .= sprintf(
				'<a class="a-tab%1$s" href="%2$s">%3$s</a>',
				$option === $days ? ' is-active' : '',
				esc_url( add_query_arg( array( 'page' => $page, 'range' => $option ), admin_url( 'admin.php' ) ) ),
				/* translators: %d: days */
				esc_html( sprintf( __( '%d days', 'mi-trends-core' ), $option ) )
			);
		}
		return $out . '</nav>';
	}

	/**
	 * Orders list URL, optionally filtered by status (HPOS or legacy screen).
	 *
	 * @param string $status Status without wc-.
	 * @return string
	 */
	public static function orders_url( $status = '' ) {
		$hpos = class_exists( \Automattic\WooCommerce\Utilities\OrderUtil::class ) && \Automattic\WooCommerce\Utilities\OrderUtil::custom_orders_table_usage_is_enabled();
		if ( $hpos ) {
			return add_query_arg( array_filter( array( 'page' => 'wc-orders', 'status' => $status ? 'wc-' . $status : '' ) ), admin_url( 'admin.php' ) );
		}
		return add_query_arg( array_filter( array( 'post_type' => 'shop_order', 'post_status' => $status ? 'wc-' . $status : '' ) ), admin_url( 'edit.php' ) );
	}

	/**
	 * A KPI card (KpiCard.tsx).
	 *
	 * @param string     $label   Label.
	 * @param string     $value   Value.
	 * @param string     $icon    Icon name.
	 * @param float|null $change  % change.
	 * @param string     $caption Caption.
	 * @param string     $accent  Accent colour.
	 */
	private static function kpi( $label, $value, $icon, $change = null, $caption = '', $accent = 'var(--ink)' ) {
		$direction = null === $change ? 'flat' : ( $change > 0.05 ? 'up' : ( $change < -0.05 ? 'down' : 'flat' ) );
		?>
		<article class="a-kpi" style="--accent:<?php echo esc_attr( $accent ); ?>">
			<div class="a-kpi__top">
				<span class="a-kpi__icon"><?php echo self::icon( $icon, 18 ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- trusted icon markup. ?></span>
				<?php if ( null !== $change ) : ?>
					<span class="a-trend a-trend--<?php echo esc_attr( $direction ); ?>"><?php echo esc_html( ( $change > 0 ? '+' : '' ) . number_format_i18n( $change, 1 ) . '%' ); ?></span>
				<?php endif; ?>
			</div>
			<p class="a-kpi__value"><?php echo esc_html( $value ); ?></p>
			<p class="a-kpi__label"><?php echo esc_html( $label ); ?></p>
			<?php if ( $caption ) : ?><p class="a-kpi__foot"><?php echo esc_html( $caption ); ?></p><?php endif; ?>
		</article>
		<?php
	}

	/**
	 * Lucide icon for admin screens (same JSON as the theme).
	 *
	 * @param string $name Icon.
	 * @param int    $size Size.
	 * @return string
	 */
	public static function icon( $name, $size = 16 ) {
		static $icons = null;
		if ( null === $icons ) {
			$file  = MI_CORE_DIR . 'assets/icons/icons.json';
			$icons = is_readable( $file ) ? json_decode( (string) file_get_contents( $file ), true ) : array(); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- local plugin file.
		}
		if ( empty( $icons[ $name ] ) ) {
			return '';
		}
		return '<svg xmlns="http://www.w3.org/2000/svg" width="' . (int) $size . '" height="' . (int) $size . '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' . $icons[ $name ] . '</svg>';
	}

	/**
	 * Card open/close (Card.tsx).
	 *
	 * @param string $title       Title.
	 * @param string $description Description.
	 * @param string $actions     Actions HTML (escaped).
	 * @param bool   $flush       No body padding.
	 */
	private static function card_open( $title, $description = '', $actions = '', $flush = false ) {
		echo '<section class="a-card"><header class="a-card__head"><div><h3>' . esc_html( $title ) . '</h3>';
		if ( $description ) {
			echo '<p>' . esc_html( $description ) . '</p>';
		}
		echo '</div>';
		if ( $actions ) {
			echo '<div class="a-actions">' . $actions . '</div>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped by caller.
		}
		echo '</header><div class="a-card__body' . ( $flush ? ' a-card__body--flush' : '' ) . '">';
	}

	/**
	 * Close a card.
	 */
	private static function card_close() {
		echo '</div></section>';
	}

	/**
	 * Empty state (States.tsx).
	 *
	 * @param string $title   Title.
	 * @param string $message Message.
	 */
	private static function empty_state( $title, $message ) {
		echo '<div class="a-empty"><div class="a-empty__icon">' . self::icon( 'package', 20 ) . '</div><h3>' . esc_html( $title ) . '</h3><p>' . esc_html( $message ) . '</p></div>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- trusted icon markup.
	}

	/* ===================================================================== */
	/* Dashboard                                                             */
	/* ===================================================================== */

	/**
	 * MI TRENDS → Dashboard (app/admin/(panel)/page.tsx).
	 */
	public static function dashboard() {
		self::guard();
		$days = self::range();
		$data = MI_Core_Reports::dashboard( $days );
		$user = wp_get_current_user();
		$hour = (int) current_time( 'G' );
		$greet = $hour < 12 ? __( 'Good morning', 'mi-trends-core' ) : ( $hour < 17 ? __( 'Good afternoon', 'mi-trends-core' ) : __( 'Good evening', 'mi-trends-core' ) );

		$export = sprintf(
			'<a class="a-btn a-btn--outline" href="%s">%s%s</a>',
			esc_url( wp_nonce_url( admin_url( 'admin-post.php?action=mi_core_export&type=revenue&range=' . $days ), 'mi_core_export' ) ),
			self::icon( 'arrow-up', 15 ),
			esc_html__( 'Export CSV', 'mi-trends-core' )
		);
		?>
		<div class="wrap mi-admin-wrap"><div class="admin-root mi-admin">
			<?php
			MI_Core_Admin::page_head(
				wp_date( 'l, j F' ),
				sprintf( '%s, %s', $greet, strtok( $user->display_name, ' ' ) ),
				/* translators: %d: days */
				sprintf( __( 'How the store is doing over the last %d days.', 'mi-trends-core' ), $days ),
				self::range_tabs( 'mi-trends', $days ) . $export
			);
			$k = $data['kpis'];
			?>
			<div class="a-kpi-grid">
				<?php
				self::kpi( __( 'Revenue', 'mi-trends-core' ), mi_core_money( $k['revenue']['value'] ), 'indian-rupee', $k['revenue']['change'], __( 'vs previous period', 'mi-trends-core' ), 'var(--red)' );
				self::kpi( __( 'Orders', 'mi-trends-core' ), number_format_i18n( $k['orders']['value'] ), 'shopping-bag', $k['orders']['change'], sprintf( /* translators: %s: average */ __( 'Average order %s', 'mi-trends-core' ), mi_core_money( $k['avg_order']['value'] ) ) );
				self::kpi( __( 'New customers', 'mi-trends-core' ), number_format_i18n( $k['customers']['value'] ), 'user-round', $k['customers']['change'], '', 'var(--blue)' );
				self::kpi( __( 'Products', 'mi-trends-core' ), number_format_i18n( $k['products']['value'] ), 'shirt', null, __( 'In the catalogue', 'mi-trends-core' ) );
				/* translators: %d: count */
				self::kpi( __( 'Low stock', 'mi-trends-core' ), number_format_i18n( $k['low_stock']['value'] ), 'triangle-alert', null, sprintf( __( '%d sold out', 'mi-trends-core' ), $k['low_stock']['out'] ), '#8a6100' );
				self::kpi( __( 'Awaiting confirmation', 'mi-trends-core' ), number_format_i18n( $k['pending']['value'] ), 'clock', null, __( 'Paid orders not yet confirmed', 'mi-trends-core' ), 'var(--green)' );
				?>
			</div>

			<?php
			$pipeline = array(
				'processing' => __( 'New / processing', 'mi-trends-core' ),
				'confirmed'  => __( 'Confirmed', 'mi-trends-core' ),
				'packed'     => __( 'Packing', 'mi-trends-core' ),
				'shipped'    => __( 'Shipment', 'mi-trends-core' ),
				'delivered'  => __( 'Delivered', 'mi-trends-core' ),
				'returned'   => __( 'Returns', 'mi-trends-core' ),
				'cancelled'  => __( 'Cancelled', 'mi-trends-core' ),
			);
			self::card_open( __( 'Fulfilment pipeline', 'mi-trends-core' ), __( 'Orders placed in this period, by where they are now. Click a stage to work through it.', 'mi-trends-core' ) );
			echo '<div class="mi-pipeline">';
			foreach ( $pipeline as $status => $label ) {
				printf(
					'<a class="mi-pipeline__stage" href="%1$s"><span class="a-num">%2$s</span><small>%3$s</small></a>',
					esc_url( self::orders_url( $status ) ),
					esc_html( number_format_i18n( $data['pipeline'][ $status ] + ( 'delivered' === $status ? $data['pipeline']['completed'] : 0 ) ) ),
					esc_html( $label )
				);
			}
			echo '</div>';
			self::card_close();
			?>

			<div class="a-split mi-gap">
				<?php
				/* translators: %d: days */
				self::card_open( __( 'Revenue', 'mi-trends-core' ), sprintf( __( 'Daily revenue, last %d days', 'mi-trends-core' ), $days ) );
				echo MI_Core_Admin_Charts::area( $data['series'], __( 'Daily revenue', 'mi-trends-core' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built with escaped values.
				self::card_close();

				$p = $data['pipeline'];
				self::card_open( __( 'Order status', 'mi-trends-core' ), __( 'Orders in range', 'mi-trends-core' ) );
				echo MI_Core_Admin_Charts::donut( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built with escaped values.
					array(
						array( 'label' => __( 'Delivered', 'mi-trends-core' ), 'value' => $p['delivered'] + $p['completed'], 'color' => '#16764a' ),
						array( 'label' => __( 'Shipped', 'mi-trends-core' ), 'value' => $p['shipped'], 'color' => '#131313' ),
						array( 'label' => __( 'Packed', 'mi-trends-core' ), 'value' => $p['packed'], 'color' => '#2b63d9' ),
						array( 'label' => __( 'Confirmed', 'mi-trends-core' ), 'value' => $p['confirmed'], 'color' => '#7aa2e8' ),
						array( 'label' => __( 'New', 'mi-trends-core' ), 'value' => $p['processing'] + $p['on-hold'], 'color' => '#ffd943' ),
						array( 'label' => __( 'Cancelled / returned', 'mi-trends-core' ), 'value' => $p['cancelled'] + $p['returned'] + $p['refunded'], 'color' => '#ef3f2f' ),
					),
					__( 'orders', 'mi-trends-core' )
				);
				self::card_close();
				?>
			</div>

			<div class="a-split mi-gap">
				<?php
				self::card_open( __( 'Recent orders', 'mi-trends-core' ), '', '<a class="a-btn a-btn--ghost a-btn--sm" href="' . esc_url( self::orders_url() ) . '">' . esc_html__( 'All orders', 'mi-trends-core' ) . '</a>', true );
				if ( ! $data['recent'] ) {
					self::empty_state( __( 'No orders yet', 'mi-trends-core' ), __( 'Orders from the storefront appear here the moment they are placed.', 'mi-trends-core' ) );
				} else {
					echo '<div class="a-table-wrap"><table class="a-table"><thead><tr><th>' . esc_html__( 'Order', 'mi-trends-core' ) . '</th><th>' . esc_html__( 'Customer', 'mi-trends-core' ) . '</th><th>' . esc_html__( 'Status', 'mi-trends-core' ) . '</th><th class="a-table__num">' . esc_html__( 'Total', 'mi-trends-core' ) . '</th><th>' . esc_html__( 'Placed', 'mi-trends-core' ) . '</th></tr></thead><tbody>';
					foreach ( $data['recent'] as $order ) {
						printf(
							'<tr><td><a href="%1$s"><strong>%2$s</strong></a></td><td>%3$s</td><td>%4$s</td><td class="a-table__num">%5$s</td><td class="a-muted">%6$s</td></tr>',
							esc_url( $order['edit'] ),
							esc_html( $order['number'] ),
							esc_html( $order['customer'] ),
							MI_Core_Admin::status_badge( $order['status'] ), // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in status_badge().
							esc_html( mi_core_money( $order['total'] ) ),
							esc_html( $order['placed'] ? human_time_diff( $order['placed'] ) . ' ' . __( 'ago', 'mi-trends-core' ) : '' )
						);
					}
					echo '</tbody></table></div>';
				}
				self::card_close();

				self::card_open( __( 'Low stock', 'mi-trends-core' ), sprintf( /* translators: %d: threshold */ __( 'At or below %d units', 'mi-trends-core' ), MI_Core_Inventory::low_threshold() ), '<a class="a-btn a-btn--ghost a-btn--sm" href="' . esc_url( admin_url( 'admin.php?page=mi-trends-inventory&filter=low' ) ) . '">' . esc_html__( 'Inventory', 'mi-trends-core' ) . '</a>', true );
				if ( ! $data['low'] ) {
					self::empty_state( __( 'Stock looks healthy', 'mi-trends-core' ), __( 'Nothing is running low right now.', 'mi-trends-core' ) );
				} else {
					echo '<ul class="a-list">';
					foreach ( $data['low'] as $row ) {
						printf(
							'<li><span style="flex:1"><strong>%1$s</strong><br><span class="a-muted a-micro">%2$s</span></span><span class="a-badge %3$s">%4$s</span></li>',
							esc_html( $row['name'] ),
							esc_html( $row['sku'] ),
							0 === (int) $row['units'] ? 'a-badge--danger' : 'a-badge--warning',
							/* translators: %d: units */
							esc_html( 0 === (int) $row['units'] ? __( 'Sold out', 'mi-trends-core' ) : sprintf( __( '%d left', 'mi-trends-core' ), $row['units'] ) )
						);
					}
					echo '</ul>';
				}
				self::card_close();
				?>
			</div>

			<div class="a-grid a-grid--2 mi-gap">
				<?php
				/* translators: %d: days */
				self::card_open( __( 'Best sellers', 'mi-trends-core' ), sprintf( __( 'Units sold in the last %d days', 'mi-trends-core' ), $days ), '', true );
				if ( ! $data['best'] ) {
					self::empty_state( __( 'No sales in range', 'mi-trends-core' ), __( 'Pick a longer window to see best sellers.', 'mi-trends-core' ) );
				} else {
					$rows = array();
					foreach ( $data['best'] as $row ) {
						$rows[ $row['name'] ] = $row['units'];
					}
					echo MI_Core_Admin_Charts::bars( $rows ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped while built.
				}
				self::card_close();

				self::card_open( __( 'Payment mix', 'mi-trends-core' ), __( 'How customers are paying', 'mi-trends-core' ), '', true );
				if ( ! $data['payment'] ) {
					self::empty_state( __( 'No payments in range', 'mi-trends-core' ), __( 'UPI and cash-on-delivery orders are counted here.', 'mi-trends-core' ) );
				} else {
					echo MI_Core_Admin_Charts::bars( $data['payment'] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped while built.
				}
				self::card_close();
				?>
			</div>
		</div></div>
		<?php
	}

	/* ===================================================================== */
	/* Inventory                                                             */
	/* ===================================================================== */

	/**
	 * MI TRENDS → Inventory (app/admin/(panel)/inventory/page.tsx).
	 */
	public static function inventory() {
		self::guard();
		// phpcs:disable WordPress.Security.NonceVerification.Recommended -- view filters / result flags.
		$filter = isset( $_GET['filter'] ) ? sanitize_key( $_GET['filter'] ) : 'all';
		$saved  = isset( $_GET['saved'] ) ? absint( $_GET['saved'] ) : null;
		// phpcs:enable
		$filter    = in_array( $filter, array( 'all', 'low', 'out' ), true ) ? $filter : 'all';
		$rows      = MI_Core_Inventory::rows( $filter );
		$all       = 'all' === $filter ? $rows : MI_Core_Inventory::rows();
		$threshold = MI_Core_Inventory::low_threshold();
		$units     = 0;
		$value     = 0.0;
		$low       = 0;
		$out       = 0;
		foreach ( $all as $row ) {
			$units += $row['total'];
			$value += $row['value'];
			$low   += 'low' === $row['state'] ? 1 : 0;
			$out   += 'out' === $row['state'] ? 1 : 0;
		}
		$sizes = array();
		foreach ( $rows as $row ) {
			foreach ( array_keys( $row['cells'] ) as $size ) {
				if ( ! in_array( $size, $sizes, true ) ) {
					$sizes[] = $size;
				}
			}
		}
		?>
		<div class="wrap mi-admin-wrap"><div class="admin-root mi-admin">
			<?php
			MI_Core_Admin::page_head(
				__( 'Catalogue', 'mi-trends-core' ),
				__( 'Inventory', 'mi-trends-core' ),
				/* translators: %d: threshold */
				sprintf( __( 'Adjust units per size without leaving the list. Anything at or below %d units is flagged as low. Changes are staged until you save.', 'mi-trends-core' ), $threshold )
			);
			if ( null !== $saved ) {
				/* translators: %d: count */
				echo '<div class="notice notice-success"><p>' . esc_html( sprintf( _n( 'Saved %d stock change. The storefront shows it immediately.', 'Saved %d stock changes. The storefront shows them immediately.', $saved, 'mi-trends-core' ), $saved ) ) . '</p></div>';
			}
			?>
			<div class="a-kpi-grid" data-count="4">
				<?php
				self::kpi( __( 'Units on hand', 'mi-trends-core' ), number_format_i18n( $units ), 'package' );
				self::kpi( __( 'Stock value', 'mi-trends-core' ), mi_core_money( $value ), 'indian-rupee', null, __( 'At cost price', 'mi-trends-core' ) );
				self::kpi( __( 'Low stock', 'mi-trends-core' ), number_format_i18n( $low ), 'triangle-alert', null, '', '#8a6100' );
				self::kpi( __( 'Sold out', 'mi-trends-core' ), number_format_i18n( $out ), 'x', null, '', 'var(--red)' );
				?>
			</div>

			<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" data-mi-inventory>
				<input type="hidden" name="action" value="mi_core_inventory">
				<input type="hidden" name="filter" value="<?php echo esc_attr( $filter ); ?>">
				<?php wp_nonce_field( 'mi_core_inventory', 'mi_inventory_nonce' ); ?>
				<section class="a-card">
					<header class="a-card__head">
						<nav class="a-tabs" aria-label="<?php esc_attr_e( 'Stock filter', 'mi-trends-core' ); ?>">
							<?php foreach ( array( 'all' => __( 'All', 'mi-trends-core' ), 'low' => __( 'Low stock', 'mi-trends-core' ), 'out' => __( 'Sold out', 'mi-trends-core' ) ) as $key => $label ) : ?>
								<a class="a-tab<?php echo $key === $filter ? ' is-active' : ''; ?>" href="<?php echo esc_url( admin_url( 'admin.php?page=mi-trends-inventory&filter=' . $key ) ); ?>"><?php echo esc_html( $label ); ?></a>
							<?php endforeach; ?>
						</nav>
						<div class="a-actions">
							<input class="a-input" name="note" placeholder="<?php esc_attr_e( 'Note for the stock log (optional)', 'mi-trends-core' ); ?>" style="min-width:240px">
							<button type="submit" class="a-btn" data-mi-save disabled><?php echo self::icon( 'check', 15 ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> <span data-mi-save-label><?php esc_html_e( 'Save changes', 'mi-trends-core' ); ?></span></button>
						</div>
					</header>
					<div class="a-card__body a-card__body--flush">
						<?php if ( ! $rows ) : ?>
							<?php self::empty_state( __( 'Nothing here', 'mi-trends-core' ), __( 'Import the catalogue from MI TRENDS → Settings, or add variable products with a Size attribute.', 'mi-trends-core' ) ); ?>
						<?php else : ?>
							<div class="a-table-wrap">
								<table class="a-table mi-stock-table">
									<thead><tr>
										<th><?php esc_html_e( 'Product', 'mi-trends-core' ); ?></th>
										<?php foreach ( $sizes as $size ) : ?><th class="a-table__num"><?php echo esc_html( $size ); ?></th><?php endforeach; ?>
										<th class="a-table__num"><?php esc_html_e( 'Total', 'mi-trends-core' ); ?></th>
										<th><?php esc_html_e( 'Status', 'mi-trends-core' ); ?></th>
									</tr></thead>
									<tbody>
										<?php foreach ( $rows as $row ) : $v = $row['view']; ?>
											<tr>
												<td>
													<div class="a-cell-product">
														<?php if ( $v['image_url'] ) : ?><img class="a-thumb" src="<?php echo esc_url( $v['image_url'] ); ?>" alt="" width="40" height="52" loading="lazy"><?php endif; ?>
														<div class="a-cell-product__copy">
															<a class="a-cell-product__name" href="<?php echo esc_url( get_edit_post_link( $v['id'] ) ); ?>"><?php echo esc_html( $v['name'] ); ?></a>
															<span class="a-cell-product__meta"><?php echo esc_html( $v['sku'] . ' · ' . $v['collection'] ); ?></span>
														</div>
													</div>
												</td>
												<?php foreach ( $sizes as $size ) : ?>
													<td class="a-table__num">
														<?php if ( isset( $row['cells'][ $size ] ) && $row['cells'][ $size ]['variation_id'] ) : $cell = $row['cells'][ $size ]; ?>
															<input class="a-stock-input" type="number" min="0" step="1" inputmode="numeric"
																name="stock[<?php echo (int) $cell['variation_id']; ?>]"
																value="<?php echo esc_attr( null === $cell['units'] ? '' : (string) $cell['units'] ); ?>"
																data-original="<?php echo esc_attr( null === $cell['units'] ? '' : (string) $cell['units'] ); ?>"
																aria-label="<?php echo esc_attr( $v['name'] . ' ' . $size ); ?>">
														<?php else : ?>
															<span class="a-muted">—</span>
														<?php endif; ?>
													</td>
												<?php endforeach; ?>
												<td class="a-table__num"><strong><?php echo esc_html( number_format_i18n( $row['total'] ) ); ?></strong></td>
												<td>
													<?php
													$badge = array(
														'ok'  => array( 'success', __( 'In stock', 'mi-trends-core' ) ),
														'low' => array( 'warning', __( 'Low', 'mi-trends-core' ) ),
														'out' => array( 'danger', __( 'Sold out', 'mi-trends-core' ) ),
													);
													printf( '<span class="a-badge a-badge--dot a-badge--%s">%s</span>', esc_attr( $badge[ $row['state'] ][0] ), esc_html( $badge[ $row['state'] ][1] ) );
													?>
												</td>
											</tr>
										<?php endforeach; ?>
									</tbody>
								</table>
							</div>
						<?php endif; ?>
					</div>
				</section>
			</form>

			<?php
			$moves = MI_Core_Inventory::movements( 30 );
			$reasons = array(
				'order'      => __( 'Order', 'mi-trends-core' ),
				'restock'    => __( 'Restock (cancel/refund)', 'mi-trends-core' ),
				'return'     => __( 'Return', 'mi-trends-core' ),
				'adjustment' => __( 'Adjustment', 'mi-trends-core' ),
				'edit'       => __( 'Product editor', 'mi-trends-core' ),
				'import'     => __( 'Import', 'mi-trends-core' ),
			);
			echo '<div class="mi-gap">';
			self::card_open( __( 'Stock movement', 'mi-trends-core' ), __( 'The latest 30 changes, with why they happened.', 'mi-trends-core' ), '<a class="a-btn a-btn--ghost a-btn--sm" href="' . esc_url( wp_nonce_url( admin_url( 'admin-post.php?action=mi_core_export&type=movements' ), 'mi_core_export' ) ) . '">' . esc_html__( 'Export CSV', 'mi-trends-core' ) . '</a>', true );
			if ( ! $moves ) {
				self::empty_state( __( 'No movements yet', 'mi-trends-core' ), __( 'Orders, returns and adjustments are logged here.', 'mi-trends-core' ) );
			} else {
				echo '<div class="a-table-wrap"><table class="a-table"><thead><tr><th>' . esc_html__( 'When', 'mi-trends-core' ) . '</th><th>' . esc_html__( 'SKU / size', 'mi-trends-core' ) . '</th><th class="a-table__num">' . esc_html__( 'Change', 'mi-trends-core' ) . '</th><th class="a-table__num">' . esc_html__( 'After', 'mi-trends-core' ) . '</th><th>' . esc_html__( 'Reason', 'mi-trends-core' ) . '</th><th>' . esc_html__( 'Note', 'mi-trends-core' ) . '</th></tr></thead><tbody>';
				foreach ( $moves as $move ) {
					$order_link = $move->order_id ? ' <a href="' . esc_url( admin_url( 'post.php?post=' . (int) $move->order_id . '&action=edit' ) ) . '">#' . (int) $move->order_id . '</a>' : '';
					$order      = $move->order_id ? wc_get_order( (int) $move->order_id ) : null;
					if ( $order ) {
						$order_link = ' <a href="' . esc_url( $order->get_edit_order_url() ) . '">' . esc_html( $order->get_order_number() ) . '</a>';
					}
					printf(
						'<tr><td class="a-muted">%1$s</td><td>%2$s</td><td class="a-table__num"><span class="a-trend a-trend--%3$s">%4$s</span></td><td class="a-table__num">%5$s</td><td>%6$s</td><td class="a-muted">%7$s</td></tr>',
						esc_html( get_date_from_gmt( $move->created_at, 'j M, H:i' ) ),
						esc_html( trim( $move->sku . ' ' . $move->size ) ),
						(int) $move->delta >= 0 ? 'up' : 'down',
						esc_html( ( (int) $move->delta > 0 ? '+' : '' ) . (int) $move->delta ),
						esc_html( null === $move->stock_after ? '—' : (string) $move->stock_after ),
						esc_html( isset( $reasons[ $move->reason ] ) ? $reasons[ $move->reason ] : $move->reason ) . $order_link, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- link escaped above.
						esc_html( (string) $move->note )
					);
				}
				echo '</tbody></table></div>';
			}
			self::card_close();
			echo '</div>';
			?>
		</div></div>
		<?php
	}

	/**
	 * Save staged inventory edits.
	 */
	public static function save_inventory() {
		self::guard();
		check_admin_referer( 'mi_core_inventory', 'mi_inventory_nonce' );
		$note    = isset( $_POST['note'] ) ? sanitize_text_field( wp_unslash( $_POST['note'] ) ) : '';
		$filter  = isset( $_POST['filter'] ) ? sanitize_key( wp_unslash( $_POST['filter'] ) ) : 'all';
		$changes = 0;
		$stock   = isset( $_POST['stock'] ) && is_array( $_POST['stock'] ) ? wp_unslash( $_POST['stock'] ) : array(); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- each key/value cast below.
		foreach ( $stock as $variation_id => $units ) {
			$variation_id = absint( $variation_id );
			if ( '' === $units || ! $variation_id ) {
				continue;
			}
			$variation = wc_get_product( $variation_id );
			if ( ! $variation || ! $variation->is_type( 'variation' ) ) {
				continue;
			}
			$current = $variation->managing_stock() ? (int) $variation->get_stock_quantity() : null;
			$units   = max( 0, (int) $units );
			if ( $current === $units ) {
				continue;
			}
			MI_Core_Inventory::set_stock( $variation_id, $units, $note );
			$changes++;
		}
		MI_Core_Catalog::flush_cache();
		MI_Core_Reports::flush();
		wp_safe_redirect( admin_url( 'admin.php?page=mi-trends-inventory&filter=' . $filter . '&saved=' . $changes ) );
		exit;
	}

	/* ===================================================================== */
	/* Reports                                                               */
	/* ===================================================================== */

	/**
	 * MI TRENDS → Reports (app/admin/(panel)/reports/page.tsx).
	 */
	public static function reports() {
		self::guard();
		$days   = self::range();
		$data   = MI_Core_Reports::reports( $days );
		$money  = 'mi_core_money';
		$export = sprintf( '<a class="a-btn a-btn--outline" href="%s">%s</a>', esc_url( wp_nonce_url( admin_url( 'admin-post.php?action=mi_core_export&type=revenue&range=' . $days ), 'mi_core_export' ) ), esc_html__( 'Export CSV', 'mi-trends-core' ) );
		?>
		<div class="wrap mi-admin-wrap"><div class="admin-root mi-admin">
			<?php MI_Core_Admin::page_head( __( 'Insights', 'mi-trends-core' ), __( 'Reports', 'mi-trends-core' ), __( 'Where the money comes from — by day, drop, category and state.', 'mi-trends-core' ), self::range_tabs( 'mi-trends-reports', $days ) . $export ); ?>

			<div class="a-kpi-grid" data-count="4">
				<?php
				self::kpi( __( 'Gross revenue', 'mi-trends-core' ), mi_core_money( $data['revenue'] ), 'indian-rupee', null, '', 'var(--red)' );
				self::kpi( __( 'Orders', 'mi-trends-core' ), number_format_i18n( $data['orders'] ), 'shopping-bag' );
				self::kpi( __( 'Units sold', 'mi-trends-core' ), number_format_i18n( $data['units'] ), 'package' );
				self::kpi( __( 'Average order', 'mi-trends-core' ), mi_core_money( $data['avg_order'] ), 'wallet-cards' );
				?>
			</div>

			<?php
			/* translators: %d: days */
			self::card_open( __( 'Revenue trend', 'mi-trends-core' ), sprintf( __( 'Daily gross revenue over %d days', 'mi-trends-core' ), $days ) );
			echo MI_Core_Admin_Charts::area( $data['series'], __( 'Revenue trend', 'mi-trends-core' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped while built.
			self::card_close();
			?>

			<div class="a-grid a-grid--3 mi-gap">
				<?php
				$blocks = array(
					array( __( 'Revenue by collection', 'mi-trends-core' ), __( 'Which drops are carrying the season', 'mi-trends-core' ), $data['by_collection'] ),
					array( __( 'Category mix', 'mi-trends-core' ), __( 'Revenue by product type', 'mi-trends-core' ), $data['by_category'] ),
					array( __( 'Top states', 'mi-trends-core' ), __( 'Where orders ship to', 'mi-trends-core' ), $data['by_state'] ),
				);
				foreach ( $blocks as $block ) {
					self::card_open( $block[0], $block[1], '', true );
					if ( ! $block[2] ) {
						self::empty_state( __( 'No sales in range', 'mi-trends-core' ), __( 'Once orders come in, this fills up.', 'mi-trends-core' ) );
					} else {
						echo MI_Core_Admin_Charts::bars( $block[2], $money ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped while built.
					}
					self::card_close();
				}
				?>
			</div>

			<p class="a-muted mi-gap"><?php esc_html_e( 'For deeper analysis (refunds, taxes, coupons, cohorts) use WooCommerce → Analytics, which reads the same orders.', 'mi-trends-core' ); ?></p>
		</div></div>
		<?php
	}

	/* ===================================================================== */
	/* Customers                                                             */
	/* ===================================================================== */

	/**
	 * MI TRENDS → Customers (app/admin/(panel)/customers/page.tsx).
	 */
	public static function customers() {
		self::guard();
		// phpcs:disable WordPress.Security.NonceVerification.Recommended -- view filters.
		$search = isset( $_GET['s'] ) ? sanitize_text_field( wp_unslash( $_GET['s'] ) ) : '';
		$tier   = isset( $_GET['tier'] ) ? sanitize_key( $_GET['tier'] ) : '';
		$paged  = isset( $_GET['paged'] ) ? max( 1, absint( $_GET['paged'] ) ) : 1;
		// phpcs:enable
		$per_page = 25;

		$query = new WP_User_Query(
			array(
				'role__in'       => array( 'customer' ),
				'number'         => 1000,
				'orderby'        => 'registered',
				'order'          => 'DESC',
				'search'         => $search ? '*' . $search . '*' : '',
				'search_columns' => array( 'user_email', 'display_name', 'user_login' ),
			)
		);

		$rows   = array();
		$counts = array( 'vip' => 0, 'regular' => 0, 'new' => 0 );
		foreach ( $query->get_results() as $user ) {
			$customer = new WC_Customer( $user->ID );
			$orders   = (int) $customer->get_order_count();
			$spend    = (float) $customer->get_total_spent();
			$row_tier = MI_Core_Reports::tier( $spend, $orders );
			$counts[ $row_tier ]++;
			if ( $tier && $tier !== $row_tier ) {
				continue;
			}
			$rows[] = array(
				'user'     => $user,
				'customer' => $customer,
				'orders'   => $orders,
				'spend'    => $spend,
				'tier'     => $row_tier,
			);
		}
		$total = count( $rows );
		$rows  = array_slice( $rows, ( $paged - 1 ) * $per_page, $per_page );
		$base  = admin_url( 'admin.php?page=mi-trends-customers' );
		?>
		<div class="wrap mi-admin-wrap"><div class="admin-root mi-admin">
			<?php MI_Core_Admin::page_head( __( 'Selling', 'mi-trends-core' ), __( 'Customers', 'mi-trends-core' ), __( 'Everyone with an account, by tier: VIP above ₹12,000 lifetime spend, regular after three orders, otherwise new.', 'mi-trends-core' ) ); ?>
			<section class="a-card">
				<header class="a-card__head">
					<nav class="a-tabs">
						<?php
						$tabs = array(
							''        => __( 'All', 'mi-trends-core' ) . ' · ' . array_sum( $counts ),
							'vip'     => __( 'VIP', 'mi-trends-core' ) . ' · ' . $counts['vip'],
							'regular' => __( 'Regular', 'mi-trends-core' ) . ' · ' . $counts['regular'],
							'new'     => __( 'New', 'mi-trends-core' ) . ' · ' . $counts['new'],
						);
						foreach ( $tabs as $key => $label ) {
							printf( '<a class="a-tab%s" href="%s">%s</a>', $key === $tier ? ' is-active' : '', esc_url( add_query_arg( array_filter( array( 'tier' => $key, 's' => $search ) ), $base ) ), esc_html( $label ) );
						}
						?>
					</nav>
					<form class="a-actions" method="get" action="<?php echo esc_url( admin_url( 'admin.php' ) ); ?>">
						<input type="hidden" name="page" value="mi-trends-customers">
						<?php if ( $tier ) : ?><input type="hidden" name="tier" value="<?php echo esc_attr( $tier ); ?>"><?php endif; ?>
						<input class="a-input" type="search" name="s" value="<?php echo esc_attr( $search ); ?>" placeholder="<?php esc_attr_e( 'Search name or email', 'mi-trends-core' ); ?>">
						<button class="a-btn a-btn--outline" type="submit"><?php esc_html_e( 'Search', 'mi-trends-core' ); ?></button>
					</form>
				</header>
				<div class="a-card__body a-card__body--flush">
					<?php if ( ! $rows ) : ?>
						<?php self::empty_state( __( 'No customers yet', 'mi-trends-core' ), __( 'Shoppers appear here when they create an account.', 'mi-trends-core' ) ); ?>
					<?php else : ?>
						<div class="a-table-wrap"><table class="a-table">
							<thead><tr><th><?php esc_html_e( 'Customer', 'mi-trends-core' ); ?></th><th><?php esc_html_e( 'Mobile', 'mi-trends-core' ); ?></th><th><?php esc_html_e( 'City', 'mi-trends-core' ); ?></th><th class="a-table__num"><?php esc_html_e( 'Orders', 'mi-trends-core' ); ?></th><th class="a-table__num"><?php esc_html_e( 'Lifetime value', 'mi-trends-core' ); ?></th><th><?php esc_html_e( 'Tier', 'mi-trends-core' ); ?></th><th><?php esc_html_e( 'Joined', 'mi-trends-core' ); ?></th></tr></thead>
							<tbody>
								<?php foreach ( $rows as $row ) : ?>
									<?php
									$c      = $row['customer'];
									$badges = array( 'vip' => array( 'yellow', __( 'VIP', 'mi-trends-core' ) ), 'regular' => array( 'info', __( 'Regular', 'mi-trends-core' ) ), 'new' => array( 'quiet', __( 'New', 'mi-trends-core' ) ) );
									?>
									<tr>
										<td><a href="<?php echo esc_url( get_edit_user_link( $row['user']->ID ) ); ?>"><strong><?php echo esc_html( $row['user']->display_name ); ?></strong></a><br><span class="a-muted"><?php echo esc_html( $row['user']->user_email ); ?></span></td>
										<td><?php echo esc_html( $c->get_billing_phone() ); ?></td>
										<td><?php echo esc_html( trim( $c->get_billing_city() . ( $c->get_billing_state() ? ', ' . $c->get_billing_state() : '' ), ', ' ) ); ?></td>
										<td class="a-table__num"><a href="<?php echo esc_url( add_query_arg( '_customer_user', $row['user']->ID, self::orders_url() ) ); ?>"><?php echo esc_html( number_format_i18n( $row['orders'] ) ); ?></a></td>
										<td class="a-table__num"><?php echo esc_html( mi_core_money( $row['spend'] ) ); ?></td>
										<td><span class="a-badge a-badge--<?php echo esc_attr( $badges[ $row['tier'] ][0] ); ?>"><?php echo esc_html( $badges[ $row['tier'] ][1] ); ?></span></td>
										<td class="a-muted"><?php echo esc_html( wp_date( 'j M Y', strtotime( $row['user']->user_registered ) ) ); ?></td>
									</tr>
								<?php endforeach; ?>
							</tbody>
						</table></div>
					<?php endif; ?>
				</div>
				<?php
				$pages = (int) ceil( $total / $per_page );
				if ( $pages > 1 ) {
					echo '<footer class="a-card__foot"><span class="a-muted">' . esc_html( sprintf( /* translators: 1: page, 2: pages */ __( 'Page %1$d of %2$d', 'mi-trends-core' ), $paged, $pages ) ) . '</span><span class="a-actions">';
					if ( $paged > 1 ) {
						echo '<a class="a-btn a-btn--outline a-btn--sm" href="' . esc_url( add_query_arg( array_filter( array( 'paged' => $paged - 1, 'tier' => $tier, 's' => $search ) ), $base ) ) . '">' . esc_html__( 'Previous', 'mi-trends-core' ) . '</a>';
					}
					if ( $paged < $pages ) {
						echo '<a class="a-btn a-btn--outline a-btn--sm" href="' . esc_url( add_query_arg( array_filter( array( 'paged' => $paged + 1, 'tier' => $tier, 's' => $search ) ), $base ) ) . '">' . esc_html__( 'Next', 'mi-trends-core' ) . '</a>';
					}
					echo '</span></footer>';
				}
				?>
			</section>
		</div></div>
		<?php
	}

	/* ===================================================================== */
	/* Subscribers                                                           */
	/* ===================================================================== */

	/**
	 * MI TRENDS → Subscribers.
	 */
	public static function subscribers() {
		global $wpdb;
		self::guard();
		$table = MI_Core_Schema::subscribers();
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery,WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- custom table name from $wpdb->prefix.
		$rows = $wpdb->get_results( "SELECT email, source, status, created_at FROM {$table} ORDER BY id DESC LIMIT 200" );
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery,WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- custom table name from $wpdb->prefix.
		$total  = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$table}" );
		$export = sprintf( '<a class="a-btn a-btn--outline" href="%s">%s</a>', esc_url( wp_nonce_url( admin_url( 'admin-post.php?action=mi_core_export&type=subscribers' ), 'mi_core_export' ) ), esc_html__( 'Export CSV', 'mi-trends-core' ) );
		?>
		<div class="wrap mi-admin-wrap"><div class="admin-root mi-admin">
			<?php
			MI_Core_Admin::page_head(
				__( 'Marketing', 'mi-trends-core' ),
				__( 'Subscribers', 'mi-trends-core' ),
				/* translators: %d: total */
				sprintf( __( '%d sign-ups from the footer newsletter and the "Get notified" forms. Export them to your email tool.', 'mi-trends-core' ), $total ),
				$export
			);
			self::card_open( __( 'Latest sign-ups', 'mi-trends-core' ), __( 'Newest first (up to 200 shown; the export has everyone).', 'mi-trends-core' ), '', true );
			if ( ! $rows ) {
				self::empty_state( __( 'No subscribers yet', 'mi-trends-core' ), __( 'Sign-ups from the storefront arrive here.', 'mi-trends-core' ) );
			} else {
				echo '<div class="a-table-wrap"><table class="a-table"><thead><tr><th>' . esc_html__( 'Email', 'mi-trends-core' ) . '</th><th>' . esc_html__( 'Source', 'mi-trends-core' ) . '</th><th>' . esc_html__( 'Status', 'mi-trends-core' ) . '</th><th>' . esc_html__( 'Joined', 'mi-trends-core' ) . '</th></tr></thead><tbody>';
				foreach ( $rows as $row ) {
					printf( '<tr><td>%s</td><td><span class="a-badge a-badge--quiet">%s</span></td><td>%s</td><td class="a-muted">%s</td></tr>', esc_html( $row->email ), esc_html( $row->source ), esc_html( $row->status ), esc_html( get_date_from_gmt( $row->created_at, 'j M Y, H:i' ) ) );
				}
				echo '</tbody></table></div>';
			}
			self::card_close();
			?>
		</div></div>
		<?php
	}

	/* ===================================================================== */
	/* Settings                                                              */
	/* ===================================================================== */

	/**
	 * MI TRENDS → Settings (app/admin/(panel)/settings/page.tsx) + setup/import.
	 */
	public static function settings() {
		self::guard();
		$s   = MI_Core_Settings::all();
		$log = get_transient( 'mi_core_last_log' );
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- result flag.
		$updated = isset( $_GET['updated'] );

		$field = static function ( $key, $label, $type = 'text', $help = '', $attrs = '' ) use ( $s ) {
			$value = is_array( $s[ $key ] ) ? implode( "\n", $s[ $key ] ) : (string) $s[ $key ];
			echo '<label class="a-field"><span class="a-label">' . esc_html( $label ) . '</span>';
			if ( 'textarea' === $type ) {
				echo '<textarea class="a-input a-textarea" name="mi[' . esc_attr( $key ) . ']" rows="4">' . esc_textarea( $value ) . '</textarea>';
			} else {
				echo '<input class="a-input" type="' . esc_attr( $type ) . '" name="mi[' . esc_attr( $key ) . ']" value="' . esc_attr( $value ) . '" ' . $attrs . '>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static attribute strings.
			}
			if ( $help ) {
				echo '<small class="a-muted">' . esc_html( $help ) . '</small>';
			}
			echo '</label>';
		};
		$toggle = static function ( $key, $label, $help = '' ) use ( $s ) {
			echo '<label class="a-field mi-toggle"><span class="a-switch"><input type="checkbox" name="mi[' . esc_attr( $key ) . ']" value="1"' . checked( ! empty( $s[ $key ] ), true, false ) . '><span class="a-switch__track"></span></span><span><strong>' . esc_html( $label ) . '</strong>' . ( $help ? '<br><small class="a-muted">' . esc_html( $help ) . '</small>' : '' ) . '</span></label>';
		};
		?>
		<div class="wrap mi-admin-wrap"><div class="admin-root mi-admin">
			<?php MI_Core_Admin::page_head( __( 'Storefront', 'mi-trends-core' ), __( 'Settings', 'mi-trends-core' ), __( 'Store identity, checkout rules, shipping and the one-time store setup.', 'mi-trends-core' ) ); ?>
			<?php if ( $updated ) : ?><div class="notice notice-success"><p><?php esc_html_e( 'Settings saved.', 'mi-trends-core' ); ?></p></div><?php endif; ?>
			<?php if ( is_array( $log ) && $log ) : ?>
				<div class="notice notice-info"><p><strong><?php esc_html_e( 'Last run:', 'mi-trends-core' ); ?></strong></p><ul style="list-style:disc;margin-left:20px"><?php foreach ( $log as $line ) : ?><li><?php echo esc_html( $line ); ?></li><?php endforeach; ?></ul></div>
				<?php delete_transient( 'mi_core_last_log' ); ?>
			<?php endif; ?>

			<div class="a-split mi-gap">
				<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" class="a-stack">
					<input type="hidden" name="action" value="mi_core_settings">
					<?php wp_nonce_field( 'mi_core_settings', 'mi_settings_nonce' ); ?>

					<?php self::card_open( __( 'Store identity', 'mi-trends-core' ), __( 'Shown on the contact page, emails and shipping labels.', 'mi-trends-core' ) ); ?>
					<div class="a-grid a-grid--2">
						<?php
						$field( 'store_name', __( 'Store name', 'mi-trends-core' ) );
						$field( 'tagline', __( 'Tagline', 'mi-trends-core' ) );
						$field( 'support_email', __( 'Support email', 'mi-trends-core' ), 'email' );
						$field( 'support_phone', __( 'Support phone', 'mi-trends-core' ) );
						$field( 'support_hours', __( 'Support hours', 'mi-trends-core' ) );
						?>
					</div>
					<?php
					$field( 'store_description', __( 'Store description', 'mi-trends-core' ), 'textarea' );
					$field( 'registered_address', __( 'Registered address', 'mi-trends-core' ), 'textarea' );
					self::card_close();

					self::card_open( __( 'Cash on delivery', 'mi-trends-core' ), __( 'A share of the total is paid by UPI at checkout; the courier collects the rest.', 'mi-trends-core' ) );
					$toggle( 'cod_enabled', __( 'Offer cash on delivery', 'mi-trends-core' ) );
					echo '<div class="a-grid a-grid--3">';
					$field( 'cod_minimum_order', __( 'Available above (₹)', 'mi-trends-core' ), 'number', __( 'Bag value after coupons, before delivery.', 'mi-trends-core' ), 'min="0" step="1"' );
					$field( 'cod_advance_percent', __( 'UPI advance (%)', 'mi-trends-core' ), 'number', '', 'min="0" max="100" step="1"' );
					$field( 'cod_fee', __( 'COD handling fee (₹)', 'mi-trends-core' ), 'number', '', 'min="0" step="1"' );
					echo '</div>';
					self::card_close();

					self::card_open( __( 'Shipping', 'mi-trends-core' ), __( 'Used by the "MI TRENDS delivery" rate and the free-shipping nudges.', 'mi-trends-core' ) );
					echo '<div class="a-grid a-grid--3">';
					$field( 'free_shipping_threshold', __( 'Free shipping above (₹)', 'mi-trends-core' ), 'number', '', 'min="0" step="1"' );
					$field( 'standard_shipping', __( 'Standard shipping (₹)', 'mi-trends-core' ), 'number', '', 'min="0" step="1"' );
					$field( 'delivery_days', __( 'Delivery estimate (days)', 'mi-trends-core' ), 'number', '', 'min="1" max="30" step="1"' );
					echo '</div>';
					self::card_close();

					self::card_open( __( 'Announcement bar', 'mi-trends-core' ), __( 'One message per line, scrolling across the top of every page.', 'mi-trends-core' ) );
					$field( 'announcements', __( 'Messages', 'mi-trends-core' ), 'textarea' );
					self::card_close();

					self::card_open( __( 'Return address', 'mi-trends-core' ), __( 'Printed on shipping labels.', 'mi-trends-core' ) );
					echo '<div class="a-grid a-grid--2">';
					foreach ( array( 'return_name' => __( 'Name', 'mi-trends-core' ), 'return_line1' => __( 'Address', 'mi-trends-core' ), 'return_city' => __( 'City', 'mi-trends-core' ), 'return_state' => __( 'State', 'mi-trends-core' ), 'return_pincode' => __( 'Pincode', 'mi-trends-core' ), 'return_phone' => __( 'Phone', 'mi-trends-core' ) ) as $key => $label ) {
						$field( $key, $label );
					}
					echo '</div>';
					self::card_close();

					self::card_open( __( 'Operations', 'mi-trends-core' ) );
					$toggle( 'restock_returns', __( 'Add stock back when an order is marked Returned', 'mi-trends-core' ) );
					$toggle( 'refresh_on_load', __( 'Refresh bag and wishlist counts after page load', 'mi-trends-core' ), __( 'Turn on if you use full-page caching, so cached pages still show each shopper’s own counts.', 'mi-trends-core' ) );
					self::card_close();
					?>
					<div><button class="a-btn" type="submit"><?php esc_html_e( 'Save settings', 'mi-trends-core' ); ?></button></div>
				</form>

				<div class="a-stack a-sticky">
					<?php
					self::card_open( __( 'Store setup', 'mi-trends-core' ), __( 'Applies the WooCommerce settings MI TRENDS needs and creates its pages, sizes, collections and shipping zone. Safe to run again.', 'mi-trends-core' ) );
					?>
					<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
						<input type="hidden" name="action" value="mi_core_setup">
						<?php wp_nonce_field( 'mi_core_setup', 'mi_setup_nonce' ); ?>
						<button class="a-btn a-btn--ink a-btn--full" type="submit"><?php esc_html_e( 'Run store setup', 'mi-trends-core' ); ?></button>
					</form>
					<p class="a-muted" style="margin-top:10px;font-size:.74rem"><?php esc_html_e( 'Changes: currency INR (no decimals), selling and shipping to India only, account required at checkout, low-stock threshold 12, verified-buyer reviews, the classic Cart/Checkout pages and the My Account address /account/.', 'mi-trends-core' ); ?></p>
					<?php
					self::card_close();

					self::card_open( __( 'Catalogue', 'mi-trends-core' ), __( 'The ten MI TRENDS products with photos, sizes, prices and stock, plus the MI10 / FLAT200 / FIRST15 coupons. Existing products with the same SKU are updated, not duplicated.', 'mi-trends-core' ) );
					?>
					<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
						<input type="hidden" name="action" value="mi_core_import">
						<?php wp_nonce_field( 'mi_core_import', 'mi_import_nonce' ); ?>
						<label class="mi-toggle" style="margin-bottom:12px"><input type="checkbox" name="with_images" value="1" checked> <?php esc_html_e( 'Load product photos into the Media Library', 'mi-trends-core' ); ?></label>
						<button class="a-btn a-btn--full" type="submit"><?php esc_html_e( 'Import catalogue', 'mi-trends-core' ); ?></button>
					</form>
					<?php
					self::card_close();

					self::card_open( __( 'Payments', 'mi-trends-core' ) );
					$configured = MI_Core_Razorpay_API::configured();
					printf(
						'<p><span class="a-badge a-badge--dot a-badge--%1$s">%2$s</span></p><p class="a-muted" style="font-size:.78rem;margin-top:8px">%3$s</p><p style="margin-top:12px"><a class="a-btn a-btn--outline a-btn--sm" href="%4$s">%5$s</a></p>',
						$configured ? 'success' : 'warning',
						$configured ? esc_html__( 'Razorpay keys found', 'mi-trends-core' ) : esc_html__( 'Razorpay keys missing', 'mi-trends-core' ),
						esc_html__( 'Add MI_RAZORPAY_KEY_ID and MI_RAZORPAY_KEY_SECRET to wp-config.php (recommended) or enter them on the UPI gateway, then enable "UPI" and "Cash on delivery".', 'mi-trends-core' ),
						esc_url( admin_url( 'admin.php?page=wc-settings&tab=checkout' ) ),
						esc_html__( 'Payment settings', 'mi-trends-core' )
					);
					self::card_close();
					?>
				</div>
			</div>
		</div></div>
		<?php
	}

	/**
	 * Save settings.
	 */
	public static function save_settings() {
		self::guard();
		check_admin_referer( 'mi_core_settings', 'mi_settings_nonce' );
		$input = isset( $_POST['mi'] ) && is_array( $_POST['mi'] ) ? wp_unslash( $_POST['mi'] ) : array(); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- sanitised field by field in MI_Core_Settings::sanitize().
		MI_Core_Settings::save( $input );
		MI_Core_Catalog::flush_cache();
		wp_safe_redirect( admin_url( 'admin.php?page=mi-trends-settings&updated=1' ) );
		exit;
	}

	/**
	 * Run setup.
	 */
	public static function run_setup() {
		self::guard();
		check_admin_referer( 'mi_core_setup', 'mi_setup_nonce' );
		$log = MI_Core_Seeder::setup();
		update_option( 'mi_core_setup_done', time(), false );
		set_transient( 'mi_core_last_log', $log, 10 * MINUTE_IN_SECONDS );
		wp_safe_redirect( admin_url( 'admin.php?page=mi-trends-settings' ) );
		exit;
	}

	/**
	 * Run import.
	 */
	public static function run_import() {
		self::guard();
		check_admin_referer( 'mi_core_import', 'mi_import_nonce' );
		$log = MI_Core_Seeder::import( ! empty( $_POST['with_images'] ) );
		set_transient( 'mi_core_last_log', $log, 10 * MINUTE_IN_SECONDS );
		wp_safe_redirect( admin_url( 'admin.php?page=mi-trends-settings' ) );
		exit;
	}

	/**
	 * CSV exports (revenue series, stock movements, subscribers).
	 */
	public static function export_csv() {
		self::guard();
		check_admin_referer( 'mi_core_export' );
		global $wpdb;

		// phpcs:disable WordPress.Security.NonceVerification.Recommended -- verified above.
		$type = isset( $_GET['type'] ) ? sanitize_key( $_GET['type'] ) : '';
		$days = isset( $_GET['range'] ) ? absint( $_GET['range'] ) : 30;
		// phpcs:enable

		$rows = array();
		if ( 'revenue' === $type ) {
			$data   = MI_Core_Reports::reports( $days );
			$rows[] = array( 'Date', 'Orders', 'Revenue (INR)' );
			foreach ( $data['series'] as $point ) {
				$rows[] = array( $point['label'], $point['orders'], round( $point['value'] ) );
			}
		} elseif ( 'movements' === $type ) {
			$rows[] = array( 'When (UTC)', 'Product ID', 'Variation ID', 'SKU', 'Size', 'Change', 'Before', 'After', 'Reason', 'Order ID', 'User ID', 'Note' );
			foreach ( MI_Core_Inventory::movements( 5000 ) as $m ) {
				$rows[] = array( $m->created_at, $m->product_id, $m->variation_id, $m->sku, $m->size, $m->delta, $m->stock_before, $m->stock_after, $m->reason, $m->order_id, $m->user_id, $m->note );
			}
		} elseif ( 'subscribers' === $type ) {
			$table  = MI_Core_Schema::subscribers();
			$rows[] = array( 'Email', 'Source', 'Status', 'Joined (UTC)' );
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery,WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- custom table name from $wpdb->prefix.
			foreach ( $wpdb->get_results( "SELECT email, source, status, created_at FROM {$table} ORDER BY id ASC", ARRAY_N ) as $row ) {
				$rows[] = $row;
			}
		} else {
			wp_die( esc_html__( 'Unknown export.', 'mi-trends-core' ) );
		}

		nocache_headers();
		header( 'Content-Type: text/csv; charset=utf-8' );
		header( 'Content-Disposition: attachment; filename=mi-trends-' . $type . '-' . gmdate( 'Ymd-His' ) . '.csv' );
		$out = fopen( 'php://output', 'w' ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fopen -- streaming the download.
		foreach ( $rows as $row ) {
			// Neutralise spreadsheet formulas (=, +, -, @) in user-supplied text.
			$row = array_map(
				static function ( $cell ) {
					$cell = (string) $cell;
					return ( '' !== $cell && in_array( $cell[0], array( '=', '+', '-', '@' ), true ) && ! is_numeric( $cell ) ) ? "'" . $cell : $cell;
				},
				(array) $row
			);
			fputcsv( $out, $row );
		}
		fclose( $out ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose
		exit;
	}
}
