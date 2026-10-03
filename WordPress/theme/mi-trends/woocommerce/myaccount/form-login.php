<?php
/**
 * Sign in / Create account — app/(store)/account/login and account/signup.
 *
 * WooCommerce shows this template on My Account for signed-out visitors. MI
 * Trends Core maps the original routes onto it: /account/login/ and
 * /account/signup/ (query var mi_auth). Field names, nonces and submit names
 * are WooCommerce's own, so its login and registration handlers process the
 * forms; MI Trends Core adds the name and mobile fields to registration.
 *
 * Google sign-in: the original used Google Identity Services in the browser.
 * Install a social-login plugin and hook its button into `mi_trends_social_login`
 * (see WOOCOMMERCE-SETUP.md); the "or" divider appears only when a button does.
 *
 * @package MI_Trends
 * @version 9.9.0 (WooCommerce template version this override was written against)
 */

defined( 'ABSPATH' ) || exit;

$mi_mode = get_query_var( 'mi_auth' );
if ( ! $mi_mode ) {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- choosing which form to display.
	$mi_mode = isset( $_GET['action'] ) && 'register' === $_GET['action'] ? 'signup' : 'login';
}
if ( 'signup' === $mi_mode && 'yes' !== get_option( 'woocommerce_enable_myaccount_registration' ) ) {
	$mi_mode = 'login';
}

// phpcs:disable WordPress.Security.NonceVerification -- reading the return path and re-filling fields after a failed post.
$mi_next = isset( $_GET['next'] ) ? mi_trends_safe_next( wp_unslash( $_GET['next'] ) ) : '';
if ( ! $mi_next && isset( $_POST['redirect'] ) ) {
	$mi_next = wp_validate_redirect( wp_unslash( $_POST['redirect'] ), '' );
}
$mi_old_email = isset( $_POST['email'] ) ? sanitize_email( wp_unslash( $_POST['email'] ) ) : ( isset( $_POST['username'] ) ? sanitize_text_field( wp_unslash( $_POST['username'] ) ) : '' );
$mi_old_name  = isset( $_POST['mi_name'] ) ? sanitize_text_field( wp_unslash( $_POST['mi_name'] ) ) : '';
$mi_old_phone = isset( $_POST['billing_phone'] ) ? preg_replace( '/\D/', '', sanitize_text_field( wp_unslash( $_POST['billing_phone'] ) ) ) : '';
// phpcs:enable

$mi_next_path = $mi_next ? wp_make_link_relative( $mi_next ) : '';
$mi_redirect  = $mi_next ? $mi_next : wc_get_page_permalink( 'myaccount' );

// Errors from WooCommerce's handlers, shown as the original's alert box.
$mi_errors = function_exists( 'wc_get_notices' ) ? wc_get_notices( 'error' ) : array();
if ( $mi_errors ) {
	wc_clear_notices();
}

ob_start();
do_action( 'mi_trends_social_login', $mi_mode, $mi_redirect );
$mi_social = trim( ob_get_clean() );

$mi_alert = static function () use ( $mi_errors ) {
	foreach ( $mi_errors as $mi_error ) {
		echo '<p class="acct__alert" role="alert">';
		mi_trends_icon( 'triangle-alert', array( 'size' => 16 ) );
		echo '<span>' . wp_kses_post( is_array( $mi_error ) ? $mi_error['notice'] : $mi_error ) . '</span></p>';
	}
};

do_action( 'woocommerce_before_customer_login_form' );

