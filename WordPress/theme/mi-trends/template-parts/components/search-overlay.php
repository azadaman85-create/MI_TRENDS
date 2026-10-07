<?php
/**
 * Search overlay — SearchOverlay.tsx.
 *
 * Kept in a <template> and mounted on open (press "/" anywhere, or any search
 * trigger). Typing queries GET /wp-json/mi-trends/v1/search; submitting goes to
 * the shop with ?q=, exactly like the original.
 *
 * @package MI_Trends
 */

defined( 'ABSPATH' ) || exit;

$mi_trending = apply_filters( 'mi_trends_trending_searches', array( 'Oversized tees', 'Graphic tees', 'Hoodies', 'Sneakers' ) );

// "Popular right now": the six most popular products, rendered up front.
$mi_popular = array();
if ( function_exists( 'wc_get_products' ) ) {
	$mi_popular_ids = function_exists( 'mi_core_popular_product_ids' )
		? mi_core_popular_product_ids( 6 )
		: wc_get_products( array( 'limit' => 6, 'orderby' => 'popularity', 'return' => 'ids', 'status' => 'publish' ) );
	foreach ( $mi_popular_ids as $mi_id ) {
		$mi_view = mi_trends_product_view( $mi_id );
		if ( $mi_view ) {
			$mi_popular[] = $mi_view;
		}
	}
}
?>
<template data-mi-template="search">
	<section class="search-overlay" role="dialog" aria-modal="true" aria-labelledby="search-overlay-title">
		<header class="search-overlay-header shell">
			<?php mi_trends_brand_lockup(); ?>
			<button class="icon-button search-close" type="button" data-mi-close aria-label="<?php esc_attr_e( 'Close search', 'mi-trends' ); ?>">
				<?php mi_trends_icon( 'x', array( 'size' => 24 ) ); ?>
			</button>
		</header>

		<div class="search-overlay-content shell">
			<div class="search-intro">
				<p class="eyebrow"><?php esc_html_e( 'Find your next repeat-wear', 'mi-trends' ); ?></p>
				<h2 id="search-overlay-title"><?php esc_html_e( 'What are you looking for?', 'mi-trends' ); ?></h2>
			</div>

			<form class="search-form" role="search" method="get" action="<?php echo esc_url( mi_trends_shop_url() ); ?>" data-mi-search-form>
				<?php mi_trends_icon( 'search', array( 'size' => 22, 'class' => 'search-form-icon' ) ); ?>
				<label class="sr-only" for="global-product-search"><?php esc_html_e( 'Search products and collections', 'mi-trends' ); ?></label>
				<input id="global-product-search" type="search" name="q" placeholder="<?php esc_attr_e( 'Search tees, collections, colours...', 'mi-trends' ); ?>" autocomplete="off" aria-controls="search-suggestions">
				<button class="search-clear-button" type="button" data-mi-search-clear hidden aria-label="<?php esc_attr_e( 'Clear search', 'mi-trends' ); ?>"><?php esc_html_e( 'Clear', 'mi-trends' ); ?></button>
			</form>

			<div class="trending-searches" aria-label="<?php esc_attr_e( 'Trending searches', 'mi-trends' ); ?>">
				<span class="trending-searches-label"><?php mi_trends_icon( 'trending-up', array( 'size' => 16 ) ); ?><?php esc_html_e( 'Trending', 'mi-trends' ); ?></span>
				<div class="search-chip-list">
					<?php foreach ( $mi_trending as $mi_term ) : ?>
						<button class="search-chip" type="button" data-mi-search-chip="<?php echo esc_attr( $mi_term ); ?>"><?php echo esc_html( $mi_term ); ?></button>
					<?php endforeach; ?>
				</div>
			</div>

			<div class="search-results" id="search-suggestions" aria-live="polite" data-mi-search-results>
				<div class="search-results-heading">
					<h3 data-mi-search-heading><?php esc_html_e( 'Popular right now', 'mi-trends' ); ?></h3>
					<button class="text-link" type="button" data-mi-search-all hidden>
						<?php esc_html_e( 'See all results', 'mi-trends' ); ?>
						<?php mi_trends_icon( 'arrow-right', array( 'size' => 16 ) ); ?>
					</button>
				</div>

				<ul class="search-suggestion-list" data-mi-search-list>
					<?php foreach ( $mi_popular as $mi_view ) : ?>
						<?php mi_trends_part( 'components/search-suggestion', array( 'view' => $mi_view ) ); ?>
					<?php endforeach; ?>
				</ul>

				<div class="search-empty-state" data-mi-search-empty hidden>
					<h3><?php esc_html_e( 'No exact match yet', 'mi-trends' ); ?></h3>
					<p><?php esc_html_e( 'Try a product type, colour, or collection name—or browse the full drop.', 'mi-trends' ); ?></p>
					<a class="button button-secondary" href="<?php echo esc_url( mi_trends_shop_url() ); ?>"><?php esc_html_e( 'Browse all styles', 'mi-trends' ); ?></a>
				</div>
			</div>
		</div>
	</section>
</template>

<template data-mi-template="search-suggestion">
	<?php
	// Blank row the script fills from the REST response.
	mi_trends_part( 'components/search-suggestion', array( 'view' => null ) );
	?>
</template>
