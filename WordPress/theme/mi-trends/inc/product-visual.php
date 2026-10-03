<?php
/**
 * Product visual — PHP port of components/ProductVisual.tsx.
 *
 * Every product image on the storefront is a 480×640 SVG: the photo (or, with
 * no photo, an illustrated garment in the product's colour) under a soft scrim,
 * with the "MI / 01" pill and the collection name set in the corners. Views:
 * front, back, detail (fabric close-up), flat.
 *
 * Only the garment shapes the live catalogue actually uses are ported for the
 * no-photo fallback (shirt — which, as in the original, also catches "T-shirt" —
 * and the default tee used for pyjama sets), with the default and
 * back-print artwork. Every MI TRENDS product ships with photos, so the
 * fallback only shows for a product someone adds without images.
 *
 * @package MI_Trends
 */

defined( 'ABSPATH' ) || exit;

/**
 * Render a product visual.
 *
 * @param array $view Product view (mi_trends_product_view()).
 * @param array $args view (front|back|detail|flat), color ({name,hex}), class, decorative, title.
 * @return string SVG markup (all dynamic values escaped).
 */
function mi_trends_get_product_visual( $view, $args = array() ) {
	$args = wp_parse_args(
		$args,
		array(
			'view'       => 'front',
			'color'      => null,
			'class'      => '',
			'decorative' => false,
			'title'      => '',
		)
	);

	$variant = 'flat-lay' === $args['view'] ? 'flat' : $args['view'];
	$color   = is_array( $args['color'] ) ? $args['color'] : ( isset( $view['colors'][0] ) ? $view['colors'][0] : array( 'name' => '', 'hex' => '#171717' ) );
	$safe    = preg_replace( '/[^a-zA-Z0-9]/', '', (string) $color['hex'] );
	$id      = 'mi-product-' . (int) $view['id'] . '-' . $variant . '-' . $safe;
	$label   = $args['title'] ? $args['title'] : sprintf(
		/* translators: 1: product name, 2: colour, 3: view name */
		__( '%1$s in %2$s, %3$s view', 'mi-trends' ),
		$view['name'],
		$color['name'],
		'flat' === $variant ? __( 'flat lay', 'mi-trends' ) : $variant
	);

	$a11y = $args['decorative']
		? 'aria-hidden="true"'
		: 'role="img" aria-label="' . esc_attr( $label ) . '"';

	$image = 'back' === $variant
		? ( ! empty( $view['back_image_url'] ) ? $view['back_image_url'] : $view['image_url'] )
		: $view['image_url'];

	$pill       = 'MI / ' . substr( (string) $view['id'], -2 );
	$collection = function_exists( 'mb_strtoupper' ) ? mb_strtoupper( (string) $view['collection'] ) : strtoupper( (string) $view['collection'] );

	$open = sprintf(
		'<svg class="%1$s" viewBox="0 0 480 640" %2$s focusable="false" preserveAspectRatio="xMidYMid slice" data-variant="%3$s" xmlns="http://www.w3.org/2000/svg">',
		esc_attr( $args['class'] ),
		$a11y,
		esc_attr( $variant )
	);

	if ( $image ) {
		$detail = 'detail' === $variant;
		$sub    = 'back' === $variant ? 'ALTERNATE VIEW' : ( $detail ? 'FABRIC CLOSE-UP' : ( function_exists( 'mb_strtoupper' ) ? mb_strtoupper( (string) $view['type'] ) : strtoupper( (string) $view['type'] ) ) );

		return $open
			. '<defs>'
			. '<linearGradient id="' . esc_attr( $id ) . '-photo-scrim" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#000" stop-opacity="0.12"/><stop offset="25%" stop-color="#000" stop-opacity="0"/><stop offset="65%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.65"/></linearGradient>'
			. '<linearGradient id="' . esc_attr( $id ) . '-badge-bg" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#111" stop-opacity="0.88"/><stop offset="100%" stop-color="#222" stop-opacity="0.75"/></linearGradient>'
			. '</defs>'
			. sprintf(
				'<image href="%1$s" x="%2$s" y="%3$s" width="%4$s" height="%5$s" preserveAspectRatio="xMidYMid slice"/>',
				esc_url( $image ),
				$detail ? '-72' : '0',
				$detail ? '-96' : '0',
				$detail ? '624' : '480',
				$detail ? '832' : '640'
			)
			. '<rect width="480" height="640" fill="url(#' . esc_attr( $id ) . '-photo-scrim)"/>'
			. '<g aria-hidden="true">'
			. '<rect x="20" y="20" width="88" height="26" rx="13" fill="url(#' . esc_attr( $id ) . '-badge-bg)"/>'
			. '<text x="64" y="37" fill="#fff" font-size="9" text-anchor="middle" font-weight="800" letter-spacing="1.7">' . esc_html( $pill ) . '</text>'
			. '<text x="460" y="594" fill="#fff" fill-opacity=".96" font-size="10" text-anchor="end" font-weight="900" letter-spacing="2.2">' . esc_html( $collection ) . '</text>'
			. '<text x="460" y="612" fill="#fff" fill-opacity=".78" font-size="8" text-anchor="end" font-weight="700" letter-spacing="1.5">' . esc_html( $sub ) . '</text>'
			. '</g></svg>';
	}

	// No photo: the illustrated fallback.
	$palette   = isset( $view['palette'] ) && count( $view['palette'] ) === 3 ? $view['palette'] : array( '#131313', '#ef3f2f', '#f3f0ea' );
	$transform = 'detail' === $variant ? ' transform="translate(-50 -88) scale(1.22)"' : ( 'flat' === $variant ? ' transform="rotate(-5 240 330)"' : '' );

	return $open
		. '<defs>'
		. '<linearGradient id="' . esc_attr( $id ) . '-background" x1="0" y1="0" x2="1" y2="1"><stop stop-color="' . esc_attr( $palette[2] ) . '"/><stop offset=".52" stop-color="' . esc_attr( $palette[1] ) . '" stop-opacity=".55"/><stop offset="1" stop-color="' . esc_attr( $palette[0] ) . '" stop-opacity=".78"/></linearGradient>'
		. '<radialGradient id="' . esc_attr( $id ) . '-glow" cx="50%" cy="40%" r="56%"><stop stop-color="#fff" stop-opacity=".78"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>'
		. '<filter id="' . esc_attr( $id ) . '-shadow" x="-30%" y="-25%" width="160%" height="170%"><feDropShadow dx="0" dy="18" stdDeviation="13" flood-color="#000" flood-opacity=".24"/></filter>'
		. '<pattern id="' . esc_attr( $id ) . '-grain" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="3" cy="4" r="1" fill="#fff" opacity=".2"/><circle cx="18" cy="13" r=".8" fill="#111" opacity=".12"/></pattern>'
		. '</defs>'
		. '<rect width="480" height="640" fill="url(#' . esc_attr( $id ) . '-background)"/>'
		. '<rect width="480" height="640" fill="url(#' . esc_attr( $id ) . '-grain)"/>'
		. '<circle cx="242" cy="282" r="220" fill="url(#' . esc_attr( $id ) . '-glow)"/>'
		. '<path d="M-40 109C92 31 276 18 515 89" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="2"/>'
		. '<path d="M-31 544C137 604 310 598 515 512" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="2"/>'
		. '<circle cx="55" cy="94" r="26" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="2"/>'
		. '<circle cx="419" cy="520" r="47" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="2"/>'
		. '<g filter="url(#' . esc_attr( $id ) . '-shadow)"' . $transform . '>'
		. mi_trends_product_shape( $view, $color['hex'], $variant, $palette )
		. '</g>'
		. '<g aria-hidden="true">'
		. '<rect x="25" y="25" width="91" height="29" rx="14.5" fill="#111" fill-opacity=".82"/>'
		. '<text x="70.5" y="44" fill="#fff" font-size="9" text-anchor="middle" font-weight="800" letter-spacing="1.7">' . esc_html( $pill ) . '</text>'
		. '<text x="455" y="591" fill="#fff" fill-opacity=".88" font-size="9" text-anchor="end" font-weight="800" letter-spacing="2.2">' . esc_html( $collection ) . '</text>'
		. '<text x="455" y="610" fill="#fff" fill-opacity=".68" font-size="8" text-anchor="end" font-weight="700" letter-spacing="1.5">ORIGINAL ARTWORK</text>'
		. '</g></svg>';
}

