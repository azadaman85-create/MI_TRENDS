<?php
/**
 * Section heading — SectionHeading in app/(store)/page.tsx.
 * Args: eyebrow, title, href, link_label.
 *
 * @package MI_Trends
 */

defined( 'ABSPATH' ) || exit;

$mi_args = wp_parse_args( $args, array( 'eyebrow' => '', 'title' => '', 'href' => '', 'link_label' => __( 'View all', 'mi-trends' ), 'id' => '' ) );
?>
<div class="section-heading">
	<div>
		<?php if ( $mi_args['eyebrow'] ) : ?>
			<p class="eyebrow"><?php echo esc_html( $mi_args['eyebrow'] ); ?></p>
		<?php endif; ?>
		<h2<?php echo $mi_args['id'] ? ' id="' . esc_attr( $mi_args['id'] ) . '"' : ''; ?>><?php echo esc_html( $mi_args['title'] ); ?></h2>
	</div>
	<?php if ( $mi_args['href'] ) : ?>
		<a href="<?php echo esc_url( $mi_args['href'] ); ?>" class="text-link">
			<?php echo esc_html( $mi_args['link_label'] ); ?> <?php mi_trends_icon( 'arrow-right', array( 'size' => 16 ) ); ?>
		</a>
	<?php endif; ?>
</div>
