<?php
/**
 * Product detail — app/(store)/product/[slug]/page.tsx.
 *
 * Mapping to WooCommerce: each MI TRENDS product is a variable product whose
 * variations are sizes (pa_size), each with its own stock. Colour is a choice
 * the shopper makes on top of the size (MI Trends Core stores it on the cart
 * line and the order item), exactly as the original kept stock per size and
 * colour as a line attribute.
 *
 * Works without JavaScript: the form posts to WooCommerce's standard
 * add-to-cart handler. With JavaScript it adds through AJAX and opens the bag.
 *
 * @package MI_Trends
 * @version 1.6.4 (WooCommerce template version this override was written against)
 */

defined( 'ABSPATH' ) || exit;

get_header( 'shop' );

while ( have_posts() ) :
	the_post();

	$mi_product = wc_get_product( get_the_ID() );
	$mi_v       = $mi_product ? mi_trends_product_view( $mi_product ) : null;

	if ( ! $mi_v ) :
		?>
		<section class="not-found">
			<span><?php esc_html_e( '404 · Off the rack', 'mi-trends' ); ?></span>
			<h1><?php esc_html_e( 'This style moved on.', 'mi-trends' ); ?></h1>
			<p><?php esc_html_e( 'It may be sold out or renamed. The newest drop is waiting in the shop.', 'mi-trends' ); ?></p>
			<div class="not-found-links"><a href="<?php echo esc_url( mi_trends_shop_url() ); ?>"><?php esc_html_e( 'Explore all styles', 'mi-trends' ); ?></a></div>
		</section>
		<?php
		continue;
	endif;

	$mi_views     = array(
		array( 'front', __( 'Front', 'mi-trends' ) ),
		array( 'back', __( 'Back', 'mi-trends' ) ),
		array( 'detail', __( 'Fabric detail', 'mi-trends' ) ),
		array( 'flat', __( 'Styled', 'mi-trends' ) ),
	);
	$mi_saved     = in_array( (int) $mi_v['id'], mi_trends_wishlist_ids(), true );
	$mi_one_size  = 1 === count( $mi_v['sizes'] ) ? $mi_v['sizes'][0] : '';
	$mi_related   = function_exists( 'mi_core_related_ids' ) ? mi_core_related_ids( $mi_v['id'], 4 ) : wc_get_related_products( $mi_v['id'], 4 );
	$mi_cat_label = $mi_v['category'];
	$mi_offers    = apply_filters(
		'mi_trends_pdp_offers',
		array(
			array( __( 'First fit, better price', 'mi-trends' ), __( '15% off up to ₹400 on orders over ₹999.', 'mi-trends' ), 'FIRST15' ),
			array( __( 'Stack your wardrobe', 'mi-trends' ), __( 'Flat ₹200 off when your bag crosses ₹1,499.', 'mi-trends' ), 'FLAT200' ),
		)
	);
	?>
	<div class="pdp" data-mi-pdp data-product-id="<?php echo (int) $mi_v['id']; ?>">
		<?php do_action( 'woocommerce_before_single_product' ); ?>
		<?php do_action( 'mi_trends_notices' ); ?>

		<nav class="crumb" aria-label="<?php esc_attr_e( 'Breadcrumb', 'mi-trends' ); ?>">
			<a href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Home', 'mi-trends' ); ?></a><span>/</span>
			<a href="<?php echo esc_url( mi_trends_shop_url( array( 'category' => $mi_v['category'] ) ) ); ?>"><?php echo esc_html( $mi_cat_label ); ?></a><span>/</span>
			<span><?php echo esc_html( $mi_v['name'] ); ?></span>
		</nav>

		<div class="pdp-main">
			<section class="gallery" aria-label="<?php esc_attr_e( 'Product gallery', 'mi-trends' ); ?>">
				<div class="thumbs">
					<?php foreach ( $mi_views as $mi_i => $mi_view_def ) : ?>
						<button type="button" class="<?php echo 0 === $mi_i ? 'active' : ''; ?>" data-mi-view="<?php echo (int) $mi_i; ?>"
							aria-label="<?php echo esc_attr( sprintf( /* translators: %s: view */ __( 'View %s', 'mi-trends' ), strtolower( $mi_view_def[1] ) ) ); ?>">
							<?php mi_trends_product_visual( $mi_v, array( 'view' => $mi_view_def[0] ) ); ?>
							<span><?php echo esc_html( $mi_view_def[1] ); ?></span>
						</button>
					<?php endforeach; ?>
				</div>
				<div class="hero-visual view-0" data-mi-main-visual>
					<?php foreach ( $mi_views as $mi_i => $mi_view_def ) : ?>
						<?php
						$mi_svg = mi_trends_get_product_visual( $mi_v, array( 'view' => $mi_view_def[0] ) );
						if ( $mi_i > 0 ) {
							$mi_svg = preg_replace( '/^<svg /', '<svg hidden ', $mi_svg, 1 );
						}
						echo $mi_svg; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped while built.
						?>
					<?php endforeach; ?>
					<span class="view-label" data-mi-view-label><?php echo esc_html( $mi_views[0][1] ); ?></span>
					<?php if ( ! empty( $mi_v['tags'][0] ) ) : ?>
						<span class="product-badge"><?php echo esc_html( $mi_v['tags'][0] ); ?></span>
					<?php endif; ?>
					<button class="gallery-heart<?php echo $mi_saved ? ' saved' : ''; ?>" type="button" data-mi-wishlist="<?php echo (int) $mi_v['id']; ?>"
						aria-label="<?php echo $mi_saved ? esc_attr__( 'Remove from wishlist', 'mi-trends' ) : esc_attr__( 'Add to wishlist', 'mi-trends' ); ?>">
						<?php mi_trends_icon( 'heart', array( 'size' => 20, 'fill' => $mi_saved ? 'currentColor' : 'none' ) ); ?>
					</button>
				</div>
			</section>

			<section class="details">
				<a class="collection" href="<?php echo esc_url( $mi_v['collection_url'] ); ?>"><?php echo esc_html( $mi_v['collection'] ); ?></a>
				<h1><?php echo esc_html( $mi_v['name'] ); ?></h1>
				<div class="social-proof">
					<span class="rating"><?php mi_trends_icon( 'star', array( 'size' => 13, 'fill' => 'currentColor' ) ); ?> <?php echo esc_html( $mi_v['rating'] ); ?></span>
					<span><?php echo esc_html( sprintf( /* translators: %s: count */ __( '%s reviews', 'mi-trends' ), number_format_i18n( $mi_v['review_count'] ) ) ); ?></span>
					<i></i>
					<span class="selling-fast"><?php mi_trends_icon( 'sparkles', array( 'size' => 13 ) ); ?> <?php esc_html_e( 'Selling fast', 'mi-trends' ); ?></span>
				</div>

				<div class="price-block">
					<strong><?php echo esc_html( mi_trends_money( $mi_v['price'] ) ); ?></strong>
					<?php if ( $mi_v['mrp'] > $mi_v['price'] ) : ?>
						<del><?php echo esc_html( mi_trends_money( $mi_v['mrp'] ) ); ?></del>
						<span><?php echo esc_html( sprintf( /* translators: %d: percent */ __( '%d%% off', 'mi-trends' ), $mi_v['discount'] ) ); ?></span>
					<?php endif; ?>
				</div>
				<p class="tax-note"><?php esc_html_e( 'Inclusive of all taxes', 'mi-trends' ); ?></p>

				<form class="mi-buy-form" method="post" action="<?php echo esc_url( get_permalink() ); ?>" enctype="multipart/form-data" data-mi-buy-form novalidate>
					<input type="hidden" name="add-to-cart" value="<?php echo (int) $mi_v['id']; ?>">
					<input type="hidden" name="product_id" value="<?php echo (int) $mi_v['id']; ?>">
					<input type="hidden" name="variation_id" value="<?php echo $mi_one_size && isset( $mi_v['variations'][ $mi_one_size ] ) ? (int) $mi_v['variations'][ $mi_one_size ] : 0; ?>" data-mi-variation-id>
					<input type="hidden" name="attribute_pa_size" value="<?php echo esc_attr( $mi_one_size ? sanitize_title( $mi_one_size ) : '' ); ?>" data-mi-size-input>
					<input type="hidden" name="mi_color" value="<?php echo esc_attr( isset( $mi_v['colors'][0]['name'] ) ? $mi_v['colors'][0]['name'] : '' ); ?>" data-mi-color-input>
					<input type="hidden" name="quantity" value="1" data-mi-qty-input>

					<div class="selection-block">
						<div class="selection-label"><strong><?php esc_html_e( 'Colour', 'mi-trends' ); ?></strong><span data-mi-color-name><?php echo esc_html( isset( $mi_v['colors'][0]['name'] ) ? $mi_v['colors'][0]['name'] : '' ); ?></span></div>
						<div class="colors" role="radiogroup" aria-label="<?php esc_attr_e( 'Choose colour', 'mi-trends' ); ?>">
							<?php foreach ( $mi_v['colors'] as $mi_ci => $mi_color ) : ?>
								<button type="button" class="<?php echo 0 === $mi_ci ? 'active' : ''; ?>" data-mi-color="<?php echo esc_attr( $mi_color['name'] ); ?>"
									aria-label="<?php echo esc_attr( $mi_color['name'] ); ?>" aria-pressed="<?php echo 0 === $mi_ci ? 'true' : 'false'; ?>">
									<span style="background-color:<?php echo esc_attr( $mi_color['hex'] ); ?>"></span>
								</button>
							<?php endforeach; ?>
						</div>
					</div>

					<div class="selection-block size-block" data-mi-size-block>
						<div class="selection-label">
							<strong><?php esc_html_e( 'Select size', 'mi-trends' ); ?></strong>
							<button type="button" data-mi-open="size-guide"><?php esc_html_e( 'Size guide', 'mi-trends' ); ?></button>
						</div>
						<div class="sizes" role="radiogroup" aria-label="<?php esc_attr_e( 'Choose size', 'mi-trends' ); ?>">
							<?php foreach ( $mi_v['sizes'] as $mi_size ) : ?>
								<?php
								$mi_unavailable = in_array( $mi_size, $mi_v['out_of_stock'], true ) || empty( $mi_v['variations'][ $mi_size ] );
								$mi_left        = isset( $mi_v['stock'][ $mi_size ] ) ? $mi_v['stock'][ $mi_size ] : null;
								$mi_scarce      = ! $mi_unavailable && null !== $mi_left && $mi_left > 0 && $mi_left <= 3;
								$mi_label       = $mi_size . ( $mi_unavailable ? ', ' . __( 'out of stock', 'mi-trends' ) : ( $mi_scarce ? ', ' . sprintf( /* translators: %d: units */ __( 'only %d left', 'mi-trends' ), $mi_left ) : '' ) );
								?>
								<button type="button" class="<?php echo $mi_one_size === $mi_size ? 'active' : ''; ?>"
									data-mi-size="<?php echo esc_attr( $mi_size ); ?>"
									data-mi-size-slug="<?php echo esc_attr( sanitize_title( $mi_size ) ); ?>"
									data-mi-variation="<?php echo isset( $mi_v['variations'][ $mi_size ] ) ? (int) $mi_v['variations'][ $mi_size ] : 0; ?>"
									<?php disabled( $mi_unavailable ); ?>
									aria-label="<?php echo esc_attr( $mi_label ); ?>">
									<?php echo esc_html( $mi_size ); ?>
									<?php if ( $mi_scarce ) : ?><em class="size-left" aria-hidden="true"><?php echo (int) $mi_left; ?></em><?php endif; ?>
								</button>
							<?php endforeach; ?>
						</div>
						<p class="size-error" role="alert" data-mi-size-error hidden><?php esc_html_e( 'Choose an available size before adding this style.', 'mi-trends' ); ?></p>
						<?php if ( $mi_v['fit'] ) : ?>
							<p class="fit-note"><?php mi_trends_icon( 'badge-check', array( 'size' => 14 ) ); ?> <?php echo esc_html( sprintf( /* translators: %s: fit */ __( '%s. Most customers stay true to size.', 'mi-trends' ), $mi_v['fit'] ) ); ?></p>
						<?php endif; ?>
					</div>

					<div class="buy-row">
						<div class="qty" aria-label="<?php esc_attr_e( 'Quantity selector', 'mi-trends' ); ?>">
							<button type="button" aria-label="<?php esc_attr_e( 'Decrease quantity', 'mi-trends' ); ?>" data-mi-qty-step="-1"><?php mi_trends_icon( 'minus', array( 'size' => 16 ) ); ?></button>
							<span aria-live="polite" data-mi-qty>1</span>
							<button type="button" aria-label="<?php esc_attr_e( 'Increase quantity', 'mi-trends' ); ?>" data-mi-qty-step="1"><?php mi_trends_icon( 'plus', array( 'size' => 16 ) ); ?></button>
						</div>
						<button class="add" type="submit" data-mi-add-to-bag><?php mi_trends_icon( 'shopping-bag', array( 'size' => 18 ) ); ?> <?php esc_html_e( 'Add to bag', 'mi-trends' ); ?></button>
						<button class="buy" type="submit" name="mi_buy_now" value="1" data-mi-buy-now><?php esc_html_e( 'Buy now', 'mi-trends' ); ?></button>
					</div>
				</form>

				<div class="delivery-card" data-mi-pincode>
					<div class="delivery-title"><?php mi_trends_icon( 'map-pin', array( 'size' => 18 ) ); ?><div><strong><?php esc_html_e( 'Delivery to your door', 'mi-trends' ); ?></strong><span><?php esc_html_e( 'Check availability and date', 'mi-trends' ); ?></span></div></div>
					<div class="pin-row">
						<input inputmode="numeric" maxlength="6" placeholder="<?php esc_attr_e( 'Enter 6-digit pincode', 'mi-trends' ); ?>" aria-label="<?php esc_attr_e( 'Delivery pincode', 'mi-trends' ); ?>" data-mi-pincode-input>
						<button type="button" data-mi-pincode-check><?php esc_html_e( 'Check', 'mi-trends' ); ?></button>
					</div>
					<p aria-live="polite" data-mi-pincode-message hidden></p>
				</div>

				<div class="assurances">
					<span><?php mi_trends_icon( 'truck', array( 'size' => 18 ) ); ?><b><?php esc_html_e( 'Free shipping', 'mi-trends' ); ?></b> <?php echo esc_html( sprintf( /* translators: %s: amount */ __( 'over %s', 'mi-trends' ), mi_trends_money( mi_trends_setting( 'free_shipping_threshold' ) ) ) ); ?></span>
					<span><?php mi_trends_icon( 'rotate-ccw', array( 'size' => 18 ) ); ?><b><?php esc_html_e( '30-day returns', 'mi-trends' ); ?></b> <?php esc_html_e( 'easy exchange', 'mi-trends' ); ?></span>
					<span><?php mi_trends_icon( 'shield-check', array( 'size' => 18 ) ); ?><b><?php esc_html_e( 'Secure checkout', 'mi-trends' ); ?></b> <?php esc_html_e( '100% protected', 'mi-trends' ); ?></span>
				</div>

				<?php if ( $mi_offers ) : ?>
					<div class="offers">
						<span class="section-kicker"><?php esc_html_e( 'Offers for you', 'mi-trends' ); ?></span>
						<?php foreach ( $mi_offers as $mi_offer ) : ?>
							<article><div><strong><?php echo esc_html( $mi_offer[0] ); ?></strong><p><?php echo esc_html( $mi_offer[1] ); ?></p></div><code><?php echo esc_html( $mi_offer[2] ); ?></code></article>
						<?php endforeach; ?>
					</div>
				<?php endif; ?>

				<div class="accordions">
					<details open>
						<summary><?php esc_html_e( 'Product details', 'mi-trends' ); ?> <?php mi_trends_icon( 'chevron-down', array( 'size' => 17 ) ); ?></summary>
						<div>
							<?php if ( '' !== trim( (string) get_the_content() ) ) : ?>
								<?php the_content(); ?>
							<?php elseif ( $mi_v['art'] ) : ?>
								<p><?php echo esc_html( sprintf( /* translators: 1: artwork, 2: collection */ __( '%1$s artwork from our %2$s studio story, made for repeat wear.', 'mi-trends' ), $mi_v['art'], $mi_v['collection'] ) ); ?></p>
							<?php endif; ?>
							<dl>
								<?php if ( $mi_v['fit'] ) : ?><div><dt><?php esc_html_e( 'Fit', 'mi-trends' ); ?></dt><dd><?php echo esc_html( $mi_v['fit'] ); ?></dd></div><?php endif; ?>
								<?php if ( $mi_v['fabric'] ) : ?><div><dt><?php esc_html_e( 'Fabric', 'mi-trends' ); ?></dt><dd><?php echo esc_html( $mi_v['fabric'] ); ?></dd></div><?php endif; ?>
								<div><dt><?php esc_html_e( 'Care', 'mi-trends' ); ?></dt><dd><?php esc_html_e( 'Cold wash inside out. Dry in shade. Do not iron the print.', 'mi-trends' ); ?></dd></div>
								<div><dt><?php esc_html_e( 'Origin', 'mi-trends' ); ?></dt><dd><?php esc_html_e( 'Designed and made in India', 'mi-trends' ); ?></dd></div>
								<?php if ( $mi_v['sku'] ) : ?><div><dt><?php esc_html_e( 'SKU', 'mi-trends' ); ?></dt><dd><?php echo esc_html( $mi_v['sku'] ); ?></dd></div><?php endif; ?>
							</dl>
						</div>
					</details>
					<details>
						<summary><?php esc_html_e( 'Shipping & returns', 'mi-trends' ); ?> <?php mi_trends_icon( 'chevron-down', array( 'size' => 17 ) ); ?></summary>
						<div><p><?php esc_html_e( 'Dispatches in 1–2 working days. Returns and exchanges are accepted within 30 days when unworn and tagged.', 'mi-trends' ); ?></p></div>
					</details>
					<details>
						<summary><?php esc_html_e( 'Ratings & reviews', 'mi-trends' ); ?> <span><?php echo esc_html( $mi_v['rating'] ); ?> / 5</span><?php mi_trends_icon( 'chevron-down', array( 'size' => 17 ) ); ?></summary>
						<div>
							<p><?php esc_html_e( 'Customers love the substantial feel, clean finish and true-to-size shape. Verified-buyer reviews are shown after delivery.', 'mi-trends' ); ?></p>
							<?php
							if ( comments_open() || get_comments_number() ) {
								comments_template();
							}
							?>
						</div>
					</details>
				</div>
			</section>
		</div>

		<?php if ( $mi_related ) : ?>
			<section class="related">
				<div class="related-head">
					<div><span class="section-kicker"><?php esc_html_e( 'Wear it your way', 'mi-trends' ); ?></span><h2><?php esc_html_e( 'You may also like', 'mi-trends' ); ?></h2></div>
					<a href="<?php echo esc_url( $mi_v['collection_url'] ); ?>"><?php esc_html_e( 'View collection', 'mi-trends' ); ?></a>
				</div>
				<div class="related-grid">
					<?php foreach ( $mi_related as $mi_related_id ) : ?>
						<?php mi_trends_part( 'components/product-card', array( 'product' => $mi_related_id ) ); ?>
					<?php endforeach; ?>
				</div>
			</section>
		<?php endif; ?>

		<div class="mobile-buy-bar">
			<button type="button" class="mobile-buy-wishlist<?php echo $mi_saved ? ' is-saved' : ''; ?>" data-mi-wishlist="<?php echo (int) $mi_v['id']; ?>"
				aria-label="<?php echo $mi_saved ? esc_attr__( 'Remove from wishlist', 'mi-trends' ) : esc_attr__( 'Add to wishlist', 'mi-trends' ); ?>">
				<?php mi_trends_icon( 'heart', array( 'size' => 20, 'fill' => $mi_saved ? 'currentColor' : 'none' ) ); ?>
			</button>
			<div class="mobile-buy-info">
				<span class="mobile-buy-price"><?php echo esc_html( mi_trends_money( $mi_v['price'] ) ); ?></span>
				<small class="mobile-buy-size" data-mi-mobile-size><?php echo $mi_one_size ? esc_html( sprintf( /* translators: %s: size */ __( 'Size: %s', 'mi-trends' ), $mi_one_size ) ) : esc_html__( 'Select size', 'mi-trends' ); ?></small>
			</div>
			<button type="button" class="mobile-buy-cta" data-mi-mobile-add><?php esc_html_e( 'Add to bag', 'mi-trends' ); ?></button>
		</div>

		<?php mi_trends_part( 'components/size-guide', array( 'product_type' => $mi_v['type'] ) ); ?>
		<?php do_action( 'woocommerce_after_single_product' ); ?>
	</div>
	<?php
endwhile;

get_footer( 'shop' );