/**
 * Echo a product visual.
 *
 * @param array $view Product view.
 * @param array $args Arguments.
 */
function mi_trends_product_visual( $view, $args = array() ) {
	echo mi_trends_get_product_visual( $view, $args ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- every dynamic value is escaped while building.
}

/**
 * Garment outline (shirt or tee) with artwork — ProductShape in ProductVisual.tsx.
 *
 * @param array  $view    Product view.
 * @param string $fill    Garment colour.
 * @param string $variant View.
 * @param array  $palette [ink, accent, paper].
 * @return string
 */
function mi_trends_product_shape( $view, $fill, $variant, $palette ) {
	$type    = strtolower( (string) $view['type'] );
	$seam    = esc_attr( $palette[2] );
	$fill    = esc_attr( $fill );
	$outline = '#171717';
	$back    = 'back' === $variant;

	// Same test as the original (`type.includes("shirt")`), which also matches "T-shirt".
	if ( false !== strpos( $type, 'shirt' ) ) {
		$buttons = '';
		foreach ( array( 266, 310, 354, 398, 442 ) as $y ) {
			$buttons .= '<circle cx="251" cy="' . $y . '" r="4" fill="' . $seam . '"/>';
		}
		return '<g>'
			. '<path d="M172 141l68 25 68-25 85 73-54 90-39-25 13 255H167l13-255-39 25-54-90Z" fill="' . $fill . '" stroke="' . $outline . '" stroke-width="7" stroke-linejoin="round"/>'
			. '<path d="M172 141l68 25-41 71-34-72ZM308 141l-68 25 41 71 34-72Z" fill="' . $seam . '" stroke="' . $outline . '" stroke-width="5" stroke-linejoin="round"/>'
			. '<path d="M240 171v363" stroke="' . $outline . '" stroke-width="4" opacity=".55"/>'
			. $buttons
			. mi_trends_collection_artwork( $palette, $back, 240, 355, 0.63 )
			. '</g>';
	}

	return '<g>'
		. '<path d="M172 142l68 25 68-25 86 73-54 90-39-24 13 253H166l13-253-39 24-54-90Z" fill="' . $fill . '" stroke="' . $outline . '" stroke-width="7" stroke-linejoin="round"/>'
		. '<path d="M177 144c12 73 114 73 126 0" fill="' . $seam . '" stroke="' . $outline . '" stroke-width="5"/>'
		. '<path d="M170 489c39 10 101 10 140 0" fill="none" stroke="' . $outline . '" stroke-width="4" opacity=".25"/>'
		. mi_trends_collection_artwork( $palette, $back, 240, 332, false !== strpos( $type, 'oversized' ) ? 0.82 : 0.7 )
		. '</g>';
}

/**
 * Chest/back artwork — CollectionArtwork in ProductVisual.tsx (default + back print).
 *
 * @param array $palette [ink, accent, paper].
 * @param bool  $back    Back print.
 * @param int   $x       Centre x.
 * @param int   $y       Centre y.
 * @param float $scale   Scale.
 * @return string
 */
function mi_trends_collection_artwork( $palette, $back, $x, $y, $scale ) {
	list( $ink, $accent, $paper ) = array_map( 'esc_attr', $palette );
	$transform                    = sprintf( 'translate(%d %d) scale(%s)', $x, $y, rtrim( rtrim( number_format( (float) $scale, 2, '.', '' ), '0' ), '.' ) );

	if ( $back ) {
		return '<g transform="' . $transform . '" text-anchor="middle">'
			. '<circle r="51" fill="' . $paper . '" opacity=".92"/>'
			. '<circle r="44" fill="none" stroke="' . $ink . '" stroke-width="2" stroke-dasharray="5 5"/>'
			. '<text y="-5" fill="' . $ink . '" font-size="24" font-weight="900" letter-spacing="2">MI</text>'
			. '<text y="16" fill="' . $ink . '" font-size="8" font-weight="800" letter-spacing="2.8">TRENDS</text>'
			. '<path d="M-24 28H24" stroke="' . $accent . '" stroke-width="5" stroke-linecap="round"/>'
			. '</g>';
	}

	return '<g transform="' . $transform . '">'
		. '<rect x="-65" y="-55" width="130" height="110" rx="8" fill="' . $paper . '" stroke="' . $ink . '" stroke-width="5" transform="rotate(-3)"/>'
		. '<text x="0" y="-12" fill="' . $ink . '" font-size="15" text-anchor="middle" font-weight="900" letter-spacing="3">STUDIO</text>'
		. '<text x="0" y="28" fill="' . $accent . '" font-size="48" text-anchor="middle" font-weight="950" letter-spacing="-3">99</text>'
		. '<circle cx="-55" cy="-45" r="10" fill="' . $accent . '"/>'
		. '<circle cx="56" cy="45" r="7" fill="' . $ink . '"/>'
		. '</g>';
}
