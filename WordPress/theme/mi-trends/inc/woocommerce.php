<?php
/**
 * WooCommerce presentation glue.
 *
 * Only presentation lives here: wrappers, which default WooCommerce output to
 * drop because the MI TRENDS templates render their own, and the cart fragments
 * that keep the drawer and the header badges current. Cart rules, checkout
 * fields, payment and order logic are in MI Trends Core.
 *
 * @package MI_Trends
 */

defined( 'ABSPATH' ) || exit;

// The theme's templates provide their own page shells and breadcrumbs.
remove_action( 'woocommerce_before_main_content', 'woocommerce_output_content_wrapper', 10 );
remove_action( 'woocommerce_after_main_content', 'woocommerce_output_content_wrapper_end', 10 );
remove_action( 'woocommerce_before_main_content', 'woocommerce_breadcrumb', 20 );
remove_action( 'woocommerce_sidebar', 'woocommerce_get_sidebar', 10 );

// Shop header: the MI TRENDS shop draws its own title, count and sort.
add_filter( 'woocommerce_show_page_title', '__return_false' );
remove_action( 'woocommerce_before_shop_loop', 'woocommerce_result_count', 20 );
remove_action( 'woocommerce_before_shop_loop', 'woocommerce_catalog_ordering', 30 );

// Cart page: cross-sells are replaced by the original "Complete the look".
remove_action( 'woocommerce_cart_collaterals', 'woocommerce_cross_sell_display' );

add_filter( 'loop_shop_per_page', 'mi_trends_products_per_page', 20 );
/**
 * The original shop showed the whole edit on one page; 48 keeps that true for a
 * catalogue of this size while staying fast as it grows.
 *
 * @return int
 */
function mi_trends_products_per_page() {
	return (int) apply_filters( 'mi_trends_products_per_page', 48 );
}

add_filter( 'woocommerce_add_to_cart_fragments', 'mi_trends_cart_fragments' );
/**
 * Refresh the drawer body and every count badge after a cart change.
 *
 * WooCommerce replaces each selector's element with the returned HTML; the
 * MI Trends Core AJAX endpoints return the same fragments.
 *
 * @param array $fragments Fragments.
 * @return array
 */
function mi_trends_cart_fragments( $fragments ) {
	ob_start();
	mi_trends_part( 'components/cart-drawer-content' );
	$fragments['div.mi-cart-drawer-content'] = ob_get_clean();

	$fragments['mi_cart_count'] = mi_trends_cart_count();
	return $fragments;
}

add_filter( 'woocommerce_email_styles', 'mi_trends_email_styles', 20 );
/**
 * Brand WooCommerce's emails without overriding their templates: the storefront's
 * ink, paper and red, and the Arial Black display face for headings. Set the
 * colours to match in WooCommerce → Settings → Emails (see WOOCOMMERCE-SETUP.md).
 *
 * @param string $css Email CSS.
 * @return string
 */
function mi_trends_email_styles( $css ) {
	return $css . '
		#wrapper { background-color: #f3f0ea; }
		#template_header { background-color: #171716; border-radius: 6px 6px 0 0; }
		#template_header h1 { font-family: "Arial Black", Arial, sans-serif; letter-spacing: -0.03em; text-transform: uppercase; color: #ffffff; }
		#template_container { border: 1px solid #d9d4cc; border-radius: 6px; box-shadow: none; }
		#body_content { background-color: #fffdf9; }
		#body_content_inner, #body_content td { color: #131313; font-family: Inter, Arial, sans-serif; }
		h2, h3 { color: #131313; font-family: "Arial Black", Arial, sans-serif; text-transform: uppercase; letter-spacing: -0.02em; }
		a { color: #ef3f2f; }
		.mi-email-cta { display: inline-block; padding: 14px 22px; border-radius: 5px; background: #171717; color: #ffffff !important; font-weight: 800; letter-spacing: .07em; text-transform: uppercase; text-decoration: none; font-size: 12px; }
	';
}

add_action( 'mi_trends_notices', 'mi_trends_print_notices' );
/**
 * Print WooCommerce notices where an MI TRENDS template asks for them. They
 * only appear after full-page form posts (no-JavaScript fallbacks); with
 * JavaScript the same messages arrive as the original toasts.
 */
function mi_trends_print_notices() {
	if ( function_exists( 'wc_print_notices' ) && wc_notice_count() > 0 ) {
		echo '<div class="mi-notices">';
		wc_print_notices();
		echo '</div>';
	}
}
