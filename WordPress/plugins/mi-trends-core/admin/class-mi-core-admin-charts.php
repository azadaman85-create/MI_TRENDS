<?php
/**
 * Server-rendered SVG charts — components/admin/charts (AreaChart, BarChart, Donut)
 * without a JavaScript chart library. Colours are the storefront tokens.
 *
 * @package MI_Trends_Core
 */

defined( 'ABSPATH' ) || exit;

/**
 * Charts.
 */
class MI_Core_Admin_Charts {

	/**
	 * Area chart of a daily series.
	 *
	 * @param array  $series [{label, value}].
	 * @param string $label  Accessible label.
	 * @return string
	 */
	public static function area( $series, $label ) {
		$w     = 720;
		$h     = 240;
		$pad_x = 8;
		$pad_y = 18;
		$max   = 0.0;
		foreach ( $series as $point ) {
			$max = max( $max, (float) $point['value'] );
		}
		$max   = $max > 0 ? $max * 1.12 : 1;
		$count = max( 1, count( $series ) - 1 );

		$points = array();
		foreach ( array_values( $series ) as $i => $point ) {
			$x        = $pad_x + ( $w - 2 * $pad_x ) * $i / $count;
			$y        = $h - $pad_y - ( $h - 2 * $pad_y ) * ( (float) $point['value'] / $max );
			$points[] = round( $x, 1 ) . ',' . round( $y, 1 );
		}
		$line = implode( ' ', $points );
		$area = $points ? 'M' . $points[0] . ' L' . implode( ' L', $points ) . ' L' . ( $w - $pad_x ) . ',' . ( $h - $pad_y ) . ' L' . $pad_x . ',' . ( $h - $pad_y ) . ' Z' : '';

		$grid = '';
		for ( $g = 0; $g <= 3; $g++ ) {
			$y     = $pad_y + ( $h - 2 * $pad_y ) * $g / 3;
			$grid .= '<line x1="0" x2="' . $w . '" y1="' . round( $y, 1 ) . '" y2="' . round( $y, 1 ) . '"/>';
		}

		$axis  = '';
		$step  = max( 1, (int) ceil( count( $series ) / 6 ) );
		foreach ( array_values( $series ) as $i => $point ) {
			if ( 0 !== $i % $step && count( $series ) - 1 !== $i ) {
				continue;
			}
			$x     = $pad_x + ( $w - 2 * $pad_x ) * $i / $count;
			$axis .= '<text x="' . round( $x, 1 ) . '" y="' . ( $h - 2 ) . '" text-anchor="middle">' . esc_html( $point['label'] ) . '</text>';
		}

		return '<div class="a-chart"><svg viewBox="0 0 ' . $w . ' ' . $h . '" role="img" aria-label="' . esc_attr( $label ) . '">'
			. '<defs><linearGradient id="mi-area-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ef3f2f" stop-opacity=".22"/><stop offset="100%" stop-color="#ef3f2f" stop-opacity="0"/></linearGradient></defs>'
			. '<g class="a-chart__grid">' . $grid . '</g>'
			. ( $area ? '<path d="' . esc_attr( $area ) . '" fill="url(#mi-area-fill)"/>' : '' )
			. ( $line ? '<polyline points="' . esc_attr( $line ) . '" fill="none" stroke="#ef3f2f" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>' : '' )
			. '<g class="a-chart__axis">' . $axis . '</g>'
			. '</svg></div>';
	}

	/**
	 * Horizontal bars (best sellers, revenue by collection …).
	 *
	 * @param array<string,float> $rows   label => value.
	 * @param callable|null       $format Value formatter.
	 * @return string
	 */
	public static function bars( $rows, $format = null ) {
		if ( ! $rows ) {
			return '';
		}
		$max = max( array_map( 'floatval', $rows ) );
		$max = $max > 0 ? $max : 1;
		$out = '<ul class="a-list mi-bars">';
		foreach ( $rows as $label => $value ) {
			$pct  = round( (float) $value / $max * 100, 1 );
			$out .= '<li><div class="mi-bars__row"><span class="mi-bars__label">' . esc_html( $label ) . '</span><span class="a-num mi-bars__value">' . esc_html( $format ? call_user_func( $format, $value ) : (string) $value ) . '</span></div>'
				. '<div class="a-bar-track"><div class="a-bar-fill" style="width:' . esc_attr( $pct ) . '%"></div></div></li>';
		}
		return $out . '</ul>';
	}

	/**
	 * Donut (order status / payment mix).
	 *
	 * @param array $slices [{label, value, color}].
	 * @param string $center Centre text.
	 * @return string
	 */
	public static function donut( $slices, $center ) {
		$total = 0.0;
		foreach ( $slices as $slice ) {
			$total += (float) $slice['value'];
		}
		$r      = 70;
		$c      = 2 * M_PI * $r;
		$offset = 0.0;
		$rings  = '';
		foreach ( $slices as $slice ) {
			if ( $total <= 0 || (float) $slice['value'] <= 0 ) {
				continue;
			}
			$len    = $c * (float) $slice['value'] / $total;
			$rings .= '<circle r="' . $r . '" cx="90" cy="90" fill="none" stroke="' . esc_attr( $slice['color'] ) . '" stroke-width="22" stroke-dasharray="' . round( $len, 2 ) . ' ' . round( $c - $len, 2 ) . '" stroke-dashoffset="' . round( -$offset, 2 ) . '" transform="rotate(-90 90 90)"/>';
			$offset += $len;
		}
		if ( '' === $rings ) {
			$rings = '<circle r="' . $r . '" cx="90" cy="90" fill="none" stroke="#ebe6dd" stroke-width="22"/>';
		}

		$legend = '<div class="a-chart-legend">';
		foreach ( $slices as $slice ) {
			$legend .= '<span class="a-legend-item"><span class="a-legend-swatch" style="background:' . esc_attr( $slice['color'] ) . '"></span>' . esc_html( $slice['label'] ) . ' · ' . esc_html( (string) $slice['value'] ) . '</span>';
		}
		$legend .= '</div>';

		return '<div class="mi-donut"><svg viewBox="0 0 180 180" width="180" height="180" role="img" aria-label="' . esc_attr( $center ) . '">' . $rings
			. '<text x="90" y="86" text-anchor="middle" class="mi-donut__value">' . esc_html( (string) (int) $total ) . '</text>'
			. '<text x="90" y="106" text-anchor="middle" class="mi-donut__label">' . esc_html( $center ) . '</text></svg>' . $legend . '</div>';
	}
}
