<?php
/**
 * Lucide icons, rendered inline exactly as lucide-react draws them.
 *
 * The path data lives in assets/icons/icons.json so there is one copy of it.
 *
 * @package MI_Trends
 */

defined( 'ABSPATH' ) || exit;

/**
 * Inner markup for every icon, keyed by name. Read once per request.
 *
 * @return array<string,string>
 */
function mi_trends_icon_set() {
	static $icons = null;
	if ( null === $icons ) {
		$file  = MI_THEME_DIR . '/assets/icons/icons.json';
		$json  = is_readable( $file ) ? file_get_contents( $file ) : ''; // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- local theme file.
		$data  = $json ? json_decode( $json, true ) : array();
		$icons = is_array( $data ) ? $data : array();
		unset( $icons['_comment'] );
	}
	return $icons;
}

/**
 * Return an icon as an <svg> string.
 *
 * Icon markup comes from the theme's own JSON file, never from user input, so it
 * is trusted; attributes are escaped.
 *
 * @param string $name Icon name (see assets/icons/icons.json).
 * @param array  $args size, class, stroke_width, fill, label.
 * @return string
 */
function mi_trends_get_icon( $name, $args = array() ) {
	$icons = mi_trends_icon_set();
	if ( ! isset( $icons[ $name ] ) ) {
		return '';
	}

	$args = wp_parse_args(
		$args,
		array(
			'size'         => 24,
			'class'        => '',
			'stroke_width' => 2,
			'fill'         => 'none',
			'label'        => '',
		)
	);

	$class = trim( 'lucide lucide-' . $name . ' ' . $args['class'] );
	$a11y  = $args['label']
		? sprintf( 'role="img" aria-label="%s"', esc_attr( $args['label'] ) )
		: 'aria-hidden="true" focusable="false"';

	return sprintf(
		'<svg xmlns="http://www.w3.org/2000/svg" width="%1$d" height="%1$d" viewBox="0 0 24 24" fill="%2$s" stroke="currentColor" stroke-width="%3$s" stroke-linecap="round" stroke-linejoin="round" class="%4$s" %5$s>%6$s</svg>',
		(int) $args['size'],
		esc_attr( $args['fill'] ),
		esc_attr( (string) $args['stroke_width'] ),
		esc_attr( $class ),
		$a11y,
		$icons[ $name ]
	);
}

/**
 * Echo an icon. See mi_trends_get_icon().
 *
 * @param string $name Icon name.
 * @param array  $args Arguments.
 */
function mi_trends_icon( $name, $args = array() ) {
	echo mi_trends_get_icon( $name, $args ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built from trusted theme JSON with escaped attributes.
}

/**
 * Allowed-tags list for wp_kses() when icon markup is embedded in a larger string.
 *
 * @return array
 */
function mi_trends_svg_kses() {
	$shape = array(
		'd' => true, 'cx' => true, 'cy' => true, 'r' => true, 'rx' => true, 'ry' => true,
		'x' => true, 'y' => true, 'x1' => true, 'x2' => true, 'y1' => true, 'y2' => true,
		'width' => true, 'height' => true, 'points' => true, 'fill' => true, 'stroke' => true,
		'stroke-width' => true, 'opacity' => true, 'transform' => true,
	);
	return array(
		'svg'      => array(
			'xmlns' => true, 'width' => true, 'height' => true, 'viewbox' => true, 'fill' => true,
			'stroke' => true, 'stroke-width' => true, 'stroke-linecap' => true, 'stroke-linejoin' => true,
			'class' => true, 'aria-hidden' => true, 'focusable' => true, 'role' => true, 'aria-label' => true,
		),
		'path'     => $shape,
		'circle'   => $shape,
		'rect'     => $shape,
		'line'     => $shape,
		'polyline' => $shape,
		'polygon'  => $shape,
		'ellipse'  => $shape,
	);
}
