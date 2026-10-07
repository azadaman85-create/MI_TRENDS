<?php
/**
 * Default page — the info-page layout (InfoHeader + cards).
 *
 * The page title becomes the big uppercase headline; put a line break in it with
 * a "|" (e.g. "MADE TO BE|NOTICED."). The eyebrow and intro come from the page's
 * "MI TRENDS page header" fields (added by MI Trends Core) or, failing that,
 * the excerpt. Content in Group blocks is drawn as the original's bordered cards.
 *
 * WooCommerce's own pages (Cart, Checkout, My account) bring their full
 * layouts from the woocommerce/ templates, so they are printed bare.
 *
 * @package MI_Trends
 */

defined( 'ABSPATH' ) || exit;

get_header();

$mi_is_wc_page = function_exists( 'is_cart' ) && ( is_cart() || is_checkout() || is_account_page() );

while ( have_posts() ) :
	the_post();

	if ( $mi_is_wc_page ) {
		the_content();
		continue;
	}
	?>
	<div class="info-page">
		<?php mi_trends_part( 'components/info-header', array( 'post' => get_post() ) ); ?>
		<div class="simple-body">
			<?php the_content(); ?>
		</div>
		<?php
		wp_link_pages();
		if ( comments_open() || get_comments_number() ) {
			comments_template();
		}
		?>
	</div>
	<?php
endwhile;

get_footer();
