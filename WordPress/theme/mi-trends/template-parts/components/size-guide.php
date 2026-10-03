<?php
/**
 * Size guide dialog — SizeGuide.tsx. Kept in a <template>, mounted on demand.
 * Args: product_type (string) — picks tops, bottoms or shoe measurements.
 *
 * @package MI_Trends
 */

defined( 'ABSPATH' ) || exit;

$mi_type   = strtolower( isset( $args['product_type'] ) ? (string) $args['product_type'] : 'T-shirt' );
$mi_rows   = mi_trends_size_rows();
$mi_shoe   = false !== strpos( $mi_type, 'sneaker' ) || false !== strpos( $mi_type, 'shoe' );
$mi_bottom = (bool) preg_match( '/jogger|short|boxer|bottom/', $mi_type );

if ( $mi_shoe ) {
	$mi_head = array( __( 'Size', 'mi-trends' ), __( 'Foot length (cm)', 'mi-trends' ), __( 'EU', 'mi-trends' ) );
	$mi_body = $mi_rows['shoes'];
} elseif ( $mi_bottom ) {
	$mi_head = array( __( 'Size', 'mi-trends' ), __( 'Waist', 'mi-trends' ), __( 'Hip', 'mi-trends' ), __( 'Outseam', 'mi-trends' ) );
	$mi_body = $mi_rows['bottoms'];
} else {
	$mi_head = array( __( 'Size', 'mi-trends' ), __( 'Chest', 'mi-trends' ), __( 'Length', 'mi-trends' ), __( 'Shoulder', 'mi-trends' ) );
	$mi_body = $mi_rows['tops'];
}
?>
<template data-mi-template="size-guide">
	<div class="size-guide" role="presentation" data-mi-layer>
		<section class="size-guide__dialog" role="dialog" aria-modal="true" aria-labelledby="mi-size-guide-title">
			<div class="size-guide__head">
				<div>
					<span class="size-guide__eyebrow"><?php mi_trends_icon( 'ruler', array( 'size' => 15 ) ); ?> <?php esc_html_e( 'Find your fit', 'mi-trends' ); ?></span>
					<h2 id="mi-size-guide-title"><?php esc_html_e( 'Size guide', 'mi-trends' ); ?></h2>
				</div>
				<button type="button" data-mi-close aria-label="<?php esc_attr_e( 'Close size guide', 'mi-trends' ); ?>"><?php mi_trends_icon( 'x', array( 'size' => 21 ) ); ?></button>
			</div>

			<p class="size-guide__intro"><?php esc_html_e( 'Measurements are in inches unless noted. Measure a similar piece you already own and compare it with the chart for the most reliable fit.', 'mi-trends' ); ?></p>

			<div class="size-guide__table-wrap">
				<table>
					<thead><tr><?php foreach ( $mi_head as $mi_h ) : ?><th><?php echo esc_html( $mi_h ); ?></th><?php endforeach; ?></tr></thead>
					<tbody>
						<?php foreach ( $mi_body as $mi_row ) : ?>
							<tr><?php foreach ( $mi_row as $mi_cell ) : ?><td><?php echo esc_html( $mi_cell ); ?></td><?php endforeach; ?></tr>
						<?php endforeach; ?>
					</tbody>
				</table>
			</div>

			<div class="size-guide__tip">
				<strong><?php esc_html_e( 'Between sizes?', 'mi-trends' ); ?></strong>
				<span><?php esc_html_e( 'Size up for a relaxed streetwear fit, or stay true to size for a cleaner silhouette.', 'mi-trends' ); ?></span>
			</div>

			<button class="size-guide__done" type="button" data-mi-close><?php esc_html_e( 'Got it', 'mi-trends' ); ?></button>
		</section>
	</div>
</template>
