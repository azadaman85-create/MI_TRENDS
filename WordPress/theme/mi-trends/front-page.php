<?php
/**
 * Homepage — app/(store)/page.tsx.
 *
 * Mobile story strip, hero carousel, coupon ticker, mobile feed tabs, desktop
 * category rail, Trending, editorial cards, New drops, USP strip, Under ₹799,
 * Shop the edits. Section order, copy and classes match the original.
 *
 * Product lists come from MI Trends Core (mi_core_home_products) using the same
 * rules as the original: trending = popularity (9), new = tagged "new" (8),
 * deals = price ≤ ₹799, or the cheapest pieces if fewer than six (9),
 * shirts = product type "Shirt" (8).
 *
 * @package MI_Trends
 */

defined( 'ABSPATH' ) || exit;

get_header();

if ( function_exists( 'mi_core_home_products' ) ) {
	$mi_lists = mi_core_home_products();
} else {
	$mi_ids   = function_exists( 'wc_get_products' ) ? wc_get_products( array( 'limit' => 9, 'orderby' => 'popularity', 'return' => 'ids', 'status' => 'publish' ) ) : array();
	$mi_lists = array( 'trending' => $mi_ids, 'new' => array_slice( $mi_ids, 0, 8 ), 'deals' => $mi_ids, 'shirts' => array_slice( $mi_ids, 0, 8 ) );
}

$mi_views = array();
foreach ( $mi_lists as $mi_key => $mi_ids ) {
	$mi_views[ $mi_key ] = array_values( array_filter( array_map( 'mi_trends_product_view', $mi_ids ) ) );
}

$mi_slides     = mi_trends_hero_slides();
$mi_categories = mi_trends_home_categories();
$mi_feed_tabs  = array(
	'trending' => __( '🔥 Trending', 'mi-trends' ),
	'new'      => __( '✨ New Drops', 'mi-trends' ),
	'deals'    => __( '🏷️ Under ₹799', 'mi-trends' ),
	'shirts'   => __( '👔 Shirts', 'mi-trends' ),
);
?>

<?php // Mobile-first stories / category capsules. ?>
<section class="mobile-story-strip" aria-label="<?php esc_attr_e( 'Browse categories', 'mi-trends' ); ?>">
	<div class="mobile-story-rail">
		<?php foreach ( $mi_categories as $mi_cat ) : ?>
			<a href="<?php echo esc_url( $mi_cat['href'] ); ?>" class="mobile-story-item">
				<span class="mobile-story-avatar mobile-story-avatar--<?php echo esc_attr( $mi_cat['tone'] ); ?>" aria-hidden="true">
					<img src="<?php echo esc_url( $mi_cat['image'] ); ?>" alt="<?php echo esc_attr( $mi_cat['label'] ); ?>" class="mobile-story-photo" loading="lazy">
				</span>
				<span class="mobile-story-label"><?php echo esc_html( $mi_cat['label'] ); ?></span>
			</a>
		<?php endforeach; ?>
	</div>
</section>

