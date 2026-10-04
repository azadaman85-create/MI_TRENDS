# MI TRENDS — OWASP Top 10 Security Hardening

You are working on my existing e-commerce project:

**Project:** MI TRENDS
**GitHub Repository:** https://github.com/azadaman85-create/MI_TRENDS.git

Your task is to perform a **complete security audit and remediation of the entire codebase according to the OWASP Top 10**, while preserving all existing functionality, UI/UX, product data, checkout flow, order management, admin dashboard, APIs, and database behavior.

Do not rebuild the application unnecessarily.

Do not remove existing functionality simply to make security testing pass.

---

# 1. FIRST — AUDIT THE ENTIRE CODEBASE

Before making changes, inspect the complete project structure.

Identify:

* Frontend framework
* Backend framework
* Database
* ORM/query system
* Authentication system
* Authorization/RBAC
* API architecture
* Session management
* Cookies
* JWT/token implementation
* Payment integration
* Admin dashboard
* File upload functionality
* Environment configuration
* External APIs
* Third-party packages
* Build/deployment configuration

Search the entire repository for:

* Hardcoded passwords
* API keys
* Access tokens
* JWT secrets
* Database credentials
* Payment secrets
* Private keys
* OAuth secrets
* SMTP credentials
* Webhook secrets
* Sensitive customer information
* Debug credentials
* Insecure URLs
* Unsafe SQL queries
* Dangerous HTML rendering
* `eval`
* Unsafe shell execution
* Insecure redirects
* Disabled SSL/TLS verification
* Weak authentication
* Weak authorization

Create:

```text
SECURITY_AUDIT.md
```

Document all findings before and after remediation.

---

# 2. OWASP TOP 10 COMPLIANCE

Audit and address the current OWASP Top 10 categories.

## A01 — Broken Access Control

Verify that users cannot access resources belonging to other users.

Especially protect:

* Orders
* Customer profiles
* Addresses
* Cart
* Wishlist
* Payments
* Refunds
* Account settings
* Admin APIs
* Inventory
* Product management

Test for:

* IDOR
* Privilege escalation
* Horizontal privilege escalation
* Vertical privilege escalation
* Missing authorization
* Manipulated IDs
* Direct API access

Example:

```text
User A → /api/orders/1001
```

must not allow access if order `1001` belongs to User B.

Never rely on frontend restrictions for authorization.

Authorization must be enforced server-side.

---

# 3. A02 — Cryptographic Failures

Identify sensitive information and protect it appropriately.

Never store passwords in plaintext.

Use a strong password hashing algorithm supported by the framework, such as:

* Argon2id
* bcrypt
* scrypt

Do not use:

* MD5
* SHA-1
* Plain SHA-256 for password storage

Protect:

* Passwords
* Authentication tokens
* Session identifiers
* API credentials
* Payment secrets
* Personal information

Use HTTPS/TLS in production.

Set secure cookie attributes:

```text
HttpOnly
Secure
SameSite
```

where applicable.

Do not expose sensitive information in:

* URLs
* Query parameters
* Logs
* Error messages
* Browser local storage when avoidable
* Frontend source code

---

# 4. A03 — Injection Protection

Rigorously protect the entire application against injection vulnerabilities.

## SQL Injection

Never construct SQL queries by concatenating user input.

Bad:

```text
SELECT * FROM users WHERE email = '${email}'
```

Use:

* Parameterized queries
* Prepared statements
* ORM-safe queries

Validate database inputs using appropriate schemas.

Audit every database query.

Search the entire project for unsafe SQL construction.

Also check for:

* NoSQL injection
* LDAP injection if applicable
* Command injection
* Template injection
* Expression injection

---

# 5. XSS PROTECTION

Rigorously validate, sanitize, and escape all user-controlled content.

Protect:

* Product reviews
* Customer names
* Product descriptions
* Search queries
* Contact forms
* Addresses
* Coupon fields
* Admin-entered content
* Rich text
* URL parameters
* Query parameters
* API request bodies

Prevent:

* Stored XSS
* Reflected XSS
* DOM-based XSS

Never render untrusted HTML directly.

Audit all uses of mechanisms such as:

```text
innerHTML
dangerouslySetInnerHTML
raw HTML rendering
HTML injection
```

If HTML is intentionally supported, sanitize it with a strict allowlist.

Escape output according to context.

---

# 6. A04 — Insecure Design

Review business logic and security architecture.

Especially review:

### Checkout

Never trust client-side:

* Product price
* Quantity
* Discount
* Coupon
* Tax
* Shipping cost
* Grand total

Recalculate all financial values server-side.

### Orders

Validate:

```text
User
Order ownership
Product availability
Quantity
Price
Discount
Tax
Shipping
Payment
Order status
```

server-side.

Prevent:

* Duplicate orders
* Order manipulation
* Coupon abuse
* Price manipulation
* Unauthorized cancellation
* Unauthorized refunds

---

# 7. A05 — Security Misconfiguration

Audit configuration across the entire application.

Disable:

* Debug mode in production
* Verbose error pages
* Stack traces
* Default credentials
* Development endpoints
* Test accounts
* Unnecessary services

Configure appropriate security headers:

```text
Content-Security-Policy
Strict-Transport-Security
X-Content-Type-Options
Referrer-Policy
Permissions-Policy
X-Frame-Options
```

Do not blindly enable CSP rules that break legitimate application functionality.

Document any required exceptions.

---

# 8. A06 — Vulnerable and Outdated Components

Audit:

```text
package.json
package-lock.json
yarn.lock
pnpm-lock.yaml
requirements.txt
composer.json
Gemfile
Docker files
```

and any other dependency manifests actually used by the project.

Identify:

* Vulnerable dependencies
* Outdated dependencies
* Abandoned packages
* Packages with known CVEs

Upgrade dependencies where safely possible.

Do not perform destructive major-version upgrades without checking compatibility.

Run the appropriate security/dependency scanner for the project's technology stack.

Document:

```text
Dependency
Current version
Vulnerability
Severity
Recommended version
Status
```

---

# 9. A07 — Authentication Failures

Harden authentication.

Implement:

* Strong password policy
* Secure password hashing
* Rate limiting
* Brute-force protection
* Account lockout/cooldown where appropriate
* Secure session management
* Session expiration
* Session regeneration after login
* Secure logout
* Password reset protection

Do not reveal whether an email/account exists through authentication responses.

Example:

Avoid:

```text
Email does not exist.
```

Use a generic response where appropriate.

---

# 10. SECURE AUTHENTICATION TOKENS

Audit the authentication token implementation.

Use cryptographically secure random tokens.

Never generate security tokens using:

```text
Math.random()
timestamps
predictable IDs
user IDs
incrementing values
```

Authentication tokens must have sufficient entropy.

For JWT-based authentication:

* Use strong signing secrets/keys
* Validate signature
* Validate expiration
* Validate issuer/audience where applicable
* Reject malformed tokens
* Never accept `alg:none`
* Do not put sensitive information inside JWT payloads
* Rotate secrets/keys appropriately

Never hardcode JWT secrets.

Store secrets in environment variables or secure secret management.

---

# 11. SESSION SECURITY

Protect sessions against:

* Session fixation
* Session hijacking
* Session theft
* Session replay

Use:

```text
HttpOnly
Secure
SameSite
```

where appropriate.

Regenerate the session after authentication.

Invalidate sessions when appropriate after:

* Password change
* Security-sensitive account changes
* Logout

Do not store authentication secrets in unsafe browser storage unless there is a justified architecture requirement.

---

# 12. A08 — Software and Data Integrity Failures

Audit:

* Webhooks
* Payment callbacks
* External API responses
* File uploads
* Dependency installation
* CI/CD
* Build process

Payment webhooks must verify authenticity/signatures.

Never trust:

```text
payment_status=success
```

from the frontend.

Implement server-side verification.

Make webhook processing idempotent.

Protect against replayed webhook requests.

---

# 13. A09 — Security Logging & Monitoring

Implement secure security logging.

Record important events such as:

```text
LOGIN_SUCCESS
LOGIN_FAILED
PASSWORD_CHANGED
ACCOUNT_LOCKED
AUTHORIZATION_FAILED
ORDER_ACCESS_DENIED
ORDER_MODIFICATION_DENIED
PAYMENT_VERIFICATION_FAILED
WEBHOOK_REJECTED
ADMIN_ACTION
RATE_LIMIT_TRIGGERED
SUSPICIOUS_REQUEST
```

Include safe metadata:

```text
timestamp
event type
user ID where appropriate
request ID
endpoint
result
risk level
```

Never log:

* Passwords
* OTPs
* API keys
* JWT secrets
* Session tokens
* Credit card numbers
* CVV
* Payment credentials

---

# 14. A10 — SSRF PROTECTION

Audit all functionality that makes server-side HTTP requests.

Protect against SSRF.

Do not allow users to freely provide internal URLs to the server.

Block access to:

```text
localhost
127.0.0.1
0.0.0.0
private IP ranges
internal services
cloud metadata endpoints
```

where applicable.

Use URL allowlists for trusted external integrations.

Validate:

* Protocol
* Host
* Port
* Redirects

Do not blindly follow user-controlled redirects.

---

# 15. INPUT VALIDATION

Every API endpoint must validate input.

Use centralized validation schemas where supported.

Validate:

* Type
* Length
* Format
* Range
* Required fields
* Allowed values

Examples:

```text
Email
Phone
Name
Address
Postal code
Product ID
Quantity
Price
Coupon
Order ID
User ID
```

Reject unexpected fields where appropriate.

Never rely only on frontend validation.

---

# 16. OUTPUT ENCODING

All user-controlled data must be safely encoded before rendering.

Pay particular attention to:

* HTML
* JavaScript
* CSS
* URLs
* JSON
* SQL
* HTTP headers

Use context-specific encoding.

---

# 17. API SECURITY

Audit every API endpoint.

For each endpoint document:

```text
Authentication required?
Authorization required?
Allowed roles?
Input schema?
Rate limit?
CSRF requirement?
Sensitive response fields?
```

Protect APIs against:

* Unauthorized access
* Excessive requests
* Enumeration
* Mass assignment
* Parameter pollution
* Oversized requests
* Malformed requests

Do not expose internal implementation details.

---

# 18. MASS ASSIGNMENT PROTECTION

Never allow clients to update arbitrary database fields.

For example, a customer request must NOT be able to submit:

```json
{
  "name": "Customer",
  "role": "ADMIN",
  "isAdmin": true,
  "accountBalance": 999999
}
```

Explicitly define allowed fields for every update operation.

---

# 19. FILE UPLOAD SECURITY

If the project supports uploads, validate:

* File size
* MIME type
* File signature
* Extension
* Filename
* Image dimensions where applicable

Reject:

* Executable files
* Script files
* Dangerous file types

Store uploads safely.

Never execute uploaded files.

---

# 20. CORS

Review CORS configuration.

Do NOT use:

```text
Access-Control-Allow-Origin: *
```

for authenticated/private APIs unless there is a legitimate reason.

Allow only trusted origins.

Do not allow credentials with unrestricted origins.

---

# 21. CSRF

If authentication uses cookies/sessions, implement CSRF protection for state-changing operations.

Protect:

```text
POST
PUT
PATCH
DELETE
```

especially:

* Account changes
* Address changes
* Checkout
* Order cancellation
* Refunds
* Admin actions

---

# 22. ERROR HANDLING

Production errors must not expose:

* Stack traces
* SQL queries
* File paths
* Environment variables
* Database details
* API secrets
* Internal service names

Return safe generic errors.

Log detailed information securely on the server instead.

---

# 23. ENVIRONMENT VARIABLES & SECRET MANAGEMENT

Search the entire repository for hardcoded secrets.

Move all sensitive configuration to environment variables.

Examples:

```text
DATABASE_URL
JWT_SECRET
SESSION_SECRET
PAYMENT_SECRET
PAYMENT_WEBHOOK_SECRET
API_KEY
SMTP_PASSWORD
OAUTH_CLIENT_SECRET
```

Create/update:

```text
.env.example
```

with placeholder values only.

Example:

```text
JWT_SECRET=replace_with_secure_random_secret
PAYMENT_SECRET=replace_with_provider_secret
```

NEVER put real credentials in `.env.example`.

Update `.gitignore` to ensure sensitive files are not committed.

---

# 24. GIT SECRET AUDIT

Before committing, scan the entire repository and Git diff for secrets.

Check:

```text
Current files
Git diff
Git history where practical
Environment files
Configuration files
Documentation
Example files
```

If a real secret has previously been committed, do not assume deleting it is enough.

Report that the credential must be rotated/revoked.

---

# 25. DEPENDENCY SECURITY

Run the project's appropriate dependency/security audit.

Fix:

* Critical vulnerabilities
* High vulnerabilities

Address medium vulnerabilities where practical.

Do not introduce unnecessary dependencies just for security.

Prefer established, maintained libraries.

---

# 26. SECURITY TEST SUITE

Create automated security tests covering:

### Authentication

* Invalid login
* Brute-force attempts
* Expired token
* Invalid token
* Token tampering
* Session fixation
* Logout

### Authorization

* User accessing another user's order
* Customer accessing admin endpoint
* Unauthorized role escalation
* IDOR

### Injection