if ( 'signup' === $mi_mode ) :
	mi_trends_part(
		'components/auth-shell',
		array(
			'eyebrow'   => __( 'Join the list', 'mi-trends' ),
			'title'     => __( 'Create account', 'mi-trends' ),
			'lede'      => __( 'One account for your wishlist, orders and early access to every drop.', 'mi-trends' ),
			'statement' => __( 'Made to be <em>noticed</em>.', 'mi-trends' ),
			'body'      => static function () use ( $mi_alert, $mi_redirect, $mi_next_path, $mi_old_email, $mi_old_name, $mi_old_phone, $mi_social ) {
				$mi_alert();
				$generate_password = 'yes' === get_option( 'woocommerce_registration_generate_password' );
				?>
				<form class="acct__form woocommerce-form woocommerce-form-register register" method="post" novalidate data-mi-auth="signup" <?php do_action( 'woocommerce_register_form_tag' ); ?>>
					<?php do_action( 'woocommerce_register_form_start' ); ?>

					<div class="acct__field">
						<label for="mi_name"><?php esc_html_e( 'Full name', 'mi-trends' ); ?></label>
						<div class="acct__input-wrap">
							<?php mi_trends_icon( 'user-round', array( 'size' => 16 ) ); ?>
							<input id="mi_name" class="acct__input" name="mi_name" value="<?php echo esc_attr( $mi_old_name ); ?>" autocomplete="name" placeholder="<?php esc_attr_e( 'Enter your full name', 'mi-trends' ); ?>" required>
						</div>
					</div>

					<?php if ( 'no' === get_option( 'woocommerce_registration_generate_username' ) ) : ?>
						<div class="acct__field">
							<label for="reg_username"><?php esc_html_e( 'Username', 'mi-trends' ); ?></label>
							<div class="acct__input-wrap">
								<?php mi_trends_icon( 'user-round', array( 'size' => 16 ) ); ?>
								<input id="reg_username" class="acct__input" name="username" autocomplete="username" required>
							</div>
						</div>
					<?php endif; ?>

					<div class="acct__field">
						<label for="reg_email"><?php esc_html_e( 'Email', 'mi-trends' ); ?></label>
						<div class="acct__input-wrap">
							<?php mi_trends_icon( 'mail', array( 'size' => 16 ) ); ?>
							<input id="reg_email" class="acct__input" type="email" name="email" value="<?php echo esc_attr( $mi_old_email ); ?>" autocomplete="email" placeholder="you@example.com" required>
						</div>
					</div>

					<div class="acct__field">
						<label for="reg_phone"><?php esc_html_e( 'Mobile number', 'mi-trends' ); ?></label>
						<div class="acct__input-wrap acct__input-wrap--prefixed">
							<?php mi_trends_icon( 'phone', array( 'size' => 16 ) ); ?>
							<span class="acct__prefix" aria-hidden="true">+91</span>
							<input id="reg_phone" class="acct__input acct__input--prefixed" type="tel" name="billing_phone" value="<?php echo esc_attr( $mi_old_phone ); ?>" inputmode="numeric" maxlength="10" autocomplete="tel-national" placeholder="<?php esc_attr_e( 'Enter your mobile number', 'mi-trends' ); ?>" aria-describedby="phone-help" required>
						</div>
						<span class="acct__hint" id="phone-help"><?php esc_html_e( 'We only use this for delivery and order updates.', 'mi-trends' ); ?></span>
					</div>

					<?php if ( ! $generate_password ) : ?>
						<div class="acct__field">
							<label for="reg_password"><?php esc_html_e( 'Password', 'mi-trends' ); ?></label>
							<div class="acct__input-wrap">
								<?php mi_trends_icon( 'lock', array( 'size' => 16 ) ); ?>
								<input id="reg_password" class="acct__input" type="password" name="password" autocomplete="new-password" placeholder="<?php esc_attr_e( 'At least 8 characters', 'mi-trends' ); ?>" required data-mi-strength>
								<button class="acct__reveal" type="button" data-mi-reveal aria-label="<?php esc_attr_e( 'Show password', 'mi-trends' ); ?>" aria-pressed="false">
									<?php mi_trends_icon( 'eye', array( 'size' => 17 ) ); ?>
								</button>
							</div>
							<span class="acct__hint" aria-live="polite" data-mi-strength-hint><?php esc_html_e( 'Use 8+ characters with a number or symbol.', 'mi-trends' ); ?></span>
						</div>
					<?php else : ?>
						<p class="acct__hint"><?php esc_html_e( 'A link to set a new password will be sent to your email address.', 'mi-trends' ); ?></p>
					<?php endif; ?>

					<?php do_action( 'woocommerce_register_form' ); ?>

					<?php wp_nonce_field( 'woocommerce-register', 'woocommerce-register-nonce' ); ?>
					<input type="hidden" name="redirect" value="<?php echo esc_url( $mi_redirect ); ?>">
					<button class="acct__submit woocommerce-form-register__submit" type="submit" name="register" value="<?php esc_attr_e( 'Create account', 'mi-trends' ); ?>">
						<?php esc_html_e( 'Create account', 'mi-trends' ); ?> <?php mi_trends_icon( 'arrow-right', array( 'size' => 16 ) ); ?>
					</button>

					<?php do_action( 'woocommerce_register_form_end' ); ?>
				</form>

				<?php if ( $mi_social ) : ?>
					<div class="acct__divider"><?php esc_html_e( 'or', 'mi-trends' ); ?></div>
					<?php echo $mi_social; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- markup from the social-login plugin hooked in by the site owner. ?>
				<?php endif; ?>

				<p class="acct__switch">
					<?php esc_html_e( 'Already have an account?', 'mi-trends' ); ?>
					<a href="<?php echo esc_url( mi_trends_account_url( 'login', $mi_next_path ) ); ?>"><?php esc_html_e( 'Sign in', 'mi-trends' ); ?></a>
				</p>
				<p class="acct__legal">
					<?php
					printf(
						/* translators: 1: terms link, 2: privacy link */
						esc_html__( 'By creating an account you agree to our %1$s and %2$s.', 'mi-trends' ),
						'<a href="' . esc_url( mi_trends_info_url( 'terms' ) ) . '">' . esc_html__( 'terms', 'mi-trends' ) . '</a>',
						'<a href="' . esc_url( mi_trends_info_url( 'privacy' ) ) . '">' . esc_html__( 'privacy policy', 'mi-trends' ) . '</a>'
					);
					?>
				</p>
				<?php
			},
		)
	);
