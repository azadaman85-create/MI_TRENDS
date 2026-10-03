<?php
/**
 * Public functions the MI TRENDS theme (or any theme) calls.
 *
 * These are the plugin's stable API. Each delegates to a class so the logic
 * stays testable and in one place.
 *
 * @package MI_Trends_Core
 */

defined( 'ABSPATH' ) || exit;

/**
 * Rupees the storefront way (Intl en-IN, no decimals): ₹1,299, ₹1,29,999.
 *
 * @param float|int $amount Amount.
 * @return string
 */
function mi_core_money( $amount ) {
	$amount   = (int) round( (float) $amount );
	$negative = $amount < 0;
	$digits   = (string) abs( $amount );
	if ( strlen( $digits ) > 3 ) {
		$last3  = substr( $digits, -3 );
		$rest   = substr( $digits, 0, -3 );
		$rest   = preg_replace( '/\B(?=(\d{2})+(?!\d))/', ',', $rest );
		$digits = $rest . ',' . $last3;
	}
	return ( $negative ? '-' : '' ) . '₹' . $digits;
}

/**
 * A store setting.
 *
 * @param string $key Key.
 * @return mixed
 */
function mi_core_setting( $key ) {
	return MI_Core_Settings::get( $key );
}

/**
 * Normalised product view (see MI_Core_Product_Data::view()).
 *
 * @param WC_Product|int $product Product or ID.
 * @return array|null
 */
function mi_core_product_view( $product ) {
	return MI_Core_Product_Data::view( $product );
}

/**
 * Wishlist product IDs for the current visitor.
 *
 * @return int[]
 */
function mi_core_wishlist_ids() {
	return MI_Core_Wishlist::ids();
}

/**
 * Product ID lists for the homepage: trending, new, deals, shirts.
 *
 * @return array<string,int[]>
 */
function mi_core_home_products() {
	return MI_Core_Catalog::home_products();
}

/**
 * "You may also like" for a product.
 *
 * @param int $product_id Product.
 * @param int $limit      Count.
 * @return int[]
 */
function mi_core_related_ids( $product_id, $limit = 4 ) {
	return MI_Core_Catalog::related_ids( $product_id, $limit );
}

/**
 * "Complete the look" for the bag page.
 *
 * @param int[] $exclude Products already in the bag.
 * @param int   $limit   Count.
 * @return int[]
 */
function mi_core_suggestion_ids( $exclude, $limit = 4 ) {
	return MI_Core_Catalog::suggestion_ids( $exclude, $limit );
}

/**
 * Most popular products.
 *
 * @param int $limit Count.
 * @return int[]
 */
function mi_core_popular_product_ids( $limit = 6 ) {
	return MI_Core_Catalog::popular_ids( $limit );
}

/**
 * Shop page state: title, filters, sort, fields (see MI_Core_Shop_Query::state()).
 *
 * @return array
 */
function mi_core_shop_state() {
	return MI_Core_Shop_Query::state();
}

/**
 * Cash-on-delivery plan for the current cart (see MI_Core_COD::plan_for_cart()).
 *
 * @return array{available:bool,reason:?string,advance:float,balance:float,total:float}
 */
function mi_core_cod_plan_for_cart() {
	return MI_Core_COD::plan_for_cart();
}
