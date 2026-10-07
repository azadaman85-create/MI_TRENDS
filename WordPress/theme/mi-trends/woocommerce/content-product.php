<?php
/**
 * A product inside a WooCommerce loop (shortcodes, blocks, widgets).
 *
 * The MI TRENDS templates render cards directly; this override makes every
 * other WooCommerce loop — [products] shortcodes, Related/Upsells blocks on
 * pages someone builds in the editor — use the same ProductCard.
 *
 * @package MI_Trends
 * @version 9.4.0 (WooCommerce template version this override was written against)
 */

defined( 'ABSPATH' ) || exit;

global $product;

if ( ! is_a( $product, WC_Product::class ) || ! $product->is_visible() ) {
	return;
}
?>
<li <?php wc_product_class( 'mi-loop-item', $product ); ?>>
	<?php mi_trends_part( 'components/product-card', array( 'product' => $product ) ); ?>
</li>
