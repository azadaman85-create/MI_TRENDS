<?php
/**
 * AuthShell — components/account/AuthShell.tsx: photo panel with statement and
 * member perks on the left, the form card on the right.
 *
 * Args: eyebrow, title, lede, statement (HTML with <em>), body (callable that
 * prints the form).
 *
 * @package MI_Trends
 */

defined( 'ABSPATH' ) || exit;

$mi_perks = array(
	array( 'sparkles', __( 'First look at drops', 'mi-trends' ), __( 'Members get the restock and drop alerts before anyone else.', 'mi-trends' ) ),
	array( 'heart', __( 'Wishlist that follows you', 'mi-trends' ), __( 'Saved pieces stay put across every device you shop on.', 'mi-trends' ) ),
	array( 'truck', __( 'Checkout in two taps', 'mi-trends' ), __( 'Saved addresses mean no retyping when the drop lands.', 'mi-trends' ) ),
	array( 'badge-check', __( 'Order history and tracking', 'mi-trends' ), __( 'Every order, invoice and return in one place.', 'mi-trends' ) ),
);
?>
<div class="acct">
	<aside class="acct__art">
		<div class="acct__art-media" aria-hidden="true">
			<img src="<?php echo esc_url( mi_trends_image( 'hero-oversized.jpg' ) ); ?>" alt="">
		</div>

		<?php mi_trends_brand_lockup( array( 'invert' => true ) ); ?>

		<h2 class="acct__statement"><?php echo wp_kses( $args['statement'], array( 'em' => array() ) ); ?></h2>

		<ul class="acct__perks">
			<?php foreach ( $mi_perks as $mi_perk ) : ?>
				<li>
					<?php mi_trends_icon( $mi_perk[0], array( 'size' => 17 ) ); ?>
					<span><strong><?php echo esc_html( $mi_perk[1] ); ?></strong><?php echo esc_html( $mi_perk[2] ); ?></span>
				</li>
			<?php endforeach; ?>
		</ul>
	</aside>

	<section class="acct__panel">
		<div class="acct__card">
			<p class="eyebrow"><?php echo esc_html( $args['eyebrow'] ); ?></p>
			<h1><?php echo esc_html( $args['title'] ); ?></h1>
			<p class="acct__lede"><?php echo esc_html( $args['lede'] ); ?></p>
			<?php call_user_func( $args['body'] ); ?>
		</div>
	</section>
</div>
