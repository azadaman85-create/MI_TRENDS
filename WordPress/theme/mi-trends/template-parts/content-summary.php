<?php
/**
 * A post in a list: a card in the info-page style.
 *
 * @package MI_Trends
 */

defined( 'ABSPATH' ) || exit;
?>
<article id="post-<?php the_ID(); ?>" <?php post_class( 'simple-section' ); ?>>
	<h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
	<p><?php echo esc_html( get_the_date() ); ?></p>
	<?php the_excerpt(); ?>
</article>
