# Account

**Map only — the code is in `theme/mi-trends/` and `plugins/mi-trends-core/`. Nothing in this folder is uploaded.**

Sign in, sign up and the customer's account.

| Original (Next.js) | WordPress file(s) | Notes |
|---|---|---|
| `app/(store)/account/login/page.tsx` | [`theme/mi-trends/woocommerce/myaccount/form-login.php`](../../theme/mi-trends/woocommerce/myaccount/form-login.php) | At `/account/login/`. Uses WooCommerce's login handler and nonce. |
| `app/(store)/account/signup/page.tsx` | [`theme/mi-trends/woocommerce/myaccount/form-login.php`](../../theme/mi-trends/woocommerce/myaccount/form-login.php) | At `/account/signup/` (same template, sign-up mode). Name + Indian mobile + password, validated in [`plugins/mi-trends-core/includes/class-mi-core-accounts.php`](../../plugins/mi-trends-core/includes/class-mi-core-accounts.php). |
| `components/account/AuthShell.tsx` | [`theme/mi-trends/template-parts/components/auth-shell.php`](../../theme/mi-trends/template-parts/components/auth-shell.php) | Photo panel, statement, perks. |
| `components/account/GoogleAuthButton.tsx` | hook `mi_trends_social_login` | Optional: Nextend Social Login's Google button appears automatically. |
| `app/(store)/account/page.tsx` | [`theme/mi-trends/woocommerce/myaccount/dashboard.php`](../../theme/mi-trends/woocommerce/myaccount/dashboard.php) | Greeting, avatar, sign out, cards (+ Orders, Addresses, Account details), account details. |
| `— (new: real order history)` | [`theme/mi-trends/woocommerce/myaccount/my-account.php`](../../theme/mi-trends/woocommerce/myaccount/my-account.php) | WooCommerce's Orders / View order / Addresses / Account details screens inside the MI TRENDS shell. |
| `components/account/account.css` | [`theme/mi-trends/assets/css/account.css`](../../theme/mi-trends/assets/css/account.css) | Copied unchanged. |
