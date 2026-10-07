<?php
/**
 * Info page header — InfoHeader in app/(store)/info/[slug]/page.tsx.
 *
 * Args: post (WP_Post) — or eyebrow, title, intro passed directly.
 * A "|" or a newline in the title becomes a line break, like "\n" in the original.
 *
 * @package MI_Trends
 */

defined( 'ABSPATH' ) || exit;

$mi_post    = isset( $args['post'] ) ? $args['post'] : null;
$mi_eyebrow = isset( $args['eyebrow'] ) ? $args['eyebrow'] : '';
$mi_title   = isset( $args['title'] ) ? $args['title'] : '';
$mi_intro   = isset( $args['intro'] ) ? $args['intro'] : '';

if ( $mi_post instanceof WP_Post ) {
	$mi_eyebrow = $mi_eyebrow ? $mi_eyebrow : (string) get_post_meta( $mi_post->ID, '_mi_eyebrow', true );
	$mi_intro   = $mi_intro ? $mi_intro : (string) get_post_meta( $mi_post->ID, '_mi_intro', true );
	$mi_intro   = $mi_intro ? $mi_intro : ( has_excerpt( $mi_post ) ? get_the_excerpt( $mi_post ) : '' );
	$mi_title   = $mi_title ? $mi_title : (string) get_post_meta( $mi_post->ID, '_mi_display_title', true );
	$mi_title   = $mi_title ? $mi_title : get_the_title( $mi_post );
}

$mi_lines = preg_split( '/\s*(?:\||\n)\s*/', (string) $mi_title );
?>
<header class="info-head">
	<?php if ( $mi_eyebrow ) : ?>
		<span class="eyebrow"><?php echo esc_html( $mi_eyebrow ); ?></span>
	<?php endif; ?>
	<h1>
		<?php foreach ( $mi_lines as $mi_line ) : ?>
			<span><?php echo esc_html( $mi_line ); ?></span>
		<?php endforeach; ?>
	</h1>
	<?php if ( $mi_intro ) : ?>
		<p><?php echo esc_html( $mi_intro ); ?></p>
	<?php endif; ?>
</header>
