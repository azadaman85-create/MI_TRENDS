<?php
/**
 * Small presentation helpers.
 *
 * Every helper that needs business data asks the MI Trends Core plugin first
 * (functions prefixed mi_core_) and falls back to plain WooCommerce data, so the
 * theme still renders if the plugin is deactivated.
 *
 * @package MI_Trends
 */

defined( 'ABSPATH' ) || exit;

/**
 * Format rupees the way the storefront does: Intl en-IN, no decimals — ₹1,299, ₹1,29,999.
 *
 * @param float|int $amount Amount in rupees.
 * @return string
 */
function mi_trends_money( $amount ) {
	if ( function_exists( 'mi_core_money' ) ) {
		return mi_core_money( $amount );
	}
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
 * Compact counts for review numbers — 1.2K, like Intl compact notation.
 *
 * @param int $value Count.
 * @return string
 */
function mi_trends_compact_number( $value ) {
	$value = (int) $value;
	if ( $value < 1000 ) {
		return (string) $value;
	}
	if ( $value < 100000 ) {
		return rtrim( rtrim( number_format( $value / 1000, 1 ), '0' ), '.' ) . 'K';
	}
	return rtrim( rtrim( number_format( $value / 100000, 1 ), '0' ), '.' ) . 'L';
}

/**
 * The normalised view of a product every template renders from.
 *
 * Shape (identical to the Product type in lib/types.ts, snake_cased):
 * id, slug, name, url, collection, collection_slug, collection_url, type, category,
 * colors[{name,hex}], sizes[], out_of_stock[], stock{size:int|null}, variations{size:id},
 * mrp, price, discount, rating, review_count, tags[], popularity, fit, fabric, sku,
 * art, palette[3], image_url, back_image_url, sold_out, is_variable.
 *
 * @param WC_Product|int $product Product or ID.
 * @return array|null
 */
function mi_trends_product_view( $product ) {
	if ( function_exists( 'mi_core_product_view' ) ) {
		return mi_core_product_view( $product );
	}

	$product = is_numeric( $product ) ? wc_get_product( $product ) : $product;
	if ( ! $product instanceof WC_Product ) {
		return null;
	}

	// Plugin is off: build what WooCommerce alone can tell us.
	$regular = (float) $product->get_regular_price();
	$price   = (float) $product->get_price();
	if ( $product->is_type( 'variable' ) ) {
		$regular = (float) $product->get_variation_regular_price( 'min' );
		$price   = (float) $product->get_variation_price( 'min' );
	}
	$mrp       = $regular > 0 ? $regular : $price;
	$discount  = ( $mrp > 0 && $price < $mrp ) ? (int) round( ( $mrp - $price ) / $mrp * 100 ) : 0;
	$image_id  = $product->get_image_id();
	$gallery   = $product->get_gallery_image_ids();
	$cats      = wp_get_post_terms( $product->get_id(), 'product_cat', array( 'fields' => 'slugs' ) );
	$tags      = wp_get_post_terms( $product->get_id(), 'product_tag', array( 'fields' => 'slugs' ) );
	$category  = 'unisex';
	foreach ( array( 'men', 'women', 'unisex' ) as $candidate ) {
		if ( is_array( $cats ) && in_array( $candidate, $cats, true ) ) {
			$category = $candidate;
			break;
		}
	}

	return array(
		'id'              => $product->get_id(),
		'slug'            => $product->get_slug(),
		'name'            => $product->get_name(),
		'url'             => get_permalink( $product->get_id() ),
		'collection'      => '',
		'collection_slug' => '',
		'collection_url'  => wc_get_page_permalink( 'shop' ),
		'type'            => '',
		'category'        => $category,
		'colors'          => array( array( 'name' => __( 'As shown', 'mi-trends' ), 'hex' => '#171717' ) ),
		'sizes'           => array(),
		'out_of_stock'    => array(),
		'stock'           => array(),
		'variations'      => array(),
		'mrp'             => $mrp,
		'price'           => $price,
		'discount'        => $discount,
		'rating'          => (float) $product->get_average_rating(),
		'review_count'    => (int) $product->get_review_count(),
		'tags'            => is_array( $tags ) ? array_values( array_intersect( array( 'new', 'bestseller', 'sale' ), $tags ) ) : array(),
		'popularity'      => (int) $product->get_total_sales(),
		'fit'             => '',
		'fabric'          => '',
		'sku'             => $product->get_sku(),
		'art'             => '',
		'palette'         => array( '#131313', '#ef3f2f', '#f3f0ea' ),
		'image_url'       => $image_id ? wp_get_attachment_image_url( $image_id, 'mi-product-large' ) : '',
		'back_image_url'  => ! empty( $gallery ) ? wp_get_attachment_image_url( $gallery[0], 'mi-product-large' ) : '',
		'sold_out'        => ! $product->is_in_stock(),
		'is_variable'     => $product->is_type( 'variable' ),
	);
}

/**
 * Current wishlist product IDs (logged-in: user meta, guest: cookie). Plugin-owned.
 *
 * @return int[]
 */
function mi_trends_wishlist_ids() {
	return function_exists( 'mi_core_wishlist_ids' ) ? mi_core_wishlist_ids() : array();
}

/**
 * Cart item count for header badges.
 *
 * @return int
 */
function mi_trends_cart_count() {
	return ( function_exists( 'WC' ) && WC()->cart ) ? (int) WC()->cart->get_cart_contents_count() : 0;
}

/**
 * Bag lines in the shape CartLine has in lib/types.ts: product view, size, colour, quantity.
 *
 * Size comes from the variation's pa_size attribute; colour from the `mi_color`
 * cart item data the plugin stores when the shopper picks a swatch.
 *
 * @return array<int,array{key:string,view:array,size:string,color:array,quantity:int,unit:float,total:float,mrp_total:float}>
 */
function mi_trends_cart_lines() {
	if ( ! function_exists( 'WC' ) || ! WC()->cart ) {
		return array();
	}

	$lines = array();
	foreach ( WC()->cart->get_cart() as $key => $item ) {
		$product = isset( $item['data'] ) ? $item['data'] : null;
		if ( ! $product instanceof WC_Product ) {
			continue;
		}
		$parent_id = $product->get_parent_id() ? $product->get_parent_id() : $product->get_id();
		$view      = mi_trends_product_view( $parent_id );
		if ( ! $view ) {
			continue;
		}

		$size = '';
		if ( ! empty( $item['variation']['attribute_pa_size'] ) ) {
			$term = get_term_by( 'slug', $item['variation']['attribute_pa_size'], 'pa_size' );
			$size = $term ? $term->name : strtoupper( $item['variation']['attribute_pa_size'] );
		}

		$color = ! empty( $item['mi_color'] ) && is_array( $item['mi_color'] )
			? $item['mi_color']
			: ( isset( $view['colors'][0] ) ? $view['colors'][0] : array( 'name' => '', 'hex' => '#171717' ) );

		$unit      = (float) $product->get_price();
		$mrp       = (float) ( $product->get_regular_price() ? $product->get_regular_price() : $unit );
		$quantity  = (int) $item['quantity'];
		$lines[]   = array(
			'key'       => $key,
			'view'      => $view,
			'size'      => $size,
			'color'     => $color,
			'quantity'  => $quantity,
			'unit'      => $unit,
			'total'     => $unit * $quantity,
			'mrp_total' => $mrp * $quantity,
		);
	}
	return $lines;
}

/**
 * Checkout link for the bag: signed-in shoppers go to checkout, everyone else to
 * sign-up first (checkout requires an account, as in the original).
 *
 * @return array{url:string,label:string}
 */
function mi_trends_checkout_link() {
	if ( is_user_logged_in() ) {
		return array( 'url' => wc_get_checkout_url(), 'label' => __( 'Checkout', 'mi-trends' ) );
	}
	return array(
		'url'   => mi_trends_account_url( 'signup', wp_make_link_relative( wc_get_checkout_url() ) ),
		'label' => __( 'Sign up to check out', 'mi-trends' ),
	);
}

/**
 * A store setting from the plugin (thresholds, fees), with the original defaults.
 *
 * @param string $key Setting key.
 * @return mixed
 */
function mi_trends_setting( $key ) {
	if ( function_exists( 'mi_core_setting' ) ) {
		return mi_core_setting( $key );
	}
	$defaults = array(
		'free_shipping_threshold' => 999,
		'standard_shipping'       => 79,
		'cod_enabled'             => true,
		'cod_minimum_order'       => 800,
		'cod_advance_percent'     => 20,
		'cod_fee'                 => 49,
		'support_email'           => 'support@mitrends.in',
		'support_phone'           => '+91 98765 43210',
		'support_hours'           => 'Mon–Sat, 10am–7pm IST',
		'announcements'           => array( 'Free shipping over ₹999', 'Easy 30-day returns', 'Cash on delivery available', 'Save 10% with MI10' ),
	);
	return isset( $defaults[ $key ] ) ? $defaults[ $key ] : null;
}

/**
 * URL of a file in the theme's assets/images directory.
 *
 * @param string $path Relative path, e.g. 'products/tee-01-a.jpg'.
 * @return string
 */
function mi_trends_image( $path ) {
	return MI_THEME_URI . '/assets/images/' . ltrim( $path, '/' );
}

/**
 * Shop URL with MI TRENDS filter parameters (?category=men&tag=sale …).
 *
 * The parameter names are the ones the Next.js shop used, so every old link
 * keeps working; the plugin translates them into a WooCommerce product query.
 *
 * @param array $args Query arguments.
 * @return string
 */
function mi_trends_shop_url( $args = array() ) {
	$base = function_exists( 'wc_get_page_permalink' ) ? wc_get_page_permalink( 'shop' ) : home_url( '/shop/' );
	return $args ? add_query_arg( array_map( 'rawurlencode', $args ), $base ) : $base;
}

/**
 * Info page URL — /info/{slug}/ in the original; a child page of "Info" here.
 *
 * @param string $slug Page slug.
 * @return string
 */
function mi_trends_info_url( $slug ) {
	$page = get_page_by_path( 'info/' . $slug );
	return $page ? get_permalink( $page ) : home_url( '/info/' . $slug . '/' );
}

/**
 * My Account URLs with the original routes: /account, /account/login, /account/signup.
 *
 * @param string $which 'account' | 'login' | 'signup'.
 * @param string $next  Optional path to return to afterwards.
 * @return string
 */
function mi_trends_account_url( $which = 'account', $next = '' ) {
	$base = function_exists( 'wc_get_page_permalink' ) ? wc_get_page_permalink( 'myaccount' ) : home_url( '/account/' );
	if ( 'login' === $which || 'signup' === $which ) {
		$base = trailingslashit( $base ) . $which . '/';
	}
	return $next ? add_query_arg( 'next', rawurlencode( $next ), $base ) : $base;
}

/**
 * Turn a ?next= value (a site path like "/checkout/") into a same-site absolute
 * URL, or '' if it points anywhere else.
 *
 * @param string $next Raw value.
 * @return string
 */
function mi_trends_safe_next( $next ) {
	$next = trim( (string) $next );
	if ( '' === $next ) {
		return '';
	}
	if ( 0 === strpos( $next, '/' ) && 0 !== strpos( $next, '//' ) ) {
		$home   = wp_parse_url( home_url() );
		$origin = $home['scheme'] . '://' . $home['host'] . ( isset( $home['port'] ) ? ':' . $home['port'] : '' );
		$next   = $origin . $next;
	}
	return wp_validate_redirect( esc_url_raw( $next ), '' );
}

/**
 * Wishlist page URL.
 *
 * @return string
 */
function mi_trends_wishlist_url() {
	$page = get_page_by_path( 'wishlist' );
	return $page ? get_permalink( $page ) : home_url( '/wishlist/' );
}

/**
 * Initials for the avatar bubble, same rule as initialsOf() in lib/account/auth.tsx.
 *
 * @param string $name  Display name.
 * @param string $email Email.
 * @return string
 */
function mi_trends_initials( $name, $email ) {
	$source = trim( (string) $name ) !== '' ? $name : $email;
	$parts  = array_values( array_filter( preg_split( '/[\s.@]+/', (string) $source ) ) );
	$out    = '';
	if ( isset( $parts[0] ) ) {
		$out .= function_exists( 'mb_substr' ) ? mb_substr( $parts[0], 0, 1 ) : substr( $parts[0], 0, 1 );
	}
	if ( isset( $parts[1] ) ) {
		$out .= function_exists( 'mb_substr' ) ? mb_substr( $parts[1], 0, 1 ) : substr( $parts[1], 0, 1 );
	}
	$out = function_exists( 'mb_strtoupper' ) ? mb_strtoupper( $out ) : strtoupper( $out );
	return '' !== $out ? $out : 'MI';
}

/**
 * Render a template part with variables, e.g. mi_trends_part( 'components/product-card', array( 'product' => $p ) ).
 *
 * @param string $slug Path under template-parts/.
 * @param array  $args Variables, available as $args in the part.
 */
function mi_trends_part( $slug, $args = array() ) {
	get_template_part( 'template-parts/' . $slug, null, $args );
}

/**
 * The brand lockup (MI box + TRENDS) used in the header, footer, drawers and search.
 *
 * @param array $args class, id (for the name span), style_mark, style_name.
 */
function mi_trends_brand_lockup( $args = array() ) {
	$args = wp_parse_args( $args, array( 'class' => '', 'name_id' => '', 'invert' => false ) );
	printf(
		'<a class="%1$s" href="%2$s" aria-label="%3$s"><span class="brand-mark" aria-hidden="true"%4$s>MI</span><span class="brand-name"%5$s%6$s>TRENDS</span></a>',
		esc_attr( trim( 'brand-lockup ' . $args['class'] ) ),
		esc_url( home_url( '/' ) ),
		esc_attr__( 'MI TRENDS home', 'mi-trends' ),
		$args['invert'] ? ' style="background:#fff;color:#171716"' : '',
		$args['name_id'] ? ' id="' . esc_attr( $args['name_id'] ) . '"' : '',
		$args['invert'] ? ' style="color:#fff"' : ''
	);
}

/**
 * The size chart rows shared by the size-guide dialog and the size-guide page.
 *
 * @return array{tops:array,bottoms:array,shoes:array}
 */
function mi_trends_size_rows() {
	return array(
		'tops'    => array(
			array( 'XS', '36', '25', '16.5' ),
			array( 'S', '38', '26', '17.5' ),
			array( 'M', '40', '27', '18.5' ),
			array( 'L', '42', '28', '19.5' ),
			array( 'XL', '44', '29', '20.5' ),
			array( 'XXL', '46', '30', '21.5' ),
		),
		'bottoms' => array(
			array( '28', '28', '39', '39' ),
			array( '30', '30', '41', '40' ),
			array( '32', '32', '43', '41' ),
			array( '34', '34', '45', '42' ),
			array( '36', '36', '47', '43' ),
			array( '38', '38', '49', '44' ),
		),
		'shoes'   => array(
			array( 'UK 6', '25.0', '40' ),
			array( 'UK 7', '25.7', '41' ),
			array( 'UK 8', '26.4', '42' ),
			array( 'UK 9', '27.1', '43' ),
			array( 'UK 10', '27.8', '44' ),
			array( 'UK 11', '28.5', '45' ),
		),
	);
}
