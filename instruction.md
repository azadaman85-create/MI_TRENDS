# MI TRENDS — Full-Stack Audit, Cloud Storage Migration, Domain Fix & Live E-Commerce Launch

**Production Website:** https://mitrends.co.in
**GitHub Repository:** https://github.com/azadaman85-create/MI_TRENDS.git
**Hosting Platform:** Vercel
**Domain Provider:** GoDaddy
**Database:** MongoDB Atlas or the existing cloud MongoDB deployment
**Image Storage:** Existing cloud image provider, or Cloudinary/Vercel Blob if required

## PRIMARY OBJECTIVE

Perform a complete technical audit of my existing MI Trends e-commerce website, identify the root causes of all existing issues, implement the necessary fixes, deploy the corrected application, and verify the complete production workflow from the admin dashboard to a successful customer order.

I have already connected GoDaddy and Vercel. Verify that the actual configuration is correct. Do not assume that the integration is working simply because the platforms are connected.

**Critical requirement:** The live website must be fully cloud-hosted. No production product data, uploaded images, customer data, inventory records, payment records, or orders may depend on my local computer, a localhost server, temporary filesystem storage, or an in-memory database.

Do not merely explain how to fix the problems. Inspect the existing codebase, implement fixes wherever access permits, deploy through the existing deployment workflow, and verify the results using real evidence.

## 1. Audit the Complete Frontend and Backend

Inspect the entire existing project before changing anything.

Identify the current:

* Frontend and backend frameworks and API routes.
* Admin dashboard and product management implementation.
* MongoDB connection and database operations.
* Image upload mechanism and image storage locations.
* Authentication provider and Google OAuth configuration.
* Shopping cart, checkout, payment gateway, and order management.
* GitHub integration, Vercel settings, GoDaddy DNS records, and production environment variables.

Trace the complete data flow:

**Admin Dashboard → Backend API → Cloud Image Storage → MongoDB → Frontend Product Listing → Cart → Authentication → Checkout → Razorpay → Order Confirmation → Admin Order Dashboard.**

Find broken connections, incorrect configurations, missing API calls, runtime errors, incomplete features, and production-only failures.

Preserve the existing design, logo, branding, product catalogue, and working functionality unless a change is necessary.

## 2. Fix Admin Product Creation, Editing and Publishing

My admin dashboard allows me to create and edit products and upload product images. Verify whether these operations actually persist correctly in the production cloud database and display on the frontend.

Audit every relevant operation:

* Create a product.
* Edit product details.
* Upload or replace product images.
* Change prices, sale prices, stock, sizes, colors, variants, category, SKU and description.
* Save drafts.
* Publish and unpublish products.
* Update inventory.
* Delete products where authorized.

Requirements:

1. Save product records and changes to the production MongoDB database.
2. Ensure every supported product field is saved correctly.
3. Fix broken APIs, database writes, validation, request payloads, and frontend data-fetching logic.
4. Ensure editing an existing product updates the correct record without creating duplicates.
5. Ensure published products appear on the live storefront with the correct details and images.
6. Ensure unpublished or draft products are not publicly visible.
7. Refreshing a page, restarting the application, or deploying new code must not erase saved products.
8. Display success messages only after the backend confirms that the changes were saved successfully.
9. Show meaningful error messages when saving, publishing, or uploading fails.
10. Verify both product listing APIs and individual product detail APIs.

Test product creation and editing against the live production database. Do not rely exclusively on mock data or a local development database.

## 3. Fix Image Uploads and Permanent Cloud Storage

Investigate exactly where product images are currently stored.

Search for local upload directories, project folders, temporary files, Base64 storage, in-memory image references, Vercel filesystem writes, and hardcoded local image paths.

Implement permanent cloud image storage.

Preferred approach:

* Store actual image files in an existing persistent cloud storage provider.
* If none exists, evaluate Cloudinary or Vercel Blob and configure a suitable solution.
* Store the resulting HTTPS image URL and associated metadata in MongoDB.
* Keep MongoDB product records linked to the correct images.

Verify that:

* Images upload successfully through the admin dashboard.
* Only authorized administrators can upload images.
* File types, sizes, and content are validated safely.
* Main and additional product images display correctly.
* Replacing an image updates the appropriate product.
* Failed uploads do not save broken image URLs.
* Existing images are preserved or migrated where necessary.
* Images continue working after a new Vercel deployment.

Do not use Vercel's temporary filesystem or my local computer as permanent production image storage.

## 4. Make MongoDB the Persistent Production Database

Verify the actual database connection used by the live website.

Requirements:

