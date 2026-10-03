<?php
/**
 * Search results.
 *
 * Storefront searches go to the shop with ?q= (as in the original), which MI
 * Trends Core redirects ?s= searches to. This template only shows if that
 * redirect is off, and lists products in the shop grid followed by any pages.
 *
 * @package MI_Trends
 */

defined( 'ABSPATH' ) || exit;

get_header();
?>
<div class="shop-page">
	<div class="shop-crumb">
		<a href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Home', 'mi-trends' ); ?></a>
		<span>/</span>
		<span><?php esc_html_e( 'Search', 'mi-trends' ); ?></span>
	</div>
	<header class="shop-hero">
		<div>
			<span class="eyebrow"><?php esc_html_e( 'Curated for right now', 'mi-trends' ); ?></span>
			<h1><?php echo esc_html( sprintf( /* translators: %s: query */ __( 'Results for “%s”', 'mi-trends' ), get_search_query() ) ); ?></h1>
		</div>
	</header>

	<div class="shop-body">
		<?php if ( have_posts() ) : ?>
			<div class="product-grid">
				<?php
				while ( have_posts() ) :
					the_post();
					if ( 'product' === get_post_type() ) {
						mi_trends_part( 'components/product-card', array( 'product' => get_the_ID() ) );
					} else {
						get_template_part( 'template-parts/content', 'summary' );
					}
				endwhile;
				?>
			</div>
			<?php the_posts_pagination( array( 'class' => 'mi-pagination' ) ); ?>
		<?php else : ?>
			<div class="shop-empty">
				<span><?php esc_html_e( 'Nothing hiding here', 'mi-trends' ); ?></span>
				<h2><?php esc_html_e( 'Try a wider mix.', 'mi-trends' ); ?></h2>
				<p><?php esc_html_e( 'Remove a filter or browse every MI TRENDS piece to get back in the flow.', 'mi-trends' ); ?></p>
				<a href="<?php echo esc_url( mi_trends_shop_url() ); ?>"><?php esc_html_e( 'Browse all styles', 'mi-trends' ); ?></a>
			</div>
		<?php endif; ?>
	</div>
</div>
<?php
get_footer();
