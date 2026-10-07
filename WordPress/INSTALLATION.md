# Installing MI TRENDS on WordPress

A step-by-step guide. No coding needed — every step is a click in WordPress, except two lines
you paste into a settings file for the payment keys (step 12). Budget about an hour.

**You will need**

- A web host that runs WordPress (any managed WordPress host is fine), with **HTTPS** (a padlock in the address bar).
- Your domain pointed at that host.
- A **Razorpay** account (razorpay.com) — it takes UPI payments and the cash-on-delivery advance.
- The two zip files: `dist/mi-trends.zip` (the theme) and `dist/mi-trends-core.zip` (the plugin).
  If `dist/` is empty, run `bash tools/package.sh` from this folder, or zip the folders
  `theme/mi-trends` and `plugins/mi-trends-core` yourself (each zip must contain the folder, not just its files).

---

## 1. Install WordPress

Most hosts have a one-click installer ("Install WordPress" in the host's control panel).

1. Run the installer for your domain.
2. Choose an admin username that is **not** `admin`, a long unique password, and your email.
3. When it finishes, open `https://your-domain/wp-admin/` and sign in.
4. **Settings → General**: Site Title `MI TRENDS`, Tagline `Made to be noticed`, Timezone `Kolkata`, Date format of your choice. **Save**.

## 2. Install WooCommerce

1. **Plugins → Add New Plugin**, search **WooCommerce**, click **Install Now**, then **Activate**.
2. WooCommerce opens a setup wizard. You can **skip** it — MI TRENDS applies the settings it needs
   in step 7. If you go through it, choose India and Indian Rupee.

## 3. Upload the MI TRENDS theme

> Using your host's **File Manager** instead of these upload screens? See
> [docs/deployment.md → Option B](docs/deployment.md#option-b--the-hosts-file-manager-cpanel-hpanel-plesk-)
> — extract each zip inside `wp-content/themes/` or `wp-content/plugins/`, then activate in wp-admin.

1. **Appearance → Themes → Add New Theme → Upload Theme**.
2. Choose `mi-trends.zip`, click **Install Now**. Don't activate yet (step 5).

## 4. Install the MI Trends Core plugin

1. **Plugins → Add New Plugin → Upload Plugin**.
2. Choose `mi-trends-core.zip`, click **Install Now**.

## 5. Activate the theme

**Appearance → Themes**, hover **MI TRENDS**, click **Activate**.

## 6. Activate the plugin

**Plugins → Installed Plugins**, click **Activate** under **MI Trends Core**.
A blue notice appears: "Run the store setup and import the catalogue". A new **MI TRENDS**
menu appears in the left sidebar.

> Order matters only a little: the plugin needs WooCommerce active first. If you see
> "MI Trends Core needs WooCommerce", activate WooCommerce and reload.

## 7. Configure WooCommerce (one click)

1. **MI TRENDS → Settings**.
2. In **Store setup** (right-hand column) click **Run store setup**.

This sets: currency ₹ INR with no paise, selling and shipping to India only, account required
to check out, delivery to the billing address, low-stock alert at 12 units, verified-buyer
reviews, email colours, permalinks ("Post name" if they were "Plain"). It creates the Size
attribute (XS–XXL), categories (Men, Women, Unisex), tags (new, bestseller, sale), collections
(Everyday Icons, Soft Nights), product types (T-shirt, Shirt, Pyjama Set), the **India**
shipping zone with the MI TRENDS delivery rate, and the pages: Shop, Bag (cart), Checkout,
Account (at `/account/`), Wishlist, and Info with all its sub-pages (About, Shipping, Returns,
FAQs, Contact, Track order, Size guide, Terms, Privacy, …).

A list of what was done appears at the top. Running it again is safe.

## 8. Import the products

On the same screen, in **Catalogue**, leave **Load product photos** ticked and click
**Import catalogue**. In under a minute you get the ten MI TRENDS products with photos,
sizes XS–XXL, MRP and sale prices, stock per size, colours, fit, fabric, ratings — and the
coupons **MI10**, **FLAT200**, **FIRST15** and **FREESHIP**.

Check: **Products → All Products** lists ten products. Open one: the **Variations** tab has six
sizes with stock; the **MI TRENDS** tab has colours, fit and fabric.

> Adding your own products later: **Products → Add New**, choose **Variable product**, on
> **Attributes** add **Size** and tick "Used for variations", **Variations → Generate variations**,
> set each size's price and stock, fill the **MI TRENDS** tab (colours one per line as
> `Name | #hex`), and set **Collection** and **Product type** in the right-hand boxes.

## 9. Check the pages

**Pages → All Pages** should show Shop, Bag, Checkout, Account, Wishlist, Info (with children).
Nothing to set — the theme knows each page.

Optional, recommended: **Settings → Reading → Your homepage displays → A static page**, choose
"Home" (create an empty page called Home first). The MI TRENDS homepage appears either way.

## 10. Menus (optional)

The header, mobile drawer and footer already show the original links (Men, Women, Collections,
New, Sale; Shop/Help/MI TRENDS/Legal columns). To change them: **Appearance → Menus**, create a
menu, assign it to a location ("Primary navigation", "Footer — Help", …). To make an item red
like **Sale**, open **Screen Options** at the top, tick **CSS Classes**, and give the item the
class `is-sale`.

## 11. Homepage

**Appearance → Customize → MI TRENDS homepage**: three hero slides (headline, text, button,
link, photo, colours). Empty fields keep the original copy. The announcement bar messages are
in **MI TRENDS → Settings → Announcement bar**.

## 12. Payments (Razorpay: UPI + cash on delivery with UPI advance)

1. In the Razorpay Dashboard → **Account & Settings → API Keys**, generate keys. Start with
   **Test mode** keys (they begin `rzp_test_`).
2. Add them to `wp-config.php` (your host's File Manager or SFTP; the file is in the site's top
   folder). Paste **above** the line `/* That's all, stop editing! */`:

   ```php
   define( 'MI_RAZORPAY_KEY_ID', 'rzp_test_xxxxxxxxxxxx' );
   define( 'MI_RAZORPAY_KEY_SECRET', 'xxxxxxxxxxxxxxxxxxxxxxxx' );
   ```

   (No file access? You can paste them on the UPI gateway's settings page instead — less safe.)
3. **WooCommerce → Settings → Payments**: enable **MI TRENDS — UPI (Razorpay)** and
   **MI TRENDS — Cash on delivery (UPI advance)**. Disable anything else you don't use.
4. In Razorpay → **Settings → Payment capture**, choose **automatic capture**.
5. Optional but recommended: Razorpay → **Webhooks → Add**: URL
   `https://your-domain/wp-json/mi-trends/v1/razorpay/webhook`, event **payment.captured**,
   a secret of your choice; add `define( 'MI_RAZORPAY_WEBHOOK_SECRET', 'that-secret' );` to wp-config.php.
   This completes orders even if a shopper closes the tab right after paying.
6. COD rules (minimum ₹800, 20% advance, ₹49 fee) are in **MI TRENDS → Settings → Cash on delivery**.

## 13. Shipping

Done by the setup: free delivery from ₹999, ₹79 below. Change the amounts in
**MI TRENDS → Settings → Shipping**. To see the zone: **WooCommerce → Settings → Shipping → India**.

## 14. Email

1. **WooCommerce → Settings → Emails**: set "From" name `MI TRENDS` and a From address on your
   domain (e.g. `orders@your-domain`). Colours are already set.
2. WordPress's built-in mail is unreliable on many hosts. Install **WP Mail SMTP** (or your
   host's mail plugin) and connect it to your email provider (Google Workspace, Zoho, SES…).
   Send its test email.
3. "MI TRENDS order update" (in the same list) is sent when you mark an order Confirmed,
   Packed, Shipped, Delivered or Returned.

## 15. Other settings

- **MI TRENDS → Settings → Store identity**: support email/phone/hours (shown on Contact),
  return address (printed on shipping labels).
- **Tax / GST**: prices are entered including tax ("Inclusive of all taxes", as on the original
  site). If you need GST invoices, see WOOCOMMERCE-SETUP.md → Tax.
- **Google sign-in** (optional): install **Nextend Social Login**, set up Google there; its button
  appears on the sign-in and sign-up screens automatically.
- **Security, backups, caching**: see WORDPRESS-SETUP.md (install a backup plugin before going live).

## 16. Test the website

Use Razorpay **test** keys for all of this.

- [ ] Homepage: hero slides move, category bubbles, product rails, newsletter sign-up shows a toast.
- [ ] Shop: filters (Category, Type, Size, Collection, Tag, Price, Discount), sort, search (`/` key).
- [ ] Product: switch colour and size, size guide, pincode check, add to bag → bag drawer opens.
- [ ] Wishlist heart on a card → count in the header → Wishlist page.
- [ ] Bag: change quantity, apply `MI10`, `FLAT200` (needs ₹1,499), `FIRST15` (needs ₹999).
- [ ] Checkout while signed out → sign-up page → back to checkout.
- [ ] Pay by UPI with a Razorpay test UPI ID (`success@razorpay`) → confirmation page with order ID.
- [ ] Cash on delivery on a bag over ₹800 → advance shown → pay → confirmation shows due on delivery.
- [ ] wp-admin: the order is **Processing**; set Confirmed → Packed → Shipped → Delivered;
      the customer gets emails; **Print shipping label** works; stock went down (MI TRENDS → Inventory → Stock movement).
- [ ] Track order page with the order ID + email.
- [ ] Contact form → message in MI TRENDS → Messages.
- [ ] Phone check: open the site on a phone — bottom tab bar, mobile buy bar on products, drawers.

## 17. Make the website live

1. Swap the Razorpay keys in wp-config.php for **live** keys (`rzp_live_…`) and update the webhook.
2. **WooCommerce → Settings → Site visibility**: choose **Live** and save. New WooCommerce
   stores start in "Coming soon" mode, where only signed-in admins can see the shop.
3. **Settings → Reading**: untick "Discourage search engines".
4. Delete the test orders (WooCommerce → Orders → select → Move to Trash).
5. Check the legal pages (Info → Terms, Privacy, Returns) say what you actually do.
6. Run through docs/deployment.md (backups, caching, monitoring) — then share the link.

Stuck? WORDPRESS-SETUP.md and WOOCOMMERCE-SETUP.md explain each setting in more depth;
docs/deployment.md has troubleshooting.
