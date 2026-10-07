<?php
/**
 * Template Name: Wishlist
 *
 * app/(store)/wishlist/page.tsx. Saved products come from MI Trends Core:
 * user meta for signed-in shoppers, a cookie for guests (merged into the
 * account on sign-in). The original kept them in localStorage.
 *
 * @package MI_Trends
 */

defined( 'ABSPATH' ) || exit;

get_header();

$mi_saved = array();
foreach ( mi_trends_wishlist_ids() as $mi_id ) {
	$mi_view = mi_trends_product_view( $mi_id );
	if ( $mi_view && 'publish' === get_post_status( $mi_id ) ) {
		$mi_saved[] = $mi_view;
	}
}

if ( ! $mi_saved ) :
	?>
	<div class="wishlist-empty">
		<div class="heart"><?php mi_trends_icon( 'heart', array( 'size' => 31 ) ); ?></div>
		<span><?php esc_html_e( 'Keep an eye on it', 'mi-trends' ); ?></span>
		<h1><?php esc_html_e( 'Your wishlist is open.', 'mi-trends' ); ?></h1>
		<p><?php esc_html_e( 'Tap the heart on any piece you love. We’ll keep your shortlist together while you decide.', 'mi-trends' ); ?></p>
		<a href="<?php echo esc_url( mi_trends_shop_url() ); ?>"><?php esc_html_e( 'Find your favourites', 'mi-trends' ); ?> <?php mi_trends_icon( 'arrow-right', array( 'size' => 16 ) ); ?></a>
		<div class="ideas"><?php mi_trends_icon( 'sparkles', array( 'size' => 16 ) ); ?><span><?php esc_html_e( 'Fresh drops, standout graphics, zero pressure.', 'mi-trends' ); ?></span></div>
	</div>
	<?php
else :
	?>
	<div class="wishlist-page">
		<header>
			<div>
				<span><?php esc_html_e( 'Saved for later', 'mi-trends' ); ?></span>
				<h1><?php esc_html_e( 'Your wishlist', 'mi-trends' ); ?></h1>
				<p><?php echo esc_html( sprintf( /* translators: %d: count */ _n( '%d style worth another look.', '%d styles worth another look.', count( $mi_saved ), 'mi-trends' ), count( $mi_saved ) ) ); ?></p>
			</div>
			<a href="<?php echo esc_url( mi_trends_shop_url() ); ?>"><?php esc_html_e( 'Keep exploring', 'mi-trends' ); ?> <?php mi_trends_icon( 'arrow-right', array( 'size' => 15 ) ); ?></a>
		</header>

		<div class="wishlist-note">
			<?php mi_trends_icon( 'heart', array( 'size' => 16, 'fill' => 'currentColor' ) ); ?>
			<p>
				<?php
				echo is_user_logged_in()
					? esc_html__( 'Your saved pieces are kept on your account. Add a size from the product page when you’re ready.', 'mi-trends' )
					: esc_html__( 'Your saved pieces live here for this visit. Add a size from the product page when you’re ready.', 'mi-trends' );
				?>
			</p>
		</div>

		<section class="wishlist-grid" aria-label="<?php esc_attr_e( 'Saved products', 'mi-trends' ); ?>">
			<?php foreach ( $mi_saved as $mi_view ) : ?>
				<div class="saved-card" data-mi-saved-card="<?php echo (int) $mi_view['id']; ?>">
					<?php mi_trends_part( 'components/product-card', array( 'view' => $mi_view ) ); ?>
					<div class="saved-actions">
						<a href="<?php echo esc_url( $mi_view['url'] ); ?>"><?php mi_trends_icon( 'shopping-bag', array( 'size' => 14 ) ); ?><?php esc_html_e( 'Choose options', 'mi-trends' ); ?></a>
						<button type="button" data-mi-wishlist="<?php echo (int) $mi_view['id']; ?>" data-mi-wishlist-remove><?php esc_html_e( 'Remove', 'mi-trends' ); ?></button>
					</div>
				</div>
			<?php endforeach; ?>
		</section>
	</div>
	<?php
endif;

get_footer();
