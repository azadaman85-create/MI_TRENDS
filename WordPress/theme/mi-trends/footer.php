<?php
/**
 * Site footer — Footer.tsx, followed by the overlays the store layout mounts
 * (cart drawer, search, mobile nav, mobile tab bar) — app/(store)/layout.tsx.
 *
 * @package MI_Trends
 */

defined( 'ABSPATH' ) || exit;
?>
</main>

<footer class="site-footer">
	<?php mi_trends_part( 'components/newsletter' ); ?>

	<div class="footer-main shell">
		<div class="footer-brand-column">
			<?php mi_trends_brand_lockup( array( 'class' => 'footer-brand' ) ); ?>
			<p><?php esc_html_e( 'Original graphics and easygoing essentials, designed in India for people who dress like themselves.', 'mi-trends' ); ?></p>
			<div class="social-links" aria-label="<?php esc_attr_e( 'MI TRENDS social channels', 'mi-trends' ); ?>">
				<?php
				$mi_socials = apply_filters(
					'mi_trends_social_links',
					array(
						array( 'url' => 'https://www.instagram.com/', 'label' => __( 'MI TRENDS on Instagram', 'mi-trends' ), 'short' => 'IG' ),
						array( 'url' => 'https://www.youtube.com/', 'label' => __( 'MI TRENDS on YouTube', 'mi-trends' ), 'short' => 'YT' ),
						array( 'url' => 'https://www.linkedin.com/', 'label' => __( 'MI TRENDS on LinkedIn', 'mi-trends' ), 'short' => 'in' ),
					)
				);
				foreach ( $mi_socials as $mi_social ) :
					?>
					<a class="icon-button" href="<?php echo esc_url( $mi_social['url'] ); ?>" target="_blank" rel="noreferrer" aria-label="<?php echo esc_attr( $mi_social['label'] ); ?>">
						<span aria-hidden="true"><?php echo esc_html( $mi_social['short'] ); ?></span>
					</a>
				<?php endforeach; ?>
			</div>
		</div>

		<nav class="footer-navigation" aria-label="<?php esc_attr_e( 'Footer navigation', 'mi-trends' ); ?>">
			<?php foreach ( mi_trends_footer_columns() as $mi_location => $mi_heading ) : ?>
				<div class="footer-link-column">
					<h2><?php echo esc_html( $mi_heading ); ?></h2>
					<ul>
						<?php foreach ( mi_trends_menu_links( $mi_location ) as $mi_link ) : ?>
							<li><a href="<?php echo esc_url( $mi_link['url'] ); ?>"><?php echo esc_html( $mi_link['label'] ); ?></a></li>
						<?php endforeach; ?>
					</ul>
				</div>
			<?php endforeach; ?>
		</nav>
	</div>

	<div class="footer-confidence shell">
		<div>
			<span class="footer-small-heading"><?php esc_html_e( 'Pay your way', 'mi-trends' ); ?></span>
			<div class="payment-method-list" aria-label="<?php esc_attr_e( 'Accepted payment methods', 'mi-trends' ); ?>">
				<span>UPI</span>
				<span>Google Pay</span>
				<span>PhonePe</span>
				<span>COD</span>
			</div>
		</div>
		<p>
			<?php esc_html_e( 'Secure checkout', 'mi-trends' ); ?> <span aria-hidden="true">·</span>
			<?php esc_html_e( '30-day returns', 'mi-trends' ); ?> <span aria-hidden="true">·</span>
			<?php esc_html_e( 'Human support', 'mi-trends' ); ?>
		</p>
	</div>

	<div class="footer-legal shell">
		<p>
			<?php
			/* translators: %s: year */
			echo esc_html( sprintf( __( '© %s MI TRENDS. Built for original expression.', 'mi-trends' ), wp_date( 'Y' ) ) );
			?>
		</p>
		<p><?php esc_html_e( 'Made with care in India.', 'mi-trends' ); ?></p>
	</div>

	<button class="back-to-top" type="button" aria-label="<?php esc_attr_e( 'Back to top', 'mi-trends' ); ?>" data-mi-back-to-top hidden>
		<?php mi_trends_icon( 'arrow-up', array( 'size' => 19 ) ); ?>
	</button>
</footer>

<?php
mi_trends_part( 'components/cart-drawer' );
mi_trends_part( 'components/search-overlay' );
mi_trends_part( 'components/mobile-nav' );
if ( ! mi_trends_hide_tab_bar() ) {
	mi_trends_part( 'components/mobile-tab-bar' );
}
?>
<div data-mi-toast-root></div>

<?php wp_footer(); ?>
</body>
</html>
