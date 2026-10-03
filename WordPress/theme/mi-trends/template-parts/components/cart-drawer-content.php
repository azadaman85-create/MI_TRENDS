<?php
/**
 * Cart drawer body — header, free-shipping nudge, lines, footer (CartDrawer.tsx).
 *
 * Root element class `mi-cart-drawer-content` is the cart-fragment target.
 *
 * @package MI_Trends
 */

defined( 'ABSPATH' ) || exit;

$mi_lines     = mi_trends_cart_lines();
$mi_count     = mi_trends_cart_count();
$mi_subtotal  = array_sum( wp_list_pluck( $mi_lines, 'total' ) );
$mi_threshold = (float) mi_trends_setting( 'free_shipping_threshold' );
$mi_remaining = max( 0, $mi_threshold - $mi_subtotal );
$mi_checkout  = mi_trends_checkout_link();
?>
<div class="mi-cart-drawer-content" style="display:contents">
	<header class="drawer-header">
		<div>
			<p class="eyebrow"><?php esc_html_e( 'Your picks', 'mi-trends' ); ?></p>
			<h2 id="cart-drawer-title"><?php esc_html_e( 'Shopping bag', 'mi-trends' ); ?> <span>(<?php echo (int) $mi_count; ?>)</span></h2>
		</div>
		<button class="icon-button drawer-close" type="button" data-mi-close aria-label="<?php esc_attr_e( 'Close shopping bag', 'mi-trends' ); ?>">
			<?php mi_trends_icon( 'x', array( 'size' => 22 ) ); ?>
		</button>
	</header>

	<?php if ( ! $mi_lines ) : ?>
		<div class="drawer-empty-state">
			<span class="empty-state-icon" aria-hidden="true"><?php mi_trends_icon( 'shopping-bag', array( 'size' => 34 ) ); ?></span>
			<h3><?php esc_html_e( 'Your bag is ready for a first pick', 'mi-trends' ); ?></h3>
			<p><?php esc_html_e( 'Start with a fresh graphic, an easy layer, or something built for everyday rotation.', 'mi-trends' ); ?></p>
			<a class="button button-primary" href="<?php echo esc_url( mi_trends_shop_url() ); ?>">
				<?php esc_html_e( 'Explore all styles', 'mi-trends' ); ?>
				<?php mi_trends_icon( 'arrow-right', array( 'size' => 17 ) ); ?>
			</a>
		</div>
	<?php else : ?>
		<div class="shipping-nudge" aria-live="polite">
			<?php mi_trends_icon( 'truck', array( 'size' => 19 ) ); ?>
			<div>
				<p>
					<?php
					if ( $mi_remaining > 0 ) {
						/* translators: %s: amount */
						echo esc_html( sprintf( __( 'Add %s more for free shipping.', 'mi-trends' ), mi_trends_money( $mi_remaining ) ) );
					} else {
						esc_html_e( 'Nice one — your order ships free.', 'mi-trends' );
					}
					?>
				</p>
				<progress aria-label="<?php esc_attr_e( 'Progress toward free shipping', 'mi-trends' ); ?>" max="<?php echo esc_attr( $mi_threshold ); ?>" value="<?php echo esc_attr( min( $mi_subtotal, $mi_threshold ) ); ?>"></progress>
			</div>
		</div>

		<div class="cart-drawer-lines" aria-label="<?php esc_attr_e( 'Bag items', 'mi-trends' ); ?>">
			<?php foreach ( $mi_lines as $mi_line ) : $mi_v = $mi_line['view']; ?>
				<article class="cart-line" data-mi-line="<?php echo esc_attr( $mi_line['key'] ); ?>">
					<a class="cart-line-visual" href="<?php echo esc_url( $mi_v['url'] ); ?>" aria-label="<?php echo esc_attr( sprintf( /* translators: %s: product */ __( 'View %s', 'mi-trends' ), $mi_v['name'] ) ); ?>">
						<?php if ( $mi_v['image_url'] ) : ?>
							<span class="cart-line-art" role="img" aria-label="<?php echo esc_attr( $mi_v['name'] . ' in ' . $mi_line['color']['name'] ); ?>">
								<img src="<?php echo esc_url( $mi_v['image_url'] ); ?>" alt="" loading="lazy">
							</span>
						<?php else : ?>
							<span class="cart-line-art" role="img" aria-label="<?php echo esc_attr( $mi_v['name'] . ' in ' . $mi_line['color']['name'] ); ?>"
								style="background:<?php echo esc_attr( sprintf( 'linear-gradient(145deg, %s, %s 58%%, %s)', $mi_v['palette'][0], $mi_v['palette'][1], $mi_v['palette'][2] ) ); ?>">
								<span aria-hidden="true"><?php echo esc_html( $mi_v['art'] ); ?></span>
							</span>
						<?php endif; ?>
					</a>

					<div class="cart-line-details">
						<div class="cart-line-heading">
							<div>
								<p class="cart-line-collection"><?php echo esc_html( $mi_v['collection'] ); ?></p>
								<h3><a href="<?php echo esc_url( $mi_v['url'] ); ?>"><?php echo esc_html( $mi_v['name'] ); ?></a></h3>
							</div>
							<button class="icon-button cart-line-remove" type="button" data-mi-cart-qty="0" data-mi-key="<?php echo esc_attr( $mi_line['key'] ); ?>"
								aria-label="<?php echo esc_attr( sprintf( /* translators: %s: product */ __( 'Remove %s from bag', 'mi-trends' ), $mi_v['name'] ) ); ?>">
								<?php mi_trends_icon( 'trash', array( 'size' => 17 ) ); ?>
							</button>
						</div>

						<p class="cart-line-meta">
							<span class="color-dot" style="background-color:<?php echo esc_attr( $mi_line['color']['hex'] ); ?>" aria-hidden="true"></span>
							<?php echo esc_html( $mi_line['color']['name'] ); ?> <span aria-hidden="true">·</span> <?php echo esc_html( sprintf( /* translators: %s: size */ __( 'Size %s', 'mi-trends' ), $mi_line['size'] ) ); ?>
						</p>

						<div class="cart-line-controls">
							<div class="quantity-control" aria-label="<?php echo esc_attr( sprintf( /* translators: %s: product */ __( 'Quantity for %s', 'mi-trends' ), $mi_v['name'] ) ); ?>">
								<button type="button" data-mi-cart-qty="<?php echo (int) $mi_line['quantity'] - 1; ?>" data-mi-key="<?php echo esc_attr( $mi_line['key'] ); ?>"
									aria-label="<?php echo esc_attr( sprintf( /* translators: %s: product */ __( 'Decrease %s quantity', 'mi-trends' ), $mi_v['name'] ) ); ?>">
									<?php mi_trends_icon( 'minus', array( 'size' => 14 ) ); ?>
								</button>
								<output aria-live="polite"><?php echo (int) $mi_line['quantity']; ?></output>
								<button type="button" data-mi-cart-qty="<?php echo (int) $mi_line['quantity'] + 1; ?>" data-mi-key="<?php echo esc_attr( $mi_line['key'] ); ?>"
									aria-label="<?php echo esc_attr( sprintf( /* translators: %s: product */ __( 'Increase %s quantity', 'mi-trends' ), $mi_v['name'] ) ); ?>"<?php disabled( $mi_line['quantity'] >= 10 ); ?>>
									<?php mi_trends_icon( 'plus', array( 'size' => 14 ) ); ?>
								</button>
							</div>
							<strong class="cart-line-total"><?php echo esc_html( mi_trends_money( $mi_line['total'] ) ); ?></strong>
						</div>
					</div>
				</article>
			<?php endforeach; ?>
		</div>

		<footer class="cart-drawer-footer">
			<div class="cart-subtotal-row">
				<span><?php esc_html_e( 'Subtotal', 'mi-trends' ); ?></span>
				<strong><?php echo esc_html( mi_trends_money( $mi_subtotal ) ); ?></strong>
			</div>
			<p class="cart-tax-note"><?php esc_html_e( 'Taxes included. Shipping is calculated at checkout.', 'mi-trends' ); ?></p>
			<a class="button button-primary button-full" href="<?php echo esc_url( $mi_checkout['url'] ); ?>">
				<?php echo esc_html( $mi_checkout['label'] ); ?>
				<?php mi_trends_icon( 'arrow-right', array( 'size' => 17 ) ); ?>
			</a>
			<a class="button button-secondary button-full" href="<?php echo esc_url( wc_get_cart_url() ); ?>"><?php esc_html_e( 'View bag', 'mi-trends' ); ?></a>
		</footer>
	<?php endif; ?>
</div>