* Use MongoDB Atlas or the existing equivalent cloud-hosted MongoDB service.
* Configure the production database connection securely through Vercel environment variables.
* Confirm that production API routes use the intended cloud database, not localhost or local MongoDB.
* Validate database schemas, permissions, indexes, connection handling, and error handling.
* Ensure product, customer, order, payment reference, and inventory records persist correctly.
* Handle duplicate requests and conflicting inventory updates safely.
* Configure backups and document a recovery process.

Never delete, reset, or overwrite existing production data without explicit authorization and a verified backup.

## 5. Fix the Custom Domain — Remove Unwanted Vercel URLs

My website is supposed to use:

**https://mitrends.co.in**

However, the Vercel URL is still appearing or being used when I visit the website.

Find the exact cause and fix it.

Check:

* The custom domain configuration in the correct Vercel project.
* GoDaddy DNS records, including required A, CNAME, and verification records.
* DNS conflicts and incorrect forwarding rules.
* The Vercel production domain and deployment configuration.
* SSL certificate and HTTPS status.
* `vercel.json`, routing, redirects, and middleware.
* Hardcoded Vercel URLs in frontend or backend code.
* API base URLs and environment variables.
* Google OAuth callback and allowed-origin URLs.
* Razorpay return URLs and webhook endpoints.
* SEO canonical URLs, sitemap, robots.txt, and social-sharing metadata.

Expected result:

1. Customers use `https://mitrends.co.in` as the primary domain.
2. HTTPS works without certificate errors.
3. The preferred hostname and redirects are consistent.
4. Public-facing links and canonical metadata use the custom domain.
5. Unnecessary Vercel-hostname redirects are removed or configured appropriately.
6. Preview deployments and internal Vercel functionality continue working.
7. Existing DNS records needed for email and other services are preserved.

Do not blindly replace DNS records. Inspect the actual configuration and identify which records need changing before applying modifications.

Verify the result using actual HTTP requests, redirects, SSL checks, and the deployed application.

## 6. Verify the Entire Google Authentication Workflow

Audit Google sign-up and sign-in on the production domain.

Test:

* Google OAuth configuration and callback URLs.
* Successful customer registration and login.
* Session creation, persistence, expiration, and logout.
* Secure cookies over HTTPS.
* Error handling for failed authentication.
* Customer profile persistence in the intended cloud database.
* Checkout access for logged-in and logged-out users.
* Protection against unauthorized access to customer information and orders.

Update the authorized Google OAuth origins and redirect URIs where required.

Preserve existing working authentication features. Do not replace the authentication provider unnecessarily.

Never expose Google OAuth secrets or other authentication credentials in frontend code or GitHub.

## 7. Enforce Sign-Up Before Checkout

Implement and test the following exact customer journey:

**Browse Products → Add to Cart → Proceed to Checkout → Sign Up or Log In → Enter Delivery Details → Review Order → Select UPI/Razorpay → Complete Payment → Verify Payment → Confirm Order.**

Requirements:

* Customers may browse the website and add products to their cart without signing in.
* When proceeding to checkout, customers who are not authenticated must sign up or log in.
* Google sign-in must work.
* Preserve the cart during authentication.
* After login, return the customer to checkout with the original cart contents.
* Collect and validate all required delivery and contact information.
* Calculate product totals, discounts, delivery fees, and final payable amount correctly.
* Recalculate and validate prices on the backend rather than trusting browser-submitted totals.
* Check product availability and inventory before accepting the order.
* Prevent customers from accessing another customer's order details.
* Make checkout responsive and functional on mobile, tablet, and desktop.

An unauthenticated customer must not be able to bypass the required sign-up or login step by directly accessing checkout APIs.

## 8. Verify Razorpay Live Mode and UPI Payments

Audit the existing Razorpay integration and determine whether it is configured for Test Mode or Live Mode.

Verify the real configuration of the authorized merchant account, without exposing any secret credentials.

Check:

* Correct live Key ID and matching Key Secret configuration.
* Merchant account activation and eligibility for live payments.
* UPI and other supported payment methods being enabled.
* Secure server-side Razorpay order creation.
* Correct order ID, amount, and currency.
* Checkout initialization on desktop and mobile.
* Payment success, failure, cancellation, timeout, and retry handling.
* Server-side payment signature verification.
* Authenticated webhook processing.
* Payment status verification through a trusted server-side mechanism.
* Correct storage of payment references and transaction status in MongoDB.

**Important security and payment rules:**

1. Never mark an order as paid based only on a frontend success redirect.
2. Verify the Razorpay payment signature server-side.
3. Verify payment status through the appropriate trusted gateway mechanism.
4. Validate the amount, currency, gateway order ID, and associated application order.
5. Verify webhook signatures and process duplicate webhook deliveries idempotently.
6. Prevent failed or unverified payments from becoming paid orders.
7. Never expose the Key Secret, webhook secret, or private merchant credentials in frontend code, logs, or GitHub.
8. Do not claim that Live payments work simply because the live credentials exist.
9. If merchant activation, KYC, UPI enablement, or configuration requires action in the Razorpay Dashboard, report the exact blocker.