<?php // Hero carousel. ?>
<section class="hero" aria-roledescription="carousel" aria-label="<?php esc_attr_e( 'Featured collections', 'mi-trends' ); ?>" data-mi-hero>
	<div class="hero-track" style="transform:translateX(0%)">
		<?php foreach ( $mi_slides as $mi_i => $mi_slide ) : ?>
			<article class="hero-slide" aria-hidden="<?php echo 0 === $mi_i ? 'false' : 'true'; ?>"
				style="<?php echo esc_attr( sprintf( '--hero-main:%s;--hero-accent:%s;--hero-ink:%s', $mi_slide['palette'][0], $mi_slide['palette'][1], $mi_slide['palette'][2] ) ); ?>">
				<div class="hero-copy">
					<p class="hero-kicker"><?php mi_trends_icon( 'sparkles', array( 'size' => 15 ) ); ?> <?php echo esc_html( $mi_slide['kicker'] ); ?></p>
					<h1>
						<?php foreach ( explode( "\n", $mi_slide['title'] ) as $mi_line ) : ?>
							<span><?php echo esc_html( $mi_line ); ?></span>
						<?php endforeach; ?>
					</h1>
					<p><?php echo esc_html( $mi_slide['copy'] ); ?></p>
					<a href="<?php echo esc_url( $mi_slide['href'] ); ?>" class="button button--ink" tabindex="<?php echo 0 === $mi_i ? '0' : '-1'; ?>">
						<?php echo esc_html( $mi_slide['cta'] ); ?> <?php mi_trends_icon( 'arrow-right', array( 'size' => 18 ) ); ?>
					</a>
				</div>
				<div class="hero-art">
					<div class="hero-art-media">
						<div class="hero-art-frame">
							<img src="<?php echo esc_url( $mi_slide['image'] ); ?>" alt="<?php echo esc_attr( str_replace( "\n", ' ', $mi_slide['title'] ) ); ?>" class="hero-art-img"<?php echo 0 === $mi_i ? ' fetchpriority="high"' : ' loading="lazy"'; ?>>
							<div class="hero-art-badge">
								<span class="hero-art-badge__num"><?php echo esc_html( $mi_slide['word'] ); ?></span>
								<span class="hero-art-badge__sub">MI TRENDS</span>
							</div>
							<div class="hero-art-tag"><span><?php esc_html_e( 'ORIGINAL STREETWEAR', 'mi-trends' ); ?></span></div>
						</div>
					</div>
				</div>
			</article>
		<?php endforeach; ?>
	</div>
	<button type="button" class="hero-arrow hero-arrow--prev" data-mi-hero-move="-1" aria-label="<?php esc_attr_e( 'Previous hero slide', 'mi-trends' ); ?>"><?php mi_trends_icon( 'chevron-left' ); ?></button>
	<button type="button" class="hero-arrow hero-arrow--next" data-mi-hero-move="1" aria-label="<?php esc_attr_e( 'Next hero slide', 'mi-trends' ); ?>"><?php mi_trends_icon( 'chevron-right' ); ?></button>
	<div class="hero-dots" role="tablist" aria-label="<?php esc_attr_e( 'Choose a hero slide', 'mi-trends' ); ?>">
		<?php foreach ( $mi_slides as $mi_i => $mi_slide ) : ?>
			<button type="button" role="tab" aria-selected="<?php echo 0 === $mi_i ? 'true' : 'false'; ?>" data-mi-hero-go="<?php echo (int) $mi_i; ?>"
				aria-label="<?php echo esc_attr( sprintf( /* translators: %d: slide */ __( 'Show slide %d', 'mi-trends' ), $mi_i + 1 ) ); ?>">
				<span style="transform:<?php echo 0 === $mi_i ? 'scaleX(1)' : 'scaleX(0)'; ?>"></span>
			</button>
		<?php endforeach; ?>
	</div>
</section>

<?php // Mobile in-app coupon ticker. ?>
<div class="mobile-coupon-strip shell">
	<button type="button" class="mobile-coupon-btn" data-mi-copy-coupon="MI10" aria-label="<?php esc_attr_e( 'Copy coupon code MI10 for 10% off', 'mi-trends' ); ?>">
		<span class="mobile-coupon-tag">
			<?php mi_trends_icon( 'tag', array( 'size' => 15 ) ); ?>
			<span><?php esc_html_e( 'EXTRA 10% OFF · CODE:', 'mi-trends' ); ?> <b>MI10</b></span>
		</span>
		<span class="mobile-coupon-action" data-mi-coupon-state="idle"><?php mi_trends_icon( 'copy', array( 'size' => 14 ) ); ?> <?php esc_html_e( 'TAP TO COPY', 'mi-trends' ); ?></span>
		<span class="mobile-coupon-action" data-mi-coupon-state="done" hidden><?php mi_trends_icon( 'check', array( 'size' => 14 ) ); ?> <?php esc_html_e( 'COPIED', 'mi-trends' ); ?></span>
	</button>
</div>

