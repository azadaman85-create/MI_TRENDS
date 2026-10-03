<?php
/**
 * Template Name: Info — with "Get notified" form
 *
 * Gift cards and Stores in the original: the page content followed by the dark
 * "Get notified" email form. Sign-ups are stored by MI Trends Core with the
 * page slug as their source.
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
		<div class="simple-body">
			<?php the_content(); ?>
			<form class="notify-form" method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" data-mi-subscribe="notify">
				<input type="hidden" name="action" value="mi_trends_subscribe">
				<input type="hidden" name="source" value="<?php echo esc_attr( 'notify:' . get_post_field( 'post_name' ) ); ?>">
				<?php wp_nonce_field( 'mi_trends_subscribe', 'mi_subscribe_nonce' ); ?>
				<input type="text" name="mi_hp" value="" tabindex="-1" autocomplete="off" class="sr-only" aria-hidden="true">
				<label for="notify-email"><?php esc_html_e( 'Get notified', 'mi-trends' ); ?></label>
				<div>
					<input id="notify-email" name="email" type="email" required placeholder="you@example.com">
					<button type="submit"><?php esc_html_e( 'Notify me', 'mi-trends' ); ?> <?php mi_trends_icon( 'arrow-right', array( 'size' => 15 ) ); ?></button>
				</div>
			</form>
		</div>
	</div>
	<?php
endwhile;

get_footer();
