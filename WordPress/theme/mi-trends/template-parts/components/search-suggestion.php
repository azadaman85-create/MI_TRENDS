<?php
/**
 * One search suggestion row (SearchOverlay.tsx). With no view it renders the
 * empty row the script clones and fills from the REST response.
 *
 * @package MI_Trends
 */

defined( 'ABSPATH' ) || exit;

$mi_v = isset( $args['view'] ) ? $args['view'] : null;
?>
<li>
	<a class="search-suggestion" href="<?php echo $mi_v ? esc_url( $mi_v['url'] ) : '#'; ?>" data-mi-field="url">
		<span class="search-suggestion-art" role="img" data-mi-field="art"
			aria-label="<?php echo $mi_v ? esc_attr( $mi_v['name'] . ' product artwork' ) : ''; ?>"
			<?php if ( $mi_v && ! $mi_v['image_url'] ) : ?>style="background:<?php echo esc_attr( sprintf( 'linear-gradient(145deg, %s, %s 58%%, %s)', $mi_v['palette'][0], $mi_v['palette'][1], $mi_v['palette'][2] ) ); ?>"<?php endif; ?>>
			<?php if ( ! $mi_v || $mi_v['image_url'] ) : ?>
				<img src="<?php echo $mi_v ? esc_url( $mi_v['image_url'] ) : ''; ?>" alt="" loading="lazy" data-mi-field="image">
			<?php else : ?>
				<span aria-hidden="true"><?php echo esc_html( $mi_v['art'] ); ?></span>
			<?php endif; ?>
		</span>
		<span class="search-suggestion-copy">
			<small data-mi-field="collection"><?php echo $mi_v ? esc_html( $mi_v['collection'] ) : ''; ?></small>
			<strong data-mi-field="name"><?php echo $mi_v ? esc_html( $mi_v['name'] ) : ''; ?></strong>
			<span data-mi-field="type"><?php echo $mi_v ? esc_html( $mi_v['type'] ) : ''; ?></span>
		</span>
		<span class="search-suggestion-price" data-mi-field="price"><?php echo $mi_v ? esc_html( mi_trends_money( $mi_v['price'] ) ) : ''; ?></span>
		<?php mi_trends_icon( 'arrow-right', array( 'size' => 18, 'class' => 'search-suggestion-arrow' ) ); ?>
	</a>
</li>