<?php // Mobile interactive feed tabs. ?>
<section class="mobile-feed-section shell" aria-label="<?php esc_attr_e( 'Quick browse styles', 'mi-trends' ); ?>" data-mi-feed>
	<div class="mobile-feed-tabs" role="tablist" aria-label="<?php esc_attr_e( 'Product categories', 'mi-trends' ); ?>">
		<?php foreach ( $mi_feed_tabs as $mi_tab => $mi_label ) : ?>
			<button type="button" role="tab" data-mi-feed-tab="<?php echo esc_attr( $mi_tab ); ?>" aria-selected="<?php echo 'trending' === $mi_tab ? 'true' : 'false'; ?>"
				class="mobile-feed-tab<?php echo 'trending' === $mi_tab ? ' is-active' : ''; ?>"><?php echo esc_html( $mi_label ); ?></button>
		<?php endforeach; ?>
	</div>

	<?php foreach ( array_keys( $mi_feed_tabs ) as $mi_tab ) : ?>
		<div class="product-grid product-grid--mobile-feed" data-mi-feed-panel="<?php echo esc_attr( $mi_tab ); ?>"<?php echo 'trending' === $mi_tab ? '' : ' hidden'; ?>>
			<?php
			$mi_list = 'trending' === $mi_tab ? array_slice( $mi_views['trending'], 0, 8 ) : $mi_views[ $mi_tab ];
			foreach ( $mi_list as $mi_view ) {
				mi_trends_part( 'components/product-card', array( 'view' => $mi_view ) );
			}
			?>
		</div>
	<?php endforeach; ?>

	<div class="mobile-view-all-wrap">
		<a href="<?php echo esc_url( mi_trends_shop_url() ); ?>" class="mobile-view-all-btn"><?php esc_html_e( 'Explore all styles in shop', 'mi-trends' ); ?> <?php mi_trends_icon( 'arrow-right', array( 'size' => 16 ) ); ?></a>
	</div>
</section>

<?php // Desktop category rail. ?>
<section class="page-shell home-section category-section desktop-only-section" aria-labelledby="category-title">
	<?php mi_trends_part( 'components/section-heading', array( 'eyebrow' => __( 'Find your thing', 'mi-trends' ), 'title' => __( 'SHOP BY CATEGORY', 'mi-trends' ), 'href' => mi_trends_shop_url() ) ); ?>
	<div class="category-rail" id="category-title">
		<?php foreach ( $mi_categories as $mi_cat ) : ?>
			<a href="<?php echo esc_url( $mi_cat['href'] ); ?>" class="category-bubble">
				<span class="category-bubble__art category-bubble__art--<?php echo esc_attr( $mi_cat['tone'] ); ?>" aria-hidden="true">
					<img src="<?php echo esc_url( $mi_cat['image'] ); ?>" alt="<?php echo esc_attr( $mi_cat['label'] ); ?>" class="category-bubble__photo" loading="lazy">
				</span>
				<strong><?php echo esc_html( $mi_cat['label'] ); ?></strong>
			</a>
		<?php endforeach; ?>
	</div>
</section>

<section class="page-shell home-section">
	<?php mi_trends_part( 'components/section-heading', array( 'eyebrow' => __( 'Crowd favourites', 'mi-trends' ), 'title' => __( 'TRENDING RIGHT NOW', 'mi-trends' ), 'href' => mi_trends_shop_url( array( 'sort' => 'popular' ) ) ) ); ?>
	<div class="product-rail">
		<?php foreach ( $mi_views['trending'] as $mi_view ) : ?>
			<?php mi_trends_part( 'components/product-card', array( 'view' => $mi_view ) ); ?>
		<?php endforeach; ?>
	</div>
</section>

<section class="page-shell home-section">
	<div class="editorial-grid">
		<?php foreach ( mi_trends_home_editorials() as $mi_ed ) : ?>
			<a href="<?php echo esc_url( $mi_ed['href'] ); ?>" class="editorial-card <?php echo esc_attr( $mi_ed['class'] ); ?>">
				<img src="<?php echo esc_url( $mi_ed['image'] ); ?>" alt="<?php echo esc_attr( $mi_ed['title'] ); ?>" class="editorial-card__bg-image" loading="lazy">
				<div class="editorial-card__art" aria-hidden="true">
					<span><?php echo esc_html( $mi_ed['art'] ); ?></span>
					<i></i><b></b>
				</div>
				<div class="editorial-card__copy">
					<p><?php echo esc_html( $mi_ed['overline'] ); ?></p>
					<h3><?php echo esc_html( $mi_ed['title'] ); ?></h3>
					<span><?php echo esc_html( $mi_ed['copy'] ); ?> <?php mi_trends_icon( 'arrow-right', array( 'size' => 17 ) ); ?></span>
				</div>
			</a>
		<?php endforeach; ?>
	</div>
