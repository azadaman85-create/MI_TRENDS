import type { NextConfig } from "next";

/**
 * CSP uses 'unsafe-inline' for scripts/styles because Next.js injects inline
 * bootstrap scripts and this app doesn't yet thread a per-request nonce through
 * (that's the stronger next step — see docs/app/guides/content-security-policy).
 * Everything else here is a real restriction: no inline event handlers execute
 * from a different origin, no foreign page can frame this site, no plugin
 * objects, no form posting to a third-party domain.
 */
// React's dev-mode debugging (stack reconstruction, Fast Refresh) calls eval();
// production never does, so 'unsafe-eval' is scoped to development only.
const isDev = process.env.NODE_ENV !== "production";

const CSP_DIRECTIVES = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://checkout.razorpay.com https://accounts.google.com https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://*.googleusercontent.com https://*.razorpay.com",
  "font-src 'self' data:",
  "connect-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://lumberjack.razorpay.com https://accounts.google.com https://www.googleapis.com",
  "frame-src https://api.razorpay.com https://checkout.razorpay.com https://accounts.google.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP_DIRECTIVES },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // "same-origin-allow-popups" (not the stricter "same-origin") so the Google
  // sign-in popup and Razorpay's checkout popup can still talk back to this tab.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), usb=(), payment=(self)",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
