<?php
/**
 * Styles and scripts.
 *
 * @package MI_Trends
 */

defined( 'ABSPATH' ) || exit;

/**
 * Cache-busting version for a theme file: its modification time, or the theme version.
 *
 * @param string $relative Path relative to the theme root.
 * @return string
 */
function mi_trends_asset_version( $relative ) {
	$file = MI_THEME_DIR . '/' . ltrim( $relative, '/' );
	return file_exists( $file ) ? (string) filemtime( $file ) : MI_THEME_VERSION;
}

add_action( 'wp_enqueue_scripts', 'mi_trends_enqueue_assets', 20 );
/**
 * Enqueue the storefront.
 */
function mi_trends_enqueue_assets() {
	$css = array(
		'mi-trends-fonts'    => 'assets/css/fonts.css',
		// app/globals.css, unchanged — the whole design system.
		'mi-trends-globals'  => 'assets/css/storefront-globals.css',
		// components/account/account.css, unchanged — all selectors are namespaced (.acct*, .header-avatar).
		'mi-trends-account'  => 'assets/css/account.css',
		'mi-trends-pages'    => 'assets/css/pages.css',
		'mi-trends-woo'      => 'assets/css/woocommerce.css',
	);

	$previous = array();
	foreach ( $css as $handle => $path ) {
		wp_enqueue_style( $handle, MI_THEME_URI . '/' . $path, $previous, mi_trends_asset_version( $path ) );
		$previous = array( $handle );
	}

	if ( function_exists( 'is_shop' ) && ( is_shop() || is_product_taxonomy() ) ) {
		// components/ui/filter-token-bar.css, unchanged.
		wp_enqueue_style( 'mi-trends-filter-bar', MI_THEME_URI . '/assets/css/filter-token-bar.css', array( 'mi-trends-globals' ), mi_trends_asset_version( 'assets/css/filter-token-bar.css' ) );
		wp_enqueue_script( 'mi-trends-filter-bar', MI_THEME_URI . '/assets/js/filter-bar.js', array(), mi_trends_asset_version( 'assets/js/filter-bar.js' ), true );
	}

	wp_enqueue_script( 'mi-trends', MI_THEME_URI . '/assets/js/mi-trends.js', array(), mi_trends_asset_version( 'assets/js/mi-trends.js' ), true );

	wp_localize_script(
		'mi-trends',
		'MI_TRENDS',
		apply_filters(
			'mi_trends_script_data',
			array(
			'ajaxUrl'      => admin_url( 'admin-ajax.php' ),
			'restUrl'      => esc_url_raw( rest_url( 'mi-trends/v1/' ) ),
			'nonce'        => wp_create_nonce( 'mi_trends_store' ),
			'restNonce'    => wp_create_nonce( 'wp_rest' ),
			'shopUrl'      => mi_trends_shop_url(),
			'cartUrl'      => function_exists( 'wc_get_cart_url' ) ? wc_get_cart_url() : home_url( '/cart/' ),
			'checkoutUrl'  => function_exists( 'wc_get_checkout_url' ) ? wc_get_checkout_url() : home_url( '/checkout/' ),
			'pluginActive' => function_exists( 'mi_core_product_view' ),
			'freeShipping' => (float) mi_trends_setting( 'free_shipping_threshold' ),
			'i18n'         => array(
				'unavailable'    => __( 'This style is currently unavailable.', 'mi-trends' ),
				'chooseSize'     => __( 'Choose an available size before adding this style.', 'mi-trends' ),
				'copied'         => __( 'Coupon code "%s" copied to clipboard!', 'mi-trends' ),
				'orderCopied'    => __( 'Order ID copied.', 'mi-trends' ),
				'copyFailed'     => __( 'Could not copy. Please copy it manually.', 'mi-trends' ),
				'genericError'   => __( 'Something went wrong. Please try again.', 'mi-trends' ),
				'pincodeInvalid' => __( 'Enter a valid 6-digit Indian pincode.', 'mi-trends' ),
				'deliveryRange'  => __( 'Delivery expected between %1$s and %2$s.', 'mi-trends' ),
				'matchOne'       => __( '%d match', 'mi-trends' ),
				'matchMany'      => __( '%d matches', 'mi-trends' ),
				'popular'        => __( 'Popular right now', 'mi-trends' ),
				'seeAll'         => __( 'See all results', 'mi-trends' ),
				'selectSize'     => __( 'Select size', 'mi-trends' ),
				'sizeLabel'      => __( 'Size: %s', 'mi-trends' ),
				'newsletter'     => __( 'You’re on the list. Fresh drops, no inbox clutter.', 'mi-trends' ),
			),
			)
		)
	);

	if ( function_exists( 'is_checkout' ) && is_checkout() ) {
		wp_enqueue_script( 'mi-trends-checkout', MI_THEME_URI . '/assets/js/checkout.js', array( 'jquery', 'wc-checkout' ), mi_trends_asset_version( 'assets/js/checkout.js' ), true );
	}

	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) && ! ( function_exists( 'is_product' ) && is_product() ) ) {
		wp_enqueue_script( 'comment-reply' );
	}
}

/*
 * WooCommerce's own stylesheets are replaced by the MI TRENDS ones; loading both
 * would fight over buttons, forms and grids.
 */
add_filter( 'woocommerce_enqueue_styles', '__return_empty_array' );

add_action( 'wp_head', 'mi_trends_head_meta', 1 );
/**
 * Theme colour (viewport.themeColor in app/layout.tsx) and preload for the body face.
 */
function mi_trends_head_meta() {
	echo '<meta name="theme-color" content="#171716">' . "\n";
	printf(
		'<link rel="preload" href="%s" as="font" type="font/woff2" crossorigin>' . "\n",
		esc_url( MI_THEME_URI . '/assets/fonts/inter-latin-400-normal.woff2' )
	);
}

add_action( 'wp_head', 'mi_trends_site_icon_fallback', 99 );
/**
 * Use app/icon.svg as the favicon until a Site Icon is set in the Customizer.
 */
function mi_trends_site_icon_fallback() {
	if ( has_site_icon() ) {
		return;
	}
	printf( '<link rel="icon" href="%s" type="image/svg+xml">' . "\n", esc_url( MI_THEME_URI . '/assets/icons/brand-icon.svg' ) );
}