</section>

<section class="page-shell home-section">
	<?php mi_trends_part( 'components/section-heading', array( 'eyebrow' => __( 'Just landed', 'mi-trends' ), 'title' => __( 'NEW DROPS', 'mi-trends' ), 'href' => mi_trends_shop_url( array( 'sort' => 'newest' ) ), 'link_label' => __( 'Shop new', 'mi-trends' ) ) ); ?>
	<div class="product-grid product-grid--home">
		<?php foreach ( $mi_views['new'] as $mi_view ) : ?>
			<?php mi_trends_part( 'components/product-card', array( 'view' => $mi_view ) ); ?>
		<?php endforeach; ?>
	</div>
</section>

<section class="usp-strip" aria-label="<?php esc_attr_e( 'Shopping benefits', 'mi-trends' ); ?>">
	<div class="page-shell usp-strip__inner">
		<div><?php mi_trends_icon( 'truck' ); ?><span><strong><?php esc_html_e( 'Free shipping', 'mi-trends' ); ?></strong><small><?php echo esc_html( sprintf( /* translators: %s: amount */ __( 'On orders above %s', 'mi-trends' ), mi_trends_money( mi_trends_setting( 'free_shipping_threshold' ) ) ) ); ?></small></span></div>
		<div><?php mi_trends_icon( 'rotate-ccw' ); ?><span><strong><?php esc_html_e( 'Easy returns', 'mi-trends' ); ?></strong><small><?php esc_html_e( '30 days, no drama', 'mi-trends' ); ?></small></span></div>
		<div><?php mi_trends_icon( 'wallet-cards' ); ?><span><strong><?php esc_html_e( 'Pay your way', 'mi-trends' ); ?></strong><small><?php esc_html_e( 'UPI, cards & COD', 'mi-trends' ); ?></small></span></div>
		<div><?php mi_trends_icon( 'shield-check' ); ?><span><strong><?php esc_html_e( 'Secure checkout', 'mi-trends' ); ?></strong><small><?php esc_html_e( 'Protected every time', 'mi-trends' ); ?></small></span></div>
	</div>
</section>

<section class="page-shell home-section">
	<?php mi_trends_part( 'components/section-heading', array( 'eyebrow' => __( 'Big mood, small price', 'mi-trends' ), 'title' => __( 'UNDER ₹799', 'mi-trends' ), 'href' => mi_trends_shop_url( array( 'maxPrice' => '799' ) ) ) ); ?>
	<div class="product-rail">
		<?php foreach ( $mi_views['deals'] as $mi_view ) : ?>
			<?php mi_trends_part( 'components/product-card', array( 'view' => $mi_view, 'compact' => true ) ); ?>
		<?php endforeach; ?>
	</div>
</section>

<section class="page-shell home-section home-section--last">
	<?php mi_trends_part( 'components/section-heading', array( 'eyebrow' => __( 'Two worlds. One wardrobe.', 'mi-trends' ), 'title' => __( 'SHOP THE EDITS', 'mi-trends' ), 'href' => mi_trends_shop_url() ) ); ?>
	<div class="collection-grid">
		<?php foreach ( mi_trends_home_collection_tiles() as $mi_n => $mi_tile ) : ?>
			<a href="<?php echo esc_url( $mi_tile['href'] ); ?>" class="collection-tile <?php echo esc_attr( $mi_tile['tone'] ); ?>">
				<span class="collection-tile__index">0<?php echo (int) $mi_n + 1; ?></span>
				<div class="collection-tile__motif" aria-hidden="true"><i></i><b></b><em></em></div>
				<div><h3><?php echo esc_html( $mi_tile['title'] ); ?></h3><p><?php echo esc_html( $mi_tile['copy'] ); ?></p></div>
				<?php mi_trends_icon( 'arrow-right' ); ?>
			</a>
		<?php endforeach; ?>
	</div>
</section>

<?php
get_footer();