Use the authorized Razorpay merchant account only.

First run Test Mode scenarios. Then, if the account is active and the account owner approves, perform a controlled low-value live transaction to verify the actual production payment flow. Never initiate a charge without explicit authorization.

## 9. Fix Order Creation and Order Management

After a payment is successfully verified, ensure the order is recorded correctly in MongoDB.

Verify that every order contains the necessary information supported by the existing application:

* Unique order number.
* Authenticated customer reference.
* Product IDs and item details.
* Product names, SKUs, quantities, and purchase-price snapshots.
* Shipping and contact information.
* Subtotal, discount, shipping charge, and final total.
* Payment gateway order ID and payment ID.
* Payment and fulfilment status.
* Creation and modification timestamps.

Ensure that:

* Customers receive a correct order confirmation.
* Orders appear in customer order history.
* Authorized administrators can view orders in the admin dashboard.
* Inventory updates follow the existing stock-management rules.
* Duplicate clicks, retries, refreshes, and duplicate webhooks do not create duplicate paid orders.
* Failed payments do not appear as successful payments.
* A successful payment followed by a database failure can be reconciled instead of losing the order.

Test the entire order lifecycle, including pending payment, successful payment, failure, cancellation, and reconciliation.

## 10. Remove All Production Dependencies on Local Storage or Local Servers

This is a mandatory production requirement.

Search the project for:

* `localhost`
* `127.0.0.1`
* Local MongoDB connection strings.
* Hardcoded development API endpoints.
* Local product or order JSON files.
* Filesystem-based image uploads.
* Local image URLs and temporary paths.
* In-memory arrays used as permanent storage.
* Development-only authentication and payment callbacks.

Investigate each result and determine whether it is a legitimate development configuration or a production defect.

The deployed production system must use:

* Vercel-hosted frontend and compatible deployed backend/API routes.
* Cloud MongoDB for persistent application records.
* Persistent cloud image storage for product images.
* Secure production environment variables.
* Correct production authentication callbacks.
* Reachable HTTPS payment webhooks and return URLs.

No production-critical feature may require my MacBook or local development server to remain online.

Local development can remain available for coding and testing, but production data must never depend on it. Use separate Development, Preview, and Production configurations where appropriate.

## 11. Verify Vercel and GoDaddy Deployment

Inspect the actual integration and make necessary corrections.

Verify:

* Correct GitHub repository connected to Vercel.
* Correct production branch and deployment workflow.
* Valid build and framework configuration.
* Production environment variables are configured for the correct environment.
* Latest approved code has been deployed successfully.
* No build failures or critical runtime errors remain.
* Custom domain and SSL work correctly.
* Production APIs and serverless functions are reachable.
* Cloud database and image storage work in the deployed environment.
* No required production secret is missing.
* Deployment and runtime logs show no unresolved critical issue.

Do not overwrite existing environment variables or modify unrelated DNS records blindly. Preserve working settings and make targeted changes.

## 12. Perform a Security Audit

Review the application against the current OWASP Top 10 and relevant API security risks.

Inspect and address:

* Broken access control and admin authorization.
* Authentication/session security.
* Injection attacks, including NoSQL injection.
* Cross-site scripting.
* CSRF risks where applicable.
* Unsafe file uploads.
* Rate limiting for login and sensitive operations.
* Unauthorized order access.
* Payment verification vulnerabilities.
* Exposed secrets and sensitive error messages.
* Insecure dependency or deployment configurations.

Validate all untrusted inputs server-side. Use proper authorization checks on product, user, order, and payment APIs.

Do not log passwords, secret keys, complete connection strings, or unnecessary sensitive payment information.

## 13. Mandatory Production Test Plan

Run appropriate automated tests and live integration checks. Do not mark a test as passed unless it has actually been executed.

### Test A — Product Publishing

1. Create a test product from the admin dashboard.
2. Upload multiple product images.
3. Save and publish the product.
4. Verify the record in cloud MongoDB.
5. Verify the image files in persistent cloud storage.
6. Open the live storefront and confirm the correct product appears.
7. Edit product details, price, inventory, and image.
8. Confirm updates persist after refresh and redeployment.
9. Unpublish the product and confirm it is no longer publicly available.

### Test B — Domain and Cloud Storage

1. Open `https://mitrends.co.in`.
2. Verify the SSL certificate and redirect behaviour.
3. Inspect public links and canonical URLs for unwanted Vercel URLs.
4. Verify the production API endpoints.
5. Confirm product records and images are loaded from cloud services.
6. Confirm the application continues functioning without the local development server.
7. Recheck persistence after a Vercel deployment.

