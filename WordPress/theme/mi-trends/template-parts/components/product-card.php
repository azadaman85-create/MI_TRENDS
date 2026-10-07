<?php
/**
 * Product card — ProductCard.tsx.
 *
 * Front/back visuals that swap on hover, New/Bestseller and "% off" badges,
 * wishlist heart, quick add (first in-stock size, first colour), collection link,
 * price with MRP and saving, colour swatches and rating.
 *
 * Args: product (WC_Product|int) or view (array), compact (bool), class (string).
 *
 * @package MI_Trends
 */

defined( 'ABSPATH' ) || exit;

$mi_v = isset( $args['view'] ) ? $args['view'] : mi_trends_product_view( isset( $args['product'] ) ? $args['product'] : 0 );
if ( ! $mi_v ) {
	return;
}

$mi_compact    = ! empty( $args['compact'] );
$mi_extra      = isset( $args['class'] ) ? (string) $args['class'] : '';
$mi_wishlisted = in_array( (int) $mi_v['id'], mi_trends_wishlist_ids(), true );
$mi_sold_out   = ! empty( $mi_v['sold_out'] );
$mi_status     = in_array( 'new', $mi_v['tags'], true ) ? __( 'New', 'mi-trends' ) : ( in_array( 'bestseller', $mi_v['tags'], true ) ? __( 'Bestseller', 'mi-trends' ) : '' );
?>
<article class="product-card<?php echo $mi_compact ? ' product-card--compact' : ''; ?><?php echo $mi_extra ? ' ' . esc_attr( $mi_extra ) : ''; ?>" data-product-id="<?php echo (int) $mi_v['id']; ?>">
	<div class="product-card__media">
		<a href="<?php echo esc_url( $mi_v['url'] ); ?>" class="product-card__image-link" aria-label="<?php echo esc_attr( sprintf( /* translators: %s: product */ __( 'View %s', 'mi-trends' ), $mi_v['name'] ) ); ?>">
			<?php
			mi_trends_product_visual( $mi_v, array( 'class' => 'product-card__visual product-card__visual--front' ) );
			mi_trends_product_visual( $mi_v, array( 'view' => 'back', 'class' => 'product-card__visual product-card__visual--back', 'decorative' => true ) );
			?>
		</a>

		<div class="product-card__badges" aria-label="<?php esc_attr_e( 'Product highlights', 'mi-trends' ); ?>">
			<?php if ( $mi_status ) : ?>
				<span class="product-card__badge product-card__badge--status"><?php echo esc_html( $mi_status ); ?></span>
			<?php endif; ?>
			<?php if ( $mi_v['discount'] > 0 ) : ?>
				<span class="product-card__badge product-card__badge--discount"><?php echo esc_html( sprintf( /* translators: %d: percent */ __( '%d%% off', 'mi-trends' ), $mi_v['discount'] ) ); ?></span>
			<?php endif; ?>
		</div>

		<button type="button" class="product-card__wishlist<?php echo $mi_wishlisted ? ' is-active' : ''; ?>" data-mi-wishlist="<?php echo (int) $mi_v['id']; ?>"
			aria-label="<?php echo esc_attr( sprintf( $mi_wishlisted ? /* translators: %s: product */ __( 'Remove %s from wishlist', 'mi-trends' ) : /* translators: %s: product */ __( 'Add %s to wishlist', 'mi-trends' ), $mi_v['name'] ) ); ?>"
			aria-pressed="<?php echo $mi_wishlisted ? 'true' : 'false'; ?>">
			<?php mi_trends_icon( 'heart', array( 'fill' => $mi_wishlisted ? 'currentColor' : 'none' ) ); ?>
		</button>

		<button type="button" class="product-card__quick-add" data-mi-quick-add="<?php echo (int) $mi_v['id']; ?>"<?php disabled( $mi_sold_out ); ?>
			aria-label="<?php echo esc_attr( sprintf( $mi_sold_out ? /* translators: %s: product */ __( '%s is sold out', 'mi-trends' ) : /* translators: %s: product */ __( 'Add %s to bag', 'mi-trends' ), $mi_v['name'] ) ); ?>">
			<span class="quick-add-desktop"><?php echo $mi_sold_out ? esc_html__( 'Sold out', 'mi-trends' ) : esc_html__( 'Add to bag', 'mi-trends' ); ?></span>
			<span class="quick-add-mobile"><?php echo $mi_sold_out ? esc_html__( 'Out', 'mi-trends' ) : esc_html__( '+ Add', 'mi-trends' ); ?></span>
		</button>
	</div>

	<div class="product-card__body">
		<a href="<?php echo esc_url( $mi_v['collection_url'] ); ?>" class="product-card__collection"><?php echo esc_html( $mi_v['collection'] ); ?></a>

		<a href="<?php echo esc_url( $mi_v['url'] ); ?>" class="product-card__title-link">
			<h3 class="product-card__title"><?php echo esc_html( $mi_v['name'] ); ?></h3>
		</a>

		<div class="product-card__price" aria-label="<?php echo esc_attr( sprintf( '%s, %d%% off', mi_trends_money( $mi_v['price'] ), $mi_v['discount'] ) ); ?>">
			<strong class="product-card__selling-price"><?php echo esc_html( mi_trends_money( $mi_v['price'] ) ); ?></strong>
			<?php if ( $mi_v['price'] < $mi_v['mrp'] ) : ?>
				<del class="product-card__mrp"><?php echo esc_html( mi_trends_money( $mi_v['mrp'] ) ); ?></del>
				<span class="product-card__saving"><?php echo esc_html( sprintf( /* translators: %d: percent */ __( '%d%% off', 'mi-trends' ), $mi_v['discount'] ) ); ?></span>
			<?php endif; ?>
		</div>

		<div class="product-card__meta">
			<div class="product-card__swatches" role="list" aria-label="<?php esc_attr_e( 'Available colours', 'mi-trends' ); ?>">
				<?php foreach ( array_slice( $mi_v['colors'], 0, $mi_compact ? 3 : 4 ) as $mi_color ) : ?>
					<span class="product-card__swatch" style="background-color:<?php echo esc_attr( $mi_color['hex'] ); ?>" role="listitem" title="<?php echo esc_attr( $mi_color['name'] ); ?>">
						<span class="visually-hidden"><?php echo esc_html( $mi_color['name'] ); ?></span>
					</span>
				<?php endforeach; ?>
			</div>

			<span class="product-card__rating" aria-label="<?php echo esc_attr( sprintf( /* translators: 1: rating, 2: count */ __( '%1$s out of 5, %2$d reviews', 'mi-trends' ), $mi_v['rating'], $mi_v['review_count'] ) ); ?>">
				<?php mi_trends_icon( 'star', array( 'fill' => 'currentColor' ) ); ?>
				<span><?php echo esc_html( number_format( (float) $mi_v['rating'], 1 ) ); ?></span>
				<span class="product-card__review-count">(<?php echo esc_html( mi_trends_compact_number( $mi_v['review_count'] ) ); ?>)</span>
			</span>
		</div>
	</div>
</article>
