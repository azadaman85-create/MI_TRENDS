# Pages

Every route of the Next.js storefront and its WordPress equivalent. File-level detail: [../templates/](../templates/).

| Original route | WordPress URL | Rendered by | Created by |
|---|---|---|---|
| `/` | `/` | `front-page.php` | theme (always the front page) |
| `/shop` (+ `?category`, `?type`, `?tag`, `?collection`, `?size`, `?price`, `?discount`, `?q`, `?sort`) | `/shop/` (same parameters) | `woocommerce/archive-product.php` | store setup (WooCommerce Shop page) |
| `/product/[slug]` | `/product/[slug]/` | `woocommerce/single-product.php` | catalogue import |
| `/cart` | `/cart/` | `woocommerce/cart/cart.php`, `cart-empty.php` | store setup (classic shortcode) |
| `/checkout` | `/checkout/` | `woocommerce/checkout/form-checkout.php` | store setup (classic shortcode) |
| — (Razorpay modal) | `/checkout/order-pay/{id}/` | `woocommerce/checkout/order-receipt.php` | WooCommerce endpoint |
| `/order-success` | `/checkout/order-received/{id}/` | `woocommerce/checkout/thankyou.php` | WooCommerce endpoint |
| `/account` | `/account/` | `woocommerce/myaccount/dashboard.php` | store setup (My Account slug "account") |
| `/account/login` | `/account/login/` | `woocommerce/myaccount/form-login.php` | plugin rewrite rule |
| `/account/signup` | `/account/signup/` | same, sign-up mode | plugin rewrite rule |
| — | `/account/orders/`, `/account/view-order/{id}/`, `/account/edit-address/`, `/account/edit-account/`, `/account/lost-password/` | WooCommerce in the MI shell (`my-account.php`) | WooCommerce endpoints (new: real order history) |
| `/wishlist` | `/wishlist/` | `page-templates/wishlist.php` | store setup |
| `/info/about`, `careers`, `press`, `shipping`, `returns`, `terms`, `privacy`, `accessibility` | `/info/…/` | `page.php` | store setup (content from the original) |
| `/info/gift-cards`, `stores` | `/info/…/` | `page-templates/info-notify.php` | store setup |
| `/info/contact` | `/info/contact/` | `page-templates/info-contact.php` | store setup |
| `/info/faqs` | `/info/faqs/` | `page-templates/info-faqs.php` | store setup |
| `/info/track-order` | `/info/track-order/` | `page-templates/info-track-order.php` | store setup |
| `/info/size-guide` | `/info/size-guide/` | `page-templates/info-size-guide.php` | store setup |
| `/info/account` | `/info/account/` | `page-templates/info-account.php` | store setup |
| unknown `/info/*`, any 404 | — | `404.php` | theme |
| `/collection/[slug]` (linked from cards, never existed) | `/shop/?collection=[slug]` | shop | links updated |
| `/admin/*` | `/wp-admin/` | see [../admin/](../admin/) | WordPress |

Editing a page: **Pages → All Pages → Info → (page)**. The big headline, small red eyebrow and
intro come from the *MI TRENDS page header* box on the right; use `|` in the headline for a line
break. Body text in Group blocks with the class `simple-section` draws as the original's bordered cards.
