<?php
/**
 * My Account wrapper.
 *
 * The original account page (app/(store)/account/page.tsx) is a single screen
 * of cards with no sidebar. The dashboard keeps that; WooCommerce's other
 * account screens (Orders, an order, Addresses, Account details) open in the
 * same shell with a way back, replacing the default navigation sidebar.
 *
 * @package MI_Trends
 * @version 3.5.0 (WooCommerce template version this override was written against)
 */

defined( 'ABSPATH' ) || exit;

global $wp;

$mi_endpoint = WC()->query->get_current_endpoint();
?>
<div class="acct-home woocommerce-MyAccount">
	<?php if ( $mi_endpoint ) : ?>
		<header class="acct-home__head">
			<div>
				<p class="eyebrow"><a href="<?php echo esc_url( wc_get_page_permalink( 'myaccount' ) ); ?>">← <?php esc_html_e( 'Your account', 'mi-trends' ); ?></a></p>
				<h1><?php echo esc_html( WC()->query->get_endpoint_title( $mi_endpoint ) ); ?></h1>
			</div>
		</header>
		<?php do_action( 'mi_trends_notices' ); ?>
	<?php endif; ?>

	<div class="woocommerce-MyAccount-content mi-account-content">
		<?php do_action( 'woocommerce_account_content' ); ?>
	</div>
</div>
