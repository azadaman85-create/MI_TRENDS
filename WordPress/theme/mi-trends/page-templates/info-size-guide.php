<?php
/**
 * Template Name: Info — Size guide
 *
 * SizeGuideBody in app/(store)/info/[slug]/page.tsx: tops, bottoms and sneaker
 * tables plus "How to measure". Any page content is shown underneath.
 *
 * @package MI_Trends
 */

defined( 'ABSPATH' ) || exit;

get_header();

$mi_rows   = mi_trends_size_rows();
$mi_tables = array(
	array( __( 'Tops, tees & hoodies', 'mi-trends' ), array( __( 'Size', 'mi-trends' ), __( 'Chest (in)', 'mi-trends' ), __( 'Length (in)', 'mi-trends' ), __( 'Shoulder (in)', 'mi-trends' ) ), $mi_rows['tops'] ),
	array( __( 'Joggers, shorts & bottoms', 'mi-trends' ), array( __( 'Size', 'mi-trends' ), __( 'Waist (in)', 'mi-trends' ), __( 'Hip (in)', 'mi-trends' ), __( 'Outseam (in)', 'mi-trends' ) ), $mi_rows['bottoms'] ),
	array( __( 'Sneakers', 'mi-trends' ), array( __( 'Size', 'mi-trends' ), __( 'Foot length (cm)', 'mi-trends' ), __( 'EU', 'mi-trends' ) ), $mi_rows['shoes'] ),
);

while ( have_posts() ) :
	the_post();
	?>
	<div class="info-page">
		<?php mi_trends_part( 'components/info-header', array( 'post' => get_post() ) ); ?>
		<div class="size-guide-body">
			<?php foreach ( $mi_tables as $mi_table ) : ?>
				<section class="size-table-section">
					<h2><?php mi_trends_icon( 'ruler', array( 'size' => 17 ) ); ?> <?php echo esc_html( $mi_table[0] ); ?></h2>
					<div class="size-table-wrap">
						<table>
							<thead><tr><?php foreach ( $mi_table[1] as $mi_h ) : ?><th><?php echo esc_html( $mi_h ); ?></th><?php endforeach; ?></tr></thead>
							<tbody>
								<?php foreach ( $mi_table[2] as $mi_row ) : ?>
									<tr><?php foreach ( $mi_row as $mi_cell ) : ?><td><?php echo esc_html( $mi_cell ); ?></td><?php endforeach; ?></tr>
								<?php endforeach; ?>
							</tbody>
						</table>
					</div>
				</section>
			<?php endforeach; ?>
			<section class="size-tip">
				<strong><?php esc_html_e( 'How to measure', 'mi-trends' ); ?></strong>
				<p><?php esc_html_e( 'Lay a similar piece you own flat. Chest is measured pit-to-pit and doubled, length from the highest shoulder point to the hem, and shoulder seam-to-seam. When between two sizes, size up for a relaxed streetwear fit.', 'mi-trends' ); ?></p>
			</section>
			<?php
			if ( '' !== trim( get_the_content() ) ) {
				echo '<div class="simple-body">';
				the_content();
				echo '</div>';
			}
			?>
		</div>
	</div>
	<?php
endwhile;

get_footer();
