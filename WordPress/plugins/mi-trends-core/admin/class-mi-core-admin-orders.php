<?php
/**
 * Order screen additions — app/admin/(panel)/orders/[id]/page.tsx:
 *   - "MI TRENDS fulfilment" box: COD advance/balance, courier + tracking number,
 *     a button to print the shipping label
 *   - printable shipping label (components/admin/ShippingLabel.tsx)
 * Status changes, timeline (order notes), items, payment and customer details
 * are WooCommerce's own order screen. Works with HPOS and legacy order storage.
 *
 * @package MI_Trends_Core
 */

defined( 'ABSPATH' ) || exit;

/**
 * Order admin.
 */
class MI_Core_Admin_Orders {

	/**
	 * Hooks.
	 */
	public static function init() {
		add_action( 'add_meta_boxes', array( __CLASS__, 'box' ) );
		add_action( 'woocommerce_process_shop_order_meta', array( __CLASS__, 'save' ), 20 );
	}

	/**
	 * Register the box on the order edit screen.
	 */
	public static function box() {
		$screen = function_exists( 'wc_get_page_screen_id' ) ? wc_get_page_screen_id( 'shop-order' ) : 'shop_order';
		add_meta_box( 'mi_fulfilment', __( 'MI TRENDS fulfilment', 'mi-trends-core' ), array( __CLASS__, 'render' ), $screen, 'side', 'high' );
	}

	/**
	 * Box content.
	 *
	 * @param WP_Post|WC_Order $object Post (legacy) or order (HPOS).
	 */
	public static function render( $object ) {
		$order = $object instanceof WC_Order ? $object : wc_get_order( $object->ID );
		if ( ! $order ) {
			return;
		}
		wp_nonce_field( 'mi_fulfilment', 'mi_fulfilment_nonce' );

		$advance = (float) $order->get_meta( '_mi_cod_advance' );
		if ( $advance > 0 ) {
			$collected = 'yes' === $order->get_meta( '_mi_cod_balance_collected' );
			printf(
				'<p><strong>%1$s</strong><br>%2$s: %3$s %4$s<br>%5$s: %6$s %7$s</p>',
				esc_html__( 'Cash on delivery', 'mi-trends-core' ),
				esc_html__( 'Advance (UPI)', 'mi-trends-core' ),
				esc_html( mi_core_money( $advance ) ),
				$order->get_meta( '_mi_cod_advance_paid' ) ? '✓' : '<em>' . esc_html__( '(not paid yet)', 'mi-trends-core' ) . '</em>',
				esc_html__( 'Collect on delivery', 'mi-trends-core' ),
				esc_html( mi_core_money( $order->get_meta( '_mi_cod_balance' ) ) ),
				$collected ? '✓ ' . esc_html__( 'collected', 'mi-trends-core' ) : ''
			);
		}

		$type = $order->get_meta( '_billing_address_type' );
		if ( $type ) {
			echo '<p>' . esc_html__( 'Address saved as:', 'mi-trends-core' ) . ' <strong>' . esc_html( ucfirst( $type ) ) . '</strong></p>';
		}

		$fields = array(
			'_mi_courier'         => __( 'Courier', 'mi-trends-core' ),
			'_mi_tracking_number' => __( 'Tracking number (AWB)', 'mi-trends-core' ),
			'_mi_tracking_url'    => __( 'Tracking link', 'mi-trends-core' ),
		);
		foreach ( $fields as $key => $label ) {
			printf(
				'<p><label for="%1$s">%2$s</label><input type="%3$s" class="widefat" id="%1$s" name="%1$s" value="%4$s"></p>',
				esc_attr( $key ),
				esc_html( $label ),
				'_mi_tracking_url' === $key ? 'url' : 'text',
				esc_attr( (string) $order->get_meta( $key ) )
			);
		}

		$label_url = wp_nonce_url( admin_url( 'admin.php?page=mi-trends-label&order_id=' . $order->get_id() ), 'mi_label_' . $order->get_id() );
		printf( '<p><a class="button" target="_blank" rel="noopener" href="%s">%s</a></p>', esc_url( $label_url ), esc_html__( 'Print shipping label', 'mi-trends-core' ) );
		echo '<p class="description">' . esc_html__( 'Move the order through Confirmed → Packed → Shipped → Delivered with the status field; each step emails the customer.', 'mi-trends-core' ) . '</p>';
	}

