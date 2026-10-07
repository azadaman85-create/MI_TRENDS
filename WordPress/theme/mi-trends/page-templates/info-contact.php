<?php
/**
 * Template Name: Info — Contact
 *
 * ContactBody in app/(store)/info/[slug]/page.tsx. The original only showed a
 * toast; here MI Trends Core saves the message (Messages screen in wp-admin)
 * and emails the store's support address.
 *
 * @package MI_Trends
 */

defined( 'ABSPATH' ) || exit;

get_header();

// Result of a no-JavaScript submission, set by the plugin's redirect.
$mi_status = isset( $_GET['mi_contact'] ) ? sanitize_key( wp_unslash( $_GET['mi_contact'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- display only.

while ( have_posts() ) :
	the_post();
	?>
	<div class="info-page">
		<?php
		mi_trends_part(
			'components/info-header',
			array(
				'post'    => get_post(),
				'eyebrow' => get_post_meta( get_the_ID(), '_mi_eyebrow', true ) ? '' : __( "We're here", 'mi-trends' ),
				'title'   => get_post_meta( get_the_ID(), '_mi_display_title', true ) ? '' : "TALK TO\nA HUMAN.",
				'intro'   => get_post_meta( get_the_ID(), '_mi_intro', true ) ? '' : __( 'Order questions, sizing help, or just feedback — send it over.', 'mi-trends' ),
			)
		);
		?>
		<div class="contact-layout">
			<form class="contact-form" method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" data-mi-contact>
				<input type="hidden" name="action" value="mi_trends_contact">
				<?php wp_nonce_field( 'mi_trends_contact', 'mi_contact_nonce' ); ?>
				<input type="text" name="mi_hp" value="" tabindex="-1" autocomplete="off" class="sr-only" aria-hidden="true">
				<div class="fields two-col">
					<label><span><?php esc_html_e( 'Full name', 'mi-trends' ); ?></span><input name="name" required placeholder="<?php esc_attr_e( 'Your name', 'mi-trends' ); ?>" autocomplete="name"></label>
					<label><span><?php esc_html_e( 'Email address', 'mi-trends' ); ?></span><input name="email" type="email" required placeholder="you@example.com" autocomplete="email"></label>
					<label class="full"><span><?php esc_html_e( 'Order ID (optional)', 'mi-trends' ); ?></span><input name="order_id" placeholder="MIT12345678"></label>
					<label class="full"><span><?php esc_html_e( 'Message', 'mi-trends' ); ?></span><textarea name="message" required rows="5" placeholder="<?php esc_attr_e( 'How can we help?', 'mi-trends' ); ?>"></textarea></label>
				</div>
				<button type="submit"><?php esc_html_e( 'Send message', 'mi-trends' ); ?> <?php mi_trends_icon( 'arrow-right', array( 'size' => 16 ) ); ?></button>
				<p class="confirm" data-mi-contact-confirm<?php echo 'sent' === $mi_status ? '' : ' hidden'; ?>><?php mi_trends_icon( 'check', array( 'size' => 14 ) ); ?> <?php esc_html_e( 'Thanks — expect a reply within 24 hours.', 'mi-trends' ); ?></p>
				<p class="form-error" data-mi-contact-error<?php echo 'error' === $mi_status ? '' : ' hidden'; ?>><?php esc_html_e( 'We couldn’t send that. Check the fields and try again.', 'mi-trends' ); ?></p>
			</form>

			<aside class="contact-info">
				<div><?php mi_trends_icon( 'mail', array( 'size' => 17 ) ); ?><span><strong><?php esc_html_e( 'Email', 'mi-trends' ); ?></strong><small><?php echo esc_html( mi_trends_setting( 'support_email' ) ); ?></small></span></div>
				<div><?php mi_trends_icon( 'phone', array( 'size' => 17 ) ); ?><span><strong><?php esc_html_e( 'Call / WhatsApp', 'mi-trends' ); ?></strong><small><?php echo esc_html( mi_trends_setting( 'support_phone' ) ); ?></small></span></div>
				<div><?php mi_trends_icon( 'clock', array( 'size' => 17 ) ); ?><span><strong><?php esc_html_e( 'Hours', 'mi-trends' ); ?></strong><small><?php echo esc_html( mi_trends_setting( 'support_hours' ) ); ?></small></span></div>
				<div class="contact-links">
					<a href="<?php echo esc_url( mi_trends_info_url( 'faqs' ) ); ?>"><?php esc_html_e( 'Read our FAQs', 'mi-trends' ); ?></a>
					<a href="<?php echo esc_url( mi_trends_info_url( 'track-order' ) ); ?>"><?php esc_html_e( 'Track an order', 'mi-trends' ); ?></a>
				</div>
			</aside>
		</div>
	</div>
	<?php
endwhile;

get_footer();
