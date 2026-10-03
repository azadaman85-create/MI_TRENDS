<?php
/**
 * Template Name: Info — Account help
 *
 * AccountBody in app/(store)/info/[slug]/page.tsx (/info/account).
 *
 * @package MI_Trends
 */

defined( 'ABSPATH' ) || exit;

get_header();

while ( have_posts() ) :
	the_post();
	?>
	<div class="info-page">
		<?php mi_trends_part( 'components/info-header', array( 'post' => get_post() ) ); ?>
		<div class="account-body">
			<div class="account-icon"><?php mi_trends_icon( 'user-round', array( 'size' => 26 ) ); ?></div>
			<p class="account-copy"><?php esc_html_e( 'You need a MI TRENDS account to place an order. It keeps your bag, wishlist, delivery details and order history in one place.', 'mi-trends' ); ?></p>
			<div class="account-links">
				<a href="<?php echo esc_url( mi_trends_account_url( 'login' ) ); ?>"><?php mi_trends_icon( 'user-round', array( 'size' => 17 ) ); ?><span><?php esc_html_e( 'Sign in to your account', 'mi-trends' ); ?></span><?php mi_trends_icon( 'arrow-right', array( 'size' => 15 ) ); ?></a>
				<a href="<?php echo esc_url( mi_trends_account_url( 'signup' ) ); ?>"><?php mi_trends_icon( 'sparkles', array( 'size' => 17 ) ); ?><span><?php esc_html_e( 'Create an account', 'mi-trends' ); ?></span><?php mi_trends_icon( 'arrow-right', array( 'size' => 15 ) ); ?></a>
				<a href="<?php echo esc_url( mi_trends_info_url( 'track-order' ) ); ?>"><?php mi_trends_icon( 'package', array( 'size' => 17 ) ); ?><span><?php esc_html_e( 'Track an order', 'mi-trends' ); ?></span><?php mi_trends_icon( 'arrow-right', array( 'size' => 15 ) ); ?></a>
				<a href="<?php echo esc_url( mi_trends_shop_url() ); ?>"><?php mi_trends_icon( 'shield-check', array( 'size' => 17 ) ); ?><span><?php esc_html_e( 'Continue shopping', 'mi-trends' ); ?></span><?php mi_trends_icon( 'arrow-right', array( 'size' => 15 ) ); ?></a>
			</div>
		</div>
	</div>
	<?php
endwhile;

get_footer();
