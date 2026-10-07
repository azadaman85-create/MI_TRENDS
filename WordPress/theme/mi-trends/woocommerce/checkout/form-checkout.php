<?php
/**
 * Checkout — app/(store)/checkout/page.tsx.
 *
 * One page, three numbered panels (Contact, Delivery address, Payment) and the
 * dark order summary on the right. Fields are WooCommerce's billing fields,
 * relabelled and validated by MI Trends Core to match the original (one
 * "Full name" field, +91 mobile, Indian pincode and state, Home/Work/Other).
 *
 * WooCommerce's checkout script still drives everything: it refreshes the
 * summary (.woocommerce-checkout-review-order-table) and the payment panel
 * (.woocommerce-checkout-payment) when anything changes, and submits the
 * order. Account required: MI Trends Core sends signed-out shoppers to sign-up.
 *
 * @package MI_Trends
 * @version 9.4.0 (WooCommerce template version this override was written against)
 */

defined( 'ABSPATH' ) || exit;

/** @var WC_Checkout $checkout */

if ( ! $checkout->is_registration_enabled() && $checkout->is_registration_required() && ! is_user_logged_in() ) {
	?>
	<div class="checkout-empty">
		<span><?php esc_html_e( 'Account needed', 'mi-trends' ); ?></span>
		<h1><?php esc_html_e( 'Sign up to check out.', 'mi-trends' ); ?></h1>
		<p><?php esc_html_e( 'MI TRENDS orders are tied to an account so you can track delivery and returns. Creating one takes a few seconds — your bag is waiting.', 'mi-trends' ); ?></p>
		<a href="<?php echo esc_url( mi_trends_account_url( 'signup', wp_make_link_relative( wc_get_checkout_url() ) ) ); ?>"><?php esc_html_e( 'Create an account', 'mi-trends' ); ?></a>
	</div>
	<?php
	return;
}

$mi_fields  = $checkout->get_checkout_fields( 'billing' );
$mi_contact = array( 'billing_first_name', 'billing_phone', 'billing_email' );
$mi_address = array( 'billing_address_1', 'billing_address_2', 'billing_postcode', 'billing_city', 'billing_state' );
$mi_special = array( 'billing_phone', 'billing_address_type', 'billing_country' );

/**
 * Render one billing field, keeping WooCommerce's markup (so its validation and
 * scripts work) inside the MI TRENDS grid.
 *
 * @param string      $key      Field key.
 * @param array       $field    Field config.
 * @param WC_Checkout $checkout Checkout.
 */
$mi_render_field = static function ( $key, $field, $checkout ) {
	if ( 'billing_phone' === $key ) {
		$value    = (string) $checkout->get_value( $key );
		$value    = substr( preg_replace( '/\D/', '', $value ), -10 );
		$required = ! empty( $field['required'] );
		?>
		<p class="form-row <?php echo esc_attr( implode( ' ', (array) $field['class'] ) ); ?><?php echo $required ? ' validate-required validate-phone' : ''; ?>" id="billing_phone_field" data-priority="<?php echo esc_attr( isset( $field['priority'] ) ? $field['priority'] : '' ); ?>">
			<label for="billing_phone"><?php echo esc_html( $field['label'] ); ?></label>
			<span class="woocommerce-input-wrapper phone">
				<i>+91</i>
				<input type="tel" class="input-text" name="billing_phone" id="billing_phone" value="<?php echo esc_attr( $value ); ?>" inputmode="numeric" autocomplete="tel-national" maxlength="10" placeholder="<?php echo esc_attr( isset( $field['placeholder'] ) ? $field['placeholder'] : '' ); ?>"<?php echo $required ? ' aria-required="true"' : ''; ?>>
			</span>
		</p>
		<?php
		return;
	}
	woocommerce_form_field( $key, $field, $checkout->get_value( $key ) );
};