### Test C — Google Authentication

1. Register or sign in through Google.
2. Verify the production OAuth callback.
3. Test refresh, session persistence, and logout.
4. Attempt checkout while logged out.
5. Verify that sign-up or login is required.
6. Verify that the cart remains intact after login.

### Test D — Checkout

1. Add an available product to the cart.
2. Log in and enter valid shipping details.
3. Check product quantities, prices, discounts, and delivery charges.
4. Test insufficient inventory and invalid data.
5. Confirm that the server validates the final amount and stock.

### Test E — Razorpay

1. Test payment success in Test Mode.
2. Test failure, cancellation, and retry scenarios.
3. Test invalid payment signatures.
4. Test duplicate webhook delivery.
5. Verify that unpaid orders are not marked as paid.
6. If authorized and technically ready, make a controlled Live Mode payment.
7. Verify the transaction in the Razorpay Dashboard and application database.
8. Verify that the customer and administrator can see the resulting order.

### Test F — Full End-to-End Purchase

Execute this exact workflow:

**Admin publishes a product → Customer opens mitrends.co.in → Adds the product to the cart → Signs in using Google → Completes checkout → Selects an enabled UPI/Razorpay payment method → Payment is verified → Order is saved in cloud MongoDB → Customer sees confirmation → Administrator sees the order.**

For each step, record the actual outcome and evidence.

## 14. Fix, Deploy and Re-Test

Follow this implementation sequence:

1. Inspect the codebase and map the existing architecture.
2. Identify confirmed issues and root causes.
3. Fix product persistence and cloud image uploads.
4. Fix frontend product fetching and publishing.
5. Fix domain, DNS-related configuration, redirects, and production URLs.
6. Fix Google authentication and checkout restrictions.
7. Fix Razorpay order creation, payment verification, and webhooks.
8. Validate production environment variables without exposing secrets.
9. Run tests, linting, and production build checks.
10. Back up production data and establish a rollback point before risky changes.
11. Deploy through the existing GitHub/Vercel workflow.
12. Verify the deployed website and re-run end-to-end tests.

Do not delete existing production data, rewrite the whole application unnecessarily, or remove working features without evidence and authorization.

If a task requires access to GoDaddy, Vercel, MongoDB Atlas, Google Cloud Console, or Razorpay that you do not have, complete the code-level tasks that you can and report the exact external action required. Never claim to have changed a dashboard or verified a payment when you have not.

## 15. Final Report — Mandatory

After completing the audit and implementation, return a report with the following sections.

**A. Issues Found:** Exact problem, root cause, and severity.

**B. Fixes Implemented:** Files modified, APIs corrected, database changes, image storage changes, authentication fixes, checkout changes, and payment fixes.

**C. Domain and Deployment:** Custom domain status, SSL status, Vercel deployment result, GoDaddy DNS findings, and production API status.

**D. Cloud Persistence:** Confirmed database, image-storage configuration, product persistence results, and remaining issues.

**E. End-to-End Test Results:** Mark each test as PASS, FAIL, BLOCKED, or NOT TESTED. Include actual evidence such as HTTP responses, sanitized logs, test output, database verification, or gateway dashboard results.

**F. Payment Status:** Google authentication result, checkout result, Razorpay Test Mode result, Razorpay Live Mode result, UPI availability, payment verification, order creation, and admin order visibility.

**G. Remaining Actions:** List only unresolved problems or the exact actions that require my account-owner approval or external dashboard access.

Never include API secrets, passwords, private keys, or database connection-string credentials in the report.

## FINAL ACCEPTANCE CRITERIA

The website is ready for live customers only when the following requirements are verified:

* All admin product creation and editing operations persist in cloud MongoDB.
* Product images are stored in persistent cloud image storage.
* Product publishing and frontend fetching work correctly.
* No production data or operation depends on my local computer or local server.
* `https://mitrends.co.in` works with valid HTTPS and consistent redirects.
* Google authentication works on the production domain.
* Customers must sign up or log in before checkout.
* Razorpay payment orders are created securely and payments are verified server-side.
* UPI availability is confirmed for the actual merchant account.
* Successful payments create consistent cloud orders.
* Failed or unverified payments cannot be marked as paid.
* Customers and authorized administrators can access their respective order information.
* The application builds and deploys successfully.
* All unresolved account, configuration, or deployment blockers are reported transparently.

**Execute this as a real engineering audit and implementation task, not just a code review. Fix the actual problems, deploy the approved changes, verify the live workflow, and provide evidence for every claimed success. My final goal is to launch MI Trends as a stable, secure, fully cloud-hosted e-commerce website ready for real customers.**