	/**
	 * Save courier/tracking.
	 *
	 * @param int $order_id Order.
	 */
	public static function save( $order_id ) {
		if ( ! isset( $_POST['mi_fulfilment_nonce'] ) || ! wp_verify_nonce( sanitize_key( wp_unslash( $_POST['mi_fulfilment_nonce'] ) ), 'mi_fulfilment' ) ) {
			return;
		}
		if ( ! current_user_can( 'edit_shop_orders' ) ) {
			return;
		}
		$order = wc_get_order( $order_id );
		if ( ! $order ) {
			return;
		}
		if ( isset( $_POST['_mi_courier'] ) ) {
			$order->update_meta_data( '_mi_courier', sanitize_text_field( wp_unslash( $_POST['_mi_courier'] ) ) );
		}
		if ( isset( $_POST['_mi_tracking_number'] ) ) {
			$order->update_meta_data( '_mi_tracking_number', sanitize_text_field( wp_unslash( $_POST['_mi_tracking_number'] ) ) );
		}
		if ( isset( $_POST['_mi_tracking_url'] ) ) {
			$order->update_meta_data( '_mi_tracking_url', esc_url_raw( wp_unslash( $_POST['_mi_tracking_url'] ) ) );
		}
		$order->save();
	}

	/**
	 * Internal dispatch reference — dispatchReference() in ShippingLabel.tsx.
	 * Derived from the order number, so it never changes. Not a courier AWB.
	 *
	 * @param string $order_number Order number.
	 * @return string
	 */
	public static function dispatch_reference( $order_number ) {
		$digits = preg_replace( '/\D/', '', (string) $order_number );
		$digits = '' === $digits ? '0' : $digits;
		$sum    = 0;
		foreach ( str_split( $digits ) as $index => $digit ) {
			$sum += (int) $digit * ( $index % 2 ? 3 : 1 );
		}
		return 'MIT-' . $digits . '-' . str_pad( (string) ( $sum % 97 ), 2, '0', STR_PAD_LEFT );
	}

	/**
	 * Printable shipping label page.
	 */
	public static function label_page() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- nonce checked just below with the order ID.
		$order_id = isset( $_GET['order_id'] ) ? absint( $_GET['order_id'] ) : 0;
		check_admin_referer( 'mi_label_' . $order_id );
		if ( ! current_user_can( 'edit_shop_orders' ) ) {
			wp_die( esc_html__( 'You do not have permission to print labels.', 'mi-trends-core' ), 403 );
		}
		$order = wc_get_order( $order_id );
		if ( ! $order ) {
			wp_die( esc_html__( 'Order not found.', 'mi-trends-core' ), 404 );
		}

