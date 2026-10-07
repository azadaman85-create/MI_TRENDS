# Checkout

**Map only — the code is in `theme/mi-trends/` and `plugins/mi-trends-core/`. Nothing in this folder is uploaded.**

From the checkout page to the order confirmation.

| Original (Next.js) | WordPress file(s) | Notes |
|---|---|---|
| `app/(store)/checkout/page.tsx` | [`theme/mi-trends/woocommerce/checkout/form-checkout.php`](../../theme/mi-trends/woocommerce/checkout/form-checkout.php) | Three numbered panels (Contact, Delivery address, Payment) + dark summary. Signed-out shoppers are redirected to sign-up ([`plugins/mi-trends-core/includes/class-mi-core-checkout.php`](../../plugins/mi-trends-core/includes/class-mi-core-checkout.php)). |
| `summary card` | [`theme/mi-trends/woocommerce/checkout/review-order.php`](../../theme/mi-trends/woocommerce/checkout/review-order.php) | Re-rendered by WooCommerce on every change: pieces, ETA, subtotal, coupon, shipping, COD fee, total, pay-now / on-delivery split, Pay button. |
| `payment method cards` | [`theme/mi-trends/woocommerce/checkout/payment.php`](../../theme/mi-trends/woocommerce/checkout/payment.php), [`theme/mi-trends/woocommerce/checkout/payment-method.php`](../../theme/mi-trends/woocommerce/checkout/payment-method.php) | UPI and Cash on delivery cards; disabled COD card with the reason when the bag is below the minimum. |
| `inline validation (validate())` | [`theme/mi-trends/assets/js/checkout.js`](../../theme/mi-trends/assets/js/checkout.js) + [`plugins/mi-trends-core/includes/class-mi-core-checkout.php`](../../plugins/mi-trends-core/includes/class-mi-core-checkout.php) | Same rules and messages in the browser and on the server. |
| `Razorpay modal + /api/create-order + /api/verify-payment` | [`theme/mi-trends/woocommerce/checkout/order-receipt.php`](../../theme/mi-trends/woocommerce/checkout/order-receipt.php), [`plugins/mi-trends-core/includes/gateways/class-mi-core-gateway-razorpay.php`](../../plugins/mi-trends-core/includes/gateways/class-mi-core-gateway-razorpay.php), [`plugins/mi-trends-core/assets/js/razorpay.js`](../../plugins/mi-trends-core/assets/js/razorpay.js), [`plugins/mi-trends-core/api/class-mi-core-rest.php`](../../plugins/mi-trends-core/api/class-mi-core-rest.php) | Order is created, then the payment step opens Razorpay; the signature is verified server-side. |
| `COD rules (codPlanFor)` | [`plugins/mi-trends-core/includes/class-mi-core-cod.php`](../../plugins/mi-trends-core/includes/class-mi-core-cod.php), [`plugins/mi-trends-core/includes/gateways/class-mi-core-gateway-cod-advance.php`](../../plugins/mi-trends-core/includes/gateways/class-mi-core-gateway-cod-advance.php) |  |
| `app/(store)/order-success/page.tsx` | [`theme/mi-trends/woocommerce/checkout/thankyou.php`](../../theme/mi-trends/woocommerce/checkout/thankyou.php) | Real WooCommerce order (order-received endpoint), copy order ID, advance/balance, ETA, next steps. |
| `delivery fee rules` | [`plugins/mi-trends-core/includes/class-mi-core-shipping-method.php`](../../plugins/mi-trends-core/includes/class-mi-core-shipping-method.php) | Free from ₹999, ₹79 below. |
