<?php
/**
 * Emails — registers the "MI TRENDS order update" email with WooCommerce.
 *
 * WooCommerce already sends: new order (admin), order received/processing,
 * completed, refunded, cancelled, customer note, password reset, new account.
 * The fulfilment statuses added by this plugin (confirmed, packed, shipped,
 * delivered, returned) send MI_Core_Email_Status_Update, editable and
 * switchable under WooCommerce → Settings → Emails like any other email.
 * Its template can be overridden in the theme at
 * woocommerce/emails/mi-status-update.php.
 *
 * @package MI_Trends_Core
 */

defined( 'ABSPATH' ) || exit;

/**
 * Email registration.
 */
class MI_Core_Emails {

	/**
	 * Hooks.
	 */
	public static function init() {
		add_filter( 'woocommerce_email_classes', array( __CLASS__, 'register' ) );
		add_filter( 'woocommerce_email_actions', array( __CLASS__, 'actions' ) );
		add_action( 'woocommerce_email_order_meta', array( __CLASS__, 'order_meta' ), 20, 3 );
	}

	/**
	 * Add the email class.
	 *
	 * @param array $emails Emails.
	 * @return array
	 */
	public static function register( $emails ) {
		require_once MI_CORE_DIR . 'includes/emails/class-mi-core-email-status-update.php';
		$emails['MI_Core_Email_Status_Update'] = new MI_Core_Email_Status_Update();
		return $emails;
	}

	/**
	 * Let WooCommerce queue/transactional-send these status hooks.
	 *
	 * @param string[] $actions Actions.
	 * @return string[]
	 */
	public static function actions( $actions ) {
		foreach ( array_keys( MI_Core_Order_Status::statuses() ) as $status ) {
			$actions[] = 'woocommerce_order_status_' . $status;
		}
		return $actions;
	}

	/**
	 * COD split and tracking details in every order email.
	 *
	 * @param WC_Order $order         Order.
	 * @param bool     $sent_to_admin To admin.
	 * @param bool     $plain_text    Plain.
	 */
	public static function order_meta( $order, $sent_to_admin, $plain_text ) {
		$lines   = array();
		$advance = (float) $order->get_meta( '_mi_cod_advance' );
		if ( $advance > 0 ) {
			/* translators: 1: advance, 2: balance */
			$lines[] = sprintf( __( 'Paid now by UPI: %1$s · Due on delivery: %2$s', 'mi-trends-core' ), mi_core_money( $advance ), mi_core_money( $order->get_meta( '_mi_cod_balance' ) ) );
		}
		$awb = (string) $order->get_meta( '_mi_tracking_number' );
		if ( $awb ) {
			$courier = (string) $order->get_meta( '_mi_courier' );
			/* translators: 1: courier, 2: tracking number */
			$lines[] = sprintf( __( 'Shipped with %1$s · Tracking number %2$s', 'mi-trends-core' ), $courier ? $courier : __( 'our courier', 'mi-trends-core' ), $awb );
		}
		if ( ! $lines ) {
			return;
		}
		if ( $plain_text ) {
			echo "\n" . esc_html( implode( "\n", $lines ) ) . "\n";
			return;
		}
		foreach ( $lines as $line ) {
			echo '<p style="margin:0 0 8px;font-weight:600">' . esc_html( $line ) . '</p>';
		}
	}
}
