# MI TRENDS — FULL WEBSITE BUG FIX & E-COMMERCE FUNCTIONALITY PROMPT

You are working on my **MI TRENDS e-commerce website**. I need you to perform a complete audit, identify the root causes, and implement production-ready fixes.

Do **not** redesign the website unnecessarily. Preserve the existing branding, UI/UX, components, content, functionality, typography, product layout, colors, and overall visual identity unless a change is required to fix a bug.

---

## 1. FIX MOBILE, TABLET & ZOOM-RELATED LAYOUT GLITCHES

The website currently has serious responsive-layout issues on:

* Android mobile phones
* iPhones
* Tablets
* Different browser zoom levels
* Mobile browser zoom in / zoom out
* Desktop browser resizing

### Current problems

When I:

* Zoom out
* Zoom in
* Zoom out again
* Rotate the device
* Change browser width
* Open the website on different mobile/tablet resolutions

the layout sometimes completely changes incorrectly.

Examples of issues:

* The website becomes very small instead of adapting to the viewport.
* Content remains compressed in a small area.
* Blank space/panels appear on the side.
* Side panel/container becomes blank.
* Sections do not use the available screen width.
* Some components move outside the viewport.
* Horizontal overflow appears.
* Header/navigation breaks.
* Product grids become incorrectly sized.
* Buttons/text/images become too small.
* Containers retain desktop dimensions on mobile.
* After zooming in and then zooming out, the page does not return to the correct responsive layout.
* Some sections behave differently depending on the browser zoom level.
* Tablet layout is also inconsistent.

### Required behavior

The website must use the **actual viewport dimensions** and responsive breakpoints correctly.

The layout must automatically adapt to:

* Small mobile
* Large mobile
* iPhone
* Android
* Small tablet
* Large tablet
* Laptop
* Desktop
* Large desktop

When browser zoom changes:

### Zoom OUT

The page should continue to use the responsive layout appropriate for the current viewport.

It must NOT:

* shrink into a tiny fixed-width page
* create blank side panels
* break containers
* create unexpected horizontal scrolling
* switch into an incorrect layout

### Zoom IN

The browser's normal zoom behavior should work naturally.

The page should remain usable and responsive.

### Zoom OUT again

The layout must automatically return to the correct responsive state without leaving:

* broken widths
* blank areas
* displaced content
* incorrect grids
* oversized containers
* tiny content

---

## 2. PERFORM A COMPLETE RESPONSIVE AUDIT

Inspect the entire website:

### Frontend

Check every page and component, including:

* Home
* Shop
* Product listing
* Product details
* Cart
* Checkout
* Login
* Sign Up
* Account/Profile
* Orders
* Order details
* Search
* Category pages
* Product filters
* Navigation
* Header
* Footer
* Modals
* Drawers
* Sidebars
* Forms
* Popups
* Admin-related frontend components where applicable

### Backend/Admin UI

Also check responsive behavior for:

* Admin dashboard
* Product management
* Order management
* Customer management
* Reports
* Tables
* Forms
* Side panels
* Modal dialogs
* Navigation/sidebar

---

## 3. IDENTIFY AND FIX ROOT CAUSES

Do not only patch individual pages.

Find the actual technical reason for the problem.

Audit for:

* Fixed widths
* `width: 100vw` causing overflow
* Incorrect `min-width`
* Incorrect `max-width`
* Hardcoded pixel dimensions
* Fixed desktop containers
* Improper CSS breakpoints
* Incorrect flexbox behavior
* Incorrect grid definitions
* `position: absolute`
* `position: fixed`
* Transform-based scaling
* Negative margins
* Overflow problems
* Nested containers with conflicting widths
* Incorrect viewport calculations
* JavaScript viewport calculations
* Resize event bugs
* Zoom detection logic
* CSS media-query conflicts
* Component-level responsive overrides
* Horizontal scrolling
* Sidebar width conflicts
* Drawer width conflicts
* Image sizing issues
* Tables overflowing
* Parent containers restricting child width
* `100vw` vs `100%` problems
* Improper use of `vh`, `vw`, `%`, `rem`, and `clamp()`
* Desktop styles leaking into mobile
* Mobile styles leaking into tablet/desktop
* Hydration/layout mismatch if React/Next.js is being used
* SSR vs client-side viewport detection issues

Where appropriate, prefer:

```css
width: 100%;
max-width: 100%;
min-width: 0;
box-sizing: border-box;
overflow-x: hidden;
```

and responsive CSS rather than hardcoded dimensions.