$mi_address_type = (string) $checkout->get_value( 'billing_address_type' );
$mi_address_type = in_array( $mi_address_type, array( 'home', 'work', 'other' ), true ) ? $mi_address_type : 'home';
?>
<div class="checkout-page">
	<div class="checkout-top">
		<a href="<?php echo esc_url( wc_get_cart_url() ); ?>"><?php mi_trends_icon( 'arrow-left', array( 'size' => 15 ) ); ?><?php esc_html_e( 'Back to bag', 'mi-trends' ); ?></a>
		<div class="checkout-progress"><span class="done"><?php mi_trends_icon( 'check', array( 'size' => 12 ) ); ?><?php esc_html_e( 'Bag', 'mi-trends' ); ?></span><i></i><span class="active">2 <?php esc_html_e( 'Checkout', 'mi-trends' ); ?></span><i></i><span>3 <?php esc_html_e( 'Done', 'mi-trends' ); ?></span></div>
		<span><?php mi_trends_icon( 'lock-keyhole', array( 'size' => 14 ) ); ?><?php esc_html_e( 'Secure checkout', 'mi-trends' ); ?></span>
	</div>

	<header><span><?php esc_html_e( 'Almost yours', 'mi-trends' ); ?></span><h1><?php esc_html_e( 'Checkout', 'mi-trends' ); ?></h1><p><?php esc_html_e( 'One page. No surprises. Your total updates as you choose.', 'mi-trends' ); ?></p></header>

	<?php do_action( 'woocommerce_before_checkout_form', $checkout ); ?>

	<form name="checkout" method="post" class="checkout woocommerce-checkout" action="<?php echo esc_url( wc_get_checkout_url() ); ?>" enctype="multipart/form-data" aria-label="<?php esc_attr_e( 'Checkout', 'mi-trends' ); ?>" novalidate>
		<div class="checkout-layout">
			<div class="panels" id="customer_details">
				<?php do_action( 'woocommerce_checkout_before_customer_details' ); ?>

				<section class="panel">
					<div class="panel-title"><b>01</b><div><span><?php esc_html_e( 'Your details', 'mi-trends' ); ?></span><h2><?php esc_html_e( 'Contact', 'mi-trends' ); ?></h2></div></div>
					<div class="fields two-col woocommerce-billing-fields__field-wrapper">
						<?php
						foreach ( $mi_contact as $mi_key ) {
							if ( isset( $mi_fields[ $mi_key ] ) ) {
								$mi_render_field( $mi_key, $mi_fields[ $mi_key ], $checkout );
							}
						}
						?>
					</div>
				</section>

				<section class="panel">
					<div class="panel-title"><b>02</b><div><span><?php esc_html_e( 'Where it’s going', 'mi-trends' ); ?></span><h2><?php esc_html_e( 'Delivery address', 'mi-trends' ); ?></h2></div></div>
					<div class="fields two-col">
						<?php
						foreach ( $mi_address as $mi_key ) {
							if ( isset( $mi_fields[ $mi_key ] ) ) {
								$mi_render_field( $mi_key, $mi_fields[ $mi_key ], $checkout );
							}
						}
						// Fields added by other plugins, so nothing they need goes missing.
						foreach ( $mi_fields as $mi_key => $mi_field ) {
							if ( ! in_array( $mi_key, array_merge( $mi_contact, $mi_address, $mi_special ), true ) ) {
								$mi_render_field( $mi_key, $mi_field, $checkout );
							}
						}
						?>
						<input type="hidden" name="billing_country" id="billing_country" value="<?php echo esc_attr( $checkout->get_value( 'billing_country' ) ? $checkout->get_value( 'billing_country' ) : 'IN' ); ?>">

						<fieldset class="full type-choice">
							<legend><?php esc_html_e( 'Save as', 'mi-trends' ); ?></legend>
							<?php foreach ( array( 'home' => __( 'Home', 'mi-trends' ), 'work' => __( 'Work', 'mi-trends' ), 'other' => __( 'Other', 'mi-trends' ) ) as $mi_value => $mi_label ) : ?>
								<label><input type="radio" name="billing_address_type" value="<?php echo esc_attr( $mi_value ); ?>"<?php checked( $mi_address_type, $mi_value ); ?>><span><?php echo esc_html( $mi_label ); ?></span></label>
							<?php endforeach; ?>
						</fieldset>
					</div>

					<?php if ( WC()->cart->needs_shipping_address() && ! wc_ship_to_billing_address_only() ) : ?>
						<?php // Shipping to a different address is off by default, as in the original; this appears only if it is turned on. ?>
						<div class="woocommerce-shipping-fields"><?php do_action( 'woocommerce_checkout_shipping' ); ?></div>
					<?php endif; ?>
					<?php do_action( 'woocommerce_checkout_after_order_notes', $checkout ); ?>
				</section>

				<section class="panel payment-panel">
					<div class="panel-title"><b>03</b><div><span><?php esc_html_e( 'Pay your way', 'mi-trends' ); ?></span><h2><?php esc_html_e( 'Payment', 'mi-trends' ); ?></h2></div></div>
					<?php woocommerce_checkout_payment(); ?>
				</section>

				<?php do_action( 'woocommerce_checkout_after_customer_details' ); ?>
			</div>

			<aside>
				<?php do_action( 'woocommerce_checkout_before_order_review_heading' ); ?>
				<?php do_action( 'woocommerce_checkout_before_order_review' ); ?>
				<div id="order_review" class="woocommerce-checkout-review-order">
					<?php woocommerce_order_review(); ?>
				</div>
				<?php do_action( 'woocommerce_checkout_after_order_review' ); ?>
			</aside>
		</div>
	</form>

	<?php do_action( 'woocommerce_after_checkout_form', $checkout ); ?>
</div>
