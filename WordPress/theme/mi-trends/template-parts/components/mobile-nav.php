<?php
/**
 * Mobile navigation drawer — MobileNav.tsx. Mounted from a <template> on open.
 *
 * @package MI_Trends
 */

defined( 'ABSPATH' ) || exit;

$mi_signed_in = is_user_logged_in();
$mi_wishlist  = count( mi_trends_wishlist_ids() );
?>
<template data-mi-template="mobile-nav">
	<div class="drawer-layer mobile-nav-layer" role="presentation" data-mi-layer>
		<aside class="drawer mobile-nav-drawer" role="dialog" aria-modal="true" aria-labelledby="mobile-nav-title">
			<header class="drawer-header mobile-nav-header">
				<?php mi_trends_brand_lockup( array( 'name_id' => 'mobile-nav-title' ) ); ?>
				<button class="icon-button drawer-close" type="button" data-mi-close aria-label="<?php esc_attr_e( 'Close navigation menu', 'mi-trends' ); ?>">
					<?php mi_trends_icon( 'x', array( 'size' => 22 ) ); ?>
				</button>
			</header>

			<nav class="mobile-navigation" aria-label="<?php esc_attr_e( 'Mobile navigation', 'mi-trends' ); ?>">
				<ul class="mobile-featured-links">
					<?php foreach ( mi_trends_menu_links( 'mobile-featured' ) as $mi_link ) : ?>
						<li>
							<a<?php echo $mi_link['accent'] ? ' class="is-sale"' : ''; ?> href="<?php echo esc_url( $mi_link['url'] ); ?>">
								<?php echo esc_html( $mi_link['label'] ); ?>
								<?php mi_trends_icon( 'chevron-right', array( 'size' => 18 ) ); ?>
							</a>
						</li>
					<?php endforeach; ?>
				</ul>

				<ul class="mobile-primary-links">
					<?php foreach ( mi_trends_menu_links( 'mobile-primary' ) as $mi_link ) : ?>
						<li>
							<a href="<?php echo esc_url( $mi_link['url'] ); ?>">
								<?php echo esc_html( $mi_link['label'] ); ?>
								<?php mi_trends_icon( 'chevron-right', array( 'size' => 18 ) ); ?>
							</a>
						</li>
					<?php endforeach; ?>
				</ul>

				<ul class="mobile-utility-links">
					<li>
						<a href="<?php echo esc_url( $mi_signed_in ? mi_trends_account_url() : mi_trends_account_url( 'login' ) ); ?>">
							<?php mi_trends_icon( 'user-round', array( 'size' => 18 ) ); ?>
							<?php echo $mi_signed_in ? esc_html__( 'My account', 'mi-trends' ) : esc_html__( 'Sign in or sign up', 'mi-trends' ); ?>
							<?php mi_trends_icon( 'chevron-right', array( 'size' => 17 ) ); ?>
						</a>
					</li>
					<li>
						<a href="<?php echo esc_url( mi_trends_wishlist_url() ); ?>">
							<?php mi_trends_icon( 'heart', array( 'size' => 18 ) ); ?>
							<?php esc_html_e( 'Wishlist', 'mi-trends' ); ?>
							<span class="utility-count" data-mi-count="wishlist"<?php echo $mi_wishlist ? '' : ' hidden'; ?>><?php echo (int) $mi_wishlist; ?></span>
							<?php mi_trends_icon( 'chevron-right', array( 'size' => 17 ) ); ?>
						</a>
					</li>
					<li>
						<a href="<?php echo esc_url( mi_trends_info_url( 'track-order' ) ); ?>">
							<?php mi_trends_icon( 'package-search', array( 'size' => 18 ) ); ?>
							<?php esc_html_e( 'Track an order', 'mi-trends' ); ?>
							<?php mi_trends_icon( 'chevron-right', array( 'size' => 17 ) ); ?>
						</a>
					</li>
					<li>
						<a href="<?php echo esc_url( mi_trends_info_url( 'stores' ) ); ?>">
							<?php mi_trends_icon( 'map-pin', array( 'size' => 18 ) ); ?>
							<?php esc_html_e( 'Find a store', 'mi-trends' ); ?>
							<?php mi_trends_icon( 'chevron-right', array( 'size' => 17 ) ); ?>
						</a>
					</li>
				</ul>
			</nav>

			<footer class="mobile-nav-footer">
				<p><?php esc_html_e( 'Designed in India. Made for every version of you.', 'mi-trends' ); ?></p>
				<a href="<?php echo esc_url( mi_trends_info_url( 'contact' ) ); ?>"><?php esc_html_e( 'Need help? Talk to us', 'mi-trends' ); ?></a>
			</footer>
		</aside>
	</div>
</template>
