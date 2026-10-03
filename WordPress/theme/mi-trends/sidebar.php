<?php
/**
 * Sidebar.
 *
 * The MI TRENDS layouts are full width and have no sidebar; this file exists
 * so plugins that call get_sidebar() get nothing rather than a PHP notice.
 *
 * @package MI_Trends
 */

defined( 'ABSPATH' ) || exit;

if ( is_active_sidebar( 'mi-trends-sidebar' ) ) : ?>
	<aside class="widget-area" aria-label="<?php esc_attr_e( 'Sidebar', 'mi-trends' ); ?>">
		<?php dynamic_sidebar( 'mi-trends-sidebar' ); ?>
	</aside>
<?php endif; ?>
