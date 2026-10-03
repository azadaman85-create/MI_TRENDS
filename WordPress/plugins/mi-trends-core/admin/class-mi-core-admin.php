<?php
/**
 * wp-admin integration — the MI TRENDS admin panel (app/admin) inside WordPress.
 *
 * Original screen → where it lives now:
 *   Dashboard            MI TRENDS → Dashboard            (this plugin)
 *   Products, editor     Products (WooCommerce) + "MI TRENDS" product data tab
 *   Categories           Products → Categories (WooCommerce)
 *   Collections          Products → Collections (this plugin's taxonomy)
 *   Inventory            MI TRENDS → Inventory            (this plugin, staged edits + Save)
 *   Orders, detail       WooCommerce → Orders + "MI TRENDS fulfilment" box, shipping label
 *   Customers, profile   MI TRENDS → Customers (tiers) → WooCommerce customer/user screens
 *   Reviews              Products → Reviews (WooCommerce moderation)
 *   Coupons              Marketing → Coupons (WooCommerce) + "percent, capped" field
 *   Banners              Appearance → Customize → MI TRENDS homepage (theme)
 *   Reports              MI TRENDS → Reports (+ WooCommerce → Analytics)
 *   Settings             MI TRENDS → Settings (+ WooCommerce settings)
 *   Login                wp-login.php (real authentication, roles and capabilities)
 *
 * The pages reuse app/admin/admin.css (assets/css/admin-panel.css) inside an
 * `.admin-root` wrapper, so cards, KPIs, badges and tables look like the original.
 *
 * @package MI_Trends_Core
 */

defined( 'ABSPATH' ) || exit;

/**
 * Admin.
 */
class MI_Core_Admin {

	/**
	 * Our page hook suffixes.
	 *
	 * @var string[]
	 */
	private static $hooks = array();

	/**
	 * Hooks.
	 */
	public static function init() {
		require_once MI_CORE_DIR . 'admin/class-mi-core-admin-charts.php';
		require_once MI_CORE_DIR . 'admin/class-mi-core-admin-pages.php';
		require_once MI_CORE_DIR . 'admin/class-mi-core-admin-products.php';
		require_once MI_CORE_DIR . 'admin/class-mi-core-admin-orders.php';

		MI_Core_Admin_Products::init();
		MI_Core_Admin_Orders::init();

		add_action( 'admin_menu', array( __CLASS__, 'menu' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'assets' ) );
		add_action( 'admin_post_mi_core_settings', array( 'MI_Core_Admin_Pages', 'save_settings' ) );
		add_action( 'admin_post_mi_core_setup', array( 'MI_Core_Admin_Pages', 'run_setup' ) );
		add_action( 'admin_post_mi_core_import', array( 'MI_Core_Admin_Pages', 'run_import' ) );
		add_action( 'admin_post_mi_core_inventory', array( 'MI_Core_Admin_Pages', 'save_inventory' ) );
		add_action( 'admin_post_mi_core_export', array( 'MI_Core_Admin_Pages', 'export_csv' ) );
		add_action( 'admin_notices', array( __CLASS__, 'setup_notice' ) );
		add_filter( 'plugin_action_links_' . plugin_basename( MI_CORE_FILE ), array( __CLASS__, 'action_links' ) );

		// Dashboard/report figures are cached; any order change clears them.
		foreach ( array( 'woocommerce_new_order', 'woocommerce_order_status_changed', 'woocommerce_update_order', 'woocommerce_order_refunded' ) as $hook ) {
			add_action( $hook, array( 'MI_Core_Reports', 'flush' ) );
		}
	}

	/**
	 * Brand mark for the menu (app/icon.svg, as a data URI).
	 *
	 * @return string
	 */
	private static function menu_icon() {
		$svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path fill="black" d="M12 44V20h7l7 11 7-11h7v24h-7V31l-7 11-7-11v13h-7Z"/><path fill="black" d="M45 20h7v24h-7z"/></svg>';
		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- data URI for the menu icon.
		return 'data:image/svg+xml;base64,' . base64_encode( $svg );
	}

