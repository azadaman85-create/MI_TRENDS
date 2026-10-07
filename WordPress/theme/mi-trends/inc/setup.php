<?php
/**
 * Theme supports, menus and image sizes.
 *
 * @package MI_Trends
 */

defined( 'ABSPATH' ) || exit;

add_action( 'after_setup_theme', 'mi_trends_setup' );
/**
 * Register everything WordPress needs to know about the theme.
 */
function mi_trends_setup() {
	load_theme_textdomain( 'mi-trends', MI_THEME_DIR . '/languages' );

	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'html5', array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script', 'navigation-widgets' ) );
	add_theme_support( 'custom-logo', array( 'height' => 64, 'width' => 64, 'flex-width' => true ) );

	/*
	 * WooCommerce. The product gallery features are left off on purpose: the
	 * MI TRENDS product page has its own four-view gallery (front, back, fabric
	 * detail, styled) and does not use WooCommerce's zoom/lightbox/slider.
	 */
	add_theme_support(
		'woocommerce',
		array(
			'thumbnail_image_width' => 480,
			'single_image_width'    => 960,
			'product_grid'          => array(
				'default_rows'    => 6,
				'min_rows'        => 1,
				'default_columns' => 4,
				'min_columns'     => 2,
				'max_columns'     => 4,
			),
		)
	);

	register_nav_menus(
		array(
			'primary'        => __( 'Primary navigation (desktop header)', 'mi-trends' ),
			'mobile-featured'=> __( 'Mobile drawer — featured links', 'mi-trends' ),
			'mobile-primary' => __( 'Mobile drawer — primary links', 'mi-trends' ),
			'footer-shop'    => __( 'Footer — Shop', 'mi-trends' ),
			'footer-help'    => __( 'Footer — Help', 'mi-trends' ),
			'footer-brand'   => __( 'Footer — MI TRENDS', 'mi-trends' ),
			'footer-legal'   => __( 'Footer — Legal', 'mi-trends' ),
		)
	);

	// 3:4 portrait, the ratio every MI TRENDS product visual is drawn at (480×640).
	add_image_size( 'mi-product', 480, 640, true );
	add_image_size( 'mi-product-large', 960, 1280, true );
}

add_filter( 'body_class', 'mi_trends_body_classes' );
/**
 * Body classes the stylesheet and scripts key off.
 *
 * @param string[] $classes Existing classes.
 * @return string[]
 */
function mi_trends_body_classes( $classes ) {
	$classes[] = 'mi-trends';
	if ( mi_trends_hide_tab_bar() ) {
		$classes[] = 'mi-no-tab-bar';
	}
	return $classes;
}

/**
 * The mobile tab bar steps aside on checkout, the order confirmation and product
 * pages (which have their own sticky buy bar) — same rule as MobileTabBar.tsx.
 *
 * @return bool
 */
function mi_trends_hide_tab_bar() {
	if ( ! function_exists( 'is_checkout' ) ) {
		return false;
	}
	return is_checkout() || is_product() || is_wc_endpoint_url( 'order-received' );
}

add_filter( 'document_title_separator', 'mi_trends_title_separator' );
/**
 * "Page | MI TRENDS", the original's title template ("%s | MI TRENDS").
 *
 * @return string
 */
function mi_trends_title_separator() {
	return '|';
}
