<?php
/**
 * Single post — same narrow column as the info pages.
 *
 * @package MI_Trends
 */

defined( 'ABSPATH' ) || exit;

get_header();

while ( have_posts() ) :
	the_post();
	?>
	<article id="post-<?php the_ID(); ?>" <?php post_class( 'info-page' ); ?>>
		<?php mi_trends_part( 'components/info-header', array( 'post' => get_post(), 'eyebrow' => get_the_date() ) ); ?>
		<div class="simple-body">
			<div class="simple-section"><?php the_content(); ?></div>
		</div>
		<?php
		wp_link_pages();
		if ( comments_open() || get_comments_number() ) {
			comments_template();
		}
		?>
	</article>
	<?php
endwhile;

get_footer();
