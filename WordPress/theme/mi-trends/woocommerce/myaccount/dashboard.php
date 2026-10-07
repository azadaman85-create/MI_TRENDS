<?php
/**
 * Account home — app/(store)/account/page.tsx.
 *
 * Greeting, avatar + sign out, the four original cards (Wishlist, Track an
 * order, Returns & refunds, Your bag) followed by WooCommerce's real account
 * screens (Orders, Addresses, Account details), and the account details list.
 *
 * @package MI_Trends
 * @version 4.4.0 (WooCommerce template version this override was written against)
 */

defined( 'ABSPATH' ) || exit;

$mi_user     = wp_get_current_user();
$mi_customer = new WC_Customer( $mi_user->ID );
$mi_name     = $mi_user->display_name ? $mi_user->display_name : $mi_user->user_login;
$mi_first    = strtok( $mi_name, ' ' );
$mi_phone    = $mi_customer->get_billing_phone();
$mi_wish     = count( mi_trends_wishlist_ids() );
$mi_bag      = mi_trends_cart_count();
$mi_provider = (string) get_user_meta( $mi_user->ID, '_mi_auth_provider', true );
$mi_joined   = wp_date( 'j F Y', strtotime( $mi_user->user_registered ) );

$mi_cards = array(
	array( mi_trends_wishlist_url(), 'heart', __( 'Wishlist', 'mi-trends' ) . ( $mi_wish ? ' · ' . $mi_wish : '' ), __( 'Everything you’ve saved for the next drop.', 'mi-trends' ) ),
	array( mi_trends_info_url( 'track-order' ), 'package', __( 'Track an order', 'mi-trends' ), __( 'Follow a parcel from packing to your door.', 'mi-trends' ) ),
	array( mi_trends_info_url( 'returns' ), 'shield-check', __( 'Returns & refunds', 'mi-trends' ), __( '30-day returns on everything, no questions.', 'mi-trends' ) ),
	array( wc_get_cart_url(), 'shopping-bag', __( 'Your bag', 'mi-trends' ) . ( $mi_bag ? ' · ' . $mi_bag : '' ), __( 'Pick up where you left off.', 'mi-trends' ) ),
	array( wc_get_account_endpoint_url( 'orders' ), 'package-search', __( 'Orders', 'mi-trends' ), __( 'Every order, invoice and status in one place.', 'mi-trends' ) ),
	array( wc_get_account_endpoint_url( 'edit-address' ), 'map-pin', __( 'Addresses', 'mi-trends' ), __( 'The delivery address checkout fills in for you.', 'mi-trends' ) ),
	array( wc_get_account_endpoint_url( 'edit-account' ), 'user-round', __( 'Account details', 'mi-trends' ), __( 'Name, email and password.', 'mi-trends' ) ),
);
?>
<header class="acct-home__head">
	<div>
		<p class="eyebrow"><?php esc_html_e( 'Your account', 'mi-trends' ); ?></p>
		<h1><?php echo esc_html( sprintf( /* translators: %s: first name */ __( 'Hey, %s', 'mi-trends' ), $mi_first ) ); ?></h1>
	</div>

	<div class="acct-home__identity">
		<span class="acct-avatar" aria-hidden="true"><?php echo esc_html( mi_trends_initials( $mi_name, $mi_user->user_email ) ); ?></span>
		<a class="acct-signout" href="<?php echo esc_url( wc_logout_url() ); ?>">
			<?php mi_trends_icon( 'log-out', array( 'size' => 15 ) ); ?>
			<?php esc_html_e( 'Sign out', 'mi-trends' ); ?>
		</a>
	</div>
</header>

<?php do_action( 'mi_trends_notices' ); ?>

<div class="acct-home__grid">
	<?php foreach ( $mi_cards as $mi_card ) : ?>
		<a class="acct-card" href="<?php echo esc_url( $mi_card[0] ); ?>">
			<span class="acct-card__icon"><?php mi_trends_icon( $mi_card[1], array( 'size' => 18 ) ); ?></span>
			<strong><?php echo esc_html( $mi_card[2] ); ?></strong>
			<span><?php echo esc_html( $mi_card[3] ); ?></span>
		</a>
	<?php endforeach; ?>
</div>

<section class="acct-home__detail">
	<h2 style="margin:0;font-size:0.72rem;font-weight:800;letter-spacing:0.1em;text-transform:uppercase"><?php esc_html_e( 'Account details', 'mi-trends' ); ?></h2>
	<dl>
		<div><dt><?php esc_html_e( 'Name', 'mi-trends' ); ?></dt><dd><?php echo esc_html( $mi_name ); ?></dd></div>
		<div><dt><?php esc_html_e( 'Email', 'mi-trends' ); ?></dt><dd><?php echo esc_html( $mi_user->user_email ); ?></dd></div>
		<?php if ( $mi_phone ) : ?>
			<div><dt><?php esc_html_e( 'Mobile', 'mi-trends' ); ?></dt><dd><?php echo esc_html( $mi_phone ); ?></dd></div>
		<?php endif; ?>
		<div><dt><?php esc_html_e( 'Signed in with', 'mi-trends' ); ?></dt><dd><?php echo 'google' === $mi_provider ? esc_html__( 'Google', 'mi-trends' ) : esc_html__( 'Email and password', 'mi-trends' ); ?></dd></div>
		<div><dt><?php esc_html_e( 'Member since', 'mi-trends' ); ?></dt><dd><?php echo esc_html( $mi_joined ); ?></dd></div>
	</dl>
</section>

<?php
do_action( 'woocommerce_account_dashboard' );