		$s        = MI_Core_Settings::all();
		$units    = $order->get_item_count();
		$advance  = (float) $order->get_meta( '_mi_cod_advance' );
		$is_cod   = 'mi_cod_advance' === $order->get_payment_method() && 'yes' !== $order->get_meta( '_mi_cod_balance_collected' );
		$collect  = max( 0, (float) $order->get_total() - $advance );
		$states   = WC()->countries->get_states( 'IN' );
		$state    = isset( $states[ $order->get_billing_state() ] ) ? $states[ $order->get_billing_state() ] : $order->get_billing_state();
		$placed   = $order->get_date_created() ? $order->get_date_created()->date_i18n( 'd M Y' ) : '';
		$dispatch = self::dispatch_reference( $order->get_order_number() );
		?>
		<div class="wrap mi-label-wrap"><div class="admin-root mi-admin">
			<p class="mi-no-print"><button type="button" class="button button-primary" onclick="window.print()"><?php esc_html_e( 'Print label', 'mi-trends-core' ); ?></button> <a class="button" href="<?php echo esc_url( $order->get_edit_order_url() ); ?>"><?php esc_html_e( 'Back to order', 'mi-trends-core' ); ?></a></p>
			<div class="ship-label" id="shipping-label">
				<header class="ship-label__head">
					<span class="ship-label__mark" aria-hidden="true">MI</span>
					<div><strong><?php echo esc_html( $s['store_name'] ); ?></strong><span><?php esc_html_e( 'Shipping label', 'mi-trends-core' ); ?></span></div>
					<div class="ship-label__order"><span><?php esc_html_e( 'Order', 'mi-trends-core' ); ?></span><strong><?php echo esc_html( $order->get_order_number() ); ?></strong></div>
				</header>
				<section class="ship-label__block">
					<span class="ship-label__caption"><?php esc_html_e( 'Deliver to', 'mi-trends-core' ); ?></span>
					<p class="ship-label__to">
						<strong><?php echo esc_html( $order->get_formatted_billing_full_name() ); ?></strong>
						<?php echo esc_html( $order->get_billing_address_1() ); ?><br>
						<?php echo esc_html( $order->get_billing_address_2() ); ?><br>
						<?php echo esc_html( $order->get_billing_city() . ', ' . $state ); ?><br>
						<strong class="ship-label__pin"><?php echo esc_html( $order->get_billing_postcode() ); ?></strong><br>
						<?php echo esc_html( $order->get_billing_phone() ); ?>
					</p>
				</section>
				<section class="ship-label__payment<?php echo $is_cod ? ' is-cod' : ''; ?>">
					<?php if ( $is_cod ) : ?>
						<span><?php echo $advance > 0 ? esc_html__( 'Collect balance (advance paid)', 'mi-trends-core' ) : esc_html__( 'Cash on delivery — collect', 'mi-trends-core' ); ?></span>
						<strong><?php echo esc_html( mi_core_money( $collect ) ); ?></strong>
					<?php else : ?>
						<span><?php esc_html_e( 'Prepaid — do not collect cash', 'mi-trends-core' ); ?></span>
						<strong><?php echo esc_html( mi_core_money( $order->get_total() ) . ' ' . __( 'paid', 'mi-trends-core' ) ); ?></strong>
					<?php endif; ?>
				</section>
				<section class="ship-label__grid">
					<div><span class="ship-label__caption"><?php esc_html_e( 'Dispatch ref', 'mi-trends-core' ); ?></span><p class="ship-label__ref"><?php echo esc_html( $dispatch ); ?></p></div>
					<div><span class="ship-label__caption"><?php esc_html_e( 'Order date', 'mi-trends-core' ); ?></span><p><?php echo esc_html( $placed ); ?></p></div>
					<div><span class="ship-label__caption"><?php esc_html_e( 'Items', 'mi-trends-core' ); ?></span><p><?php echo esc_html( sprintf( /* translators: %d: units */ _n( '%d unit', '%d units', $units, 'mi-trends-core' ), $units ) ); ?></p></div>
				</section>
				<section class="ship-label__block">
					<span class="ship-label__caption"><?php esc_html_e( 'Contents', 'mi-trends-core' ); ?></span>
					<table class="ship-label__items"><tbody>
						<?php foreach ( $order->get_items() as $item ) : ?>
							<?php
							if ( ! $item instanceof WC_Order_Item_Product ) {
								continue;
							}
							$product = $item->get_product();
							$size    = $product && $product->is_type( 'variation' ) ? $product->get_attribute( 'pa_size' ) : '';
							$color   = (string) $item->get_meta( __( 'Colour', 'mi-trends-core' ) );
							?>
							<tr>
								<td><?php echo esc_html( $product ? $product->get_sku() : '' ); ?></td>
								<td><?php echo esc_html( $product && $product->get_parent_id() ? get_the_title( $product->get_parent_id() ) : $item->get_name() ); ?><span><?php echo esc_html( trim( $size . ( $color ? ' · ' . $color : '' ), ' ·' ) ); ?></span></td>
								<td>×<?php echo (int) $item->get_quantity(); ?></td>
							</tr>
						<?php endforeach; ?>
					</tbody></table>
				</section>
				<footer class="ship-label__foot">
					<span class="ship-label__caption"><?php esc_html_e( 'Return to', 'mi-trends-core' ); ?></span>
					<p><?php echo esc_html( $s['return_name'] . ', ' . $s['return_line1'] . ', ' . $s['return_city'] . ', ' . $s['return_state'] . ' ' . $s['return_pincode'] . ' · ' . $s['return_phone'] ); ?></p>
					<?php if ( $order->get_meta( '_mi_tracking_number' ) ) : ?>
						<p class="ship-label__note"><?php echo esc_html( sprintf( /* translators: 1: courier, 2: AWB */ __( '%1$s AWB %2$s', 'mi-trends-core' ), (string) $order->get_meta( '_mi_courier' ), (string) $order->get_meta( '_mi_tracking_number' ) ) ); ?></p>
					<?php else : ?>
						<p class="ship-label__note"><?php esc_html_e( 'No courier barcode on this label — the AWB and its barcode are issued by the courier when the shipment is booked.', 'mi-trends-core' ); ?></p>
					<?php endif; ?>
				</footer>
			</div>
		</div></div>
		<?php
	}
}
