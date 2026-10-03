<?php
/**
 * MI TRENDS order update email (HTML).
 *
 * Override in a theme at: woocommerce/emails/mi-status-update.php
 *
 * @package MI_Trends_Core
 * @var WC_Order $order
 * @var string   $email_heading
 * @var string   $status_message
 * @var string   $additional_content
 * @var bool     $sent_to_admin
 * @var bool     $plain_text
 * @var WC_Email $email
 */

defined( 'ABSPATH' ) || exit;

do_action( 'woocommerce_email_header', $email_heading, $email );
?>

<p>
	<?php
	/* translators: %s: first name */
	printf( esc_html__( 'Hi %s,', 'mi-trends-core' ), esc_html( $order->get_billing_first_name() ) );
	?>
</p>
<p><?php echo esc_html( $status_message ); ?></p>

<?php
$mi_track = function_exists( 'mi_trends_info_url' ) ? mi_trends_info_url( 'track-order' ) : home_url( '/info/track-order/' );
?>
<p><a class="mi-email-cta" href="<?php echo esc_url( add_query_arg( 'order', rawurlencode( $order->get_order_number() ), $mi_track ) ); ?>"><?php esc_html_e( 'Track this order', 'mi-trends-core' ); ?></a></p>

<?php
do_action( 'woocommerce_email_order_details', $order, $sent_to_admin, $plain_text, $email );
do_action( 'woocommerce_email_order_meta', $order, $sent_to_admin, $plain_text, $email );
do_action( 'woocommerce_email_customer_details', $order, $sent_to_admin, $plain_text, $email );

if ( $additional_content ) {
	echo wp_kses_post( wpautop( wptexturize( $additional_content ) ) );
}

do_action( 'woocommerce_email_footer', $email );
