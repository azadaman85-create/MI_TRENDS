<?php
/**
 * Template Name: Info — FAQs
 *
 * FaqsBody in app/(store)/info/[slug]/page.tsx. The questions are ordinary page
 * content so they can be edited in the block editor: a Heading block per
 * category followed by Details blocks (summary = question). The import seeds
 * the original 11 questions in 4 categories. Only one answer is open at a time,
 * as before.
 *
 * @package MI_Trends
 */

defined( 'ABSPATH' ) || exit;

get_header();

while ( have_posts() ) :
	the_post();
	?>
	<div class="info-page">
		<?php mi_trends_part( 'components/info-header', array( 'post' => get_post() ) ); ?>
		<div class="faq-body mi-faq-content" data-mi-faq>
			<?php the_content(); ?>
		</div>
	</div>
	<?php
endwhile;

get_footer();
