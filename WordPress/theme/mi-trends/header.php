<?php
/**
 * Site header — Header.tsx: announcement marquee, brand lockup, search trigger,
 * account / wishlist / bag buttons, mobile search bar and desktop navigation.
 *
 * @package MI_Trends
 */

defined( 'ABSPATH' ) || exit;

$mi_user          = wp_get_current_user();
$mi_signed_in     = $mi_user && $mi_user->exists();
$mi_wishlist      = count( mi_trends_wishlist_ids() );
$mi_cart_count    = mi_trends_cart_count();
$mi_announcements = (array) mi_trends_setting( 'announcements' );
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover">
	<meta name="referrer" content="strict-origin-when-cross-origin">
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<a class="sr-only" href="#main-content"><?php esc_html_e( 'Skip to content', 'mi-trends' ); ?></a>

<?php if ( $mi_announcements ) : ?>
<aside class="announcement-bar" aria-label="<?php esc_attr_e( 'Store announcements', 'mi-trends' ); ?>">
	<div class="announcement-track">
		<?php foreach ( $mi_announcements as $mi_item ) : ?>
			<span class="announcement-item"><?php echo esc_html( $mi_item ); ?></span>
		<?php endforeach; ?>
		<span class="announcement-repeat" aria-hidden="true">
			<?php foreach ( $mi_announcements as $mi_item ) : ?>
				<span class="announcement-item"><?php echo esc_html( $mi_item ); ?></span>
			<?php endforeach; ?>
		</span>
	</div>
</aside>
<?php endif; ?>

<header class="site-header">
	<div class="header-main shell">
		<button class="icon-button mobile-menu-trigger" type="button" aria-label="<?php esc_attr_e( 'Open navigation menu', 'mi-trends' ); ?>" data-mi-open="mobile-nav">
			<?php mi_trends_icon( 'menu', array( 'size' => 22 ) ); ?>
		</button>

		<?php mi_trends_brand_lockup(); ?>

		<div class="header-actions">
			<button class="header-search-trigger" type="button" aria-label="<?php esc_attr_e( 'Search MI TRENDS', 'mi-trends' ); ?>" data-mi-open="search">
				<?php mi_trends_icon( 'search', array( 'size' => 19 ) ); ?>
				<span class="header-search-label"><?php esc_html_e( 'Search styles', 'mi-trends' ); ?></span>
				<kbd class="search-shortcut" aria-hidden="true">/</kbd>
			</button>

			<?php if ( $mi_signed_in ) : ?>
				<a class="icon-button header-account-link hidden md:inline-grid" href="<?php echo esc_url( mi_trends_account_url() ); ?>"
					aria-label="<?php /* translators: %s: customer name */ echo esc_attr( sprintf( __( 'Your account, signed in as %s', 'mi-trends' ), $mi_user->display_name ) ); ?>"
					title="<?php echo esc_attr( $mi_user->display_name ); ?>">
					<span class="header-avatar" aria-hidden="true"><?php echo esc_html( mi_trends_initials( $mi_user->display_name, $mi_user->user_email ) ); ?></span>
				</a>
			<?php else : ?>
				<a class="icon-button header-account-link hidden md:inline-grid" href="<?php echo esc_url( mi_trends_account_url( 'login' ) ); ?>"
					aria-label="<?php esc_attr_e( 'Sign in or create an account', 'mi-trends' ); ?>" title="<?php esc_attr_e( 'Sign in', 'mi-trends' ); ?>">
					<?php mi_trends_icon( 'user-round', array( 'size' => 21 ) ); ?>
				</a>
			<?php endif; ?>

			<a class="icon-button count-button" href="<?php echo esc_url( mi_trends_wishlist_url() ); ?>" data-mi-wishlist-link
				aria-label="<?php echo esc_attr( sprintf( /* translators: %d: count */ _n( 'Wishlist, %d item', 'Wishlist, %d items', $mi_wishlist, 'mi-trends' ), $mi_wishlist ) ); ?>">
				<?php mi_trends_icon( 'heart', array( 'size' => 21 ) ); ?>
				<span class="count-badge" aria-hidden="true" data-mi-count="wishlist"<?php echo $mi_wishlist ? '' : ' hidden'; ?>><?php echo (int) $mi_wishlist; ?></span>
			</a>

			<button class="icon-button count-button" type="button" data-mi-open="cart" data-mi-cart-button
				aria-label="<?php echo esc_attr( sprintf( /* translators: %d: count */ _n( 'Shopping bag, %d item', 'Shopping bag, %d items', $mi_cart_count, 'mi-trends' ), $mi_cart_count ) ); ?>">
				<?php mi_trends_icon( 'shopping-bag', array( 'size' => 21 ) ); ?>
				<span class="count-badge" aria-hidden="true" data-mi-count="cart"<?php echo $mi_cart_count ? '' : ' hidden'; ?>><?php echo (int) $mi_cart_count; ?></span>
			</button>
		</div>
	</div>

	<div class="mobile-search-bar">
		<button type="button" class="mobile-search-bar__btn" data-mi-open="search" aria-label="<?php esc_attr_e( 'Search clothing, oversized tees, sneakers', 'mi-trends' ); ?>">
			<?php mi_trends_icon( 'search', array( 'size' => 16 ) ); ?>
			<span class="mobile-search-bar__text"><?php esc_html_e( 'Search for oversized tees, hoodies, sneakers...', 'mi-trends' ); ?></span>
		</button>
	</div>

	<div class="desktop-navigation">
		<nav class="primary-nav shell" aria-label="<?php esc_attr_e( 'Primary navigation', 'mi-trends' ); ?>">
			<?php foreach ( mi_trends_menu_links( 'primary' ) as $mi_link ) : ?>
				<div class="primary-nav-item">
					<a class="primary-nav-link<?php echo $mi_link['accent'] ? ' is-sale' : ''; ?>" href="<?php echo esc_url( $mi_link['url'] ); ?>"><?php echo esc_html( $mi_link['label'] ); ?></a>
				</div>
			<?php endforeach; ?>
		</nav>
	</div>
</header>

<main id="main-content">
