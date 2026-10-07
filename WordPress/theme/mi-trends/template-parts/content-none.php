<?php
/**
 * Nothing found — the original's "Can't find that page" panel.
 *
 * @package MI_Trends
 */

defined( 'ABSPATH' ) || exit;
?>
<section class="not-found">
	<span><?php esc_html_e( '404 · Page moved on', 'mi-trends' ); ?></span>
	<h1><?php esc_html_e( 'Can’t find that page.', 'mi-trends' ); ?></h1>
	<p><?php esc_html_e( 'It may have been renamed. Here are a few places to go instead.', 'mi-trends' ); ?></p>
	<div class="not-found-links">
		<a href="<?php echo esc_url( mi_trends_info_url( 'faqs' ) ); ?>"><?php esc_html_e( 'FAQs', 'mi-trends' ); ?></a>
		<a href="<?php echo esc_url( mi_trends_info_url( 'contact' ) ); ?>"><?php esc_html_e( 'Contact us', 'mi-trends' ); ?></a>
		<a href="<?php echo esc_url( mi_trends_shop_url() ); ?>"><?php esc_html_e( 'Shop', 'mi-trends' ); ?></a>
	</div>
</section>
