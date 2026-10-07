<?php
/**
 * Shop — app/(store)/shop/page.tsx.
 *
 * Breadcrumb, the uppercase title that reacts to the filters ("The sale edit",
 * "Men's edit", "Results for …"), the style count, sort, the filter token bar
 * and the product grid. Filtering is server-side: MI Trends Core reads the same
 * query parameters the Next.js shop wrote (?category=men&tag=!sale&type=…&q=…)
 * and turns them into the WooCommerce product query, so every view is a
 * shareable URL, as before.
 *
 * @package MI_Trends
 * @version 8.6.0 (WooCommerce template version this override was written against)
 */

defined( 'ABSPATH' ) || exit;

get_header( 'shop' );

$mi_state = function_exists( 'mi_core_shop_state' ) ? mi_core_shop_state() : array(
	'query'              => '',
	'browse_collections' => false,
	'filters'            => array(),
	'fields'             => array(),
	'sort'               => 'popular',
	'sort_options'       => array( 'popular' => __( 'Most popular', 'mi-trends' ) ),
	'title'              => __( 'Shop all', 'mi-trends' ),
	'params'             => array(),
);

global $wp_query;
$mi_total = (int) $wp_query->found_posts;

/**
 * Hidden inputs that repeat the current query (except sort), so the no-JS sort form keeps the filters.
 *
 * @param array $params List of [name, value] pairs.
 */
$mi_hidden_params = static function ( $params ) {
	foreach ( $params as $pair ) {
		if ( 'sort' === $pair[0] || 'paged' === $pair[0] ) {
			continue;
		}
		printf( '<input type="hidden" name="%s" value="%s">', esc_attr( $pair[0] ), esc_attr( $pair[1] ) );
	}
};
?>
<div class="shop-page">
	<div class="shop-crumb">
		<a href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Home', 'mi-trends' ); ?></a>
		<span>/</span>
		<span><?php esc_html_e( 'Shop', 'mi-trends' ); ?></span>
	</div>

	<header class="shop-hero">
		<div>
			<span class="eyebrow"><?php esc_html_e( 'Curated for right now', 'mi-trends' ); ?></span>
			<h1><?php echo esc_html( $mi_state['title'] ); ?></h1>
			<p>
				<?php
				echo esc_html(
					sprintf(
						/* translators: %d: number of styles */
						_n( '%d original style, designed for everyday main-character energy.', '%d original styles, designed for everyday main-character energy.', $mi_total, 'mi-trends' ),
						$mi_total
					)
				);
				?>
			</p>
		</div>
		<form class="sort-wrap" method="get" action="<?php echo esc_url( mi_trends_shop_url() ); ?>" data-mi-sort>
			<?php $mi_hidden_params( $mi_state['params'] ); ?>
			<label for="sort"><?php esc_html_e( 'Sort by', 'mi-trends' ); ?></label>
			<select id="sort" name="sort">
				<?php foreach ( $mi_state['sort_options'] as $mi_value => $mi_label ) : ?>
					<option value="<?php echo esc_attr( $mi_value ); ?>"<?php selected( $mi_state['sort'], $mi_value ); ?>><?php echo esc_html( $mi_label ); ?></option>
				<?php endforeach; ?>
			</select>
			<?php mi_trends_icon( 'chevron-down', array( 'size' => 16 ) ); ?>
			<noscript><button type="submit"><?php esc_html_e( 'Apply', 'mi-trends' ); ?></button></noscript>
		</form>
	</header>

	<?php if ( $mi_state['fields'] ) : ?>
		<div class="filter-rail">
			<?php mi_trends_part( 'components/filter-bar', array( 'state' => $mi_state ) ); ?>
			<?php if ( $mi_state['browse_collections'] && ! array_filter( wp_list_pluck( $mi_state['filters'], 'values' ) ) ) : ?>
				<p class="filter-hint"><?php esc_html_e( 'Pick a collection to see the drop, or add another filter to narrow it further.', 'mi-trends' ); ?></p>
			<?php endif; ?>
		</div>
	<?php endif; ?>

	<div class="mobile-toolbar">
		<form class="mobile-sort" method="get" action="<?php echo esc_url( mi_trends_shop_url() ); ?>" data-mi-sort>
			<?php $mi_hidden_params( $mi_state['params'] ); ?>
			<select aria-label="<?php esc_attr_e( 'Sort products', 'mi-trends' ); ?>" name="sort">
				<?php foreach ( $mi_state['sort_options'] as $mi_value => $mi_label ) : ?>
					<option value="<?php echo esc_attr( $mi_value ); ?>"<?php selected( $mi_state['sort'], $mi_value ); ?>><?php echo esc_html( $mi_label ); ?></option>
				<?php endforeach; ?>
			</select>
			<?php mi_trends_icon( 'chevron-down', array( 'size' => 15 ) ); ?>
		</form>
	</div>

	<div class="shop-body">
		<section aria-live="polite">
			<?php do_action( 'mi_trends_notices' ); ?>
			<?php if ( woocommerce_product_loop() && have_posts() ) : ?>
				<div class="product-grid">
					<?php
					while ( have_posts() ) :
						the_post();
						mi_trends_part( 'components/product-card', array( 'product' => get_the_ID() ) );
					endwhile;
					?>
				</div>
				<?php
				$mi_links = paginate_links(
					array(
						'total'     => (int) $wp_query->max_num_pages,
						'current'   => max( 1, (int) get_query_var( 'paged' ) ),
						'type'      => 'array',
						'prev_text' => '‹',
						'next_text' => '›',
					)
				);
				if ( $mi_links ) {
					echo '<nav class="mi-pagination" aria-label="' . esc_attr__( 'Shop pages', 'mi-trends' ) . '">' . wp_kses_post( implode( '', $mi_links ) ) . '</nav>';
				}
				?>
			<?php else : ?>
				<div class="shop-empty">
					<span><?php esc_html_e( 'Nothing hiding here', 'mi-trends' ); ?></span>
					<h2><?php esc_html_e( 'Try a wider mix.', 'mi-trends' ); ?></h2>
					<p><?php esc_html_e( 'Remove a filter or browse every MI TRENDS piece to get back in the flow.', 'mi-trends' ); ?></p>
					<a href="<?php echo esc_url( mi_trends_shop_url() ); ?>"><?php esc_html_e( 'Reset filters', 'mi-trends' ); ?></a>
				</div>
			<?php endif; ?>
		</section>
	</div>
</div>
<?php
get_footer( 'shop' );