	/**
	 * Menu.
	 */
	public static function menu() {
		$cap = 'manage_woocommerce';

		self::$hooks[] = add_menu_page( __( 'MI TRENDS', 'mi-trends-core' ), __( 'MI TRENDS', 'mi-trends-core' ), $cap, 'mi-trends', array( 'MI_Core_Admin_Pages', 'dashboard' ), self::menu_icon(), 55.5 );
		self::$hooks[] = add_submenu_page( 'mi-trends', __( 'Dashboard', 'mi-trends-core' ), __( 'Dashboard', 'mi-trends-core' ), $cap, 'mi-trends', array( 'MI_Core_Admin_Pages', 'dashboard' ) );
		self::$hooks[] = add_submenu_page( 'mi-trends', __( 'Inventory', 'mi-trends-core' ), __( 'Inventory', 'mi-trends-core' ), $cap, 'mi-trends-inventory', array( 'MI_Core_Admin_Pages', 'inventory' ) );
		self::$hooks[] = add_submenu_page( 'mi-trends', __( 'Reports', 'mi-trends-core' ), __( 'Reports', 'mi-trends-core' ), $cap, 'mi-trends-reports', array( 'MI_Core_Admin_Pages', 'reports' ) );
		self::$hooks[] = add_submenu_page( 'mi-trends', __( 'Customers', 'mi-trends-core' ), __( 'Customers', 'mi-trends-core' ), $cap, 'mi-trends-customers', array( 'MI_Core_Admin_Pages', 'customers' ) );
		add_submenu_page( 'mi-trends', __( 'Messages', 'mi-trends-core' ), __( 'Messages', 'mi-trends-core' ), 'edit_shop_orders', 'edit.php?post_type=mi_message' );
		self::$hooks[] = add_submenu_page( 'mi-trends', __( 'Subscribers', 'mi-trends-core' ), __( 'Subscribers', 'mi-trends-core' ), $cap, 'mi-trends-subscribers', array( 'MI_Core_Admin_Pages', 'subscribers' ) );
		self::$hooks[] = add_submenu_page( 'mi-trends', __( 'Settings', 'mi-trends-core' ), __( 'Settings', 'mi-trends-core' ), $cap, 'mi-trends-settings', array( 'MI_Core_Admin_Pages', 'settings' ) );
		// Printable shipping label (no menu entry).
		self::$hooks[] = add_submenu_page( '', __( 'Shipping label', 'mi-trends-core' ), '', 'edit_shop_orders', 'mi-trends-label', array( 'MI_Core_Admin_Orders', 'label_page' ) );
	}

	/**
	 * Styles/scripts on our screens only.
	 *
	 * @param string $hook Hook suffix.
	 */
	public static function assets( $hook ) {
		if ( ! in_array( $hook, self::$hooks, true ) ) {
			return;
		}
		$version = MI_CORE_VERSION;
		wp_enqueue_style( 'mi-core-admin-panel', MI_CORE_URL . 'assets/css/admin-panel.css', array(), $version );
		wp_enqueue_style( 'mi-core-admin-wp', MI_CORE_URL . 'assets/css/admin-wp.css', array( 'mi-core-admin-panel' ), $version );
		wp_enqueue_script( 'mi-core-admin', MI_CORE_URL . 'assets/js/admin.js', array(), $version, true );
	}

	/**
	 * Nudge to run setup once.
	 */
	public static function setup_notice() {
		if ( get_option( 'mi_core_setup_done' ) || ! current_user_can( 'manage_woocommerce' ) ) {
			return;
		}
		$screen = get_current_screen();
		if ( $screen && false !== strpos( (string) $screen->id, 'mi-trends-settings' ) ) {
			return;
		}
		printf(
			'<div class="notice notice-info"><p><strong>%1$s</strong> %2$s <a class="button button-primary" href="%3$s">%4$s</a></p></div>',
			esc_html__( 'MI Trends Core is active.', 'mi-trends-core' ),
			esc_html__( 'Run the store setup and import the catalogue to finish installing.', 'mi-trends-core' ),
			esc_url( admin_url( 'admin.php?page=mi-trends-settings' ) ),
			esc_html__( 'Open MI TRENDS → Settings', 'mi-trends-core' )
		);
	}

	/**
	 * "Settings" link on the Plugins screen.
	 *
	 * @param array $links Links.
	 * @return array
	 */
	public static function action_links( $links ) {
		array_unshift( $links, '<a href="' . esc_url( admin_url( 'admin.php?page=mi-trends-settings' ) ) . '">' . esc_html__( 'Settings', 'mi-trends-core' ) . '</a>' );
		return $links;
	}

	/**
	 * Shared page header (PageHeader.tsx).
	 *
	 * @param string $eyebrow     Eyebrow.
	 * @param string $title       Title.
	 * @param string $description Description.
	 * @param string $actions     Actions HTML (already escaped).
	 */
	public static function page_head( $eyebrow, $title, $description = '', $actions = '' ) {
		?>
		<header class="admin-page-head">
			<div>
				<?php if ( $eyebrow ) : ?><p class="a-eyebrow"><?php echo esc_html( $eyebrow ); ?></p><?php endif; ?>
				<h2><?php echo esc_html( $title ); ?></h2>
				<?php if ( $description ) : ?><p><?php echo esc_html( $description ); ?></p><?php endif; ?>
			</div>
			<?php if ( $actions ) : ?><div class="a-actions"><?php echo $actions; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built from escaped parts by the caller. ?></div><?php endif; ?>
		</header>
		<?php
	}

	/**
	 * Status badge (OrderStatusBadge in Badge.tsx).
	 *
	 * @param string $status Status without wc-.
	 * @return string
	 */
	public static function status_badge( $status ) {
		$tones = array(
			'processing' => 'warning',
			'on-hold'    => 'warning',
			'pending'    => 'quiet',
			'confirmed'  => 'info',
			'packed'     => 'info',
			'shipped'    => 'ink',
			'delivered'  => 'success',
			'completed'  => 'success',
			'cancelled'  => 'danger',
			'returned'   => 'danger',
			'refunded'   => 'danger',
			'failed'     => 'danger',
		);
		$tone = isset( $tones[ $status ] ) ? $tones[ $status ] : 'quiet';
		return '<span class="a-badge a-badge--dot a-badge--' . esc_attr( $tone ) . '">' . esc_html( wc_get_order_status_name( $status ) ) . '</span>';
	}
}