Do not blindly add `overflow-x: hidden` everywhere. Fix the actual overflow source first.

---

## 4. RESPONSIVE DESIGN REQUIREMENTS

Use a robust responsive system.

The design should gracefully adapt instead of relying on one or two breakpoints.

Check at minimum:

### Mobile

* 320px
* 360px
* 375px
* 390px
* 414px
* 430px
* 480px

### Tablet

* 600px
* 768px
* 820px
* 834px
* 1024px
* 1180px

### Desktop

* 1280px
* 1366px
* 1440px
* 1600px
* 1920px

Also test landscape orientations.

Do not create unnecessary device-specific hacks.

Use reusable responsive components and breakpoints.

---

# 5. FIX CUSTOMER SIGN-IN / SIGN-UP ERRORS

There is currently an issue with the **New Customer Sign Up** flow.

When a new customer attempts to register:

* Error appears
* Sign Up does not complete
* Customer may not be created
* Sign In does not work correctly

Perform a complete audit of the authentication system.

Check:

* Sign Up form
* Sign In form
* Frontend validation
* Backend validation
* API requests
* API responses
* Authentication middleware
* Database connection
* MongoDB schema/model
* Password handling
* Session/token handling
* Cookies
* JWT if used
* Error handling
* Duplicate email handling
* Duplicate phone handling
* Required fields
* Form submission
* Loading states
* Authentication state persistence

Find the root cause and fix it.

Do not hide errors just to make the UI appear successful.

Return meaningful user-friendly error messages.

---

# 6. MONGODB CUSTOMER ACCOUNT SYSTEM

Use **MongoDB** as the customer database.

After successful customer registration, store the necessary customer information in MongoDB.

Customer record should support fields such as:

```text
_id
firstName
lastName
email
phone
passwordHash
createdAt
updatedAt
isActive
```

Add any other fields required by the existing website.

### IMPORTANT SECURITY REQUIREMENT

**Never store the customer's password in plain text.**

Do NOT store:

```text
password: "MyPassword123"
```

Instead store a secure password hash using a modern password hashing algorithm such as:

* Argon2id
* bcrypt

The login system must verify the entered password against the stored password hash.

---

# 7. CUSTOMER LOGIN

Customers must be able to log in using their registered:

* Email/Gmail
* Password

The flow should be:

```text
Customer enters email
        ↓
Backend finds customer in MongoDB
        ↓
Password is securely verified against passwordHash
        ↓
Authentication succeeds
        ↓
Secure session/JWT/cookie is created
        ↓
Customer is logged in
```

The authentication state must remain available when the customer navigates through:

* Home
* Shop
* Product pages
* Cart
* Checkout
* Account
* Orders

Do not rely only on frontend state for authentication.

Authentication must be verified on the server.

---

# 8. CUSTOMER ACCOUNT & ORDER FLOW

After login, the customer should be able to:

* View profile
* Update profile
* Add products to cart
* Proceed to checkout
* Place an order
* View order history
* View order details
* See order status

Each order should be securely associated with the authenticated customer.

Example:

```text
Customer
   ↓
MongoDB Customer ID
   ↓
Order
   ↓
Customer's order history
```

A customer must only be able to access their own account and orders.

Prevent IDOR / unauthorized order access.

---

# 9. CASH ON DELIVERY (COD)

Add/verify **Cash on Delivery** as a payment option.

For COD:

### Customer should NOT pay anything upfront.

The checkout flow must be:

```text
Add to Cart
      ↓
Checkout
      ↓
Select Cash on Delivery
      ↓
Place Order
      ↓
Order Confirmed
      ↓
Payment Due = 0 upfront
      ↓
Customer pays when order is delivered
```

Do not redirect the customer to an online payment gateway when COD is selected.

Do not charge any upfront payment for COD.

The order should clearly display:

```text
Payment Method: Cash on Delivery
Payment Status: Pending / Unpaid
Amount Paid: ₹0
Amount Due on Delivery: ₹X
```

The exact labels should match the existing MI TRENDS UI.

The admin should be able to identify COD orders easily.

---

# 10. ORDER DATABASE STRUCTURE

Ensure orders contain the required information, such as:

```text
orderId
customerId
customer details
items
productId
product name
quantity
price
subtotal
shipping
discount
totalAmount
paymentMethod
paymentStatus
orderStatus
shippingAddress
billingAddress
createdAt
updatedAt
```

For COD:

```text
paymentMethod = "COD"
amountPaid = 0
paymentStatus = "PENDING"
```

Do not mark COD orders as paid before delivery.

---

# 11. SECURITY REQUIREMENTS