else :
	mi_trends_part(
		'components/auth-shell',
		array(
			'eyebrow'   => __( 'Welcome back', 'mi-trends' ),
			'title'     => __( 'Sign in', 'mi-trends' ),
			'lede'      => __( 'Your bag, wishlist and orders — right where you left them.', 'mi-trends' ),
			'statement' => __( 'Drops hit <em>your</em> inbox first.', 'mi-trends' ),
			'body'      => static function () use ( $mi_alert, $mi_redirect, $mi_next_path, $mi_old_email, $mi_social ) {
				$mi_alert();
				?>
				<form class="acct__form woocommerce-form woocommerce-form-login login" method="post" novalidate data-mi-auth="login">
					<?php do_action( 'woocommerce_login_form_start' ); ?>

					<div class="acct__field">
						<label for="username"><?php esc_html_e( 'Email', 'mi-trends' ); ?></label>
						<div class="acct__input-wrap">
							<?php mi_trends_icon( 'mail', array( 'size' => 16 ) ); ?>
							<input id="username" class="acct__input" type="text" name="username" value="<?php echo esc_attr( $mi_old_email ); ?>" autocomplete="username" placeholder="you@example.com" required>
						</div>
					</div>

					<div class="acct__field">
						<label for="password"><?php esc_html_e( 'Password', 'mi-trends' ); ?></label>
						<div class="acct__input-wrap">
							<?php mi_trends_icon( 'lock', array( 'size' => 16 ) ); ?>
							<input id="password" class="acct__input" type="password" name="password" autocomplete="current-password" placeholder="••••••••" required>
							<button class="acct__reveal" type="button" data-mi-reveal aria-label="<?php esc_attr_e( 'Show password', 'mi-trends' ); ?>" aria-pressed="false">
								<?php mi_trends_icon( 'eye', array( 'size' => 17 ) ); ?>
							</button>
						</div>
					</div>

					<?php do_action( 'woocommerce_login_form' ); ?>

					<div class="acct__row">
						<label style="display:flex;align-items:center;gap:8px">
							<input type="checkbox" name="rememberme" value="forever" checked style="accent-color:#171717;width:16px;height:16px">
							<?php esc_html_e( 'Keep me signed in', 'mi-trends' ); ?>
						</label>
						<a href="<?php echo esc_url( wp_lostpassword_url() ); ?>"><?php esc_html_e( 'Forgot password?', 'mi-trends' ); ?></a>
					</div>

					<?php wp_nonce_field( 'woocommerce-login', 'woocommerce-login-nonce' ); ?>
					<input type="hidden" name="redirect" value="<?php echo esc_url( $mi_redirect ); ?>">
					<button class="acct__submit woocommerce-form-login__submit" type="submit" name="login" value="<?php esc_attr_e( 'Sign in', 'mi-trends' ); ?>">
						<?php esc_html_e( 'Sign in', 'mi-trends' ); ?> <?php mi_trends_icon( 'arrow-right', array( 'size' => 16 ) ); ?>
					</button>

					<?php do_action( 'woocommerce_login_form_end' ); ?>
				</form>

				<?php if ( $mi_social ) : ?>
					<div class="acct__divider"><?php esc_html_e( 'or', 'mi-trends' ); ?></div>
					<?php echo $mi_social; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- markup from the social-login plugin hooked in by the site owner. ?>
				<?php endif; ?>

				<?php if ( 'yes' === get_option( 'woocommerce_enable_myaccount_registration' ) ) : ?>
					<p class="acct__switch">
						<?php esc_html_e( 'New to MI TRENDS?', 'mi-trends' ); ?>
						<a href="<?php echo esc_url( mi_trends_account_url( 'signup', $mi_next_path ) ); ?>"><?php esc_html_e( 'Create an account', 'mi-trends' ); ?></a>
					</p>
				<?php endif; ?>

				<p class="acct__legal"><?php esc_html_e( 'An account is needed to place an order — it keeps your bag, delivery details and order history together.', 'mi-trends' ); ?></p>
				<?php
			},
		)
	);
endif;

do_action( 'woocommerce_after_customer_login_form' );
