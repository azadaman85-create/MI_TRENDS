<?php
/**
 * Navigation — menus with the original link lists as defaults.
 *
 * Each menu location renders the WordPress menu assigned to it (Appearance →
 * Menus). Until one is assigned, the theme uses the exact links from
 * Header.tsx, MobileNav.tsx and Footer.tsx. Give a menu item the CSS class
 * "is-sale" (Screen Options → CSS Classes) to get the red Sale styling.
 *
 * @package MI_Trends
 */

defined( 'ABSPATH' ) || exit;

/**
 * Default links per location, from the Next.js components.
 *
 * @return array<string,array<int,array{label:string,url:string,accent?:bool}>>
 */
function mi_trends_default_menus() {
	$shop = 'mi_trends_shop_url';
	$info = 'mi_trends_info_url';

	return array(
		'primary'         => array(
			array( 'label' => __( 'Men', 'mi-trends' ), 'url' => $shop( array( 'category' => 'men' ) ) ),
			array( 'label' => __( 'Women', 'mi-trends' ), 'url' => $shop( array( 'category' => 'women' ) ) ),
			array( 'label' => __( 'Collections', 'mi-trends' ), 'url' => $shop( array( 'category' => 'men,women' ) ) ),
			array( 'label' => __( 'New', 'mi-trends' ), 'url' => $shop( array( 'tag' => 'new' ) ) ),
			array( 'label' => __( 'Sale', 'mi-trends' ), 'url' => $shop( array( 'tag' => 'sale' ) ), 'accent' => true ),
		),
		'mobile-featured' => array(
			array( 'label' => __( 'New arrivals', 'mi-trends' ), 'url' => $shop( array( 'tag' => 'new' ) ) ),
			array( 'label' => __( 'Bestsellers', 'mi-trends' ), 'url' => $shop( array( 'tag' => 'bestseller' ) ) ),
			array( 'label' => __( 'Under ₹799', 'mi-trends' ), 'url' => $shop( array( 'maxPrice' => '799' ) ) ),
			array( 'label' => __( 'Sale', 'mi-trends' ), 'url' => $shop( array( 'tag' => 'sale' ) ), 'accent' => true ),
		),
		'mobile-primary'  => array(
			array( 'label' => __( 'Men', 'mi-trends' ), 'url' => $shop( array( 'category' => 'men' ) ) ),
			array( 'label' => __( 'Women', 'mi-trends' ), 'url' => $shop( array( 'category' => 'women' ) ) ),
			array( 'label' => __( 'Collections', 'mi-trends' ), 'url' => $shop( array( 'category' => 'men,women' ) ) ),
		),
		'footer-shop'     => array(
			array( 'label' => __( 'Men', 'mi-trends' ), 'url' => $shop( array( 'category' => 'men' ) ) ),
			array( 'label' => __( 'Women', 'mi-trends' ), 'url' => $shop( array( 'category' => 'women' ) ) ),
			array( 'label' => __( 'New arrivals', 'mi-trends' ), 'url' => $shop( array( 'tag' => 'new' ) ) ),
			array( 'label' => __( 'Pyjama sets', 'mi-trends' ), 'url' => $shop( array( 'type' => 'pyjama-set' ) ) ),
			array( 'label' => __( 'Sale', 'mi-trends' ), 'url' => $shop( array( 'tag' => 'sale' ) ) ),
		),
		'footer-help'     => array(
			array( 'label' => __( 'Contact us', 'mi-trends' ), 'url' => $info( 'contact' ) ),
			array( 'label' => __( 'FAQs', 'mi-trends' ), 'url' => $info( 'faqs' ) ),
			array( 'label' => __( 'Shipping', 'mi-trends' ), 'url' => $info( 'shipping' ) ),
			array( 'label' => __( 'Returns', 'mi-trends' ), 'url' => $info( 'returns' ) ),
			array( 'label' => __( 'Size guide', 'mi-trends' ), 'url' => $info( 'size-guide' ) ),
			array( 'label' => __( 'Track order', 'mi-trends' ), 'url' => $info( 'track-order' ) ),
		),
		'footer-brand'    => array(
			array( 'label' => __( 'Our story', 'mi-trends' ), 'url' => $info( 'about' ) ),
			array( 'label' => __( 'Stores', 'mi-trends' ), 'url' => $info( 'stores' ) ),
			array( 'label' => __( 'Careers', 'mi-trends' ), 'url' => $info( 'careers' ) ),
			array( 'label' => __( 'Press', 'mi-trends' ), 'url' => $info( 'press' ) ),
			array( 'label' => __( 'Gift cards', 'mi-trends' ), 'url' => $info( 'gift-cards' ) ),
		),
		'footer-legal'    => array(
			array( 'label' => __( 'Terms', 'mi-trends' ), 'url' => $info( 'terms' ) ),
			array( 'label' => __( 'Privacy', 'mi-trends' ), 'url' => $info( 'privacy' ) ),
			array( 'label' => __( 'Accessibility', 'mi-trends' ), 'url' => $info( 'accessibility' ) ),
		),
	);
}

/**
 * Links for a menu location: the assigned WordPress menu's top level, or the defaults.
 *
 * @param string $location Theme location.
 * @return array<int,array{label:string,url:string,accent:bool}>
 */
function mi_trends_menu_links( $location ) {
	$locations = get_nav_menu_locations();
	if ( ! empty( $locations[ $location ] ) ) {
		$items = wp_get_nav_menu_items( $locations[ $location ] );
		if ( $items ) {
			$links = array();
			foreach ( $items as $item ) {
				if ( (int) $item->menu_item_parent ) {
					continue;
				}
				$links[] = array(
					'label'  => $item->title,
					'url'    => $item->url,
					'accent' => in_array( 'is-sale', (array) $item->classes, true ),
				);
			}
			return $links;
		}
	}

	$defaults = mi_trends_default_menus();
	$links    = isset( $defaults[ $location ] ) ? $defaults[ $location ] : array();
	foreach ( $links as &$link ) {
		$link['accent'] = ! empty( $link['accent'] );
	}
	return $links;
}

/**
 * Footer column headings, matching Footer.tsx.
 *
 * @return array<string,string> location => heading
 */
function mi_trends_footer_columns() {
	return array(
		'footer-shop'  => __( 'Shop', 'mi-trends' ),
		'footer-help'  => __( 'Help', 'mi-trends' ),
		'footer-brand' => __( 'MI TRENDS', 'mi-trends' ),
		'footer-legal' => __( 'Legal', 'mi-trends' ),
	);
}