Implement the authentication and checkout system securely.

Follow modern application-security practices.

At minimum:

* Validate all inputs server-side
* Sanitize user-controlled data where appropriate
* Prevent SQL/NoSQL injection
* Prevent XSS
* Prevent CSRF where applicable
* Use secure authentication tokens/sessions
* Use secure cookies where applicable
* Do not expose sensitive information in API responses
* Never return password hashes to the frontend
* Never store plaintext passwords
* Protect admin routes
* Protect customer routes
* Verify ownership before returning customer/order data
* Rate-limit authentication endpoints where appropriate
* Do not hardcode secrets
* Store MongoDB URI and authentication secrets in environment variables
* Never commit `.env` files or secrets to Git

Example environment variables:

```env
MONGODB_URI=
JWT_SECRET=
SESSION_SECRET=
```

Use the security architecture appropriate for the existing project stack.

---

# 12. ERROR HANDLING

Fix all current authentication errors and improve error handling.

The frontend should show useful messages such as:

```text
Invalid email or password.
Email address is already registered.
Phone number is already registered.
Please enter a valid email address.
Password does not meet the required security requirements.
Unable to create account. Please try again.
Unable to connect to the server.
```

Do not expose:

* MongoDB errors
* stack traces
* database details
* secret values
* internal server implementation details

to customers.

---

# 13. CROSS-BROWSER TESTING

Test the website across:

* Chrome Android
* Safari iPhone
* Chrome iPhone where applicable
* Safari iPad
* Chrome tablet
* Desktop Chrome
* Desktop Safari
* Edge

Test:

* Normal zoom
* Zoom in
* Zoom out
* Repeated zoom changes
* Screen rotation
* Browser resize
* Different viewport widths/heights

---

# 14. FUNCTIONAL TESTING

After making changes, test at least:

### Registration

```text
New customer
→ Fill form
→ Submit
→ Account created
→ Customer stored in MongoDB
→ Password stored only as secure hash
→ User logged in or redirected to login
```

### Login

```text
Existing customer
→ Enter email
→ Enter password
→ Authenticate
→ Login succeeds
→ Customer account opens
```

### Invalid Login

```text
Wrong email/password
→ Login rejected
→ Friendly error shown
```

### COD

```text
Product
→ Cart
→ Checkout
→ Cash on Delivery
→ Place Order
→ No upfront payment
→ Order created
→ Payment status = Pending
→ Amount Paid = 0
```

### Responsive

```text
Mobile
→ Zoom in
→ Zoom out
→ Zoom out again
→ Layout remains correct

Tablet
→ Zoom in
→ Zoom out
→ Layout remains correct
```

---

# 15. CODE QUALITY

While fixing the issues:

* Reuse existing components
* Avoid duplicate code
* Keep frontend and backend responsibilities separated
* Keep API responses consistent
* Add proper validation
* Add proper loading states
* Add proper empty states
* Add proper error states
* Keep the code maintainable
* Do not introduce unnecessary dependencies
* Do not remove existing working functionality

---

# 16. GIT REQUIREMENTS

After completing and testing all fixes:

1. Review all changed files.
2. Remove debugging code and console logs that are no longer required.
3. Confirm there are no secrets in the repository.
4. Confirm `.env` is ignored by Git.
5. Run the project's available lint/build/test commands.
6. Fix any errors found.
7. Review the Git diff.
8. Commit the changes with a clear commit message.

Suggested commit message:

```text
fix responsive layout authentication mongodb and cod checkout
```

Then push the final changes to the existing Git repository.

Repository:

```text
https://github.com/azadaman85-create/MI
```

Do not force-push or overwrite unrelated existing work.

---

# 17. FINAL VERIFICATION REPORT

Before finishing, provide a concise report containing:

### Responsive Fix

* Root cause found
* Files/components changed
* Mobile status
* Tablet status
* Desktop status
* Zoom in/out status

### Authentication

* Sign Up fixed
* Sign In fixed
* MongoDB connection status
* Customer schema/model
* Password hashing method
* Authentication/session method

### Orders

* Customer-order relationship
* Customer order access protection

### COD

* COD enabled
* Upfront payment = ₹0
* Payment status behavior
* Admin visibility

### Security

* Validation
* Password security
* Secrets/environment variables
* Authentication protection

### Git

* Commit created
* Push completed
* Branch used
* Final commit hash

Most importantly, **do not simply tell me that the problems are fixed. Actually inspect the existing codebase, identify the root causes, implement the fixes, run the application, test the affected flows, and then report the actual results.**
