<?php
/**
 * Fallback template. The storefront has no blog, so posts (if any are ever
 * written) are listed in the same narrow column the info pages use.
 *
 * @package MI_Trends
 */

defined( 'ABSPATH' ) || exit;

get_header();
?>
<div class="info-page">
	<header class="info-head">
		<span class="eyebrow"><?php esc_html_e( 'Journal', 'mi-trends' ); ?></span>
		<h1><span><?php echo esc_html( is_home() ? single_post_title( '', false ) : get_the_archive_title() ); ?></span></h1>
	</header>

	<?php if ( have_posts() ) : ?>
		<div class="simple-body">
			<?php
			while ( have_posts() ) :
				the_post();
				get_template_part( 'template-parts/content', 'summary' );
			endwhile;
			?>
		</div>
		<?php
		the_posts_pagination(
			array(
				'class'     => 'mi-pagination',
				'prev_text' => __( 'Newer', 'mi-trends' ),
				'next_text' => __( 'Older', 'mi-trends' ),
			)
		);
		?>
	<?php else : ?>
		<?php get_template_part( 'template-parts/content', 'none' ); ?>
	<?php endif; ?>
</div>
<?php
get_footer();