* SQL injection payloads
* XSS payloads
* Malformed input
* Unexpected fields

### Orders

* Price manipulation
* Quantity manipulation
* Coupon manipulation
* Unauthorized cancellation
* Unauthorized modification

### Payments

* Invalid callback
* Invalid signature
* Amount mismatch
* Duplicate webhook
* Replay attempt

### API

* Missing authentication
* Invalid authorization
* Rate-limit testing
* Oversized payload
* Invalid content type

### File uploads

* Malicious file
* Invalid MIME
* Oversized file
* Executable upload

---

# 27. OWASP SECURITY CHECKLIST

Create:

```text
OWASP_SECURITY_CHECKLIST.md
```

Use this structure:

```text
A01 Broken Access Control        PASS / FAIL
A02 Cryptographic Failures       PASS / FAIL
A03 Injection                    PASS / FAIL
A04 Insecure Design              PASS / FAIL
A05 Security Misconfiguration    PASS / FAIL
A06 Vulnerable Components        PASS / FAIL
A07 Authentication Failures      PASS / FAIL
A08 Integrity Failures           PASS / FAIL
A09 Logging & Monitoring         PASS / FAIL
A10 SSRF                         PASS / FAIL
```

For every FAIL, explain:

* Vulnerability
* Location
* Severity
* Impact
* Fix required
* Fix implemented/not implemented

Do not falsely mark an item PASS.

---

# 28. SECURITY DOCUMENTATION

Create/update:

```text
SECURITY.md
SECURITY_AUDIT.md
OWASP_SECURITY_CHECKLIST.md
SECURITY_TEST_REPORT.md
```

Document the final security architecture and remaining risks.

---

# 29. PRESERVE MI TRENDS

After security changes, verify that all existing major functionality still works:

* Homepage
* Product listing
* Product details
* Search
* Categories
* Cart
* Wishlist
* Checkout
* Customer registration
* Login
* Account
* Address management
* Orders
* Order tracking
* Payment
* Admin dashboard
* Product management
* Inventory
* Order management

Do not change the visual design unless required for security.

---

# 30. BUILD & TEST

Run the project's appropriate:

```text
Install
Lint
Type checking
Unit tests
Integration tests
Security tests
Production build
```

Fix all security-related errors.

Fix build errors caused by your changes.

Do not suppress errors just to make the build pass.

---

# 31. FINAL CODE REVIEW

Before committing, inspect:

```text
git status
git diff
```

Review every changed file.

Confirm:

* No secrets
* No debug code
* No temporary bypasses
* No disabled security checks
* No test credentials
* No hardcoded API keys
* No insecure authentication
* No unsafe SQL
* No obvious XSS vulnerabilities

---

# 32. GIT COMMIT AND PUSH

Once the audit, tests, build, and security checks pass:

Create a commit:

```text
security: harden application against OWASP Top 10
```

Push to:

```text
https://github.com/azadaman85-create/MI_TRENDS.git
```

Do not claim the push succeeded unless you actually verify it.

If GitHub authentication is unavailable, clearly report:

```text
Implementation completed locally.
Git commit completed.
GitHub push could not be completed because authentication/access is unavailable.
```

---

# 33. FINAL SECURITY REPORT

At the end, provide:

## OWASP Status

```text
A01 Broken Access Control:        PASS/FAIL
A02 Cryptographic Failures:       PASS/FAIL
A03 Injection:                    PASS/FAIL
A04 Insecure Design:              PASS/FAIL
A05 Misconfiguration:             PASS/FAIL
A06 Vulnerable Components:        PASS/FAIL
A07 Authentication:               PASS/FAIL
A08 Integrity Failures:           PASS/FAIL
A09 Logging & Monitoring:         PASS/FAIL
A10 SSRF:                         PASS/FAIL
```

## Security Improvements

List the actual protections implemented.

## Tests

Report:

* Tests run
* Tests passed
* Tests failed
* Remaining vulnerabilities

## Git

Report:

* Branch
* Commit hash
* Push status
* Repository

## IMPORTANT

Do NOT claim that MI TRENDS is "100% secure" or "OWASP certified."

OWASP compliance is a continuous security process.

Clearly identify any remaining risks and any protections that require infrastructure outside the application, such as:

* CDN/WAF
* DDoS protection
* Hosting firewall
* Database firewall
* Secrets manager
* Infrastructure monitoring
* Production penetration testing

The goal is to make the **entire MI TRENDS codebase follow secure coding practices aligned with the OWASP Top 10**, while preserving the existing e-commerce functionality.