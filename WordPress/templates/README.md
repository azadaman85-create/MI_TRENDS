# templates/ — where each storefront page and component lives

**This folder is a map, not code. Do not upload it.**

WordPress only loads templates from inside a theme (`wp-content/themes/mi-trends/`), so the
real files are in [`theme/mi-trends/`](../theme/mi-trends/). Keeping a second copy here would
mean two versions drifting apart. Each sub-folder below lists, for one area of the site:

- the original Next.js file it reproduces (in `../mi-trends/`)
- the WordPress file(s) that implement it now
- what to edit when you want to change it

| Folder | Covers |
|---|---|
| [pages/](pages/) | Home, info pages (About, Shipping, Returns, Contact, FAQs, Track order, Size guide …), Wishlist, 404, search, generic pages |
| [shop/](shop/) | Shop / category listing, filter token bar, sorting, search results |
| [products/](products/) | Product detail page, product card, product visual (photo SVG), size guide |
| [cart/](cart/) | Bag page, empty bag, cart drawer |
| [checkout/](checkout/) | Checkout, order summary, payment cards, Razorpay step, order confirmation |
| [account/](account/) | Sign in, sign up, account home, orders / addresses screens |
| [components/](components/) | Header, footer, navigation, search overlay, mobile tab bar, toast, newsletter, icons |

How WordPress picks a template: WordPress's [template hierarchy](https://developer.wordpress.org/themes/basics/template-hierarchy/)
for pages, and WooCommerce's [template overrides](https://woocommerce.com/document/template-structure/)
(files in `theme/mi-trends/woocommerce/` replace WooCommerce's own).
