<?php
/**
 * Template Name: Info — Track order
 *
 * TrackOrderBody in app/(store)/info/[slug]/page.tsx.
 *
 * The original derived a fake stage from a hash of the ID. Here the lookup is
 * real: MI Trends Core finds the WooCommerce order by number and checks the
 * billing email (or mobile) before showing anything, so order numbers can't be
 * enumerated. The timeline stages are the same five.
 *
 * @package MI_Trends
 */

defined( 'ABSPATH' ) || exit;

get_header();

// phpcs:disable WordPress.Security.NonceVerification.Recommended -- pre-fill from the order confirmation link only.
$mi_prefill = isset( $_GET['order'] ) ? sanitize_text_field( wp_unslash( $_GET['order'] ) ) : '';
// phpcs:enable

while ( have_posts() ) :
	the_post();
	?>
	<div class="info-page">
		<?php mi_trends_part( 'components/info-header', array( 'post' => get_post() ) ); ?>
		<div class="track-body" data-mi-track>
			<form class="track-form" method="post" data-mi-track-form novalidate>
				<label for="track-order-id"><span><?php esc_html_e( 'Order ID', 'mi-trends' ); ?></span>
					<div class="track-input"><?php mi_trends_icon( 'search', array( 'size' => 16 ) ); ?><input id="track-order-id" name="order" placeholder="<?php esc_attr_e( 'e.g. MIT12345678', 'mi-trends' ); ?>" value="<?php echo esc_attr( $mi_prefill ); ?>"></div>
				</label>
				<label for="track-order-contact"><span><?php esc_html_e( 'Email or mobile', 'mi-trends' ); ?></span>
					<div class="track-input"><?php mi_trends_icon( 'mail', array( 'size' => 16 ) ); ?><input id="track-order-contact" name="contact" autocomplete="email" placeholder="<?php esc_attr_e( 'Used at checkout', 'mi-trends' ); ?>"></div>
				</label>
				<button type="submit"><?php esc_html_e( 'Track order', 'mi-trends' ); ?></button>
			</form>
			<p class="track-error" data-mi-track-error hidden></p>

			<div class="track-result" data-mi-track-result hidden>
				<div class="track-result-head"><strong data-mi-track-id></strong><span data-mi-track-stage></span></div>
				<ol class="track-timeline" data-mi-track-timeline></ol>
				<p class="track-note" data-mi-track-note hidden><?php mi_trends_icon( 'truck', array( 'size' => 15 ) ); ?> <?php esc_html_e( 'We’ll notify you by SMS and email at every step.', 'mi-trends' ); ?></p>
				<p class="track-note" data-mi-track-courier hidden></p>
			</div>

			<p class="track-help">
				<?php
				printf(
					/* translators: %s: contact link */
					esc_html__( 'Don’t have your order ID? Check your confirmation email, or %s.', 'mi-trends' ),
					'<a href="' . esc_url( mi_trends_info_url( 'contact' ) ) . '">' . esc_html__( 'contact support', 'mi-trends' ) . '</a>'
				);
				?>
			</p>
		</div>
	</div>
	<?php
endwhile;

get_footer();
