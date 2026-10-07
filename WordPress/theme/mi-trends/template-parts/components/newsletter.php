<?php
/**
 * Newsletter band at the top of the footer (Footer.tsx).
 *
 * Posts to the MI Trends Core plugin, which stores the address in the
 * {prefix}mi_subscribers table. Works without JavaScript through admin-post.php;
 * with JavaScript it submits in place and shows the original toast.
 *
 * @package MI_Trends
 */

defined( 'ABSPATH' ) || exit;
?>
<section class="newsletter-section" aria-labelledby="newsletter-title">
	<div class="newsletter-inner shell">
		<div class="newsletter-copy">
			<p class="eyebrow"><?php esc_html_e( 'The good stuff, first', 'mi-trends' ); ?></p>
			<h2 id="newsletter-title"><?php esc_html_e( 'New drops. Rare offers. Your inbox.', 'mi-trends' ); ?></h2>
			<p><?php esc_html_e( 'A short note when there is something genuinely worth wearing.', 'mi-trends' ); ?></p>
		</div>
		<form class="newsletter-form" method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" data-mi-subscribe="footer">
			<input type="hidden" name="action" value="mi_trends_subscribe">
			<input type="hidden" name="source" value="footer">
			<?php wp_nonce_field( 'mi_trends_subscribe', 'mi_subscribe_nonce' ); ?>
			<label class="sr-only" for="footer-newsletter-email"><?php esc_html_e( 'Email address', 'mi-trends' ); ?></label>
			<input id="footer-newsletter-email" type="email" name="email" placeholder="you@example.com" autocomplete="email" required>
			<?php // Honeypot: real people never see or fill this. ?>
			<input type="text" name="mi_hp" value="" tabindex="-1" autocomplete="off" class="sr-only" aria-hidden="true">
			<button class="button button-primary" type="submit">
				<?php esc_html_e( 'Join the list', 'mi-trends' ); ?>
				<?php mi_trends_icon( 'arrow-right', array( 'size' => 17 ) ); ?>
			</button>
		</form>
	</div>
</section>
