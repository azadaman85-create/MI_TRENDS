# Deploying MI TRENDS to Vercel

Everything here is reproducible from this repository. Nothing in production depends on a
local machine: the database is MongoDB Atlas, product images are stored in MongoDB and
served over HTTPS, and there are no filesystem writes.

## Before you start

Have the environment values to hand. They are **not** in this repository — secrets never
are. Keep your own copy (the ignored `.env.vercel-production` file is the usual place).

---

## 1. Import the repository

1. **vercel.com/new** → **Import Git Repository**
2. Choose `azadaman85-create/MI_TRENDS`
3. Framework preset: **Next.js** — detected automatically
4. Root directory: leave as is
5. Build and output settings: leave as is. The defaults are correct.

**Do not deploy yet.** Add the environment variables on this same screen so the first
build is correct — `NEXT_PUBLIC_*` values are compiled into the browser bundle at build
time, and a build without them produces a site that needs rebuilding anyway.

## 2. Environment variables

Sixteen, all on the **Production** environment.

The `Type` column matters. Vercel refuses to save a `NEXT_PUBLIC_` variable as Secret,
because those are compiled into the browser bundle and are public by definition.

| Key | Type | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Config | `https://mitrends.co.in`, no trailing slash. Drives canonical URLs, the sitemap, email links and the canonical-host redirect. |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Config | `rzp_live_…` for production. The prefix *is* the mode. |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Config | Must match a client whose authorised JavaScript origin is the production domain. |
| `RAZORPAY_KEY_SECRET` | Secret | Must pair with the key ID above. A live key with a test secret fails with 401. |
| `RAZORPAY_WEBHOOK_SECRET` | Secret | The secret *you chose* in the Razorpay dashboard, not the API key secret. |
| `MONGODB_URI` | Secret | Atlas connection string. |
| `MONGODB_DB_NAME` | Config | `mitrends` |
| `ADMIN_EMAIL` | Config | Panel sign-in. |
| `ADMIN_NAME` | Config | Shown in the activity log. |
| `ADMIN_PASSWORD_SALT` | Secret | |
| `ADMIN_PASSWORD_HASH` | Secret | scrypt digest. The password itself is never stored. |
| `ADMIN_SESSION_SECRET` | Secret | Rotating it signs every admin out. |
| `CUSTOMER_SESSION_SECRET` | Secret | Rotating it signs every customer out. |
| `SMTP_USER` | Config | Gmail address. |
| `SMTP_PASSWORD` | Secret | A 16-character Gmail **App Password**, spaces removed — not the account password. |
| `MAIL_FROM_NAME` | Config | `MI TRENDS` |

Vercel's **Import .env** button accepts the whole file at once, which is quicker and
avoids typos.

## 3. Deploy

Click **Deploy**. About a minute.

## 4. Attach the domain

1. **Settings → Domains → Add**
2. `mitrends.co.in`
3. Add `www.mitrends.co.in` as well and choose **Redirect to mitrends.co.in**

### DNS at GoDaddy

| Record | Name | Value |
|---|---|---|
| A | `@` | as Vercel shows (currently `216.198.79.1`) |
| CNAME | `www` | `cname.vercel-dns.com` |

Point `www` at `cname.vercel-dns.com`, **not** at the apex. Pointing it at the apex
routes traffic but leaves Vercel unable to issue a certificate for that hostname, so
`www` fails with an SSL error while appearing to be configured.

Leave any MX and TXT records alone.

## 5. Register the Razorpay webhook

Razorpay Dashboard in **Live Mode** → Settings → Webhooks → Add New:

- URL `https://<your-domain>/api/webhooks/razorpay`
- Active event: **`payment.captured`** only
- Secret: the same string as `RAZORPAY_WEBHOOK_SECRET`

Without this, a customer who closes the tab straight after paying leaves a charged order
stuck in `awaiting_payment`.

## 6. Verify

Check these rather than assuming:

```
curl -I  https://<domain>/                 # 200
curl -sI http://<domain>/                  # 308 to https
curl -s  https://<domain>/api/products     # JSON, not HTML
curl -I  https://www.<domain>/             # valid certificate
```

Then in the panel: **Settings → Account → Send a test email**. It reports the real SMTP
error if the App Password is wrong.

---

## Notes that save time

**One lockfile only.** This project uses npm and ships `package-lock.json`. A second
lockfile (`bun.lock`, `yarn.lock`, `pnpm-lock.yaml`) makes Vercel's package-manager
detection ambiguous, and a stale one installs the wrong dependency set — which looks
like a mysterious build failure rather than a lockfile problem. If you ever run `bun
install` or `yarn` here, delete the lockfile it creates.

**The generated `*.vercel.app` URL cannot be removed.** Vercel assigns one to every
project permanently. The firewall redirects any non-canonical production hostname to
`NEXT_PUBLIC_SITE_URL`, and `robots.txt` returns `Disallow: /` on those hosts, so neither
customers nor search engines use them. Preview deployments are deliberately exempt —
they live on `*.vercel.app` by design.

**Deleting the Vercel project does not delete your data.** Products, orders, customers,
banners and images are in MongoDB Atlas, which is a separate service. Re-importing the
repository and re-adding the variables brings everything back.

**Back up before risky changes:**

```
npx tsx --env-file=.env.local scripts/backup.ts
```

See `ADMIN.md` for the restore procedure.
